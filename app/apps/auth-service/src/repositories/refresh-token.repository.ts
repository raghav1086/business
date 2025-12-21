import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { RefreshToken } from '../entities/refresh-token.entity';

/**
 * Refresh Token Repository
 * 
 * Data Access Layer for Refresh Token entity.
 */
@Injectable()
export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  constructor(
    @InjectRepository(RefreshToken)
    repository: Repository<RefreshToken>
  ) {
    super(repository);
  }

  /**
   * Find refresh token by hash
   */
  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.repository.findOne({
      where: { token_hash: tokenHash, revoked_at: null },
    });
  }

  /**
   * Find all active tokens for user
   */
  async findByUserId(userId: string): Promise<RefreshToken[]> {
    return this.repository.find({
      where: { user_id: userId, revoked_at: null },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Revoke token
   */
  async revokeToken(id: string): Promise<void> {
    await this.repository.update(id, {
      revoked_at: new Date(),
    });
  }

  /**
   * Revoke all tokens for user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.repository.update(
      { user_id: userId, revoked_at: null },
      { revoked_at: new Date() }
    );
  }
}

