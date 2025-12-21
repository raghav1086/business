import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRepository } from '../repositories/user.repository';
import { OtpRequestRepository } from '../repositories/otp-request.repository';
import { OtpService } from './otp.service';
import { JwtTokenService } from './jwt.service';
import { SmsService } from './sms.service';
import { User } from '../entities/user.entity';
import { OtpRequest } from '../entities/otp-request.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: UserRepository;
  let otpService: OtpService;
  let jwtTokenService: JwtTokenService;
  let smsService: SmsService;

  const mockUser: User = {
    id: 'user-1',
    phone: '9876543210',
    phone_verified: true,
    status: 'active',
    user_type: 'business_owner',
    language_preference: 'en',
    created_at: new Date(),
    updated_at: new Date(),
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByPhone: jest.fn(),
            phoneExists: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateLastLogin: jest.fn(),
          },
        },
        {
          provide: OtpRequestRepository,
          useValue: {},
        },
        {
          provide: OtpService,
          useValue: {
            checkRateLimit: jest.fn(),
            createOtpRequest: jest.fn(),
            verifyOtpRequest: jest.fn(),
          },
        },
        {
          provide: JwtTokenService,
          useValue: {
            generateTokenPair: jest.fn(),
            storeRefreshToken: jest.fn(),
            verifyRefreshToken: jest.fn(),
            revokeRefreshToken: jest.fn(),
          },
        },
        {
          provide: SmsService,
          useValue: {
            sendOtp: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
    otpService = module.get<OtpService>(OtpService);
    jwtTokenService = module.get<JwtTokenService>(JwtTokenService);
    smsService = module.get<SmsService>(SmsService);
  });

  describe('sendOtp', () => {
    it('should send OTP successfully', async () => {
      const mockOtpRequest = {
        id: 'otp-1',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
      } as OtpRequest;

      jest.spyOn(otpService, 'checkRateLimit').mockResolvedValue(true);
      jest.spyOn(otpService, 'createOtpRequest').mockResolvedValue({
        otpRequest: mockOtpRequest,
        otp: '123456',
      });
      jest.spyOn(smsService, 'sendOtp').mockResolvedValue(true);

      const result = await service.sendOtp({
        phone: '9876543210',
        purpose: 'registration',
      });

      expect(result.otp_id).toBe('otp-1');
      expect(result.message).toBe('OTP sent successfully');
    });

    it('should throw HttpException if rate limit exceeded', async () => {
      jest.spyOn(otpService, 'checkRateLimit').mockResolvedValue(false);

      await expect(
        service.sendOtp({ phone: '9876543210', purpose: 'login' })
      ).rejects.toThrow(HttpException);
    });

    it('should throw BadRequestException if user not found for login', async () => {
      jest.spyOn(otpService, 'checkRateLimit').mockResolvedValue(true);
      jest.spyOn(userRepository, 'phoneExists').mockResolvedValue(false);

      await expect(
        service.sendOtp({ phone: '9876543210', purpose: 'login' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and create new user', async () => {
      const mockOtpRequest = {
        id: 'otp-1',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
      } as OtpRequest;

      jest.spyOn(otpService, 'verifyOtpRequest').mockResolvedValue({
        valid: true,
        expired: false,
        maxAttemptsExceeded: false,
      });
      jest.spyOn(userRepository, 'findByPhone').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockResolvedValue(mockUser);
      jest.spyOn(jwtTokenService, 'generateTokenPair').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      jest.spyOn(jwtTokenService, 'storeRefreshToken').mockResolvedValue(
        undefined as any
      );

      const result = await service.verifyOtp({
        phone: '9876543210',
        otp: '123456',
        otp_id: 'otp-1',
      });

      expect(result.is_new_user).toBe(true);
      expect(result.tokens.access_token).toBe('access-token');
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      jest.spyOn(otpService, 'verifyOtpRequest').mockResolvedValue({
        valid: false,
        expired: false,
        maxAttemptsExceeded: false,
      });

      await expect(
        service.verifyOtp({
          phone: '9876543210',
          otp: 'wrong-otp',
          otp_id: 'otp-1',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const mockPayload = {
        sub: 'user-1',
        phone: '9876543210',
        type: 'refresh',
      };

      jest
        .spyOn(jwtTokenService, 'verifyRefreshToken')
        .mockResolvedValue(mockPayload);
      jest.spyOn(jwtTokenService, 'generateTokenPair').mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      jest.spyOn(jwtTokenService, 'revokeRefreshToken').mockResolvedValue(
        undefined
      );
      jest.spyOn(jwtTokenService, 'storeRefreshToken').mockResolvedValue(
        undefined as any
      );

      const result = await service.refreshToken('old-refresh-token');

      expect(result.access_token).toBe('new-access-token');
      expect(result.refresh_token).toBe('new-refresh-token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jest.spyOn(jwtTokenService, 'verifyRefreshToken').mockResolvedValue(null);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});

