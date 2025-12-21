import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * SMS Service
 * 
 * Handles SMS sending via MSG91 or other providers.
 * For development, this can be mocked.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly msg91ApiKey: string;
  private readonly msg91SenderId: string;
  private readonly isDevelopment: boolean;

  constructor(private readonly configService: ConfigService) {
    this.msg91ApiKey = this.configService.get<string>('MSG91_API_KEY', '');
    this.msg91SenderId = this.configService.get<string>('MSG91_SENDER_ID', '');
    this.isDevelopment =
      this.configService.get<string>('NODE_ENV', 'development') ===
      'development';
  }

  /**
   * Send OTP via SMS
   */
  async sendOtp(phone: string, otp: string): Promise<boolean> {
    // In development, just log the OTP
    if (this.isDevelopment || !this.msg91ApiKey) {
      this.logger.log(`[DEV] OTP for ${phone}: ${otp}`);
      return true;
    }

    try {
      // TODO: Integrate with MSG91 API
      // For now, return true (mocked)
      this.logger.log(`Sending OTP to ${phone} via MSG91`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}:`, error);
      return false;
    }
  }

  /**
   * Send SMS message
   */
  async sendMessage(phone: string, message: string): Promise<boolean> {
    // In development, just log
    if (this.isDevelopment || !this.msg91ApiKey) {
      this.logger.log(`[DEV] SMS to ${phone}: ${message}`);
      return true;
    }

    try {
      // TODO: Integrate with MSG91 API
      this.logger.log(`Sending SMS to ${phone} via MSG91`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}:`, error);
      return false;
    }
  }
}

