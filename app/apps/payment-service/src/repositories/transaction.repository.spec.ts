import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionRepository } from './transaction.repository';
import { Transaction } from '../entities/transaction.entity';

describe('TransactionRepository', () => {
  let repository: TransactionRepository;
  let typeOrmRepository: Repository<Transaction>;

  const mockTransaction: Transaction = {
    id: 'txn-1',
    business_id: 'business-1',
    transaction_type: 'payment_in',
    transaction_date: new Date(),
    amount: 1000,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  } as Transaction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRepository,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<TransactionRepository>(TransactionRepository);
    typeOrmRepository = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction)
    );
  });

  describe('findByInvoiceId', () => {
    it('should find transactions for invoice', async () => {
      const transactions = [mockTransaction];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(transactions);

      const result = await repository.findByInvoiceId('invoice-1');

      expect(result).toEqual(transactions);
    });
  });
});

