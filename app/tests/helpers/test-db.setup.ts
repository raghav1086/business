import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Test Database Setup
 * 
 * Manages test database connections and cleanup.
 */

let testDataSource: DataSource | null = null;

/**
 * Get test database configuration
 */
export function getTestDbConfig(databaseName: string = 'business_test_db') {
  return {
    type: 'postgres' as const,
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5433', 10),
    username: process.env.TEST_DB_USERNAME || 'test',
    password: process.env.TEST_DB_PASSWORD || 'test',
    database: databaseName,
    synchronize: true, // Auto-create tables for tests
    dropSchema: false, // Don't drop schema between tests
    logging: false, // Disable logging in tests
  };
}

/**
 * Create test data source
 */
export async function createTestDataSource(
  entities: any[],
  databaseName?: string
): Promise<DataSource> {
  const config = getTestDbConfig(databaseName);
  
  const dataSource = new DataSource({
    ...config,
    entities,
  });

  testDataSource = dataSource;
  
  try {
    await dataSource.initialize();
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
  
  return dataSource;
}

/**
 * Close test data source
 */
export async function closeTestDataSource(): Promise<void> {
  if (testDataSource && testDataSource.isInitialized) {
    try {
      await testDataSource.destroy();
    } catch (error) {
      console.error('Error closing test database:', error);
    }
    testDataSource = null;
  }
}

/**
 * Clean database (truncate all tables)
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  if (!dataSource || !dataSource.isInitialized) {
    return;
  }

  try {
    const entities = dataSource.entityMetadatas;
    
    // Disable foreign key checks temporarily
    await dataSource.query('SET session_replication_role = replica;');
    
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      try {
        await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
      } catch (error) {
        // Table might not exist, continue
        console.warn(`Could not truncate table ${entity.tableName}:`, error);
      }
    }
    
    // Re-enable foreign key checks
    await dataSource.query('SET session_replication_role = DEFAULT;');
  } catch (error) {
    console.error('Error cleaning database:', error);
    // Don't throw - allow tests to continue
  }
}

/**
 * Setup test database (create tables)
 */
export async function setupTestDatabase(
  dataSource: DataSource
): Promise<void> {
  if (!dataSource || !dataSource.isInitialized) {
    return;
  }

  try {
    // Synchronize will create tables
    await dataSource.synchronize(true);
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

/**
 * Teardown test database (drop tables)
 */
export async function teardownTestDatabase(
  dataSource: DataSource
): Promise<void> {
  if (!dataSource || !dataSource.isInitialized) {
    return;
  }

  try {
    await dataSource.dropDatabase();
  } catch (error) {
    console.error('Error tearing down test database:', error);
    // Don't throw - cleanup should be best effort
  }
}
