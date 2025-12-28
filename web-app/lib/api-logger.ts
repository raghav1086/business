/**
 * API Logger - Expert Level Request/Response Logging
 * 
 * Provides comprehensive logging for all API requests and responses.
 * Logs are saved to files and console for debugging during testing.
 * 
 * Features:
 * - Request logging with method, URL, headers, body
 * - Response logging with status, headers, data
 * - Error logging with full error details and categorization
 * - Timestamp and request ID tracking
 * - Performance metrics (request duration)
 * - Log rotation and file management
 * - Error analytics and reporting
 */

import { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Error Categories for logging
type LogErrorCategory = 
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'not_found'
  | 'rate_limit'
  | 'server'
  | 'network'
  | 'timeout'
  | 'unknown';

// Log entry types
export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error';
  method: string;
  url: string;
  duration?: number;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  data?: unknown;
  error?: {
    message: string;
    code?: string;
    response?: unknown;
    category?: LogErrorCategory;
    retryable?: boolean;
    userMessage?: string;
  };
}

// Error Statistics
export interface ErrorStats {
  total: number;
  byCategory: Record<LogErrorCategory, number>;
  byStatus: Record<number, number>;
  byEndpoint: Record<string, number>;
  lastHour: number;
  errorRate: number;
}

// In-memory log storage (can be exported for viewing)
const logs: LogEntry[] = [];
const MAX_LOGS = 1000; // Keep last 1000 entries

// File logging configuration
// Check if we're in development mode (client-side)
// In Next.js, process.env.NODE_ENV is available in client code and replaced at build time
const ENABLE_FILE_LOGGING = typeof window !== 'undefined' && 
  (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost');
const LOG_BATCH_SIZE = 10; // Send logs in batches
const LOG_BATCH_DELAY = 2000; // Wait 2 seconds before sending batch
let logBatch: LogEntry[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Format headers for logging (hide sensitive data)
function formatHeaders(headers: Record<string, string> | undefined): Record<string, string> {
  if (!headers) return {};
  
  const formatted: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === 'authorization') {
      formatted[key] = value.substring(0, 20) + '...[REDACTED]';
    } else {
      formatted[key] = String(value);
    }
  }
  return formatted;
}

// Format data for logging (truncate large payloads)
function formatData(data: unknown, maxLength = 5000): unknown {
  if (!data) return null;
  
  try {
    const stringified = JSON.stringify(data);
    if (stringified.length > maxLength) {
      return {
        _truncated: true,
        _originalLength: stringified.length,
        preview: JSON.parse(stringified.substring(0, maxLength) + '...'),
      };
    }
    return data;
  } catch {
    return String(data).substring(0, maxLength);
  }
}

// Send logs to server for file writing (development only)
async function sendLogsToServer(entries: LogEntry[]): Promise<void> {
  if (!ENABLE_FILE_LOGGING || typeof window === 'undefined') {
    return;
  }

  try {
    // Send each log entry to the server
    for (const entry of entries) {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      }).catch((error) => {
        // Silently fail - don't interrupt the app if logging fails
        console.warn('[API Logger] Failed to write log to file:', error);
      });
    }
  } catch (error) {
    // Silently fail - don't interrupt the app if logging fails
    console.warn('[API Logger] Failed to send logs to server:', error);
  }
}

// Flush batched logs to server
function flushLogBatch(): void {
  if (logBatch.length === 0) return;
  
  const batchToSend = [...logBatch];
  logBatch = [];
  batchTimeout = null;
  
  sendLogsToServer(batchToSend);
}

// Add log entry
function addLog(entry: LogEntry): void {
  logs.push(entry);
  
  // Rotate logs if needed
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS);
  }
  
  // Add to batch for file logging (development only)
  if (ENABLE_FILE_LOGGING && typeof window !== 'undefined') {
    logBatch.push(entry);
    
    // Flush immediately for errors or if batch is full
    if (entry.type === 'error' || logBatch.length >= LOG_BATCH_SIZE) {
      if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
      }
      flushLogBatch();
    } else if (!batchTimeout) {
      // Schedule batch flush
      batchTimeout = setTimeout(flushLogBatch, LOG_BATCH_DELAY);
    }
  }
  
  // Console output with colors
  const timestamp = new Date(entry.timestamp).toLocaleTimeString();
  const prefix = `[API ${timestamp}]`;
  
  if (entry.type === 'request') {
    console.log(
      `%c${prefix} 📤 ${entry.method} ${entry.url}`,
      'color: #2196F3; font-weight: bold'
    );
    if (entry.data) {
      console.log('%c  Request Body:', 'color: #9E9E9E', entry.data);
    }
  } else if (entry.type === 'response') {
    const statusColor = entry.status && entry.status >= 400 ? '#F44336' : '#4CAF50';
    console.log(
      `%c${prefix} 📥 ${entry.method} ${entry.url} - ${entry.status} ${entry.statusText} (${entry.duration}ms)`,
      `color: ${statusColor}; font-weight: bold`
    );
    if (entry.data) {
      console.log('%c  Response Data:', 'color: #9E9E9E', entry.data);
    }
  } else if (entry.type === 'error') {
    console.log(
      `%c${prefix} ❌ ${entry.method} ${entry.url} - ERROR`,
      'color: #F44336; font-weight: bold'
    );
    console.error('%c  Error Details:', 'color: #F44336', entry.error);
  }
}

