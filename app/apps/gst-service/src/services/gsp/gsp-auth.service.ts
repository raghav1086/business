import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessGstSettingsRepository } from '../../repositories/business-gst-settings.repository';
import * as crypto from 'crypto';

/**
 * GSP Authentication Service
 * 
 * Manages GSP credentials storage and token management.
 */
@Injectable()
export class GSPAuthService {
  private readonly logger = new Logger(GSPAuthService.name);
  private readonly encryptionKey: string;

  constructor(
    private readonly businessGstSettingsRepository: BusinessGstSettingsRepository,
    private readonly configService: ConfigService,
  ) {
    // Get encryption key from config or use default (should be in env)
    this.encryptionKey = this.configService.get<string>(
      'GSP_ENCRYPTION_KEY',
      'default-encryption-key-change-in-production'
    );
  }

  /**
   * Get GSP credentials for a business
   */
  async getCredentials(businessId: string): Promise<any | null> {
    const settings = await this.businessGstSettingsRepository.findByBusinessId(businessId);

    if (!settings || !settings.gsp_credentials) {
      return null;
    }

    try {
      // Decrypt credentials
      return this.decrypt(settings.gsp_credentials);
    } catch (error) {
      this.logger.error(`Failed to decrypt GSP credentials for business ${businessId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Store GSP credentials (encrypted)
   */
  async storeCredentials(businessId: string, credentials: any): Promise<void> {
    const encrypted = this.encrypt(JSON.stringify(credentials));

    await this.businessGstSettingsRepository.upsert({
      business_id: businessId,
      gsp_credentials: encrypted,
    });

    this.logger.log(`Stored encrypted GSP credentials for business ${businessId}`);
  }

  /**
   * Encrypt data
   */
  private encrypt(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt data
   */
  private decrypt(encryptedText: string): any {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);

    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }
}

