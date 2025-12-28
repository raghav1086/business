'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout, BottomNav } from '@/components/layout';
import { PageHeader } from '@/components/ui/page-header';
import { CardSkeleton, ListItemSkeleton } from '@/components/ui/skeleton';
import { partyApi, invoiceApi, paymentApi } from '@/lib/api-client';
import { validateUrlUUID } from '@/lib/validation';
import { useAuthStore } from '@/lib/auth-store';

export default function PartyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { businessId } = useAuthStore();
  const partyId = validateUrlUUID(params.id, 'Party ID');

  // Redirect if business not selected
  useEffect(() => {
    if (!businessId) {
      router.push('/business/select');
    }
  }, [businessId, router]);

  // Fetch party details
  const { data: party, isLoading: partyLoading } = useQuery({
    queryKey: ['party', partyId, businessId],
    queryFn: async () => {
      if (!partyId) throw new Error('Invalid party ID');
      const response = await partyApi.get(`/parties/${partyId}`);
      return response.data?.data || response.data;
    },
    enabled: !!partyId && !!businessId,
  });

  // Fetch party's invoices
  const { data: invoices } = useQuery({
    queryKey: ['party-invoices', partyId, businessId],
    queryFn: async () => {
      if (!partyId) return [];
      const response = await invoiceApi.get(`/invoices?partyId=${partyId}`);
      // Backend returns { invoices: [...], total, page, limit }
      return response.data?.invoices || (Array.isArray(response.data) ? response.data : (response.data?.data || []));
    },
    enabled: !!partyId && !!businessId,
  });

  // Fetch party's payments
  const { data: payments } = useQuery({
    queryKey: ['party-payments', partyId, businessId],
    queryFn: async () => {
      if (!partyId) return [];
      const response = await paymentApi.get(`/payments?partyId=${partyId}`);
      return Array.isArray(response.data) ? response.data : (response.data?.payments || response.data?.data || []);
    },
    enabled: !!partyId && !!businessId,
  });

  const invoicesList = Array.isArray(invoices) ? invoices : [];
  const paymentsList = Array.isArray(payments) ? payments : [];

  // Calculate statistics
  const totalInvoiced = invoicesList.reduce((sum, inv: any) => sum + Number(inv.total_amount || 0), 0);
  const totalPaid = paymentsList.reduce((sum, pay: any) => sum + Number(pay.amount || 0), 0);
  const balance = totalInvoiced - totalPaid;

  if (partyLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
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

  if (!party) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Party not found</p>
          <Button onClick={() => router.push('/parties')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Parties
          </Button>
        </div>
        <BottomNav />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title={party.name || party.party_name}
        description={`${party.type || party.party_type || 'Party'} Details`}
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" onClick={() => router.push(`/parties/${partyId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </PageHeader>

      {/* Party Badge */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{party.name || party.party_name}</h2>
          <Badge variant={
            (party.type || party.party_type) === 'customer' ? 'success' : 
            (party.type || party.party_type) === 'supplier' ? 'warning' : 'info'
          }>
            {(party.type || party.party_type || 'party').toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Total Invoiced</div>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ₹{totalInvoiced.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Total Paid</div>
              <TrendingDown className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Balance</div>
              <IndianRupee className="h-4 w-4 text-orange-600" />
            </div>
            <div className={`text-2xl font-bold ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              ₹{Math.abs(balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {balance > 0 ? 'To Receive' : balance < 0 ? 'To Pay' : 'Settled'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Invoices</div>
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {invoicesList.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {party.gstin && (
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">GSTIN</p>
                  <p className="font-medium">{party.gstin}</p>
                </div>
              </div>
            )}
            {(party.phone || party.mobile) && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{party.phone || party.mobile}</p>
                </div>
              </div>
            )}
            {party.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{party.email}</p>
                </div>
              </div>
            )}
            {(party.address || party.city || party.state) && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {[party.address, party.city, party.state, party.pincode].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}
            {!party.gstin && !party.phone && !party.mobile && !party.email && !party.address && (
              <p className="text-sm text-muted-foreground">No contact information available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm">Opening Balance</span>
              <span className="font-medium">
                ₹{Number(party.opening_balance || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm">Total Invoiced</span>
              <span className="font-medium text-blue-600">
                ₹{totalInvoiced.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm">Total Paid</span>
              <span className="font-medium text-green-600">
                ₹{totalPaid.toLocaleString('en-IN')}
              </span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-lg ${balance > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
              <span className="text-sm font-medium">Current Balance</span>
              <span className={`font-bold ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                ₹{Math.abs(balance).toLocaleString('en-IN')}
                <span className="text-xs font-normal ml-1">
                  {balance > 0 ? '(Receivable)' : balance < 0 ? '(Payable)' : ''}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base">Recent Invoices</CardTitle>
              <CardDescription>{invoicesList.length} invoices found</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/invoices/new?party_id=${partyId}`)}>
              Create Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {invoicesList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No invoices yet</p>
          ) : (
            <div className="space-y-3">
              {invoicesList.slice(0, 5).map((invoice: any) => (
                <div 
                  key={invoice.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/invoices/${invoice.id}`)}
                >
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(invoice.invoice_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{Number(invoice.total_amount || 0).toLocaleString('en-IN')}</p>
                    <Badge variant={invoice.status === 'paid' ? 'success' : 'secondary'} className="text-xs">
                      {invoice.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card className="mb-20 md:mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base">Recent Payments</CardTitle>
              <CardDescription>{paymentsList.length} payments found</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/payments/new?party_id=${partyId}`)}>
              Record Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentsList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payments yet</p>
          ) : (
            <div className="space-y-3">
              {paymentsList.slice(0, 5).map((payment: any) => (
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
                    <p className="font-bold text-green-600">₹{Number(payment.amount || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BottomNav />
    </AppLayout>
  );
}
