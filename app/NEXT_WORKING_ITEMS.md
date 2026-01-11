# Next Working Items - Phase 1: Foundation Hardening

## Overview

This document outlines the immediate next working items to make the product more mature and production-ready. These are **critical** items that should be implemented first.

**Priority:** 🔴 CRITICAL  
**Timeline:** Weeks 1-2  
**Status:** Ready to Start

---

## 1. Error Handling & Resilience

### 1.1 Global Exception Filter Enhancement

**Current State:** Basic exception filter exists but needs improvement

**Files to Modify:**
- `app/libs/shared/validation/src/http-exception.filter.ts` (enhance)
- Create `app/libs/shared/validation/src/error-response.dto.ts` (new)

**Tasks:**

1. **Create Standardized Error Response DTO**
   ```typescript
   // app/libs/shared/validation/src/error-response.dto.ts
   export interface ErrorResponse {
     statusCode: number;
     timestamp: string;
     path: string;
     method: string;
     message: string | string[];
     error: string;
     correlationId?: string;
     stack?: string; // Only in development
   }
   ```

2. **Enhance Exception Filter**
   - Add correlation ID generation
   - Add structured logging
   - Add stack trace in development only
   - Handle all exception types (ValidationError, DatabaseError, etc.)
   - Add error categorization

3. **Update All Services**
   - Apply global exception filter in all services
   - Remove duplicate error handling code

**Success Criteria:**
- ✅ All errors return consistent format
- ✅ All errors include correlation ID
- ✅ Errors logged with full context
- ✅ Stack traces only in development

---

### 1.2 Structured Logging Implementation

**Current State:** Basic console.log statements

**Files to Create:**
- `app/libs/shared/logging/src/logger.service.ts` (new)
- `app/libs/shared/logging/src/logger.module.ts` (new)
- `app/libs/shared/logging/src/interfaces/log-entry.interface.ts` (new)

**Tasks:**

1. **Create Logger Service**
   ```typescript
   // app/libs/shared/logging/src/logger.service.ts
   @Injectable()
   export class LoggerService {
     private logger: winston.Logger;
     
     log(level: string, message: string, context?: any): void
     error(message: string, trace: string, context?: any): void
     warn(message: string, context?: any): void
     debug(message: string, context?: any): void
   }
   ```

2. **Implement Log Levels**
   - DEBUG: Development only
   - INFO: General information
   - WARN: Warning messages
   - ERROR: Error messages

3. **Add Request Correlation**
   - Generate correlation ID per request
   - Include in all logs
   - Pass through service calls

4. **Configure Log Output**
   - Console output (development)
   - File output (production)
   - JSON format for log aggregation

**Success Criteria:**
- ✅ All services use structured logger
- ✅ Logs are in JSON format
- ✅ Correlation IDs in all logs
- ✅ Log levels properly configured

---

### 1.3 Request Correlation Middleware

**Current State:** No request correlation

**Files to Create:**
- `app/libs/shared/logging/src/correlation.middleware.ts` (new)

**Tasks:**

1. **Create Correlation Middleware**
   - Generate UUID for each request
   - Add to request headers
   - Include in response headers
   - Pass to all service calls

2. **Update All Services**
   - Apply middleware globally
   - Use correlation ID in logs

**Success Criteria:**
- ✅ Every request has correlation ID
- ✅ Correlation ID in all logs
- ✅ Correlation ID in error responses

---

### 1.4 Retry Logic & Circuit Breaker

**Current State:** No retry or circuit breaker

**Files to Create:**
- `app/libs/shared/resilience/src/retry.service.ts` (new)
- `app/libs/shared/resilience/src/circuit-breaker.service.ts` (new)
- `app/libs/shared/resilience/src/resilience.module.ts` (new)

**Tasks:**

1. **Implement Retry Service**
   - Exponential backoff
   - Configurable retry count
   - Retry only on transient errors
   - Log retry attempts

2. **Implement Circuit Breaker**
   - Open/Closed/Half-Open states
   - Failure threshold
   - Timeout before retry
   - Fallback mechanism

