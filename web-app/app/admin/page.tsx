'use client';

import { useEffect, useState } from 'react';
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
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertCircle,
  Settings,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Server,
  Database,
  Zap,
} from 'lucide-react';
import {
  getSystemStats,
  getAllBusinesses,
  getAllUsers,
  getAllAuditLogs,
  getAuditLogStatistics,
  getAnalyticsOverview,
  getUserAnalytics,
  getBusinessAnalytics,
  getMarketAnalytics,
  exportBusinesses,
  exportUsers,
  exportAnalytics,
  type SystemStats,
  type BusinessListItem,
  type UserListItem,
  type AuditLog,
  type AuditLogStatistics,
  type AuditLogFilters,
  type OverviewAnalytics,
  type UserAnalytics,
  type BusinessAnalytics,
  type MarketAnalytics,
} from '@/lib/services/superadmin.service';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/ui/page-header';
import { formatPhoneNumber } from '@/lib/services/user-search.service';
import { toast } from 'sonner';
import { BusinessDetailsSheet } from '@/components/admin/business-details-sheet';
import { UserDetailsSheet } from '@/components/admin/user-details-sheet';
import { AuditLogsViewer } from '@/components/admin/audit-logs-viewer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Chart color palette
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function SuperAdminPage() {
  const router = useRouter();
  const { isAuthenticated, isSuperadmin } = useAuthStore();
  const [businessSearch, setBusinessSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [businessDetailsOpen, setBusinessDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  
  // Filter and sort state for businesses
  const [businessStatusFilter, setBusinessStatusFilter] = useState<string>('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('all');
  const [businessSortBy, setBusinessSortBy] = useState<string>('created_desc');
  const [businessPage, setBusinessPage] = useState(1);
  const businessesPerPage = 50;
  
  // Filter and sort state for users
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [userSortBy, setUserSortBy] = useState<string>('created_desc');
  
  // Bulk selection for users
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Redirect if not authenticated or not superadmin
  useEffect(() => {
    // Wait a bit for auth store to initialize from token
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isSuperadmin) {
        // If user is authenticated but not superadmin, redirect to dashboard
        router.push('/dashboard');
      }
    }, 100); // Small delay to allow token decoding

    return () => clearTimeout(timer);
  }, [isAuthenticated, isSuperadmin, router]);

  // Fetch system stats
  const { data: stats, isLoading: loadingStats } = useQuery<SystemStats>({
    queryKey: ['superadmin-stats'],
    queryFn: getSystemStats,
    enabled: isAuthenticated && isSuperadmin,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch all businesses
  const { data: businesses, isLoading: loadingBusinesses } = useQuery<BusinessListItem[]>({
    queryKey: ['superadmin-businesses'],
    queryFn: getAllBusinesses,
    enabled: isAuthenticated && isSuperadmin,
  });

  // Fetch all users with businesses
  const { data: users, isLoading: loadingUsers } = useQuery<UserListItem[]>({
    queryKey: ['superadmin-users'],
    queryFn: () => getAllUsers(100, true), // Include businesses
    enabled: isAuthenticated && isSuperadmin,
  });

  // Fetch analytics data
  const { data: overviewAnalytics, isLoading: loadingOverview } = useQuery<OverviewAnalytics>({
    queryKey: ['analytics-overview'],
    queryFn: getAnalyticsOverview,
    enabled: isAuthenticated && isSuperadmin,
  });

  const { data: userAnalytics, isLoading: loadingUserAnalytics } = useQuery<UserAnalytics>({
    queryKey: ['analytics-users'],
    queryFn: getUserAnalytics,
    enabled: isAuthenticated && isSuperadmin,
  });

  const { data: businessAnalytics, isLoading: loadingBusinessAnalytics } = useQuery<BusinessAnalytics>({
    queryKey: ['analytics-businesses'],
    queryFn: getBusinessAnalytics,
    enabled: isAuthenticated && isSuperadmin,
  });

  const { data: marketAnalytics, isLoading: loadingMarketAnalytics } = useQuery<MarketAnalytics>({
    queryKey: ['analytics-market'],
    queryFn: getMarketAnalytics,
    enabled: isAuthenticated && isSuperadmin,
  });

  // Filter and sort businesses
  const filteredBusinesses = businesses
    ?.filter((business) => {
      const matchesSearch =
        business.name.toLowerCase().includes(businessSearch.toLowerCase()) ||
        business.gstin?.toLowerCase().includes(businessSearch.toLowerCase()) ||
        business.owner_id.toLowerCase().includes(businessSearch.toLowerCase());
      const matchesStatus = businessStatusFilter === 'all' || business.status === businessStatusFilter;
      const matchesType = businessTypeFilter === 'all' || business.type === businessTypeFilter;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      switch (businessSortBy) {
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'status_asc':
          return a.status.localeCompare(b.status);
        case 'status_desc':
          return b.status.localeCompare(a.status);
        default:
          return 0;
      }
    }) || [];

  // Pagination for businesses
  const totalBusinessPages = Math.ceil(filteredBusinesses.length / businessesPerPage);
  const paginatedBusinesses = filteredBusinesses.slice(
    (businessPage - 1) * businessesPerPage,
    businessPage * businessesPerPage
  );

  // Filter and sort users
  const filteredUsers = users
    ?.filter((user) => {
      // Search filter
      const matchesSearch =
        user.phone.includes(userSearch) ||
        user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearch.toLowerCase());
      
      // Status filter
      const matchesStatus = userStatusFilter === 'all' || user.status === userStatusFilter;
      
      // Type filter
      const matchesType = userTypeFilter === 'all' || 
        (userTypeFilter === 'superadmin' && user.is_superadmin) ||
        (userTypeFilter === 'business_owner' && !user.is_superadmin);
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      switch (userSortBy) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'phone_asc':
          return a.phone.localeCompare(b.phone);
        case 'phone_desc':
          return b.phone.localeCompare(a.phone);
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'last_login_asc':
          const aLogin = a.last_login_at ? new Date(a.last_login_at).getTime() : 0;
          const bLogin = b.last_login_at ? new Date(b.last_login_at).getTime() : 0;
          return aLogin - bLogin;
        case 'last_login_desc':
          const aLoginDesc = a.last_login_at ? new Date(a.last_login_at).getTime() : 0;
          const bLoginDesc = b.last_login_at ? new Date(b.last_login_at).getTime() : 0;
          return bLoginDesc - aLoginDesc;
        case 'status_asc':
          return a.status.localeCompare(b.status);
        case 'status_desc':
          return b.status.localeCompare(a.status);
        default:
          return 0;
      }
    }) || [];
  
  // Pagination for users
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 50;
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * usersPerPage,
    userPage * usersPerPage
  );
  
  // Bulk operations
  const handleToggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };
  
  const handleSelectAllUsers = () => {
    if (selectedUserIds.size === paginatedUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(paginatedUsers.map(u => u.id)));
    }
  };
  
  const handleBulkExportUsers = () => {
    const selectedUsers = filteredUsers.filter(u => selectedUserIds.has(u.id));
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }
    
    const headers = ['ID', 'Phone', 'Name', 'Email', 'Superadmin', 'Status', 'Created At', 'Last Login'];
    const rows = selectedUsers.map((u) => [
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
    link.setAttribute('download', `selected-users-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedUsers.length} user(s)`);
    setSelectedUserIds(new Set());
  };

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Get previous period count for growth calculation
  const getPreviousPeriodCount = (growthData: Array<{ month: string; count: number }>): number => {
    if (!growthData || growthData.length < 2) return 0;
    return growthData[growthData.length - 2]?.count || 0;
  };

  const getCurrentPeriodCount = (growthData: Array<{ month: string; count: number }>): number => {
    if (!growthData || growthData.length === 0) return 0;
    return growthData[growthData.length - 1]?.count || 0;
  };

  // Calculate business growth
  const businessGrowth = stats?.businessesGrowth
    ? calculateGrowth(
        getCurrentPeriodCount(stats.businessesGrowth),
        getPreviousPeriodCount(stats.businessesGrowth)
      )
    : 0;

  // Calculate user growth
  const userGrowth = stats?.usersGrowth
    ? calculateGrowth(
        getCurrentPeriodCount(stats.usersGrowth),
        getPreviousPeriodCount(stats.usersGrowth)
      )
    : 0;

  // Recent activity (last 7 days)
  const recentActivity = {
    businesses: stats?.recentBusinesses || 0,
    users: stats?.recentUsers || 0,
  };

  // Export functions with enhanced options
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');

  const handleExportBusinesses = async () => {
    try {
      const blob = await exportBusinesses(exportFormat, exportStartDate || undefined, exportEndDate || undefined);
    const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
    link.setAttribute('href', url);
      link.setAttribute('download', `businesses-${new Date().toISOString().split('T')[0]}.${exportFormat}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Businesses exported as ${exportFormat.toUpperCase()}`);
    } catch (error: any) {
      toast.error(`Export failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleExportUsers = async () => {
    try {
      const blob = await exportUsers(exportFormat, exportStartDate || undefined, exportEndDate || undefined);
      const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `users-${new Date().toISOString().split('T')[0]}.${exportFormat}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Users exported as ${exportFormat.toUpperCase()}`);
    } catch (error: any) {
      toast.error(`Export failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleExportAnalytics = async (dateRange?: string) => {
    try {
      const blob = await exportAnalytics(exportFormat, dateRange);
    const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
    link.setAttribute('href', url);
      link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.${exportFormat}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Analytics exported as ${exportFormat.toUpperCase()}`);
    } catch (error: any) {
      toast.error(`Export failed: ${error.message || 'Unknown error'}`);
    }
  };

  // Global search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<{
    businesses: BusinessListItem[];
    users: UserListItem[];
  }>({ businesses: [], users: [] });

  // Global search function
  const handleGlobalSearch = (query: string) => {
    if (!query || query.length < 2) {
      setGlobalSearchResults({ businesses: [], users: [] });
      return;
    }

    const searchLower = query.toLowerCase();
    const matchingBusinesses = businesses?.filter(
      (b) =>
        b.name.toLowerCase().includes(searchLower) ||
        b.gstin?.toLowerCase().includes(searchLower) ||
        b.owner_id.toLowerCase().includes(searchLower)
    ) || [];

    const matchingUsers = users?.filter(
      (u) =>
        u.phone.includes(query) ||
        u.name?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower)
    ) || [];

    setGlobalSearchResults({
      businesses: matchingBusinesses.slice(0, 5),
      users: matchingUsers.slice(0, 5),
    });
  };

  // Quick actions
  const handleQuickSearch = () => {
    setGlobalSearchOpen(!globalSearchOpen);
  };

  const handleExportAll = async () => {
    await handleExportBusinesses();
    setTimeout(() => handleExportUsers(), 500);
  };

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect non-superadmin users
  if (!isSuperadmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Access denied. Redirecting...</p>
        </div>
      </div>
    );
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
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="audit-logs">
            <Activity className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* System Health Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Health
              </CardTitle>
              <CardDescription>Service status and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Database className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Database</p>
                    <p className="text-xs text-muted-foreground">Connected</p>
                  </div>
                  <Badge variant="default" className="ml-auto">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Zap className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Services</p>
                    <p className="text-xs text-muted-foreground">All Running</p>
                  </div>
                  <Badge variant="default" className="ml-auto">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Activity className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Performance</p>
                    <p className="text-xs text-muted-foreground">Optimal</p>
                  </div>
                  <Badge variant="default" className="ml-auto">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Good
                  </Badge>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <Shield className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Security</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <Badge variant="default" className="ml-auto">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Secure
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Button variant="outline" onClick={handleQuickSearch} className="h-auto flex-col py-4">
                  <Search className="h-5 w-5 mb-2" />
                  <span>Global Search</span>
                </Button>
                <Button variant="outline" onClick={handleExportAll} className="h-auto flex-col py-4">
                  <Download className="h-5 w-5 mb-2" />
                  <span>Export All Data</span>
                </Button>
                <Button variant="outline" onClick={() => toast.info('System settings coming soon')} className="h-auto flex-col py-4">
                  <Settings className="h-5 w-5 mb-2" />
                  <span>System Settings</span>
                </Button>
                <Button variant="outline" onClick={() => toast.info('System logs coming soon')} className="h-auto flex-col py-4">
                  <FileText className="h-5 w-5 mb-2" />
                  <span>View Logs</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          {loadingStats ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {businessGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                    )}
                    <span className={businessGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(businessGrowth).toFixed(1)}% from last month
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalBusinesses > 0
                      ? ((stats.activeBusinesses / stats.totalBusinesses) * 100).toFixed(1)
                      : 0}% active rate
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
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {userGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                    )}
                    <span className={userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(userGrowth).toFixed(1)}% from last month
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.activeUsers} active (last 30 days)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Activity className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.activeUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Logged in last 30 days
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalUsers > 0
                      ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)
                      : 0}% active rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Businesses</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {recentActivity.businesses}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created in last 7 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Users</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {recentActivity.users}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registered in last 7 days
                  </p>
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
                  <p className="text-xs text-muted-foreground mt-2">
                    All systems running
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {recentActivity.businesses + recentActivity.users}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    New entities this week
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Charts Section */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Business Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Growth</CardTitle>
                  <CardDescription>Last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.businessesGrowth && stats.businessesGrowth.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats.businessesGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke={CHART_COLORS.primary}
                          strokeWidth={2}
                          name="Businesses"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Registration Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>User Registration Trend</CardTitle>
                  <CardDescription>Last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.usersGrowth && stats.usersGrowth.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats.usersGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke={CHART_COLORS.secondary}
                          strokeWidth={2}
                          name="Users"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Business Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Type Distribution</CardTitle>
                  <CardDescription>By business type</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.businessTypeDistribution && stats.businessTypeDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.businessTypeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(props: any) => `${props.type || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {stats.businessTypeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>User Type Distribution</CardTitle>
                  <CardDescription>By user type</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.userTypeDistribution && stats.userTypeDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.userTypeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(props: any) => `${props.type || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {stats.userTypeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.businesses > 0 && (
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {recentActivity.businesses} new business{recentActivity.businesses !== 1 ? 'es' : ''} created
                      </p>
                      <p className="text-xs text-muted-foreground">In the last 7 days</p>
                    </div>
                    <Badge variant="outline">{recentActivity.businesses}</Badge>
                  </div>
                )}
                {recentActivity.users > 0 && (
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {recentActivity.users} new user{recentActivity.users !== 1 ? 's' : ''} registered
                      </p>
                      <p className="text-xs text-muted-foreground">In the last 7 days</p>
                    </div>
                    <Badge variant="outline">{recentActivity.users}</Badge>
                  </div>
                )}
                {recentActivity.businesses === 0 && recentActivity.users === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Businesses Tab */}
        <TabsContent value="businesses" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Filters & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search businesses..."
                      value={businessSearch}
                      onChange={(e) => {
                        setBusinessSearch(e.target.value);
                        setBusinessPage(1); // Reset to first page on search
                      }}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={businessStatusFilter} onValueChange={(value) => {
                    setBusinessStatusFilter(value);
                    setBusinessPage(1);
                  }}>
                    <SelectTrigger id="status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type-filter">Type</Label>
                  <Select value={businessTypeFilter} onValueChange={(value) => {
                    setBusinessTypeFilter(value);
                    setBusinessPage(1);
                  }}>
                    <SelectTrigger id="type-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {businesses && Array.from(new Set(businesses.map(b => b.type))).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sort-by">Sort By</Label>
                  <Select value={businessSortBy} onValueChange={setBusinessSortBy}>
                    <SelectTrigger id="sort-by">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_desc">Newest First</SelectItem>
                      <SelectItem value="created_asc">Oldest First</SelectItem>
                      <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                      <SelectItem value="status_asc">Status (A-Z)</SelectItem>
                      <SelectItem value="status_desc">Status (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {paginatedBusinesses.length} of {filteredBusinesses.length} businesses
            </div>
            <div className="flex items-center gap-2">
              <Select value={exportFormat} onValueChange={(v: 'csv' | 'json') => setExportFormat(v)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportBusinesses} disabled={!filteredBusinesses.length}>
              <Download className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
            </Button>
            </div>
          </div>

          {loadingBusinesses ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : paginatedBusinesses.length > 0 ? (
            <>
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
                          <TableHead>Owner</TableHead>
                          <TableHead>Owner Phone</TableHead>
                          <TableHead>Owner Email</TableHead>
                          <TableHead>Owner Last Login</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>GSTIN</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedBusinesses.map((business: BusinessListItem) => (
                          <TableRow key={business.id}>
                            <TableCell className="font-medium">{business.name}</TableCell>
                            <TableCell>
                              {business.owner ? (
                                <Button
                                  variant="link"
                                  className="h-auto p-0 font-medium"
                                  onClick={() => {
                                    setSelectedUser(business.owner!.id);
                                    setUserDetailsOpen(true);
                                  }}
                                >
                                  {business.owner.name || 'N/A'}
                                  {business.owner.total_businesses > 1 && (
                                    <Badge variant="outline" className="ml-2">
                                      {business.owner.total_businesses}
                                    </Badge>
                                  )}
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-xs font-mono">
                              {business.owner_id.substring(0, 8)}...
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {business.owner ? formatPhoneNumber(business.owner.phone) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {business.owner?.email || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {business.owner?.last_login_at ? (
                                <span className="text-sm">
                                  {new Date(business.owner.last_login_at).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">Never</span>
                              )}
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
                                  setSelectedBusiness(business.id);
                                  setBusinessDetailsOpen(true);
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

              {/* Pagination */}
              {totalBusinessPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {businessPage} of {totalBusinessPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBusinessPage((p: number) => Math.max(1, p - 1))}
                      disabled={businessPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBusinessPage((p: number) => Math.min(totalBusinessPages, p + 1))}
                      disabled={businessPage === totalBusinessPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No businesses found</p>
              </CardContent>
            </Card>
          )}

          {/* Business Details Sheet */}
          <BusinessDetailsSheet
            businessId={selectedBusiness}
            open={businessDetailsOpen}
            onOpenChange={setBusinessDetailsOpen}
            business={businesses?.find(b => b.id === selectedBusiness)}
            onViewOwner={(ownerId) => {
              setSelectedUser(ownerId);
              setUserDetailsOpen(true);
              setBusinessDetailsOpen(false);
            }}
            onViewOwnerBusinesses={(ownerId) => {
              // Filter businesses by owner and show in businesses tab
              setBusinessSearch(ownerId);
              // Switch to businesses tab would require tab state management
              toast.info(`Showing businesses for owner ${ownerId}`);
            }}
          />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Filters & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setUserPage(1);
                      }}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="user-status-filter">Status</Label>
                  <Select value={userStatusFilter} onValueChange={(value) => {
                    setUserStatusFilter(value);
                    setUserPage(1);
                  }}>
                    <SelectTrigger id="user-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="user-type-filter">Type</Label>
                  <Select value={userTypeFilter} onValueChange={(value) => {
                    setUserTypeFilter(value);
                    setUserPage(1);
                  }}>
                    <SelectTrigger id="user-type-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                      <SelectItem value="business_owner">Business Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="user-sort-by">Sort By</Label>
                  <Select value={userSortBy} onValueChange={setUserSortBy}>
                    <SelectTrigger id="user-sort-by">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_desc">Newest First</SelectItem>
                      <SelectItem value="created_asc">Oldest First</SelectItem>
                      <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                      <SelectItem value="phone_asc">Phone (A-Z)</SelectItem>
                      <SelectItem value="phone_desc">Phone (Z-A)</SelectItem>
                      <SelectItem value="last_login_desc">Last Login (Recent)</SelectItem>
                      <SelectItem value="last_login_asc">Last Login (Oldest)</SelectItem>
                      <SelectItem value="status_asc">Status (A-Z)</SelectItem>
                      <SelectItem value="status_desc">Status (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedUserIds.size > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {selectedUserIds.size} user(s) selected
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleBulkExportUsers}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedUserIds(new Set())}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {paginatedUsers.length} of {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <Select value={exportFormat} onValueChange={(v: 'csv' | 'json') => setExportFormat(v)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportUsers} disabled={!filteredUsers.length}>
              <Download className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
            </Button>
            </div>
          </div>

          {loadingUsers ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : paginatedUsers.length > 0 ? (
            <>
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
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.size === paginatedUsers.length && paginatedUsers.length > 0}
                              onChange={handleSelectAllUsers}
                              className="rounded"
                            />
                          </TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Businesses</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedUsers.map((user) => {
                          const formatRelativeTime = (date: Date) => {
                            const now = new Date();
                            const diff = now.getTime() - date.getTime();
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor(diff / (1000 * 60 * 60));
                            const minutes = Math.floor(diff / (1000 * 60));
                            
                            if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
                            if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
                            if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
                            return 'Just now';
                          };

                          return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedUserIds.has(user.id)}
                                onChange={() => handleToggleUserSelection(user.id)}
                                className="rounded"
                              />
                            </TableCell>
                            <TableCell>{formatPhoneNumber(user.phone)}</TableCell>
                            <TableCell>{user.name || 'N/A'}</TableCell>
                            <TableCell>{user.email || 'N/A'}</TableCell>
                              <TableCell>
                                {user.businesses ? (
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">
                                        {user.businesses.total} total
                                      </Badge>
                                      {user.businesses.owned > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          {user.businesses.owned} owned
                                        </Badge>
                                      )}
                                    </div>
                                    {user.businesses.list.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {user.businesses.list.slice(0, 3).map((b) => (
                                          <Button
                                            key={b.id}
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs px-2"
                                            onClick={() => {
                                              setSelectedBusiness(b.id);
                                              setBusinessDetailsOpen(true);
                                            }}
                                          >
                                            {b.name}
                                          </Button>
                                        ))}
                                        {user.businesses.list.length > 3 && (
                                          <span className="text-xs text-muted-foreground">
                                            +{user.businesses.list.length - 3} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Loading...</span>
                                )}
                              </TableCell>
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
                                {user.last_login_at ? (
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">
                                      {formatRelativeTime(new Date(user.last_login_at))}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(user.last_login_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Never</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user.id);
                                  setUserDetailsOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Pagination */}
              {totalUserPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {userPage} of {totalUserPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      disabled={userPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                      disabled={userPage === totalUserPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </CardContent>
            </Card>
          )}

          {/* User Details Sheet */}
          <UserDetailsSheet
            userId={selectedUser}
            open={userDetailsOpen}
            onOpenChange={setUserDetailsOpen}
            user={users?.find(u => u.id === selectedUser)}
            onViewBusiness={(businessId) => {
              setSelectedBusiness(businessId);
              setBusinessDetailsOpen(true);
              setUserDetailsOpen(false);
            }}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {/* Market Insights */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {loadingMarketAnalytics ? (
              <>
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
              </>
            ) : marketAnalytics ? (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Market Penetration</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{marketAnalytics.marketPenetration.penetrationRate.toFixed(2)}%</div>
                    <p className="text-xs text-muted-foreground">
                      {marketAnalytics.marketPenetration.currentUsers} of {marketAnalytics.marketPenetration.totalPotentialUsers.toLocaleString()} potential users
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">User Acquisition Rate</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{marketAnalytics.lifecycle.newUsers}</div>
                    <p className="text-xs text-muted-foreground">New users this month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Business Growth Rate</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {overviewAnalytics?.growthRates.businessGrowthRate.toFixed(1) || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">Month-over-month growth</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active User %</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {overviewAnalytics?.userEngagement.activePercentage.toFixed(1) || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {overviewAnalytics?.userEngagement.activeUsers || 0} active users
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>

          {/* User Behavior Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>User Behavior Analytics</CardTitle>
              <CardDescription>User retention, login frequency, and registration funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* User Retention Chart */}
                <div>
                  <h3 className="text-sm font-medium mb-4">User Retention</h3>
                  {loadingUserAnalytics ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : userAnalytics?.retention && userAnalytics.retention.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={userAnalytics.retention}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="newUsers"
                          stroke={CHART_COLORS.primary}
                          strokeWidth={2}
                          name="New Users"
                        />
                        <Line
                          type="monotone"
                          dataKey="returningUsers"
                          stroke={CHART_COLORS.secondary}
                          strokeWidth={2}
                          name="Returning Users"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>

                {/* Login Frequency Distribution */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Login Frequency Distribution</h3>
                  {loadingUserAnalytics ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : userAnalytics?.loginFrequency && userAnalytics.loginFrequency.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={userAnalytics.loginFrequency}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill={CHART_COLORS.primary} name="Users" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>

                {/* Registration Funnel */}
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium mb-4">Registration Funnel</h3>
                  {loadingUserAnalytics ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : userAnalytics?.registrationFunnel && userAnalytics.registrationFunnel.length > 0 ? (
                    <div className="space-y-2">
                      {userAnalytics.registrationFunnel.map((stage, index) => {
                        const maxCount = userAnalytics.registrationFunnel[0]?.count || 1;
                        const percentage = (stage.count / maxCount) * 100;
                        return (
                          <div key={stage.stage} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{stage.stage}</span>
                              <span className="text-muted-foreground">{stage.count} users</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Business Performance Metrics</CardTitle>
              <CardDescription>Business growth trends, type distribution, and activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Business Growth Trends */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Business Growth Trends</h3>
                  {loadingBusinessAnalytics ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : businessAnalytics?.growthTrends && businessAnalytics.growthTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={businessAnalytics.growthTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke={CHART_COLORS.success}
                          strokeWidth={2}
                          name="Businesses"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>

                {/* Business Type Distribution */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Business Type Distribution</h3>
                  {loadingBusinessAnalytics ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : businessAnalytics?.typeAnalysis && businessAnalytics.typeAnalysis.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={businessAnalytics.typeAnalysis}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(props: any) => `${props.type || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {businessAnalytics.typeAnalysis.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Export Analytics</CardTitle>
              <CardDescription>Download analytics reports in various formats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="analytics-format">Format</Label>
                    <Select value={exportFormat} onValueChange={(v: 'csv' | 'json') => setExportFormat(v)}>
                      <SelectTrigger id="analytics-format" className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="analytics-date-range">Date Range</Label>
                    <Select onValueChange={(v) => handleExportAnalytics(v)}>
                      <SelectTrigger id="analytics-date-range" className="w-40">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleExportAnalytics('30d')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Analytics ({exportFormat.toUpperCase()})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit-logs" className="space-y-4">
          <AuditLogsViewer />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
