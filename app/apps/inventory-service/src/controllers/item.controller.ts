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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { CrossServiceBusinessContextGuard, PermissionGuard } from '@business-app/shared/guards';
import { RequirePermission } from '@business-app/shared/decorators';
import { Permission } from '@business-app/shared/constants';
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
@UseGuards(AuthGuard, CrossServiceBusinessContextGuard)
@ApiBearerAuth()
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.INVENTORY_CREATE)
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({
    status: 201,
    description: 'Item created successfully',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Category or Unit not found' })
  async create(
    @Request() req: any,
    @Body() createDto: CreateItemDto
  ): Promise<ItemResponseDto> {
    // Business ID is validated by CrossServiceBusinessContextGuard
    const businessId = req.businessContext?.businessId || req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
    const item = await this.itemService.create(businessId, createDto);
    return this.toResponseDto(item);
  }

  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.INVENTORY_READ)
  @ApiOperation({ summary: 'Get all items for business (or all items for superadmin)' })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of items',
    type: [ItemResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async findAll(
    @Request() req: any,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string
  ): Promise<ItemResponseDto[]> {
    const businessContext = req.businessContext;
    const isSuperadmin = businessContext?.isSuperadmin || false;
    const businessId = businessContext?.businessId;

    // If superadmin and no business ID, return all items across all businesses
    if (isSuperadmin && !businessId) {
      let items: Item[];
      if (search) {
        items = await this.itemService.searchAllForSuperadmin(search);
      } else {
        items = await this.itemService.findAllForSuperadmin(categoryId);
      }
      return items.map((i) => this.toResponseDto(i));
    }

    // For non-superadmin users OR superadmin with business ID: filter by business ID
    // This preserves backward compatibility - existing users work exactly as before
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    // Existing flow for non-superadmin users (unchanged)
    let items: Item[];
    if (search) {
      items = await this.itemService.search(businessId, search);
    } else {
      items = await this.itemService.findByBusinessId(businessId, categoryId);
    }

    return items.map((i) => this.toResponseDto(i));
  }

  @Get('low-stock')
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.INVENTORY_READ)
  @ApiOperation({ summary: 'Get items with low stock' })
  @ApiResponse({
    status: 200,
    description: 'List of low stock items',
    type: [LowStockItemDto],
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async findLowStock(@Request() req: any): Promise<LowStockItemDto[]> {
    // Business ID is validated by CrossServiceBusinessContextGuard
    const businessId = req.businessContext?.businessId || req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
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
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.INVENTORY_READ)
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Item details',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findOne(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<ItemResponseDto> {
    // Business ID is validated by CrossServiceBusinessContextGuard
    const businessId = req.businessContext?.businessId || req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
    const item = await this.itemService.findById(businessId, id);
    return this.toResponseDto(item);
  }

  @Patch(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.INVENTORY_UPDATE)
  @ApiOperation({ summary: 'Update item' })
  @ApiResponse({
    status: 200,
    description: 'Item updated successfully',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateItemDto
  ): Promise<ItemResponseDto> {
    // Business ID is validated by CrossServiceBusinessContextGuard
    const businessId = req.businessContext?.businessId || req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
    const item = await this.itemService.update(businessId, id, updateDto);
    return this.toResponseDto(item);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.INVENTORY_DELETE)
  @ApiOperation({ summary: 'Delete item' })
  @ApiResponse({ status: 204, description: 'Item deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async remove(@Request() req: any, @Param('id') id: string): Promise<void> {
    // Business ID is validated by CrossServiceBusinessContextGuard
    const businessId = req.businessContext?.businessId || req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
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

