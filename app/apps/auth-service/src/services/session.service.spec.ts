import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SessionService } from './session.service';
import { UserSessionRepository } from '../repositories/user-session.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { UserSession } from '../entities/user-session.entity';

describe('SessionService', () => {
  let service: SessionService;
  let userSessionRepository: UserSessionRepository;
  let refreshTokenRepository: RefreshTokenRepository;

  const mockSession: UserSession = {
    id: 'session-1',
    user_id: 'user-1',
    device_id: 'device-123',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  } as UserSession;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: UserSessionRepository,
          useValue: {
            findByUserId: jest.fn(),
            findByIdAndUserId: jest.fn(),
            deactivateSession: jest.fn(),
            deactivateAllUserSessions: jest.fn(),
          },
        },
        {
          provide: RefreshTokenRepository,
          useValue: {
            revokeAllUserTokens: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    userSessionRepository = module.get<UserSessionRepository>(
      UserSessionRepository
    );
    refreshTokenRepository = module.get<RefreshTokenRepository>(
      RefreshTokenRepository
    );
  });

  describe('getUserSessions', () => {
    it('should return all active sessions for user', async () => {
      const sessions = [mockSession];
      jest
        .spyOn(userSessionRepository, 'findByUserId')
        .mockResolvedValue(sessions);

      const result = await service.getUserSessions('user-1');

      expect(result).toEqual(sessions);
      expect(userSessionRepository.findByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('logoutSession', () => {
    it('should logout from specific session', async () => {
      jest
        .spyOn(userSessionRepository, 'findByIdAndUserId')
        .mockResolvedValue(mockSession);
      jest
        .spyOn(userSessionRepository, 'deactivateSession')
        .mockResolvedValue(undefined);

      await service.logoutSession('session-1', 'user-1');

      expect(userSessionRepository.deactivateSession).toHaveBeenCalledWith(
        'session-1'
      );
    });

    it('should throw NotFoundException if session not found', async () => {
      jest
        .spyOn(userSessionRepository, 'findByIdAndUserId')
        .mockResolvedValue(null);

      await expect(
        service.logoutSession('non-existent', 'user-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('logoutAllSessions', () => {
    it('should logout from all sessions and revoke tokens', async () => {
      jest
        .spyOn(userSessionRepository, 'deactivateAllUserSessions')
        .mockResolvedValue(undefined);
      jest
        .spyOn(refreshTokenRepository, 'revokeAllUserTokens')
        .mockResolvedValue(undefined);

      await service.logoutAllSessions('user-1');

      expect(userSessionRepository.deactivateAllUserSessions).toHaveBeenCalledWith(
        'user-1'
      );
      expect(refreshTokenRepository.revokeAllUserTokens).toHaveBeenCalledWith(
        'user-1'
      );
    });
  });
});

