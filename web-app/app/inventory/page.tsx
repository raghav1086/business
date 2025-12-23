'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/lib/auth-store';
import { inventoryApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, Package, AlertTriangle } from 'lucide-react';

// Item form validation schema
const itemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
  hsn_code: z.string().optional(),
  unit: z.enum(['pcs', 'kg', 'ltr', 'mtr', 'box', 'dozen']),
  sale_price: z.string().min(1, 'Sale price is required'),
  purchase_price: z.string().optional(),
  tax_rate: z.string(),
  opening_stock: z.string().optional(),
  min_stock_level: z.string().optional(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface Item {
  id: string;
  name: string;
  description?: string;
  category?: string;
  hsn_code?: string;
  unit: string;
  sale_price: number;
  purchase_price?: number;
  tax_rate: number;
  current_stock: number;
  min_stock_level?: number;
}

export default function InventoryPage() {
  const router = useRouter();
  const { isAuthenticated, businessId } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      hsn_code: '',
      unit: 'pcs',
      sale_price: '',
      purchase_price: '',
      tax_rate: '18',
      opening_stock: '0',
      min_stock_level: '10',
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !businessId) {
      router.push('/');
    } else {
      fetchItems();
    }
  }, [isAuthenticated, businessId, router]);

  const fetchItems = async () => {
    try {
      const response = await inventoryApi.get('/items');
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setItems(data);
    } catch (error: any) {
      toast.error('Failed to load items', {
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ItemFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        sale_price: parseFloat(data.sale_price),
        purchase_price: data.purchase_price ? parseFloat(data.purchase_price) : undefined,
        tax_rate: parseFloat(data.tax_rate),
        opening_stock: data.opening_stock ? parseFloat(data.opening_stock) : undefined,
        min_stock_level: data.min_stock_level ? parseFloat(data.min_stock_level) : undefined,
      };

      await inventoryApi.post('/items', payload);
      toast.success('Item created successfully');
      setIsDialogOpen(false);
      form.reset();
      fetchItems();
    } catch (error: any) {
      toast.error('Failed to create item', {
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemsList = Array.isArray(items) ? items : [];
  const categories = Array.from(new Set(itemsList.map(item => item.category).filter(Boolean)));

  const filteredItems = itemsList.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hsn_code?.includes(searchQuery);
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesLowStock = !showLowStock || (item.min_stock_level && item.current_stock <= item.min_stock_level);
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                <p className="text-sm text-gray-600 mt-1">Manage items and stock</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/inventory/stock')}
              >
                Stock Adjustment
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Item</DialogTitle>
                    <DialogDescription>
                      Enter item details. All prices are in ₹.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Product Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Item description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <FormControl>
                                <Input placeholder="Electronics, Furniture, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="hsn_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>HSN Code</FormLabel>
                              <FormControl>
                                <Input placeholder="8471" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                                  <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                  <SelectItem value="ltr">Liter (ltr)</SelectItem>
                                  <SelectItem value="mtr">Meter (mtr)</SelectItem>
                                  <SelectItem value="box">Box</SelectItem>
                                  <SelectItem value="dozen">Dozen</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tax_rate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GST Rate (%) *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select GST rate" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">0%</SelectItem>
                                  <SelectItem value="5">5%</SelectItem>
                                  <SelectItem value="12">12%</SelectItem>
                                  <SelectItem value="18">18%</SelectItem>
                                  <SelectItem value="28">28%</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="sale_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sale Price (₹) *</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="1000.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="purchase_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Purchase Price (₹)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="800.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="opening_stock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Opening Stock</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="min_stock_level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Min Stock Level</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="10" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Creating...' : 'Create Item'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search items by name, description, or HSN code..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category || ''}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showLowStock ? 'default' : 'outline'}
            onClick={() => setShowLowStock(!showLowStock)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Low Stock
          </Button>
        </div>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {itemsList.length === 0 ? 'No items yet' : 'No matching items'}
              </h2>
              <p className="text-gray-600 mb-6">
                {itemsList.length === 0
                  ? 'Add your first item to get started'
                  : 'Try adjusting your search or filter'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isLowStock = item.min_stock_level && (item.current_stock || 0) <= item.min_stock_level;
              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span className="flex-1">{item.name}</span>
                      {isLowStock && (
                        <AlertTriangle className="h-4 w-4 text-orange-500 ml-2" />
                      )}
                    </CardTitle>
                    {item.description && (
                      <CardDescription>{item.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {item.category && (
                        <p className="text-gray-600">
                          <span className="font-medium">Category:</span> {item.category}
                        </p>
                      )}
                      {item.hsn_code && (
                        <p className="text-gray-600">
                        <span className="font-medium">HSN:</span> {item.hsn_code}
                      </p>
                    )}
                    <p className="text-gray-600">
                      <span className="font-medium">Unit:</span> {item.unit?.toUpperCase() || 'N/A'}
                    </p>
                    <div className="pt-2 border-t">
                      <p className="text-lg font-semibold text-green-600">
                        ₹{Number(item.sale_price || 0).toFixed(2)}
                      </p>
                      {item.purchase_price && (
                          <p className="text-sm text-gray-500">
                            Cost: ₹{Number(item.purchase_price || 0).toFixed(2)}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">GST: {item.tax_rate || 0}%</p>
                      </div>
                      <div className="pt-2 border-t">
                        <p className={`font-medium ${isLowStock ? 'text-orange-600' : 'text-blue-600'}`}>
                          Stock: {item.current_stock || 0} {item.unit || ''}
                        </p>
                        {item.min_stock_level && (
                          <p className="text-xs text-gray-500">
                            Min level: {item.min_stock_level} {item.unit || ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
