/**
 * Base Repository Interface
 * 
 * Defines the contract for all repositories in the Data Access Layer.
 * This interface ensures consistency across all repositories.
 */

export interface IBaseRepository<T> {
  /**
   * Create a new entity
   */
  create(entity: Partial<T>): Promise<T>;

  /**
   * Find entity by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities with optional filters
   */
  findAll(filters?: Record<string, any>): Promise<T[]>;

  /**
   * Update entity
   */
  update(id: string, updates: Partial<T>): Promise<T>;

  /**
   * Delete entity (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Count entities
   */
  count(filters?: Record<string, any>): Promise<number>;
}

