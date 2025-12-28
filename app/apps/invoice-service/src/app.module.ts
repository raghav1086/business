import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { InvoiceController } from './controllers/invoice.controller';
import { HealthController } from './controllers/health.controller';
import { InvoiceService } from './services/invoice.service';
import { GstCalculationService } from './services/gst-calculation.service';
import { InvoiceRepository } from './repositories/invoice.repository';
import { InvoiceItemRepository } from './repositories/invoice-item.repository';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoiceSettings } from './entities/invoice-settings.entity';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default-secret'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('INVOICE_DB_NAME', 'invoice_db'),
        entities: [Invoice, InvoiceItem, InvoiceSettings],
        synchronize: configService.get('NODE_ENV') !== 'production' || 
                     configService.get('ENABLE_SYNC') === 'true',
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
    AuthGuard,
  ],
})
export class AppModule {}

