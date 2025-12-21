/**
 * Database Seed Script
 * 
 * Run with: npm run db:seed
 */

import { DataSource } from 'typeorm';
import { Business } from '../entities/business.entity';

async function seed() {
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

  // Seed sample businesses
  const businesses = [
    {
      owner_id: 'user-1',
      name: 'Sample Retail Store',
      type: 'retailer',
      gstin: '29AAACB1234A1Z5',
      status: 'active',
      country: 'India',
      gst_type: 'regular',
      financial_year_start: 4,
      is_ecommerce_operator: false,
    },
    {
      owner_id: 'user-1',
      name: 'Sample Wholesale Business',
      type: 'wholesaler',
      gstin: '29AAACB1234A1Z6',
      status: 'active',
      country: 'India',
      gst_type: 'regular',
      financial_year_start: 4,
      is_ecommerce_operator: false,
    },
  ];

  for (const businessData of businesses) {
    const existing = await businessRepository.findOne({
      where: { gstin: businessData.gstin },
    });

    if (!existing) {
      const business = businessRepository.create(businessData);
      await businessRepository.save(business);
      console.log(`✓ Seeded business: ${business.name}`);
    } else {
      console.log(`⊘ Business already exists: ${businessData.name}`);
    }
  }

  await dataSource.destroy();
  console.log('✓ Seeding complete!');
}

seed().catch((error) => {
  console.error('✗ Seeding failed:', error);
  process.exit(1);
});

