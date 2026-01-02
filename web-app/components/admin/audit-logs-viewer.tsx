'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  Building2,
  Filter,
  BarChart3,
} from 'lucide-react';
import {
  getAllAuditLogs,
  getAuditLogStatistics,
  type AuditLog,
  type AuditLogFilters,
  type AuditLogStatistics,
} from '@/lib/services/superadmin.service';
import { toast } from 'sonner';
import { formatPhoneNumber } from '@/lib/services/user-search.service';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function AuditLogsViewer() {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [auditPage, setAuditPage] = useState(1);
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 100,
  });

  // Fetch audit logs
  const { data: auditLogsData, isLoading: loadingLogs } = useQuery<{ total: number; logs: AuditLog[] }>({
    queryKey: ['all-audit-logs', filters],
    queryFn: () => getAllAuditLogs(filters),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch audit log statistics
  const { data: statistics, isLoading: loadingStats } = useQuery<AuditLogStatistics>({
    queryKey: ['audit-log-statistics'],
    queryFn: getAuditLogStatistics,
  });

  const auditLogs = auditLogsData?.logs || [];
  const totalLogs = auditLogsData?.total || 0;

  // Pagination
  const logsPerPage = 50;
  const totalPages = Math.ceil(auditLogs.length / logsPerPage);
  const paginatedLogs = auditLogs.slice(
    (auditPage - 1) * logsPerPage,
    auditPage * logsPerPage
  );

  const toggleExpand = (logId: string) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const handleExport = () => {
    const headers = [
      'ID',
      'Business ID',
      'User ID',
      'Target User ID',
      'Action',
      'Resource',
      'IP Address',
      'Created At',
      'Notes',
    ];
    const rows = auditLogs.map((log) => [
      log.id,
      log.business_id,
      log.user_id || 'N/A',
      log.target_user_id || 'N/A',
      log.action,
      log.resource || 'N/A',
      log.ip_address || 'N/A',
      new Date(log.created_at).toISOString(),
      log.notes || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported successfully');
  };

  const formatAction = (action: string): string => {
    return action
      .split(':')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatChange = (oldValue?: Record<string, any>, newValue?: Record<string, any>): string => {
    if (!oldValue && !newValue) return 'N/A';
    if (!oldValue) return `Added: ${JSON.stringify(newValue)}`;
    if (!newValue) return `Removed: ${JSON.stringify(oldValue)}`;
    return `Changed from ${JSON.stringify(oldValue)} to ${JSON.stringify(newValue)}`;
  };

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(auditLogs.map((log) => log.action)));

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      {loadingStats ? (
        <div className="grid gap-4 md:grid-cols-4">
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
      ) : statistics ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalLogs}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.mostActiveUsers.length}</div>
                <p className="text-xs text-muted-foreground">Top performers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Action Types</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.mostCommonActions.length}</div>
                <p className="text-xs text-muted-foreground">Unique actions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Businesses</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.logsByBusiness.length}</div>
                <p className="text-xs text-muted-foreground">With activity</p>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Most Common Actions</CardTitle>
                <CardDescription>Top 10 actions by frequency</CardDescription>
              </CardHeader>
              <CardContent>
                {statistics.mostCommonActions.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statistics.mostCommonActions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="action" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Active Users</CardTitle>
                <CardDescription>Top 10 users by activity</CardDescription>
              </CardHeader>
              <CardContent>
                {statistics.mostActiveUsers.length > 0 ? (
                  <div className="space-y-2">
                    {statistics.mostActiveUsers.slice(0, 10).map((item, index) => (
                      <div key={item.user_id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span className="text-sm font-mono text-xs">
                            {item.user_id.substring(0, 8)}...
                          </span>
                        </div>
                        <Badge>{item.count} actions</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="action-filter">Action</Label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(value) => {
                  setFilters((prev) => ({
                    ...prev,
                    action: value === 'all' ? undefined : value,
                  }));
                  setAuditPage(1);
                }}
              >
                <SelectTrigger id="action-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {formatAction(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.startDate ? filters.startDate.split('T')[0] : ''}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  }));
                  setAuditPage(1);
                }}
              />
            </div>
            <div>
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.endDate ? filters.endDate.split('T')[0] : ''}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  }));
                  setAuditPage(1);
                }}
              />
            </div>
            <div>
              <Label htmlFor="limit-filter">Limit</Label>
              <Select
                value={filters.limit?.toString() || '100'}
                onValueChange={(value) => {
                  setFilters((prev) => ({
                    ...prev,
                    limit: parseInt(value, 10),
                  }));
                  setAuditPage(1);
                }}
              >
                <SelectTrigger id="limit-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {paginatedLogs.length} of {totalLogs} logs
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!auditLogs.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Audit Logs Table */}
      {loadingLogs ? (
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : paginatedLogs.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>{totalLogs} log(s) found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Target User</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => {
                      const isExpanded = expandedLogs.has(log.id);
                      return (
                        <>
                          <TableRow key={log.id} className="cursor-pointer" onClick={() => toggleExpand(log.id)}>
                            <TableCell>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(log.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{formatAction(log.action)}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.business_id.substring(0, 8)}...
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.user_id ? `${log.user_id.substring(0, 8)}...` : 'N/A'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.target_user_id ? `${log.target_user_id.substring(0, 8)}...` : 'N/A'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.ip_address || 'N/A'}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={7} className="bg-muted/50">
                                <div className="space-y-3 p-4">
                                  {log.notes && (
                                    <div>
                                      <p className="text-sm font-medium mb-1">Notes:</p>
                                      <p className="text-sm text-muted-foreground">{log.notes}</p>
                                    </div>
                                  )}
                                  {log.old_value && (
                                    <div>
                                      <p className="text-sm font-medium mb-1">Previous Value:</p>
                                      <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
                                        {JSON.stringify(log.old_value, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.new_value && (
                                    <div>
                                      <p className="text-sm font-medium mb-1">New Value:</p>
                                      <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
                                        {JSON.stringify(log.new_value, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.user_agent && (
                                    <div>
                                      <p className="text-sm font-medium mb-1">User Agent:</p>
                                      <p className="text-xs text-muted-foreground">{log.user_agent}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-medium mb-1">Change Summary:</p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatChange(log.old_value, log.new_value)}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {auditPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  disabled={auditPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuditPage((p) => Math.min(totalPages, p + 1))}
                  disabled={auditPage === totalPages}
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
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No audit logs found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

