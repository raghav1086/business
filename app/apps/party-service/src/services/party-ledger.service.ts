import { Injectable, NotFoundException } from '@nestjs/common';
import { PartyRepository } from '../repositories/party.repository';
import { Party } from '../entities/party.entity';
import {
  PartyLedgerResponseDto,
  PartyLedgerEntryDto,
} from '@business-app/shared/dto';

/**
 * Party Ledger Service
 * 
 * Calculates party ledger (balance, transactions).
 * For MVP, this is a simplified version.
 * In production, this will query invoices and payments from respective services.
 */
@Injectable()
export class PartyLedgerService {
  constructor(private readonly partyRepository: PartyRepository) {}

  /**
   * Get party ledger
   * 
   * For MVP, returns opening balance and basic structure.
   * Will be enhanced when Invoice and Payment services are ready.
   */
  async getPartyLedger(
    businessId: string,
    partyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PartyLedgerResponseDto> {
    // Get party
    const party = await this.partyRepository.findByBusinessIdAndId(
      businessId,
      partyId
    );

    if (!party) {
      throw new NotFoundException(`Party with ID ${partyId} not found`);
    }

    // Calculate opening balance
    let currentBalance = 0;
    if (party.opening_balance_type === 'credit') {
      currentBalance = party.opening_balance;
    } else {
      currentBalance = -party.opening_balance;
    }

    // For MVP, return empty entries
    // In production, query invoices and payments from respective services
    const entries: PartyLedgerEntryDto[] = [];

    // Add opening balance entry
    if (party.opening_balance > 0) {
      entries.push({
        date: party.created_at,
        type: 'opening_balance',
        description: 'Opening Balance',
        debit: party.opening_balance_type === 'debit' ? party.opening_balance : 0,
        credit: party.opening_balance_type === 'credit' ? party.opening_balance : 0,
        balance: currentBalance,
      });
    }

    // TODO: When Invoice Service is ready:
    // - Query invoices for this party
    // - Query payments for this party
    // - Calculate running balance
    // - Filter by date range if provided

    return {
      party_id: party.id,
      party_name: party.name,
      opening_balance: party.opening_balance,
      opening_balance_type: party.opening_balance_type,
      current_balance: currentBalance,
      entries,
    };
  }
}

