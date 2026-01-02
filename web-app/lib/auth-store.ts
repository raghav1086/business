import { create } from 'zustand';
import { tokenStorage } from './api-client';
import { extractUserFromToken, isTokenExpired } from './jwt-utils';

interface User {
  id: string;
  phone: string;
  is_superadmin?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isSuperadmin: boolean;
  businessId: string | null;
  businessName: string | null;
  setUser: (user: User) => void;
  setBusinessId: (businessId: string) => void;
  setBusiness: (businessId: string, businessName: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isSuperadmin: false,
  businessId: null,
  businessName: null,
  
  setUser: (user) => {
    tokenStorage.setUserId(user.id);
    set({ 
      user, 
      isAuthenticated: true,
      isSuperadmin: user.is_superadmin || false,
    });
  },
  
  setBusinessId: (businessId) => {
    tokenStorage.setBusinessId(businessId);
    set({ businessId });
  },
  
  setBusiness: (businessId, businessName) => {
    tokenStorage.setBusinessId(businessId);
    tokenStorage.setBusinessName(businessName);
    set({ businessId, businessName });
  },
  
  logout: () => {
    tokenStorage.clearAll();
    set({ 
      user: null, 
      isAuthenticated: false, 
      isSuperadmin: false,
      businessId: null, 
      businessName: null 
    });
  },
  
  initialize: () => {
    const userId = tokenStorage.getUserId();
    const businessId = tokenStorage.getBusinessId();
    const businessName = tokenStorage.getBusinessName();
    const accessToken = tokenStorage.getAccessToken();
    
    if (userId && accessToken) {
      // Check if token is expired
      if (isTokenExpired(accessToken)) {
        console.warn('[Auth Store] Token expired, clearing auth state');
        tokenStorage.clearAll();
        set({
          user: null,
          isAuthenticated: false,
          isSuperadmin: false,
          businessId: null,
          businessName: null,
        });
        return;
      }

      // Extract user info from token (including is_superadmin)
      const userInfo = extractUserFromToken(accessToken);
      const isSuperadmin = userInfo?.is_superadmin || false;
      
      set({
        user: { 
          id: userId, 
          phone: userInfo?.phone || '', 
          is_superadmin: isSuperadmin 
        },
        isAuthenticated: true,
        isSuperadmin: isSuperadmin,
        businessId: businessId || null,
        businessName: businessName || null,
      });
    }
  },
}));
