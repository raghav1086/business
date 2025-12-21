import { DataSource, EntityManager } from 'typeorm';

/**
 * Transaction Manager
 * 
 * Provides transaction management utilities for the DAL.
 */
export class TransactionManager {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Execute a function within a transaction
   */
  async executeInTransaction<T>(
    callback: (manager: EntityManager) => Promise<T>
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