3. **Apply to External Calls**
   - Database connections
   - Redis connections
   - HTTP calls to other services
   - Third-party API calls

**Success Criteria:**
- ✅ Retry logic works for transient failures
- ✅ Circuit breaker prevents cascading failures
- ✅ Fallback mechanisms in place
- ✅ All external calls protected

---

## 2. Logging & Observability

### 2.1 Distributed Tracing

**Current State:** No distributed tracing

**Files to Create:**
- `app/libs/shared/observability/src/tracing.service.ts` (new)
- `app/libs/shared/observability/src/tracing.module.ts` (new)

**Tasks:**

1. **Implement OpenTelemetry**
   - Add OpenTelemetry SDK
   - Create spans for requests
   - Track service-to-service calls
   - Export traces to collector

2. **Add Trace Context**
   - Pass trace context between services
   - Include in HTTP headers
   - Include in logs

3. **Create Trace Dashboard**
   - View request flows
   - Identify bottlenecks
   - Track service dependencies

**Success Criteria:**
- ✅ Traces captured for all requests
- ✅ Service-to-service calls traced
- ✅ Trace dashboard functional
- ✅ Performance bottlenecks visible

---

### 2.2 Performance Logging

**Current State:** No performance metrics

**Files to Create:**
- `app/libs/shared/observability/src/performance.interceptor.ts` (new)

**Tasks:**

1. **Create Performance Interceptor**
   - Log request duration
   - Log database query time
   - Log external API call time
   - Track slow requests (> 1s)

2. **Add Performance Metrics**
   - Request count
   - Average response time
   - P95/P99 response times
   - Error rate

3. **Create Performance Dashboard**
   - Real-time metrics
   - Historical trends
   - Alert on performance degradation

**Success Criteria:**
- ✅ All requests timed
- ✅ Slow requests identified
- ✅ Performance metrics collected
- ✅ Dashboard shows metrics

---

### 2.3 Log Aggregation Setup

**Current State:** Logs only in console/files

**Tasks:**

1. **Choose Log Aggregation Tool**
   - Option 1: ELK Stack (Elasticsearch, Logstash, Kibana)
   - Option 2: AWS CloudWatch
   - Option 3: Datadog
   - Option 4: Splunk

2. **Configure Log Shipping**
   - Send logs to aggregation service
   - Configure log retention
   - Set up log rotation

3. **Create Log Dashboards**
   - Error logs dashboard
   - Performance logs dashboard
   - Business metrics dashboard

**Success Criteria:**
- ✅ Logs aggregated in central location
- ✅ Logs searchable
- ✅ Dashboards functional
- ✅ Log retention configured

---

## 3. Health Checks & Monitoring

### 3.1 Enhanced Health Checks

**Current State:** Basic health endpoints exist

**Files to Modify:**
- `app/apps/*/src/controllers/health.controller.ts` (all services)

**Tasks:**

1. **Add Database Health Check**
   ```typescript
   @Get('health/db')
   async checkDatabase(): Promise<{ status: string; latency: number }> {
     const start = Date.now();
     await this.dataSource.query('SELECT 1');
     const latency = Date.now() - start;
     return { status: 'ok', latency };
   }
   ```

2. **Add Redis Health Check**
   ```typescript
   @Get('health/redis')
   async checkRedis(): Promise<{ status: string; latency: number }> {
     const start = Date.now();
     await this.redis.ping();
     const latency = Date.now() - start;
     return { status: 'ok', latency };
   }
   ```

3. **Add External Service Health Checks**
   - Check auth-service connectivity
   - Check business-service connectivity
   - Check all dependent services

4. **Add Readiness Probe**
   - Check if service is ready to accept traffic
   - Check database connectivity
   - Check Redis connectivity

5. **Add Liveness Probe**
   - Check if service is alive
   - Simple ping endpoint

**Success Criteria:**
- ✅ All health checks implemented
- ✅ Health checks return detailed status
- ✅ Readiness and liveness probes work
- ✅ Health checks include latency metrics

