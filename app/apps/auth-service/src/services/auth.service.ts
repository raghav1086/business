import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { OtpRequestRepository } from '../repositories/otp-request.repository';
import { OtpService } from './otp.service';
import { JwtTokenService } from './jwt.service';
import { SmsService } from './sms.service';
import { User } from '../entities/user.entity';
import { SendOtpDto, VerifyOtpDto } from '@business-app/shared/dto';

/**
 * Auth Service
 * 
 * Main authentication service that orchestrates OTP and JWT flows.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpRequestRepository: OtpRequestRepository,
    private readonly otpService: OtpService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly smsService: SmsService
  ) {}

  /**
   * Send OTP
   */
  async sendOtp(sendOtpDto: SendOtpDto): Promise<{
    otp_id: string;
    expires_in: number;
    message: string;
  }> {
    const { phone, purpose } = sendOtpDto;

    // Check rate limit
    const canSend = await this.otpService.checkRateLimit(phone, purpose);
    if (!canSend) {
      throw new HttpException(
        'Too many OTP requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Note: We allow OTP requests for login even if user doesn't exist.
    // The user will be automatically created during verifyOtp if they don't exist.
    // This enables seamless registration/login flow for new users.

    // Create OTP request
    const { otpRequest, otp } = await this.otpService.createOtpRequest(
      phone,
      purpose
    );

    // Send SMS
    await this.smsService.sendOtp(phone, otp);

    // Calculate expiry in seconds
    const expiresIn = Math.floor(
      (otpRequest.expires_at.getTime() - Date.now()) / 1000
    );

    return {
      otp_id: otpRequest.id,
      expires_in: expiresIn,
      message: 'OTP sent successfully',
    };
  }

  /**
   * Verify OTP and authenticate user
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
    user: User;
    tokens: { access_token: string; refresh_token: string };
    is_new_user: boolean;
  }> {
    const { phone, otp, otp_id, device_info } = verifyOtpDto;

    // Check for superadmin FIRST: phone 9175760649, OTP 760649 (last 6 digits)
    // Superadmin bypasses normal OTP verification
    const SUPERADMIN_PHONE = '9175760649';
    const SUPERADMIN_OTP = '760649';
    const isSuperadminLogin = phone === SUPERADMIN_PHONE && otp === SUPERADMIN_OTP;

    // For superadmin, skip OTP verification (they use hardcoded OTP)
    if (!isSuperadminLogin) {
      // Verify OTP for regular users
      const verification = await this.otpService.verifyOtpRequest(otp_id, otp);

      if (verification.maxAttemptsExceeded) {
        throw new BadRequestException(
          'Maximum attempts exceeded. Please request a new OTP.'
        );
      }

      if (verification.expired) {
        throw new BadRequestException('OTP has expired. Please request a new OTP.');
      }

      if (!verification.valid) {
        throw new BadRequestException('Invalid OTP. Please try again.');
      }
    }

    // Find or create user
    let user = await this.userRepository.findByPhone(phone);
    const isNewUser = !user;

    if (isNewUser) {
      // Create new user
      user = await this.userRepository.create({
        phone,
        phone_verified: true,
        status: 'active',
        user_type: isSuperadminLogin ? 'superadmin' : 'business_owner',
        is_superadmin: isSuperadminLogin,
        language_preference: 'en',
      });
    } else {
      // Update phone verification, last login, and superadmin status if needed
      const updateData: any = {
        phone_verified: true,
      };
      
      // Always set superadmin flag if this is a superadmin login
      if (isSuperadminLogin) {
        updateData.is_superadmin = true;
        updateData.user_type = 'superadmin';
      }
      
      await this.userRepository.update(user.id, updateData);
      await this.userRepository.updateLastLogin(user.id);
      
      // Always refresh user object to get latest data including is_superadmin
      const refreshedUser = await this.userRepository.findUserById(user.id);
      if (refreshedUser) {
        user = refreshedUser;
      }
    }

    // Ensure is_superadmin is set correctly (check both database value and login type)
    const finalIsSuperadmin = isSuperadminLogin || (user.is_superadmin === true);
    
    // Generate tokens with superadmin flag
    const tokens = await this.jwtTokenService.generateTokenPair(
      user.id,
      user.phone,
      finalIsSuperadmin
    );
    
    // Update user object to reflect final superadmin status
    if (finalIsSuperadmin && !user.is_superadmin) {
      user.is_superadmin = true;
    }

    // Store refresh token
    await this.jwtTokenService.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      device_info
    );

    return {
      user,
      tokens: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      },
      is_new_user: isNewUser,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    // Verify refresh token
    const payload = await this.jwtTokenService.verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate new token pair with same superadmin status
    const newTokens = await this.jwtTokenService.generateTokenPair(
      payload.sub,
      payload.phone,
      payload.is_superadmin || false
    );

    // Revoke old refresh token
    await this.jwtTokenService.revokeRefreshToken(refreshToken);

    // Store new refresh token
    await this.jwtTokenService.storeRefreshToken(
      payload.sub,
      newTokens.refreshToken
    );

    return {
      access_token: newTokens.accessToken,
      refresh_token: newTokens.refreshToken,
    };
  }
}

