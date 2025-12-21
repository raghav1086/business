import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessRepository } from './business.repository';
import { Business } from '../entities/business.entity';

describe('BusinessRepository', () => {
  let repository: BusinessRepository;
  let typeOrmRepository: Repository<Business>;

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
        BusinessRepository,
        {
          provide: getRepositoryToken(Business),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<BusinessRepository>(BusinessRepository);
    typeOrmRepository = module.get<Repository<Business>>(
      getRepositoryToken(Business)
    );
  });

  describe('create', () => {
    it('should create a new business', async () => {
      const newBusiness = { name: 'New Business', owner_id: 'user-1' };
      
      jest.spyOn(typeOrmRepository, 'create').mockReturnValue(mockBusiness as Business);
      jest.spyOn(typeOrmRepository, 'save').mockResolvedValue(mockBusiness);

      const result = await repository.create(newBusiness);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(newBusiness);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockBusiness);
      expect(result).toEqual(mockBusiness);
    });
  });

  describe('findById', () => {
    it('should find business by ID', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(mockBusiness);

      const result = await repository.findById('business-1');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'business-1' },
      });
      expect(result).toEqual(mockBusiness);
    });

    it('should return null if business not found', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByOwner', () => {
    it('should find all businesses for an owner', async () => {
      const businesses = [mockBusiness];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(businesses);

      const result = await repository.findByOwner('user-1');

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { owner_id: 'user-1', status: 'active' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(businesses);
    });
  });

  describe('findByGSTIN', () => {
    it('should find business by GSTIN', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(mockBusiness);

      const result = await repository.findByGSTIN('29AAACB1234A1Z5');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { gstin: '29AAACB1234A1Z5', status: 'active' },
      });
      expect(result).toEqual(mockBusiness);
    });
  });

  describe('gstinExists', () => {
    it('should return true if GSTIN exists', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      jest.spyOn(typeOrmRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await repository.gstinExists('29AAACB1234A1Z5');

      expect(result).toBe(true);
    });

    it('should return false if GSTIN does not exist', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      jest.spyOn(typeOrmRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await repository.gstinExists('29AAACB1234A1Z5');

      expect(result).toBe(false);
    });

    it('should exclude specified ID when checking', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      jest.spyOn(typeOrmRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      await repository.gstinExists('29AAACB1234A1Z5', 'business-1');

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'business.id != :excludeId',
        { excludeId: 'business-1' }
      );
    });
  });
});

