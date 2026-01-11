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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Building2,
  Calendar,
  Phone,
  Mail,
  Shield,
  Activity,
  Download,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { authApi, businessApi } from '@/lib/api-client';
import { formatPhoneNumber, getUserInitials } from '@/lib/services/user-search.service';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Role } from '@/lib/services/rbac.service';

interface UserDetailsSheetProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    is_superadmin: boolean;
    status: string;
    created_at: Date;
    last_login_at?: Date;
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
  };
  onViewBusiness?: (businessId: string) => void;
}

interface UserBusiness {
  id: string;
  name: string;
  role: Role;
  isOwner: boolean;
  status: string;
}

interface AuditLog {
  id: string;
  action: string;
  business_id?: string;
  user_id?: string;
  target_user_id?: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  created_at: Date;
  notes?: string;
}

export function UserDetailsSheet({
  userId,
  open,
  onOpenChange,
  user,
  onViewBusiness,
}: UserDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'activity'>('overview');

  // Fetch user details
  const { data: userDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['user-details', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await authApi.get(`/users/${userId}`);
      return response.data;
    },
    enabled: open && !!userId,
  });

  // Fetch user's businesses
  const { data: userBusinesses, isLoading: loadingBusinesses } = useQuery<{ businesses: UserBusiness[] }>({
    queryKey: ['user-businesses', userId],
    queryFn: async () => {
      if (!userId) return { businesses: [] };
      const response = await businessApi.get(`/users/${userId}/businesses`);
      return response.data || { businesses: [] };
    },
    enabled: open && !!userId && activeTab === 'businesses',
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading: loadingLogs } = useQuery<{ logs: AuditLog[]; total: number }>({
    queryKey: ['user-audit-logs', userId],
    queryFn: async () => {
      if (!userId) return { logs: [], total: 0 };
      const response = await businessApi.get(`/users/${userId}/audit-logs`, {
        params: { limit: 50 },
      });
      return response.data || { logs: [], total: 0 };
    },
    enabled: open && !!userId && activeTab === 'activity',
  });

  const handleExportUser = () => {
    if (!userDetails) return;

    const data = {
      User: userDetails,
      Businesses: userBusinesses?.businesses || [],
      AuditLogs: auditLogs?.logs || [],
    };

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `user-${userDetails.id}-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('User data exported');
  };

  const displayUser = userDetails || user;

  if (!displayUser) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {displayUser.name || formatPhoneNumber(displayUser.phone)}
          </SheetTitle>
          <SheetDescription>User profile and management</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="businesses">
                Businesses ({userBusinesses?.businesses?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="activity">
                Activity ({auditLogs?.total || 0})
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {loadingDetails ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <>
                  {/* User Profile */}
                  <Card>
                    <CardHeader>
                      <CardTitle>User Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={displayUser.avatar_url} />
                          <AvatarFallback>
                            {getUserInitials(displayUser.name || displayUser.phone)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-semibold">
                              {displayUser.name || 'No Name'}
                            </p>
                            {displayUser.is_superadmin && (
                              <Badge variant="default">
                                <Shield className="h-3 w-3 mr-1" />
                                Superadmin
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatPhoneNumber(displayUser.phone)}
                          </p>
                          {displayUser.email && (
                            <p className="text-sm text-muted-foreground">{displayUser.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Status</p>
                          <Badge variant={displayUser.status === 'active' ? 'default' : 'secondary'}>
                            {displayUser.status === 'active' ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {displayUser.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">User Type</p>
                          <p className="text-sm font-semibold">
                            {displayUser.user_type || 'business_owner'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Registered</p>
                          <p className="text-sm">
                            {new Date(displayUser.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Last Login</p>
                          <p className="text-sm">
                            {displayUser.last_login_at
                              ? new Date(displayUser.last_login_at).toLocaleDateString()
                              : 'Never'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{userBusinesses?.businesses?.length || 0}</p>
                          <p className="text-sm text-muted-foreground">Total Businesses</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{auditLogs?.total || 0}</p>
                          <p className="text-sm text-muted-foreground">Activity Logs</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {displayUser.phone_verified ? 'Yes' : 'No'}
                          </p>
                          <p className="text-sm text-muted-foreground">Phone Verified</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportUser} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Businesses Tab */}
            <TabsContent value="businesses" className="space-y-4">
              {loadingBusinesses ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (userBusinesses?.businesses && userBusinesses.businesses.length > 0) || (user?.businesses && user.businesses.list.length > 0) ? (
                <>
                  {/* Summary Card */}
                  {(user?.businesses) && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Business Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{user.businesses.total}</p>
                            <p className="text-sm text-muted-foreground">Total Businesses</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{user.businesses.owned}</p>
                            <p className="text-sm text-muted-foreground">Owned</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{user.businesses.assigned}</p>
                            <p className="text-sm text-muted-foreground">Assigned</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                <Card>
                  <CardHeader>
                    <CardTitle>User's Businesses</CardTitle>
                    <CardDescription>
                        {(userBusinesses?.businesses?.length || user?.businesses?.list.length || 0)} business(es) associated
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Business Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Is Owner</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(userBusinesses?.businesses || user?.businesses?.list || []).map((ub) => (
                            <TableRow key={ub.id}>
                                <TableCell>
                                  <Button
                                    variant="link"
                                    className="h-auto p-0 font-medium"
                                    onClick={() => {
                                      if (onViewBusiness) {
                                        onViewBusiness(ub.id);
                                      } else {
                                        toast.info('Business details coming soon');
                                      }
                                    }}
                                  >
                                    {ub.name}
                                  </Button>
                                </TableCell>
                              <TableCell>
                                <Badge variant="outline">{ub.role}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={ub.status === 'active' ? 'default' : 'secondary'}>
                                  {ub.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {ub.isOwner ? (
                                  <Badge variant="default">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Owner
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">No</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                      if (onViewBusiness) {
                                        onViewBusiness(ub.id);
                                      } else {
                                    toast.info('Business details coming soon');
                                      }
                                  }}
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No businesses found</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              {loadingLogs ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : auditLogs && auditLogs.logs.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Logs</CardTitle>
                    <CardDescription>{auditLogs.total} log(s) found</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {auditLogs.logs.map((log) => (
                        <div key={log.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">{log.action}</p>
                              </div>
                              {log.notes && (
                                <p className="text-sm text-muted-foreground mb-2">{log.notes}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {new Date(log.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No activity logs found</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

