'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, QrCode, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { gstApi } from '@/lib/api-client';
import type { GenerateIRNRequest, GenerateIRNResponse, IRNStatusResponse, CancelIRNRequest } from '@/lib/types/gst';
import { toast } from 'sonner';

interface EInvoiceSectionProps {
  invoiceId: string;
  invoice?: {
    irn?: string;
    irn_date?: string;
    invoice_type?: string;
    total_amount?: number;
  };
}

export function EInvoiceSection({ invoiceId, invoice }: EInvoiceSectionProps) {
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Check IRN status
  const { data: irnStatus, isLoading: statusLoading } = useQuery<IRNStatusResponse>({
    queryKey: ['irn-status', invoiceId],
    queryFn: async () => {
      const response = await gstApi.get(`/gst/einvoice/status/${invoiceId}`);
      return response.data;
    },
    enabled: !!invoice?.irn,
    refetchInterval: invoice?.irn ? 5000 : false, // Poll every 5s if IRN exists
  });

  // Generate IRN mutation
  const generateMutation = useMutation({
    mutationFn: async (): Promise<GenerateIRNResponse> => {
      const request: GenerateIRNRequest = { invoice_id: invoiceId };
      const response = await gstApi.post<GenerateIRNResponse>('/gst/einvoice/generate', request);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('IRN generated successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['irn-status', invoiceId] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || error.message || 'Failed to generate IRN'
      );
    },
  });

  // Cancel IRN mutation
  const cancelMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!cancelReason.trim()) {
        throw new Error('Cancel reason is required');
      }
      const request: CancelIRNRequest = {
        invoice_id: invoiceId,
        cancel_reason: cancelReason.trim(),
      };
      await gstApi.post('/gst/einvoice/cancel', request);
    },
    onSuccess: () => {
      toast.success('IRN cancelled successfully');
      setCancelDialogOpen(false);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['irn-status', invoiceId] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || error.message || 'Failed to cancel IRN'
      );
    },
  });

  const irn = invoice?.irn || irnStatus?.irn;
  const irnDate = invoice?.irn_date || irnStatus?.irn_date;
  const status = irnStatus?.status || (irn ? 'generated' : null);
  const isSaleInvoice = invoice?.invoice_type === 'sale';

  // Only show for sale invoices
  if (!isSaleInvoice) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5" />
              E-Invoice (IRN)
            </CardTitle>
            <CardDescription>Generate Invoice Reference Number for GST compliance</CardDescription>
          </div>
          {status && (
            <Badge
              variant={
                status === 'generated' ? 'default' : status === 'cancelled' ? 'destructive' : 'secondary'
              }
            >
              {status.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!irn ? (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">
                E-Invoice is mandatory for businesses with turnover above ₹5 Crores
              </p>
              <p className="text-sm text-muted-foreground">
                Generate IRN to comply with GST E-Invoice requirements
              </p>
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="w-full"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating IRN...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate IRN
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">IRN</span>
                <span className="font-mono text-sm font-medium">{irn}</span>
              </div>
              {irnDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Generated Date</span>
                  <span className="text-sm font-medium">
                    {new Date(irnDate).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {status && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="flex items-center gap-2">
                    {status === 'generated' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {status === 'cancelled' && <XCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-sm font-medium capitalize">{status}</span>
                  </div>
                </div>
              )}
            </div>

            {status === 'generated' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Copy IRN to clipboard
                    navigator.clipboard.writeText(irn);
                    toast.success('IRN copied to clipboard');
                  }}
                  className="flex-1"
                >
                  Copy IRN
                </Button>
                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      Cancel IRN
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel IRN</DialogTitle>
                      <DialogDescription>
                        Please provide a reason for cancelling this IRN. This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="cancel-reason">Cancel Reason *</Label>
                        <Textarea
                          id="cancel-reason"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Enter reason for cancellation..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCancelDialogOpen(false);
                          setCancelReason('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => cancelMutation.mutate()}
                        disabled={!cancelReason.trim() || cancelMutation.isPending}
                      >
                        {cancelMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          'Confirm Cancellation'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {statusLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking status...</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

