import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserSessionRepository } from '../repositories/user-session.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { UserSession } from '../entities/user-session.entity';

/**
 * Session Service
 * 
 * Handles user session management.
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly userSessionRepository: UserSessionRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository
  ) {}

  /**
   * Get all active sessions for user
   */
  async getUserSessions(userId: string): Promise<UserSession[]> {
    return this.userSessionRepository.findByUserId(userId);
  }

  /**
   * Logout from specific session
   */
  async logoutSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.userSessionRepository.findByIdAndUserId(
      sessionId,
      userId
    );

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Deactivate session
    await this.userSessionRepository.deactivateSession(sessionId);

    // Note: We don't revoke refresh tokens here as user might want to keep other sessions
    // If needed, we can add logic to revoke refresh token for this specific device
  }

  /**
   * Logout from all sessions
   */
  async logoutAllSessions(userId: string): Promise<void> {
    // Deactivate all sessions
    await this.userSessionRepository.deactivateAllUserSessions(userId);

    // Revoke all refresh tokens
    await this.refreshTokenRepository.revokeAllUserTokens(userId);
  }
}

