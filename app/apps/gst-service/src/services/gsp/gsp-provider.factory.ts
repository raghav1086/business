import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IGSPProvider } from '../../interfaces/gsp-provider.interface';
import { ClearTaxGSPProvider } from './cleartax-gsp-provider.service';

/**
 * GSP Provider Factory
 * 
 * Creates and manages GSP provider instances.
 */
@Injectable()
export class GSPProviderFactory {
  private readonly logger = new Logger(GSPProviderFactory.name);
  private providers: Map<string, IGSPProvider> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly clearTaxProvider: ClearTaxGSPProvider,
  ) {
    // Register available providers
    this.providers.set('cleartax', this.clearTaxProvider);
    // Add more providers here as they are implemented
  }

  /**
   * Get GSP provider instance
   */
  getProvider(providerName: string, apiUrl?: string, credentials?: any): IGSPProvider {
    const provider = this.providers.get(providerName.toLowerCase());

    if (!provider) {
      const availableProviders = Array.from(this.providers.keys()).join(', ');
      throw new BadRequestException(
        `GSP provider '${providerName}' not found. Available providers: ${availableProviders}`
      );
    }

    // Initialize provider with credentials if provided
    if (providerName.toLowerCase() === 'cleartax' && apiUrl && credentials) {
      (provider as ClearTaxGSPProvider).initialize(apiUrl, credentials);
    }

    return provider;
  }

  /**
   * Get default provider
   */
  getDefaultProvider(): IGSPProvider {
    const defaultProviderName = this.configService.get<string>('GSP_PROVIDER', 'cleartax');
    return this.getProvider(defaultProviderName);
  }

  /**
   * Register a new provider
   */
  registerProvider(name: string, provider: IGSPProvider): void {
    this.providers.set(name.toLowerCase(), provider);
    this.logger.log(`Registered GSP provider: ${name}`);
  }

  /**
   * List available providers
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

