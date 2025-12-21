import { Test, TestingModule } from '@nestjs/testing';
import { ItemController } from './item.controller';
import { ItemService } from '../services/item.service';
import { CreateItemDto } from '@business-app/shared/dto';
import { Item } from '../entities/item.entity';

describe('ItemController', () => {
  let controller: ItemController;
  let service: ItemService;

  const mockItem: Item = {
    id: 'item-1',
    business_id: 'business-1',
    name: 'Test Item',
    selling_price: 100,
    purchase_price: 80,
    current_stock: 10,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  } as Item;

  const mockRequest = {
    business_id: 'business-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemController],
      providers: [
        {
          provide: ItemService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByBusinessId: jest.fn(),
            search: jest.fn(),
            findLowStock: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ItemController>(ItemController);
    service = module.get<ItemService>(ItemService);
  });

  describe('create', () => {
    it('should create an item', async () => {
      const createDto: CreateItemDto = {
        name: 'New Item',
        selling_price: 100,
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockItem);

      const result = await controller.create(mockRequest as any, createDto);

      expect(result.id).toBe('item-1');
      expect(result.name).toBe('Test Item');
    });
  });

  describe('findLowStock', () => {
    it('should return low stock items', async () => {
      const lowStockItems = [mockItem];
      jest.spyOn(service, 'findLowStock').mockResolvedValue(lowStockItems);

      const result = await controller.findLowStock(mockRequest as any);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-1');
    });
  });
});

