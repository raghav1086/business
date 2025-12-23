import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ItemController } from './controllers/item.controller';
import { StockController } from './controllers/stock.controller';
import { HealthController } from './controllers/health.controller';
import { ItemService } from './services/item.service';
import { StockService } from './services/stock.service';
import { ItemRepository } from './repositories/item.repository';
import { CategoryRepository } from './repositories/category.repository';
import { UnitRepository } from './repositories/unit.repository';
import { StockAdjustmentRepository } from './repositories/stock-adjustment.repository';
import { Item } from './entities/item.entity';
import { Category } from './entities/category.entity';
import { Unit } from './entities/unit.entity';
import { StockAdjustment } from './entities/stock-adjustment.entity';

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
        database: configService.get('INVENTORY_DB_NAME', 'inventory_db'),
        entities: [Item, Category, Unit, StockAdjustment],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Item, Category, Unit, StockAdjustment]),
  ],
  controllers: [ItemController, StockController, HealthController],
  providers: [
    ItemService,
    StockService,
    ItemRepository,
    CategoryRepository,
    UnitRepository,
    StockAdjustmentRepository,
  ],
})
export class AppModule {}

