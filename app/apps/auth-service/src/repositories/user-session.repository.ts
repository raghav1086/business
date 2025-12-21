import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { UserSession } from '../entities/user-session.entity';

/**
 * User Session Repository
 * 
 * Data Access Layer for User Session entity.
 */
@Injectable()
export class UserSessionRepository extends BaseRepository<UserSession> {
  constructor(
    @InjectRepository(UserSession)
    repository: Repository<UserSession>
  ) {
    super(repository);
  }

  /**
   * Find all active sessions for user
   */
  async findByUserId(userId: string): Promise<UserSession[]> {
    return this.repository.find({
      where: { user_id: userId, is_active: true },
      order: { last_active_at: 'DESC' },
    });
  }

  /**
   * Find session by ID and user ID
   */
  async findByIdAndUserId(
    id: string,
    userId: string
  ): Promise<UserSession | null> {
    return this.repository.findOne({
      where: { id, user_id: userId },
    });
  }

  /**
   * Find or create session by device ID
   */
  async findOrCreateByDeviceId(
    userId: string,
    deviceId: string,
    deviceInfo?: Record<string, any>
  ): Promise<UserSession> {
    let session = await this.repository.findOne({
      where: { user_id: userId, device_id: deviceId, is_active: true },
    });

    if (!session) {
      session = await this.repository.create({
        user_id: userId,
        device_id: deviceId,
        device_name: deviceInfo?.device_name,
        device_os: deviceInfo?.device_os,
        app_version: deviceInfo?.app_version,
        is_active: true,
        last_active_at: new Date(),
      });
      await this.repository.save(session);
    } else {
      // Update last active
      await this.repository.update(session.id, {
        last_active_at: new Date(),
      });
    }

    return session;
  }

  /**
   * Deactivate session
   */
  async deactivateSession(id: string): Promise<void> {
    await this.repository.update(id, {
      is_active: false,
    });
  }

  /**
   * Deactivate all sessions for user
   */
  async deactivateAllUserSessions(userId: string): Promise<void> {
    await this.repository.update(
      { user_id: userId, is_active: true },
      { is_active: false }
    );
  }
}