---

### 3.2 Metrics Collection

**Current State:** No metrics collection

**Files to Create:**
- `app/libs/shared/monitoring/src/metrics.service.ts` (new)
- `app/libs/shared/monitoring/src/metrics.module.ts` (new)

**Tasks:**

1. **Implement Prometheus Metrics**
   - Request count (counter)
   - Request duration (histogram)
   - Error count (counter)
   - Active connections (gauge)

2. **Add Business Metrics**
   - Invoice creation count
   - Payment processing count
   - User registration count
   - Business creation count

3. **Expose Metrics Endpoint**
   - `/metrics` endpoint for Prometheus
   - Format: Prometheus text format

4. **Create Metrics Dashboard**
   - Grafana dashboard
   - Real-time metrics
   - Historical trends

**Success Criteria:**
- ✅ Metrics endpoint functional
- ✅ Prometheus scraping metrics
- ✅ Grafana dashboard shows metrics
- ✅ Business metrics tracked

---

### 3.3 Alerting Setup

**Current State:** No alerting

**Tasks:**

1. **Configure Alert Rules**
   - High error rate (> 5%)
   - High response time (> 1s p95)
   - Service down
   - Database connection failures
   - High memory usage (> 80%)
   - Disk space low (< 20%)

2. **Set Up Alert Channels**
   - Email alerts
   - Slack notifications
   - PagerDuty integration
   - SMS alerts (critical only)

3. **Create Alert Runbooks**
   - Document each alert
   - Provide resolution steps
   - Include escalation procedures

**Success Criteria:**
- ✅ Alerts configured for critical issues
- ✅ Alert channels functional
- ✅ Runbooks created
- ✅ Alert testing completed

---

## 4. Request/Response Middleware

### 4.1 Request Logging Middleware

**Current State:** No request logging

**Files to Create:**
- `app/libs/shared/logging/src/request-logger.middleware.ts` (new)

**Tasks:**

1. **Create Request Logger**
   - Log incoming requests
   - Log request headers (sanitized)
   - Log request body (sanitized)
   - Log response status
   - Log response time

2. **Add Request Sanitization**
   - Remove sensitive data (passwords, tokens)
   - Mask PII data
   - Limit body size in logs

3. **Apply to All Services**
   - Global middleware
   - Configurable log level

**Success Criteria:**
- ✅ All requests logged
- ✅ Sensitive data masked
- ✅ Logs include full context
- ✅ Performance impact minimal

---

### 4.2 Response Time Middleware

**Current State:** No response time tracking

**Files to Create:**
- `app/libs/shared/observability/src/response-time.middleware.ts` (new)

**Tasks:**

1. **Track Response Time**
   - Start timer on request
   - End timer on response
   - Log slow requests
   - Add to response headers

2. **Add Performance Headers**
   - `X-Response-Time` header
   - `X-Request-ID` header
   - `X-Correlation-ID` header

**Success Criteria:**
- ✅ Response time in headers
- ✅ Slow requests logged
- ✅ Performance metrics collected

---

## Implementation Order

### Week 1: Core Infrastructure

**Day 1-2: Error Handling**
- [ ] Create error response DTO
- [ ] Enhance exception filter
- [ ] Add correlation ID
- [ ] Test error handling

**Day 3-4: Logging**
- [ ] Create logger service
- [ ] Implement structured logging
- [ ] Add request correlation
- [ ] Configure log output

**Day 5: Health Checks**
- [ ] Enhance health endpoints
- [ ] Add database health check
- [ ] Add Redis health check
- [ ] Test health checks

### Week 2: Observability & Monitoring

**Day 1-2: Metrics**
- [ ] Implement Prometheus metrics
- [ ] Add business metrics
- [ ] Expose metrics endpoint
- [ ] Set up Grafana dashboard

**Day 3-4: Tracing**
- [ ] Implement OpenTelemetry
- [ ] Add trace context
- [ ] Create trace dashboard
- [ ] Test distributed tracing

