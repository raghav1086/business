import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsObject, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@business-app/shared/constants';

/**
 * Assign User to Business DTO
 */
export class AssignUserToBusinessDto {
  @ApiProperty({
    description: 'Phone number of user to assign to business (10 digits)',
    example: '9876543210',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Role to assign to user',
    enum: Role,
    example: Role.EMPLOYEE,
  })
  @IsEnum(Role)
  role: Role;
}

/**
 * Update User Permissions DTO
 */
export class UpdateUserPermissionsDto {
  @ApiPropertyOptional({
    description: 'Custom permission overrides. NULL or {} = use all role permissions. {"permission": false} = deny specific permission',
    example: { 'invoice:delete': false },
  })
  @IsObject()
  @IsOptional()
  permissions?: Record<string, boolean> | null;
}

/**
 * Update User Role DTO
 */
export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New role for user',
    enum: Role,
    example: Role.ADMIN,
  })
  @IsEnum(Role)
  role: Role;
}

/**
 * Business User Response DTO
 */
export class BusinessUserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  business_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiPropertyOptional()
  permissions?: Record<string, boolean> | null;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  invited_at?: Date;

  @ApiPropertyOptional()
  joined_at?: Date;

  @ApiPropertyOptional()
  invited_by?: string;

  @ApiPropertyOptional()
  removed_at?: Date;

  @ApiPropertyOptional()
  removed_by?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

/**
 * Permission Info DTO
 */
export class PermissionInfoDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [String] })
  defaultRoles: string[];
}

/**
 * Permission Category DTO
 */
export class PermissionCategoryDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: [PermissionInfoDto] })
  permissions: PermissionInfoDto[];
}

/**
 * Get User Permissions Response DTO
 */
export class GetUserPermissionsResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  businessId: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  permissionMode: 'role_defaults' | 'custom';

  @ApiProperty({ type: [String] })
  rolePermissions: string[];

  @ApiPropertyOptional()
  customRestrictions?: Record<string, boolean>;

  @ApiProperty({ type: [String] })
  effectivePermissions: string[];

  @ApiProperty()
  permissionSummary: {
    total: number;
    allowed: number;
    restricted: number;
    fromRole: number;
    custom: number;
  };
}

/**
 * Get User Businesses Response DTO
 */
export class UserBusinessDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  role: Role;

  @ApiProperty()
  isOwner: boolean;

  @ApiProperty()
  status: string;
}

/**
 * Get User Businesses Response DTO
 */
export class GetUserBusinessesResponseDto {
  @ApiProperty({ type: [UserBusinessDto] })
  businesses: UserBusinessDto[];
}

