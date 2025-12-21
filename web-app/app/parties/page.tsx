'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/lib/auth-store';
import { partyApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, Users } from 'lucide-react';

// Party form validation schema
const partySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['customer', 'supplier', 'both']),
  gstin: z.string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
    .optional()
    .or(z.literal('')),
  pan: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string()
    .regex(/^[6-9]\d{9}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  billing_address_line1: z.string().min(5, 'Billing address is required'),
  billing_address_line2: z.string().optional(),
  billing_city: z.string().min(2, 'City is required'),
  billing_state: z.string().min(2, 'State is required'),
  billing_pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  shipping_address_line1: z.string().optional(),
  shipping_address_line2: z.string().optional(),
  shipping_city: z.string().optional(),
  shipping_state: z.string().optional(),
  shipping_pincode: z.string().optional(),
  credit_limit: z.string().optional(),
  credit_days: z.string().optional(),
});

type PartyFormValues = z.infer<typeof partySchema>;

interface Party {
  id: string;
  name: string;
  type: string;
  gstin?: string;
  phone?: string;
  email?: string;
  billing_city: string;
  billing_state: string;
  balance: number;
}

export default function PartiesPage() {
  const router = useRouter();
  const { isAuthenticated, businessId } = useAuthStore();
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const form = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      name: '',
      type: 'customer',
      gstin: '',
      pan: '',
      email: '',
      phone: '',
      billing_address_line1: '',
      billing_address_line2: '',
      billing_city: '',
      billing_state: '',
      billing_pincode: '',
      credit_limit: '',
      credit_days: '',
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !businessId) {
      router.push('/');
    } else {
      fetchParties();
    }
  }, [isAuthenticated, businessId, router]);

  const fetchParties = async () => {
    try {
      const response = await partyApi.get('/parties');
      setParties(response.data);
    } catch (error: any) {
      toast.error('Failed to load parties', {
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: PartyFormValues) => {
    setIsSubmitting(true);
    try {
      // Convert credit_limit and credit_days to numbers
      const payload = {
        ...data,
        credit_limit: data.credit_limit ? parseFloat(data.credit_limit) : undefined,
        credit_days: data.credit_days ? parseInt(data.credit_days) : undefined,
      };

      await partyApi.post('/parties', payload);
      toast.success('Party created successfully');
      setIsDialogOpen(false);
      form.reset();
      fetchParties();
    } catch (error: any) {
      toast.error('Failed to create party', {
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredParties = parties.filter((party) => {
    const matchesSearch = party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      party.phone?.includes(searchQuery) ||
      party.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || party.type === filterType;
    
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading parties...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Parties</h1>
                <p className="text-sm text-gray-600 mt-1">Manage customers and suppliers</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Party
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Party</DialogTitle>
                  <DialogDescription>
                    Enter party details. Customer or Supplier information.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Party Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="supplier">Supplier</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
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
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="9876543210" {...field} maxLength={10} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="gstin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GSTIN</FormLabel>
                            <FormControl>
                              <Input placeholder="29ABCDE1234F1Z5" {...field} maxLength={15} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PAN</FormLabel>
                            <FormControl>
                              <Input placeholder="ABCDE1234F" {...field} maxLength={10} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Billing Address</h3>
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="billing_address_line1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 1 *</FormLabel>
                              <FormControl>
                                <Input placeholder="Street address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="billing_address_line2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 2</FormLabel>
                              <FormControl>
                                <Input placeholder="Landmark" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="billing_city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City *</FormLabel>
                                <FormControl>
                                  <Input placeholder="City" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="billing_state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State *</FormLabel>
                                <FormControl>
                                  <Input placeholder="State" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="billing_pincode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pincode *</FormLabel>
                                <FormControl>
                                  <Input placeholder="400001" {...field} maxLength={6} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Credit Terms</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="credit_limit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Credit Limit (₹)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="50000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="credit_days"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Credit Days</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="30" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

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
                        {isSubmitting ? 'Creating...' : 'Create Party'}
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
        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search parties by name, phone, or email..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="supplier">Suppliers</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Parties List */}
        {filteredParties.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {parties.length === 0 ? 'No parties yet' : 'No matching parties'}
              </h2>
              <p className="text-gray-600 mb-6">
                {parties.length === 0
                  ? 'Create your first party to get started'
                  : 'Try adjusting your search or filter'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParties.map((party) => (
              <Card key={party.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{party.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      party.type === 'customer' ? 'bg-blue-100 text-blue-800' :
                      party.type === 'supplier' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {party.type.toUpperCase()}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {party.billing_city}, {party.billing_state}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {party.phone && (
                    <p className="text-sm text-gray-600 mb-1">📞 {party.phone}</p>
                  )}
                  {party.email && (
                    <p className="text-sm text-gray-600 mb-1">✉️ {party.email}</p>
                  )}
                  {party.gstin && (
                    <p className="text-sm text-gray-600 mb-2">GSTIN: {party.gstin}</p>
                  )}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium">
                      Balance: <span className={party.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹ {party.balance.toFixed(2)}
                      </span>
                    </p>
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
