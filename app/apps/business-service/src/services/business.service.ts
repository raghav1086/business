import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { BusinessRepository } from '../repositories/business.repository';
import { BusinessUserRepository } from '../repositories/business-user.repository';
import { CreateBusinessDto, UpdateBusinessDto } from '@business-app/shared/dto';
import { validateGSTIN, formatGSTIN } from '@business-app/shared/utils';
import { Business } from '../entities/business.entity';
import { Role } from '@business-app/shared/constants';

/**
 * Business Service
 * 
 * Business logic layer for Business management.
 * Implements business rules and validation.
 */
@Injectable()
export class BusinessService {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly businessUserRepository: BusinessUserRepository,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Create a new business
   */
  async create(ownerId: string, createDto: CreateBusinessDto): Promise<Business> {
    // Validate GSTIN if provided
    if (createDto.gstin) {
      const formattedGstin = formatGSTIN(createDto.gstin);
      if (!validateGSTIN(formattedGstin)) {
        throw new ConflictException('Invalid GSTIN format');
      }

      // Check if GSTIN already exists
      const gstinExists = await this.businessRepository.gstinExists(formattedGstin);
      if (gstinExists) {
        throw new ConflictException('GSTIN already exists');
      }

      createDto.gstin = formattedGstin;
    }

    // Create business
    const business = await this.businessRepository.create({
      ...createDto,
      owner_id: ownerId,
      status: 'active',
    });

    // Automatically create business_user record for owner with full permissions
    // permissions = null means use all role permissions (full access by default)
    await this.businessUserRepository.create({
      business_id: business.id,
      user_id: ownerId,
      role: Role.OWNER,
      permissions: null, // NULL = use all role permissions (full access)
      status: 'active',
      joined_at: new Date(),
    });

    return business;
  }

  /**
   * Get business by ID
   */
  async findById(id: string, ownerId: string): Promise<Business> {
    const business = await this.businessRepository.findById(id);
    
    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    // Verify ownership
    if (business.owner_id !== ownerId) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return business;
  }

  /**
   * Get all businesses for owner
   */
  async findByOwner(ownerId: string): Promise<Business[]> {
    return this.businessRepository.findByOwner(ownerId);
  }

  /**
   * Get all businesses (superadmin only)
   */
  async findAll(): Promise<Business[]> {
    return this.businessRepository.findAll();
  }

  /**
   * Get all businesses with owner details (superadmin only)
   * Fetches businesses and enriches them with owner information from auth-service
   */
  async findAllWithOwners(authToken?: string): Promise<Array<Business & {
    owner?: {
      id: string;
      name?: string;
      phone: string;
      email?: string;
      last_login_at?: Date;
      total_businesses: number;
    };
  }>> {
    // Fetch all businesses
    const businesses = await this.businessRepository.findAll();
    
    if (!authToken || businesses.length === 0) {
      return businesses.map(b => ({ ...b, owner: undefined }));
    }

    // Get unique owner IDs
    const ownerIds = [...new Set(businesses.map(b => b.owner_id))];
    
    // Batch fetch owner details from auth-service
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3002');
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    };

    const ownerDetailsMap = new Map<string, any>();
    const ownerBusinessCountsMap = new Map<string, number>();

