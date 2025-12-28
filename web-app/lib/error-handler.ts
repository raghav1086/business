/**
 * Centralized Error Handler
 * 
 * Provides comprehensive error handling for the application including:
 * - Error categorization and parsing
 * - User-friendly error messages
 * - Retry logic with exponential backoff
 * - Error reporting and metrics
 * - Network status detection
 */

import { AxiosError } from 'axios';

// Error Categories
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

// Error Severity Levels
export enum ErrorSeverity {
  LOW = 'low',       // Info/warning - can be auto-dismissed
  MEDIUM = 'medium', // Error - needs user attention
  HIGH = 'high',     // Critical - needs immediate action
  CRITICAL = 'critical', // System failure - may need page reload
}

// Structured Error Response
export interface ApiErrorResponse {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  userMessage: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  retryAfter?: number; // milliseconds
  originalError?: Error;
  timestamp: string;
  requestId?: string;
}

// Validation Error Details
export interface ValidationErrorDetails {
  field: string;
  message: string;
  code?: string;
}

// Error Messages Map
const ERROR_MESSAGES: Record<number, { title: string; message: string; category: ErrorCategory }> = {
  400: {
    title: 'Invalid Request',
    message: 'The request contains invalid data. Please check your input.',
    category: ErrorCategory.VALIDATION,
  },
  401: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again.',
    category: ErrorCategory.AUTHENTICATION,
  },
  403: {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    category: ErrorCategory.AUTHORIZATION,
  },
  404: {
    title: 'Not Found',
    message: 'The requested resource could not be found.',
    category: ErrorCategory.NOT_FOUND,
  },
  408: {
    title: 'Request Timeout',
    message: 'The request took too long. Please try again.',
    category: ErrorCategory.TIMEOUT,
  },
  422: {
    title: 'Validation Error',
    message: 'The submitted data is invalid. Please review and correct.',
    category: ErrorCategory.VALIDATION,
  },
  429: {
    title: 'Too Many Requests',
    message: 'You\'ve made too many requests. Please wait a moment.',
    category: ErrorCategory.RATE_LIMIT,
  },
  500: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    category: ErrorCategory.SERVER,
  },
  502: {
    title: 'Bad Gateway',
    message: 'Service temporarily unavailable. Please try again.',
    category: ErrorCategory.SERVER,
  },
  503: {
    title: 'Service Unavailable',
    message: 'The service is temporarily unavailable. Please try again later.',
    category: ErrorCategory.SERVER,
  },
  504: {
    title: 'Gateway Timeout',
    message: 'The server took too long to respond. Please try again.',
    category: ErrorCategory.TIMEOUT,
  },
};

// Network Error Codes
const NETWORK_ERROR_CODES = ['ERR_NETWORK', 'ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'];

// Retryable Status Codes
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Parse error response from API
 */
export function parseApiError(error: unknown): ApiErrorResponse {
  const timestamp = new Date().toISOString();
  
  // Default error response
  const defaultError: ApiErrorResponse = {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    userMessage: 'Something went wrong. Please try again.',
    retryable: false,
    timestamp,
  };

  // Handle Axios errors
  if (isAxiosError(error)) {
    return parseAxiosError(error, timestamp);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      ...defaultError,
      code: error.name,
      message: error.message,
      userMessage: error.message || defaultError.userMessage,
      originalError: error,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      ...defaultError,
      message: error,
      userMessage: error,
    };
  }

  return defaultError;
}

/**
 * Type guard for Axios errors
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError)?.isAxiosError === true;
}

/**
 * Parse Axios-specific errors
 */
