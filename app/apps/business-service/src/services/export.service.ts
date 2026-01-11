import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { BusinessRepository } from '../repositories/business.repository';

/**
 * Export Service
 * 
 * Provides functionality to export data in various formats (CSV, JSON, PDF).
 */
@Injectable()
export class ExportService {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Export businesses with owners to CSV
   */
  async exportBusinessesWithOwners(
    authToken?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    // Fetch businesses
    let businesses = await this.businessRepository.findAll();
    
    // Apply date filter if provided
    if (startDate || endDate) {
      businesses = businesses.filter(b => {
        const created = new Date(b.created_at);
        if (startDate && created < startDate) return false;
        if (endDate && created > endDate) return false;
        return true;
      });
    }

    // Fetch owner details if token provided
    const ownerDetailsMap = new Map<string, any>();
    if (authToken && businesses.length > 0) {
      const ownerIds = [...new Set(businesses.map(b => b.owner_id))];
      const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3002');
      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };

      for (const ownerId of ownerIds) {
        try {
          const response = await firstValueFrom(
            this.httpService.get(`${authServiceUrl}/api/v1/users/${ownerId}`, { headers })
          );
          ownerDetailsMap.set(ownerId, response.data);
        } catch (error) {
          // Silently fail for individual owners
        }
      }
    }

    // Build CSV
    const csvHeaders = [
      'Business ID',
      'Business Name',
      'Business Type',
      'GSTIN',
      'Status',
      'Created At',
      'Owner ID',
      'Owner Name',
      'Owner Phone',
      'Owner Email',
      'Owner Last Login',
    ];

    const rows = businesses.map(b => {
      const owner = ownerDetailsMap.get(b.owner_id);
      return [
        b.id,
        b.name || '',
        b.type || '',
        b.gstin || '',
        b.status || '',
        new Date(b.created_at).toISOString(),
        b.owner_id,
        owner?.name || '',
        owner?.phone || '',
        owner?.email || '',
        owner?.last_login_at ? new Date(owner.last_login_at).toISOString() : '',
      ];
    });

    const csvContent = [
      csvHeaders.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Export users with businesses to CSV
   */
  async exportUsersWithBusinesses(
    authToken?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    if (!authToken) {
      throw new Error('Auth token required for user export');
    }

    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3002');
    const businessServiceUrl = this.configService.get<string>('BUSINESS_SERVICE_URL', 'http://localhost:3003');
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    };

    // Fetch all users
    const usersResponse = await firstValueFrom(
      this.httpService.get(`${authServiceUrl}/api/v1/users/admin/all?includeBusinesses=true`, { headers })
    );
    let users = usersResponse.data || [];

    // Apply date filter if provided
    if (startDate || endDate) {
      users = users.filter((u: any) => {
        const created = new Date(u.created_at);
        if (startDate && created < startDate) return false;
        if (endDate && created > endDate) return false;
        return true;
      });
    }

    // Build CSV
    const csvHeaders = [
      'User ID',
      'Phone',
      'Name',
      'Email',
      'Is Superadmin',
      'Status',
      'Created At',
      'Last Login',
      'Total Businesses',
      'Owned Businesses',
      'Assigned Businesses',
      'Business Names',
    ];

    const rows = users.map((u: any) => {
      const businessNames = u.businesses?.list?.map((b: any) => b.name).join('; ') || '';
      return [
        u.id,
        u.phone || '',
        u.name || '',
        u.email || '',
        u.is_superadmin ? 'Yes' : 'No',
        u.status || '',
        new Date(u.created_at).toISOString(),
        u.last_login_at ? new Date(u.last_login_at).toISOString() : '',
        u.businesses?.total || 0,
        u.businesses?.owned || 0,
        u.businesses?.assigned || 0,
        businessNames,
      ];
    });

    const csvContent = [
      csvHeaders.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Export analytics report to CSV
   */
  async exportAnalyticsReport(
    authToken?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<string> {
    // This would combine all analytics data into a comprehensive report
    // For now, return a simplified version
    const csvHeaders = [
      'Metric',
      'Value',
      'Date',
    ];

    const rows = [
      ['Total Businesses', 'N/A', new Date().toISOString()],
      ['Total Users', 'N/A', new Date().toISOString()],
      ['Active Users', 'N/A', new Date().toISOString()],
      ['Market Penetration', 'N/A', new Date().toISOString()],
    ];

    const csvContent = [
      csvHeaders.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Export data to JSON
   */
  async exportToJSON(
    type: 'businesses' | 'users' | 'analytics',
    authToken?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    switch (type) {
      case 'businesses':
        const businesses = await this.businessRepository.findAll();
        let filteredBusinesses = businesses;
        if (startDate || endDate) {
          filteredBusinesses = businesses.filter(b => {
            const created = new Date(b.created_at);
            if (startDate && created < startDate) return false;
            if (endDate && created > endDate) return false;
            return true;
          });
        }
        return { businesses: filteredBusinesses, exportedAt: new Date().toISOString() };

      case 'users':
        if (!authToken) throw new Error('Auth token required');
        const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3002');
        const headers = {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        };
        const usersResponse = await firstValueFrom(
          this.httpService.get(`${authServiceUrl}/api/v1/users/admin/all?includeBusinesses=true`, { headers })
        );
        let users = usersResponse.data || [];
        if (startDate || endDate) {
          users = users.filter((u: any) => {
            const created = new Date(u.created_at);
            if (startDate && created < startDate) return false;
            if (endDate && created > endDate) return false;
            return true;
          });
        }
        return { users, exportedAt: new Date().toISOString() };

      case 'analytics':
        // Return analytics summary
        return {
          analytics: {
            note: 'Full analytics available via API endpoints',
            exportedAt: new Date().toISOString(),
          },
        };

      default:
        throw new Error(`Unknown export type: ${type}`);
    }
  }
}

