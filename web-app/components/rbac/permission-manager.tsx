'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, Check, X, RotateCcw, Save, Search, Filter, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  getAllPermissions,
  getUserPermissions,
  updateUserPermissions,
  resetUserPermissions,
  getBusinessUsers,
  type UserPermissions,
  type PermissionCategory,
  Role,
} from '@/lib/services/rbac.service';

interface PermissionManagerProps {
  businessId: string;
}

export function PermissionManager({ businessId }: PermissionManagerProps) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permissionChanges, setPermissionChanges] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);

  // Fetch all permissions
  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => getAllPermissions(),
  });

  // Fetch business users for selection
  const { data: users } = useQuery({
    queryKey: ['business-users', businessId],
    queryFn: () => getBusinessUsers(businessId),
    enabled: !!businessId,
  });

  // Fetch user permissions
  const { data: userPermissions, isLoading: loadingPermissions } = useQuery({
    queryKey: ['user-permissions', businessId, selectedUserId],
    queryFn: () => getUserPermissions(businessId, selectedUserId),
    enabled: !!selectedUserId && !!businessId,
  });

  // Update permissions mutation
  const updateMutation = useMutation({
    mutationFn: (permissions: Record<string, boolean> | null) =>
      updateUserPermissions(businessId, selectedUserId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', businessId, selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['business-users', businessId] });
      setPermissionChanges({});
      toast.success('Permissions updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update permissions', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  // Reset permissions mutation
  const resetMutation = useMutation({
    mutationFn: () => resetUserPermissions(businessId, selectedUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', businessId, selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['business-users', businessId] });
      setPermissionChanges({});
      toast.success('Permissions reset to role defaults');
    },
    onError: (error: any) => {
      toast.error('Failed to reset permissions', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  // Initialize permission changes when user permissions load
  useEffect(() => {
    if (userPermissions?.customRestrictions) {
      setPermissionChanges({ ...userPermissions.customRestrictions });
    } else {
      setPermissionChanges({});
    }
  }, [userPermissions]);

  const handlePermissionToggle = (permissionKey: string, currentValue: boolean | undefined) => {
    setPermissionChanges((prev) => {
      const newChanges = { ...prev };
      // If permission is currently allowed (not in restrictions), restrict it
      if (currentValue === undefined || currentValue === true) {
        newChanges[permissionKey] = false;
      } else {
        // If permission is restricted, remove restriction (allow it)
        delete newChanges[permissionKey];
      }
      return newChanges;
    });
  };

  const handleSave = () => {
    // If no changes, set to null (use role defaults)
    const permissionsToSave =
      Object.keys(permissionChanges).length === 0 ? null : permissionChanges;
    updateMutation.mutate(permissionsToSave);
  };

  const handleReset = () => {
    resetMutation.mutate();
  };

  const isPermissionAllowed = (permissionKey: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.effectivePermissions.includes(permissionKey);
  };

  const isPermissionRestricted = (permissionKey: string): boolean => {
    // Check both current changes and original restrictions
    if (permissionChanges[permissionKey] === false) return true;
    if (userPermissions?.customRestrictions?.[permissionKey] === false) return true;
    return false;
  };

  const hasChanges = Object.keys(permissionChanges).length > 0 ||
    (userPermissions?.customRestrictions &&
      Object.keys(userPermissions.customRestrictions).length > 0);

  if (!permissionsData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const categories = permissionsData.categories || [];

  // Filter categories and permissions based on search
  const filteredCategories = categories
    .map((category) => ({
      ...category,
      permissions: category.permissions.filter((perm) => {
        const matchesSearch = !searchQuery || 
          perm.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          perm.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          perm.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || 
          category.name.toLowerCase().includes(filterCategory.toLowerCase());
        return matchesSearch && matchesCategory;
      }),
    }))
    .filter((category) => category.permissions.length > 0);

  // Calculate changes summary
  const changesSummary = {
    toRestrict: Object.keys(permissionChanges).filter(
      (key) => permissionChanges[key] === false && 
      !userPermissions?.customRestrictions?.[key]
    ).length,
    toAllow: Object.keys(userPermissions?.customRestrictions || {}).filter(
      (key) => userPermissions?.customRestrictions?.[key] === false && 
      !permissionChanges[key]
    ).length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Permission Management</h3>
          <p className="text-sm text-muted-foreground">
            View and manage user permissions
          </p>
        </div>
      </div>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select User</CardTitle>
          <CardDescription>Choose a user to manage their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="user-select">User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.user_id}>
                    {user.user_id} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedUserId && userPermissions && (
        <>
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Permission Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Permission Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{userPermissions.permissionSummary.total}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Allowed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {userPermissions.permissionSummary.allowed}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Restricted</p>
                  <p className="text-2xl font-bold text-red-600">
                    {userPermissions.permissionSummary.restricted}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mode</p>
                  <Badge variant={userPermissions.permissionMode === 'custom' ? 'secondary' : 'default'}>
                    {userPermissions.permissionMode === 'custom' ? 'Custom' : 'Role Defaults'}
                  </Badge>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge variant="secondary" className="mt-1">
                  <Shield className="h-3 w-3 mr-1" />
                  {userPermissions.role}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Changes Preview */}
          {hasChanges && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Pending Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {changesSummary.toRestrict > 0 && (
                    <p className="text-red-600">
                      • {changesSummary.toRestrict} permission(s) will be restricted
                    </p>
                  )}
                  {changesSummary.toAllow > 0 && (
                    <p className="text-green-600">
                      • {changesSummary.toAllow} permission(s) will be allowed
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="mt-2"
                  >
                    {showPreview ? 'Hide' : 'Show'} Detailed Preview
                  </Button>
                  {showPreview && (
                    <div className="mt-4 space-y-2 p-3 bg-background rounded border">
                      {Object.entries(permissionChanges).map(([key, value]) => {
                        const perm = categories
                          .flatMap((c) => c.permissions)
                          .find((p) => p.key === key);
                        return (
                          <div key={key} className="flex items-center justify-between text-xs">
                            <span>{perm?.label || key}</span>
                            <Badge variant={value === false ? 'destructive' : 'default'}>
                              {value === false ? 'Restricted' : 'Allowed'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Permission Categories */}
          <div className="space-y-4">
            {filteredCategories.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No permissions found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search or filter
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredCategories.map((category: PermissionCategory) => (
              <Card key={category.name}>
                <CardHeader>
                  <CardTitle className="text-base">{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.permissions.map((permission) => {
                      const isAllowed = isPermissionAllowed(permission.key);
                      const isRestricted = isPermissionRestricted(permission.key);
                      const isInRole = userPermissions.rolePermissions.includes(permission.key);

                      return (
                        <div
                          key={permission.key}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={permission.key} className="font-medium">
                                {permission.label}
                              </Label>
                              {isAllowed && !isRestricted && (
                                <Badge variant="default" className="text-xs">
                                  <Check className="h-3 w-3 mr-1" />
                                  Allowed
                                </Badge>
                              )}
                              {isRestricted && (
                                <Badge variant="destructive" className="text-xs">
                                  <X className="h-3 w-3 mr-1" />
                                  Restricted
                                </Badge>
                              )}
                              {!isInRole && !isAllowed && (
                                <Badge variant="outline" className="text-xs">
                                  Not in Role
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {permission.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isInRole && (
                              <Button
                                variant={isRestricted ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handlePermissionToggle(permission.key, isRestricted ? false : true)}
                              >
                                {isRestricted ? 'Allow' : 'Restrict'}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={resetMutation.isPending || userPermissions.permissionMode === 'role_defaults'}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Role Defaults
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || !hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </>
      )}

      {selectedUserId && loadingPermissions && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!selectedUserId && (
        <Card>
          <CardContent className="py-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Select a user to manage their permissions</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

