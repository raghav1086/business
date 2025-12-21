import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessService } from '../services/business.service';
import {
  CreateBusinessDto,
  UpdateBusinessDto,
  BusinessResponseDto,
} from '@business-app/shared/dto';
import { Business } from '../entities/business.entity';
import { AuthGuard } from '../guards/auth.guard';

@ApiTags('Business')
@Controller('api/v1/businesses')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new business' })
  @ApiResponse({
    status: 201,
    description: 'Business created successfully',
    type: BusinessResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'GSTIN already exists' })
  async create(
    @Request() req: any,
    @Body() createDto: CreateBusinessDto
  ): Promise<BusinessResponseDto> {
    const business = await this.businessService.create(
      req.user.id,
      createDto
    );
    return this.toResponseDto(business);
  }

  @Get()
  @ApiOperation({ summary: 'Get all businesses for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of businesses',
    type: [BusinessResponseDto],
  })
  async findAll(@Request() req: any): Promise<BusinessResponseDto[]> {
    const businesses = await this.businessService.findByOwner(req.user.id);
    return businesses.map((b) => this.toResponseDto(b));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business by ID' })
  @ApiResponse({
    status: 200,
    description: 'Business details',
    type: BusinessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async findOne(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<BusinessResponseDto> {
    const business = await this.businessService.findById(id, req.user.id);
    return this.toResponseDto(business);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update business' })
  @ApiResponse({
    status: 200,
    description: 'Business updated successfully',
    type: BusinessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 409, description: 'GSTIN already exists' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateBusinessDto
  ): Promise<BusinessResponseDto> {
    const business = await this.businessService.update(
      id,
      req.user.id,
      updateDto
    );
    return this.toResponseDto(business);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete business' })
  @ApiResponse({ status: 204, description: 'Business deleted successfully' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async remove(@Request() req: any, @Param('id') id: string): Promise<void> {
    await this.businessService.delete(id, req.user.id);
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(business: Business): BusinessResponseDto {
    return {
      id: business.id,
      owner_id: business.owner_id,
      name: business.name,
      type: business.type,
      gstin: business.gstin,
      pan: business.pan,
      phone: business.phone,
      email: business.email,
      address_line1: business.address_line1,
      address_line2: business.address_line2,
      city: business.city,
      state: business.state,
      pincode: business.pincode,
      country: business.country,
      status: business.status,
      created_at: business.created_at,
      updated_at: business.updated_at,
    };
  }
}

