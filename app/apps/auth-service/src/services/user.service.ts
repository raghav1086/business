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
}

