import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PartyController } from './controllers/party.controller';
import { HealthController } from './controllers/health.controller';
import { PartyService } from './services/party.service';
import { PartyLedgerService } from './services/party-ledger.service';
import { PartyRepository } from './repositories/party.repository';
import { Party } from './entities/party.entity';
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
        database: configService.get('PARTY_DB_NAME', 'party_db'),
        entities: [Party],
        synchronize: configService.get('NODE_ENV') !== 'production' || 
                     configService.get('ENABLE_SYNC') === 'true',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Party]),
  ],
  controllers: [PartyController, HealthController],
  providers: [PartyService, PartyLedgerService, PartyRepository, AuthGuard],
})
export class AppModule {}

