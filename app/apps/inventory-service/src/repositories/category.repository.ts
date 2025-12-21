import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { Category } from '../entities/category.entity';

/**
 * Category Repository
 */
@Injectable()
export class CategoryRepository extends BaseRepository<Category> {
  constructor(
    @InjectRepository(Category)
    repository: Repository<Category>
  ) {
    super(repository);
  }

  /**
   * Find all categories for business
   */
  async findByBusinessId(businessId: string): Promise<Category[]> {
    return this.repository.find({
      where: { business_id: businessId, status: 'active' },
      order: { sort_order: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Find category by name (for uniqueness check)
   */
  async findByName(businessId: string, name: string): Promise<Category | null> {
    return this.repository.findOne({
      where: { business_id: businessId, name, status: 'active' },
    });
  }
}

