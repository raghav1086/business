import {
  Controller,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission, ROLE_PERMISSIONS, Role } from '@business-app/shared/constants';
import { PermissionCategoryDto } from '@business-app/shared/dto';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  /**
   * Get all available permissions (for UI)
   */
  @Get()
  @ApiOperation({ summary: 'Get all available permissions' })
  @ApiResponse({ status: 200, description: 'List of permissions', type: [PermissionCategoryDto] })
  async getPermissions(): Promise<PermissionCategoryDto[]> {
    // Group permissions by category
    const categories: Record<string, { name: string; permissions: any[] }> = {};

    Object.values(Permission).forEach((perm) => {
      const [category, action] = perm.split(':');
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1) + ' Management';

      if (!categories[category]) {
        categories[category] = {
          name: categoryName,
          permissions: [],
        };
      }

      // Find which roles have this permission by default
      const defaultRoles: string[] = [];
      Object.entries(ROLE_PERMISSIONS).forEach(([role, perms]) => {
        if (perms.includes(perm)) {
          defaultRoles.push(role);
        }
      });

      categories[category].permissions.push({
        key: perm,
        label: `${action.charAt(0).toUpperCase() + action.slice(1)} ${category}`,
        description: `Allow user to ${action} ${category}`,
        defaultRoles,
      });
    });

    return Object.values(categories).map((cat) => ({
      name: cat.name,
      permissions: cat.permissions,
    }));
  }
}

