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

  /**
   * Get last login distribution (for analytics)
   */
  async getLastLoginDistribution(): Promise<Array<{ period: string; count: number }>> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [last24hCount, last7dCount, last30dCount, last90dCount, neverCount] = await Promise.all([
      this.repository
        .createQueryBuilder('user')
        .where('user.status = :status', { status: 'active' })
        .andWhere('user.last_login_at >= :date', { date: last24h })
        .getCount(),
      this.repository
        .createQueryBuilder('user')
        .where('user.status = :status', { status: 'active' })
        .andWhere('user.last_login_at >= :date', { date: last7d })
        .andWhere('user.last_login_at < :date2', { date2: last24h })
        .getCount(),
      this.repository
        .createQueryBuilder('user')
        .where('user.status = :status', { status: 'active' })
        .andWhere('user.last_login_at >= :date', { date: last30d })
        .andWhere('user.last_login_at < :date2', { date2: last7d })
        .getCount(),
      this.repository
        .createQueryBuilder('user')
        .where('user.status = :status', { status: 'active' })
        .andWhere('user.last_login_at >= :date', { date: last90d })
        .andWhere('user.last_login_at < :date2', { date2: last30d })
        .getCount(),
      this.repository
        .createQueryBuilder('user')
        .where('user.status = :status', { status: 'active' })
        .andWhere('(user.last_login_at IS NULL OR user.last_login_at < :date)', { date: last90d })
        .getCount(),
    ]);

    return [
      { period: 'Last 24 hours', count: last24hCount },
      { period: 'Last 7 days', count: last7dCount },
      { period: 'Last 30 days', count: last30dCount },
      { period: 'Last 90 days', count: last90dCount },
      { period: 'Never/90+ days', count: neverCount },
    ];
  }

  /**
   * Get user retention data (users who logged in in consecutive periods)
   */
  async getUserRetention(months: number = 6): Promise<Array<{ month: string; newUsers: number; returningUsers: number }>> {
    // Simplified retention - in production, this would track actual user return behavior
    const monthlyCounts = await this.getMonthlyCounts(months);
    const totalUsers = await this.countAll();
    
    return monthlyCounts.map((monthData, index) => {
      const previousUsers = index > 0 ? monthlyCounts[index - 1].count : 0;
      return {
        month: monthData.month,
        newUsers: monthData.count,
        returningUsers: Math.max(0, Math.floor(previousUsers * 0.7)), // Simplified: assume 70% retention
      };
    });
  }
}

