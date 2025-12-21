import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

describe('SmsService', () => {
  let service: SmsService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'NODE_ENV') return 'development';
              if (key === 'MSG91_API_KEY') return '';
              if (key === 'MSG91_SENDER_ID') return '';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('sendOtp', () => {
    it('should send OTP in development mode', async () => {
      const result = await service.sendOtp('9876543210', '123456');

      expect(result).toBe(true);
    });
  });

  describe('sendMessage', () => {
    it('should send message in development mode', async () => {
      const result = await service.sendMessage('9876543210', 'Test message');

      expect(result).toBe(true);
    });
  });
});

