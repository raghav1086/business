import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';
import { StorageService } from '../services/storage.service';
import { User } from '../entities/user.entity';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let storageService: StorageService;

  const mockUser: User = {
    id: 'user-1',
    phone: '9876543210',
    name: 'Test User',
    email: 'test@example.com',
    phone_verified: true,
    status: 'active',
    user_type: 'business_owner',
    language_preference: 'en',
    created_at: new Date(),
    updated_at: new Date(),
  } as User;

  const mockRequest = {
    user: {
      id: 'user-1',
      phone: '9876543210',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
            updateAvatar: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            uploadAvatar: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(require('../guards/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    storageService = module.get<StorageService>(StorageService);
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      jest.spyOn(userService, 'getProfile').mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockRequest as any);

      expect(result.id).toBe('user-1');
      expect(result.phone).toBe('9876543210');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };

      jest.spyOn(userService, 'updateProfile').mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(
        mockRequest as any,
        updateDto
      );

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar', async () => {
      const mockFile = {
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as any;

      const avatarUrl = 'https://example.com/avatar.jpg';

      jest.spyOn(storageService, 'uploadAvatar').mockResolvedValue(avatarUrl);
      jest.spyOn(userService, 'updateAvatar').mockResolvedValue({
        ...mockUser,
        avatar_url: avatarUrl,
      } as User);

      const result = await controller.uploadAvatar(mockRequest as any, mockFile);

      expect(result.avatar_url).toBe(avatarUrl);
    });
  });
});

