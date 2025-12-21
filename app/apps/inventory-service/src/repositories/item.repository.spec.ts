import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemRepository } from './item.repository';
import { Item } from '../entities/item.entity';

describe('ItemRepository', () => {
  let repository: ItemRepository;
  let typeOrmRepository: Repository<Item>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemRepository,
        {
          provide: getRepositoryToken(Item),
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

    repository = module.get<ItemRepository>(ItemRepository);
    typeOrmRepository = module.get<Repository<Item>>(getRepositoryToken(Item));
  });

  describe('findByBusinessId', () => {
    it('should find all items for business', async () => {
      const items = [mockItem];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(items);

      const result = await repository.findByBusinessId('business-1');

      expect(result).toEqual(items);
    });
  });

  describe('updateStock', () => {
    it('should update stock quantity', async () => {
      jest.spyOn(typeOrmRepository, 'update').mockResolvedValue(undefined as any);

      await repository.updateStock('item-1', 20);

      expect(typeOrmRepository.update).toHaveBeenCalledWith('item-1', {
        current_stock: 20,
      });
    });
  });
});

