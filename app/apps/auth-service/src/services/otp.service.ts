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
  // In development/test mode, allow 10000 requests for comprehensive E2E testing
  private readonly RATE_LIMIT_REQUESTS = process.env.NODE_ENV === 'production' ? 3 : 10000;
  private readonly RATE_LIMIT_WINDOW_HOURS = 1;

  constructor(private readonly otpRequestRepository: OtpRequestRepository) {}

  /**
   * Generate a 6-digit OTP
   * 
   * Fake OTP mode (ENABLE_FAKE_OTP=true): Uses last 6 digits of phone number
   * Example: 9175760649 -> 5760649 -> 760649
   * 
   * Development/test mode: Uses fixed OTP 129012 for testing
   * Production mode: Generates random 6-digit OTP
   */
  generateOtp(phone?: string): string {
    // Fake OTP mode for beta users (can be used in production)
    const useFakeOtp = process.env.ENABLE_FAKE_OTP === 'true';
    if (useFakeOtp && phone) {
      return this.generateFakeOtp(phone);
    }

    // Use fixed OTP for development/testing
    if (process.env.NODE_ENV !== 'production') {
      return '129012';
    }
    
    // Production - real OTP
    const min = 100000;
    const max = 999999;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Generate fake OTP from phone number
   * Uses last 6 digits of the phone number
   * Example: 9175760649 -> 5760649 -> 760649
   */
  private generateFakeOtp(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length < 6) {
      // Fallback: pad with zeros if phone is too short
      return digits.padStart(6, '0');
    }
    
    // Take last 6 digits
    const lastSix = digits.substring(digits.length - 6);
    
    return lastSix;
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
    // Generate OTP (pass phone for fake OTP generation)
    const otp = this.generateOtp(phone);
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