function parseAxiosError(error: AxiosError, timestamp: string): ApiErrorResponse {
  const status = error.response?.status;
  const responseData = error.response?.data as Record<string, unknown> | undefined;
  const errorCode = error.code || 'UNKNOWN';

  // Check for network errors first
  if (!error.response && (NETWORK_ERROR_CODES.includes(errorCode) || error.message === 'Network Error')) {
    return {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      code: errorCode,
      message: error.message,
      userMessage: 'Unable to connect. Please check your internet connection.',
      retryable: true,
      retryAfter: 1000,
      originalError: error,
      timestamp,
    };
  }

  // Check for timeout
  if (errorCode === 'ECONNABORTED' || error.message.includes('timeout')) {
    return {
      category: ErrorCategory.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      code: 'TIMEOUT',
      message: error.message,
      userMessage: 'The request took too long. Please try again.',
      retryable: true,
      retryAfter: 2000,
      originalError: error,
      timestamp,
    };
  }

  // Handle HTTP status-based errors
  if (status) {
    const errorInfo = ERROR_MESSAGES[status] || {
      title: 'Error',
      message: 'An error occurred',
      category: ErrorCategory.UNKNOWN,
    };

    const extractedMessage = extractErrorMessage(responseData);
    const validationDetails = extractValidationErrors(responseData);

    return {
      category: errorInfo.category,
      severity: getSeverityFromStatus(status),
      code: `HTTP_${status}`,
      message: extractedMessage || error.message,
      userMessage: extractedMessage || errorInfo.message,
      details: validationDetails ? { validationErrors: validationDetails } : undefined,
      retryable: RETRYABLE_STATUS_CODES.includes(status),
      retryAfter: status === 429 ? extractRetryAfter(error) : undefined,
      originalError: error,
      timestamp,
      requestId: (error.config as unknown as Record<string, unknown>)?.__requestId as string,
    };
  }

  return {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    code: errorCode,
    message: error.message,
    userMessage: error.message || 'An unexpected error occurred',
    retryable: false,
    originalError: error,
    timestamp,
  };
}

/**
 * Extract error message from various response formats
 */
function extractErrorMessage(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;

  // Standard formats
  if (typeof data.message === 'string') return data.message;
  
  // Array of messages (NestJS validation errors)
  if (Array.isArray(data.message)) {
    return data.message.join('. ');
  }

  // Nested error object
  if (data.error && typeof data.error === 'object') {
    const error = data.error as Record<string, unknown>;
    if (typeof error.message === 'string') return error.message;
    if (Array.isArray(error.message)) return error.message.join('. ');
  }

  // errors array (common in REST APIs)
  if (Array.isArray(data.errors)) {
    return data.errors.map((e: { message?: string }) => e.message || String(e)).join('. ');
  }

  return null;
}

/**
 * Extract validation errors from response
 */
function extractValidationErrors(data: Record<string, unknown> | undefined): ValidationErrorDetails[] | null {
  if (!data) return null;

  const errors: ValidationErrorDetails[] = [];

  // NestJS validation format (array of strings)
  if (Array.isArray(data.message)) {
    data.message.forEach((msg: string) => {
      // Parse NestJS validation messages like "property field should not exist"
      const match = msg.match(/^(?:property\s+)?(\w+)\s+(.+)$/);
      if (match) {
        errors.push({
          field: match[1],
          message: match[2],
        });
      } else {
        errors.push({
          field: 'unknown',
          message: msg,
        });
      }
    });
  }

  // Standard errors array
  if (Array.isArray(data.errors)) {
    data.errors.forEach((error: { field?: string; message?: string; path?: string }) => {
      errors.push({
        field: error.field || error.path || 'unknown',
        message: error.message || 'Invalid value',
      });
    });
  }

  return errors.length > 0 ? errors : null;
}

/**
 * Get error severity based on HTTP status
 */
function getSeverityFromStatus(status: number): ErrorSeverity {
  if (status >= 500) return ErrorSeverity.HIGH;
  if (status === 401 || status === 403) return ErrorSeverity.HIGH;
  if (status === 429) return ErrorSeverity.MEDIUM;
  if (status >= 400) return ErrorSeverity.MEDIUM;
  return ErrorSeverity.LOW;
}

/**
 * Extract retry-after header from response
 */
function extractRetryAfter(error: AxiosError): number {
  const retryAfter = error.response?.headers?.['retry-after'];
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) return seconds * 1000;
  }
  return 5000; // Default 5 seconds
}

/**
 * Retry Configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition?: (error: ApiErrorResponse) => boolean;
  onRetry?: (attempt: number, error: ApiErrorResponse) => void;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryCondition: (error) => error.retryable,
};

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = config.baseDelay * Math.pow(2, attempt - 1);
  // Add jitter (±20%)
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.min(delay + jitter, config.maxDelay);
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for async operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: ApiErrorResponse | null = null;

  for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = parseApiError(error);
      
      const shouldRetry = 
        attempt <= finalConfig.maxRetries && 
        (finalConfig.retryCondition?.(lastError) ?? lastError.retryable);

      if (!shouldRetry) {
        throw error;
      }

      finalConfig.onRetry?.(attempt, lastError);
      
      const delay = lastError.retryAfter || calculateBackoffDelay(attempt, finalConfig);
      console.log(`[Error Handler] Retrying in ${delay}ms (attempt ${attempt}/${finalConfig.maxRetries})`);
      await sleep(delay);
    }
  }

  throw lastError?.originalError || new Error(lastError?.message || 'Max retries exceeded');
}

/**
 * Network Status Utilities
 */
