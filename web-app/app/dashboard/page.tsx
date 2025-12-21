'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  LogOut
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, businessId, logout } = useAuthStore();

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
      href: '/business',
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Parties</CardDescription>
                <CardTitle className="text-3xl">-</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Items</CardDescription>
                <CardTitle className="text-3xl">-</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Invoices</CardDescription>
                <CardTitle className="text-3xl">-</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Month Revenue</CardDescription>
                <CardTitle className="text-3xl">₹ -</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
