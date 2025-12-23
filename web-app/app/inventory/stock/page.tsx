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
import { ArrowLeft, Plus, Minus } from 'lucide-react';

// Stock adjustment validation schema
const stockSchema = z.object({
  item_id: z.string().min(1, 'Please select an item'),
  adjustment_type: z.enum(['increase', 'decrease']),
  quantity: z.string().min(1, 'Quantity is required').refine(
    (val) => parseFloat(val) > 0,
    'Quantity must be greater than 0'
  ),
  reason: z.string().optional(),
});

type StockFormValues = z.infer<typeof stockSchema>;

interface Item {
  id: string;
  name: string;
  current_stock: number;
  unit: string;
}

export default function StockAdjustmentPage() {
  const router = useRouter();
  const { isAuthenticated, businessId } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      item_id: '',
      adjustment_type: 'increase',
      quantity: '',
      reason: '',
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

  const onSubmit = async (data: StockFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        item_id: data.item_id,
        adjustment_type: data.adjustment_type,
        quantity: parseFloat(data.quantity),
        reason: data.reason || undefined,
      };

      await inventoryApi.post('/stock/adjust', payload);
      toast.success('Stock adjusted successfully');
      setIsDialogOpen(false);
      form.reset();
      fetchItems();
    } catch (error: any) {
      toast.error('Failed to adjust stock', {
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemsList = Array.isArray(items) ? items : [];

  const handleItemChange = (itemId: string) => {
    const item = itemsList.find(i => i.id === itemId);
    setSelectedItem(item || null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading items...</p>
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
                onClick={() => router.push('/inventory')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Stock Adjustment</h1>
                <p className="text-sm text-gray-600 mt-1">Increase or decrease stock levels</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adjust Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Stock Adjustment</DialogTitle>
                  <DialogDescription>
                    Select an item and adjust its stock quantity.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="item_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item *</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleItemChange(value);
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {itemsList.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} (Current: {item.current_stock || 0} {item.unit || ''})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedItem && (
                      <div className="p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-900">
                          <span className="font-medium">Current Stock:</span> {selectedItem.current_stock} {selectedItem.unit}
                        </p>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="adjustment_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adjustment Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="increase">
                                <div className="flex items-center">
                                  <Plus className="h-4 w-4 mr-2 text-green-600" />
                                  Increase Stock
                                </div>
                              </SelectItem>
                              <SelectItem value="decrease">
                                <div className="flex items-center">
                                  <Minus className="h-4 w-4 mr-2 text-red-600" />
                                  Decrease Stock
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="10" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Purchase, Sale, Damage, etc." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          form.reset();
                          setSelectedItem(null);
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Adjusting...' : 'Adjust Stock'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itemsList.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-blue-600">
                    {item.current_stock || 0} {item.unit || ''}
                  </p>
                  <p className="text-sm text-gray-600">Current Stock</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {itemsList.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-600">No items found. Add items first to adjust stock.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/inventory')}
              >
                Go to Inventory
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
