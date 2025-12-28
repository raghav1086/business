'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Receipt,
  Download,
  IndianRupee,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout, BottomNav } from '@/components/layout';
import { PageHeader } from '@/components/ui/page-header';
import { invoiceApi, paymentApi, partyApi, inventoryApi } from '@/lib/api-client';
import { generateDashboardReportPDF, exportInvoicesToExcel } from '@/lib/export-utils';
import { useAuthStore } from '@/lib/auth-store';

type DateRange = {
  from: string;
  to: string;
};

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<string>('overview');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  // Fetch data for reports
  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await invoiceApi.get('/invoices');
      // Backend returns { invoices: [...], total, page, limit }
      return response.data?.invoices || (Array.isArray(response.data) ? response.data : (response.data?.data || []));
    },
  });

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await paymentApi.get('/payments');
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
  });

  const { data: parties } = useQuery({
    queryKey: ['parties'],
    queryFn: async () => {
      const response = await partyApi.get('/parties');
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
  });

  const { data: items } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const response = await inventoryApi.get('/items');
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
  });

  // Calculate statistics with safe array checks
  const invoicesList = Array.isArray(invoices) ? invoices : [];
  const paymentsList = Array.isArray(payments) ? payments : [];
  const partiesList = Array.isArray(parties) ? parties : [];
  const itemsList = Array.isArray(items) ? items : [];

  const stats = {
    totalSales: invoicesList.filter((inv: any) => inv.invoice_type === 'sale')
      .reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0),
    totalPurchases: invoicesList.filter((inv: any) => inv.invoice_type === 'purchase')
      .reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0),
    totalPaymentsReceived: paymentsList.filter((pay: any) => 
      invoicesList.find((inv: any) => inv.id === pay.invoice_id)?.invoice_type === 'sale'
    ).reduce((sum: number, pay: any) => sum + Number(pay.amount || 0), 0),
    totalPaymentsMade: paymentsList.filter((pay: any) => 
      invoicesList.find((inv: any) => inv.id === pay.invoice_id)?.invoice_type === 'purchase'
    ).reduce((sum: number, pay: any) => sum + Number(pay.amount || 0), 0),
    totalCustomers: partiesList.filter((p: any) => p.party_type === 'customer').length,
    totalSuppliers: partiesList.filter((p: any) => p.party_type === 'supplier').length,
    lowStockItems: itemsList.filter((item: any) => 
      Number(item.current_stock || 0) <= Number(item.min_stock_level || 0)
    ).length,
    totalItems: itemsList.length,
  };

  const outstandingReceivables = stats.totalSales - stats.totalPaymentsReceived;
  const outstandingPayables = stats.totalPurchases - stats.totalPaymentsMade;

  const handleExport = () => {
    const statsForExport = {
      totalSales: stats.totalSales,
      totalPurchases: stats.totalPurchases,
      totalReceived: stats.totalPaymentsReceived,
      totalPaid: stats.totalPaymentsMade,
      receivableAmount: outstandingReceivables,
      payableAmount: outstandingPayables,
      totalParties: partiesList.length,
      totalInvoices: invoicesList.length,
    };
    generateDashboardReportPDF(statsForExport, invoicesList.slice(0, 10), {});
  };

  const handleExportGSTR1 = () => {
    const gstr1Data = JSON.stringify({
      gstin: 'YOUR_GSTIN',
      fp: format(new Date(), 'MMyyyy'),
      b2b: salesInvoices.map((inv: any) => ({
        inum: inv.invoice_number,
        idt: format(new Date(inv.invoice_date), 'dd-MM-yyyy'),
        val: Number(inv.total_amount || 0),
        txval: Number(inv.subtotal_amount || 0),
        iamt: Number(inv.tax_amount || 0),
      })),
    }, null, 2);
    const blob = new Blob([gstr1Data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_${format(new Date(), 'MMyyyy')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGSTR3B = () => {
    const gstr3bData = JSON.stringify({
      gstin: 'YOUR_GSTIN',
      ret_period: format(new Date(), 'MMyyyy'),
      sup_details: {
        osup_det: {
          txval: gstSummary.salesTaxable,
          iamt: 0,
          camt: gstSummary.salesTax / 2,
          samt: gstSummary.salesTax / 2,
        },
      },
      itc_elg: {
        itc_avl: {
          txval: gstSummary.purchaseTaxable,
          iamt: 0,
          camt: gstSummary.purchaseTax / 2,
          samt: gstSummary.purchaseTax / 2,
        },
      },
    }, null, 2);
    const blob = new Blob([gstr3bData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR3B_${format(new Date(), 'MMyyyy')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate GST summary
  const salesInvoices = invoicesList.filter((inv: any) => inv.invoice_type === 'sale');
  const purchaseInvoices = invoicesList.filter((inv: any) => inv.invoice_type === 'purchase');
  
  const gstSummary = {
    salesTaxable: salesInvoices.reduce((sum: number, inv: any) => sum + Number(inv.subtotal_amount || 0), 0),
    salesTax: salesInvoices.reduce((sum: number, inv: any) => sum + Number(inv.tax_amount || 0), 0),
    purchaseTaxable: purchaseInvoices.reduce((sum: number, inv: any) => sum + Number(inv.subtotal_amount || 0), 0),
    purchaseTax: purchaseInvoices.reduce((sum: number, inv: any) => sum + Number(inv.tax_amount || 0), 0),
  };
  const netGstPayable = gstSummary.salesTax - gstSummary.purchaseTax;

  return (
    <AppLayout>
      <PageHeader
        title="Reports & Analytics"
        description="Business insights and performance metrics"
      >
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </PageHeader>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Total Sales</div>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              ₹{stats.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Total Purchases</div>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              ₹{stats.totalPurchases.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Receivables</div>
              <IndianRupee className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ₹{outstandingReceivables.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Net GST</div>
              <Receipt className="h-4 w-4 text-purple-600" />
            </div>
            <div className={`text-2xl font-bold ${netGstPayable >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{Math.abs(netGstPayable).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <Label htmlFor="from-date" className="text-sm">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div className="flex-1 w-full">
              <Label htmlFor="to-date" className="text-sm">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange({
                  from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                  to: format(new Date(), 'yyyy-MM-dd'),
                })}
              >
                7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange({
                  from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                  to: format(new Date(), 'yyyy-MM-dd'),
                })}
              >
                30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange({
                  from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                  to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
                })}
              >
                This Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={activeReport} onValueChange={setActiveReport} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2 hidden sm:inline" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sales">
            <TrendingUp className="h-4 w-4 mr-2 hidden sm:inline" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="purchases">
            <TrendingDown className="h-4 w-4 mr-2 hidden sm:inline" />
            Purchases
          </TabsTrigger>
          <TabsTrigger value="parties">
            <Users className="h-4 w-4 mr-2 hidden sm:inline" />
            Parties
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2 hidden sm:inline" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="gst">
            <Receipt className="h-4 w-4 mr-2 hidden sm:inline" />
            GST
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Party Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Customers</span>
                    <span className="text-xl font-bold">{stats.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Suppliers</span>
                    <span className="text-xl font-bold">{stats.totalSuppliers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Inventory Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Items</span>
                    <span className="text-xl font-bold">{stats.totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Low Stock</span>
                    <span className={`text-xl font-bold ${stats.lowStockItems > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.lowStockItems}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profit & Loss Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">Revenue</p>
                  <p className="text-xl font-bold text-green-700">
                    ₹{stats.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-700">Expenses</p>
                  <p className="text-xl font-bold text-orange-700">
                    ₹{stats.totalPurchases.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">Gross Profit</p>
                  <p className="text-xl font-bold text-blue-700">
                    ₹{(stats.totalSales - stats.totalPurchases).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700">Net GST</p>
                  <p className={`text-xl font-bold ${netGstPayable >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{Math.abs(netGstPayable).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">Sales Report</CardTitle>
                  <CardDescription>{salesInvoices.length} invoices</CardDescription>
                </div>
                <Badge variant="outline" className="text-green-600">
                  ₹{stats.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salesInvoices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No sales invoices found</p>
                ) : (
                  salesInvoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">{invoice.party?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(invoice.invoice_date), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          ₹{Number(invoice.total_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </p>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                          {invoice.status?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchases Tab */}
        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">Purchase Report</CardTitle>
                  <CardDescription>{purchaseInvoices.length} invoices</CardDescription>
                </div>
                <Badge variant="outline" className="text-orange-600">
                  ₹{stats.totalPurchases.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {purchaseInvoices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No purchase invoices found</p>
                ) : (
                  purchaseInvoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">{invoice.party?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(invoice.invoice_date), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">
                          ₹{Number(invoice.total_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </p>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                          {invoice.status?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parties Tab */}
        <TabsContent value="parties">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Party Ledger</CardTitle>
              <CardDescription>Outstanding balances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {partiesList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No parties found</p>
                ) : (
                  partiesList.map((party: any) => {
                    const partyInvoices = invoicesList.filter((inv: any) => inv.party_id === party.id);
                    const totalInvoiced = partyInvoices.reduce((sum: number, inv: any) => 
                      sum + Number(inv.total_amount || 0), 0
                    );
                    const totalPaid = paymentsList.filter((pay: any) => 
                      partyInvoices.some((inv: any) => inv.id === pay.invoice_id)
                    ).reduce((sum: number, pay: any) => sum + Number(pay.amount || 0), 0);
                    const balance = totalInvoiced - totalPaid;

                    return (
                      <div key={party.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{party.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {party.type?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${balance > 0 ? 'text-blue-600' : balance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            ₹{Math.abs(balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {balance > 0 ? 'To Receive' : balance < 0 ? 'To Pay' : 'Settled'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stock Report</CardTitle>
              <CardDescription>Current inventory status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {itemsList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No items found</p>
                ) : (
                  itemsList.map((item: any) => {
                    const stockLevel = Number(item.current_stock || 0);
                    const minStock = Number(item.low_stock_threshold || 0);
                    const isLowStock = stockLevel <= minStock && minStock > 0;

                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.hsn_code && (
                            <p className="text-xs text-muted-foreground">HSN: {item.hsn_code}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                            {stockLevel} {item.unit || 'pcs'}
                          </p>
                          {isLowStock && (
                            <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GST Tab */}
        <TabsContent value="gst" className="space-y-4">
          {/* GST Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-green-50">
              <CardContent className="pt-4">
                <div className="text-sm text-green-700">Output Tax (Sales)</div>
                <div className="text-xl font-bold text-green-700">
                  ₹{gstSummary.salesTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50">
              <CardContent className="pt-4">
                <div className="text-sm text-orange-700">Input Tax (Purchases)</div>
                <div className="text-xl font-bold text-orange-700">
                  ₹{gstSummary.purchaseTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>
            <Card className={netGstPayable >= 0 ? 'bg-red-50' : 'bg-green-50'}>
              <CardContent className="pt-4">
                <div className={`text-sm ${netGstPayable >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {netGstPayable >= 0 ? 'GST Payable' : 'ITC Available'}
                </div>
                <div className={`text-xl font-bold ${netGstPayable >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                  ₹{Math.abs(netGstPayable).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50">
              <CardContent className="pt-4">
                <div className="text-sm text-blue-700">Taxable Turnover</div>
                <div className="text-xl font-bold text-blue-700">
                  ₹{gstSummary.salesTaxable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* GSTR-1 Preview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    GSTR-1 Preview (Outward Supplies)
                  </CardTitle>
                  <CardDescription>Sales transactions for GST filing</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportGSTR1}>
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salesInvoices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No sales invoices for GSTR-1</p>
                ) : (
                  salesInvoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <Badge variant="outline" className="text-xs">B2B</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{invoice.party?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(invoice.invoice_date), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Taxable: ₹{Number(invoice.subtotal_amount || 0).toLocaleString('en-IN')}
                        </p>
                        <p className="font-bold text-blue-600">
                          Tax: ₹{Number(invoice.tax_amount || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* GSTR-3B Preview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    GSTR-3B Preview (Monthly Summary)
                  </CardTitle>
                  <CardDescription>Monthly GST return summary</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportGSTR3B}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">3.1 Outward Supplies</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Taxable Value</span>
                        <span className="font-medium">₹{gstSummary.salesTaxable.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>IGST</span>
                        <span className="font-medium">₹0</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>CGST</span>
                        <span className="font-medium">₹{(gstSummary.salesTax / 2).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>SGST</span>
                        <span className="font-medium">₹{(gstSummary.salesTax / 2).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">4. Eligible ITC</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Taxable Value</span>
                        <span className="font-medium">₹{gstSummary.purchaseTaxable.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>IGST</span>
                        <span className="font-medium">₹0</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>CGST</span>
                        <span className="font-medium">₹{(gstSummary.purchaseTax / 2).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>SGST</span>
                        <span className="font-medium">₹{(gstSummary.purchaseTax / 2).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Net Tax Payable</span>
                    <span className={`text-xl font-bold ${netGstPayable >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{Math.abs(netGstPayable).toLocaleString('en-IN')}
                      <span className="text-sm font-normal ml-1">
                        {netGstPayable >= 0 ? '(Payable)' : '(Credit)'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </AppLayout>
  );
}
