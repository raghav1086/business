import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { BusinessUserService } from '../services/business-user.service';
import { GetUserBusinessesResponseDto } from '@business-app/shared/dto';

@ApiTags('User Businesses')
@Controller('users')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UserBusinessController {
  constructor(private readonly businessUserService: BusinessUserService) {}

  /**
   * Get all businesses for current user (owned + assigned)
   */
  @Get('me/businesses')
  @ApiOperation({ summary: 'Get all businesses for current user' })
  @ApiResponse({ status: 200, description: 'List of businesses', type: GetUserBusinessesResponseDto })
  async getMyBusinesses(
    @Request() req: any
  ): Promise<GetUserBusinessesResponseDto> {
    const businesses = await this.businessUserService.getUserBusinesses(req.user.id);
    return { businesses };
  }

  /**
   * Get all businesses for a specific user (admin only)
   * Allows admins to view which businesses a user belongs to
   */
  @Get(':userId/businesses')
  @ApiOperation({ summary: 'Get all businesses for a specific user' })
  @ApiResponse({ status: 200, description: 'List of businesses', type: GetUserBusinessesResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getUserBusinesses(
    @Param('userId') userId: string,
    @Request() req: any
  ): Promise<GetUserBusinessesResponseDto> {
    // For now, allow any authenticated user to view other users' businesses
    // In production, you might want to restrict this to admins only
    const businesses = await this.businessUserService.getUserBusinesses(userId);
    return { businesses };
  }
}

