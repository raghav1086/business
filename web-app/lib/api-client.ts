import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// API Base URLs
export const API_URLS = {
  auth: process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3002/api/v1',
  business: process.env.NEXT_PUBLIC_BUSINESS_API_URL || 'http://localhost:3003/api/v1',
  party: process.env.NEXT_PUBLIC_PARTY_API_URL || 'http://localhost:3004/api/v1',
  inventory: process.env.NEXT_PUBLIC_INVENTORY_API_URL || 'http://localhost:3005/api/v1',
  invoice: process.env.NEXT_PUBLIC_INVOICE_API_URL || 'http://localhost:3006/api/v1',
  payment: process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://localhost:3007/api/v1',
};

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_ID_KEY = 'user_id';
const BUSINESS_ID_KEY = 'business_id';

// Token management
export const tokenStorage = {
  getAccessToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  },
  setAccessToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
  },
  getRefreshToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  },
  setRefreshToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  },
  getUserId: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(USER_ID_KEY);
    }
    return null;
  },
  setUserId: (userId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_ID_KEY, userId);
    }
  },
  getBusinessId: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(BUSINESS_ID_KEY);
    }
    return null;
  },
  setBusinessId: (businessId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(BUSINESS_ID_KEY, businessId);
    }
  },
  clearAll: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem(BUSINESS_ID_KEY);
    }
  },
};

// Create axios instances for each service
const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add business ID to headers if available
      const businessId = tokenStorage.getBusinessId();
      if (businessId) {
        config.headers['x-business-id'] = businessId;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 and we haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = tokenStorage.getRefreshToken();
          if (refreshToken) {
            const response = await axios.post(
              `${API_URLS.auth}/auth/refresh-token`,
              { refresh_token: refreshToken }
            );

            const { access_token } = response.data;
            tokenStorage.setAccessToken(access_token);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          tokenStorage.clearAll();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Export API clients for each service
export const authApi = createApiClient(API_URLS.auth);
export const businessApi = createApiClient(API_URLS.business);
export const partyApi = createApiClient(API_URLS.party);
export const inventoryApi = createApiClient(API_URLS.inventory);
export const invoiceApi = createApiClient(API_URLS.invoice);
export const paymentApi = createApiClient(API_URLS.payment);

// Default export for convenience
export default {
  auth: authApi,
  business: businessApi,
  party: partyApi,
  inventory: inventoryApi,
  invoice: invoiceApi,
  payment: paymentApi,
};
