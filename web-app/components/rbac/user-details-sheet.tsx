'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
// Separator component - using div with border instead
import { Button } from '@/components/ui/button';
import { Phone, Mail, Building2, Shield, Calendar, CheckCircle, XCircle, User as UserIcon } from 'lucide-react';
import { getUserById, formatPhoneNumber, getUserInitials } from '@/lib/services/user-search.service';
import { businessApi } from '@/lib/api-client';
import { Role } from '@/lib/services/rbac.service';

interface UserDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  businessId?: string; // Current business context
}

interface UserBusiness {
  id: string;
  name: string;
  role: Role;
  isOwner: boolean;
  status: string;
}

export function UserDetailsSheet({
  open,
  onOpenChange,
  userId,
  businessId,
}: UserDetailsSheetProps) {
  // Fetch user details
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user-details', userId],
    queryFn: () => getUserById(userId),
    enabled: open && !!userId,
  });

  // Fetch user's businesses
  const { data: userBusinesses, isLoading: loadingBusinesses } = useQuery({
    queryKey: ['user-businesses', userId],
    queryFn: async () => {
      try {
        // Try to get businesses for this user
        // Note: This endpoint might need to be created or we use the current user's endpoint
        const response = await businessApi.get(`/users/${userId}/businesses`);
        return response.data?.businesses || [];
      } catch (error: any) {
        // If endpoint doesn't exist, return empty array
        if (error.response?.status === 404) {
          return [];
        }
        console.error('Error fetching user businesses:', error);
        return [];
      }
    },
    enabled: open && !!userId,
  });

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>
            View detailed information about this user
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* User Profile Section */}
          {loadingUser ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : user ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {getUserInitials(user.name, user.phone)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {user.name || 'No Name'}
                      </h3>
                      {!user.name && (
                        <p className="text-sm text-muted-foreground">
                          Name not set
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{formatPhoneNumber(user.phone)}</span>
                          {user.phone_verified && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      )}
                      {user.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{user.email}</span>
                          {user.email_verified && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant={user.is_superadmin ? 'default' : 'secondary'}>
                        {user.is_superadmin ? 'Superadmin' : 'User'}
                      </Badge>
                      {user.user_type && (
                        <Badge variant="outline">{user.user_type}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">User not found</p>
              </CardContent>
            </Card>
          )}

          {/* User's Businesses Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Businesses
              </CardTitle>
              <CardDescription>
                All businesses this user belongs to
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBusinesses ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : userBusinesses && userBusinesses.length > 0 ? (
                <div className="space-y-3">
                  {userBusinesses.map((business: UserBusiness) => (
                    <div
                      key={business.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        businessId === business.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{business.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              {business.isOwner ? 'Owner' : business.role}
                            </Badge>
                            <Badge
                              variant={
                                business.status === 'active'
                                  ? 'default'
                                  : 'outline'
                              }
                              className="text-xs"
                            >
                              {business.status}
                            </Badge>
                            {businessId === business.id && (
                              <Badge variant="outline" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>User is not assigned to any businesses</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-xs">{user.id}</span>
                </div>
                <div className="border-t my-2" />
                {user.last_login_at && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Login</span>
                      <span>
                        {new Date(user.last_login_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t my-2" />
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <span className="uppercase">{user.language_preference || 'EN'}</span>
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                    {user.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