export const networkStatus = {
  isOnline: (): boolean => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  },

  onStatusChange: (callback: (online: boolean) => void): (() => void) => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => callback(true);
      const handleOffline = () => callback(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    return () => {};
  },
};

/**
 * Error Metrics Tracking
 */
interface ErrorMetric {
  category: ErrorCategory;
  code: string;
  count: number;
  lastOccurred: string;
  endpoint?: string;
}

const errorMetrics: Map<string, ErrorMetric> = new Map();

export function trackError(error: ApiErrorResponse, endpoint?: string): void {
  const key = `${error.category}:${error.code}:${endpoint || 'unknown'}`;
  const existing = errorMetrics.get(key);

  if (existing) {
    existing.count++;
    existing.lastOccurred = error.timestamp;
  } else {
    errorMetrics.set(key, {
      category: error.category,
      code: error.code,
      count: 1,
      lastOccurred: error.timestamp,
      endpoint,
    });
  }
}

export function getErrorMetrics(): ErrorMetric[] {
  return Array.from(errorMetrics.values());
}

export function clearErrorMetrics(): void {
  errorMetrics.clear();
}

/**
 * User-Friendly Error Messages
 */
export function getUserFriendlyMessage(error: ApiErrorResponse): {
  title: string;
  description: string;
  actionLabel?: string;
  actionCallback?: () => void;
} {
  switch (error.category) {
    case ErrorCategory.AUTHENTICATION:
      return {
        title: 'Session Expired',
        description: 'Please log in again to continue.',
        actionLabel: 'Log In',
        actionCallback: () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        },
      };
    
    case ErrorCategory.AUTHORIZATION:
      return {
        title: 'Access Denied',
        description: 'You don\'t have permission to access this resource.',
      };
    
    case ErrorCategory.VALIDATION:
      const validationErrors = error.details?.validationErrors as ValidationErrorDetails[] | undefined;
      const fieldErrors = validationErrors?.map(e => `${e.field}: ${e.message}`).join('\n') || '';
      return {
        title: 'Invalid Input',
        description: fieldErrors || error.userMessage,
      };
    
    case ErrorCategory.NOT_FOUND:
      return {
        title: 'Not Found',
        description: 'The requested item could not be found.',
      };
    
    case ErrorCategory.RATE_LIMIT:
      return {
        title: 'Too Many Requests',
        description: 'Please wait a moment before trying again.',
      };
    
    case ErrorCategory.SERVER:
      return {
        title: 'Server Error',
        description: 'We\'re experiencing technical difficulties. Please try again later.',
        actionLabel: 'Try Again',
      };
    
    case ErrorCategory.NETWORK:
      return {
        title: 'Connection Lost',
        description: 'Please check your internet connection.',
        actionLabel: 'Retry',
      };
    
    case ErrorCategory.TIMEOUT:
      return {
        title: 'Request Timeout',
        description: 'The request took too long. Please try again.',
        actionLabel: 'Retry',
      };
    
    default:
      return {
        title: 'Error',
        description: error.userMessage,
      };
  }
}

/**
 * Error Handler Singleton
 */
class ErrorHandlerService {
  private globalErrorHandler?: (error: ApiErrorResponse) => void;
  private errorListeners: Set<(error: ApiErrorResponse) => void> = new Set();

  setGlobalHandler(handler: (error: ApiErrorResponse) => void): void {
    this.globalErrorHandler = handler;
  }

  addListener(listener: (error: ApiErrorResponse) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  handleError(error: unknown, endpoint?: string): ApiErrorResponse {
    const parsedError = parseApiError(error);
    trackError(parsedError, endpoint);

    // Notify global handler
    this.globalErrorHandler?.(parsedError);

    // Notify listeners
    this.errorListeners.forEach(listener => listener(parsedError));

    return parsedError;
  }
}

export const errorHandler = new ErrorHandlerService();

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as Window & { __errorHandler?: ErrorHandlerService }).errorHandler = errorHandler;
  (window as Window & { __getErrorMetrics?: typeof getErrorMetrics }).getErrorMetrics = getErrorMetrics;
}
