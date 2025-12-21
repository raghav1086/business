import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSessionRepository } from './user-session.repository';
import { UserSession } from '../entities/user-session.entity';

describe('UserSessionRepository', () => {
  let repository: UserSessionRepository;
  let typeOrmRepository: Repository<UserSession>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSessionRepository,
        {
          provide: getRepositoryToken(UserSession),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<UserSessionRepository>(UserSessionRepository);
    typeOrmRepository = module.get<Repository<UserSession>>(
      getRepositoryToken(UserSession)
    );
  });

  describe('findByUserId', () => {
    it('should find all active sessions for user', async () => {
      const sessions = [mockSession];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(sessions);

      const result = await repository.findByUserId('user-1');

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { user_id: 'user-1', is_active: true },
        order: { last_active_at: 'DESC' },
      });
      expect(result).toEqual(sessions);
    });
  });

  describe('deactivateSession', () => {
    it('should deactivate session', async () => {
      jest.spyOn(typeOrmRepository, 'update').mockResolvedValue(undefined as any);

      await repository.deactivateSession('session-1');

      expect(typeOrmRepository.update).toHaveBeenCalledWith('session-1', {
        is_active: false,
      });
    });
  });
});

