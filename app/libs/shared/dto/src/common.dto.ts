import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';

/**
 * Common DTOs used across all services
 */

export class PaginationDto {
  @IsOptional()
  @IsString()
  page?: string = '1';

  @IsOptional()
  @IsString()
  limit?: string = '20';
}

export class IdParamDto {
  @IsUUID()
  id: string;
}

export class DateRangeDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

