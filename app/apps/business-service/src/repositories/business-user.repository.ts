import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { BusinessUser } from '../entities/business-user.entity';

/**
 * BusinessUser Repository
 * 
 * Handles database operations for business-user relationships.
 */
@Injectable()
export class BusinessUserRepository extends BaseRepository<BusinessUser> {
  constructor(
    @InjectRepository(BusinessUser)
    repository: Repository<BusinessUser>
  ) {
    super(repository);
  }

  /**
   * Find business-user relationship by business and user
   */
  async findByBusinessAndUser(
    businessId: string,
    userId: string
  ): Promise<BusinessUser | null> {
    return this.repository.findOne({
      where: {
        business_id: businessId,
        user_id: userId,
      },
    });
  }

  /**
   * Find all business assignments for a user
   */
  async findByUser(userId: string): Promise<BusinessUser[]> {
    return this.repository.find({
      where: {
        user_id: userId,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Find all active business assignments for a user
   */
  async findActiveByUser(userId: string): Promise<BusinessUser[]> {
    return this.repository.find({
      where: {
        user_id: userId,
        status: 'active',
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Find all users in a business
   */
  async findByBusiness(businessId: string): Promise<BusinessUser[]> {
    return this.repository.find({
      where: {
        business_id: businessId,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Find all active users in a business
   */
  async findActiveByBusiness(businessId: string): Promise<BusinessUser[]> {
    return this.repository.find({
      where: {
        business_id: businessId,
        status: 'active',
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Check if user is assigned to business
   */
  async isUserAssigned(
    businessId: string,
    userId: string
  ): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        business_id: businessId,
        user_id: userId,
        status: 'active',
      },
    });
    return count > 0;
  }
}

