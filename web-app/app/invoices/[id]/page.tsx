'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit, 
  Printer,
  Download,
  FileText,
  IndianRupee,
  Calendar,
  User,
  Package,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout, BottomNav } from '@/components/layout';
import { PageHeader } from '@/components/ui/page-header';
import { CardSkeleton, ListItemSkeleton } from '@/components/ui/skeleton';
import { invoiceApi, partyApi, paymentApi } from '@/lib/api-client';
import { generateInvoicePDF } from '@/lib/export-utils';
import { validateUrlUUID, validateQueryUUID } from '@/lib/validation';
import { useAuthStore } from '@/lib/auth-store';
import { EInvoiceSection } from '@/components/gst/einvoice-section';
import { EWayBillSection } from '@/components/gst/ewaybill-section';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { businessId } = useAuthStore();
  const invoiceId = validateUrlUUID(params.id, 'Invoice ID');

  // Redirect if business not selected
  useEffect(() => {
    if (!businessId) {
      router.push('/business/select');
    }
  }, [businessId, router]);

  // Fetch invoice details
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId, businessId],
    queryFn: async () => {
      if (!invoiceId) throw new Error('Invalid invoice ID');
      const response = await invoiceApi.get(`/invoices/${invoiceId}`);
      return response.data?.data || response.data;
    },
    enabled: !!invoiceId && !!businessId,
  });

  // Fetch party details
  const { data: party } = useQuery({
    queryKey: ['party', invoice?.party_id, businessId],
    queryFn: async () => {
      if (!invoice?.party_id) return null;
      const validatedPartyId = validateQueryUUID(invoice.party_id);
      if (!validatedPartyId) return null;
      const response = await partyApi.get(`/parties/${validatedPartyId}`);
      return response.data?.data || response.data;
    },
    enabled: !!invoice?.party_id && !!businessId,
  });

  // Fetch payments for this invoice
  const { data: payments } = useQuery({
    queryKey: ['invoice-payments', invoiceId, businessId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const response = await paymentApi.get(`/payments?invoiceId=${invoiceId}`);
      return Array.isArray(response.data) ? response.data : (response.data?.payments || response.data?.data || []);
    },
    enabled: !!invoiceId && !!businessId,
  });

  const paymentsList = Array.isArray(payments) ? payments : [];
  const totalPaid = paymentsList.reduce((sum, pay: any) => sum + Number(pay.amount || 0), 0);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
          </div>
          <Card>
            <CardContent className="p-6">
              {[1, 2, 3].map(i => <ListItemSkeleton key={i} />)}
            </CardContent>
          </Card>
        </div>
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

  const totalAmount = Number(invoice.total_amount || 0);
  const subtotal = Number(invoice.subtotal_amount || 0);
  const taxAmount = Number(invoice.tax_amount || 0);
  const balanceDue = totalAmount - totalPaid;
  const isSale = invoice.invoice_type === 'sale';
  const items = invoice.items || [];

  const getStatusIcon = () => {
    switch (invoice.status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (invoice.status) {
      case 'paid':
        return <Badge variant="success">PAID</Badge>;
      case 'pending':
        return <Badge variant="warning">PENDING</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">CANCELLED</Badge>;
      default:
        return <Badge variant="secondary">{invoice.status?.toUpperCase()}</Badge>;
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title={invoice.invoice_number}
        description={isSale ? 'Sales Invoice' : 'Purchase Invoice'}
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" onClick={() => router.push(`/invoices/${invoiceId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button 
            variant="outline" 
            onClick={() => generateInvoicePDF(invoice, party, {})}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </PageHeader>

      {/* Invoice Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`h-14 w-14 rounded-lg flex items-center justify-center ${
          isSale ? 'bg-green-100' : 'bg-orange-100'
        }`}>
          <FileText className={`h-7 w-7 ${isSale ? 'text-green-600' : 'text-orange-600'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{invoice.invoice_number}</h2>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(invoice.invoice_date), 'dd MMMM yyyy')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Subtotal</div>
              <IndianRupee className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ₹{subtotal.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Tax</div>
              <IndianRupee className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              ₹{taxAmount.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Total</div>
              <IndianRupee className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalAmount.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Balance Due</div>
              {getStatusIcon()}
            </div>
            <div className={`text-2xl font-bold ${balanceDue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              ₹{balanceDue.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Party & Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Party Details</CardTitle>
          </CardHeader>
          <CardContent>
            {party ? (
              <div 
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/parties/${party.id}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{party.name || party.party_name}</p>
                    <Badge variant="outline" className="text-xs">
                      {(party.type || party.party_type || '').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                {party.gstin && (
                  <p className="text-sm text-muted-foreground mb-1">GSTIN: {party.gstin}</p>
                )}
                {(party.phone || party.mobile) && (
                  <p className="text-sm text-muted-foreground mb-1">Phone: {party.phone || party.mobile}</p>
                )}
                {party.address && (
                  <p className="text-sm text-muted-foreground">
                    {[party.address, party.city, party.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No party linked</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Invoice Type</span>
              <Badge variant={isSale ? 'success' : 'warning'}>
                {isSale ? 'SALES' : 'PURCHASE'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Invoice Date</span>
              <span className="font-medium">
                {format(new Date(invoice.invoice_date), 'dd MMM yyyy')}
              </span>
            </div>
            {invoice.due_date && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Due Date</span>
                <span className="font-medium">
                  {format(new Date(invoice.due_date), 'dd MMM yyyy')}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              {getStatusBadge()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5" />
            Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No items in this invoice</p>
          ) : (
            <div className="space-y-3">
              {items.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.item_name || item.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{item.quantity} × ₹{Number(item.unit_price || item.price || 0).toLocaleString('en-IN')}</span>
                      {item.gst_rate && <Badge variant="outline" className="text-xs">{item.gst_rate}% GST</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{Number(item.total || item.amount || 0).toLocaleString('en-IN')}</p>
                    {item.hsn_code && (
                      <p className="text-xs text-muted-foreground">HSN: {item.hsn_code}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amount Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Amount Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {invoice.discount_amount && Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between items-center p-2">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-red-600">-₹{Number(invoice.discount_amount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between items-center p-2">
              <span className="text-muted-foreground">Tax (GST)</span>
              <span className="font-medium">₹{taxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium">Total Amount</span>
              <span className="text-xl font-bold">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center p-2">
              <span className="text-muted-foreground">Paid</span>
              <span className="font-medium text-green-600">₹{totalPaid.toLocaleString('en-IN')}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              balanceDue > 0 ? 'bg-orange-50' : 'bg-green-50'
            }`}>
              <span className="font-medium">Balance Due</span>
              <span className={`text-xl font-bold ${balanceDue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                ₹{balanceDue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base">Payments ({paymentsList.length})</CardTitle>
              <CardDescription>Payment history for this invoice</CardDescription>
            </div>
            {balanceDue > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/payments/new?invoice_id=${invoiceId}&party_id=${invoice.party_id}`)}
              >
                Record Payment
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {paymentsList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payments recorded yet</p>
          ) : (
            <div className="space-y-3">
              {paymentsList.map((payment: any) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/payments/${payment.id}`)}
                >
                  <div>
                    <p className="font-medium">{payment.payment_mode || 'Payment'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.payment_date || payment.created_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      ₹{Number(payment.amount || 0).toLocaleString('en-IN')}
                    </p>
                    {payment.reference_number && (
                      <p className="text-xs text-muted-foreground">Ref: {payment.reference_number}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* E-Invoice Section */}
      <EInvoiceSection invoiceId={invoiceId} invoice={invoice} />

      {/* E-Way Bill Section */}
      <EWayBillSection invoiceId={invoiceId} invoice={invoice} />

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 pb-20 md:pb-6">
        <Button variant="outline" onClick={() => router.push('/invoices')}>
          Back to Invoices
        </Button>
        <div className="flex gap-2">
          {balanceDue > 0 && (
            <Button 
              onClick={() => router.push(`/payments/new?invoice_id=${invoiceId}&party_id=${invoice.party_id}`)}
            >
              <IndianRupee className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          )}
        </div>
      </div>

      <BottomNav />
    </AppLayout>
  );
}
