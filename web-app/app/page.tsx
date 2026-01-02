'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isSuperadmin, businessId } = useAuthStore();

  useEffect(() => {
    // Small delay to allow auth store to initialize
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (isSuperadmin) {
        router.push('/admin');
      } else if (!businessId) {
        router.push('/business/select');
      } else {
        router.push('/dashboard');
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isSuperadmin, businessId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
