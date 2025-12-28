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
import { PartyService } from '../services/party.service';
import { PartyLedgerService } from '../services/party-ledger.service';
import {
  CreatePartyDto,
  UpdatePartyDto,
  PartyResponseDto,
  PartyLedgerResponseDto,
} from '@business-app/shared/dto';
import { Party } from '../entities/party.entity';
import { validateOptionalUUID } from '@business-app/shared/utils';

@ApiTags('Party')
@Controller('api/v1/parties')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PartyController {
  constructor(
    private readonly partyService: PartyService,
    private readonly partyLedgerService: PartyLedgerService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new party' })
  @ApiResponse({
    status: 201,
    description: 'Party created successfully',
    type: PartyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Invalid GSTIN format' })
  async create(
    @Request() req: any,
    @Body() createDto: CreatePartyDto
  ): Promise<PartyResponseDto> {
    const businessId = req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
    const party = await this.partyService.create(businessId, createDto);
    return this.toResponseDto(party);
  }

  @Get()
  @ApiOperation({ summary: 'Get all parties for business' })
  @ApiQuery({ name: 'type', required: false, enum: ['customer', 'supplier', 'both'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of parties',
    type: [PartyResponseDto],
  })
  async findAll(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('search') search?: string
  ): Promise<PartyResponseDto[]> {
    const businessId = req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    let parties: Party[];
    if (search) {
      parties = await this.partyService.search(businessId, search);
    } else {
      parties = await this.partyService.findByBusinessId(businessId, type);
    }

    return parties.map((p) => this.toResponseDto(p));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get party by ID' })
  @ApiResponse({
    status: 200,
    description: 'Party details',
    type: PartyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 404, description: 'Party not found' })
  async findOne(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<PartyResponseDto> {
    // Validate UUID format
    validateOptionalUUID(id, 'id');

    const businessId = req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
    const party = await this.partyService.findById(businessId, id);
    return this.toResponseDto(party);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update party' })
  @ApiResponse({
    status: 200,
    description: 'Party updated successfully',
    type: PartyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Party not found' })
  @ApiResponse({ status: 409, description: 'Invalid GSTIN format' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdatePartyDto
  ): Promise<PartyResponseDto> {
    const businessId = req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
    const party = await this.partyService.update(businessId, id, updateDto);
    return this.toResponseDto(party);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete party' })
  @ApiResponse({ status: 204, description: 'Party deleted successfully' })
  @ApiResponse({ status: 404, description: 'Party not found' })
  async remove(@Request() req: any, @Param('id') id: string): Promise<void> {
    const businessId = req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
    await this.partyService.delete(businessId, id);
  }

  @Get(':id/ledger')
  @ApiOperation({ summary: 'Get party ledger' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Party ledger',
    type: PartyLedgerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Party not found' })
  async getLedger(
    @Request() req: any,
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<PartyLedgerResponseDto> {
    const businessId = req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.partyLedgerService.getPartyLedger(businessId, id, start, end);
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(party: Party): PartyResponseDto {
    return {
      id: party.id,
      business_id: party.business_id,
      name: party.name,
      type: party.type,
      phone: party.phone,
      email: party.email,
      gstin: party.gstin,
      pan: party.pan,
      billing_address_line1: party.billing_address_line1,
      billing_address_line2: party.billing_address_line2,
      billing_city: party.billing_city,
      billing_state: party.billing_state,
      billing_pincode: party.billing_pincode,
      shipping_same_as_billing: party.shipping_same_as_billing,
      shipping_address_line1: party.shipping_address_line1,
      shipping_address_line2: party.shipping_address_line2,
      shipping_city: party.shipping_city,
      shipping_state: party.shipping_state,
      shipping_pincode: party.shipping_pincode,
      opening_balance: party.opening_balance,
      opening_balance_type: party.opening_balance_type,
      credit_limit: party.credit_limit,
      credit_period_days: party.credit_period_days,
      notes: party.notes,
      tags: party.tags,
      status: party.status,
      created_at: party.created_at,
      updated_at: party.updated_at,
    };
  }
}

