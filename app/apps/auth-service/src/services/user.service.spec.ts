import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { UpdateUserProfileDto } from '@business-app/shared/dto';

describe('UserService', () => {
  let service: UserService;
  let repository: UserRepository;

  const mockUser: User = {
    id: 'user-1',
    phone: '9876543210',
    name: 'Test User',
    email: 'test@example.com',
    phone_verified: true,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<UserRepository>(UserRepository);
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockUser);

      const result = await service.getProfile('user-1');

      expect(result).toEqual(mockUser);
      expect(repository.findById).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto: UpdateUserProfileDto = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const updatedUser = { ...mockUser, ...updateDto };

      jest.spyOn(repository, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'update').mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(result.email).toBe('updated@example.com');
      expect(repository.update).toHaveBeenCalledWith('user-1', updateDto);
    });
  });

  describe('updateAvatar', () => {
    it('should update avatar URL', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      const updatedUser = { ...mockUser, avatar_url: avatarUrl };

      jest.spyOn(repository, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'update').mockResolvedValue(updatedUser);

      const result = await service.updateAvatar('user-1', avatarUrl);

      expect(result.avatar_url).toBe(avatarUrl);
      expect(repository.update).toHaveBeenCalledWith('user-1', {
        avatar_url: avatarUrl,
      });
    });
  });
});

