import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { BusinessContextGuard } from '../guards/business-context.guard';
import { PermissionGuard } from '@business-app/shared/guards';
import { RequirePermission } from '@business-app/shared/decorators';
import { Permission, calculateEffectivePermissions, Role } from '@business-app/shared/constants';
import { BusinessUserService } from '../services/business-user.service';
import {
  AssignUserToBusinessDto,
  UpdateUserPermissionsDto,
  UpdateUserRoleDto,
  BusinessUserResponseDto,
  GetUserPermissionsResponseDto,
} from '@business-app/shared/dto';

@ApiTags('Business Users')
@Controller('businesses/:businessId/users')
@UseGuards(AuthGuard, BusinessContextGuard)
@ApiBearerAuth()
export class BusinessUserController {
  constructor(private readonly businessUserService: BusinessUserService) {}

  /**
   * Assign user to business
   */
  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.USER_ASSIGN)
  @ApiOperation({ summary: 'Assign user to business by phone number' })
  @ApiResponse({ status: 201, description: 'User assigned successfully', type: BusinessUserResponseDto })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async assignUser(
    @Param('businessId') businessId: string,
    @Body() dto: AssignUserToBusinessDto,
    @Request() req: any
  ): Promise<BusinessUserResponseDto> {
    const businessUser = await this.businessUserService.assignUserToBusinessByPhone(
      businessId,
      dto.phone,
      dto.role,
      req.user.id,
      req
    );
    return businessUser as BusinessUserResponseDto;
  }

  /**
   * Get all users in business
   */
  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.USER_VIEW)
  @ApiOperation({ summary: 'Get all users in business' })
  @ApiResponse({ status: 200, description: 'List of users', type: [BusinessUserResponseDto] })
  async getBusinessUsers(
    @Param('businessId') businessId: string
  ): Promise<BusinessUserResponseDto[]> {
    const users = await this.businessUserService.getBusinessUsers(businessId);
    return users as BusinessUserResponseDto[];
  }

  /**
   * Get user details in business
   */
  @Get(':userId')
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.USER_VIEW)
  @ApiOperation({ summary: 'Get user details in business' })
  @ApiResponse({ status: 200, description: 'User details', type: BusinessUserResponseDto })
  async getUserDetails(
    @Param('businessId') businessId: string,
    @Param('userId') userId: string
  ): Promise<BusinessUserResponseDto> {
    const { businessUser } = await this.businessUserService.getUserRoleInBusiness(
      userId,
      businessId
    );
    if (!businessUser) {
      // User is owner
      return {
        id: '',
        business_id: businessId,
        user_id: userId,
        role: Role.OWNER,
        permissions: null,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      } as BusinessUserResponseDto;
    }
    return businessUser as BusinessUserResponseDto;
  }

  /**
   * Update user role
   */
  @Patch(':userId/role')
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.USER_UPDATE_ROLE)
  @ApiOperation({ summary: 'Update user role in business' })
  @ApiResponse({ status: 200, description: 'Role updated', type: BusinessUserResponseDto })
  async updateUserRole(
    @Param('businessId') businessId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserRoleDto,
    @Request() req: any
  ): Promise<BusinessUserResponseDto> {
    const businessUser = await this.businessUserService.assignUserToBusiness(
      businessId,
      userId,
      dto.role,
      req.user.id,
      req
    );
    return businessUser as BusinessUserResponseDto;
  }

  /**
   * Remove user from business
   */
  @Delete(':userId')
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.USER_REMOVE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove user from business' })
  @ApiResponse({ status: 204, description: 'User removed successfully' })
  async removeUser(
    @Param('businessId') businessId: string,
    @Param('userId') userId: string,
    @Request() req: any
  ): Promise<void> {
    await this.businessUserService.removeUserFromBusiness(
      businessId,
      userId,
      req.user.id,
      req
    );
  }

  /**
   * Get user permissions
   */
  @Get(':userId/permissions')
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.USER_VIEW)
  @ApiOperation({ summary: 'Get user permissions in business' })
  @ApiResponse({ status: 200, description: 'User permissions', type: GetUserPermissionsResponseDto })
  async getUserPermissions(
    @Param('businessId') businessId: string,
    @Param('userId') userId: string
  ): Promise<GetUserPermissionsResponseDto> {
    const { role, isOwner, businessUser } = await this.businessUserService.getUserRoleInBusiness(
      userId,
      businessId
    );

    const rolePermissions = calculateEffectivePermissions(role, null);
    const customPermissions = businessUser?.permissions || null;
    const effectivePermissions = calculateEffectivePermissions(role, customPermissions);

    const deniedPermissions = customPermissions
      ? Object.entries(customPermissions)
          .filter(([_, allowed]) => allowed === false)
          .map(([perm]) => perm)
      : [];

    return {
      userId,
      businessId,
      role,
      permissionMode: customPermissions && Object.keys(customPermissions).length > 0 ? 'custom' : 'role_defaults',
      rolePermissions,
      customRestrictions: customPermissions || undefined,
      effectivePermissions,
      permissionSummary: {
        total: rolePermissions.length,
        allowed: effectivePermissions.length,
        restricted: deniedPermissions.length,
        fromRole: rolePermissions.length - deniedPermissions.length,
        custom: deniedPermissions.length,
      },
    };
  }

  /**
   * Update user permissions
   */
  @Patch(':userId/permissions')
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.USER_UPDATE_ROLE)
  @ApiOperation({ summary: 'Update user permissions in business' })
  @ApiResponse({ status: 200, description: 'Permissions updated', type: BusinessUserResponseDto })
  async updateUserPermissions(
    @Param('businessId') businessId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserPermissionsDto,
    @Request() req: any
  ): Promise<BusinessUserResponseDto> {
    const businessUser = await this.businessUserService.updateUserPermissions(
      businessId,
      userId,
      dto.permissions,
      req
    );
    return businessUser as BusinessUserResponseDto;
  }

  /**
   * Reset user permissions to role defaults
   */
  @Delete(':userId/permissions')
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.USER_UPDATE_ROLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user permissions to role defaults' })
  @ApiResponse({ status: 200, description: 'Permissions reset', type: BusinessUserResponseDto })
  async resetToRoleDefaults(
    @Param('businessId') businessId: string,
    @Param('userId') userId: string,
    @Request() req: any
  ): Promise<BusinessUserResponseDto> {
    const businessUser = await this.businessUserService.resetToRoleDefaults(
      businessId,
      userId,
      req
    );
    return businessUser as BusinessUserResponseDto;
  }
}

