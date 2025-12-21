import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { IBaseRepository } from './base-repository.interface';

/**
 * Base Repository Implementation
 * 
 * Provides common CRUD operations for all repositories.
 * Extend this class for specific entity repositories.
 */
export abstract class BaseRepository<T> implements IBaseRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async create(entity: Partial<T>): Promise<T> {
    const newEntity = this.repository.create(entity as any);
    return this.repository.save(newEntity as any) as Promise<T>;
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as any,
    } as FindManyOptions<T>);
  }

  async findAll(filters?: Record<string, any>): Promise<T[]> {
    const options: FindManyOptions<T> = {};
    
    if (filters) {
      options.where = filters as FindOptionsWhere<T>;
    }
    
    return this.repository.find(options);
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    await this.repository.update(id, updates as any);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Entity with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    // Soft delete - update status field
    await this.repository.update(id, { status: 'deleted' } as any);
  }

  async count(filters?: Record<string, any>): Promise<number> {
    if (filters) {
      return this.repository.count({
        where: filters as FindOptionsWhere<T>,
      } as FindManyOptions<T>);
    }
    return this.repository.count();
  }
}

