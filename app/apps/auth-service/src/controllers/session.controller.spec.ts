import { Test, TestingModule } from '@nestjs/testing';
import { SessionController } from './session.controller';
import { SessionService } from '../services/session.service';
import { UserSession } from '../entities/user-session.entity';

describe('SessionController', () => {
  let controller: SessionController;
  let service: SessionService;

  const mockSession: UserSession = {
    id: 'session-1',
    user_id: 'user-1',
    device_id: 'device-123',
    device_name: 'iPhone 13',
    is_active: true,
    last_active_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  } as UserSession;

  const mockRequest = {
    user: {
      id: 'user-1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        {
          provide: SessionService,
          useValue: {
            getUserSessions: jest.fn(),
            logoutSession: jest.fn(),
            logoutAllSessions: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(require('../guards/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SessionController>(SessionController);
    service = module.get<SessionService>(SessionService);
  });

  describe('getSessions', () => {
    it('should return all sessions for user', async () => {
      const sessions = [mockSession];
      jest.spyOn(service, 'getUserSessions').mockResolvedValue(sessions);

      const result = await controller.getSessions(mockRequest as any);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('session-1');
    });
  });

  describe('logoutSession', () => {
    it('should logout from specific session', async () => {
      jest.spyOn(service, 'logoutSession').mockResolvedValue(undefined);

      await controller.logoutSession(mockRequest as any, 'session-1');

      expect(service.logoutSession).toHaveBeenCalledWith('session-1', 'user-1');
    });
  });

  describe('logoutAllSessions', () => {
    it('should logout from all sessions', async () => {
      jest.spyOn(service, 'logoutAllSessions').mockResolvedValue(undefined);

      await controller.logoutAllSessions(mockRequest as any);

      expect(service.logoutAllSessions).toHaveBeenCalledWith('user-1');
    });
  });
});