// Request tracking map (for measuring duration)
const requestTimestamps = new Map<string, number>();

/**
 * Attach API logger interceptors to an Axios instance
 */
export function attachLogger(client: AxiosInstance, serviceName: string): void {
  // Request interceptor
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const requestId = generateRequestId();
      const timestamp = new Date().toISOString();
      
      // Store timestamp for duration calculation
      requestTimestamps.set(requestId, Date.now());
      
      // Attach request ID to config for response matching
      (config as unknown as { __requestId?: string; __serviceName?: string }).__requestId = requestId;
      (config as unknown as { __requestId?: string; __serviceName?: string }).__serviceName = serviceName;
      
      const entry: LogEntry = {
        id: requestId,
        timestamp,
        type: 'request',
        method: config.method?.toUpperCase() || 'UNKNOWN',
        url: `[${serviceName}] ${config.baseURL}${config.url}`,
        headers: formatHeaders(config.headers as Record<string, string>),
        data: formatData(config.data),
      };
      
      addLog(entry);
      
      return config;
    },
    (error) => {
      console.error('[API Logger] Request setup error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const requestId = (response.config as unknown as { __requestId?: string })?.__requestId;
      const startTime = requestTimestamps.get(requestId);
      const duration = startTime ? Date.now() - startTime : 0;
      
      requestTimestamps.delete(requestId);
      
      const entry: LogEntry = {
        id: requestId || generateRequestId(),
        timestamp: new Date().toISOString(),
        type: 'response',
        method: response.config.method?.toUpperCase() || 'UNKNOWN',
        url: `[${serviceName}] ${response.config.baseURL}${response.config.url}`,
        duration,
        status: response.status,
        statusText: response.statusText,
        headers: formatHeaders(response.headers as Record<string, string>),
        data: formatData(response.data),
      };
      
      addLog(entry);
      
      return response;
    },
    (error: AxiosError) => {
      const requestId = (error.config as unknown as { __requestId?: string })?.__requestId;
      const startTime = requestTimestamps.get(requestId);
      const duration = startTime ? Date.now() - startTime : 0;
      
      requestTimestamps.delete(requestId);

      // Categorize the error
      const status = error.response?.status;
      const errorInfo = categorizeError(error);
      
      const entry: LogEntry = {
        id: requestId || generateRequestId(),
        timestamp: new Date().toISOString(),
        type: 'error',
        method: error.config?.method?.toUpperCase() || 'UNKNOWN',
        url: `[${serviceName}] ${error.config?.baseURL}${error.config?.url}`,
        duration,
        status: error.response?.status,
        statusText: error.response?.statusText,
        error: {
          message: error.message,
          code: error.code,
          response: formatData(error.response?.data),
          category: errorInfo.category,
          retryable: errorInfo.retryable,
          userMessage: errorInfo.userMessage,
        },
      };
      
      addLog(entry);
      
      // Track error statistics
      trackErrorStats(entry, serviceName);
      
      return Promise.reject(error);
    }
  );
}

/**
 * Get all logs
 */
export function getLogs(): LogEntry[] {
  return [...logs];
}

/**
 * Get logs as formatted string for file export
 */
export function getLogsAsString(): string {
  return logs.map(log => {
    const lines = [
      `[${log.timestamp}] ${log.type.toUpperCase()} - ${log.method} ${log.url}`,
    ];
    
    if (log.duration) {
      lines.push(`  Duration: ${log.duration}ms`);
    }
    if (log.status) {
      lines.push(`  Status: ${log.status} ${log.statusText}`);
    }
    if (log.data) {
      lines.push(`  Data: ${JSON.stringify(log.data, null, 2)}`);
    }
    if (log.error) {
      lines.push(`  Error: ${JSON.stringify(log.error, null, 2)}`);
    }
    
    return lines.join('\n');
  }).join('\n\n' + '='.repeat(80) + '\n\n');
}

/**
 * Clear all logs
 */
export function clearLogs(): void {
  logs.length = 0;
  logBatch = [];
  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }
  console.log('[API Logger] Logs cleared');
}

/**
 * Flush pending logs to file (development only)
 */
export function flushLogs(): void {
  if (ENABLE_FILE_LOGGING) {
    flushLogBatch();
  }
}

/**
 * Download logs as file (browser only)
 */