    try {
      // Fetch owner details in batches (to avoid too many requests)
      const batchSize = 50;
      for (let i = 0; i < ownerIds.length; i += batchSize) {
        const batch = ownerIds.slice(i, i + batchSize);
        
        // Fetch each owner's details
        const ownerPromises = batch.map(async (ownerId) => {
          try {
            const response = await firstValueFrom(
              this.httpService.get(`${authServiceUrl}/api/v1/users/${ownerId}`, { headers })
            );
            return { id: ownerId, data: response.data };
          } catch (error) {
            console.warn(`Failed to fetch owner ${ownerId}:`, error);
            return null;
          }
        });

        const ownerResults = await Promise.allSettled(ownerPromises);
        
        ownerResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            const { id, data } = result.value;
            ownerDetailsMap.set(id, data);
          }
        });
      }

      // Count businesses per owner
      businesses.forEach(business => {
        const count = ownerBusinessCountsMap.get(business.owner_id) || 0;
        ownerBusinessCountsMap.set(business.owner_id, count + 1);
      });

      // Enrich businesses with owner details
      return businesses.map(business => {
        const ownerData = ownerDetailsMap.get(business.owner_id);
        const totalBusinesses = ownerBusinessCountsMap.get(business.owner_id) || 0;

        if (ownerData) {
          return {
            ...business,
            owner: {
              id: ownerData.id,
              name: ownerData.name,
              phone: ownerData.phone,
              email: ownerData.email,
              last_login_at: ownerData.last_login_at,
              total_businesses: totalBusinesses,
            },
          };
        }

        return { ...business, owner: undefined };
      });
    } catch (error) {
      console.warn('Failed to fetch owner details from auth-service:', error);
      // Return businesses without owner details if fetch fails
      return businesses.map(b => ({ ...b, owner: undefined }));
    }
  }

  /**
   * Get system statistics (superadmin only)
   */
  async getSystemStats(authToken?: string): Promise<{
    totalBusinesses: number;
    activeBusinesses: number;
    inactiveBusinesses: number;
    totalUsers: number;
    activeUsers: number;
    businessesGrowth: Array<{ month: string; count: number }>;
    usersGrowth: Array<{ month: string; count: number }>;
    businessTypeDistribution: Array<{ type: string; count: number }>;
    userTypeDistribution: Array<{ type: string; count: number }>;
    recentBusinesses: number;
    recentUsers: number;
  }> {
    const totalBusinesses = await this.businessRepository.countAll();
    const activeBusinesses = await this.businessRepository.countByStatus('active');
    const inactiveBusinesses = await this.businessRepository.countByStatus('inactive');
    
    // Get growth data (last 6 months)
    const businessesGrowth = await this.businessRepository.getMonthlyCounts(6);
    const businessTypeDistribution = await this.businessRepository.getByTypeDistribution();
    
    // Recent businesses (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentBusinesses = await this.businessRepository.countByDateRange(
      sevenDaysAgo,
      new Date()
    );
    
    // Fetch user stats from auth-service
    let totalUsers = 0;
    let activeUsers = 0;
    let usersGrowth: Array<{ month: string; count: number }> = [];
    let userTypeDistribution: Array<{ type: string; count: number }> = [];
    let recentUsers = 0;
    
    if (authToken) {
      try {
        const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3002');
        const headers = {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        };
        
        // Fetch user stats in parallel
        const results = await Promise.allSettled([
          firstValueFrom(this.httpService.get(`${authServiceUrl}/api/v1/users/admin/count`, { headers })),
          firstValueFrom(this.httpService.get(`${authServiceUrl}/api/v1/users/admin/stats/active`, { headers })),
          firstValueFrom(this.httpService.get(`${authServiceUrl}/api/v1/users/admin/stats/growth`, { headers })),
          firstValueFrom(this.httpService.get(`${authServiceUrl}/api/v1/users/admin/stats/distribution`, { headers })),
          firstValueFrom(this.httpService.get(`${authServiceUrl}/api/v1/users/admin/stats/recent`, { headers })),
        ]);
        
        const [countRes, activeRes, growthRes, typeRes, recentRes] = results;
        
        if (countRes.status === 'fulfilled') {
          totalUsers = (countRes.value as any)?.data?.count || 0;
        }
        if (activeRes.status === 'fulfilled') {
          activeUsers = (activeRes.value as any)?.data?.count || 0;
        }
        if (growthRes.status === 'fulfilled') {
          usersGrowth = (growthRes.value as any)?.data || [];
        }
        if (typeRes.status === 'fulfilled') {
          userTypeDistribution = (typeRes.value as any)?.data || [];
        }
        if (recentRes.status === 'fulfilled') {
          recentUsers = (recentRes.value as any)?.data?.count || 0;
        }
      } catch (error) {
        // Silently fail - user stats are optional
        console.warn('Failed to fetch user stats from auth-service:', error);
      }
    }
    
    return {
      totalBusinesses,
      activeBusinesses,
      inactiveBusinesses,
      totalUsers,
      activeUsers,
      businessesGrowth,
      usersGrowth,
      businessTypeDistribution,
      userTypeDistribution,
      recentBusinesses,
      recentUsers,
    };
  }

  /**
   * Update business
   */
  async update(
    id: string,
    ownerId: string,
    updateDto: UpdateBusinessDto
  ): Promise<Business> {
    // Verify business exists and ownership
    await this.findById(id, ownerId);

    // Validate GSTIN if provided
    if (updateDto.gstin) {
      const formattedGstin = formatGSTIN(updateDto.gstin);
      if (!validateGSTIN(formattedGstin)) {
        throw new ConflictException('Invalid GSTIN format');
      }

      // Check if GSTIN already exists (excluding current business)
      const gstinExists = await this.businessRepository.gstinExists(formattedGstin, id);
      if (gstinExists) {
        throw new ConflictException('GSTIN already exists');
      }

      updateDto.gstin = formattedGstin;
    }

    // Update business
    return this.businessRepository.update(id, updateDto);
  }

  /**
   * Delete business (soft delete)
   */
  async delete(id: string, ownerId: string): Promise<void> {
    // Verify business exists and ownership
    await this.findById(id, ownerId);

    // Soft delete
    await this.businessRepository.delete(id);
  }

  /**
   * Search businesses by name
   */
  async search(ownerId: string, searchTerm: string): Promise<Business[]> {
    return this.businessRepository.searchByName(ownerId, searchTerm);
  }
}

