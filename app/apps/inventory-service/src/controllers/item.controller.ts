import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { ItemService } from '../services/item.service';
import {
  CreateItemDto,
  UpdateItemDto,
  ItemResponseDto,
  LowStockItemDto,
} from '@business-app/shared/dto';
import { Item } from '../entities/item.entity';

@ApiTags('Items')
@Controller('api/v1/items')
// @UseGuards(JwtAuthGuard) // TODO: Add when shared guard is ready
@ApiBearerAuth()
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({
    status: 201,
    description: 'Item created successfully',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Category or Unit not found' })
  async create(
    @Request() req: any,
    @Body() createDto: CreateItemDto
  ): Promise<ItemResponseDto> {
    const businessId = req.business_id || 'business-1'; // Mock for now
    const item = await this.itemService.create(businessId, createDto);
    return this.toResponseDto(item);
  }

  @Get()
  @ApiOperation({ summary: 'Get all items for business' })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of items',
    type: [ItemResponseDto],
  })
  async findAll(
    @Request() req: any,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string
  ): Promise<ItemResponseDto[]> {
    const businessId = req.business_id || 'business-1'; // Mock for now

    let items: Item[];
    if (search) {
      items = await this.itemService.search(businessId, search);
    } else {
      items = await this.itemService.findByBusinessId(businessId, categoryId);
    }

    return items.map((i) => this.toResponseDto(i));
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get items with low stock' })
  @ApiResponse({
    status: 200,
    description: 'List of low stock items',
    type: [LowStockItemDto],
  })
  async findLowStock(@Request() req: any): Promise<LowStockItemDto[]> {
    const businessId = req.business_id || 'business-1'; // Mock for now
    const items = await this.itemService.findLowStock(businessId);
    return items.map((i) => ({
      id: i.id,
      name: i.name,
      current_stock: i.current_stock,
      low_stock_threshold: i.low_stock_threshold || 0,
      unit: i.unit?.short_name,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Item details',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findOne(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<ItemResponseDto> {
    const businessId = req.business_id || 'business-1'; // Mock for now
    const item = await this.itemService.findById(businessId, id);
    return this.toResponseDto(item);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update item' })
  @ApiResponse({
    status: 200,
    description: 'Item updated successfully',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateItemDto
  ): Promise<ItemResponseDto> {
    const businessId = req.business_id || 'business-1'; // Mock for now
    const item = await this.itemService.update(businessId, id, updateDto);
    return this.toResponseDto(item);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete item' })
  @ApiResponse({ status: 204, description: 'Item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async remove(@Request() req: any, @Param('id') id: string): Promise<void> {
    const businessId = req.business_id || 'business-1'; // Mock for now
    await this.itemService.delete(businessId, id);
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(item: Item): ItemResponseDto {
    return {
      id: item.id,
      business_id: item.business_id,
      category_id: item.category_id,
      unit_id: item.unit_id,
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      hsn_code: item.hsn_code,
      sac_code: item.sac_code,
      description: item.description,
      image_url: item.image_url,
      inventory_type: item.inventory_type,
      selling_price: item.selling_price,
      purchase_price: item.purchase_price,
      mrp: item.mrp,
      discount_percent: item.discount_percent,
      tax_rate: item.tax_rate,
      cess_rate: item.cess_rate,
      tax_inclusive: item.tax_inclusive,
      current_stock: item.current_stock,
      low_stock_threshold: item.low_stock_threshold,
      track_stock: item.track_stock,
      track_serial: item.track_serial,
      track_batch: item.track_batch,
      valuation_method: item.valuation_method,
      weighted_avg_cost: item.weighted_avg_cost,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }
}

