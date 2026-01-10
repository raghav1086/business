'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Building2, User, Phone, Mail, MapPin, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout, BottomNav } from '@/components/layout';
import { PageHeader } from '@/components/ui/page-header';
import { FormSkeleton } from '@/components/ui/skeleton';
import { partyApi } from '@/lib/api-client';
import { toast } from 'sonner';

interface PartyFormData {
  name: string;
  type: 'customer' | 'supplier' | 'both';
  gstin: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  opening_balance: string;
  balance_type: 'receivable' | 'payable';
}

export default function EditPartyPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const partyId = params.id as string;

  const [formData, setFormData] = useState<PartyFormData>({
    name: '',
    type: 'customer',
    gstin: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    opening_balance: '0',
    balance_type: 'receivable',
  });

  const [errors, setErrors] = useState<Partial<PartyFormData>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch party details
  const { data: party, isLoading } = useQuery({
    queryKey: ['party', partyId],
    queryFn: async () => {
      const response = await partyApi.get(`/parties/${partyId}`);
      return response.data?.data || response.data;
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (party) {
      setFormData({
        name: party.name || party.party_name || '',
        type: party.type || party.party_type || 'customer',
        gstin: party.gstin || '',
        phone: party.phone || party.mobile || '',
        email: party.email || '',
        // Map backend billing fields to form fields
        address: party.billing_address_line1 || party.address || '',
        city: party.billing_city || party.city || '',
        state: party.billing_state || party.state || '',
        pincode: party.billing_pincode || party.pincode || '',
        opening_balance: String(party.opening_balance || 0),
        // Convert backend opening_balance_type to form balance_type
        balance_type: party.opening_balance_type === 'credit' ? 'payable' : 'receivable',
      });
    }
  }, [party]);

  /**
   * Updates an existing party
   * 
   * **Field Mappings:**
   * - `address` → `billing_address_line1`
   * - `city` → `billing_city`
   * - `state` → `billing_state`
   * - `pincode` → `billing_pincode`
   * - `balance_type: 'receivable'` → `opening_balance_type: 'debit'`
   * - `balance_type: 'payable'` → `opening_balance_type: 'credit'`
   * 
   * **Excluded Fields:**
   * - `business_id` - Added by backend from request context
   * 
   * **Business Logic:**
   * - Receivable (they owe you) = Debit balance (asset)
   * - Payable (you owe them) = Credit balance (liability)
   */
  const updatePartyMutation = useMutation({
    mutationFn: async (data: PartyFormData) => {
      // Build a clean payload with correct field names matching backend DTO
      const payload: any = {
        name: data.name,
        type: data.type,
      };

      // Only include optional fields if they have values (no empty strings)
      if (data.gstin) payload.gstin = data.gstin;
      if (data.phone) payload.phone = data.phone;
      if (data.email) payload.email = data.email;
      
      // Map address fields to billing_address fields
      if (data.address) payload.billing_address_line1 = data.address;
      if (data.city) payload.billing_city = data.city;
      if (data.state) payload.billing_state = data.state;
      if (data.pincode) payload.billing_pincode = data.pincode;
      
      // Map balance_type to opening_balance_type and convert values
      const balanceAmount = parseFloat(data.opening_balance) || 0;
      if (balanceAmount !== 0) {
        payload.opening_balance = balanceAmount;
        payload.opening_balance_type = data.balance_type === 'receivable' ? 'debit' : 'credit';
      }

      const response = await partyApi.patch(`/parties/${partyId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['party', partyId] });
      toast.success('Party updated successfully');
      router.push(`/parties/${partyId}`);
    },
    onError: (error: any) => {
      // Handle array of error messages from backend validation
      const errorMessage = Array.isArray(error.response?.data?.message) 
        ? error.response.data.message.join(', ')
        : error.response?.data?.message || 'Failed to update party';
      toast.error(errorMessage);
    },
  });

  const deletePartyMutation = useMutation({
    mutationFn: async () => {
      const response = await partyApi.delete(`/parties/${partyId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success('Party deleted successfully');
      router.push('/parties');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete party');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<PartyFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Party name is required';
    }

    if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
      newErrors.gstin = 'Invalid GSTIN format';
    }

    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Invalid pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      updatePartyMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof PartyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deletePartyMutation.mutate();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <PageHeader title="Edit Party" description="Loading..." />
        <Card>
          <CardContent className="p-6">
            <FormSkeleton />
          </CardContent>
        </Card>
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
        title="Edit Party"
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
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Update the party's basic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Party Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter party name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Party Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="gstin"
                  placeholder="22AAAAA0000A1Z5"
                  value={formData.gstin}
                  onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                  className={`pl-10 ${errors.gstin ? 'border-red-500' : ''}`}
                  maxLength={15}
                />
              </div>
              {errors.gstin && <p className="text-xs text-red-500">{errors.gstin}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>Phone, email and other contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                    className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                    maxLength={10}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="party@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
            <CardDescription>Party's business address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                placeholder="Enter street address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={formData.state} onValueChange={(value) => handleChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                    <SelectItem value="Delhi">Delhi</SelectItem>
                    <SelectItem value="Gujarat">Gujarat</SelectItem>
                    <SelectItem value="Karnataka">Karnataka</SelectItem>
                    <SelectItem value="Kerala">Kerala</SelectItem>
                    <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                    <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                    <SelectItem value="Punjab">Punjab</SelectItem>
                    <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                    <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                    <SelectItem value="Telangana">Telangana</SelectItem>
                    <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                    <SelectItem value="West Bengal">West Bengal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  placeholder="400001"
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, ''))}
                  className={errors.pincode ? 'border-red-500' : ''}
                  maxLength={6}
                />
                {errors.pincode && <p className="text-xs text-red-500">{errors.pincode}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opening Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Opening Balance
            </CardTitle>
            <CardDescription>Update the initial balance for this party</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="opening_balance">Amount (₹)</Label>
                <Input
                  id="opening_balance"
                  type="number"
                  placeholder="0.00"
                  value={formData.opening_balance}
                  onChange={(e) => handleChange('opening_balance', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="balance_type">Balance Type</Label>
                <Select value={formData.balance_type} onValueChange={(value) => handleChange('balance_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receivable">To Receive (They owe you)</SelectItem>
                    <SelectItem value="payable">To Pay (You owe them)</SelectItem>
                  </SelectContent>
                </Select>
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
                <p className="font-medium text-red-700">Delete this party</p>
                <p className="text-sm text-red-600">Once deleted, this action cannot be undone.</p>
              </div>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deletePartyMutation.isPending}
              >
                {showDeleteConfirm ? 'Confirm Delete' : 'Delete Party'}
              </Button>
            </div>
            {showDeleteConfirm && (
              <p className="text-sm text-red-600 mt-2">
                Click again to confirm deletion. This will also remove all associated data.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pb-20 md:pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={updatePartyMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updatePartyMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <BottomNav />
    </AppLayout>
  );
}
