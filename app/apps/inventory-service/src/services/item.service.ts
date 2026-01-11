import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ItemRepository } from '../repositories/item.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { UnitRepository } from '../repositories/unit.repository';
import { CreateItemDto, UpdateItemDto } from '@business-app/shared/dto';
import { Item } from '../entities/item.entity';

/**
 * Item Service
 * 
 * Business logic layer for Item management.
 */
@Injectable()
export class ItemService {
  constructor(
    private readonly itemRepository: ItemRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly unitRepository: UnitRepository
  ) {}

  /**
   * Create a new item
   */
  async create(businessId: string, createDto: CreateItemDto): Promise<Item> {
    // Validate category if provided
    if (createDto.category_id) {
      const category = await this.categoryRepository.findById(
        createDto.category_id
      );
      if (!category || category.business_id !== businessId) {
        throw new NotFoundException('Category not found');
      }
    }

    // Validate unit if provided
    if (createDto.unit_id) {
      const unit = await this.unitRepository.findById(createDto.unit_id);
      if (!unit || unit.business_id !== businessId) {
        throw new NotFoundException('Unit not found');
      }
    } else {
      // Use default unit if not provided
      const defaultUnit = await this.unitRepository.findDefaultUnit(businessId);
      if (defaultUnit) {
        createDto.unit_id = defaultUnit.id;
      }
    }

    // Set default values
    const itemData = {
      ...createDto,
      business_id: businessId,
      status: 'active',
      selling_price: createDto.selling_price || 0,
      purchase_price: createDto.purchase_price || 0,
      current_stock: createDto.current_stock || 0,
      track_stock: createDto.track_stock !== undefined ? createDto.track_stock : true,
      inventory_type: createDto.inventory_type || 'trading_goods',
      tax_rate: createDto.tax_rate || 0,
      cess_rate: createDto.cess_rate || 0,
      discount_percent: createDto.discount_percent || 0,
      tax_inclusive: createDto.tax_inclusive || false,
      track_serial: createDto.track_serial || false,
      track_batch: createDto.track_batch || false,
      valuation_method: 'weighted_average',
      weighted_avg_cost: createDto.purchase_price || 0,
    };

    return this.itemRepository.create(itemData);
  }

  /**
   * Get item by ID
   */
  async findById(businessId: string, id: string): Promise<Item> {
    const item = await this.itemRepository.findByBusinessIdAndId(businessId, id);

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    return item;
  }

  /**
   * Get all items for business
   */
  async findByBusinessId(
    businessId: string,
    categoryId?: string
  ): Promise<Item[]> {
    if (categoryId) {
      return this.itemRepository.findByCategory(businessId, categoryId);
    }
    return this.itemRepository.findByBusinessId(businessId);
  }

  /**
   * Search items
   */
  async search(businessId: string, searchTerm: string): Promise<Item[]> {
    return this.itemRepository.search(businessId, searchTerm);
  }

  /**
   * Get low stock items
   */
  async findLowStock(businessId: string): Promise<Item[]> {
    return this.itemRepository.findLowStock(businessId);
  }

  /**
   * Update item
   */
  async update(
    businessId: string,
    id: string,
    updateDto: UpdateItemDto
  ): Promise<Item> {
    // Verify item exists
    await this.findById(businessId, id);

    // Validate category if provided
    if (updateDto.category_id) {
      const category = await this.categoryRepository.findById(
        updateDto.category_id
      );
      if (!category || category.business_id !== businessId) {
        throw new NotFoundException('Category not found');
      }
    }

    // Validate unit if provided
    if (updateDto.unit_id) {
      const unit = await this.unitRepository.findById(updateDto.unit_id);
      if (!unit || unit.business_id !== businessId) {
        throw new NotFoundException('Unit not found');
      }
    }

    return this.itemRepository.update(id, updateDto);
  }

  /**
   * Delete item (soft delete)
   */
  async delete(businessId: string, id: string): Promise<void> {
    // Verify item exists
    await this.findById(businessId, id);

    // Soft delete
    await this.itemRepository.delete(id);
  }

  /**
   * Get all items across all businesses (for superadmin)
   */
  async findAllForSuperadmin(categoryId?: string): Promise<Item[]> {
    return this.itemRepository.findAllForSuperadmin(categoryId);
  }

  /**
   * Search all items across all businesses (for superadmin)
   */
  async searchAllForSuperadmin(searchTerm: string): Promise<Item[]> {
    return this.itemRepository.searchAllForSuperadmin(searchTerm);
  }
}

