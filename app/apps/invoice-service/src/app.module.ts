import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InvoiceController } from './controllers/invoice.controller';
import { HealthController } from './controllers/health.controller';
import { InvoiceService } from './services/invoice.service';
import { GstCalculationService } from './services/gst-calculation.service';
import { InvoiceRepository } from './repositories/invoice.repository';
import { InvoiceItemRepository } from './repositories/invoice-item.repository';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoiceSettings } from './entities/invoice-settings.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('INVOICE_DB_NAME', 'business_db'),
        entities: [Invoice, InvoiceItem, InvoiceSettings],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Invoice, InvoiceItem, InvoiceSettings]),
  ],
  controllers: [InvoiceController, HealthController],
  providers: [
    InvoiceService,
    InvoiceRepository,
    InvoiceItemRepository,
  ],
})
export class AppModule {}

