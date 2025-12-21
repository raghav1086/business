# Vyapar App - Non-Functional Requirements (NFRs)

## 1. Performance Requirements

### 1.1 Response Time
| Operation | Target (p95) | Max Acceptable |
|-----------|-------------|----------------|
| API Response (simple queries) | 100ms | 200ms |
| API Response (complex queries) | 300ms | 500ms |
| Invoice PDF Generation | 1.5s | 3s |
| App Cold Start | 2s | 4s |
| App Warm Start | 500ms | 1s |
| Local DB Query | 50ms | 100ms |
| Sync Operation (100 records) | 5s | 10s |

### 1.2 Throughput
- API Gateway: 1000 requests/second
- Each Microservice: 500 requests/second
- Concurrent Users: 10,000 active sessions

### 1.3 Mobile Performance
- App Size: < 50MB (initial download)
- Memory Usage: < 200MB (active)
- Battery: < 5% drain per hour (active use)
- Offline Storage: Up to 1GB local data

---

## 2. Scalability Requirements

### 2.1 Horizontal Scaling
- All microservices must be stateless
- Support auto-scaling based on CPU/Memory (70% threshold)
- Database read replicas for scaling reads
- Redis cluster for session and cache

### 2.2 Data Volume
| Entity | Expected Volume (per business) | Total (platform) |
|--------|-------------------------------|------------------|
| Businesses | - | 1M |
| Parties | 500 | 500M |
| Items | 1,000 | 1B |
| Invoices | 10,000/year | 10B |
| Transactions | 50,000/year | 50B |

### 2.3 Growth Targets
- Year 1: 100K businesses
- Year 2: 500K businesses
- Year 3: 2M businesses

---

## 3. Availability Requirements

### 3.1 Uptime SLA
- **Production**: 99.9% uptime (8.76 hours downtime/year)
- **API Services**: 99.95% availability
- **Offline Mode**: 100% core functionality available offline

### 3.2 Recovery Objectives
- **RTO** (Recovery Time Objective): 1 hour
- **RPO** (Recovery Point Objective): 5 minutes (data loss tolerance)

### 3.3 Redundancy
- Multi-AZ deployment for all services
- Database: Primary + 2 Read Replicas
- Redis: Sentinel with 3 nodes
- Load Balancer: Active-Active

---

## 4. Security Requirements

### 4.1 Authentication & Authorization
- OTP-based authentication with rate limiting
- JWT tokens with RS256 signing
- Access token expiry: 15 minutes
- Refresh token expiry: 30 days
- Refresh token rotation on each use
- Role-Based Access Control (RBAC)

### 4.2 Data Protection
- **In Transit**: TLS 1.3 for all communications
- **At Rest**: AES-256 encryption for sensitive data
- **Local Storage**: SQLCipher for local database
- **PII Handling**: Mask sensitive data in logs

### 4.3 API Security
- Rate Limiting: 100 requests/minute per user
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)
- CSRF protection for web
- API versioning

### 4.4 Compliance
- **DPDP Act** (India Data Protection): Compliant
- **GSTN Requirements**: Compliant
- **PCI DSS**: Level 4 (if handling payments)

### 4.5 Audit & Logging
- All data modifications logged
- User actions tracked
- Login/logout events recorded
- Log retention: 1 year

---

## 5. Reliability Requirements

### 5.1 Fault Tolerance
- Circuit breaker pattern for external services
- Retry with exponential backoff
- Graceful degradation (offline mode)
- Dead letter queues for failed messages

### 5.2 Data Integrity
- Database transactions for critical operations
- Idempotent APIs for retries
- Optimistic locking for concurrent updates
- Data validation at all layers

### 5.3 Backup & Recovery
- Daily automated backups
- Point-in-time recovery (last 7 days)
- Backup encryption
- Regular restore testing (monthly)

---

## 6. Maintainability Requirements

### 6.1 Code Quality
- Test Coverage: > 80% (unit tests)
- Integration Test Coverage: > 60%
- Code Review: Required for all PRs
- Static Analysis: SonarQube quality gate pass

