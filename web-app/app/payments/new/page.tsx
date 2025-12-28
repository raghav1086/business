'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, IndianRupee, CreditCard, Calendar, FileText, User } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout, BottomNav } from '@/components/layout';
import { PageHeader } from '@/components/ui/page-header';
import { paymentApi, partyApi, invoiceApi } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { validateQueryUUID } from '@/lib/validation';
import { toast } from 'sonner';

interface PaymentFormData {
  party_id: string;
  invoice_id: string;
  amount: string;
  payment_date: string;
  payment_mode: string;
  reference_number: string;
  notes: string;
  payment_type: 'in' | 'out';
}

const PAYMENT_MODES = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank Transfer', value: 'bank' },
  { label: 'UPI', value: 'upi' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'Card', value: 'card' },
  { label: 'Credit', value: 'credit' },
];

// Helper to clean payload - removes empty strings and undefined values
const cleanPayload = (data: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

function NewPaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { businessId } = useAuthStore();

  const preselectedPartyId = searchParams.get('party_id') || '';
  const preselectedInvoiceId = searchParams.get('invoice_id') || '';

  const [formData, setFormData] = useState<PaymentFormData>({
    party_id: preselectedPartyId,
    invoice_id: preselectedInvoiceId,
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_mode: 'cash',
    reference_number: '',
    notes: '',
    payment_type: 'in',
  });

  const [errors, setErrors] = useState<Partial<PaymentFormData>>({});

  // Fetch parties
  const { data: parties } = useQuery({
    queryKey: ['parties'],
    queryFn: async () => {
      const response = await partyApi.get('/parties');
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
  });

  // Fetch invoices for selected party
  const { data: invoices } = useQuery({
    queryKey: ['party-invoices', formData.party_id],
    queryFn: async () => {
      if (!formData.party_id) return [];
      const validatedPartyId = validateQueryUUID(formData.party_id);
      if (!validatedPartyId) return [];
      const response = await invoiceApi.get(`/invoices?partyId=${validatedPartyId}`);
      return Array.isArray(response.data) ? response.data : (response.data?.invoices || response.data?.data || []);
    },
    enabled: !!formData.party_id,
  });

  const partiesList = Array.isArray(parties) ? parties : [];
  const invoicesList = Array.isArray(invoices) ? invoices : [];

  // Get selected invoice details
  const selectedInvoice = invoicesList.find((inv: any) => inv.id === formData.invoice_id);
  const invoiceBalance = selectedInvoice 
    ? Number(selectedInvoice.total_amount || 0) - Number(selectedInvoice.paid_amount || 0)
    : 0;

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c911df96-f005-41d0-8110-786b826bd4e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payments/new/page.tsx:102',message:'Payment mutation called',data:{formData:data,payment_type:data.payment_type,payment_date:data.payment_date,payment_mode:data.payment_mode},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Map form data to API schema
      const transactionType = data.payment_type === 'in' ? 'payment_in' : 'payment_out';
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c911df96-f005-41d0-8110-786b826bd4e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payments/new/page.tsx:108',message:'Mapped transaction_type',data:{payment_type:data.payment_type,transaction_type:transactionType},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Build payload with ONLY backend-expected fields
      const rawPayload = {
        party_id: data.party_id, // Required by API
        invoice_id: data.invoice_id || undefined,
        transaction_type: transactionType,
        transaction_date: data.payment_date, // Map payment_date to transaction_date (ISO 8601 format: yyyy-MM-dd)
        amount: parseFloat(data.amount) || 0,
        payment_mode: data.payment_mode, // Already mapped to lowercase
        reference_number: data.reference_number || undefined,
        notes: data.notes || undefined,
      };
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c911df96-f005-41d0-8110-786b826bd4e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payments/new/page.tsx:120',message:'Raw payload before cleaning',data:rawPayload,timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Clean the payload - remove empty/undefined values
      const payload = cleanPayload(rawPayload);
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c911df96-f005-41d0-8110-786b826bd4e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payments/new/page.tsx:125',message:'Cleaned payload to send',data:payload,timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const response = await paymentApi.post('/payments', payload);
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c911df96-f005-41d0-8110-786b826bd4e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payments/new/page.tsx:129',message:'Payment API response',data:{status:response.status,data:response.data},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment recorded successfully');
      router.push('/payments');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentFormData> = {};

    if (!formData.party_id) {
      newErrors.party_id = 'Party is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'Payment date is required';
    }

    if (!formData.payment_mode) {
      newErrors.payment_mode = 'Payment mode is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createPaymentMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Auto-select payment type based on party type
  const handlePartyChange = (partyId: string) => {
    handleChange('party_id', partyId);
    handleChange('invoice_id', ''); // Reset invoice
    const party = partiesList.find((p: any) => p.id === partyId);
    if (party) {
      const partyType = party.type || party.party_type;
      handleChange('payment_type', partyType === 'supplier' ? 'out' : 'in');
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Record Payment"
        description="Record a new payment transaction"
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Type
            </CardTitle>
            <CardDescription>Select the type of payment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.payment_type === 'in' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleChange('payment_type', 'in')}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-700">Payment In</p>
                    <p className="text-sm text-green-600">Money received</p>
                  </div>
                </div>
              </div>
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.payment_type === 'out' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleChange('payment_type', 'out')}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-700">Payment Out</p>
                    <p className="text-sm text-red-600">Money paid</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Party & Invoice */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Party & Invoice
            </CardTitle>
            <CardDescription>Select the party and optionally link to an invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="party_id">Party *</Label>
                <Select value={formData.party_id} onValueChange={handlePartyChange}>
                  <SelectTrigger className={errors.party_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select party" />
                  </SelectTrigger>
                  <SelectContent>
                    {partiesList.map((party: any) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.name || party.party_name} ({party.type || party.party_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.party_id && <p className="text-xs text-red-500">{errors.party_id}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_id">Invoice (Optional)</Label>
                <Select 
                  value={formData.invoice_id} 
                  onValueChange={(value) => handleChange('invoice_id', value)}
                  disabled={!formData.party_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.party_id ? "Select invoice" : "Select party first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {invoicesList.map((invoice: any) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - ₹{Number(invoice.total_amount || 0).toLocaleString('en-IN')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedInvoice && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Invoice Balance</span>
                  <span className="font-bold text-blue-600">
                    ₹{invoiceBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Payment Details
            </CardTitle>
            <CardDescription>Enter payment amount and method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    className={`pl-10 text-lg ${errors.amount ? 'border-red-500' : ''}`}
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
                {selectedInvoice && invoiceBalance > 0 && (
                  <Button 
                    type="button" 
                    variant="link" 
                    className="p-0 h-auto text-xs"
                    onClick={() => handleChange('amount', String(invoiceBalance))}
                  >
                    Use full balance (₹{invoiceBalance.toLocaleString('en-IN')})
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => handleChange('payment_date', e.target.value)}
                    className={`pl-10 ${errors.payment_date ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.payment_date && <p className="text-xs text-red-500">{errors.payment_date}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_mode">Payment Mode *</Label>
                <Select value={formData.payment_mode} onValueChange={(value) => handleChange('payment_mode', value)}>
                  <SelectTrigger className={errors.payment_mode ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map(mode => (
                      <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.payment_mode && <p className="text-xs text-red-500">{errors.payment_mode}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_number">Reference Number</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reference_number"
                    placeholder="Transaction ID / Cheque No."
                    value={formData.reference_number}
                    onChange={(e) => handleChange('reference_number', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Add any notes about this payment"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className={formData.payment_type === 'in' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {formData.payment_type === 'in' ? 'Amount to Receive' : 'Amount to Pay'}
                </p>
                <p className={`text-3xl font-bold ${formData.payment_type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{(parseFloat(formData.amount) || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                formData.payment_type === 'in' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <IndianRupee className={`h-8 w-8 ${formData.payment_type === 'in' ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pb-20 md:pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createPaymentMutation.isPending}
            className={formData.payment_type === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            <Save className="h-4 w-4 mr-2" />
            {createPaymentMutation.isPending ? 'Saving...' : 'Record Payment'}
          </Button>
        </div>
      </form>

      <BottomNav />
    </AppLayout>
  );
}

export default function NewPaymentPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <PageHeader
          title="Record Payment"
          description="Record a new payment transaction"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppLayout>
    }>
      <NewPaymentPageContent />
    </Suspense>
  );
}
