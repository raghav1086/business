'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/lib/auth-store';
import { paymentApi, invoiceApi, partyApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

// Payment form validation schema
const paymentSchema = z.object({
  invoice_id: z.string().min(1, 'Please select an invoice'),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => parseFloat(val) > 0,
    'Amount must be greater than 0'
  ),
  payment_mode: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'cheque']),
  payment_date: z.string().min(1, 'Payment date is required'),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface Payment {
  id: string;
  invoice: {
    invoice_number: string;
    party: {
      name: string;
    };
  };
  amount: number;
  payment_mode: string;
  payment_date: string;
  reference_number?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  party: {
    name: string;
  };
  total_amount: number;
  paid_amount: number;
}

export default function PaymentsPage() {
  const router = useRouter();
  const { isAuthenticated, businessId } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoice_id: '',
      amount: '',
      payment_mode: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: '',
    },
  });

  const selectedInvoiceId = form.watch('invoice_id');

  useEffect(() => {
    if (!isAuthenticated || !businessId) {
      router.push('/');
    } else {
      fetchData();
    }
  }, [isAuthenticated, businessId, router]);

  const fetchData = async () => {
    try {
      const [paymentsRes, invoicesRes] = await Promise.all([
        paymentApi.get('/payments'),
        invoiceApi.get('/invoices'),
      ]);
      
      const paymentsData = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data?.data || []);
      const invoicesData = Array.isArray(invoicesRes.data) ? invoicesRes.data : (invoicesRes.data?.data || []);
      
      setPayments(paymentsData);
      setInvoices(invoicesData);
    } catch (error: any) {
      toast.error('Failed to load data', {
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: PaymentFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        invoice_id: data.invoice_id,
        amount: parseFloat(data.amount),
        payment_mode: data.payment_mode,
        payment_date: data.payment_date,
        reference_number: data.reference_number || undefined,
        notes: data.notes || undefined,
      };

      await paymentApi.post('/payments', payload);
      toast.success('Payment recorded successfully');
      setIsDialogOpen(false);
      form.reset();
      fetchData();
    } catch (error: any) {
      toast.error('Failed to record payment', {
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const invoicesList = Array.isArray(invoices) ? invoices : [];
  const paymentsList = Array.isArray(payments) ? payments : [];

  const selectedInvoice = invoicesList.find(inv => inv.id === selectedInvoiceId);
  const pendingInvoices = invoicesList.filter(inv => (inv.paid_amount || 0) < (inv.total_amount || 0));

  const filteredPayments = paymentsList.filter((payment) => {
    return payment.invoice?.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoice?.party?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payments...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                <p className="text-sm text-gray-600 mt-1">Record and track payments</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>
                    Enter payment details for an invoice
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="invoice_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select invoice" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {pendingInvoices.map((invoice) => {
                                const pending = Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0);
                                return (
                                  <SelectItem key={invoice.id} value={invoice.id}>
                                    {invoice.invoice_number} - {invoice.party?.name || 'Unknown'} (₹{pending.toFixed(2)})
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedInvoice && (
                      <div className="p-3 bg-blue-50 rounded-md space-y-1">
                        <p className="text-sm text-blue-900">
                          <span className="font-medium">Total:</span> ₹{Number(selectedInvoice.total_amount || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-blue-900">
                          <span className="font-medium">Paid:</span> ₹{Number(selectedInvoice.paid_amount || 0).toFixed(2)}
                        </p>
                        <p className="text-sm font-semibold text-blue-900">
                          <span className="font-medium">Pending:</span> ₹{(Number(selectedInvoice.total_amount || 0) - Number(selectedInvoice.paid_amount || 0)).toFixed(2)}
                        </p>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (₹) *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="1000.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="payment_mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Mode *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="payment_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reference_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Transaction ID, Cheque No., etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="Any additional notes..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                        {isSubmitting ? 'Recording...' : 'Record Payment'}
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
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by invoice number, party name, or reference..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {paymentsList.length === 0 ? 'No payments yet' : 'No matching payments'}
              </h2>
              <p className="text-gray-600 mb-6">
                {paymentsList.length === 0
                  ? 'Record your first payment to get started'
                  : 'Try adjusting your search'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        {payment.invoice?.invoice_number || 'Unknown'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {payment.invoice?.party?.name || 'Unknown'}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ₹{Number(payment.amount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(payment.payment_mode || 'unknown').toUpperCase().replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">Date:</span>{' '}
                      {payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM yyyy') : 'N/A'}
                    </p>
                    {payment.reference_number && (
                      <p className="text-gray-600">
                        <span className="font-medium">Reference:</span> {payment.reference_number}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
