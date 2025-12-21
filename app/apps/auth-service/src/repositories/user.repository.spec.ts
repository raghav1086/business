import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from './user.repository';
import { User } from '../entities/user.entity';

describe('UserRepository', () => {
  let repository: UserRepository;
  let typeOrmRepository: Repository<User>;

  const mockUser: User = {
    id: 'user-1',
    phone: '9876543210',
    phone_verified: true,
    name: 'Test User',
    status: 'active',
    user_type: 'business_owner',
    language_preference: 'en',
    created_at: new Date(),
    updated_at: new Date(),
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    typeOrmRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('findByPhone', () => {
    it('should find user by phone', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await repository.findByPhone('9876543210');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { phone: '9876543210', status: 'active' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findByPhone('9999999999');

      expect(result).toBeNull();
    });
  });

  describe('phoneExists', () => {
    it('should return true if phone exists', async () => {
      jest.spyOn(typeOrmRepository, 'count').mockResolvedValue(1);

      const result = await repository.phoneExists('9876543210');

      expect(result).toBe(true);
    });

    it('should return false if phone does not exist', async () => {
      jest.spyOn(typeOrmRepository, 'count').mockResolvedValue(0);

      const result = await repository.phoneExists('9999999999');

      expect(result).toBe(false);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      jest.spyOn(typeOrmRepository, 'update').mockResolvedValue(undefined as any);

      await repository.updateLastLogin('user-1');

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          last_login_at: expect.any(Date),
        })
      );
    });
  });
});

