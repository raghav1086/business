import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { Item } from '../entities/item.entity';

/**
 * Item Repository
 */
@Injectable()
export class ItemRepository extends BaseRepository<Item> {
  constructor(
    @InjectRepository(Item)
    repository: Repository<Item>
  ) {
    super(repository);
  }

  /**
   * Find all items for business
   */
  async findByBusinessId(businessId: string): Promise<Item[]> {
    return this.repository.find({
      where: { business_id: businessId, status: 'active' },
      order: { name: 'ASC' },
    });
  }

  /**
   * Find items by category
   */
  async findByCategory(
    businessId: string,
    categoryId: string
  ): Promise<Item[]> {
    return this.repository.find({
      where: { business_id: businessId, category_id: categoryId, status: 'active' },
      order: { name: 'ASC' },
    });
  }

  /**
   * Search items by name, SKU, or barcode
   */
  async search(
    businessId: string,
    searchTerm: string
  ): Promise<Item[]> {
    return this.repository
      .createQueryBuilder('item')
      .where('item.business_id = :businessId', { businessId })
      .andWhere('item.status = :status', { status: 'active' })
      .andWhere(
        '(item.name ILIKE :searchTerm OR item.sku ILIKE :searchTerm OR item.barcode ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('item.name', 'ASC')
      .getMany();
  }

  /**
   * Find items with low stock
   */
  async findLowStock(businessId: string): Promise<Item[]> {
    return this.repository
      .createQueryBuilder('item')
      .where('item.business_id = :businessId', { businessId })
      .andWhere('item.status = :status', { status: 'active' })
      .andWhere('item.track_stock = :trackStock', { trackStock: true })
      .andWhere('item.low_stock_threshold IS NOT NULL')
      .andWhere('item.current_stock <= item.low_stock_threshold')
      .orderBy('item.current_stock', 'ASC')
      .getMany();
  }

  /**
   * Find item by business ID and item ID
   */
  async findByBusinessIdAndId(
    businessId: string,
    id: string
  ): Promise<Item | null> {
    return this.repository.findOne({
      where: { business_id: businessId, id, status: 'active' },
    });
  }

  /**
   * Update stock quantity
   */
  async updateStock(itemId: string, quantity: number): Promise<void> {
    await this.repository.update(itemId, {
      current_stock: quantity,
    });
  }

  /**
   * Find all items across all businesses (for superadmin)
   */
  async findAllForSuperadmin(categoryId?: string): Promise<Item[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('item')
      .where('item.status = :status', { status: 'active' });

    if (categoryId) {
      queryBuilder.andWhere('item.category_id = :categoryId', { categoryId });
    }

    queryBuilder.orderBy('item.name', 'ASC');

    return queryBuilder.getMany();
  }

  /**
   * Search all items across all businesses (for superadmin)
   */
  async searchAllForSuperadmin(searchTerm: string): Promise<Item[]> {
    return this.repository
      .createQueryBuilder('item')
      .where('item.status = :status', { status: 'active' })
      .andWhere(
        '(item.name ILIKE :searchTerm OR item.sku ILIKE :searchTerm OR item.barcode ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('item.name', 'ASC')
      .getMany();
  }
}

