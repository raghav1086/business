'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { businessApi } from '@/lib/api-client';

export function Providers({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const { businessId, businessName, setBusiness } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from localStorage
    initialize();
  }, [initialize]);

  // Fetch business name if businessId is set but businessName is missing
  useEffect(() => {
    if (businessId && !businessName) {
      // Fetch business name from the list of businesses
      businessApi.get('/businesses')
        .then((response) => {
          const businesses = Array.isArray(response.data) 
            ? response.data 
            : (response.data?.data || []);
          const business = businesses.find((b: any) => b.id === businessId);
          if (business && business.name) {
            setBusiness(businessId, business.name);
          }
        })
        .catch((error) => {
          console.warn('[Providers] Failed to fetch business name:', error);
        });
    }
  }, [businessId, businessName, setBusiness]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
