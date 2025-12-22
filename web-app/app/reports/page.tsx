'use client';

import { useState } from 'react';
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
  Calendar,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { invoiceApi, paymentApi, partyApi, inventoryApi } from '@/lib/api-client';

type DateRange = {
  from: string;
  to: string;
};

export default function ReportsPage() {
  const router = useRouter();
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
      return response.data;
    },
  });

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await paymentApi.get('/payments');
      return response.data;
    },
  });

  const { data: parties } = useQuery({
    queryKey: ['parties'],
    queryFn: async () => {
      const response = await partyApi.get('/parties');
      return response.data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const response = await inventoryApi.get('/items');
      return response.data;
    },
  });

  // Calculate statistics
  const stats = {
    totalSales: invoices?.filter((inv: any) => inv.invoice_type === 'sale')
      .reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0) || 0,
    totalPurchases: invoices?.filter((inv: any) => inv.invoice_type === 'purchase')
      .reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0) || 0,
    totalPaymentsReceived: payments?.filter((pay: any) => 
      invoices?.find((inv: any) => inv.id === pay.invoice_id)?.invoice_type === 'sale'
    ).reduce((sum: number, pay: any) => sum + Number(pay.amount || 0), 0) || 0,
    totalPaymentsMade: payments?.filter((pay: any) => 
      invoices?.find((inv: any) => inv.id === pay.invoice_id)?.invoice_type === 'purchase'
    ).reduce((sum: number, pay: any) => sum + Number(pay.amount || 0), 0) || 0,
    totalCustomers: parties?.filter((p: any) => p.party_type === 'customer').length || 0,
    totalSuppliers: parties?.filter((p: any) => p.party_type === 'supplier').length || 0,
    lowStockItems: items?.filter((item: any) => 
      Number(item.current_stock || 0) <= Number(item.min_stock_level || 0)
    ).length || 0,
    totalItems: items?.length || 0,
  };

  const outstandingReceivables = stats.totalSales - stats.totalPaymentsReceived;
  const outstandingPayables = stats.totalPurchases - stats.totalPaymentsMade;

  const reportCards = [
    {
      id: 'overview',
      title: 'Business Overview',
      description: 'Overall business performance',
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      id: 'sales',
      title: 'Sales Report',
      description: 'Sales analysis and trends',
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      id: 'purchases',
      title: 'Purchase Report',
      description: 'Purchase analysis',
      icon: TrendingDown,
      color: 'text-orange-600',
    },
    {
      id: 'parties',
      title: 'Party Ledger',
      description: 'Customer & supplier balances',
      icon: Users,
      color: 'text-purple-600',
    },
    {
      id: 'inventory',
      title: 'Stock Report',
      description: 'Inventory status',
      icon: Package,
      color: 'text-indigo-600',
    },
    {
      id: 'gst',
      title: 'GST Report',
      description: 'Tax summary',
      icon: Receipt,
      color: 'text-red-600',
    },
  ];

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export functionality will be implemented with PDF/Excel generation');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="from-date">From Date</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="to-date">To Date</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDateRange({
                    from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                    to: format(new Date(), 'yyyy-MM-dd'),
                  })}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDateRange({
                    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                    to: format(new Date(), 'yyyy-MM-dd'),
                  })}
                >
                  Last 30 Days
                </Button>
                <Button
                  variant="outline"
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

        {/* Report Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCards.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  activeReport === report.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setActiveReport(report.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gray-100 ${report.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="text-sm">{report.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Overview Report */}
        {activeReport === 'overview' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Overview</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{stats.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Total Purchases</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ₹{stats.totalPurchases.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Outstanding Receivables</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{outstandingReceivables.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Outstanding Payables</p>
                    <p className="text-2xl font-bold text-red-600">
                      ₹{outstandingPayables.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Party Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Customers</span>
                      <span className="text-2xl font-bold">{stats.totalCustomers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Suppliers</span>
                      <span className="text-2xl font-bold">{stats.totalSuppliers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Items</span>
                      <span className="text-2xl font-bold">{stats.totalItems}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Low Stock Items</span>
                      <span className={`text-2xl font-bold ${stats.lowStockItems > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {stats.lowStockItems}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Sales Report */}
        {activeReport === 'sales' && (
          <Card>
            <CardHeader>
              <CardTitle>Sales Report</CardTitle>
              <CardDescription>Detailed sales analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices?.filter((inv: any) => inv.invoice_type === 'sale').map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-600">
                        {parties?.find((p: any) => p.id === invoice.party_id)?.party_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(invoice.invoice_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        ₹{Number(invoice.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{invoice.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purchase Report */}
        {activeReport === 'purchases' && (
          <Card>
            <CardHeader>
              <CardTitle>Purchase Report</CardTitle>
              <CardDescription>Detailed purchase analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices?.filter((inv: any) => inv.invoice_type === 'purchase').map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-600">
                        {parties?.find((p: any) => p.id === invoice.party_id)?.party_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(invoice.invoice_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">
                        ₹{Number(invoice.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{invoice.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Party Ledger */}
        {activeReport === 'parties' && (
          <Card>
            <CardHeader>
              <CardTitle>Party Ledger</CardTitle>
              <CardDescription>Outstanding balances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parties?.map((party: any) => {
                  const partyInvoices = invoices?.filter((inv: any) => inv.party_id === party.id) || [];
                  const totalInvoiced = partyInvoices.reduce((sum: number, inv: any) => 
                    sum + Number(inv.total_amount || 0), 0
                  );
                  const totalPaid = payments?.filter((pay: any) => 
                    partyInvoices.some((inv: any) => inv.id === pay.invoice_id)
                  ).reduce((sum: number, pay: any) => sum + Number(pay.amount || 0), 0) || 0;
                  const balance = totalInvoiced - totalPaid;

                  if (balance === 0) return null;

                  return (
                    <div key={party.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{party.party_name}</p>
                        <p className="text-sm text-gray-600 capitalize">{party.party_type}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{Math.abs(balance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {balance > 0 ? (party.party_type === 'customer' ? 'Receivable' : 'Payable') : 'Settled'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock Report */}
        {activeReport === 'inventory' && (
          <Card>
            <CardHeader>
              <CardTitle>Stock Report</CardTitle>
              <CardDescription>Current inventory status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items?.map((item: any) => {
                  const stockLevel = Number(item.current_stock || 0);
                  const minStock = Number(item.min_stock_level || 0);
                  const isLowStock = stockLevel <= minStock;

                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{item.item_name}</p>
                        <p className="text-sm text-gray-600">{item.category}</p>
                        <p className="text-xs text-gray-500">HSN: {item.hsn_code}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                          {stockLevel} {item.unit}
                        </p>
                        <p className="text-xs text-gray-500">
                          Min: {minStock} {item.unit}
                        </p>
                        {isLowStock && (
                          <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-700 rounded mt-1">
                            Low Stock
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* GST Report */}
        {activeReport === 'gst' && (
          <Card>
            <CardHeader>
              <CardTitle>GST Report</CardTitle>
              <CardDescription>Tax summary and compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Sales (GSTR-1)</h3>
                  <div className="space-y-4">
                    {invoices?.filter((inv: any) => inv.invoice_type === 'sale').map((invoice: any) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-sm text-gray-600">
                            {parties?.find((p: any) => p.id === invoice.party_id)?.party_name}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm text-gray-600">
                            Taxable: ₹{Number(invoice.subtotal_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </p>
                          <p className="font-medium text-blue-600">
                            Tax: ₹{Number(invoice.tax_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Purchases (GSTR-2)</h3>
                  <div className="space-y-4">
                    {invoices?.filter((inv: any) => inv.invoice_type === 'purchase').map((invoice: any) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-sm text-gray-600">
                            {parties?.find((p: any) => p.id === invoice.party_id)?.party_name}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm text-gray-600">
                            Taxable: ₹{Number(invoice.subtotal_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </p>
                          <p className="font-medium text-orange-600">
                            Tax: ₹{Number(invoice.tax_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
