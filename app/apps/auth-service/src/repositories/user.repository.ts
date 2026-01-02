import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { User } from '../entities/user.entity';

/**
 * User Repository
 * 
 * Data Access Layer for User entity.
 */
@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>
  ) {
    super(repository);
  }

  /**
   * Find user by phone
   */
  async findByPhone(phone: string): Promise<User | null> {
    return this.repository.findOne({
      where: { phone, status: 'active' },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email, status: 'active' },
    });
  }

  /**
   * Check if phone exists
   */
  async phoneExists(phone: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { phone, status: 'active' },
    });
    return count > 0;
  }

  /**
   * Update last login
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.repository.update(userId, {
      last_login_at: new Date(),
    });
  }

  /**
   * Search users by phone, email, or name
   * Returns up to limit results
   */
  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    return this.repository
      .createQueryBuilder('user')
      .where('user.status = :status', { status: 'active' })
      .andWhere(
        '(LOWER(user.phone) LIKE :searchTerm OR LOWER(user.email) LIKE :searchTerm OR LOWER(user.name) LIKE :searchTerm)',
        { searchTerm }
      )
      .orderBy('user.created_at', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Find user by ID (public method)
   */
  async findUserById(userId: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id: userId, status: 'active' },
    });
  }

  /**
   * Find all users (for superadmin)
   */
  async findAllUsers(limit?: number): Promise<User[]> {
    const query = this.repository
      .createQueryBuilder('user')
      .where('user.status = :status', { status: 'active' })
      .orderBy('user.created_at', 'DESC');
    
    if (limit) {
      query.limit(limit);
    }
    
    return query.getMany();
  }

  /**
   * Count all users
   */
  async countAll(): Promise<number> {
    return this.repository.count({ where: { status: 'active' } });
  }

  /**
   * Count users created in date range
   */
  async countByDateRange(startDate: Date, endDate: Date): Promise<number> {
    return this.repository
      .createQueryBuilder('user')
      .where('user.created_at >= :startDate', { startDate })
      .andWhere('user.created_at <= :endDate', { endDate })
      .andWhere('user.status = :status', { status: 'active' })
      .getCount();
  }

  /**
   * Get users grouped by month (for growth chart)
   */
  async getMonthlyCounts(months: number = 6): Promise<Array<{ month: string; count: number }>> {
    const results = await this.repository
      .createQueryBuilder('user')
      .select("TO_CHAR(user.created_at, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('user.created_at >= :startDate', {
        startDate: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000),
      })
      .andWhere('user.status = :status', { status: 'active' })
      .groupBy("TO_CHAR(user.created_at, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      month: r.month,
      count: parseInt(r.count, 10),
    }));
  }

  /**
   * Get users by type distribution
   */
  async getByTypeDistribution(): Promise<Array<{ type: string; count: number }>> {
    const results = await this.repository
      .createQueryBuilder('user')
      .select('user.user_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('user.status = :status', { status: 'active' })
      .groupBy('user.user_type')
      .getRawMany();

    return results.map((r) => ({
      type: r.type || 'unknown',
      count: parseInt(r.count, 10),
    }));
  }

  /**
   * Count active users (logged in last 30 days)
   */
  async countActiveUsers(days: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.repository
      .createQueryBuilder('user')
      .where('user.status = :status', { status: 'active' })
      .andWhere('user.last_login_at >= :cutoffDate', { cutoffDate })
      .getCount();
  }
}

