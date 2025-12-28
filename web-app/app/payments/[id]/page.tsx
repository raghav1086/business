'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  IndianRupee, 
  Calendar,
  FileText,
  User,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout, BottomNav } from '@/components/layout';
import { PageHeader } from '@/components/ui/page-header';
import { CardSkeleton } from '@/components/ui/skeleton';
import { paymentApi, partyApi, invoiceApi } from '@/lib/api-client';
import { validateUrlUUID, validateQueryUUID } from '@/lib/validation';
import { useAuthStore } from '@/lib/auth-store';

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { businessId } = useAuthStore();
  const paymentId = validateUrlUUID(params.id, 'Payment ID');

  // Redirect if business not selected
  useEffect(() => {
    if (!businessId) {
      router.push('/business/select');
    }
  }, [businessId, router]);

  // Fetch payment details
  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', paymentId, businessId],
    queryFn: async () => {
      if (!paymentId) throw new Error('Invalid payment ID');
      const response = await paymentApi.get(`/payments/${paymentId}`);
      return response.data?.data || response.data;
    },
    enabled: !!paymentId && !!businessId,
  });

  // Fetch party details if payment has party_id
  const { data: party } = useQuery({
    queryKey: ['party', payment?.party_id, businessId],
    queryFn: async () => {
      if (!payment?.party_id) return null;
      const validatedPartyId = validateQueryUUID(payment.party_id);
      if (!validatedPartyId) return null;
      const response = await partyApi.get(`/parties/${validatedPartyId}`);
      return response.data?.data || response.data;
    },
    enabled: !!payment?.party_id && !!businessId,
  });

  // Fetch invoice details if payment has invoice_id
  const { data: invoice } = useQuery({
    queryKey: ['invoice', payment?.invoice_id, businessId],
    queryFn: async () => {
      if (!payment?.invoice_id) return null;
      const validatedInvoiceId = validateQueryUUID(payment.invoice_id);
      if (!validatedInvoiceId) return null;
      const response = await invoiceApi.get(`/invoices/${validatedInvoiceId}`);
      return response.data?.data || response.data;
    },
    enabled: !!payment?.invoice_id && !!businessId,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map(i => <CardSkeleton key={i} />)}
          </div>
        </div>
        <BottomNav />
      </AppLayout>
    );
  }

  if (!payment) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Payment not found</p>
          <Button onClick={() => router.push('/payments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Button>
        </div>
        <BottomNav />
      </AppLayout>
    );
  }

  const amount = Number(payment.amount || 0);
  const isPaymentIn = payment.payment_type === 'in' || payment.type === 'in';
  const paymentDate = payment.payment_date || payment.created_at;

  return (
    <AppLayout>
      <PageHeader
        title="Payment Details"
        description={`Transaction on ${format(new Date(paymentDate), 'dd MMM yyyy')}`}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </PageHeader>

      {/* Payment Header */}
      <Card className={`mb-6 ${isPaymentIn ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-full flex items-center justify-center ${
                isPaymentIn ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {isPaymentIn ? (
                  <ArrowDownLeft className="h-7 w-7 text-green-600" />
                ) : (
                  <ArrowUpRight className="h-7 w-7 text-red-600" />
                )}
              </div>
              <div>
                <Badge variant={isPaymentIn ? 'success' : 'destructive'} className="mb-1">
                  {isPaymentIn ? 'PAYMENT IN' : 'PAYMENT OUT'}
                </Badge>
                <p className={`text-3xl font-bold ${isPaymentIn ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{amount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Payment Date</p>
                <p className="font-medium">{format(new Date(paymentDate), 'dd MMMM yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Payment Mode</p>
                <p className="font-medium">{payment.payment_mode || 'Cash'}</p>
              </div>
            </div>
            {payment.reference_number && (
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Reference Number</p>
                  <p className="font-medium">{payment.reference_number}</p>
                </div>
              </div>
            )}
            {payment.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{payment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {party ? (
              <div 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/parties/${party.id}`)}
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Party</p>
                  <p className="font-medium">{party.name || party.party_name}</p>
                </div>
                <Badge variant="outline">{party.type || party.party_type}</Badge>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 border rounded-lg opacity-50">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Party</p>
                  <p className="font-medium">Not linked to a party</p>
                </div>
              </div>
            )}

            {invoice ? (
              <div 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/invoices/${invoice.id}`)}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Invoice</p>
                  <p className="font-medium">{invoice.invoice_number}</p>
                </div>
                <span className="text-sm font-medium">
                  ₹{Number(invoice.total_amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 border rounded-lg opacity-50">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Invoice</p>
                  <p className="font-medium">Not linked to an invoice</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Summary */}
      <Card className="mb-20 md:mb-6">
        <CardHeader>
          <CardTitle className="text-base">Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm">Payment Amount</span>
              <span className="font-bold">₹{amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm">Payment Type</span>
              <Badge variant={isPaymentIn ? 'success' : 'destructive'}>
                {isPaymentIn ? 'Received' : 'Paid'}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm">Status</span>
              <Badge variant="success">Completed</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm">Created</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(payment.created_at || paymentDate), 'dd MMM yyyy, hh:mm a')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <BottomNav />
    </AppLayout>
  );
}
