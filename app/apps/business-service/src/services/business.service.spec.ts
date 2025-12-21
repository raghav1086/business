import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessRepository } from '../repositories/business.repository';
import { CreateBusinessDto, UpdateBusinessDto } from '@business-app/shared/dto';
import { Business } from '../entities/business.entity';

describe('BusinessService', () => {
  let service: BusinessService;
  let repository: BusinessRepository;

  const mockBusiness: Business = {
    id: 'business-1',
    owner_id: 'user-1',
    name: 'Test Business',
    type: 'retailer',
    gstin: '29AAACB1234A1Z5',
    status: 'active',
    country: 'India',
    gst_type: 'regular',
    financial_year_start: 4,
    is_ecommerce_operator: false,
    created_at: new Date(),
    updated_at: new Date(),
  } as Business;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessService,
        {
          provide: BusinessRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByOwner: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            searchByName: jest.fn(),
            gstinExists: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
    repository = module.get<BusinessRepository>(BusinessRepository);
  });

  describe('create', () => {
    it('should create a business successfully', async () => {
      const createDto: CreateBusinessDto = {
        name: 'New Business',
        type: 'retailer',
      };

      jest.spyOn(repository, 'create').mockResolvedValue(mockBusiness);

      const result = await service.create('user-1', createDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        owner_id: 'user-1',
        status: 'active',
      });
      expect(result).toEqual(mockBusiness);
    });

    it('should validate and format GSTIN if provided', async () => {
      const createDto: CreateBusinessDto = {
        name: 'New Business',
        gstin: '29aaacb1234a1z5', // lowercase, will be formatted
      };

      jest.spyOn(repository, 'gstinExists').mockResolvedValue(false);
      jest.spyOn(repository, 'create').mockResolvedValue(mockBusiness);

      await service.create('user-1', createDto);

      expect(repository.gstinExists).toHaveBeenCalledWith('29AAACB1234A1Z5');
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gstin: '29AAACB1234A1Z5',
        })
      );
    });

    it('should throw ConflictException if GSTIN is invalid', async () => {
      const createDto: CreateBusinessDto = {
        name: 'New Business',
        gstin: 'INVALID_GSTIN',
      };

      await expect(service.create('user-1', createDto)).rejects.toThrow(
        ConflictException
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if GSTIN already exists', async () => {
      const createDto: CreateBusinessDto = {
        name: 'New Business',
        gstin: '29AAACB1234A1Z5',
      };

      jest.spyOn(repository, 'gstinExists').mockResolvedValue(true);

      await expect(service.create('user-1', createDto)).rejects.toThrow(
        ConflictException
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return business if found and owned by user', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockBusiness);

      const result = await service.findById('business-1', 'user-1');

      expect(result).toEqual(mockBusiness);
    });

    it('should throw NotFoundException if business not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.findById('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException if business owned by different user', async () => {
      const otherBusiness = { ...mockBusiness, owner_id: 'user-2' };
      jest.spyOn(repository, 'findById').mockResolvedValue(otherBusiness);

      await expect(service.findById('business-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findByOwner', () => {
    it('should return all businesses for owner', async () => {
      const businesses = [mockBusiness];
      jest.spyOn(repository, 'findByOwner').mockResolvedValue(businesses);

      const result = await service.findByOwner('user-1');

      expect(repository.findByOwner).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(businesses);
    });
  });

  describe('update', () => {
    it('should update business successfully', async () => {
      const updateDto: UpdateBusinessDto = {
        name: 'Updated Business',
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(mockBusiness);
      jest.spyOn(repository, 'update').mockResolvedValue({
        ...mockBusiness,
        ...updateDto,
      } as Business);

      const result = await service.update('business-1', 'user-1', updateDto);

      expect(repository.update).toHaveBeenCalledWith('business-1', updateDto);
      expect(result.name).toBe('Updated Business');
    });

    it('should validate GSTIN if provided in update', async () => {
      const updateDto: UpdateBusinessDto = {
        gstin: '29AAACB1234A1Z5',
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(mockBusiness);
      jest.spyOn(repository, 'gstinExists').mockResolvedValue(false);
      jest.spyOn(repository, 'update').mockResolvedValue(mockBusiness);

      await service.update('business-1', 'user-1', updateDto);

      expect(repository.gstinExists).toHaveBeenCalledWith(
        '29AAACB1234A1Z5',
        'business-1'
      );
    });

    it('should throw ConflictException if updated GSTIN already exists', async () => {
      const updateDto: UpdateBusinessDto = {
        gstin: '29AAACB1234A1Z5',
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(mockBusiness);
      jest.spyOn(repository, 'gstinExists').mockResolvedValue(true);

      await expect(
        service.update('business-1', 'user-1', updateDto)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete business successfully', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockBusiness);
      jest.spyOn(repository, 'delete').mockResolvedValue(undefined);

      await service.delete('business-1', 'user-1');

      expect(repository.delete).toHaveBeenCalledWith('business-1');
    });

    it('should throw NotFoundException if business not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.delete('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('search', () => {
    it('should search businesses by name', async () => {
      const businesses = [mockBusiness];
      jest.spyOn(repository, 'searchByName').mockResolvedValue(businesses);

      const result = await service.search('user-1', 'Test');

      expect(repository.searchByName).toHaveBeenCalledWith('user-1', 'Test');
      expect(result).toEqual(businesses);
    });
  });
});

