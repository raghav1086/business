'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Save, 
  FileText,
  User,
  Plus,
  Trash2,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout, BottomNav } from '@/components/layout';
import { PageHeader } from '@/components/ui/page-header';
import { FormSkeleton } from '@/components/ui/skeleton';
import { invoiceApi, partyApi, inventoryApi } from '@/lib/api-client';
import { formatApiError } from '@/lib/payload-utils';
import { toast } from 'sonner';

interface LineItem {
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  gst_rate: number; // Frontend uses gst_rate for display, maps to tax_rate for backend
  hsn_code: string;
  total: number;
}

interface InvoiceFormData {
  invoice_number: string;
  invoice_type: 'sale' | 'purchase';
  party_id: string;
  invoice_date: string;
  due_date: string;
  status: string;
  notes: string;
  items: LineItem[];
}

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const invoiceId = params.id as string;

  const [formData, setFormData] = useState<InvoiceFormData>({
    invoice_number: '',
    invoice_type: 'sale',
    party_id: '',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: '',
    status: 'pending',
    notes: '',
    items: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch invoice details
  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await invoiceApi.get(`/invoices/${invoiceId}`);
      return response.data?.data || response.data;
    },
  });

  // Fetch parties
  const { data: parties } = useQuery({
    queryKey: ['parties'],
    queryFn: async () => {
      const response = await partyApi.get('/parties');
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
  });

  // Fetch inventory items
  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const response = await inventoryApi.get('/items');
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
  });

  const partiesList = Array.isArray(parties) ? parties : [];
  const itemsList = Array.isArray(inventoryItems) ? inventoryItems : [];

  // Populate form when invoice loads
  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number || '',
        invoice_type: invoice.invoice_type || 'sale',
        party_id: invoice.party_id || '',
        invoice_date: invoice.invoice_date ? format(new Date(invoice.invoice_date), 'yyyy-MM-dd') : '',
        due_date: invoice.due_date ? format(new Date(invoice.due_date), 'yyyy-MM-dd') : '',
        status: invoice.status || 'pending',
        notes: invoice.notes || '',
        items: (invoice.items || []).map((item: any) => ({
          item_id: item.item_id || '',
          item_name: item.item_name || item.name || '',
          quantity: Number(item.quantity || 1),
          unit_price: Number(item.unit_price || item.price || 0),
          // Backend returns tax_rate, but form uses gst_rate for display
          gst_rate: Number(item.tax_rate || item.gst_rate || 18),
          hsn_code: item.hsn_code || '',
          total: Number(item.total || item.amount || 0),
        })),
      });
    }
  }, [invoice]);

  /**
   * Updates an existing invoice
   * 
   * **Field Mappings:**
   * - `gst_rate` (form items) → `tax_rate` (backend items)
   * - All other fields map directly
   * 
   * **Note:** Form uses `gst_rate` for display consistency, but backend expects `tax_rate`.
   * This mutation handles the mapping automatically.
   */
  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.gst_rate / 100), 0);
      
      // Map form data to backend DTO format
      // Frontend uses gst_rate, but backend expects tax_rate in items
      const payload = {
        invoice_type: data.invoice_type,
        party_id: data.party_id,
        invoice_date: data.invoice_date,
        due_date: data.due_date || undefined,
        status: data.status,
        notes: data.notes || undefined,
        items: data.items.map(item => ({
          item_id: item.item_id || undefined,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          hsn_code: item.hsn_code || undefined,
          tax_rate: item.gst_rate, // Map gst_rate to tax_rate for backend
          discount_percent: 0, // Default if not provided
        })),
        subtotal_amount: subtotal,
        tax_amount: taxAmount,
        total_amount: subtotal + taxAmount,
      };
      
      const response = await invoiceApi.patch(`/invoices/${invoiceId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      toast.success('Invoice updated successfully');
      router.push(`/invoices/${invoiceId}`);
    },
    onError: (error: any) => {
      toast.error(formatApiError(error));
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await invoiceApi.delete(`/invoices/${invoiceId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted successfully');
      router.push('/invoices');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete invoice');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.party_id) {
      newErrors.party_id = 'Party is required';
    }

    if (!formData.invoice_date) {
      newErrors.invoice_date = 'Invoice date is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      updateInvoiceMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddItem = () => {
    const newItem: LineItem = {
      item_id: '',
      item_name: '',
      quantity: 1,
      unit_price: 0,
      gst_rate: 18,
      hsn_code: '',
      total: 0,
    };
    handleChange('items', [...formData.items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    handleChange('items', newItems);
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate total
    if (field === 'quantity' || field === 'unit_price' || field === 'gst_rate') {
      const qty = field === 'quantity' ? value : newItems[index].quantity;
      const price = field === 'unit_price' ? value : newItems[index].unit_price;
      const gst = field === 'gst_rate' ? value : newItems[index].gst_rate;
      newItems[index].total = qty * price * (1 + gst / 100);
    }

    handleChange('items', newItems);
  };

  const handleSelectInventoryItem = (index: number, itemId: string) => {
    const inventoryItem = itemsList.find((item: any) => item.id === itemId);
    if (inventoryItem) {
      const newItems = [...formData.items];
      newItems[index] = {
        ...newItems[index],
        item_id: inventoryItem.id,
        item_name: inventoryItem.name || inventoryItem.item_name,
        unit_price: Number(inventoryItem.selling_price || inventoryItem.sale_price || 0),
        // Backend returns tax_rate, but form uses gst_rate for display
        gst_rate: Number(inventoryItem.tax_rate || inventoryItem.gst_rate || 18),
        hsn_code: inventoryItem.hsn_code || '',
      };
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price * (1 + newItems[index].gst_rate / 100);
      handleChange('items', newItems);
    }
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteInvoiceMutation.mutate();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.gst_rate / 100), 0);
  const totalAmount = subtotal + taxAmount;

  if (invoiceLoading) {
    return (
      <AppLayout>
        <PageHeader title="Edit Invoice" description="Loading..." />
        <Card>
          <CardContent className="p-6">
            <FormSkeleton />
          </CardContent>
        </Card>
        <BottomNav />
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Invoice not found</p>
          <Button onClick={() => router.push('/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
        <BottomNav />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Edit Invoice"
        description={`Update ${formData.invoice_number}`}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Invoice Number</Label>
                <Input
                  id="invoice_number"
                  value={formData.invoice_number}
                  onChange={(e) => handleChange('invoice_number', e.target.value)}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_type">Invoice Type</Label>
                <Select value={formData.invoice_type} onValueChange={(value) => handleChange('invoice_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Sales Invoice</SelectItem>
                    <SelectItem value="purchase">Purchase Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="party_id">Party *</Label>
                <Select value={formData.party_id} onValueChange={(value) => handleChange('party_id', value)}>
                  <SelectTrigger className={errors.party_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select party" />
                  </SelectTrigger>
                  <SelectContent>
                    {partiesList.map((party: any) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.name || party.party_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.party_id && <p className="text-xs text-red-500">{errors.party_id}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_date">Invoice Date *</Label>
                <Input
                  id="invoice_date"
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => handleChange('invoice_date', e.target.value)}
                  className={errors.invoice_date ? 'border-red-500' : ''}
                />
                {errors.invoice_date && <p className="text-xs text-red-500">{errors.invoice_date}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleChange('due_date', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            {errors.items && <p className="text-xs text-red-500 mt-1">{errors.items}</p>}
          </CardHeader>
          <CardContent>
            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items added yet</p>
                <Button type="button" variant="link" onClick={handleAddItem}>
                  Add your first item
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground">Item #{index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Select from Inventory</Label>
                        <Select 
                          value={item.item_id} 
                          onValueChange={(value) => handleSelectInventoryItem(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {itemsList.map((invItem: any) => (
                              <SelectItem key={invItem.id} value={invItem.id}>
                                {invItem.name || invItem.item_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Item Name</Label>
                        <Input
                          value={item.item_name}
                          onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                          placeholder="Item name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>GST %</Label>
                        <Select 
                          value={String(item.gst_rate)} 
                          onValueChange={(value) => handleItemChange(index, 'gst_rate', Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem>
                            <SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>HSN Code</Label>
                        <Input
                          value={item.hsn_code}
                          onChange={(e) => handleItemChange(index, 'hsn_code', e.target.value)}
                          placeholder="HSN"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total</Label>
                        <Input
                          value={`₹${item.total.toLocaleString('en-IN')}`}
                          disabled
                          className="font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center p-2">
                <span className="text-muted-foreground">Tax (GST)</span>
                <span className="font-medium">₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Total Amount</span>
                <span className="text-xl font-bold">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Add any notes for this invoice"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-red-700">Delete this invoice</p>
                <p className="text-sm text-red-600">This action cannot be undone.</p>
              </div>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteInvoiceMutation.isPending}
              >
                {showDeleteConfirm ? 'Confirm Delete' : 'Delete Invoice'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4 pb-20 md:pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateInvoiceMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateInvoiceMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <BottomNav />
    </AppLayout>
  );
}
