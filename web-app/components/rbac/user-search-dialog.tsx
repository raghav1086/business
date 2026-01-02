'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, User, Phone, Mail, Check } from 'lucide-react';
import { authApi } from '@/lib/api-client';
import { Role } from '@/lib/services/rbac.service';
import { getUserInitials, formatPhoneNumber } from '@/lib/services/user-search.service';

interface UserSearchResult {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (phone: string, role: Role) => void;
  isLoading?: boolean;
  excludeUserIds?: string[]; // Users already in business
}

export function UserSearchDialog({
  open,
  onOpenChange,
  onSelect,
  isLoading = false,
  excludeUserIds = [],
}: UserSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [role, setRole] = useState<Role>(Role.EMPLOYEE);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search users by phone or email
  const handleSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { searchUsers } = await import('@/lib/services/user-search.service');
      const results = await searchUsers(query, 20);
      setSearchResults(results.filter((user) => !excludeUserIds.includes(user.id)));
    } catch (error: any) {
      console.error('Search error:', error);
      setSearchResults([]);
      if (error.response?.status !== 404) {
        toast.error('Failed to search users', {
          description: error.response?.data?.message || error.message,
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
  };

  const handleSubmit = () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }
    // Use phone number instead of user ID
    onSelect(selectedUser.phone, role);
    setSelectedUser(null);
    setSearchQuery('');
    setRole(Role.EMPLOYEE);
  };

  const handleClose = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setRole(Role.EMPLOYEE);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign User to Business</DialogTitle>
          <DialogDescription>
            Search for a user by phone number or email address, then select a role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label>Search User</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Command className="rounded-lg border">
                  <CommandInput
                    placeholder="Enter phone number (e.g., 9876543210) or email..."
                    value={searchQuery}
                    onValueChange={(value) => {
                      setSearchQuery(value);
                      handleSearch(value);
                    }}
                  />
                  <CommandList>
                    {isSearching && (
                      <div className="p-4">
                        <Skeleton className="h-4 w-full" />
                      </div>
                    )}
                    {!isSearching && searchResults.length === 0 && searchQuery.length >= 3 && (
                      <CommandEmpty>
                        <div className="py-6 text-center text-sm">
                          <p className="text-muted-foreground mb-2">No users found</p>
                          <p className="text-xs text-muted-foreground">
                            Try a different phone number or email, or enter the user ID manually below.
                          </p>
                        </div>
                      </CommandEmpty>
                    )}
                    {searchResults.length > 0 && (
                      <CommandGroup heading="Users">
                        {searchResults
                          .filter((user) => !excludeUserIds.includes(user.id))
                          .map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.id}
                              onSelect={() => handleUserSelect(user)}
                              className="flex items-center gap-3 p-3"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback>
                                  {getUserInitials(user.name, user.phone)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">
                                  {user.name || formatPhoneNumber(user.phone)}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {user.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {formatPhoneNumber(user.phone)}
                                    </span>
                                  )}
                                  {user.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {user.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {selectedUser?.id === user.id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter at least 2 characters to search by phone, email, or name. You can also enter a user ID manually below.
            </p>
          </div>

          {/* Manual User ID Input (Fallback) */}
          <div className="space-y-2">
            <Label htmlFor="userId">Or Enter User ID Manually</Label>
            <input
              id="userId"
              type="text"
              placeholder="User ID (UUID)"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedUser?.id || ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedUser({
                    id: e.target.value,
                    phone: '',
                  });
                } else {
                  setSelectedUser(null);
                }
              }}
            />
          </div>

          {/* Selected User Preview */}
          {selectedUser && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback>
                    {getUserInitials(selectedUser.name, selectedUser.phone)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">
                    {selectedUser.name || formatPhoneNumber(selectedUser.phone) || 'User'}
                  </p>
                  {selectedUser.phone && (
                    <p className="text-sm text-muted-foreground">
                      {formatPhoneNumber(selectedUser.phone)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.ADMIN}>
                  <div>
                    <div className="font-medium">Admin</div>
                    <div className="text-xs text-muted-foreground">
                      Full access to manage business
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value={Role.EMPLOYEE}>
                  <div>
                    <div className="font-medium">Employee</div>
                    <div className="text-xs text-muted-foreground">
                      Standard access to business operations
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value={Role.ACCOUNTANT}>
                  <div>
                    <div className="font-medium">Accountant</div>
                    <div className="text-xs text-muted-foreground">
                      Financial and reporting access
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value={Role.SALESMAN}>
                  <div>
                    <div className="font-medium">Salesman</div>
                    <div className="text-xs text-muted-foreground">
                      Sales and customer management
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value={Role.VIEWER}>
                  <div>
                    <div className="font-medium">Viewer</div>
                    <div className="text-xs text-muted-foreground">
                      Read-only access
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !selectedUser}>
            {isLoading ? 'Assigning...' : 'Assign User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

