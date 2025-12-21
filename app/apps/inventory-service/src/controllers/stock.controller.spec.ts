import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from './stock.controller';
import { StockService } from '../services/stock.service';
import { StockAdjustmentDto } from '@business-app/shared/dto';
import { Item } from '../entities/item.entity';
import { StockAdjustment } from '../entities/stock-adjustment.entity';

describe('StockController', () => {
  let controller: StockController;
  let service: StockService;

  const mockItem: Item = {
    id: 'item-1',
    name: 'Test Item',
    current_stock: 10,
  } as Item;

  const mockAdjustment: StockAdjustment = {
    id: 'adj-1',
    item_id: 'item-1',
    adjustment_type: 'increase',
    quantity: 5,
  } as StockAdjustment;

  const mockRequest = {
    business_id: 'business-1',
    user: { id: 'user-1' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        {
          provide: StockService,
          useValue: {
            adjustStock: jest.fn(),
            getStockHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StockController>(StockController);
    service = module.get<StockService>(StockService);
  });

  describe('adjustStock', () => {
    it('should adjust stock', async () => {
      const adjustmentDto: StockAdjustmentDto = {
        item_id: 'item-1',
        adjustment_type: 'increase',
        quantity: 5,
      };

      jest.spyOn(service, 'adjustStock').mockResolvedValue({
        item: mockItem,
        adjustment: mockAdjustment,
      });

      const result = await controller.adjustStock(
        mockRequest as any,
        adjustmentDto
      );

      expect(result.item.id).toBe('item-1');
      expect(result.adjustment.id).toBe('adj-1');
    });
  });
});

