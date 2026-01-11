'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Truck, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
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
import type {
  GenerateEWayBillRequest,
  GenerateEWayBillResponse,
  EWayBillStatusResponse,
  CancelEWayBillRequest,
  UpdateEWayBillRequest,
} from '@/lib/types/gst';
import { toast } from 'sonner';

interface EWayBillSectionProps {
  invoiceId: string;
  invoice?: {
    eway_bill_number?: string;
    eway_bill_date?: string;
    invoice_type?: string;
    total_amount?: number;
    is_interstate?: boolean;
  };
}

export function EWayBillSection({ invoiceId, invoice }: EWayBillSectionProps) {
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [updateReason, setUpdateReason] = useState('');

  // Check E-Way Bill status
  const { data: ewayBillStatus, isLoading: statusLoading } = useQuery<EWayBillStatusResponse>({
    queryKey: ['ewaybill-status', invoiceId],
    queryFn: async () => {
      const response = await gstApi.get(`/gst/ewaybill/status/${invoiceId}`);
      return response.data;
    },
    enabled: !!invoice?.eway_bill_number,
    refetchInterval: invoice?.eway_bill_number ? 10000 : false, // Poll every 10s if E-Way Bill exists
  });

  // Generate E-Way Bill mutation
  const generateMutation = useMutation({
    mutationFn: async (): Promise<GenerateEWayBillResponse> => {
      const request: GenerateEWayBillRequest = { invoice_id: invoiceId };
      const response = await gstApi.post<GenerateEWayBillResponse>('/gst/ewaybill/generate', request);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('E-Way Bill generated successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['ewaybill-status', invoiceId] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || error.message || 'Failed to generate E-Way Bill'
      );
    },
  });

  // Cancel E-Way Bill mutation
  const cancelMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!cancelReason.trim()) {
        throw new Error('Cancel reason is required');
      }
      const request: CancelEWayBillRequest = {
        invoice_id: invoiceId,
        cancel_reason: cancelReason.trim(),
      };
      await gstApi.post('/gst/ewaybill/cancel', request);
    },
    onSuccess: () => {
      toast.success('E-Way Bill cancelled successfully');
      setCancelDialogOpen(false);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['ewaybill-status', invoiceId] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || error.message || 'Failed to cancel E-Way Bill'
      );
    },
  });

  // Update E-Way Bill mutation
  const updateMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!updateReason.trim()) {
        throw new Error('Update reason is required');
      }
      const request: UpdateEWayBillRequest = {
        invoice_id: invoiceId,
        update_reason: updateReason.trim(),
      };
      await gstApi.post('/gst/ewaybill/update', request);
    },
    onSuccess: () => {
      toast.success('E-Way Bill updated successfully');
      setUpdateDialogOpen(false);
      setUpdateReason('');
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['ewaybill-status', invoiceId] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || error.message || 'Failed to update E-Way Bill'
      );
    },
  });

  const ewayBillNumber = invoice?.eway_bill_number || ewayBillStatus?.eway_bill_number;
  const ewayBillDate = invoice?.eway_bill_date || ewayBillStatus?.eway_bill_date;
  const validityDate = ewayBillStatus?.validity_date;
  const status = ewayBillStatus?.status || (ewayBillNumber ? 'generated' : null);
  const isSaleInvoice = invoice?.invoice_type === 'sale';
  const invoiceValue = invoice?.total_amount || 0;
  const requiresEWayBill = invoiceValue >= 50000 || invoice?.is_interstate;

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
              <Truck className="h-5 w-5" />
              E-Way Bill
            </CardTitle>
            <CardDescription>
              Generate E-Way Bill for goods transportation (required for invoices ≥ ₹50,000 or inter-state)
            </CardDescription>
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
        {!ewayBillNumber ? (
          <div className="space-y-4">
            {requiresEWayBill ? (
              <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900 mb-1">
                      E-Way Bill Required
                    </p>
                    <p className="text-sm text-yellow-700">
                      {invoiceValue >= 50000
                        ? 'Invoice value is ₹50,000 or more'
                        : 'Inter-state movement detected'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  E-Way Bill is optional for invoices below ₹50,000 (intra-state)
                </p>
              </div>
            )}
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="w-full"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating E-Way Bill...
                </>
              ) : (
                <>
                  <Truck className="mr-2 h-4 w-4" />
                  Generate E-Way Bill
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">E-Way Bill Number</span>
                <span className="font-mono text-sm font-medium">{ewayBillNumber}</span>
              </div>
              {ewayBillDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Generated Date</span>
                  <span className="text-sm font-medium">
                    {new Date(ewayBillDate).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {validityDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valid Until</span>
                  <span className="text-sm font-medium">
                    {new Date(validityDate).toLocaleString('en-IN')}
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
                    navigator.clipboard.writeText(ewayBillNumber);
                    toast.success('E-Way Bill number copied to clipboard');
                  }}
                  className="flex-1"
                >
                  Copy Number
                </Button>
                <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update E-Way Bill</DialogTitle>
                      <DialogDescription>
                        Update E-Way Bill details (e.g., vehicle number, transporter details)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="update-reason">Update Reason *</Label>
                        <Textarea
                          id="update-reason"
                          value={updateReason}
                          onChange={(e) => setUpdateReason(e.target.value)}
                          placeholder="Enter reason for update..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUpdateDialogOpen(false);
                          setUpdateReason('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => updateMutation.mutate()}
                        disabled={!updateReason.trim() || updateMutation.isPending}
                      >
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update E-Way Bill'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      Cancel
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel E-Way Bill</DialogTitle>
                      <DialogDescription>
                        Please provide a reason for cancelling this E-Way Bill.
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

