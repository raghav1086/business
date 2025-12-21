import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { InvoiceItemRepository } from '../repositories/invoice-item.repository';
import { CreateInvoiceDto } from '@business-app/shared/dto';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let invoiceRepository: InvoiceRepository;
  let invoiceItemRepository: InvoiceItemRepository;

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
    items: [],
    created_at: new Date(),
    updated_at: new Date(),
  } as Invoice;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: InvoiceRepository,
          useValue: {
            getNextInvoiceNumber: jest.fn(),
            findByInvoiceNumber: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            findByBusinessId: jest.fn(),
            findByBusinessIdAndId: jest.fn(),
          },
        },
        {
          provide: InvoiceItemRepository,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    invoiceRepository = module.get<InvoiceRepository>(InvoiceRepository);
    invoiceItemRepository = module.get<InvoiceItemRepository>(
      InvoiceItemRepository
    );
  });

  describe('create', () => {
    it('should create an invoice successfully', async () => {
      const createDto: CreateInvoiceDto = {
        party_id: 'party-1',
        invoice_type: 'sale',
        invoice_date: '2024-01-01',
        items: [
          {
            item_name: 'Product A',
            quantity: 10,
            unit_price: 100,
            tax_rate: 18,
          },
        ],
      };

      jest
        .spyOn(invoiceRepository, 'getNextInvoiceNumber')
        .mockResolvedValue('INV-001');
      jest.spyOn(invoiceRepository, 'findByInvoiceNumber').mockResolvedValue(null);
      jest.spyOn(invoiceRepository, 'create').mockResolvedValue(mockInvoice);
      jest
        .spyOn(invoiceItemRepository, 'create')
        .mockResolvedValue({} as InvoiceItem);
      jest
        .spyOn(invoiceRepository, 'findById')
        .mockResolvedValue(mockInvoice);

      const result = await service.create('business-1', 'user-1', createDto);

      expect(result).toBeDefined();
      expect(result.invoice_number).toBe('INV-001');
    });

    it('should throw BadRequestException if invoice number exists', async () => {
      const createDto: CreateInvoiceDto = {
        party_id: 'party-1',
        invoice_type: 'sale',
        invoice_date: '2024-01-01',
        items: [
          {
            item_name: 'Product A',
            quantity: 10,
            unit_price: 100,
          },
        ],
      };

      jest
        .spyOn(invoiceRepository, 'getNextInvoiceNumber')
        .mockResolvedValue('INV-001');
      jest
        .spyOn(invoiceRepository, 'findByInvoiceNumber')
        .mockResolvedValue(mockInvoice);

      await expect(
        service.create('business-1', 'user-1', createDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return invoice if found', async () => {
      jest
        .spyOn(invoiceRepository, 'findByBusinessIdAndId')
        .mockResolvedValue(mockInvoice);

      const result = await service.findById('business-1', 'invoice-1');

      expect(result).toEqual(mockInvoice);
    });

    it('should throw NotFoundException if invoice not found', async () => {
      jest
        .spyOn(invoiceRepository, 'findByBusinessIdAndId')
        .mockResolvedValue(null);

      await expect(
        service.findById('business-1', 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });
});

