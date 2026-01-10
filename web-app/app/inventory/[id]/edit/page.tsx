'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Package, IndianRupee, Hash, Layers, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout, BottomNav } from '@/components/layout';
import { PageHeader } from '@/components/ui/page-header';
import { FormSkeleton } from '@/components/ui/skeleton';
import { inventoryApi } from '@/lib/api-client';
import { buildInventoryItemPayload, formatApiError } from '@/lib/payload-utils';
import { toast } from 'sonner';

interface ItemFormData {
  name: string;
  sku: string;
  hsn_code: string;
  category: string;
  unit: string;
  purchase_price: string;
  selling_price: string;
  gst_rate: string;
  current_stock: string;
  low_stock_threshold: string;
  description: string;
}

const UNITS = ['pcs', 'kg', 'gm', 'ltr', 'ml', 'mtr', 'box', 'dozen', 'pair', 'set'];
const CATEGORIES = ['Electronics', 'Clothing', 'Food & Beverages', 'Healthcare', 'Home & Garden', 'Office Supplies', 'Raw Materials', 'Services', 'Other'];
const GST_RATES = ['0', '5', '12', '18', '28'];

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const itemId = params.id as string;

  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    sku: '',
    hsn_code: '',
    category: '',
    unit: 'pcs',
    purchase_price: '',
    selling_price: '',
    gst_rate: '18',
    current_stock: '0',
    low_stock_threshold: '10',
    description: '',
  });

  const [errors, setErrors] = useState<Partial<ItemFormData>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch item details
  const { data: item, isLoading } = useQuery({
    queryKey: ['inventory-item', itemId],
    queryFn: async () => {
      const response = await inventoryApi.get(`/items/${itemId}`);
      return response.data?.data || response.data;
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || item.item_name || '',
        sku: item.sku || '',
        hsn_code: item.hsn_code || '',
        category: item.category || '', // Note: This is display-only, not sent to backend
        unit: item.unit || 'pcs', // Note: This is display-only, not sent to backend
        purchase_price: String(item.purchase_price || 0),
        selling_price: String(item.selling_price || item.sale_price || 0),
        // Backend returns tax_rate, but form uses gst_rate for display
        gst_rate: String(item.tax_rate || item.gst_rate || 18),
        current_stock: String(item.current_stock || 0),
        low_stock_threshold: String(item.low_stock_threshold || 10),
        description: item.description || '',
      });
    }
  }, [item]);

  /**
   * Updates an existing inventory item
   * 
   * **Field Mappings:**
   * - `gst_rate` (form) → `tax_rate` (backend) - Handled by buildInventoryItemPayload
   * - `name` → `name` (trimmed)
   * - `selling_price` → `selling_price` (string → number)
   * - `purchase_price` → `purchase_price` (string → number, optional)
   * - `current_stock` → `current_stock` (string → integer, optional)
   * - `low_stock_threshold` → `low_stock_threshold` (string → integer, optional)
   * 
   * **Excluded Fields:**
   * - `business_id` - Added by backend from request context
   * - `category` (string) - Backend expects `category_id` (UUID). Not implemented yet.
   * - `unit` (string) - Backend expects `unit_id` (UUID). Not implemented yet.
   */
  const updateItemMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      // Build clean payload using utility function
      // This handles all field mappings, empty string removal, and type conversions
      const payload = buildInventoryItemPayload({
        name: data.name,
        sku: data.sku,
        hsn_code: data.hsn_code,
        description: data.description,
        purchase_price: data.purchase_price,
        selling_price: data.selling_price,
        gst_rate: data.gst_rate,
        current_stock: data.current_stock,
        low_stock_threshold: data.low_stock_threshold,
      });
      
      // Note: business_id is NOT sent - backend gets it from request context
      // Note: category and unit are NOT sent - backend expects UUIDs (category_id, unit_id)
      // These fields are kept in form for display only

      const response = await inventoryApi.patch(`/items/${itemId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-item', itemId] });
      toast.success('Item updated successfully');
      router.push(`/inventory/${itemId}`);
    },
    onError: (error: any) => {
      toast.error(formatApiError(error));
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async () => {
      const response = await inventoryApi.delete(`/items/${itemId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Item deleted successfully');
      router.push('/inventory');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<ItemFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!formData.selling_price || parseFloat(formData.selling_price) <= 0) {
      newErrors.selling_price = 'Valid selling price is required';
    }

    if (formData.hsn_code && !/^\d{4,8}$/.test(formData.hsn_code)) {
      newErrors.hsn_code = 'HSN code should be 4-8 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      updateItemMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof ItemFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteItemMutation.mutate();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <PageHeader title="Edit Item" description="Loading..." />
        <Card>
          <CardContent className="p-6">
            <FormSkeleton />
          </CardContent>
        </Card>
        <BottomNav />
      </AppLayout>
    );
  }

  if (!item) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Item not found</p>
          <Button onClick={() => router.push('/inventory')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </div>
        <BottomNav />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Edit Item"
        description={`Update details for ${formData.name}`}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Update the item's basic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter item name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU / Item Code</Label>
                <Input
                  id="sku"
                  placeholder="SKU-001"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hsn_code">HSN Code</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="hsn_code"
                    placeholder="e.g., 8471"
                    value={formData.hsn_code}
                    onChange={(e) => handleChange('hsn_code', e.target.value.replace(/\D/g, ''))}
                    className={`pl-10 ${errors.hsn_code ? 'border-red-500' : ''}`}
                    maxLength={8}
                  />
                </div>
                {errors.hsn_code && <p className="text-xs text-red-500">{errors.hsn_code}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter item description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Pricing
            </CardTitle>
            <CardDescription>Update purchase and selling prices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="purchase_price"
                    type="number"
                    placeholder="0.00"
                    value={formData.purchase_price}
                    onChange={(e) => handleChange('purchase_price', e.target.value)}
                    className="pl-10"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="selling_price">Selling Price (₹) *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="selling_price"
                    type="number"
                    placeholder="0.00"
                    value={formData.selling_price}
                    onChange={(e) => handleChange('selling_price', e.target.value)}
                    className={`pl-10 ${errors.selling_price ? 'border-red-500' : ''}`}
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.selling_price && <p className="text-xs text-red-500">{errors.selling_price}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst_rate">GST Rate (%)</Label>
                <Select value={formData.gst_rate} onValueChange={(value) => handleChange('gst_rate', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select GST rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {GST_RATES.map(rate => (
                      <SelectItem key={rate} value={rate}>{rate}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Stock Information
            </CardTitle>
            <CardDescription>Update stock levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit of Measurement</Label>
                <Select value={formData.unit} onValueChange={(value) => handleChange('unit', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_stock">Current Stock</Label>
                <Input
                  id="current_stock"
                  type="number"
                  placeholder="0"
                  value={formData.current_stock}
                  onChange={(e) => handleChange('current_stock', e.target.value)}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  placeholder="10"
                  value={formData.low_stock_threshold}
                  onChange={(e) => handleChange('low_stock_threshold', e.target.value)}
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-red-700">Delete this item</p>
                <p className="text-sm text-red-600">Once deleted, this action cannot be undone.</p>
              </div>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteItemMutation.isPending}
              >
                {showDeleteConfirm ? 'Confirm Delete' : 'Delete Item'}
              </Button>
            </div>
            {showDeleteConfirm && (
              <p className="text-sm text-red-600 mt-2">
                Click again to confirm deletion.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pb-20 md:pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateItemMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateItemMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <BottomNav />
    </AppLayout>
  );
}
