import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto } from '@business-app/shared/dto';
import { Transaction } from '../entities/transaction.entity';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;

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

  const mockRequest = {
    business_id: 'business-1',
    user: { id: 'user-1' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            recordPayment: jest.fn(),
            findById: jest.fn(),
            findByBusinessId: jest.fn(),
            findByInvoiceId: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
  });

  describe('recordPayment', () => {
    it('should record a payment', async () => {
      const createDto: CreatePaymentDto = {
        party_id: 'party-1',
        transaction_type: 'payment_in',
        transaction_date: '2024-01-01',
        amount: 1000,
        payment_mode: 'cash',
      };

      jest
        .spyOn(service, 'recordPayment')
        .mockResolvedValue(mockTransaction);

      const result = await controller.recordPayment(
        mockRequest as any,
        createDto
      );

      expect(result.id).toBe('txn-1');
      expect(result.amount).toBe(1000);
    });
  });
});

