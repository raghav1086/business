import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ItemRepository } from '../repositories/item.repository';
import { StockAdjustmentRepository } from '../repositories/stock-adjustment.repository';
import { StockAdjustmentDto } from '@business-app/shared/dto';
import { StockAdjustment } from '../entities/stock-adjustment.entity';
import { Item } from '../entities/item.entity';

/**
 * Stock Service
 * 
 * Handles stock adjustments and stock management.
 */
@Injectable()
export class StockService {
  constructor(
    private readonly itemRepository: ItemRepository,
    private readonly stockAdjustmentRepository: StockAdjustmentRepository
  ) {}

  /**
   * Adjust stock
   */
  async adjustStock(
    businessId: string,
    adjustmentDto: StockAdjustmentDto,
    userId?: string
  ): Promise<{ item: Item; adjustment: StockAdjustment }> {
    // Get item
    const item = await this.itemRepository.findByBusinessIdAndId(
      businessId,
      adjustmentDto.item_id
    );

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (!item.track_stock) {
      throw new BadRequestException('Stock tracking is disabled for this item');
    }

    // Calculate new stock
    let newStock = item.current_stock;

    switch (adjustmentDto.adjustment_type) {
      case 'increase':
        newStock = item.current_stock + adjustmentDto.quantity;
        break;
      case 'decrease':
        newStock = item.current_stock - adjustmentDto.quantity;
        if (newStock < 0) {
          throw new BadRequestException('Insufficient stock');
        }
        break;
      case 'set':
        newStock = adjustmentDto.quantity;
        break;
      default:
        throw new BadRequestException('Invalid adjustment type');
    }

    // Update item stock
    await this.itemRepository.updateStock(item.id, newStock);

    // Create adjustment record
    const adjustment = await this.stockAdjustmentRepository.create({
      business_id: businessId,
      item_id: item.id,
      adjustment_date: new Date(),
      adjustment_type: adjustmentDto.adjustment_type,
      quantity: adjustmentDto.quantity,
      rate: adjustmentDto.rate,
      reason: adjustmentDto.reason,
      notes: adjustmentDto.notes,
      created_by: userId,
    });

    // Reload item to get updated stock
    const updatedItem = await this.itemRepository.findById(item.id);

    return {
      item: updatedItem!,
      adjustment,
    };
  }

  /**
   * Get stock adjustment history for item
   */
  async getStockHistory(itemId: string): Promise<StockAdjustment[]> {
    return this.stockAdjustmentRepository.findByItemId(itemId);
  }
}

