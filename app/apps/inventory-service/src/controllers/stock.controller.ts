import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StockService } from '../services/stock.service';
import { StockAdjustmentDto } from '@business-app/shared/dto';
import { StockAdjustment } from '../entities/stock-adjustment.entity';

@ApiTags('Stock')
@Controller('api/v1/stock')
// @UseGuards(JwtAuthGuard) // TODO: Add when shared guard is ready
@ApiBearerAuth()
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adjust stock for an item' })
  @ApiResponse({
    status: 200,
    description: 'Stock adjusted successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid adjustment' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async adjustStock(
    @Request() req: any,
    @Body() adjustmentDto: StockAdjustmentDto
  ): Promise<{
    item: any;
    adjustment: StockAdjustment;
  }> {
    const businessId = req.business_id || '00000000-0000-0000-0000-000000000001'; // Mock for now
    const userId = req.user?.id;
    return this.stockService.adjustStock(businessId, adjustmentDto, userId);
  }

  @Get('items/:itemId/history')
  @ApiOperation({ summary: 'Get stock adjustment history for item' })
  @ApiResponse({
    status: 200,
    description: 'Stock adjustment history',
    type: [StockAdjustment],
  })
  async getStockHistory(
    @Param('itemId') itemId: string
  ): Promise<StockAdjustment[]> {
    return this.stockService.getStockHistory(itemId);
  }
}

