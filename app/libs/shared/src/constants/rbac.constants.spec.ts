import { Role, Permission, ROLE_PERMISSIONS, calculateEffectivePermissions, hasPermission } from './rbac.constants';

describe('RBAC Constants', () => {
  describe('calculateEffectivePermissions', () => {
    it('should return all role permissions when customPermissions is null', () => {
      const permissions = calculateEffectivePermissions(Role.ADMIN, null);
      expect(permissions).toEqual(ROLE_PERMISSIONS[Role.ADMIN]);
    });

    it('should return all role permissions when customPermissions is empty', () => {
      const permissions = calculateEffectivePermissions(Role.ADMIN, {});
      expect(permissions).toEqual(ROLE_PERMISSIONS[Role.ADMIN]);
    });

    it('should remove denied permissions', () => {
      const customPermissions = {
        [Permission.INVOICE_DELETE]: false,
      };
      const permissions = calculateEffectivePermissions(Role.ADMIN, customPermissions);
      expect(permissions).not.toContain(Permission.INVOICE_DELETE);
      expect(permissions.length).toBeLessThan(ROLE_PERMISSIONS[Role.ADMIN].length);
    });

    it('should add explicitly allowed permissions', () => {
      const customPermissions = {
        [Permission.INVOICE_DELETE]: true,
      };
      const permissions = calculateEffectivePermissions(Role.EMPLOYEE, customPermissions);
      expect(permissions).toContain(Permission.INVOICE_DELETE);
    });

    it('should handle multiple permission overrides', () => {
      const customPermissions = {
        [Permission.INVOICE_DELETE]: false,
        [Permission.PARTY_DELETE]: false,
        [Permission.INVOICE_EXPORT]: true,
      };
      const permissions = calculateEffectivePermissions(Role.ADMIN, customPermissions);
      expect(permissions).not.toContain(Permission.INVOICE_DELETE);
      expect(permissions).not.toContain(Permission.PARTY_DELETE);
      expect(permissions).toContain(Permission.INVOICE_EXPORT);
    });

    it('should return empty array for unknown role', () => {
      const permissions = calculateEffectivePermissions('unknown' as Role, null);
      expect(permissions).toEqual([]);
    });

    it('should remove duplicates', () => {
      const customPermissions = {
        [Permission.INVOICE_READ]: true, // Already in role
      };
      const permissions = calculateEffectivePermissions(Role.ADMIN, customPermissions);
      const uniquePermissions = Array.from(new Set(permissions));
      expect(permissions.length).toBe(uniquePermissions.length);
    });
  });

  describe('hasPermission', () => {
    it('should return true if permission is in role permissions', () => {
      const result = hasPermission(Role.ADMIN, Permission.INVOICE_CREATE, null);
      expect(result).toBe(true);
    });

    it('should return false if permission is denied', () => {
      const customPermissions = {
        [Permission.INVOICE_CREATE]: false,
      };
      const result = hasPermission(Role.ADMIN, Permission.INVOICE_CREATE, customPermissions);
      expect(result).toBe(false);
    });

    it('should return true if permission is explicitly allowed', () => {
      const customPermissions = {
        [Permission.INVOICE_DELETE]: true,
      };
      const result = hasPermission(Role.EMPLOYEE, Permission.INVOICE_DELETE, customPermissions);
      expect(result).toBe(true);
    });

    it('should return false for permission not in role and not explicitly allowed', () => {
      const result = hasPermission(Role.VIEWER, Permission.INVOICE_DELETE, null);
      expect(result).toBe(false);
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('should have permissions for all defined roles', () => {
      Object.values(Role).forEach(role => {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      });
    });

    it('should have SUPERADMIN with all permissions', () => {
      const superadminPerms = ROLE_PERMISSIONS[Role.SUPERADMIN];
      expect(superadminPerms.length).toBeGreaterThan(0);
    });

    it('should have OWNER with all permissions', () => {
      const ownerPerms = ROLE_PERMISSIONS[Role.OWNER];
      expect(ownerPerms.length).toBeGreaterThan(0);
    });

    it('should have VIEWER with read-only permissions', () => {
      const viewerPerms = ROLE_PERMISSIONS[Role.VIEWER];
      expect(viewerPerms).toContain(Permission.INVOICE_READ);
      expect(viewerPerms).toContain(Permission.PARTY_READ);
      expect(viewerPerms).not.toContain(Permission.INVOICE_DELETE);
      expect(viewerPerms).not.toContain(Permission.PARTY_DELETE);
    });
  });
});

