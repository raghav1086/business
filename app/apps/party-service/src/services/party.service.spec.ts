import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PartyService } from './party.service';
import { PartyRepository } from '../repositories/party.repository';
import { CreatePartyDto, UpdatePartyDto } from '@business-app/shared/dto';
import { Party } from '../entities/party.entity';

describe('PartyService', () => {
  let service: PartyService;
  let repository: PartyRepository;

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
        PartyService,
        {
          provide: PartyRepository,
          useValue: {
            create: jest.fn(),
            findByBusinessIdAndId: jest.fn(),
            findByBusinessId: jest.fn(),
            findByBusinessIdAndType: jest.fn(),
            searchByName: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PartyService>(PartyService);
    repository = module.get<PartyRepository>(PartyRepository);
  });

  describe('create', () => {
    it('should create a party successfully', async () => {
      const createDto: CreatePartyDto = {
        name: 'New Customer',
        type: 'customer',
      };

      jest.spyOn(repository, 'create').mockResolvedValue(mockParty);

      const result = await service.create('business-1', createDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          business_id: 'business-1',
          status: 'active',
        })
      );
      expect(result).toEqual(mockParty);
    });

    it('should validate and format GSTIN if provided', async () => {
      const createDto: CreatePartyDto = {
        name: 'New Customer',
        type: 'customer',
        gstin: '29aaacb1234a1z5',
      };

      jest.spyOn(repository, 'create').mockResolvedValue(mockParty);

      await service.create('business-1', createDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gstin: '29AAACB1234A1Z5',
        })
      );
    });

    it('should throw ConflictException if GSTIN is invalid', async () => {
      const createDto: CreatePartyDto = {
        name: 'New Customer',
        type: 'customer',
        gstin: 'INVALID_GSTIN',
      };

      await expect(service.create('business-1', createDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('findById', () => {
    it('should return party if found', async () => {
      jest
        .spyOn(repository, 'findByBusinessIdAndId')
        .mockResolvedValue(mockParty);

      const result = await service.findById('business-1', 'party-1');

      expect(result).toEqual(mockParty);
    });

    it('should throw NotFoundException if party not found', async () => {
      jest.spyOn(repository, 'findByBusinessIdAndId').mockResolvedValue(null);

      await expect(
        service.findById('business-1', 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByBusinessId', () => {
    it('should return all parties if no type specified', async () => {
      const parties = [mockParty];
      jest.spyOn(repository, 'findByBusinessId').mockResolvedValue(parties);

      const result = await service.findByBusinessId('business-1');

      expect(result).toEqual(parties);
    });

    it('should return parties by type if specified', async () => {
      const parties = [mockParty];
      jest
        .spyOn(repository, 'findByBusinessIdAndType')
        .mockResolvedValue(parties);

      const result = await service.findByBusinessId('business-1', 'customer');

      expect(result).toEqual(parties);
    });
  });
});

