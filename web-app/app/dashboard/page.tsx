'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Package, 
  FileText, 
  CreditCard, 
  BarChart3,
  Building2,
  LogOut,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { invoiceApi, paymentApi, partyApi, inventoryApi } from '@/lib/api-client';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, businessId, logout } = useAuthStore();

  // Fetch dashboard data
  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await invoiceApi.get('/invoices');
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
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

  // Calculate real statistics
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
    totalParties: partiesList.length,
    lowStockItems: itemsList.filter((item: any) => 
      Number(item.current_stock || 0) <= Number(item.min_stock_level || 0)
    ).length,
    totalItems: itemsList.length,
    pendingInvoices: invoicesList.filter((inv: any) => inv.status === 'pending').length,
    totalInvoices: invoicesList.length,
  };

  const outstandingReceivables = stats.totalSales - stats.totalPaymentsReceived;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (!businessId) {
      router.push('/business/select');
    }
  }, [isAuthenticated, businessId, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const modules = [
    {
      title: 'Parties',
      description: 'Manage customers and suppliers',
      icon: Users,
      href: '/parties',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Inventory',
      description: 'Manage items and stock',
      icon: Package,
      href: '/inventory',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Invoices',
      description: 'Create and manage invoices',
      icon: FileText,
      href: '/invoices',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Payments',
      description: 'Record and track payments',
      icon: CreditCard,
      href: '/payments',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Reports',
      description: 'View business insights',
      icon: BarChart3,
      href: '/reports',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Business',
      description: 'Manage business settings',
      icon: Building2,
      href: '/business/select',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Business Manager</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome to your dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/business/select')}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Switch Business
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quick Access</h2>
          <p className="text-gray-600">Select a module to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Card
              key={module.href}
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
              onClick={() => router.push(module.href)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                  <module.icon className={`h-6 w-6 ${module.color}`} />
                </div>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>Total Sales</CardDescription>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <CardTitle className="text-3xl text-green-600">
                  ₹{stats.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  {invoices?.filter((inv: any) => inv.invoice_type === 'sale').length || 0} sale invoices
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>Outstanding</CardDescription>
                  <CreditCard className="h-4 w-4 text-orange-600" />
                </div>
                <CardTitle className="text-3xl text-orange-600">
                  ₹{outstandingReceivables.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">{stats.pendingInvoices} pending invoices</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>Total Parties</CardDescription>
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle className="text-3xl">{stats.totalParties}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  {stats.totalCustomers} customers, {stats.totalSuppliers} suppliers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>Low Stock Items</CardDescription>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <CardTitle className={`text-3xl ${stats.lowStockItems > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.lowStockItems}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-xs ${stats.lowStockItems > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.lowStockItems > 0 ? 'Needs attention' : 'All items in stock'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Items</CardDescription>
                <CardTitle className="text-3xl">{stats.totalItems}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">In inventory</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Invoices</CardDescription>
                <CardTitle className="text-3xl">{stats.totalInvoices}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">All transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Payments Received</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  ₹{stats.totalPaymentsReceived.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">From customers</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
