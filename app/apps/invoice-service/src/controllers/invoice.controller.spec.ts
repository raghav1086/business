import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from '../services/invoice.service';
import { CreateInvoiceDto } from '@business-app/shared/dto';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';

describe('InvoiceController', () => {
  let controller: InvoiceController;
  let service: InvoiceService;

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

  const mockRequest = {
    business_id: 'business-1',
    user: { id: 'user-1' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [
        {
          provide: InvoiceService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByBusinessId: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InvoiceController>(InvoiceController);
    service = module.get<InvoiceService>(InvoiceService);
  });

  describe('create', () => {
    it('should create an invoice', async () => {
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

      jest.spyOn(service, 'create').mockResolvedValue(mockInvoice);

      const result = await controller.create(mockRequest as any, createDto);

      expect(result.id).toBe('invoice-1');
      expect(result.invoice_number).toBe('INV-001');
    });
  });

  describe('findAll', () => {
    it('should return all invoices', async () => {
      const invoices = [mockInvoice];
      const mockResult = { invoices, total: 1, page: 1, limit: 20 };
      jest.spyOn(service, 'findByBusinessId').mockResolvedValue(mockResult);

      const result = await controller.findAll(mockRequest as any);

      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0].id).toBe('invoice-1');
    });
  });
});

