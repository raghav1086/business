import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { OtpRequest } from '../entities/otp-request.entity';

/**
 * OTP Request Repository
 * 
 * Data Access Layer for OTP Request entity.
 */
@Injectable()
export class OtpRequestRepository extends BaseRepository<OtpRequest> {
  constructor(
    @InjectRepository(OtpRequest)
    repository: Repository<OtpRequest>
  ) {
    super(repository);
  }

  /**
   * Find active OTP request by phone and purpose
   */
  async findActiveByPhoneAndPurpose(
    phone: string,
    purpose: string
  ): Promise<OtpRequest | null> {
    return this.repository.findOne({
      where: {
        phone,
        purpose,
        verified_at: null,
      },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Find OTP request by ID
   */
  async findById(id: string): Promise<OtpRequest | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Count OTP requests in last hour for rate limiting
   */
  async countRecentRequests(phone: string, purpose: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.repository.count({
      where: {
        phone,
        purpose,
        created_at: MoreThan(oneHourAgo) as any,
      },
    });
  }

  /**
   * Increment attempt count
   */
  async incrementAttempts(id: string): Promise<void> {
    const otpRequest = await this.findById(id);
    if (otpRequest) {
      await this.repository.update(id, {
        attempts: otpRequest.attempts + 1,
      });
    }
  }

  /**
   * Mark OTP as verified
   */
  async markAsVerified(id: string): Promise<void> {
    await this.repository.update(id, {
      verified_at: new Date(),
    });
  }

  /**
   * Delete expired OTPs
   */
  async deleteExpired(): Promise<void> {
    const now = new Date();
    await this.repository.delete({
      expires_at: LessThan(now) as any,
    });
  }
}

