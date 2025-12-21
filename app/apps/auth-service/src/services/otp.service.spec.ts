import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { OtpRequestRepository } from '../repositories/otp-request.repository';
import { OtpRequest } from '../entities/otp-request.entity';

describe('OtpService', () => {
  let service: OtpService;
  let repository: OtpRequestRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: OtpRequestRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            incrementAttempts: jest.fn(),
            markAsVerified: jest.fn(),
            countRecentRequests: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    repository = module.get<OtpRequestRepository>(OtpRequestRepository);
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = service.generateOtp();

      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate different OTPs', () => {
      const otp1 = service.generateOtp();
      const otp2 = service.generateOtp();

      // Very unlikely to be the same
      expect(otp1).not.toBe(otp2);
    });
  });

  describe('hashOtp', () => {
    it('should hash OTP', async () => {
      const otp = '123456';
      const hash = await service.hashOtp(otp);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(otp);
      expect(hash.length).toBeGreaterThan(20);
    });
  });

  describe('verifyOtp', () => {
    it('should verify correct OTP', async () => {
      const otp = '123456';
      const hash = await service.hashOtp(otp);

      const isValid = await service.verifyOtp(otp, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect OTP', async () => {
      const otp = '123456';
      const hash = await service.hashOtp(otp);

      const isValid = await service.verifyOtp('654321', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('createOtpRequest', () => {
    it('should create OTP request', async () => {
      const mockOtpRequest = {
        id: 'otp-1',
        phone: '9876543210',
        otp_hash: 'hashed',
        purpose: 'login',
        expires_at: new Date(),
        attempts: 0,
      } as OtpRequest;

      jest.spyOn(repository, 'create').mockResolvedValue(mockOtpRequest);

      const result = await service.createOtpRequest('9876543210', 'login');

      expect(result.otpRequest).toBeDefined();
      expect(result.otp).toHaveLength(6);
      expect(repository.create).toHaveBeenCalled();
    });
  });

  describe('verifyOtpRequest', () => {
    it('should verify valid OTP', async () => {
      const otp = '123456';
      const hash = await service.hashOtp(otp);
      const mockOtpRequest = {
        id: 'otp-1',
        otp_hash: hash,
        attempts: 0,
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
      } as OtpRequest;

      jest.spyOn(repository, 'findById').mockResolvedValue(mockOtpRequest);
      jest.spyOn(repository, 'markAsVerified').mockResolvedValue(undefined);

      const result = await service.verifyOtpRequest('otp-1', otp);

      expect(result.valid).toBe(true);
      expect(result.expired).toBe(false);
      expect(result.maxAttemptsExceeded).toBe(false);
      expect(repository.markAsVerified).toHaveBeenCalledWith('otp-1');
    });

    it('should reject expired OTP', async () => {
      const mockOtpRequest = {
        id: 'otp-1',
        otp_hash: 'hashed',
        attempts: 0,
        expires_at: new Date(Date.now() - 1000), // Expired
      } as OtpRequest;

      jest.spyOn(repository, 'findById').mockResolvedValue(mockOtpRequest);

      const result = await service.verifyOtpRequest('otp-1', '123456');

      expect(result.valid).toBe(false);
      expect(result.expired).toBe(true);
    });

    it('should reject if max attempts exceeded', async () => {
      const mockOtpRequest = {
        id: 'otp-1',
        otp_hash: 'hashed',
        attempts: 5, // Max attempts
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
      } as OtpRequest;

      jest.spyOn(repository, 'findById').mockResolvedValue(mockOtpRequest);

      const result = await service.verifyOtpRequest('otp-1', '123456');

      expect(result.valid).toBe(false);
      expect(result.maxAttemptsExceeded).toBe(true);
    });

    it('should increment attempts on invalid OTP', async () => {
      const mockOtpRequest = {
        id: 'otp-1',
        otp_hash: 'hashed',
        attempts: 0,
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
      } as OtpRequest;

      jest.spyOn(repository, 'findById').mockResolvedValue(mockOtpRequest);
      jest.spyOn(repository, 'incrementAttempts').mockResolvedValue(undefined);

      const result = await service.verifyOtpRequest('otp-1', 'wrong-otp');

      expect(result.valid).toBe(false);
      expect(repository.incrementAttempts).toHaveBeenCalledWith('otp-1');
    });
  });

  describe('checkRateLimit', () => {
    it('should return true if under rate limit', async () => {
      jest.spyOn(repository, 'countRecentRequests').mockResolvedValue(2);

      const result = await service.checkRateLimit('9876543210', 'login');

      expect(result).toBe(true);
    });

    it('should return false if rate limit exceeded', async () => {
      jest.spyOn(repository, 'countRecentRequests').mockResolvedValue(3);

      const result = await service.checkRateLimit('9876543210', 'login');

      expect(result).toBe(false);
    });
  });
});

