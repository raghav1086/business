import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartyRepository } from './party.repository';
import { Party } from '../entities/party.entity';

describe('PartyRepository', () => {
  let repository: PartyRepository;
  let typeOrmRepository: Repository<Party>;

  const mockParty: Party = {
    id: 'party-1',
    business_id: 'business-1',
    name: 'Test Customer',
    type: 'customer',
    status: 'active',
    opening_balance: 0,
    opening_balance_type: 'credit',
    shipping_same_as_billing: true,
    created_at: new Date(),
    updated_at: new Date(),
  } as Party;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartyRepository,
        {
          provide: getRepositoryToken(Party),
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

    repository = module.get<PartyRepository>(PartyRepository);
    typeOrmRepository = module.get<Repository<Party>>(
      getRepositoryToken(Party)
    );
  });

  describe('findByBusinessId', () => {
    it('should find all parties for business', async () => {
      const parties = [mockParty];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(parties);

      const result = await repository.findByBusinessId('business-1');

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { business_id: 'business-1', status: 'active' },
        order: { name: 'ASC' },
      });
      expect(result).toEqual(parties);
    });
  });

  describe('findByBusinessIdAndType', () => {
    it('should find parties by type', async () => {
      const parties = [mockParty];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(parties);

      const result = await repository.findByBusinessIdAndType(
        'business-1',
        'customer'
      );

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          business_id: 'business-1',
          type: 'customer',
          status: 'active',
        },
        order: { name: 'ASC' },
      });
      expect(result).toEqual(parties);
    });
  });

  describe('searchByName', () => {
    it('should search parties by name', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockParty]),
      };
      jest
        .spyOn(typeOrmRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await repository.searchByName('business-1', 'Test');

      expect(result).toEqual([mockParty]);
      expect(queryBuilder.where).toHaveBeenCalled();
    });
  });
});

