import {
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  Request,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserService } from '../services/user.service';
import { StorageService } from '../services/storage.service';
import {
  UpdateUserProfileDto,
  UserProfileResponseDto,
  ChangePasscodeDto,
} from '@business-app/shared/dto';
import { User } from '../entities/user.entity';

@ApiTags('User')
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly storageService: StorageService
  ) {}

  /**
   * Search users by phone, email, or name
   */
  @Get('search')
  @ApiOperation({ summary: 'Search users by phone, email, or name' })
  @ApiResponse({
    status: 200,
    description: 'List of matching users',
    type: [UserProfileResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchUsers(
    @Query('q') query: string,
    @Query('limit') limit?: string
  ): Promise<UserProfileResponseDto[]> {
    const searchLimit = limit ? parseInt(limit, 10) : 20;
    const users = await this.userService.searchUsers(query || '', searchLimit);
    return users.map((user) => this.toResponseDto(user));
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Request() req: any): Promise<UserProfileResponseDto> {
    const user = await this.userService.getProfile(req.user.id);
    return this.toResponseDto(user);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Request() req: any,
    @Body() updateDto: UpdateUserProfileDto
  ): Promise<UserProfileResponseDto> {
    const user = await this.userService.updateProfile(req.user.id, updateDto);
    return this.toResponseDto(user);
  }

  @Patch('profile/passcode')
  @ApiOperation({ summary: 'Change user passcode' })
  @ApiResponse({
    status: 200,
    description: 'Passcode changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid current passcode' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePasscode(
    @Request() req: any,
    @Body() changePasscodeDto: ChangePasscodeDto
  ): Promise<{ message: string }> {
    await this.userService.changePasscode(req.user.id, changePasscodeDto);
    return { message: 'Passcode changed successfully' };
  }

  @Post('profile/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        avatar_url: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file: any
  ): Promise<{ avatar_url: string }> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const avatarUrl = await this.storageService.uploadAvatar(
      req.user.id,
      file
    );
    await this.userService.updateAvatar(req.user.id, avatarUrl);

    return { avatar_url: avatarUrl };
  }

  /**
   * Get all users (superadmin only)
   */
  @Get('admin/all')
  @ApiOperation({ summary: 'Get all users (superadmin only)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results', type: Number })
  @ApiQuery({ name: 'includeBusinesses', required: false, description: 'Include businesses for each user', type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    type: [UserProfileResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  async getAllUsers(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('includeBusinesses') includeBusinesses?: string
  ): Promise<UserProfileResponseDto[] | any[]> {
    if (!req.user?.is_superadmin) {
      throw new ForbiddenException('Superadmin access required');
    }
    const userLimit = limit ? parseInt(limit, 10) : undefined;
    const shouldIncludeBusinesses = includeBusinesses === 'true';
    
    if (shouldIncludeBusinesses) {
      const authToken = req.headers.authorization?.replace('Bearer ', '');
      const users = await this.userService.getAllUsersWithBusinesses(userLimit, authToken);
      return users.map((user) => this.toResponseDtoWithBusinesses(user));
    }
    
    const users = await this.userService.getAllUsers(userLimit);
    return users.map((user) => this.toResponseDto(user));
  }

  /**
   * Get user count (superadmin only)
   */
  @Get('admin/count')
  @ApiOperation({ summary: 'Get total user count (superadmin only)' })
  @ApiResponse({
    status: 200,
    description: 'User count',
    schema: { type: 'object', properties: { count: { type: 'number' } } },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  async getUserCount(@Request() req: any): Promise<{ count: number }> {
    if (!req.user?.is_superadmin) {
      throw new ForbiddenException('Superadmin access required');
    }
    const count = await this.userService.getUserCount();
    return { count };
  }

  /**
   * Get active users count (superadmin only)
   */
  @Get('admin/stats/active')
  @ApiOperation({ summary: 'Get active users count (last 30 days) (superadmin only)' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Active users count',
    schema: { type: 'object', properties: { count: { type: 'number' } } },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  async getActiveUsersCount(
    @Request() req: any,
    @Query('days') days?: string
  ): Promise<{ count: number }> {
    if (!req.user?.is_superadmin) {
      throw new ForbiddenException('Superadmin access required');
    }
    const daysCount = days ? parseInt(days, 10) : 30;
    const count = await this.userService.getActiveUsersCount(daysCount);
    return { count };
  }

  /**
   * Get users growth (superadmin only)
   */
  @Get('admin/stats/growth')
  @ApiOperation({ summary: 'Get users growth data (superadmin only)' })
  @ApiQuery({ name: 'months', required: false, description: 'Number of months', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Users growth data',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          month: { type: 'string' },
          count: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  async getUsersGrowth(
    @Request() req: any,
    @Query('months') months?: string
  ): Promise<Array<{ month: string; count: number }>> {
    if (!req.user?.is_superadmin) {
      throw new ForbiddenException('Superadmin access required');
    }
    const monthsCount = months ? parseInt(months, 10) : 6;
    return this.userService.getUsersGrowth(monthsCount);
  }

  /**
   * Get users by type distribution (superadmin only)
   */
  @Get('admin/stats/distribution')
  @ApiOperation({ summary: 'Get users by type distribution (superadmin only)' })
  @ApiResponse({
    status: 200,
    description: 'Users by type distribution',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          count: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  async getUsersByTypeDistribution(
    @Request() req: any
  ): Promise<Array<{ type: string; count: number }>> {
    if (!req.user?.is_superadmin) {
      throw new ForbiddenException('Superadmin access required');
    }
    return this.userService.getUsersByTypeDistribution();
  }

  /**
   * Get recent users count (superadmin only)
   */
  @Get('admin/stats/recent')
  @ApiOperation({ summary: 'Get recent users count (last 7 days) (superadmin only)' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Recent users count',
    schema: { type: 'object', properties: { count: { type: 'number' } } },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  async getRecentUsersCount(
    @Request() req: any,
    @Query('days') days?: string
  ): Promise<{ count: number }> {
    if (!req.user?.is_superadmin) {
      throw new ForbiddenException('Superadmin access required');
    }
    const daysCount = days ? parseInt(days, 10) : 7;
    const count = await this.userService.getRecentUsersCount(daysCount);
    return { count };
  }

  /**
   * Get user by ID
   * Must be after 'search', 'profile', and 'admin' routes to avoid conflicts
   */
  @Get(':userId')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(
    @Param('userId') userId: string
  ): Promise<UserProfileResponseDto> {
    const user = await this.userService.getUserById(userId);
    return this.toResponseDto(user);
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(user: User): UserProfileResponseDto & { is_superadmin?: boolean } {
    return {
      id: user.id,
      phone: user.phone,
      phone_verified: user.phone_verified,
      name: user.name,
      email: user.email,
      email_verified: user.email_verified,
      avatar_url: user.avatar_url,
      user_type: user.user_type,
      language_preference: user.language_preference,
      status: user.status,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      is_superadmin: user.is_superadmin,
    };
  }

  /**
   * Convert entity with businesses to response DTO
   */
  private toResponseDtoWithBusinesses(user: User & {
    businesses?: {
      total: number;
      owned: number;
      assigned: number;
      list: Array<{
        id: string;
        name: string;
        role: string;
        isOwner: boolean;
        status: string;
      }>;
    };
  }): UserProfileResponseDto & {
    businesses?: {
      total: number;
      owned: number;
      assigned: number;
      list: Array<{
        id: string;
        name: string;
        role: string;
        isOwner: boolean;
        status: string;
      }>;
    };
  } {
    const baseDto = this.toResponseDto(user);
    return {
      ...baseDto,
      businesses: user.businesses,
    };
  }
}

