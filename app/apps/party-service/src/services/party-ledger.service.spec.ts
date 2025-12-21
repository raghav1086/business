import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PartyLedgerService } from './party-ledger.service';
import { PartyRepository } from '../repositories/party.repository';
import { Party } from '../entities/party.entity';

describe('PartyLedgerService', () => {
  let service: PartyLedgerService;
  let repository: PartyRepository;

  const mockParty: Party = {
    id: 'party-1',
    business_id: 'business-1',
    name: 'Test Customer',
    type: 'customer',
    opening_balance: 1000,
    opening_balance_type: 'credit',
    status: 'active',
    shipping_same_as_billing: true,
    created_at: new Date(),
    updated_at: new Date(),
  } as Party;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartyLedgerService,
        {
          provide: PartyRepository,
          useValue: {
            findByBusinessIdAndId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PartyLedgerService>(PartyLedgerService);
    repository = module.get<PartyRepository>(PartyRepository);
  });

  describe('getPartyLedger', () => {
    it('should return party ledger with opening balance', async () => {
      jest
        .spyOn(repository, 'findByBusinessIdAndId')
        .mockResolvedValue(mockParty);

      const result = await service.getPartyLedger(
        'business-1',
        'party-1'
      );

      expect(result.party_id).toBe('party-1');
      expect(result.party_name).toBe('Test Customer');
      expect(result.opening_balance).toBe(1000);
      expect(result.current_balance).toBe(1000);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].type).toBe('opening_balance');
    });

    it('should throw NotFoundException if party not found', async () => {
      jest.spyOn(repository, 'findByBusinessIdAndId').mockResolvedValue(null);

      await expect(
        service.getPartyLedger('business-1', 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle debit opening balance', async () => {
      const debitParty = {
        ...mockParty,
        opening_balance: 500,
        opening_balance_type: 'debit',
      };

      jest
        .spyOn(repository, 'findByBusinessIdAndId')
        .mockResolvedValue(debitParty);

      const result = await service.getPartyLedger('business-1', 'party-1');

      expect(result.current_balance).toBe(-500);
    });
  });
});