### 6.2 Documentation
- API documentation (OpenAPI/Swagger)
- Architecture Decision Records (ADRs)
- Runbooks for operations
- README for each service

### 6.3 Deployment
- Zero-downtime deployments
- Automated CI/CD pipeline
- Feature flags for gradual rollout
- Rollback capability within 5 minutes

---

## 7. Observability Requirements

### 7.1 Monitoring
- **Metrics**: Prometheus + Grafana
  - Request rate, latency, errors (RED)
  - Resource utilization (CPU, Memory, Disk)
  - Business metrics (invoices created, etc.)
- **Alerting**: PagerDuty/Opsgenie integration
  - P1: Response within 15 minutes
  - P2: Response within 1 hour

### 7.2 Logging
- **Format**: Structured JSON logs
- **Aggregation**: ELK Stack / Loki
- **Correlation**: Request ID across services
- **Retention**: 30 days hot, 1 year cold

### 7.3 Tracing
- **Tool**: Jaeger / OpenTelemetry
- **Coverage**: All inter-service calls
- **Sampling**: 10% in production

---

## 8. Usability Requirements

### 8.1 Mobile App
- Support Android 8.0+ (API 26+)
- Support iOS 14.0+
- Support screen sizes: 5" to 7"
- Support dark/light theme
- Accessibility: WCAG 2.1 AA compliance

### 8.2 Localization
- Languages: English, Hindi
- Currency: INR (₹)
- Date format: DD/MM/YYYY
- Number format: Indian numbering (lakhs, crores)

### 8.3 Offline Capability
- Create invoices offline
- View all data offline
- Auto-sync when online
- Clear offline status indicator

---

## 9. Infrastructure Requirements

### 9.1 Cloud Infrastructure (AWS)
| Component | Service | Specification |
|-----------|---------|---------------|
| Compute | EKS | 3 nodes, m5.large |
| Database | RDS PostgreSQL | db.r5.large, Multi-AZ |
| Cache | ElastiCache Redis | cache.r5.large |
| Storage | S3 | Standard + Intelligent Tiering |
| CDN | CloudFront | Global edge locations |
| DNS | Route 53 | Health checks enabled |
| Secrets | Secrets Manager | Automatic rotation |
| Queue | SQS/RabbitMQ | Standard queues |

### 9.2 Cost Optimization
- Reserved instances for predictable workloads
- Spot instances for non-critical batch jobs
- Auto-scaling to match demand
- S3 lifecycle policies

---

## 10. Testing Requirements

### 10.1 Testing Types
| Type | Coverage Target | Tools |
|------|-----------------|-------|
| Unit Tests | 80% | Jest |
| Integration Tests | 60% | Supertest |
| E2E Tests | Critical flows | Detox/Appium |
| Performance Tests | Key APIs | k6, Artillery |
| Security Tests | OWASP Top 10 | OWASP ZAP |

### 10.2 Testing Environments
- **Development**: Local Docker
- **CI**: GitHub Actions
- **Staging**: Kubernetes (scaled down)
- **Production**: Kubernetes (full scale)

### 10.3 Load Testing Targets
- 1,000 concurrent users
- 100 invoices/second creation rate
- 500 sync operations/second
- 4-hour sustained load test

---

## 11. Compliance Checklist

### 11.1 GST Compliance
- [ ] GSTIN validation
- [ ] HSN/SAC code support
- [ ] GSTR-1 format export
- [ ] GSTR-3B summary
- [ ] E-Invoice (IRN) generation
- [ ] E-Way Bill integration

### 11.2 Data Privacy (DPDP Act)
- [ ] User consent for data collection
- [ ] Data access request handling
- [ ] Data deletion capability
- [ ] Data portability (export)
- [ ] Breach notification process
- [ ] Privacy policy documentation

### 11.3 Accessibility
- [ ] Screen reader support
- [ ] Sufficient color contrast
- [ ] Touch target sizes (min 44x44)
- [ ] Text scaling support
