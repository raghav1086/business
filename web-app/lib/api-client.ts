import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { attachLogger } from './api-logger';
import {
  parseApiError,
  withRetry,
  ErrorCategory,
  networkStatus,
  errorHandler,
  type ApiErrorResponse,
  type RetryConfig,
} from './error-handler';

// API Configuration
const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second base delay
};

// API Base URLs - Use relative URLs for production (via Nginx proxy)
// All services use '/api/v1' as base, pages add the service-specific path
// Auth: pages call authApi.post('/auth/send-otp') → '/api/v1/auth/send-otp'
// Others: pages call partyApi.get('/parties') → '/api/v1/parties'
export const API_URLS = {
  auth: process.env.NEXT_PUBLIC_AUTH_API_URL || '/api/v1',
  business: process.env.NEXT_PUBLIC_BUSINESS_API_URL || '/api/v1',
  party: process.env.NEXT_PUBLIC_PARTY_API_URL || '/api/v1',
  inventory: process.env.NEXT_PUBLIC_INVENTORY_API_URL || '/api/v1',
  invoice: process.env.NEXT_PUBLIC_INVOICE_API_URL || '/api/v1',
  payment: process.env.NEXT_PUBLIC_PAYMENT_API_URL || '/api/v1',
};

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_ID_KEY = 'user_id';
const BUSINESS_ID_KEY = 'business_id';
const BUSINESS_NAME_KEY = 'business_name';

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
  getBusinessName: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(BUSINESS_NAME_KEY);
    }
    return null;
  },
  setBusinessName: (businessName: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(BUSINESS_NAME_KEY, businessName);
    }
  },
  clearAll: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem(BUSINESS_ID_KEY);
      localStorage.removeItem(BUSINESS_NAME_KEY);
    }
  },
};

// Create axios instances for each service
const createApiClient = (baseURL: string, serviceName: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Attach API Logger first (to capture all requests/responses)
  attachLogger(client, serviceName);

  // Request interceptor - Add auth token and check network status
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Check network status before making request
      if (!networkStatus.isOnline()) {
        return Promise.reject(new Error('No network connection'));
      }

      const token = tokenStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add business ID to headers if available
      const businessId = tokenStorage.getBusinessId();
      const url = config.url || '';
      
      // Don't require business ID for:
      // - Auth endpoints
      // - Health checks
      // - Business listing/creation endpoints
      // - Admin/superadmin endpoints
      // - User admin endpoints
      const skipBusinessId = url.includes('/auth/') ||
                            url.includes('/health') ||
                            url.includes('/businesses') ||
                            url.includes('/admin/') ||
                            url.includes('/users/admin/');
      
      if (businessId && !skipBusinessId) {
        config.headers['x-business-id'] = businessId;
      } else if (!businessId && !skipBusinessId) {
        // Warn if business_id is required but missing (only for non-skipped endpoints)
        if (typeof window !== 'undefined') {
          console.warn(`[API Client] Business ID missing for request: ${config.method?.toUpperCase()} ${url}`);
        }
      }

      // Add request timestamp for tracking
      (config as InternalAxiosRequestConfig & { __requestTime?: number }).__requestTime = Date.now();
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle errors and token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { 
        _retry?: boolean; 
        _retryCount?: number;
        __requestTime?: number;
      };
      
      if (!originalRequest) {
        return Promise.reject(error);
      }

      // Parse the error for better handling
      const parsedError = parseApiError(error);
      const endpoint = `${originalRequest.method?.toUpperCase()} ${originalRequest.url}`;

      // Track the error
      errorHandler.handleError(error, endpoint);

      // Handle 400 - Business ID required (redirect to business selection)
      if (error.response?.status === 400) {
        const errorMessage = (error.response?.data as Record<string, unknown>)?.message as string || '';
        if (errorMessage.includes('Business ID is required')) {
          console.warn('[API Client] Business ID is required, redirecting to business selection');
          if (typeof window !== 'undefined') {
            // Only redirect if not already on business selection page or admin page
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/business/select') && !currentPath.includes('/admin')) {
              window.location.href = '/business/select';
            }
          }
          return Promise.reject(error);
        }
      }

      // Handle 401 - Token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = tokenStorage.getRefreshToken();
          if (refreshToken) {
            const response = await axios.post(
              `${API_URLS.auth}/auth/refresh-token`,
              { refresh_token: refreshToken },
              { timeout: 10000 }
            );

            const { access_token } = response.data;
            tokenStorage.setAccessToken(access_token);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          console.error('[API Client] Token refresh failed:', refreshError);
          tokenStorage.clearAll();
          if (typeof window !== 'undefined') {
            // Dispatch custom event for auth failure
            window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }

      // Handle retryable errors (5xx, network, timeout)
      if (parsedError.retryable && !originalRequest._retry) {
        const retryCount = originalRequest._retryCount || 0;
        
        if (retryCount < API_CONFIG.retryAttempts) {
          originalRequest._retryCount = retryCount + 1;
          
          // Calculate delay with exponential backoff
          const delay = parsedError.retryAfter || (API_CONFIG.retryDelay * Math.pow(2, retryCount));
          
          console.log(`[API Client] Retrying request (${retryCount + 1}/${API_CONFIG.retryAttempts}) after ${delay}ms`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return client(originalRequest);
        }
      }

      // Enhance error with user-friendly message
      const enhancedError = error as AxiosError & { 
        parsedError: ApiErrorResponse;
        userMessage: string;
      };
      enhancedError.parsedError = parsedError;
      enhancedError.userMessage = parsedError.userMessage;

      return Promise.reject(enhancedError);
    }
  );

  return client;
};

