import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsEnum,
  Length,
  Min,
  Max,
} from 'class-validator';

/**
 * Inventory DTOs
 */

export class CreateCategoryDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sort_order?: number;
}

export class CreateUnitDto {
  @IsString()
  @Length(2, 50)
  name: string;

  @IsString()
  @Length(1, 10)
  short_name: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  decimal_places?: number;
}

export class CreateItemDto {
  @IsString()
  @Length(2, 200)
  name: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsUUID()
  unit_id?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  sku?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  barcode?: string;

  @IsOptional()
  @IsString()
  @Length(4, 8)
  hsn_code?: string;

  @IsOptional()
  @IsString()
  @Length(4, 6)
  sac_code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsEnum([
    'raw_material',
    'wip',
    'finished_goods',
    'trading_goods',
    'consumables',
    'services',
  ])
  inventory_type?: string;

  @IsNumber()
  @Min(0)
  selling_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchase_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mrp?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount_percent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tax_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cess_rate?: number;

  @IsOptional()
  @IsBoolean()
  tax_inclusive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  current_stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  low_stock_threshold?: number;

  @IsOptional()
  @IsBoolean()
  track_stock?: boolean;

  @IsOptional()
  @IsBoolean()
  track_serial?: boolean;

  @IsOptional()
  @IsBoolean()
  track_batch?: boolean;
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  name?: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsUUID()
  unit_id?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  sku?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  barcode?: string;

  @IsOptional()
  @IsString()
  @Length(4, 8)
  hsn_code?: string;

  @IsOptional()
  @IsString()
  @Length(4, 6)
  sac_code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsEnum([
    'raw_material',
    'wip',
    'finished_goods',
    'trading_goods',
    'consumables',
    'services',
  ])
  inventory_type?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  selling_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchase_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mrp?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount_percent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tax_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cess_rate?: number;

  @IsOptional()
  @IsBoolean()
  tax_inclusive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  current_stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  low_stock_threshold?: number;

  @IsOptional()
  @IsBoolean()
  track_stock?: boolean;

  @IsOptional()
  @IsBoolean()
  track_serial?: boolean;

  @IsOptional()
  @IsBoolean()
  track_batch?: boolean;
}

export class StockAdjustmentDto {
  @IsUUID()
  item_id: string;

  @IsString()
  @IsEnum(['increase', 'decrease', 'set'])
  adjustment_type: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ItemResponseDto {
  id: string;
  business_id: string;
  category_id?: string;
  unit_id?: string;
  name: string;
  sku?: string;
  barcode?: string;
  hsn_code?: string;
  sac_code?: string;
  description?: string;
  image_url?: string;
  inventory_type: string;
  selling_price: number;
  purchase_price: number;
  mrp?: number;
  discount_percent: number;
  tax_rate: number;
  cess_rate: number;
  tax_inclusive: boolean;
  current_stock: number;
  low_stock_threshold?: number;
  track_stock: boolean;
  track_serial: boolean;
  track_batch: boolean;
  valuation_method: string;
  weighted_avg_cost: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class LowStockItemDto {
  id: string;
  name: string;
  current_stock: number;
  low_stock_threshold: number;
  unit?: string;
}

