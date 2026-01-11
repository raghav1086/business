import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { BusinessController } from './controllers/business.controller';
import { HealthController } from './controllers/health.controller';
import { BusinessUserController } from './controllers/business-user.controller';
import { UserBusinessController } from './controllers/user-business.controller';
import { PermissionsController } from './controllers/permissions.controller';
import { AuditLogController } from './controllers/audit-log.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { ExportController } from './controllers/export.controller';
import { BusinessService } from './services/business.service';
import { BusinessUserService } from './services/business-user.service';
import { BusinessContextService } from './services/business-context.service';
import { AnalyticsService } from './services/analytics.service';
import { ExportService } from './services/export.service';
import { BusinessRepository } from './repositories/business.repository';
import { BusinessUserRepository } from './repositories/business-user.repository';
import { Business } from './entities/business.entity';
import { BusinessUser } from './entities/business-user.entity';
import { AuditLog } from './entities/audit-log.entity';
import { AuthGuard } from './guards/auth.guard';
import { BusinessContextGuard } from './guards/business-context.guard';
import { AuditService } from './services/audit.service';
import { AuditLogRepository } from './repositories/audit-log.repository';

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
    HttpModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('BUSINESS_DB_NAME', 'business_db'),
        entities: [Business, BusinessUser, AuditLog],
        synchronize: configService.get('NODE_ENV') !== 'production' || 
                     configService.get('ENABLE_SYNC') === 'true',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Business, BusinessUser, AuditLog]),
  ],
  controllers: [
    BusinessController,
    HealthController,
    BusinessUserController,
    UserBusinessController,
    PermissionsController,
    AuditLogController,
    AnalyticsController,
    ExportController,
  ],
  providers: [
    BusinessService,
    BusinessUserService,
    BusinessContextService,
    AuditService,
    AnalyticsService,
    ExportService,
    BusinessRepository,
    BusinessUserRepository,
    AuditLogRepository,
    AuthGuard,
    BusinessContextGuard,
  ],
  exports: [
    BusinessContextService,
    BusinessUserService,
    BusinessContextGuard,
  ],
})
export class AppModule {}

