'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Users,
  BarChart3,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  Download,
  Eye,
} from 'lucide-react';
import {
  getSystemStats,
  getAllBusinesses,
  getAllUsers,
  type SystemStats,
  type BusinessListItem,
  type UserListItem,
} from '@/lib/services/superadmin.service';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/ui/page-header';
import { useState } from 'react';
import { formatPhoneNumber } from '@/lib/services/user-search.service';
import { toast } from 'sonner';

export default function SuperAdminPage() {
  const router = useRouter();
  const { isAuthenticated, isSuperadmin } = useAuthStore();
  const [businessSearch, setBusinessSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Redirect if not authenticated or not superadmin
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (!isSuperadmin) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isSuperadmin, router]);

  // Fetch system stats
  const { data: stats, isLoading: loadingStats } = useQuery<SystemStats>({
    queryKey: ['superadmin-stats'],
    queryFn: getSystemStats,
    enabled: isAuthenticated && isSuperadmin,
  });

  // Fetch all businesses
  const { data: businesses, isLoading: loadingBusinesses } = useQuery<BusinessListItem[]>({
    queryKey: ['superadmin-businesses'],
    queryFn: getAllBusinesses,
    enabled: isAuthenticated && isSuperadmin,
  });

  // Fetch all users
  const { data: users, isLoading: loadingUsers } = useQuery<UserListItem[]>({
    queryKey: ['superadmin-users'],
    queryFn: () => getAllUsers(100), // Limit to 100 for now
    enabled: isAuthenticated && isSuperadmin,
  });

  // Filter businesses by search
  const filteredBusinesses = businesses?.filter((business) =>
    business.name.toLowerCase().includes(businessSearch.toLowerCase()) ||
    business.gstin?.toLowerCase().includes(businessSearch.toLowerCase()) ||
    business.owner_id.toLowerCase().includes(businessSearch.toLowerCase())
  ) || [];

  // Filter users by search
  const filteredUsers = users?.filter((user) =>
    user.phone.includes(userSearch) ||
    user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearch.toLowerCase())
  ) || [];

  // Export functions
  const exportBusinesses = () => {
    const headers = ['ID', 'Name', 'Owner ID', 'Type', 'GSTIN', 'Status', 'Created At'];
    const rows = filteredBusinesses.map((b) => [
      b.id,
      b.name,
      b.owner_id,
      b.type,
      b.gstin || 'N/A',
      b.status,
      new Date(b.created_at).toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `all-businesses-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Businesses exported successfully');
  };

  const exportUsers = () => {
    const headers = ['ID', 'Phone', 'Name', 'Email', 'Superadmin', 'Status', 'Created At', 'Last Login'];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.phone,
      u.name || 'N/A',
      u.email || 'N/A',
      u.is_superadmin ? 'Yes' : 'No',
      u.status,
      new Date(u.created_at).toISOString(),
      u.last_login_at ? new Date(u.last_login_at).toISOString() : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `all-users-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Users exported successfully');
  };

  if (!isAuthenticated || !isSuperadmin) {
    return null;
  }

  return (
    <AppLayout>
      <PageHeader
        title="Super Admin Dashboard"
        description="System-wide management and oversight"
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="businesses">
            <Building2 className="h-4 w-4 mr-2" />
            Businesses
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {loadingStats ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeBusinesses} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Businesses</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.activeBusinesses}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.inactiveBusinesses} inactive
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Registered users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Badge variant="default" className="text-sm">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        {/* Businesses Tab */}
        <TabsContent value="businesses" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search businesses..."
                  value={businessSearch}
                  onChange={(e) => setBusinessSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button variant="outline" onClick={exportBusinesses} disabled={!filteredBusinesses.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {loadingBusinesses ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : filteredBusinesses.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>All Businesses</CardTitle>
                <CardDescription>
                  {filteredBusinesses.length} business(es) found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Owner ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>GSTIN</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBusinesses.map((business) => (
                        <TableRow key={business.id}>
                          <TableCell className="font-medium">{business.name}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {business.owner_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>{business.type}</TableCell>
                          <TableCell>{business.gstin || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={business.status === 'active' ? 'default' : 'secondary'}>
                              {business.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(business.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Navigate to business details or settings
                                toast.info('Business details view coming soon');
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
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No businesses found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button variant="outline" onClick={exportUsers} disabled={!filteredUsers.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {loadingUsers ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : filteredUsers.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  {filteredUsers.length} user(s) found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{formatPhoneNumber(user.phone)}</TableCell>
                          <TableCell>{user.name || 'N/A'}</TableCell>
                          <TableCell>{user.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={user.is_superadmin ? 'default' : 'secondary'}>
                              <Shield className="h-3 w-3 mr-1" />
                              {user.is_superadmin ? 'Superadmin' : 'User'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.last_login_at
                              ? new Date(user.last_login_at).toLocaleDateString()
                              : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Navigate to user details
                                toast.info('User details view coming soon');
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
      </Tabs>
    </AppLayout>
  );
}

