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

    // For login, check if user exists
    if (purpose === 'login') {
      const userExists = await this.userRepository.phoneExists(phone);
      if (!userExists) {
        throw new BadRequestException('User not found. Please register first.');
      }
    }

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

    // Verify OTP
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

    // Find or create user
    let user = await this.userRepository.findByPhone(phone);
    const isNewUser = !user;

    if (isNewUser) {
      // Create new user
      user = await this.userRepository.create({
        phone,
        phone_verified: true,
        status: 'active',
        user_type: 'business_owner',
        language_preference: 'en',
      });
    } else {
      // Update phone verification and last login
      await this.userRepository.update(user.id, {
        phone_verified: true,
      });
      await this.userRepository.updateLastLogin(user.id);
    }

    // Generate tokens
    const tokens = await this.jwtTokenService.generateTokenPair(
      user.id,
      user.phone
    );

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

    // Generate new token pair
    const newTokens = await this.jwtTokenService.generateTokenPair(
      payload.sub,
      payload.phone
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

