import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { OtpRequestRepository } from '../repositories/otp-request.repository';
import { OtpRequest } from '../entities/otp-request.entity';

/**
 * OTP Service
 * 
 * Handles OTP generation, hashing, and verification.
 */
@Injectable()
export class OtpService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 5;
  private readonly RATE_LIMIT_REQUESTS = 3;
  private readonly RATE_LIMIT_WINDOW_HOURS = 1;

  constructor(private readonly otpRequestRepository: OtpRequestRepository) {}

  /**
   * Generate a 6-digit OTP
   */
  generateOtp(): string {
    const min = 100000;
    const max = 999999;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Hash OTP using bcrypt
   */
  async hashOtp(otp: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(otp, saltRounds);
  }

  /**
   * Verify OTP hash
   */
  async verifyOtp(otp: string, hash: string): Promise<boolean> {
    return bcrypt.compare(otp, hash);
  }

  /**
   * Create OTP request
   */
  async createOtpRequest(
    phone: string,
    purpose: string
  ): Promise<{ otpRequest: OtpRequest; otp: string }> {
    // Generate OTP
    const otp = this.generateOtp();
    const otpHash = await this.hashOtp(otp);

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    // Create OTP request
    const otpRequest = await this.otpRequestRepository.create({
      phone,
      otp_hash: otpHash,
      purpose,
      expires_at: expiresAt,
      attempts: 0,
    });

    return { otpRequest, otp };
  }

  /**
   * Verify OTP
   */
  async verifyOtpRequest(
    otpId: string,
    otp: string
  ): Promise<{ valid: boolean; expired: boolean; maxAttemptsExceeded: boolean }> {
    const otpRequest = await this.otpRequestRepository.findById(otpId);

    if (!otpRequest) {
      return { valid: false, expired: false, maxAttemptsExceeded: false };
    }

    // Check if expired
    if (new Date() > otpRequest.expires_at) {
      return { valid: false, expired: true, maxAttemptsExceeded: false };
    }

    // Check if max attempts exceeded
    if (otpRequest.attempts >= this.MAX_ATTEMPTS) {
      return { valid: false, expired: false, maxAttemptsExceeded: true };
    }

    // Verify OTP
    const isValid = await this.verifyOtp(otp, otpRequest.otp_hash);

    if (!isValid) {
      // Increment attempts
      await this.otpRequestRepository.incrementAttempts(otpId);
      return { valid: false, expired: false, maxAttemptsExceeded: false };
    }

    // Mark as verified
    await this.otpRequestRepository.markAsVerified(otpId);

    return { valid: true, expired: false, maxAttemptsExceeded: false };
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(phone: string, purpose: string): Promise<boolean> {
    const count = await this.otpRequestRepository.countRecentRequests(
      phone,
      purpose
    );
    return count < this.RATE_LIMIT_REQUESTS;
  }
}

