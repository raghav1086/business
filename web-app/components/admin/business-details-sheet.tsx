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
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  Users,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Activity,
  Download,
  Eye,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { businessApi, authApi } from '@/lib/api-client';
import { formatPhoneNumber } from '@/lib/services/user-search.service';
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

interface BusinessDetailsSheetProps {
  businessId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business?: {
    id: string;
    name: string;
    owner_id: string;
    type: string;
    gstin?: string;
    status: string;
    created_at: Date;
    owner?: {
      id: string;
      name?: string;
      phone: string;
      email?: string;
      last_login_at?: Date;
      total_businesses: number;
    };
  };
  onViewOwner?: (ownerId: string) => void;
  onViewOwnerBusinesses?: (ownerId: string) => void;
}

interface BusinessUser {
  id: string;
  user_id: string;
  role: Role;
  status: string;
  created_at: Date;
  user?: {
    id: string;
    phone: string;
    name?: string;
    email?: string;
  };
}

interface AuditLog {
  id: string;
  action: string;
  user_id?: string;
  target_user_id?: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  created_at: Date;
  notes?: string;
}

export function BusinessDetailsSheet({
  businessId,
  open,
  onOpenChange,
  business,
  onViewOwner,
  onViewOwnerBusinesses,
}: BusinessDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview');

  // Fetch business details
  const { data: businessDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['business-details', businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const response = await businessApi.get(`/businesses/${businessId}`);
      return response.data;
    },
    enabled: open && !!businessId,
  });

  // Fetch business users
  const { data: businessUsers, isLoading: loadingUsers } = useQuery<BusinessUser[]>({
    queryKey: ['business-users', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await businessApi.get(`/businesses/${businessId}/users`);
      return response.data || [];
    },
    enabled: open && !!businessId && activeTab === 'users',
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading: loadingLogs } = useQuery<{ logs: AuditLog[]; total: number }>({
    queryKey: ['business-audit-logs', businessId],
    queryFn: async () => {
      if (!businessId) return { logs: [], total: 0 };
      const response = await businessApi.get(`/businesses/${businessId}/audit-logs`, {
        params: { limit: 50 },
      });
      return response.data || { logs: [], total: 0 };
    },
    enabled: open && !!businessId && activeTab === 'activity',
  });

  // Fetch owner details
  const { data: ownerDetails } = useQuery({
    queryKey: ['user-details', businessDetails?.owner_id],
    queryFn: async () => {
      if (!businessDetails?.owner_id) return null;
      const response = await authApi.get(`/users/${businessDetails.owner_id}`);
      return response.data;
    },
    enabled: open && !!businessDetails?.owner_id,
  });

  const handleExportBusiness = () => {
    if (!businessDetails) return;

    const data = {
      Business: businessDetails,
      Users: businessUsers || [],
      AuditLogs: auditLogs?.logs || [],
    };

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `business-${businessDetails.id}-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Business data exported');
  };

  const displayBusiness = businessDetails || business;

  if (!displayBusiness) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {displayBusiness.name}
          </SheetTitle>
          <SheetDescription>Business details and management</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">
                Users ({businessUsers?.length || 0})
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
                  {/* Business Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Name</p>
                          <p className="text-sm font-semibold">{displayBusiness.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Type</p>
                          <p className="text-sm font-semibold">{displayBusiness.type}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Status</p>
                          <Badge variant={displayBusiness.status === 'active' ? 'default' : 'secondary'}>
                            {displayBusiness.status}
                          </Badge>
                        </div>
                        {displayBusiness.gstin && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">GSTIN</p>
                            <p className="text-sm font-semibold font-mono">{displayBusiness.gstin}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Created</p>
                          <p className="text-sm">
                            {new Date(displayBusiness.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Owner Information */}
                  {(ownerDetails || business?.owner) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Owner Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1 flex-1">
                            <p className="text-sm font-semibold">
                                {business?.owner?.name || ownerDetails?.name || 'N/A'}
                            </p>
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  {formatPhoneNumber(business?.owner?.phone || ownerDetails?.phone || '')}
                                </p>
                              </div>
                              {business?.owner?.email || ownerDetails?.email ? (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                    {business?.owner?.email || ownerDetails?.email}
                            </p>
                                </div>
                              ) : null}
                              {business?.owner?.last_login_at || ownerDetails?.last_login_at ? (
                                <div className="flex items-center gap-2 mt-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">
                                    Last login: {new Date(business?.owner?.last_login_at || ownerDetails?.last_login_at || '').toLocaleString()}
                                  </p>
                                </div>
                              ) : null}
                              {business?.owner?.total_businesses !== undefined && business.owner.total_businesses > 1 && (
                                <div className="mt-2">
                                  <Badge variant="outline">
                                    {business.owner.total_businesses} business{business.owner.total_businesses !== 1 ? 'es' : ''}
                                  </Badge>
                                </div>
                            )}
                          </div>
                            <div className="flex flex-col gap-2">
                              {onViewOwner && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                    const ownerId = business?.owner?.id || businessDetails?.owner_id;
                                    if (ownerId) {
                                      onViewOwner(ownerId);
                                    }
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </Button>
                              )}
                              {onViewOwnerBusinesses && business?.owner?.total_businesses && business.owner.total_businesses > 1 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const ownerId = business?.owner?.id || businessDetails?.owner_id;
                                    if (ownerId) {
                                      onViewOwnerBusinesses(ownerId);
                                    }
                                  }}
                                >
                                  <Building2 className="h-4 w-4 mr-2" />
                                  View All Businesses
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{businessUsers?.length || 0}</p>
                          <p className="text-sm text-muted-foreground">Total Users</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{auditLogs?.total || 0}</p>
                          <p className="text-sm text-muted-foreground">Activity Logs</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {new Date(displayBusiness.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">Since</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportBusiness} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              {loadingUsers ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : businessUsers && businessUsers.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Business Users</CardTitle>
                    <CardDescription>{businessUsers.length} user(s) in this business</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {businessUsers.map((bu) => (
                            <TableRow key={bu.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {bu.user?.name || 'N/A'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {bu.user?.phone ? formatPhoneNumber(bu.user.phone) : 'N/A'}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{bu.role}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={bu.status === 'active' ? 'default' : 'secondary'}>
                                  {bu.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(bu.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    toast.info('User details coming soon');
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No users found</p>
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

