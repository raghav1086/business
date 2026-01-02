import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BusinessContextService } from './business-context.service';
import { BusinessUserRepository } from '../repositories/business-user.repository';
import { BusinessRepository } from '../repositories/business.repository';
import { Role, Permission } from '@business-app/shared/constants';
import { Business } from '../entities/business.entity';
import { BusinessUser } from '../entities/business-user.entity';

describe('BusinessContextService', () => {
  let service: BusinessContextService;
  let businessUserRepository: jest.Mocked<BusinessUserRepository>;
  let businessRepository: jest.Mocked<BusinessRepository>;

  const mockBusiness: Business = {
    id: 'business-1',
    owner_id: 'owner-1',
    name: 'Test Business',
    gstin: '29ABCDE1234F1Z5',
    status: 'active',
  } as Business;

  const mockBusinessUser: BusinessUser = {
    id: 'bu-1',
    business_id: 'business-1',
    user_id: 'user-1',
    role: Role.ADMIN,
    permissions: null,
    status: 'active',
  } as BusinessUser;

  beforeEach(async () => {
    const mockBusinessUserRepo = {
      findByBusinessAndUser: jest.fn(),
      isUserAssigned: jest.fn(),
    };

    const mockBusinessRepo = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessContextService,
        {
          provide: BusinessUserRepository,
          useValue: mockBusinessUserRepo,
        },
        {
          provide: BusinessRepository,
          useValue: mockBusinessRepo,
        },
      ],
    }).compile();

    service = module.get<BusinessContextService>(BusinessContextService);
    businessUserRepository = module.get(BusinessUserRepository);
    businessRepository = module.get(BusinessRepository);
  });

  describe('resolveBusinessContext', () => {
    it('should return superadmin context with all permissions', async () => {
      const context = await service.resolveBusinessContext('user-1', 'business-1', true);
      
      expect(context.isSuperadmin).toBe(true);
      expect(context.role).toBe(Role.SUPERADMIN);
      expect(context.permissions.length).toBeGreaterThan(0);
      expect(context.permissions).toContain(Permission.INVOICE_CREATE);
      expect(context.permissions).toContain(Permission.INVOICE_DELETE);
    });

    it('should return owner context with all permissions', async () => {
      businessRepository.findById.mockResolvedValue(mockBusiness);
      
      const context = await service.resolveBusinessContext('owner-1', 'business-1', false);
      
      expect(context.isOwner).toBe(true);
      expect(context.role).toBe(Role.OWNER);
      expect(context.isSuperadmin).toBe(false);
      expect(context.permissions.length).toBeGreaterThan(0);
    });

    it('should return assigned user context with role permissions', async () => {
      businessRepository.findById.mockResolvedValue(mockBusiness);
      businessUserRepository.findByBusinessAndUser.mockResolvedValue(mockBusinessUser);
      
      const context = await service.resolveBusinessContext('user-1', 'business-1', false);
      
      expect(context.isOwner).toBe(false);
      expect(context.isSuperadmin).toBe(false);
      expect(context.role).toBe(Role.ADMIN);
      expect(context.businessUser).toBeDefined();
    });

    it('should throw NotFoundException if business not found', async () => {
      businessRepository.findById.mockResolvedValue(null);
      
      await expect(
        service.resolveBusinessContext('user-1', 'business-1', false)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user not assigned', async () => {
      businessRepository.findById.mockResolvedValue(mockBusiness);
      businessUserRepository.findByBusinessAndUser.mockResolvedValue(null);
      
      await expect(
        service.resolveBusinessContext('user-1', 'business-1', false)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is inactive', async () => {
      businessRepository.findById.mockResolvedValue(mockBusiness);
      businessUserRepository.findByBusinessAndUser.mockResolvedValue({
        ...mockBusinessUser,
        status: 'removed',
      });
      
      await expect(
        service.resolveBusinessContext('user-1', 'business-1', false)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('checkBusinessAccess', () => {
    it('should return true for superadmin', async () => {
      const result = await service.checkBusinessAccess('user-1', 'business-1', true);
      expect(result).toBe(true);
    });

    it('should return true for owner', async () => {
      businessRepository.findById.mockResolvedValue(mockBusiness);
      const result = await service.checkBusinessAccess('owner-1', 'business-1', false);
      expect(result).toBe(true);
    });

    it('should return true if user is assigned', async () => {
      businessRepository.findById.mockResolvedValue(mockBusiness);
      businessUserRepository.isUserAssigned.mockResolvedValue(true);
      const result = await service.checkBusinessAccess('user-1', 'business-1', false);
      expect(result).toBe(true);
    });

    it('should return false if user is not assigned', async () => {
      businessRepository.findById.mockResolvedValue(mockBusiness);
      businessUserRepository.isUserAssigned.mockResolvedValue(false);
      const result = await service.checkBusinessAccess('user-1', 'business-1', false);
      expect(result).toBe(false);
    });
  });
});

