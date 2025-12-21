import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { TransactionRepository } from '../repositories/transaction.repository';
import { CreatePaymentDto } from '@business-app/shared/dto';
import { Transaction } from '../entities/transaction.entity';

describe('PaymentService', () => {
  let service: PaymentService;
  let transactionRepository: TransactionRepository;

  const mockTransaction: Transaction = {
    id: 'txn-1',
    business_id: 'business-1',
    party_id: 'party-1',
    transaction_type: 'payment_in',
    transaction_date: new Date(),
    amount: 1000,
    payment_mode: 'cash',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  } as Transaction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: TransactionRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByBusinessId: jest.fn(),
            findByInvoiceId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    transactionRepository = module.get<TransactionRepository>(
      TransactionRepository
    );
  });

  describe('recordPayment', () => {
    it('should record a payment successfully', async () => {
      const createDto: CreatePaymentDto = {
        party_id: 'party-1',
        transaction_type: 'payment_in',
        transaction_date: '2024-01-01',
        amount: 1000,
        payment_mode: 'cash',
      };

      jest
        .spyOn(transactionRepository, 'create')
        .mockResolvedValue(mockTransaction);

      const result = await service.recordPayment(
        'business-1',
        'user-1',
        createDto
      );

      expect(result).toEqual(mockTransaction);
    });

    it('should throw BadRequestException if amount is zero', async () => {
      const createDto: CreatePaymentDto = {
        party_id: 'party-1',
        transaction_type: 'payment_in',
        transaction_date: '2024-01-01',
        amount: 0,
        payment_mode: 'cash',
      };

      await expect(
        service.recordPayment('business-1', 'user-1', createDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return transaction if found', async () => {
      jest
        .spyOn(transactionRepository, 'findById')
        .mockResolvedValue(mockTransaction);

      const result = await service.findById('business-1', 'txn-1');

      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      jest.spyOn(transactionRepository, 'findById').mockResolvedValue(null);

      await expect(
        service.findById('business-1', 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });
});