// Export API clients for each service
export const authApi = createApiClient(API_URLS.auth, 'auth');
export const businessApi = createApiClient(API_URLS.business, 'business');
export const partyApi = createApiClient(API_URLS.party, 'party');
export const inventoryApi = createApiClient(API_URLS.inventory, 'inventory');
export const invoiceApi = createApiClient(API_URLS.invoice, 'invoice');
export const paymentApi = createApiClient(API_URLS.payment, 'payment');

// Helper function to make requests with retry logic
export async function apiRequest<T>(
  request: () => Promise<T>,
  options?: Partial<RetryConfig>
): Promise<T> {
  return withRetry(request, options);
}

// Helper to extract error message from API response
export function getApiErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (!error) return fallback;
  
  const axiosError = error as AxiosError & { parsedError?: ApiErrorResponse; userMessage?: string };
  
  // Check for parsed error first
  if (axiosError.parsedError?.userMessage) {
    return axiosError.parsedError.userMessage;
  }
  
  // Check for userMessage
  if (axiosError.userMessage) {
    return axiosError.userMessage;
  }
  
  // Try to extract from response
  const responseData = axiosError.response?.data as Record<string, unknown> | undefined;
  
  if (responseData) {
    // Check various message formats
    if (typeof responseData.message === 'string') return responseData.message;
    if (Array.isArray(responseData.message)) return responseData.message.join('. ');
    
    if (responseData.error && typeof responseData.error === 'object') {
      const errorObj = responseData.error as Record<string, unknown>;
      if (typeof errorObj.message === 'string') return errorObj.message;
    }
  }
  
  // Fallback to error message
  if (axiosError.message) return axiosError.message;
  
  return fallback;
}

// Check if error is a specific type
export function isNetworkError(error: unknown): boolean {
  const parsedError = parseApiError(error);
  return parsedError.category === ErrorCategory.NETWORK;
}

export function isAuthError(error: unknown): boolean {
  const parsedError = parseApiError(error);
  return parsedError.category === ErrorCategory.AUTHENTICATION;
}

export function isValidationError(error: unknown): boolean {
  const parsedError = parseApiError(error);
  return parsedError.category === ErrorCategory.VALIDATION;
}

export function isServerError(error: unknown): boolean {
  const parsedError = parseApiError(error);
  return parsedError.category === ErrorCategory.SERVER;
}

// Default export for convenience
export default {
  auth: authApi,
  business: businessApi,
  party: partyApi,
  inventory: inventoryApi,
  invoice: invoiceApi,
  payment: paymentApi,
};

// Export error types and utilities
export { ErrorCategory, type ApiErrorResponse } from './error-handler';
