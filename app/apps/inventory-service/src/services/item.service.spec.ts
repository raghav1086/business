import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemRepository } from '../repositories/item.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { UnitRepository } from '../repositories/unit.repository';
import { CreateItemDto } from '@business-app/shared/dto';
import { Item } from '../entities/item.entity';
import { Category } from '../entities/category.entity';
import { Unit } from '../entities/unit.entity';

describe('ItemService', () => {
  let service: ItemService;
  let itemRepository: ItemRepository;
  let categoryRepository: CategoryRepository;
  let unitRepository: UnitRepository;

  const mockItem: Item = {
    id: 'item-1',
    business_id: 'business-1',
    name: 'Test Item',
    status: 'active',
    selling_price: 100,
    purchase_price: 80,
    current_stock: 10,
    track_stock: true,
    created_at: new Date(),
    updated_at: new Date(),
  } as Item;

  const mockCategory: Category = {
    id: 'category-1',
    business_id: 'business-1',
    name: 'Electronics',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  } as Category;

  const mockUnit: Unit = {
    id: 'unit-1',
    business_id: 'business-1',
    name: 'Pieces',
    short_name: 'pcs',
    is_default: true,
    created_at: new Date(),
    updated_at: new Date(),
  } as Unit;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
        {
          provide: ItemRepository,
          useValue: {
            create: jest.fn(),
            findByBusinessIdAndId: jest.fn(),
            findByBusinessId: jest.fn(),
            findByCategory: jest.fn(),
            search: jest.fn(),
            findLowStock: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: CategoryRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: UnitRepository,
          useValue: {
            findById: jest.fn(),
            findDefaultUnit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
    itemRepository = module.get<ItemRepository>(ItemRepository);
    categoryRepository = module.get<CategoryRepository>(CategoryRepository);
    unitRepository = module.get<UnitRepository>(UnitRepository);
  });

  describe('create', () => {
    it('should create an item successfully', async () => {
      const createDto: CreateItemDto = {
        name: 'New Item',
        selling_price: 100,
      };

      jest.spyOn(unitRepository, 'findDefaultUnit').mockResolvedValue(mockUnit);
      jest.spyOn(itemRepository, 'create').mockResolvedValue(mockItem);

      const result = await service.create('business-1', createDto);

      expect(result).toEqual(mockItem);
      expect(itemRepository.create).toHaveBeenCalled();
    });

    it('should validate category if provided', async () => {
      const createDto: CreateItemDto = {
        name: 'New Item',
        selling_price: 100,
        category_id: 'category-1',
      };

      jest.spyOn(categoryRepository, 'findById').mockResolvedValue(mockCategory);
      jest.spyOn(unitRepository, 'findDefaultUnit').mockResolvedValue(mockUnit);
      jest.spyOn(itemRepository, 'create').mockResolvedValue(mockItem);

      await service.create('business-1', createDto);

      expect(categoryRepository.findById).toHaveBeenCalledWith('category-1');
    });

    it('should throw NotFoundException if category not found', async () => {
      const createDto: CreateItemDto = {
        name: 'New Item',
        selling_price: 100,
        category_id: 'non-existent',
      };

      jest.spyOn(categoryRepository, 'findById').mockResolvedValue(null);

      await expect(service.create('business-1', createDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findLowStock', () => {
    it('should return items with low stock', async () => {
      const lowStockItems = [mockItem];
      jest.spyOn(itemRepository, 'findLowStock').mockResolvedValue(lowStockItems);

      const result = await service.findLowStock('business-1');

      expect(result).toEqual(lowStockItems);
    });
  });
});

