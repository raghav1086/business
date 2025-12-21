/**
 * Database Reset Script
 * 
 * WARNING: This will delete all data!
 * Run with: npm run db:reset
 */

import { DataSource } from 'typeorm';
import { Business } from '../entities/business.entity';

async function reset() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'business_db',
    entities: [Business],
    synchronize: false,
  });

  await dataSource.initialize();

  const businessRepository = dataSource.getRepository(Business);

  // Delete all businesses
  await businessRepository.delete({});
  console.log('✓ Database reset complete!');

  await dataSource.destroy();
}

reset().catch((error) => {
  console.error('✗ Reset failed:', error);
  process.exit(1);
});

