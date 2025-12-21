import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceRepository } from './invoice.repository';
import { Invoice } from '../entities/invoice.entity';

describe('InvoiceRepository', () => {
  let repository: InvoiceRepository;
  let typeOrmRepository: Repository<Invoice>;

  const mockInvoice: Invoice = {
    id: 'invoice-1',
    business_id: 'business-1',
    party_id: 'party-1',
    invoice_number: 'INV-001',
    invoice_type: 'sale',
    invoice_date: new Date(),
    subtotal: 1000,
    total_amount: 1180,
    status: 'draft',
    created_at: new Date(),
    updated_at: new Date(),
  } as Invoice;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceRepository,
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<InvoiceRepository>(InvoiceRepository);
    typeOrmRepository = module.get<Repository<Invoice>>(
      getRepositoryToken(Invoice)
    );
  });

  describe('getNextInvoiceNumber', () => {
    it('should generate first invoice number', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.getNextInvoiceNumber('business-1', 'sale');

      expect(result).toBe('INV-001');
    });

    it('should increment invoice number', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(mockInvoice);

      const result = await repository.getNextInvoiceNumber('business-1', 'sale');

      expect(result).toBe('INV-002');
    });
  });
});