**Day 5: Alerting**
- [ ] Configure alert rules
- [ ] Set up alert channels
- [ ] Create runbooks
- [ ] Test alerts

---

## Files to Create

### New Files Structure
```
app/libs/shared/
├── logging/
│   ├── src/
│   │   ├── logger.service.ts
│   │   ├── logger.module.ts
│   │   ├── correlation.middleware.ts
│   │   ├── request-logger.middleware.ts
│   │   └── interfaces/
│   │       └── log-entry.interface.ts
│   └── package.json
├── resilience/
│   ├── src/
│   │   ├── retry.service.ts
│   │   ├── circuit-breaker.service.ts
│   │   ├── resilience.module.ts
│   │   └── interfaces/
│   │       └── retry-options.interface.ts
│   └── package.json
├── observability/
│   ├── src/
│   │   ├── tracing.service.ts
│   │   ├── tracing.module.ts
│   │   ├── performance.interceptor.ts
│   │   └── response-time.middleware.ts
│   └── package.json
├── monitoring/
│   ├── src/
│   │   ├── metrics.service.ts
│   │   ├── metrics.module.ts
│   │   └── interfaces/
│   │       └── metric.interface.ts
│   └── package.json
└── validation/
    └── src/
        └── error-response.dto.ts (update existing)
```

---

## Dependencies to Add

### Package.json Updates

```json
{
  "dependencies": {
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^4.7.1",
    "@opentelemetry/api": "^1.7.0",
    "@opentelemetry/sdk-node": "^0.45.0",
    "@opentelemetry/instrumentation-http": "^0.45.0",
    "@opentelemetry/instrumentation-nestjs-core": "^0.45.0",
    "prom-client": "^15.1.0",
    "opossum": "^7.0.0"
  }
}
```

---

## Testing Checklist

### Error Handling
- [ ] Test all error types return consistent format
- [ ] Test correlation ID in error responses
- [ ] Test error logging includes context
- [ ] Test stack traces only in development

### Logging
- [ ] Test structured logging format
- [ ] Test correlation ID in all logs
- [ ] Test log levels work correctly
- [ ] Test log rotation works

### Health Checks
- [ ] Test all health endpoints
- [ ] Test health checks return correct status
- [ ] Test readiness probe
- [ ] Test liveness probe

### Metrics
- [ ] Test metrics endpoint accessible
- [ ] Test Prometheus scraping works
- [ ] Test Grafana dashboard shows data
- [ ] Test business metrics tracked

### Tracing
- [ ] Test traces captured for requests
- [ ] Test service-to-service tracing
- [ ] Test trace dashboard functional

### Alerting
- [ ] Test all alerts trigger correctly
- [ ] Test alert channels work
- [ ] Test alert runbooks accurate

---

## Success Criteria Summary

### Technical
- ✅ All errors return consistent format with correlation ID
- ✅ All logs are structured and searchable
- ✅ Health checks comprehensive and functional
- ✅ Metrics collected and visible in dashboard
- ✅ Distributed tracing works across services
- ✅ Alerts configured and tested

### Performance
- ✅ Logging overhead < 5ms per request
- ✅ Health checks respond in < 100ms
- ✅ Metrics collection overhead < 1%

### Operational
- ✅ Logs aggregated and searchable
- ✅ Dashboards functional
- ✅ Alerts working
- ✅ Runbooks created

---

## Next Steps After Phase 1

Once Phase 1 is complete, proceed to:
- **Phase 2: Security Hardening** (Weeks 3-4)
- **Phase 3: Performance Optimization** (Weeks 5-6)
- **Phase 4: Testing & QA** (Weeks 7-8)

---

## Notes

1. **Start Small:** Begin with error handling and logging, then add observability
2. **Test Incrementally:** Test each component as you build it
3. **Document as You Go:** Update documentation as you implement
4. **Monitor Impact:** Watch for performance impact of logging/monitoring

---

**Document Version:** 1.0  
**Created:** 2026-01-10  
**Status:** Ready for Implementation

