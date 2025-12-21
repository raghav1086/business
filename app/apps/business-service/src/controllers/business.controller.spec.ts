import { Test, TestingModule } from '@nestjs/testing';
import { BusinessController } from './business.controller';
import { BusinessService } from '../services/business.service';
import { CreateBusinessDto, UpdateBusinessDto } from '@business-app/shared/dto';
import { Business } from '../entities/business.entity';

describe('BusinessController', () => {
  let controller: BusinessController;
  let service: BusinessService;

  const mockBusiness: Business = {
    id: 'business-1',
    owner_id: 'user-1',
    name: 'Test Business',
    type: 'retailer',
    status: 'active',
    country: 'India',
    gst_type: 'regular',
    financial_year_start: 4,
    is_ecommerce_operator: false,
    created_at: new Date(),
    updated_at: new Date(),
  } as Business;

  const mockRequest = {
    user: {
      id: 'user-1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessController],
      providers: [
        {
          provide: BusinessService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByOwner: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BusinessController>(BusinessController);
    service = module.get<BusinessService>(BusinessService);
  });

  describe('create', () => {
    it('should create a business', async () => {
      const createDto: CreateBusinessDto = {
        name: 'New Business',
        type: 'retailer',
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockBusiness);

      const result = await controller.create(mockRequest as any, createDto);

      expect(service.create).toHaveBeenCalledWith('user-1', createDto);
      expect(result.id).toBe('business-1');
      expect(result.name).toBe('Test Business');
    });
  });

  describe('findAll', () => {
    it('should return all businesses for user', async () => {
      const businesses = [mockBusiness];
      jest.spyOn(service, 'findByOwner').mockResolvedValue(businesses);

      const result = await controller.findAll(mockRequest as any);

      expect(service.findByOwner).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('business-1');
    });
  });

  describe('findOne', () => {
    it('should return business by ID', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockBusiness);

      const result = await controller.findOne(mockRequest as any, 'business-1');

      expect(service.findById).toHaveBeenCalledWith('business-1', 'user-1');
      expect(result.id).toBe('business-1');
    });
  });

  describe('update', () => {
    it('should update business', async () => {
      const updateDto: UpdateBusinessDto = {
        name: 'Updated Business',
      };

      const updatedBusiness = { ...mockBusiness, name: 'Updated Business' };
      jest.spyOn(service, 'update').mockResolvedValue(updatedBusiness);

      const result = await controller.update(
        mockRequest as any,
        'business-1',
        updateDto
      );

      expect(service.update).toHaveBeenCalledWith(
        'business-1',
        'user-1',
        updateDto
      );
      expect(result.name).toBe('Updated Business');
    });
  });

  describe('remove', () => {
    it('should delete business', async () => {
      jest.spyOn(service, 'delete').mockResolvedValue(undefined);

      await controller.remove(mockRequest as any, 'business-1');

      expect(service.delete).toHaveBeenCalledWith('business-1', 'user-1');
    });
  });
});

