import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { OtpRequestRepository } from './otp-request.repository';
import { OtpRequest } from '../entities/otp-request.entity';

describe('OtpRequestRepository', () => {
  let repository: OtpRequestRepository;
  let typeOrmRepository: Repository<OtpRequest>;

  const mockOtpRequest: OtpRequest = {
    id: 'otp-1',
    phone: '9876543210',
    otp_hash: 'hashed_otp',
    purpose: 'login',
    attempts: 0,
    expires_at: new Date(Date.now() + 5 * 60 * 1000),
    verified_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  } as OtpRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpRequestRepository,
        {
          provide: getRepositoryToken(OtpRequest),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<OtpRequestRepository>(OtpRequestRepository);
    typeOrmRepository = module.get<Repository<OtpRequest>>(
      getRepositoryToken(OtpRequest)
    );
  });

  describe('findActiveByPhoneAndPurpose', () => {
    it('should find active OTP request', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(mockOtpRequest);

      const result = await repository.findActiveByPhoneAndPurpose(
        '9876543210',
        'login'
      );

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: {
          phone: '9876543210',
          purpose: 'login',
          verified_at: null,
        },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockOtpRequest);
    });
  });

  describe('incrementAttempts', () => {
    it('should increment attempt count', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockOtpRequest);
      jest.spyOn(typeOrmRepository, 'update').mockResolvedValue(undefined as any);

      await repository.incrementAttempts('otp-1');

      expect(typeOrmRepository.update).toHaveBeenCalledWith('otp-1', {
        attempts: 1,
      });
    });
  });

  describe('markAsVerified', () => {
    it('should mark OTP as verified', async () => {
      jest.spyOn(typeOrmRepository, 'update').mockResolvedValue(undefined as any);

      await repository.markAsVerified('otp-1');

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        'otp-1',
        expect.objectContaining({
          verified_at: expect.any(Date),
        })
      );
    });
  });
});

