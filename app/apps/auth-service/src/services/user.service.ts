import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { UpdateUserProfileDto, ChangePasscodeDto } from '@business-app/shared/dto';

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

  /**
   * Change user passcode
   */
  async changePasscode(
    userId: string,
    changePasscodeDto: ChangePasscodeDto
  ): Promise<void> {
    const user = await this.getProfile(userId);
    
    // Verify current passcode
    const isValid = await this.verifyUserPasscode(user, changePasscodeDto.current_passcode);
    if (!isValid) {
      throw new BadRequestException('Current passcode is incorrect');
    }

    // Validate new passcode is different
    const isSame = await this.verifyUserPasscode(user, changePasscodeDto.new_passcode);
    if (isSame) {
      throw new BadRequestException('New passcode must be different from current passcode');
    }
    
    // Hash new passcode
    const hashedPasscode = await bcrypt.hash(changePasscodeDto.new_passcode, 10);
    
    // Update user
    await this.userRepository.update(userId, {
      passcode_hash: hashedPasscode
    });
  }

  /**
   * Verify user passcode (default or custom)
   */
  private async verifyUserPasscode(user: User, passcode: string): Promise<boolean> {
    // If user has custom passcode, verify it
    if (user.passcode_hash) {
      return await bcrypt.compare(passcode, user.passcode_hash);
    }
    
    // Otherwise, use default (last 6 digits of phone)
    return passcode === user.phone.slice(-6);
  }
}

