import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BusinessUserService } from './business-user.service';
import { BusinessUserRepository } from '../repositories/business-user.repository';
import { BusinessRepository } from '../repositories/business.repository';
import { AuditService } from './audit.service';
import { Role } from '@business-app/shared/constants';
import { Business } from '../entities/business.entity';
import { BusinessUser } from '../entities/business-user.entity';

describe('BusinessUserService', () => {
  let service: BusinessUserService;
  let businessUserRepository: jest.Mocked<BusinessUserRepository>;
  let businessRepository: jest.Mocked<BusinessRepository>;
  let auditService: jest.Mocked<AuditService>;

  const mockBusiness: Business = {
    id: 'business-1',
    owner_id: 'owner-1',
    name: 'Test Business',
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
      create: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
    };

    const mockBusinessRepo = {
      findById: jest.fn(),
    };

    const mockAuditService = {
      logPermissionChange: jest.fn(),
      logRoleChange: jest.fn(),
      logUserAssignment: jest.fn(),
      logUserRemoval: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessUserService,
        {
          provide: BusinessUserRepository,
          useValue: mockBusinessUserRepo,
        },
        {
          provide: BusinessRepository,
          useValue: mockBusinessRepo,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<BusinessUserService>(BusinessUserService);
    businessUserRepository = module.get(BusinessUserRepository);
    businessRepository = module.get(BusinessRepository);
    auditService = module.get(AuditService);
  });

  describe('assignUserToBusiness', () => {
    it('should throw NotFoundException if business does not exist', async () => {
      businessRepository.findById.mockResolvedValue(null);

      await expect(
        service.assignUserToBusiness('business-1', 'user-1', Role.ADMIN, 'admin-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should create new assignment with null permissions', async () => {
      businessRepository.findById.mockResolvedValue(mockBusiness);
      businessUserRepository.findByBusinessAndUser.mockResolvedValue(null);
      businessUserRepository.create.mockResolvedValue(mockBusinessUser);

      const result = await service.assignUserToBusiness(
        'business-1',
        'user-1',
        Role.ADMIN,
        'admin-1'
      );

      expect(result).toBe(mockBusinessUser);
      expect(businessUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          business_id: 'business-1',
          user_id: 'user-1',
          role: Role.ADMIN,
          permissions: null, // Full access by default
          status: 'active',
        })
      );
      expect(auditService.logUserAssignment).toHaveBeenCalled();
    });

    it('should update existing assignment and reset permissions', async () => {
      businessRepository.findById.mockResolvedValue(mockBusiness);
      businessUserRepository.findByBusinessAndUser.mockResolvedValue(mockBusinessUser);
      businessUserRepository.update.mockResolvedValue({
        ...mockBusinessUser,
        role: Role.EMPLOYEE,
      });

      const result = await service.assignUserToBusiness(
        'business-1',
        'user-1',
        Role.EMPLOYEE,
        'admin-1'
      );

      expect(result.role).toBe(Role.EMPLOYEE);
      expect(businessUserRepository.update).toHaveBeenCalledWith(
        'bu-1',
        expect.objectContaining({
          role: Role.EMPLOYEE,
          permissions: null, // Reset to full access
        })
      );
      expect(auditService.logRoleChange).toHaveBeenCalled();
    });

    it('should reactivate removed user', async () => {
      const removedUser = { ...mockBusinessUser, status: 'removed' };
      businessRepository.findById.mockResolvedValue(mockBusiness);
      businessUserRepository.findByBusinessAndUser.mockResolvedValue(removedUser);
      businessUserRepository.update.mockResolvedValue({
        ...removedUser,
        status: 'active',
      });

      const result = await service.assignUserToBusiness(
        'business-1',
        'user-1',
        Role.ADMIN,
        'admin-1'
      );

      expect(result.status).toBe('active');
      expect(businessUserRepository.update).toHaveBeenCalledWith(
        'bu-1',
        expect.objectContaining({
          status: 'active',
          removed_at: null,
          removed_by: null,
        })
      );
    });
  });

  describe('updateUserPermissions', () => {
    it('should throw NotFoundException if user not assigned', async () => {
      businessUserRepository.findByBusinessAndUser.mockResolvedValue(null);

      await expect(
        service.updateUserPermissions('business-1', 'user-1', {})
      ).rejects.toThrow(NotFoundException);
    });

    it('should update permissions and log change', async () => {
      businessUserRepository.findByBusinessAndUser.mockResolvedValue(mockBusinessUser);
      businessUserRepository.update.mockResolvedValue({
        ...mockBusinessUser,
        permissions: { 'invoice:delete': false },
      });

      const newPermissions = { 'invoice:delete': false };
      const result = await service.updateUserPermissions(
        'business-1',
        'user-1',
        newPermissions
      );

      expect(result.permissions).toEqual(newPermissions);
      expect(auditService.logPermissionChange).toHaveBeenCalledWith(
        'business-1',
        'user-1',
        null,
        newPermissions,
        'system',
        undefined
      );
    });

    it('should reset permissions to null', async () => {
      const userWithPermissions = {
        ...mockBusinessUser,
        permissions: { 'invoice:delete': false },
      };
      businessUserRepository.findByBusinessAndUser.mockResolvedValue(userWithPermissions);
      businessUserRepository.update.mockResolvedValue({
        ...userWithPermissions,
        permissions: null,
      });

      const result = await service.updateUserPermissions(
        'business-1',
        'user-1',
        null
      );

      expect(result.permissions).toBeNull();
      expect(auditService.logPermissionChange).toHaveBeenCalled();
    });
  });

  describe('removeUserFromBusiness', () => {
    it('should throw NotFoundException if business not found', async () => {
      businessRepository.findById.mockResolvedValue(null);

      await expect(
        service.removeUserFromBusiness('business-1', 'user-1', 'admin-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if trying to remove owner', async () => {
      businessRepository.findById.mockResolvedValue(mockBusiness);

      await expect(
        service.removeUserFromBusiness('business-1', 'owner-1', 'admin-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should remove user and log removal', async () => {
      businessRepository.findById.mockResolvedValue(mockBusiness);
      businessUserRepository.findByBusinessAndUser.mockResolvedValue(mockBusinessUser);
      businessUserRepository.update.mockResolvedValue({
        ...mockBusinessUser,
        status: 'removed',
      });

      await service.removeUserFromBusiness('business-1', 'user-1', 'admin-1');

      expect(businessUserRepository.update).toHaveBeenCalledWith(
        'bu-1',
        expect.objectContaining({
          status: 'removed',
        })
      );
      expect(auditService.logUserRemoval).toHaveBeenCalled();
    });
  });
});

