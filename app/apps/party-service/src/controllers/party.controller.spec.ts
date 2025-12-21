import { Test, TestingModule } from '@nestjs/testing';
import { PartyController } from './party.controller';
import { PartyService } from '../services/party.service';
import { PartyLedgerService } from '../services/party-ledger.service';
import { CreatePartyDto, UpdatePartyDto } from '@business-app/shared/dto';
import { Party } from '../entities/party.entity';

describe('PartyController', () => {
  let controller: PartyController;
  let partyService: PartyService;
  let ledgerService: PartyLedgerService;

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

  const mockRequest = {
    business_id: 'business-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PartyController],
      providers: [
        {
          provide: PartyService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByBusinessId: jest.fn(),
            search: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: PartyLedgerService,
          useValue: {
            getPartyLedger: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PartyController>(PartyController);
    partyService = module.get<PartyService>(PartyService);
    ledgerService = module.get<PartyLedgerService>(PartyLedgerService);
  });

  describe('create', () => {
    it('should create a party', async () => {
      const createDto: CreatePartyDto = {
        name: 'New Customer',
        type: 'customer',
      };

      jest.spyOn(partyService, 'create').mockResolvedValue(mockParty);

      const result = await controller.create(mockRequest as any, createDto);

      expect(result.id).toBe('party-1');
      expect(result.name).toBe('Test Customer');
    });
  });

  describe('findAll', () => {
    it('should return all parties', async () => {
      const parties = [mockParty];
      jest.spyOn(partyService, 'findByBusinessId').mockResolvedValue(parties);

      const result = await controller.findAll(mockRequest as any);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('party-1');
    });

    it('should filter by type', async () => {
      const parties = [mockParty];
      jest
        .spyOn(partyService, 'findByBusinessId')
        .mockResolvedValue(parties);

      const result = await controller.findAll(mockRequest as any, 'customer');

      expect(result).toHaveLength(1);
    });

    it('should search parties', async () => {
      const parties = [mockParty];
      jest.spyOn(partyService, 'search').mockResolvedValue(parties);

      const result = await controller.findAll(mockRequest as any, undefined, 'Test');

      expect(partyService.search).toHaveBeenCalledWith('business-1', 'Test');
      expect(result).toHaveLength(1);
    });
  });

  describe('getLedger', () => {
    it('should return party ledger', async () => {
      const mockLedger = {
        party_id: 'party-1',
        party_name: 'Test Customer',
        opening_balance: 0,
        opening_balance_type: 'credit',
        current_balance: 0,
        entries: [],
      };

      jest.spyOn(ledgerService, 'getPartyLedger').mockResolvedValue(mockLedger);

      const result = await controller.getLedger(mockRequest as any, 'party-1');

      expect(result.party_id).toBe('party-1');
    });
  });
});

