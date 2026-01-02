'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Users, MoreVertical, Edit, Trash2, Shield, Phone, Mail, User as UserIcon, CheckSquare, Square, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  getBusinessUsers,
  assignUserToBusiness,
  updateUserRole,
  removeUserFromBusiness,
  type BusinessUser,
  Role,
} from '@/lib/services/rbac.service';
import { UserSearchDialog } from './user-search-dialog';
import { UserDetailsSheet } from './user-details-sheet';
import { getUserById, getUserInitials, formatPhoneNumber } from '@/lib/services/user-search.service';

interface UserManagementProps {
  businessId: string;
}

export function UserManagement({ businessId }: UserManagementProps) {
  const queryClient = useQueryClient();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BusinessUser | null>(null);
  const [role, setRole] = useState<Role>(Role.EMPLOYEE);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [selectedUserIdForDetails, setSelectedUserIdForDetails] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'role' | 'remove' | null>(null);

  // Fetch business users
  const { data: users, isLoading } = useQuery({
    queryKey: ['business-users', businessId],
    queryFn: () => getBusinessUsers(businessId),
    enabled: !!businessId,
  });

  // Fetch user details for each business user
  const userIds = users?.map((u) => u.user_id) || [];
  const userDetailsQueries = useQuery({
    queryKey: ['user-details', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const details: Record<string, any> = {};
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const user = await getUserById(userId);
            if (user) details[userId] = user;
          } catch (error) {
            // Silently fail for individual users
          }
        })
      );
      return details;
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const getUserDetails = (userId: string) => {
    return userDetailsQueries.data?.[userId] || null;
  };

  // Assign user mutation (now uses phone number)
  const assignMutation = useMutation({
    mutationFn: ({ phone, role }: { phone: string; role: Role }) =>
      assignUserToBusiness(businessId, phone, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-users', businessId] });
      setAssignDialogOpen(false);
      setRole(Role.EMPLOYEE);
      toast.success('User assigned successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to assign user', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      updateUserRole(businessId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-users', businessId] });
      setRoleDialogOpen(false);
      setSelectedUser(null);
      toast.success('User role updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update role', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  // Remove user mutation
  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeUserFromBusiness(businessId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-users', businessId] });
      toast.success('User removed successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to remove user', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  // Bulk update role mutation
  const bulkUpdateRoleMutation = useMutation({
    mutationFn: ({ userIds, role }: { userIds: string[]; role: Role }) => {
      return Promise.all(
        userIds.map((userId) => updateUserRole(businessId, userId, role))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-users', businessId] });
      setBulkActionOpen(false);
      setSelectedUserIds(new Set());
      toast.success('User roles updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update roles', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  // Bulk remove mutation
  const bulkRemoveMutation = useMutation({
    mutationFn: (userIds: string[]) => {
      return Promise.all(
        userIds.map((userId) => removeUserFromBusiness(businessId, userId))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-users', businessId] });
      setBulkActionOpen(false);
      setSelectedUserIds(new Set());
      toast.success('Users removed successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to remove users', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  const handleAssignUser = (phone: string, selectedRole: Role) => {
    assignMutation.mutate({ phone, role: selectedRole });
  };

  const handleUpdateRole = () => {
    if (!selectedUser) return;
    updateRoleMutation.mutate({ userId: selectedUser.user_id, role });
  };

  const handleRemoveUser = (userId: string) => {
    removeMutation.mutate(userId);
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default';
      case 'invited':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      case 'removed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage users and their roles in your business
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedUserIds.size > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <Badge variant="secondary">
                {selectedUserIds.size} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkAction('role');
                  setBulkActionOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Update Role
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkAction('remove');
                  setBulkActionOpen(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUserIds(new Set())}
              >
                Clear
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportUsersToCSV(users || [])}
            disabled={!users || users.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <UserSearchDialog
            open={assignDialogOpen}
            onOpenChange={setAssignDialogOpen}
            onSelect={handleAssignUser}
            isLoading={assignMutation.isPending}
            excludeUserIds={users?.map((u) => u.user_id) || []}
          />
          <Button onClick={() => setAssignDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Assign User
          </Button>
        </div>
      </div>

      {users && users.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      if (selectedUserIds.size === users.length) {
                        setSelectedUserIds(new Set());
                      } else {
                        setSelectedUserIds(new Set(users.map((u) => u.user_id)));
                      }
                    }}
                  >
                    {selectedUserIds.size === users.length ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const userDetails = getUserDetails(user.user_id);
                const displayName = userDetails?.name || (userDetails?.phone ? formatPhoneNumber(userDetails.phone) : user.user_id.substring(0, 8) + '...');
                const isSelected = selectedUserIds.has(user.user_id);
                return (
                    <TableRow key={user.id} className={isSelected ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const newSelected = new Set(selectedUserIds);
                            if (isSelected) {
                              newSelected.delete(user.user_id);
                            } else {
                              newSelected.add(user.user_id);
                            }
                            setSelectedUserIds(newSelected);
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userDetails?.avatar_url} />
                          <AvatarFallback>
                            {getUserInitials(userDetails?.name, userDetails?.phone || user.user_id)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{displayName}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {userDetails?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {formatPhoneNumber(userDetails.phone)}
                              </span>
                            )}
                            {userDetails?.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {userDetails.email}
                              </span>
                            )}
                            {!userDetails && (
                              <span className="font-mono text-xs">{user.user_id.substring(0, 8)}...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.joined_at
                        ? new Date(user.joined_at).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUserIdForDetails(user.user_id);
                            setUserDetailsOpen(true);
                          }}
                        >
                          <UserIcon className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setRole(user.role as Role);
                            setRoleDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Update Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleRemoveUser(user.user_id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {users.map((user) => {
              const userDetails = getUserDetails(user.user_id);
              const displayName = userDetails?.name || (userDetails?.phone ? formatPhoneNumber(userDetails.phone) : user.user_id.substring(0, 8) + '...');
              return (
                <Card key={user.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={userDetails?.avatar_url} />
                          <AvatarFallback>
                            {getUserInitials(userDetails?.name, userDetails?.phone || user.user_id)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{displayName}</p>
                          <div className="flex flex-col gap-1 mt-1">
                            {userDetails?.phone && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {formatPhoneNumber(userDetails.phone)}
                              </span>
                            )}
                            {userDetails?.email && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                                <Mail className="h-3 w-3" />
                                {userDetails.email}
                              </span>
                            )}
                            {!userDetails && (
                              <span className="font-mono text-xs text-muted-foreground">{user.user_id.substring(0, 8)}...</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              {getRoleLabel(user.role)}
                            </Badge>
                            <Badge variant={getStatusVariant(user.status)} className="text-xs">
                              {user.status}
                            </Badge>
                          </div>
                          {user.joined_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Joined: {new Date(user.joined_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setRole(user.role as Role);
                              setRoleDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Update Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRemoveUser(user.user_id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <div className="border rounded-lg p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No users assigned yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Assign users to manage your business together
          </p>
        </div>
      )}

      {/* User Details Sheet */}
      {selectedUserIdForDetails && (
        <UserDetailsSheet
          open={userDetailsOpen}
          onOpenChange={(open) => {
            setUserDetailsOpen(open);
            if (!open) {
              setSelectedUserIdForDetails(null);
            }
          }}
          userId={selectedUserIdForDetails}
          businessId={businessId}
        />
      )}

      {/* Bulk Actions Dialog */}
      <Dialog open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'role' ? 'Bulk Update Role' : 'Bulk Remove Users'}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === 'role'
                ? `Update role for ${selectedUserIds.size} selected user(s)`
                : `Remove ${selectedUserIds.size} selected user(s) from this business`}
            </DialogDescription>
          </DialogHeader>
          {bulkAction === 'role' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bulkRole">New Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                    <SelectItem value={Role.EMPLOYEE}>Employee</SelectItem>
                    <SelectItem value={Role.ACCOUNTANT}>Accountant</SelectItem>
                    <SelectItem value={Role.SALESMAN}>Salesman</SelectItem>
                    <SelectItem value={Role.VIEWER}>Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {bulkAction === 'remove' && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to remove {selectedUserIds.size} user(s) from this business?
                This action cannot be undone.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkActionOpen(false);
                setBulkAction(null);
              }}
              disabled={
                bulkUpdateRoleMutation.isPending || bulkRemoveMutation.isPending
              }
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const userIds = Array.from(selectedUserIds);
                if (bulkAction === 'role') {
                  bulkUpdateRoleMutation.mutate({ userIds, role });
                } else if (bulkAction === 'remove') {
                  bulkRemoveMutation.mutate(userIds);
                }
              }}
              disabled={
                bulkUpdateRoleMutation.isPending || bulkRemoveMutation.isPending
              }
              variant={bulkAction === 'remove' ? 'destructive' : 'default'}
            >
              {bulkUpdateRoleMutation.isPending || bulkRemoveMutation.isPending
                ? 'Processing...'
                : bulkAction === 'role'
                ? 'Update Role'
                : 'Remove Users'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              Change the role for user: {selectedUser?.user_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newRole">New Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                  <SelectItem value={Role.EMPLOYEE}>Employee</SelectItem>
                  <SelectItem value={Role.ACCOUNTANT}>Accountant</SelectItem>
                  <SelectItem value={Role.SALESMAN}>Salesman</SelectItem>
                  <SelectItem value={Role.VIEWER}>Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              disabled={updateRoleMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Export users to CSV
 */
function exportUsersToCSV(users: BusinessUser[]) {
  const headers = ['User ID', 'Role', 'Status', 'Joined Date', 'Invited By', 'Created At'];
  const rows = users.map((user) => [
    user.user_id,
    user.role,
    user.status,
    user.joined_at ? new Date(user.joined_at).toISOString() : 'N/A',
    user.invited_by || 'N/A',
    new Date(user.created_at).toISOString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `business-users-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

