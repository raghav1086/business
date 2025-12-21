import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PartyController } from './controllers/party.controller';
import { PartyService } from './services/party.service';
import { PartyLedgerService } from './services/party-ledger.service';
import { PartyRepository } from './repositories/party.repository';
import { Party } from './entities/party.entity';

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
        database: configService.get('PARTY_DB_NAME', 'business_db'),
        entities: [Party],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Party]),
  ],
  controllers: [PartyController],
  providers: [PartyService, PartyLedgerService, PartyRepository],
})
export class AppModule {}

