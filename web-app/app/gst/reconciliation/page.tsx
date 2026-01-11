'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout';
import { PageHeader } from '@/components/ui/page-header';
import { gstApi } from '@/lib/api-client';
import type {
  Gstr2aImportRequest,
  Gstr2aImportResponse,
  Gstr2aReconciliationResponse,
  ManualMatchRequest,
} from '@/lib/types/gst';
import { toast } from 'sonner';

export default function Gstr2aReconciliationPage() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<string>('');
  const [importType, setImportType] = useState<'gstr2a' | 'gstr2b'>('gstr2a');
  const [jsonData, setJsonData] = useState<string>('');
  const [selectedReconciliationId, setSelectedReconciliationId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');

  // Generate period options
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const periods: string[] = [];

  for (let i = 0; i < 12; i++) {
    const date = new Date(currentYear, currentMonth - 1 - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    periods.push(`${month}${year}`);
  }

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (): Promise<Gstr2aImportResponse> => {
      if (!period) throw new Error('Period is required');
      if (!jsonData.trim()) throw new Error('GSTR-2A/2B JSON data is required');

      let parsedData;
      try {
        parsedData = JSON.parse(jsonData);
      } catch (error) {
        throw new Error('Invalid JSON format');
      }

      const request: Gstr2aImportRequest = {
        period,
        import_type: importType,
        data: parsedData,
      };

      const response = await gstApi.post<Gstr2aImportResponse>('/gst/gstr2a/import', request);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('GSTR-2A/2B data imported successfully');
      setJsonData('');
      queryClient.invalidateQueries({ queryKey: ['gstr2a-reconciliation', period] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || error.message || 'Failed to import GSTR-2A/2B data'
      );
    },
  });

  // Reconciliation query
  const {
    data: reconciliationData,
    isLoading: reconciliationLoading,
    error: reconciliationError,
    refetch: refetchReconciliation,
  } = useQuery<Gstr2aReconciliationResponse>({
    queryKey: ['gstr2a-reconciliation', period],
    queryFn: async () => {
      if (!period) throw new Error('Period is required');
      const response = await gstApi.get(`/gst/gstr2a/reconciliation?period=${period}`);
      return response.data;
    },
    enabled: false, // Don't auto-fetch
  });

  // Manual match mutation
  const manualMatchMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!selectedReconciliationId || !selectedInvoiceId) {
        throw new Error('Reconciliation ID and Invoice ID are required');
      }

      const request: ManualMatchRequest = {
        reconciliation_id: selectedReconciliationId,
        invoice_id: selectedInvoiceId,
      };

      await gstApi.post('/gst/gstr2a/manual-match', request);
    },
    onSuccess: () => {
      toast.success('Invoice matched successfully');
      setSelectedReconciliationId('');
      setSelectedInvoiceId('');
      refetchReconciliation();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to match invoice');
    },
  });

  const handleImport = () => {
    importMutation.mutate();
  };

  const handleGetReconciliation = () => {
    if (!period) {
      toast.error('Please select a period');
      return;
    }
    refetchReconciliation();
  };

  const handleManualMatch = () => {
    if (!selectedReconciliationId || !selectedInvoiceId) {
      toast.error('Please select both reconciliation and invoice');
      return;
    }
    manualMatchMutation.mutate();
  };

  return (
    <AppLayout>
      <PageHeader
        title="GSTR-2A/2B Reconciliation"
        description="Import and reconcile purchase invoices with GSTR-2A/2B data"
      />

      <div className="space-y-6">
        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle>Import GSTR-2A/2B</CardTitle>
            <CardDescription>
              Import GSTR-2A/2B JSON data downloaded from GST portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger id="period">
                    <SelectValue placeholder="Select period (MMYYYY)" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((p) => {
                      const month = parseInt(p.substring(0, 2));
                      const year = p.substring(2);
                      const monthName = new Date(2000, month - 1).toLocaleString('default', {
                        month: 'long',
                      });
                      return (
                        <SelectItem key={p} value={p}>
                          {monthName} {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-type">Import Type</Label>
                <Select
                  value={importType}
                  onValueChange={(v) => setImportType(v as 'gstr2a' | 'gstr2b')}
                >
                  <SelectTrigger id="import-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gstr2a">GSTR-2A</SelectItem>
                    <SelectItem value="gstr2b">GSTR-2B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="json-data">GSTR-2A/2B JSON Data</Label>
              <Textarea
                id="json-data"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder="Paste GSTR-2A/2B JSON data here..."
                rows={10}
                className="font-mono text-xs"
              />
            </div>
            <Button
              onClick={handleImport}
              disabled={!period || !jsonData.trim() || importMutation.isPending}
              className="w-full"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import GSTR-2A/2B
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Reconciliation Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Reconciliation Report</CardTitle>
                <CardDescription>View and manage invoice reconciliation</CardDescription>
              </div>
              <Button
                onClick={handleGetReconciliation}
                disabled={!period || reconciliationLoading}
                variant="outline"
              >
                {reconciliationLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Get Report
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {reconciliationError && (
              <div className="flex items-center gap-2 text-red-500 p-4 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span>
                  {(reconciliationError as any)?.response?.data?.message ||
                    (reconciliationError as Error)?.message ||
                    'Failed to load reconciliation'}
                </span>
              </div>
            )}

            {reconciliationData && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total GSTR-2A</p>
                    <p className="text-2xl font-bold">{reconciliationData.total_gstr2a_invoices}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Purchase</p>
                    <p className="text-2xl font-bold">{reconciliationData.total_purchase_invoices}</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-green-50">
                    <p className="text-sm text-muted-foreground">Matched</p>
                    <p className="text-2xl font-bold text-green-600">
                      {reconciliationData.matched_count}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg bg-red-50">
                    <p className="text-sm text-muted-foreground">Issues</p>
                    <p className="text-2xl font-bold text-red-600">
                      {reconciliationData.missing_count +
                        reconciliationData.extra_count +
                        reconciliationData.mismatched_count}
                    </p>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="matched">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="matched">
                      Matched ({reconciliationData.matched.length})
                    </TabsTrigger>
                    <TabsTrigger value="missing">
                      Missing ({reconciliationData.missing.length})
                    </TabsTrigger>
                    <TabsTrigger value="extra">Extra ({reconciliationData.extra.length})</TabsTrigger>
                    <TabsTrigger value="mismatched">
                      Mismatched ({reconciliationData.mismatched.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Matched Tab */}
                  <TabsContent value="matched">
                    <div className="space-y-2">
                      {reconciliationData.matched.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No matched invoices</p>
                      ) : (
                        reconciliationData.matched.map((invoice, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                          >
                            <div>
                              <p className="font-medium">{invoice.supplier_invoice_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {invoice.supplier_name} ({invoice.supplier_gstin})
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {invoice.supplier_invoice_date}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Matched
                              </Badge>
                              <p className="text-sm font-medium mt-1">
                                ₹{invoice.taxable_value.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Missing Tab */}
                  <TabsContent value="missing">
                    <div className="space-y-2">
                      {reconciliationData.missing.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No missing invoices</p>
                      ) : (
                        reconciliationData.missing.map((invoice, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50"
                          >
                            <div>
                              <p className="font-medium">{invoice.supplier_invoice_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {invoice.supplier_name} ({invoice.supplier_gstin})
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {invoice.supplier_invoice_date}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Missing
                              </Badge>
                              <p className="text-sm font-medium mt-1">
                                ₹{invoice.taxable_value.toLocaleString('en-IN')}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={() => {
                                  setSelectedReconciliationId(invoice.invoice_id || '');
                                  // TODO: Open invoice selection dialog
                                  toast.info('Invoice selection dialog coming soon');
                                }}
                              >
                                Match Manually
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Extra Tab */}
                  <TabsContent value="extra">
                    <div className="space-y-2">
                      {reconciliationData.extra.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No extra invoices</p>
                      ) : (
                        reconciliationData.extra.map((invoice, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg bg-blue-50"
                          >
                            <div>
                              <p className="font-medium">{invoice.supplier_invoice_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {invoice.supplier_name} ({invoice.supplier_gstin})
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {invoice.supplier_invoice_date}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="border-blue-600 text-blue-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Extra
                              </Badge>
                              <p className="text-sm font-medium mt-1">
                                ₹{invoice.taxable_value.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Mismatched Tab */}
                  <TabsContent value="mismatched">
                    <div className="space-y-2">
                      {reconciliationData.mismatched.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No mismatched invoices</p>
                      ) : (
                        reconciliationData.mismatched.map((invoice, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                          >
                            <div>
                              <p className="font-medium">{invoice.supplier_invoice_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {invoice.supplier_name} ({invoice.supplier_gstin})
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {invoice.supplier_invoice_date}
                              </p>
                              {invoice.match_details && (
                                <p className="text-xs text-red-600 mt-1">
                                  {invoice.match_details.reason || 'Amount mismatch'}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Mismatched
                              </Badge>
                              <p className="text-sm font-medium mt-1">
                                ₹{invoice.taxable_value.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {!reconciliationData && !reconciliationLoading && !reconciliationError && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a period and click "Get Report" to view reconciliation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

