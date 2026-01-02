import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { UpdateUserProfileDto } from '@business-app/shared/dto';

/**
 * User Service
 * 
 * Handles user profile management.
 */
@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateDto: UpdateUserProfileDto
  ): Promise<User> {
    // Verify user exists
    await this.getProfile(userId);

    // Update profile
    return this.userRepository.update(userId, updateDto);
  }

  /**
   * Update avatar URL
   */
  async updateAvatar(userId: string, avatarUrl: string): Promise<User> {
    // Verify user exists
    await this.getProfile(userId);

    // Update avatar
    return this.userRepository.update(userId, {
      avatar_url: avatarUrl,
    });
  }

  /**
   * Search users by phone, email, or name
   */
  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    if (!query || query.length < 2) {
      return [];
    }
    return this.userRepository.searchUsers(query, limit);
  }

  /**
   * Get user by ID (for other services)
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Get all users (superadmin only)
   */
  async getAllUsers(limit?: number): Promise<User[]> {
    return this.userRepository.findAllUsers(limit);
  }

  /**
   * Get user count (superadmin only)
   */
  async getUserCount(): Promise<number> {
    return this.userRepository.countAll();
  }

  /**
   * Get active users count (logged in last N days)
   */
  async getActiveUsersCount(days: number = 30): Promise<number> {
    return this.userRepository.countActiveUsers(days);
  }

  /**
   * Get users growth data (monthly counts)
   */
  async getUsersGrowth(months: number = 6): Promise<Array<{ month: string; count: number }>> {
    return this.userRepository.getMonthlyCounts(months);
  }

  /**
   * Get users by type distribution
   */
  async getUsersByTypeDistribution(): Promise<Array<{ type: string; count: number }>> {
    return this.userRepository.getByTypeDistribution();
  }

  /**
   * Get recent users count (created in last N days)
   */
  async getRecentUsersCount(days: number = 7): Promise<number> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.userRepository.countByDateRange(startDate, new Date());
  }
}

