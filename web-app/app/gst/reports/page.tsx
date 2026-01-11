'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout';
import { PageHeader } from '@/components/ui/page-header';
import { gstApi } from '@/lib/api-client';
import type { Gstr1Response, Gstr3bResponse, Gstr4Response } from '@/lib/types/gst';
import { toast } from 'sonner';

export default function GstReportsPage() {
  const [activeTab, setActiveTab] = useState<'gstr1' | 'gstr3b' | 'gstr4'>('gstr1');
  const [period, setPeriod] = useState<string>('');
  const [format, setFormat] = useState<'json' | 'excel'>('json');

  // Generate period options
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const periods: string[] = [];

  // Generate monthly periods for last 12 months
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentYear, currentMonth - 1 - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    periods.push(`${month}${year}`);
  }

  // Generate quarterly periods for last 4 quarters
  const quarters: string[] = [];
  for (let i = 0; i < 4; i++) {
    const date = new Date(currentYear, currentMonth - 1 - i * 3, 1);
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    quarters.push(`Q${quarter}-${year}`);
  }

  // GSTR-1 Query
  const {
    data: gstr1Data,
    isLoading: gstr1Loading,
    error: gstr1Error,
    refetch: refetchGstr1,
  } = useQuery<Gstr1Response>({
    queryKey: ['gstr1', period, format],
    queryFn: async () => {
      if (!period) throw new Error('Period is required');
      const params = new URLSearchParams({ period, format });
      const response = await gstApi.get(`/gst/gstr1?${params.toString()}`, {
        responseType: format === 'excel' ? 'blob' : 'json',
      });
      return response.data;
    },
    enabled: false, // Don't auto-fetch
  });

  // GSTR-3B Query
  const {
    data: gstr3bData,
    isLoading: gstr3bLoading,
    error: gstr3bError,
    refetch: refetchGstr3b,
  } = useQuery<Gstr3bResponse>({
    queryKey: ['gstr3b', period, format],
    queryFn: async () => {
      if (!period) throw new Error('Period is required');
      const params = new URLSearchParams({ period, format });
      const response = await gstApi.get(`/gst/gstr3b?${params.toString()}`, {
        responseType: format === 'excel' ? 'blob' : 'json',
      });
      return response.data;
    },
    enabled: false,
  });

  // GSTR-4 Query
  const {
    data: gstr4Data,
    isLoading: gstr4Loading,
    error: gstr4Error,
    refetch: refetchGstr4,
  } = useQuery<Gstr4Response>({
    queryKey: ['gstr4', period, format],
    queryFn: async () => {
      if (!period) throw new Error('Period is required');
      const params = new URLSearchParams({ period, format });
      const response = await gstApi.get(`/gst/gstr4?${params.toString()}`, {
        responseType: format === 'excel' ? 'blob' : 'json',
      });
      return response.data;
    },
    enabled: false,
  });

  const handleGenerate = () => {
    if (!period) {
      toast.error('Please select a period');
      return;
    }

    if (activeTab === 'gstr1') {
      refetchGstr1();
    } else if (activeTab === 'gstr3b') {
      refetchGstr3b();
    } else if (activeTab === 'gstr4') {
      refetchGstr4();
    }
  };

  const handleDownload = (data: any, reportType: string) => {
    if (format === 'excel' && data instanceof Blob) {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${period}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report downloaded successfully');
    } else if (format === 'json') {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${period}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report downloaded successfully');
    }
  };

  const isLoading = gstr1Loading || gstr3bLoading || gstr4Loading;
  const currentData = activeTab === 'gstr1' ? gstr1Data : activeTab === 'gstr3b' ? gstr3bData : gstr4Data;
  const currentError =
    activeTab === 'gstr1' ? gstr1Error : activeTab === 'gstr3b' ? gstr3bError : gstr4Error;

  return (
    <AppLayout>
      <PageHeader
        title="GST Reports"
        description="Generate and download GST reports (GSTR-1, GSTR-3B, GSTR-4)"
      />

      <div className="space-y-6">
        {/* Period Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>Select period and format for the report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                {activeTab === 'gstr4' ? (
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger id="period">
                      <SelectValue placeholder="Select quarter (Q1-YYYY)" />
                    </SelectTrigger>
                    <SelectContent>
                      {quarters.map((q) => (
                        <SelectItem key={q} value={q}>
                          {q}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger id="period">
                      <SelectValue placeholder="Select period (MMYYYY or Q1-YYYY)" />
                    </SelectTrigger>
                    <SelectContent>
                      <optgroup label="Monthly">
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
                      </optgroup>
                      <optgroup label="Quarterly">
                        {quarters.map((q) => (
                          <SelectItem key={q} value={q}>
                            {q}
                          </SelectItem>
                        ))}
                      </optgroup>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as 'json' | 'excel')}>
                  <SelectTrigger id="format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleGenerate} disabled={!period || isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gstr1">GSTR-1</TabsTrigger>
            <TabsTrigger value="gstr3b">GSTR-3B</TabsTrigger>
            <TabsTrigger value="gstr4">GSTR-4</TabsTrigger>
          </TabsList>

          {/* GSTR-1 Tab */}
          <TabsContent value="gstr1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>GSTR-1 Report</CardTitle>
                    <CardDescription>Outward supplies return</CardDescription>
                  </div>
                  {gstr1Data && (
                    <Button onClick={() => handleDownload(gstr1Data, 'gstr1')} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {gstr1Error && (
                  <div className="flex items-center gap-2 text-red-500 p-4 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5" />
                    <span>
                      {(gstr1Error as any)?.response?.data?.message ||
                        (gstr1Error as Error)?.message ||
                        'Failed to generate report'}
                    </span>
                  </div>
                )}
                {gstr1Loading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                {gstr1Data && format === 'json' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">GSTIN</p>
                        <p className="font-medium">{gstr1Data.gstin}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Period</p>
                        <p className="font-medium">{gstr1Data.return_period}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">B2B Invoices: {gstr1Data.b2b.length}</p>
                      <p className="font-medium">B2C Small: {gstr1Data.b2c_small.length}</p>
                      {gstr1Data.b2c_large && (
                        <p className="font-medium">B2C Large: {gstr1Data.b2c_large.length}</p>
                      )}
                      {gstr1Data.cdnr && (
                        <p className="font-medium">CDNR: {gstr1Data.cdnr.length}</p>
                      )}
                      {gstr1Data.export && (
                        <p className="font-medium">Export: {gstr1Data.export.length}</p>
                      )}
                      <p className="font-medium">HSN Summary: {gstr1Data.hsn_summary.length}</p>
                    </div>
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(gstr1Data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                {gstr1Data && format === 'excel' && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Excel file downloaded</p>
                  </div>
                )}
                {!gstr1Data && !gstr1Loading && !gstr1Error && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a period and click "Generate Report" to view GSTR-1 data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* GSTR-3B Tab */}
          <TabsContent value="gstr3b">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>GSTR-3B Report</CardTitle>
                    <CardDescription>Monthly/Quarterly summary return</CardDescription>
                  </div>
                  {gstr3bData && (
                    <Button onClick={() => handleDownload(gstr3bData, 'gstr3b')} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {gstr3bError && (
                  <div className="flex items-center gap-2 text-red-500 p-4 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5" />
                    <span>
                      {(gstr3bError as any)?.response?.data?.message ||
                        (gstr3bError as Error)?.message ||
                        'Failed to generate report'}
                    </span>
                  </div>
                )}
                {gstr3bLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                {gstr3bData && format === 'json' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">GSTIN</p>
                        <p className="font-medium">{gstr3bData.gstin}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Period</p>
                        <p className="font-medium">{gstr3bData.return_period}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Output Tax</p>
                        <p className="text-2xl font-bold">
                          ₹
                          {(
                            gstr3bData.output_tax.total_igst +
                            gstr3bData.output_tax.total_cgst +
                            gstr3bData.output_tax.total_sgst +
                            gstr3bData.output_tax.total_cess
                          ).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">ITC Available</p>
                        <p className="text-2xl font-bold">
                          ₹{gstr3bData.itc.net_itc_available.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Net Tax Payable</p>
                        <p className="text-2xl font-bold text-red-600">
                          ₹{gstr3bData.net_tax_payable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(gstr3bData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                {gstr3bData && format === 'excel' && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Excel file downloaded</p>
                  </div>
                )}
                {!gstr3bData && !gstr3bLoading && !gstr3bError && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a period and click "Generate Report" to view GSTR-3B data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* GSTR-4 Tab */}
          <TabsContent value="gstr4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>GSTR-4 Report</CardTitle>
                    <CardDescription>Composition scheme quarterly return</CardDescription>
                  </div>
                  {gstr4Data && (
                    <Button onClick={() => handleDownload(gstr4Data, 'gstr4')} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {gstr4Error && (
                  <div className="flex items-center gap-2 text-red-500 p-4 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5" />
                    <span>
                      {(gstr4Error as any)?.response?.data?.message ||
                        (gstr4Error as Error)?.message ||
                        'Failed to generate report'}
                    </span>
                  </div>
                )}
                {gstr4Loading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                {gstr4Data && format === 'json' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">GSTIN</p>
                        <p className="font-medium">{gstr4Data.gstin}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Period</p>
                        <p className="font-medium">{gstr4Data.return_period}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Composition Rate</p>
                        <p className="text-2xl font-bold">{gstr4Data.composition_rate}%</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Turnover</p>
                        <p className="text-2xl font-bold">
                          ₹{gstr4Data.total_turnover.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Tax Payable</p>
                        <p className="text-2xl font-bold text-red-600">
                          ₹{gstr4Data.composition_tax_payable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">B2B Invoices: {gstr4Data.b2b.length}</p>
                      <p className="font-medium">B2C Invoices: {gstr4Data.b2c.length}</p>
                    </div>
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(gstr4Data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                {gstr4Data && format === 'excel' && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Excel file downloaded</p>
                  </div>
                )}
                {!gstr4Data && !gstr4Loading && !gstr4Error && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a quarter and click "Generate Report" to view GSTR-4 data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

