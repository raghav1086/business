import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Swagger Configuration Utility
 * Provides consistent API documentation setup across all services
 */

export interface SwaggerConfig {
  title: string;
  description: string;
  version: string;
  tag: string;
  path?: string;
}

/**
 * Setup Swagger documentation for a service
 */
export function setupSwagger(
  app: INestApplication,
  config: SwaggerConfig
): void {
  const documentConfig = new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(config.description)
    .setVersion(config.version)
    .addTag(config.tag)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for service-to-service authentication',
      },
      'API-Key'
    )
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup(config.path || 'api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: `${config.title} - API Documentation`,
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .information-container { margin: 20px 0 }
    `,
  });

  console.log(
    `📚 Swagger documentation available at: /${config.path || 'api/docs'}`
  );
}

/**
 * Default configurations for each service
 */
export const SERVICE_CONFIGS: Record<string, SwaggerConfig> = {
  auth: {
    title: 'Authentication Service API',
    description: 'Authentication and authorization endpoints for user management, OTP verification, and token handling',
    version: '1.0.0',
    tag: 'auth',
    path: 'api/docs',
  },
  business: {
    title: 'Business Service API',
    description: 'Business profile management including GSTIN, PAN, and business details',
    version: '1.0.0',
    tag: 'business',
    path: 'api/docs',
  },
  party: {
    title: 'Party Service API',
    description: 'Customer and supplier (party) management with ledger tracking',
    version: '1.0.0',
    tag: 'party',
    path: 'api/docs',
  },
  inventory: {
    title: 'Inventory Service API',
    description: 'Item and stock management with category organization',
    version: '1.0.0',
    tag: 'inventory',
    path: 'api/docs',
  },
  invoice: {
    title: 'Invoice Service API',
    description: 'Invoice creation and management with GST calculations',
    version: '1.0.0',
    tag: 'invoice',
    path: 'api/docs',
  },
  payment: {
    title: 'Payment Service API',
    description: 'Payment recording and transaction management',
    version: '1.0.0',
    tag: 'payment',
    path: 'api/docs',
  },
};