export function downloadLogs(): void {
  if (typeof window === 'undefined') return;
  
  const content = getLogsAsString();
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `api-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
  a.click();
  
  URL.revokeObjectURL(url);
  console.log('[API Logger] Logs downloaded');
}

/**
 * Get error logs only
 */
export function getErrorLogs(): LogEntry[] {
  return logs.filter(log => log.type === 'error' || (log.status && log.status >= 400));
}

/**
 * Get logs summary
 */
export function getLogsSummary(): {
  total: number;
  requests: number;
  responses: number;
  errors: number;
  avgDuration: number;
  errorRate: string;
} {
  const requests = logs.filter(l => l.type === 'request').length;
  const responses = logs.filter(l => l.type === 'response').length;
  const errors = logs.filter(l => l.type === 'error' || (l.status && l.status >= 400)).length;
  const durations = logs.filter(l => l.duration).map(l => l.duration!);
  const avgDuration = durations.length > 0 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) 
    : 0;
  
  return {
    total: logs.length,
    requests,
    responses,
    errors,
    avgDuration,
    errorRate: responses > 0 ? `${((errors / responses) * 100).toFixed(2)}%` : '0%',
  };
}

// Error statistics tracking
const errorStats: Map<string, { count: number; lastSeen: string; category: LogErrorCategory }> = new Map();

/**
 * Categorize error based on status code and error type
 */
function categorizeError(error: AxiosError): { 
  category: LogErrorCategory; 
  retryable: boolean; 
  userMessage: string 
} {
  const status = error.response?.status;
  const code = error.code;

  // Network errors
  if (!error.response && (code === 'ERR_NETWORK' || code === 'ECONNREFUSED' || error.message === 'Network Error')) {
    return { category: 'network', retryable: true, userMessage: 'Unable to connect to server' };
  }

  // Timeout
  if (code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return { category: 'timeout', retryable: true, userMessage: 'Request timed out' };
  }

  // HTTP status based
  if (status) {
    switch (status) {
      case 401:
        return { category: 'authentication', retryable: false, userMessage: 'Session expired' };
      case 403:
        return { category: 'authorization', retryable: false, userMessage: 'Access denied' };
      case 400:
      case 422:
        return { category: 'validation', retryable: false, userMessage: 'Invalid request data' };
      case 404:
        return { category: 'not_found', retryable: false, userMessage: 'Resource not found' };
      case 429:
        return { category: 'rate_limit', retryable: true, userMessage: 'Too many requests' };
      case 500:
      case 502:
      case 503:
      case 504:
        return { category: 'server', retryable: true, userMessage: 'Server error' };
    }
  }

  return { category: 'unknown', retryable: false, userMessage: 'An error occurred' };
}

/**
 * Track error statistics
 */
function trackErrorStats(entry: LogEntry, serviceName: string): void {
  if (!entry.error?.category) return;

  const endpoint = `${entry.method} ${entry.url}`;
  const key = `${entry.error.category}:${entry.status || 0}:${endpoint}`;
  
  const existing = errorStats.get(key);
  if (existing) {
    existing.count++;
    existing.lastSeen = entry.timestamp;
  } else {
    errorStats.set(key, {
      count: 1,
      lastSeen: entry.timestamp,
      category: entry.error.category,
    });
  }
}

/**
 * Get detailed error statistics
 */
export function getErrorStats(): ErrorStats {
  const errorLogs = getErrorLogs();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const stats: ErrorStats = {
    total: errorLogs.length,
    byCategory: {
      authentication: 0,
      authorization: 0,
      validation: 0,
      not_found: 0,
      rate_limit: 0,
      server: 0,
      network: 0,
      timeout: 0,
      unknown: 0,
    },
    byStatus: {},
    byEndpoint: {},
    lastHour: 0,
    errorRate: 0,
  };

  errorLogs.forEach(log => {
    // By category
    if (log.error?.category) {
      stats.byCategory[log.error.category]++;
    }

    // By status
    if (log.status) {
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
    }

    // By endpoint
    const endpoint = `${log.method} ${log.url}`;
    stats.byEndpoint[endpoint] = (stats.byEndpoint[endpoint] || 0) + 1;

    // Last hour
    if (log.timestamp > oneHourAgo) {
      stats.lastHour++;
    }
  });

  // Calculate error rate
  const totalResponses = logs.filter(l => l.type === 'response' || l.type === 'error').length;
  stats.errorRate = totalResponses > 0 ? (stats.total / totalResponses) * 100 : 0;

  return stats;
}

/**
 * Get most frequent errors
 */
export function getMostFrequentErrors(limit = 10): Array<{ endpoint: string; count: number; category: LogErrorCategory }> {
  const errors = Array.from(errorStats.entries())
    .map(([key, value]) => ({
      endpoint: key.split(':').slice(2).join(':'),
      count: value.count,
      category: value.category,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  
  return errors;
}

/**
 * Clear error statistics
 */
export function clearErrorStats(): void {
  errorStats.clear();
}

// Flush logs before page unload (development only)
if (typeof window !== 'undefined' && ENABLE_FILE_LOGGING) {
  window.addEventListener('beforeunload', () => {
    flushLogBatch();
  });
}

// Export for global access in browser console
if (typeof window !== 'undefined') {
  (window as any).__apiLogs = {
    getLogs,
    getLogsAsString,
    clearLogs,
    downloadLogs,
    getErrorLogs,
    getLogsSummary,
    flushLogs,
  };
  console.log('[API Logger] Available in console via window.__apiLogs');
  if (ENABLE_FILE_LOGGING) {
    console.log('[API Logger] File logging enabled - logs saved to logs/api-requests.log');
  }
}
