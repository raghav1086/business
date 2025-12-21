import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'UPLOAD_PATH') return './uploads';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  describe('uploadAvatar', () => {
    it('should upload avatar and return URL', async () => {
      const mockFile = {
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        buffer: Buffer.from('test'),
      } as any;

      const result = await service.uploadAvatar('user-1', mockFile);

      expect(result).toContain('avatars/user-1');
      expect(result).toContain('.jpg');
    });

    it('should throw error for non-image file', async () => {
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
      } as any;

      await expect(service.uploadAvatar('user-1', mockFile)).rejects.toThrow(
        'File must be an image'
      );
    });

    it('should throw error for file too large', async () => {
      const mockFile = {
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB
        buffer: Buffer.from('test'),
      } as any;

      await expect(service.uploadAvatar('user-1', mockFile)).rejects.toThrow(
        'File size must be less than 5MB'
      );
    });
  });
});

