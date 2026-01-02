'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { FileText, Filter, X, Calendar, Download } from 'lucide-react';
import {
  getBusinessAuditLogs,
  getBusinessUsers,
  type AuditLog,
} from '@/lib/services/rbac.service';

interface AuditLogViewerProps {
  businessId: string;
}

export function AuditLogViewer({ businessId }: AuditLogViewerProps) {
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    targetUserId: '',
    startDate: '',
    endDate: '',
    limit: 100,
  });

  // Fetch business users for filter dropdowns
  const { data: users } = useQuery({
    queryKey: ['business-users', businessId],
    queryFn: () => getBusinessUsers(businessId),
    enabled: !!businessId,
  });

  // Fetch audit logs
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-logs', businessId, filters],
    queryFn: () => getBusinessAuditLogs(businessId, filters),
    enabled: !!businessId,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      userId: '',
      targetUserId: '',
      startDate: '',
      endDate: '',
      limit: 100,
    });
  };

  const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (action.includes('assign')) return 'default';
    if (action.includes('remove')) return 'destructive';
    if (action.includes('update')) return 'secondary';
    return 'outline';
  };

  const formatAction = (action: string) => {
    return action
      .split(':')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== '' && value !== 100
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const logs = auditData?.logs || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Audit Logs</h3>
          <p className="text-sm text-muted-foreground">
            View audit trail of all permission and role changes
          </p>
        </div>
        {logs && logs.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportAuditLogsToCSV(logs);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          <CardDescription>Filter audit logs by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action-filter">Action Type</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => handleFilterChange('action', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="user:assign">User Assign</SelectItem>
                  <SelectItem value="user:remove">User Remove</SelectItem>
                  <SelectItem value="role:update">Role Update</SelectItem>
                  <SelectItem value="permission:update">Permission Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-filter">Performed By</Label>
              <Select
                value={filters.userId}
                onValueChange={(value) => handleFilterChange('userId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All users</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.user_id}>
                      {user.user_id} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-user-filter">Target User</Label>
              <Select
                value={filters.targetUserId}
                onValueChange={(value) => handleFilterChange('targetUserId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All users</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.user_id}>
                      {user.user_id} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Limit</Label>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => handleFilterChange('limit', value)}
              >
                <SelectTrigger>
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

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      {logs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>
              Showing {logs.length} of {auditData?.total || 0} logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: AuditLog) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.user_id || 'System'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.target_user_id || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {(() => {
                          if (log.action === 'role:update' && log.old_value?.role && log.new_value?.role) {
                            return (
                              <div className="space-y-1">
                                <div className="text-red-600 line-through text-xs">
                                  Role: {log.old_value.role}
                                </div>
                                <div className="text-green-600 text-xs">
                                  → Role: {log.new_value.role}
                                </div>
                              </div>
                            );
                          }
                          if (log.action === 'permission:update') {
                            const oldPerms = log.old_value?.permissions || {};
                            const newPerms = log.new_value?.permissions || {};
                            const restricted = Object.entries(newPerms).filter(([_, v]) => v === false).map(([k]) => k);
                            const allowed = Object.keys(oldPerms).filter(k => !newPerms[k]);
                            return (
                              <div className="space-y-1 text-xs">
                                {restricted.length > 0 && (
                                  <div className="text-red-600">
                                    Restricted: {restricted.join(', ')}
                                  </div>
                                )}
                                {allowed.length > 0 && (
                                  <div className="text-green-600">
                                    Allowed: {allowed.join(', ')}
                                  </div>
                                )}
                                {restricted.length === 0 && allowed.length === 0 && (
                                  <span className="text-muted-foreground">Reset to defaults</span>
                                )}
                              </div>
                            );
                          }
                          if (log.action === 'user:assign' && log.new_value?.role) {
                            return (
                              <div className="text-green-600 text-xs">
                                Assigned as: {log.new_value.role}
                              </div>
                            );
                          }
                          if (log.action === 'user:remove') {
                            return (
                              <div className="text-red-600 text-xs">
                                User removed
                              </div>
                            );
                          }
                          if (log.old_value && log.new_value) {
                            return (
                              <div className="space-y-1 text-xs max-w-xs">
                                <div className="text-red-600 line-through truncate">
                                  {Object.entries(log.old_value).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                </div>
                                <div className="text-green-600 truncate">
                                  → {Object.entries(log.new_value).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                </div>
                              </div>
                            );
                          }
                          if (log.new_value) {
                            return (
                              <div className="text-green-600 text-xs max-w-xs truncate">
                                {Object.entries(log.new_value).map(([k, v]) => `${k}: ${v}`).join(', ')}
                              </div>
                            );
                          }
                          return <span className="text-muted-foreground text-xs">No changes</span>;
                        })()}
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
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No audit logs found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Audit logs will appear here when users are assigned or permissions are changed'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Export audit logs to CSV
 */
function exportAuditLogsToCSV(logs: AuditLog[]) {
  const headers = ['Timestamp', 'Action', 'Performed By', 'Target User', 'Changes', 'IP Address'];
  const rows = logs.map((log) => {
    const changes = log.old_value && log.new_value
      ? `From: ${JSON.stringify(log.old_value)} → To: ${JSON.stringify(log.new_value)}`
      : log.new_value
      ? JSON.stringify(log.new_value)
      : 'No changes';
    
    return [
      new Date(log.created_at).toISOString(),
      log.action,
      log.user_id || 'System',
      log.target_user_id || 'N/A',
      changes,
      log.ip_address || 'N/A',
    ];
  });

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
}

