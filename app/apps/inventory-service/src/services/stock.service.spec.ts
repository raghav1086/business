import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { ItemRepository } from '../repositories/item.repository';
import { StockAdjustmentRepository } from '../repositories/stock-adjustment.repository';
import { StockAdjustmentDto } from '@business-app/shared/dto';
import { Item } from '../entities/item.entity';
import { StockAdjustment } from '../entities/stock-adjustment.entity';

describe('StockService', () => {
  let service: StockService;
  let itemRepository: ItemRepository;
  let stockAdjustmentRepository: StockAdjustmentRepository;

  const mockItem: Item = {
    id: 'item-1',
    business_id: 'business-1',
    name: 'Test Item',
    current_stock: 10,
    track_stock: true,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  } as Item;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: ItemRepository,
          useValue: {
            findByBusinessIdAndId: jest.fn(),
            updateStock: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: StockAdjustmentRepository,
          useValue: {
            create: jest.fn(),
            findByItemId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    itemRepository = module.get<ItemRepository>(ItemRepository);
    stockAdjustmentRepository = module.get<StockAdjustmentRepository>(
      StockAdjustmentRepository
    );
  });

  describe('adjustStock', () => {
    it('should increase stock', async () => {
      const adjustmentDto: StockAdjustmentDto = {
        item_id: 'item-1',
        adjustment_type: 'increase',
        quantity: 5,
      };

      const mockAdjustment = {
        id: 'adj-1',
        item_id: 'item-1',
        adjustment_type: 'increase',
        quantity: 5,
      } as StockAdjustment;

      jest
        .spyOn(itemRepository, 'findByBusinessIdAndId')
        .mockResolvedValue(mockItem);
      jest.spyOn(itemRepository, 'updateStock').mockResolvedValue(undefined);
      jest
        .spyOn(stockAdjustmentRepository, 'create')
        .mockResolvedValue(mockAdjustment);
      jest
        .spyOn(itemRepository, 'findById')
        .mockResolvedValue({ ...mockItem, current_stock: 15 });

      const result = await service.adjustStock('business-1', adjustmentDto);

      expect(itemRepository.updateStock).toHaveBeenCalledWith('item-1', 15);
      expect(result.item.current_stock).toBe(15);
    });

    it('should decrease stock', async () => {
      const adjustmentDto: StockAdjustmentDto = {
        item_id: 'item-1',
        adjustment_type: 'decrease',
        quantity: 3,
      };

      const mockAdjustment = {
        id: 'adj-1',
        item_id: 'item-1',
        adjustment_type: 'decrease',
        quantity: 3,
      } as StockAdjustment;

      jest
        .spyOn(itemRepository, 'findByBusinessIdAndId')
        .mockResolvedValue(mockItem);
      jest.spyOn(itemRepository, 'updateStock').mockResolvedValue(undefined);
      jest
        .spyOn(stockAdjustmentRepository, 'create')
        .mockResolvedValue(mockAdjustment);
      jest
        .spyOn(itemRepository, 'findById')
        .mockResolvedValue({ ...mockItem, current_stock: 7 });

      const result = await service.adjustStock('business-1', adjustmentDto);

      expect(itemRepository.updateStock).toHaveBeenCalledWith('item-1', 7);
      expect(result.item.current_stock).toBe(7);
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      const adjustmentDto: StockAdjustmentDto = {
        item_id: 'item-1',
        adjustment_type: 'decrease',
        quantity: 15, // More than current stock
      };

      jest
        .spyOn(itemRepository, 'findByBusinessIdAndId')
        .mockResolvedValue(mockItem);

      await expect(
        service.adjustStock('business-1', adjustmentDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if stock tracking disabled', async () => {
      const itemWithoutTracking = { ...mockItem, track_stock: false };
      const adjustmentDto: StockAdjustmentDto = {
        item_id: 'item-1',
        adjustment_type: 'increase',
        quantity: 5,
      };

      jest
        .spyOn(itemRepository, 'findByBusinessIdAndId')
        .mockResolvedValue(itemWithoutTracking);

      await expect(
        service.adjustStock('business-1', adjustmentDto)
      ).rejects.toThrow(BadRequestException);
    });
  });
});

