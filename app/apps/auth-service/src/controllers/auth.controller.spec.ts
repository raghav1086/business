import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { User } from '../entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser: User = {
    id: 'user-1',
    phone: '9876543210',
    phone_verified: true,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            sendOtp: jest.fn(),
            verifyOtp: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  describe('sendOtp', () => {
    it('should send OTP', async () => {
      const mockResponse = {
        otp_id: 'otp-1',
        expires_in: 300,
        message: 'OTP sent successfully',
      };

      jest.spyOn(service, 'sendOtp').mockResolvedValue(mockResponse);

      const result = await controller.sendOtp({
        phone: '9876543210',
        purpose: 'login',
      });

      expect(result).toEqual(mockResponse);
      expect(service.sendOtp).toHaveBeenCalledWith({
        phone: '9876543210',
        purpose: 'login',
      });
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and return user with tokens', async () => {
      const mockResponse = {
        user: mockUser,
        tokens: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
        is_new_user: false,
      };

      jest.spyOn(service, 'verifyOtp').mockResolvedValue(mockResponse);

      const result = await controller.verifyOtp({
        phone: '9876543210',
        otp: '123456',
        otp_id: 'otp-1',
      });

      expect(result.user.id).toBe('user-1');
      expect(result.tokens.access_token).toBe('access-token');
      expect(result.is_new_user).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      jest.spyOn(service, 'refreshToken').mockResolvedValue(mockResponse);

      const result = await controller.refreshToken({
        refresh_token: 'old-refresh-token',
      });

      expect(result).toEqual(mockResponse);
      expect(service.refreshToken).toHaveBeenCalledWith('old-refresh-token');
    });
  });
});

