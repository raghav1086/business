/**
 * Data Access Layer (DAL)
 * 
 * Shared business logic that can be used by both mobile (React Native)
 * and web (future) applications.
 * 
 * This layer provides:
 * - Repository pattern implementation
 * - Database operations
 * - Transaction management
 * - Query builders
 */

export * from './base/base-repository.interface';
export * from './base/base-repository';
export * from './base/base-entity';
export * from './base/transaction-manager';

