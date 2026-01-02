import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RefreshToken } from '../entities/refresh-token.entity';

export interface TokenPayload {
  sub: string; // user id
  phone: string;
  type: string; // access or refresh
  is_superadmin?: boolean; // superadmin flag
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * JWT Service
 * 
 * Handles JWT token generation and refresh token management.
 */
@Injectable()
export class JwtTokenService {
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 30;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenRepository: RefreshTokenRepository
  ) {}

  /**
   * Generate access token
   */
  async generateAccessToken(
    userId: string,
    phone: string,
    isSuperadmin: boolean = false
  ): Promise<string> {
    const payload: TokenPayload = {
      sub: userId,
      phone,
      type: 'access',
      is_superadmin: isSuperadmin,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      secret: this.configService.get<string>('JWT_SECRET', 'default-secret'),
    });
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(
    userId: string,
    phone: string,
    isSuperadmin: boolean = false
  ): Promise<string> {
    const payload: TokenPayload = {
      sub: userId,
      phone,
      type: 'refresh',
      is_superadmin: isSuperadmin,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: `${this.REFRESH_TOKEN_EXPIRY_DAYS}d`,
      secret: this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'default-refresh-secret'
      ),
    });
  }

  /**
   * Generate token pair (access + refresh)
   */
  async generateTokenPair(
    userId: string,
    phone: string,
    isSuperadmin: boolean = false
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, phone, isSuperadmin),
      this.generateRefreshToken(userId, phone, isSuperadmin),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Hash refresh token for storage
   */
  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Store refresh token
   */
  async storeRefreshToken(
    userId: string,
    refreshToken: string,
    deviceInfo?: Record<string, any>,
    ipAddress?: string
  ): Promise<RefreshToken> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    return this.refreshTokenRepository.create({
      user_id: userId,
      token_hash: tokenHash,
      device_info: deviceInfo,
      ip_address: ipAddress,
      expires_at: expiresAt,
    });
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'default-refresh-secret'
        ),
      });

      // Check if token is revoked
      const tokenHash = this.hashRefreshToken(token);
      const storedToken = await this.refreshTokenRepository.findByTokenHash(
        tokenHash
      );

      if (!storedToken || storedToken.revoked_at) {
        return null;
      }

      // Check if expired
      if (new Date() > storedToken.expires_at) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(token);
    const storedToken = await this.refreshTokenRepository.findByTokenHash(
      tokenHash
    );

    if (storedToken) {
      await this.refreshTokenRepository.revokeToken(storedToken.id);
    }
  }
}

