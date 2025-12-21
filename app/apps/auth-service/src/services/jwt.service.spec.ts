import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtTokenService } from './jwt.service';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RefreshToken } from '../entities/refresh-token.entity';

describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let jwtService: JwtService;
  let refreshTokenRepository: RefreshTokenRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtTokenService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
              return defaultValue;
            }),
          },
        },
        {
          provide: RefreshTokenRepository,
          useValue: {
            create: jest.fn(),
            findByTokenHash: jest.fn(),
            revokeToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JwtTokenService>(JwtTokenService);
    jwtService = module.get<JwtService>(JwtService);
    refreshTokenRepository = module.get<RefreshTokenRepository>(
      RefreshTokenRepository
    );
  });

  describe('generateAccessToken', () => {
    it('should generate access token', async () => {
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('access-token');

      const result = await service.generateAccessToken('user-1', '9876543210');

      expect(result).toBe('access-token');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: 'user-1',
          phone: '9876543210',
          type: 'access',
        },
        expect.objectContaining({
          expiresIn: '15m',
        })
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token', async () => {
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('refresh-token');

      const result = await service.generateRefreshToken('user-1', '9876543210');

      expect(result).toBe('refresh-token');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: 'user-1',
          phone: '9876543210',
          type: 'refresh',
        },
        expect.objectContaining({
          expiresIn: '30d',
        })
      );
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both tokens', async () => {
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.generateTokenPair('user-1', '9876543210');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });
  });

  describe('storeRefreshToken', () => {
    it('should store refresh token', async () => {
      const mockToken = {
        id: 'token-1',
        user_id: 'user-1',
        token_hash: 'hashed',
      } as RefreshToken;

      jest.spyOn(refreshTokenRepository, 'create').mockResolvedValue(mockToken);

      const result = await service.storeRefreshToken(
        'user-1',
        'refresh-token',
        { device_name: 'iPhone' },
        '192.168.1.1'
      );

      expect(result).toBeDefined();
      expect(refreshTokenRepository.create).toHaveBeenCalled();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', async () => {
      const mockPayload = {
        sub: 'user-1',
        phone: '9876543210',
        type: 'refresh',
      };

      const mockStoredToken = {
        id: 'token-1',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        revoked_at: null,
      } as RefreshToken;

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest
        .spyOn(refreshTokenRepository, 'findByTokenHash')
        .mockResolvedValue(mockStoredToken);

      const result = await service.verifyRefreshToken('refresh-token');

      expect(result).toEqual(mockPayload);
    });

    it('should return null for revoked token', async () => {
      const mockPayload = {
        sub: 'user-1',
        phone: '9876543210',
        type: 'refresh',
      };

      const mockStoredToken = {
        id: 'token-1',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        revoked_at: new Date(), // Revoked
      } as RefreshToken;

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest
        .spyOn(refreshTokenRepository, 'findByTokenHash')
        .mockResolvedValue(mockStoredToken);

      const result = await service.verifyRefreshToken('refresh-token');

      expect(result).toBeNull();
    });
  });
});

