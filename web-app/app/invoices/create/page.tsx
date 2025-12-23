'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/lib/auth-store';
import { invoiceApi, partyApi, inventoryApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Calculator } from 'lucide-react';

// Invoice form validation schema - aligned with backend CreateInvoiceDto
// REQUIRED: party_id, invoice_type, invoice_date, items array
// OPTIONAL: due_date, notes, terms
// Item REQUIRED: item_name, quantity, unit_price
// Item OPTIONAL: item_id, discount_percent, tax_rate
const invoiceSchema = z.object({
  invoice_type: z.enum(['sale', 'purchase', 'quotation', 'proforma']),
  party_id: z.string().min(1, 'Please select a party'),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  due_date: z.string().optional().or(z.literal('')), // Optional per backend
  items: z.array(z.object({
    item_id: z.string().optional(), // Optional - can create invoice with manual items
    item_name: z.string().min(2, 'Item name is required'), // Required per backend
    quantity: z.string().min(1, 'Quantity is required'),
    unit_price: z.string().min(1, 'Price is required'), // Required per backend (renamed from rate)
    discount_percent: z.string().optional(),
    tax_rate: z.string().optional(),
  })).min(1, 'Add at least one item'),
  notes: z.string().optional().or(z.literal('')),
  terms: z.string().optional().or(z.literal('')),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface Party {
  id: string;
  name: string;
  type: string;
  billing_state?: string;
}

interface Item {
  id: string;
  name: string;
  selling_price: number;
  purchase_price?: number;
  tax_rate?: number;
  unit?: string;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { isAuthenticated, businessId } = useAuthStore();
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessState, setBusinessState] = useState<string>('');

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_type: 'sale',
      party_id: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ item_id: '', item_name: '', quantity: '', unit_price: '', discount_percent: '0', tax_rate: '18' }],
      notes: '',
      terms: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const invoiceType = form.watch('invoice_type');
  const partyId = form.watch('party_id');
  const itemsWatch = form.watch('items');

  useEffect(() => {
    if (!isAuthenticated || !businessId) {
      router.push('/');
    } else {
      fetchData();
    }
  }, [isAuthenticated, businessId, router]);

  const fetchData = async () => {
    try {
      const [partiesRes, itemsRes] = await Promise.all([
        partyApi.get('/parties'),
        inventoryApi.get('/items'),
      ]);
      
      const partiesData = Array.isArray(partiesRes.data) ? partiesRes.data : (partiesRes.data?.data || []);
      const itemsData = Array.isArray(itemsRes.data) ? itemsRes.data : (itemsRes.data?.data || []);
      
      setParties(partiesData);
      setItems(itemsData);
      
      // Get business state (you might need to fetch this from business API)
      setBusinessState('Karnataka'); // Default, should be fetched from business settings
    } catch (error: any) {
      toast.error('Failed to load data', {
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    
    itemsWatch.forEach((item, index) => {
      const quantity = parseFloat(item.quantity || '0');
      const unit_price = parseFloat(item.unit_price || '0');
      const discount_percent = parseFloat(item.discount_percent || '0');
      
      const itemSubtotal = quantity * unit_price;
      const discountAmount = (itemSubtotal * discount_percent) / 100;
      const taxableAmount = itemSubtotal - discountAmount;
      
      // Get tax rate for this item
      const taxRate = parseFloat(item.tax_rate || '0');
      const tax = (taxableAmount * taxRate) / 100;
      
      subtotal += taxableAmount;
      totalTax += tax;
    });
    
    return {
      subtotal: subtotal.toFixed(2),
      tax: totalTax.toFixed(2),
      total: (subtotal + totalTax).toFixed(2),
    };
  };

  const partiesList = Array.isArray(parties) ? parties : [];
  const itemsList = Array.isArray(items) ? items : [];

  const handleItemChange = (index: number, itemId: string) => {
    const selectedItem = itemsList.find(i => i.id === itemId);
    if (selectedItem) {
      const price = invoiceType === 'sale' 
        ? selectedItem.selling_price 
        : (selectedItem.purchase_price || selectedItem.selling_price);
      
      form.setValue(`items.${index}.unit_price`, String(price || 0));
      form.setValue(`items.${index}.item_name`, selectedItem.name);
      form.setValue(`items.${index}.tax_rate`, String(selectedItem.tax_rate || 18));
    }
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    setIsSubmitting(true);
    try {
      const selectedParty = partiesList.find(p => p.id === data.party_id);
      const isInterState = businessState && selectedParty?.billing_state 
        ? selectedParty.billing_state !== businessState 
        : false;
      
      const payload = {
        invoice_type: data.invoice_type,
        party_id: data.party_id,
        invoice_date: data.invoice_date,
        due_date: data.due_date || undefined,
        is_inter_state: isInterState,
        items: data.items.map(item => ({
          item_id: item.item_id || undefined,
          item_name: item.item_name,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          discount_percent: item.discount_percent ? parseFloat(item.discount_percent) : undefined,
          tax_rate: item.tax_rate ? parseFloat(item.tax_rate) : undefined,
        })),
        notes: data.notes || undefined,
        terms: data.terms || undefined,
      };

      await invoiceApi.post('/invoices', payload);
      toast.success('Invoice created successfully');
      router.push('/invoices');
    } catch (error: any) {
      toast.error('Failed to create invoice', {
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();
  const selectedParty = partiesList.find(p => p.id === partyId);
  const isInterState = selectedParty?.billing_state !== businessState;

  const filteredParties = partiesList.filter(party => 
    invoiceType === 'sale' 
      ? party.type === 'customer' || party.type === 'both'
      : party.type === 'supplier' || party.type === 'both'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/invoices')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
              <p className="text-sm text-gray-600 mt-1">Fill in the details to create a new invoice</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Invoice Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>Basic invoice information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoice_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sale">Sale Invoice</SelectItem>
                            <SelectItem value="purchase">Purchase Invoice</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="party_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {invoiceType === 'sale' ? 'Customer' : 'Supplier'} *
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${invoiceType === 'sale' ? 'customer' : 'supplier'}`} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredParties.map((party) => (
                              <SelectItem key={party.id} value={party.id}>
                                {party.name}
                              </SelectItem>
                            ))}
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
                    name="invoice_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedParty && (
                  <div className="p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">GST Type:</span>{' '}
                      {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Invoice Items</CardTitle>
                    <CardDescription>Add items to this invoice</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ item_id: '', item_name: '', quantity: '', unit_price: '', discount_percent: '0', tax_rate: '18' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium text-sm">Item #{index + 1}</p>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.item_id`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Item</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleItemChange(index, value);
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select item or type name below" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {itemsList.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name} - ₹{invoiceType === 'sale' ? Number(item.selling_price || 0) : Number(item.purchase_price || item.selling_price || 0)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.item_name`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Item Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter item name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qty *</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (₹) *</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.discount_percent`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount %</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.tax_rate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GST %</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || '18'}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="GST" />
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
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Any additional notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{totals.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({isInterState ? 'IGST' : 'GST'}):</span>
                    <span className="font-medium">₹{totals.tax}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total Amount:</span>
                    <span className="text-purple-600">₹{totals.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/invoices')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
