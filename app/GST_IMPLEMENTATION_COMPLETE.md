# GST Reports & E-Invoice Implementation - Complete Guide

**Project:** Business Management System  
**Feature:** GST Compliance & E-Invoice Integration  
**Timeline:** 6-8 Weeks  
**Focus:** Web App Only (No Mobile)  
**Status:** Planning Complete - Ready for Implementation  
**Last Updated:** 2025-01-10

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Complete Feature List](#complete-feature-list)
3. [Gap Analysis & MSME Requirements](#gap-analysis--msme-requirements)
4. [Implementation Timeline](#implementation-timeline)
5. [Detailed Sprint Plan](#detailed-sprint-plan)
6. [Implementation Checklist](#implementation-checklist)
7. [Quick Reference](#quick-reference)
8. [Key Decisions](#key-decisions)

---

## Executive Summary

This document is the **single source of truth** for GST implementation. It consolidates all planning, gap analysis, and implementation details into one comprehensive guide.

### Scope
- **GSTR-1 Report** (Complete with all sections)
- **GSTR-3B Report** (Complete with all sections)
- **GSTR-4 Report** (Composition Scheme)
- **E-Invoice IRN Generation** (via GSP)
- **E-Way Bill Generation** (via GSP)
- **GSTR-2A/2B Reconciliation**
- **MSME-Specific Features** (Quarterly filing, Composition scheme)

### Timeline
- **Original Estimate:** 4-6 weeks
- **Revised Estimate:** 6-8 weeks (with all MSME features)
- **Team:** 1-2 Backend Developers

### Critical Success Factors
1. GSP integration must work reliably
2. All GSTR sections must be complete
3. MSME requirements must be fully supported
4. Data accuracy must be 100%

---

## Complete Feature List

### Core GST Reports (Must Have - P0)
- ✅ **GSTR-1** - Complete with all sections (B2B, B2CL, B2CS, CDNR, EXP, NIL, AT, TXPD, HSN)
- ✅ **GSTR-3B** - Complete with all sections (Output Tax, ITC, RCM, Interest, Payment)
- ✅ **GSTR-4** - Composition Scheme (Quarterly)
- ✅ **Quarterly Filing** - Support for MSME quarterly returns
- ✅ **Monthly Filing** - Support for regular monthly returns

### GSTR-1 Sections (All Required)
- ✅ **B2B** - Business to Business invoices (grouped by GSTIN)
- ✅ **B2CL** - B2C Large invoices (> 2.5L with customer details)
- ✅ **B2CS** - B2C Small invoices (summary)
- ✅ **CDNR** - Credit/Debit Notes
- ✅ **EXP** - Export Invoices (zero-rated)
- ✅ **NIL** - Nil-rated, Exempted, Non-GST supplies
- ✅ **AT** - Advance Receipts
- ✅ **TXPD** - Tax Paid on Advance
- ✅ **HSN** - HSN-wise Summary

### GSTR-3B Sections (All Required)
- ✅ **Section 3.1** - Output Tax (CGST, SGST, IGST)
- ✅ **Section 3.2** - Output Tax by Rate
- ✅ **Section 4** - ITC (Input Tax Credit) Details
- ✅ **Section 5** - RCM (Reverse Charge Mechanism) Details
- ✅ **Section 6** - Interest and Late Fee
- ✅ **Section 9** - Payment Details

### GSP Integration (Must Have - P0)
- ✅ **GSP Provider Abstraction** - Support multiple providers
- ✅ **ClearTax GSP Provider** - Primary provider
- ✅ **GSP Authentication** - Token management
- ✅ **Error Handling** - Retry logic, circuit breaker
- ✅ **Webhook Support** - Async status updates

### E-Invoice (Must Have - P0)
- ✅ **IRN Generation** - Via GSP provider
- ✅ **Threshold Check** - 5Cr turnover requirement
- ✅ **IRN Status Tracking** - Real-time status
- ✅ **QR Code Generation** - For invoices
- ✅ **IRN Cancellation** - Support cancellation

### E-Way Bill (Must Have - P0)
- ✅ **E-Way Bill Generation** - 50K threshold
- ✅ **Status Tracking** - Real-time status
- ✅ **Cancellation** - Support cancellation
- ✅ **Update** - Support updates

### MSME-Specific Features (Must Have - P0)
- ✅ **Composition Scheme** - Full support
- ✅ **Quarterly Filing** - Critical for MSMEs
- ✅ **Turnover-Based Features** - Auto-enable/disable
- ✅ **Bill of Supply** - For composition businesses
- ✅ **Inter-state Restrictions** - For composition

### Advanced Features (Should Have - P1)
- ✅ **GSTR-2A/2B Reconciliation** - ITC matching
- ✅ **ITC Tracking** - Utilization and reversal
- ✅ **HSN/SAC Validation** - Format validation
- ✅ **Place of Supply Rules** - Automatic detection
- ✅ **Credit/Debit Notes** - Full support
- ✅ **Advance Receipts** - Tax on advance

---

## Gap Analysis & MSME Requirements

### 🔴 Critical Gaps Identified

#### 1. GSP (GST Suvidha Provider) Integration
**Status:** ❌ Missing from original plan  
**Priority:** P0 - Critical

**What's Missing:**
- GSP provider abstraction layer
- Support for multiple GSP providers (ClearTax, Tally, etc.)
- GSP authentication and token management
- GSP API error handling
- Webhook support for async responses

**Why Critical:**
- Required for E-Invoice and E-Way Bill
- MSMEs may use different GSP providers
- Need flexibility to switch providers

#### 2. MSME-Specific Features
**Status:** ❌ Missing from original plan  
**Priority:** P0 - Critical

**What's Missing:**
- Quarterly filing support (MSMEs file quarterly, not monthly)
- Composition scheme support (GSTR-4)
- Turnover-based feature enablement
- Bill of Supply generation

**Why Critical:**
- Most MSMEs file quarterly
- Composition scheme is common for small businesses
- Reduces compliance burden

#### 3. Complete GSTR Sections
**Status:** ⚠️ Partially planned  
**Priority:** P0 - Critical

**Missing GSTR-1 Sections:**
- B2CL (B2C Large > 2.5L)
- CDNR (Credit/Debit Notes)
- EXP (Export Invoices)
- NIL (Nil-rated, Exempted)
- AT (Advance Receipts)
- TXPD (Tax Paid on Advance)

**Missing GSTR-3B Sections:**
- ITC Details (Section 4)
- RCM Details (Section 5)
- Interest and Late Fee
- Payment Details

#### 4. E-Way Bill
**Status:** ❌ Not planned  
**Priority:** P0 - Critical

**What's Missing:**
- E-Way Bill generation (50K threshold)
- E-Way Bill status tracking
- Cancellation and update support

---

## Implementation Timeline

### Phase 1: Foundation (Week 1) - 7 days
**Goal:** Setup GST service, GSP abstraction, and basic GSTR-1

**Tasks:**
1. Setup GST Service (Tasks 1.1, 1.2, 1.3)
2. **GSP Provider Abstraction** (Task 1.4) ⭐ NEW
3. **Business GST Settings** (Task 1.5) ⭐ NEW
4. **Quarterly Filing Support** (Task 1.6) ⭐ NEW
5. Basic GSTR-1 (Tasks 2.1, 2.2)
6. Testing (Tasks 3.1, 3.2)

**Deliverables:**
- GST service running on port 3008
- GSP provider abstraction ready
- Business GST settings configured
- Basic GSTR-1 working (B2B, B2C, HSN)
- Quarterly filing supported

---

### Phase 2: Complete GSTR-1 (Week 2) - 7 days
**Goal:** Complete all GSTR-1 sections and basic GSTR-3B

**Tasks:**
1. **Complete GSTR-1 Sections** (Task 2.3) ⭐ NEW
   - B2CL, CDNR, EXP, NIL, AT, TXPD
2. Basic GSTR-3B (Original Week 2)
3. Excel Export

**Deliverables:**
- Complete GSTR-1 with all sections
- Basic GSTR-3B
- Excel export working

---

### Phase 3: Complete GSTR-3B & E-Invoice (Week 3) - 7 days
**Goal:** Complete GSTR-3B sections and E-Invoice integration

**Tasks:**
1. **Complete GSTR-3B Sections** (Task 3.3) ⭐ NEW
   - ITC Details, RCM Details, Interest, Payment
2. E-Invoice Integration (Original Week 3)

**Deliverables:**
- Complete GSTR-3B with all sections
- E-Invoice IRN generation working

---

### Phase 4: Composition & Frontend (Week 4) - 7 days
**Goal:** Composition scheme support and frontend integration

**Tasks:**
1. **Composition Scheme Support** (Task 4.3) ⭐ NEW
   - GSTR-4 Report
   - Composition Tax Calculation
   - Bill of Supply
2. Frontend Integration (Original Week 4)

**Deliverables:**
- Composition scheme fully supported
- Frontend integrated with backend
- All reports accessible via UI

---

### Phase 5: E-Way Bill (Week 5) - 7 days
**Goal:** E-Way Bill generation and advanced features

**Tasks:**
1. **E-Way Bill Generation** (Task 5.3) ⭐ NEW
2. Advanced Features (Original Week 5)

**Deliverables:**
- E-Way Bill generation working
- Advanced features implemented

---

### Phase 6: Reconciliation & Polish (Week 6) - 7 days
**Goal:** GSTR-2A/2B reconciliation and final polish

**Tasks:**
1. **GSTR-2A/2B Reconciliation** (Task 6.3) ⭐ NEW
2. **HSN/SAC Validation** (Task 6.4) ⭐ NEW
3. Testing & Documentation (Original Week 6)

**Deliverables:**
- GSTR-2A/2B reconciliation working
- HSN/SAC validation implemented
- Complete testing done
- Documentation complete

---

## Detailed Sprint Plan

### Week 1: GST Service Foundation & GSTR-1 Backend

#### Task 1.1: Setup GST Service Microservice

**Story 1.1: Create GST Service Project Structure**

**Priority:** P0 - Critical  
**Estimate:** 4 hours

##### Subtask 1.1.1: Generate NX NestJS Application
- [ ] Run: `npx nx generate @nx/nest:application gst-service --directory=apps/gst-service`
- [ ] Verify project structure created
- [ ] Can run `nx serve gst-service` without errors

**Files:** Auto-generated by NX

##### Subtask 1.1.2: Configure Service Port and Database
- [ ] Create `.env.example` with port 3008 and gst_db
- [ ] Update `main.ts` for port 3008
- [ ] Update `app.module.ts` for gst_db database
- [ ] Service runs on port 3008
- [ ] Database connection successful

**Files to Modify:**
- `apps/gst-service/src/main.ts`
- `apps/gst-service/src/app.module.ts`

##### Subtask 1.1.3: Setup Health Controller
- [ ] Create `health.controller.ts`
- [ ] Implement `GET /health` and `GET /health/db`
- [ ] Register in AppModule

**Files to Create:**
- `apps/gst-service/src/controllers/health.controller.ts`

##### Subtask 1.1.4: Setup Swagger Documentation
- [ ] Install Swagger dependencies
- [ ] Configure Swagger in `main.ts`
- [ ] Swagger UI accessible at `/api/docs`

**Files to Modify:**
- `apps/gst-service/src/main.ts`

##### Subtask 1.1.5: Setup Authentication Guard
- [ ] Create `auth.guard.ts`
- [ ] Import JwtModule
- [ ] Apply guard to controllers

**Files to Create:**
- `apps/gst-service/src/guards/auth.guard.ts`

##### Subtask 1.1.6: Setup Business Context Guard
- [ ] Use `CrossServiceBusinessContextGuard` from shared
- [ ] Extract business_id from header
- [ ] Apply to controllers

##### Subtask 1.1.7: Add Service to Docker Compose
- [ ] Add `gst_db` service to `docker-compose.yml`
- [ ] Configure port 5439
- [ ] Add volume

**Files to Modify:**
- `docker-compose.yml`

##### Subtask 1.1.8: Create Service Startup Script
- [ ] Update `start-services.sh`
- [ ] Update `stop-services.sh`
- [ ] Test startup/shutdown

**Files to Modify:**
- `scripts/start-services.sh`
- `scripts/stop-services.sh`

---

#### Task 1.2: Setup HTTP Client for Service Communication

**Story 1.2: HTTP Clients for Inter-Service Communication**

**Priority:** P0 - Critical  
**Estimate:** 3 hours

##### Subtask 1.2.1: Install HTTP Client Dependencies
- [ ] Install axios and types
- [ ] Verify in package.json

##### Subtask 1.2.2: Create HTTP Client Service
- [ ] Create base HTTP client service
- [ ] Create `InvoiceClientService` (port 3006)
- [ ] Create `PartyClientService` (port 3004)
- [ ] Create `BusinessClientService` (port 3003)

**Files to Create:**
- `apps/gst-service/src/services/http-client.service.ts`
- `apps/gst-service/src/services/invoice-client.service.ts`
- `apps/gst-service/src/services/party-client.service.ts`
- `apps/gst-service/src/services/business-client.service.ts`

##### Subtask 1.2.3: Configure Service URLs
- [ ] Add service URLs to `.env.example`
- [ ] Use ConfigService to read URLs

##### Subtask 1.2.4: Implement Service Discovery (Optional)
- [ ] Add health check before requests
- [ ] Handle service unavailable errors

---

#### Task 1.3: Create Database Schema

**Story 1.3: Database Tables for GST Data**

**Priority:** P1 - High  
**Estimate:** 2 hours

##### Subtask 1.3.1: Design Database Schema
- [ ] Design `gst_reports` table
- [ ] Design `einvoice_requests` table
- [ ] Design `business_gst_settings` table ⭐ NEW
- [ ] Design `ewaybill` table ⭐ NEW

##### Subtask 1.3.2: Create TypeORM Entities
- [ ] Create `GstReport` entity
- [ ] Create `EInvoiceRequest` entity
- [ ] Create `BusinessGstSettings` entity ⭐ NEW
- [ ] Create `EWayBill` entity ⭐ NEW

**Files to Create:**
- `apps/gst-service/src/entities/gst-report.entity.ts`
- `apps/gst-service/src/entities/einvoice-request.entity.ts`
- `apps/gst-service/src/entities/business-gst-settings.entity.ts` ⭐ NEW
- `apps/gst-service/src/entities/ewaybill.entity.ts` ⭐ NEW

##### Subtask 1.3.3: Create Repositories
- [ ] Create `GstReportRepository`
- [ ] Create `EInvoiceRequestRepository`
- [ ] Create `BusinessGstSettingsRepository` ⭐ NEW
- [ ] Create `EWayBillRepository` ⭐ NEW

**Files to Create:**
- `apps/gst-service/src/repositories/gst-report.repository.ts`
- `apps/gst-service/src/repositories/einvoice-request.repository.ts`
- `apps/gst-service/src/repositories/business-gst-settings.repository.ts` ⭐ NEW
- `apps/gst-service/src/repositories/ewaybill.repository.ts` ⭐ NEW

---

#### Task 1.4: GSP Provider Abstraction Layer ⭐ NEW

**Story 1.4: Support Multiple GSP Providers**

**Priority:** P0 - Critical  
**Estimate:** 6 hours

##### Subtask 1.4.1: Create GSP Provider Interface
- [ ] Define `GSPProvider` interface
- [ ] Define method signatures (authenticate, generateIRN, generateEWayBill, etc.)
- [ ] Define response types
- [ ] Define error types

**Files to Create:**
- `apps/gst-service/src/interfaces/gsp-provider.interface.ts`
- `apps/gst-service/src/dto/gsp.dto.ts`

##### Subtask 1.4.2: Implement ClearTax GSP Provider
- [ ] Create `ClearTaxGSPProvider` class
- [ ] Implement authentication
- [ ] Implement IRN generation
- [ ] Implement E-Way Bill generation
- [ ] Handle ClearTax-specific errors
- [ ] Add retry logic

**Files to Create:**
- `apps/gst-service/src/services/gsp/cleartax-gsp-provider.service.ts`

##### Subtask 1.4.3: Create GSP Provider Factory
- [ ] Create factory class
- [ ] Support provider selection
- [ ] Load provider configuration
- [ ] Initialize provider instance

**Files to Create:**
- `apps/gst-service/src/services/gsp/gsp-provider.factory.ts`

##### Subtask 1.4.4: GSP Authentication Service
- [ ] Store GSP credentials (encrypted)
- [ ] Implement token management
- [ ] Token refresh logic
- [ ] Handle authentication failures

**Files to Create:**
- `apps/gst-service/src/services/gsp/gsp-auth.service.ts`

---

#### Task 1.5: Business GST Settings ⭐ NEW

**Story 1.5: Business GST Configuration**

**Priority:** P0 - Critical  
**Estimate:** 4 hours

##### Subtask 1.5.1: Create Business GST Settings Entity
- [ ] Create entity with fields:
  - `gst_type` (regular/composition)
  - `annual_turnover`
  - `filing_frequency` (monthly/quarterly)
  - `gsp_provider`
  - `gsp_credentials` (encrypted)
  - `einvoice_enabled`
  - `ewaybill_enabled`
- [ ] Add indexes and foreign key

**Files to Create:**
- `apps/gst-service/src/entities/business-gst-settings.entity.ts`

##### Subtask 1.5.2: Create Repository and Service
- [ ] Create repository
- [ ] Create service
- [ ] Implement settings management
- [ ] Auto-enable features based on turnover

**Files to Create:**
- `apps/gst-service/src/repositories/business-gst-settings.repository.ts`
- `apps/gst-service/src/services/business-gst-settings.service.ts`

##### Subtask 1.5.3: Create Controller
- [ ] Create controller
- [ ] Add GET endpoint (get settings)
- [ ] Add PUT endpoint (update settings)
- [ ] Add validation

**Files to Create:**
- `apps/gst-service/src/controllers/business-gst-settings.controller.ts`

---

#### Task 1.6: Quarterly Filing Support ⭐ NEW

**Story 1.6: Support Quarterly Filing for MSMEs**

**Priority:** P0 - Critical  
**Estimate:** 3 hours

##### Subtask 1.6.1: Create Period Parser Utility
- [ ] Support MMYYYY format (monthly)
- [ ] Support Q1-YYYY format (quarterly)
- [ ] Parse to start/end dates
- [ ] Validate period format

**Files to Create:**
- `apps/gst-service/src/utils/period-parser.util.ts`

##### Subtask 1.6.2: Update Services for Quarterly
- [ ] Update GSTR-1 service to check filing frequency
- [ ] Aggregate 3 months data for quarterly
- [ ] Handle quarterly period format

**Files to Modify:**
- `apps/gst-service/src/services/gstr1.service.ts`

---

#### Task 2.1: Create GSTR-1 Service

**Story 2.1: GSTR-1 Report Generation**

**Priority:** P0 - Critical  
**Estimate:** 8 hours

##### Subtask 2.1.1: Create GSTR-1 DTOs
- [ ] Create request DTO (period validation)
- [ ] Create response DTO (GSTN schema)
- [ ] Add validation decorators

**Files to Create:**
- `apps/gst-service/src/dto/gstr1.dto.ts`

##### Subtask 2.1.2: Create GSTR-1 Service Class
- [ ] Create service class
- [ ] Inject dependencies
- [ ] Implement `generateGstr1()` method

**Files to Create:**
- `apps/gst-service/src/services/gstr1.service.ts`

##### Subtask 2.1.3: Fetch Invoices for Period
- [ ] Parse period to date range
- [ ] Fetch invoices from invoice-service
- [ ] Filter by business_id, invoice_type='sale', date range
- [ ] Include invoice items

##### Subtask 2.1.4: Separate B2B and B2C Invoices
- [ ] Check party GSTIN
- [ ] Categorize as B2B (has GSTIN) or B2C (no GSTIN)
- [ ] Handle edge cases

##### Subtask 2.1.5: Group B2B Invoices by Customer GSTIN
- [ ] Group by customer GSTIN
- [ ] Structure as per GSTN schema
- [ ] Include all invoice fields and items

##### Subtask 2.1.6: Group B2C Invoices by Place of Supply and Tax Rate
- [ ] Group by place of supply
- [ ] Group by tax rate within place of supply
- [ ] Structure as per GSTN schema

##### Subtask 2.1.7: Generate HSN-wise Summary
- [ ] Extract HSN codes from items
- [ ] Group by HSN code
- [ ] Aggregate quantities and amounts

##### Subtask 2.1.8: Build Complete GSTR-1 JSON
- [ ] Get business GSTIN
- [ ] Assemble all sections
- [ ] Validate JSON structure

##### Subtask 2.1.9: Implement Report Caching
- [ ] Check cache before generation
- [ ] Save generated reports to cache
- [ ] Handle stale cache (1 hour TTL)

##### Subtask 2.1.10: Add Data Validation
- [ ] Validate business GSTIN
- [ ] Validate invoice data
- [ ] Check for missing HSN codes
- [ ] Return validation errors

---

#### Task 2.2: Create GSTR-1 Controller

**Story 2.2: GSTR-1 API Endpoint**

**Priority:** P0 - Critical  
**Estimate:** 2 hours

##### Subtask 2.2.1: Create GSTR-1 Controller
- [ ] Create controller
- [ ] Add `GET /api/v1/gst/gstr1` endpoint
- [ ] Apply guards
- [ ] Add Swagger docs

**Files to Create:**
- `apps/gst-service/src/controllers/gstr1.controller.ts`

##### Subtask 2.2.2: Add Request Validation
- [ ] Validate period format
- [ ] Validate period is not future
- [ ] Validate business_id

##### Subtask 2.2.3: Add Response Formatting
- [ ] Return proper HTTP status codes
- [ ] Include error details

##### Subtask 2.2.4: Register Controller in AppModule
- [ ] Import controller
- [ ] Add to controllers array

---

#### Task 3.1: Write Unit Tests

**Story 3.1: GSTR-1 Service Tests**

**Priority:** P1 - High  
**Estimate:** 4 hours

##### Subtask 3.1.1: Setup Test Configuration
- [ ] Create `jest.config.ts`
- [ ] Configure test environment
- [ ] Setup test database

##### Subtask 3.1.2: Write GSTR-1 Service Tests
- [ ] Test period parsing
- [ ] Test invoice fetching
- [ ] Test B2B/B2C categorization
- [ ] Test grouping logic
- [ ] Test HSN summary
- [ ] Test caching
- [ ] Test validation

**Files to Create:**
- `apps/gst-service/src/services/gstr1.service.spec.ts`

##### Subtask 3.1.3: Write Controller Tests
- [ ] Test successful generation
- [ ] Test invalid period
- [ ] Test missing business ID
- [ ] Test authentication failure

**Files to Create:**
- `apps/gst-service/src/controllers/gstr1.controller.spec.ts`

---

#### Task 3.2: Integration Testing

**Story 3.2: End-to-End Integration Tests**

**Priority:** P1 - High  
**Estimate:** 3 hours

##### Subtask 3.2.1: Setup Integration Test Environment
- [ ] Setup test database
- [ ] Seed test data
- [ ] Mock external services

##### Subtask 3.2.2: Write Integration Tests
- [ ] Test with B2B invoices
- [ ] Test with B2C invoices
- [ ] Test with mixed invoices
- [ ] Test report caching
- [ ] Test error scenarios

---

### Week 2: Complete GSTR-1 Sections & GSTR-3B Basic

#### Task 2.3: Complete GSTR-1 Sections ⭐ NEW

**Story 2.3: All GSTR-1 Sections**

**Priority:** P0 - Critical  
**Estimate:** 12 hours

##### Subtask 2.3.1: B2CL Section (B2C Large)
- [ ] Identify B2C invoices > 2.5L
- [ ] Extract customer details
- [ ] Group by place of supply
- [ ] Include in GSTR-1 B2CL section

##### Subtask 2.3.2: CDNR Section (Credit/Debit Notes)
- [ ] Create credit note entity
- [ ] Create debit note entity
- [ ] Link to original invoice
- [ ] Calculate tax adjustments
- [ ] Include in GSTR-1 CDNR section

**Files to Create:**
- `apps/gst-service/src/entities/credit-note.entity.ts`
- `apps/gst-service/src/entities/debit-note.entity.ts`

##### Subtask 2.3.3: EXP Section (Export Invoices)
- [ ] Identify export invoices
- [ ] Extract shipping bill details
- [ ] Extract port code
- [ ] Zero-rated tax calculation
- [ ] Include in GSTR-1 EXP section

##### Subtask 2.3.4: NIL Section (Nil-Rated, Exempted)
- [ ] Identify nil-rated items
- [ ] Identify exempted items
- [ ] Identify non-GST supplies
- [ ] Add reason codes
- [ ] Include in GSTR-1 NIL section

##### Subtask 2.3.5: AT Section (Advance Receipts)
- [ ] Create advance receipt entity
- [ ] Calculate tax on advance
- [ ] Link to final invoice
- [ ] Include in GSTR-1 AT section

**Files to Create:**
- `apps/gst-service/src/entities/advance-receipt.entity.ts`

##### Subtask 2.3.6: TXPD Section (Tax Paid on Advance)
- [ ] Track tax paid on advance
- [ ] Calculate adjustments
- [ ] Include in GSTR-1 TXPD section

---

#### Task 3.3: GSTR-3B Basic Implementation

**Story 3.3: GSTR-3B Report Generation**

**Priority:** P0 - Critical  
**Estimate:** 8 hours

##### Subtask 3.3.1: Create GSTR-3B Service
- [ ] Create service class
- [ ] Create DTOs
- [ ] Implement basic generation

**Files to Create:**
- `apps/gst-service/src/services/gstr3b.service.ts`
- `apps/gst-service/src/dto/gstr3b.dto.ts`

##### Subtask 3.3.2: Calculate Output Tax
- [ ] Calculate CGST/SGST/IGST from sales
- [ ] Group by tax rate
- [ ] Calculate taxable value

##### Subtask 3.3.3: Create GSTR-3B Controller
- [ ] Create controller
- [ ] Add `GET /api/v1/gst/gstr3b` endpoint
- [ ] Add validation

**Files to Create:**
- `apps/gst-service/src/controllers/gstr3b.controller.ts`

---

#### Task 3.4: Excel Export

**Story 3.4: Excel Export for Reports**

**Priority:** P1 - High  
**Estimate:** 4 hours

##### Subtask 3.4.1: Install Excel Library
- [ ] Install `exceljs`
- [ ] Verify installation

##### Subtask 3.4.2: Create Excel Export Service
- [ ] Create service
- [ ] Implement GSTR-1 Excel export
- [ ] Implement GSTR-3B Excel export

**Files to Create:**
- `apps/gst-service/src/services/excel-export.service.ts`

##### Subtask 3.4.3: Add Export Endpoints
- [ ] Add `GET /api/v1/gst/gstr1/export?format=excel`
- [ ] Add `GET /api/v1/gst/gstr3b/export?format=excel`

---

### Week 3: Complete GSTR-3B & E-Invoice

#### Task 3.5: Complete GSTR-3B Sections ⭐ NEW

**Story 3.5: All GSTR-3B Sections**

**Priority:** P0 - Critical  
**Estimate:** 10 hours

##### Subtask 3.5.1: ITC Details (Section 4)
- [ ] Calculate ITC from purchase invoices
- [ ] Group ITC by tax rate
- [ ] Separate eligible vs ineligible ITC
- [ ] Calculate ITC utilization
- [ ] Calculate ITC reversal
- [ ] Include in GSTR-3B Section 4

##### Subtask 3.5.2: RCM Details (Section 5)
- [ ] Calculate RCM tax
- [ ] Calculate RCM ITC
- [ ] Track RCM payable
- [ ] Include in GSTR-3B Section 5

##### Subtask 3.5.3: Interest and Late Fee (Section 6)
- [ ] Calculate interest (if late)
- [ ] Calculate late fee
- [ ] Include in GSTR-3B Section 6

##### Subtask 3.5.4: Payment Details (Section 9)
- [ ] Track tax payments
- [ ] Payment mode
- [ ] Payment date
- [ ] Challan details
- [ ] Include in GSTR-3B Section 9

---

#### Task 4.1: E-Invoice Integration

**Story 4.1: E-Invoice IRN Generation**

**Priority:** P0 - Critical  
**Estimate:** 8 hours

##### Subtask 4.1.1: E-Invoice Service
- [ ] Create service
- [ ] Check business turnover (5Cr threshold)
- [ ] Prepare E-Invoice payload
- [ ] Call GSP provider

**Files to Create:**
- `apps/gst-service/src/services/einvoice.service.ts`

##### Subtask 4.1.2: IRN Generation
- [ ] Convert invoice to E-Invoice format
- [ ] Validate payload
- [ ] Generate IRN via GSP
- [ ] Store IRN in invoice entity
- [ ] Generate QR code

##### Subtask 4.1.3: E-Invoice Controller
- [ ] Create controller
- [ ] Add `POST /api/v1/gst/einvoice/generate/:invoiceId`
- [ ] Add `GET /api/v1/gst/einvoice/:invoiceId`
- [ ] Handle errors

**Files to Create:**
- `apps/gst-service/src/controllers/einvoice.controller.ts`

---

### Week 4: Composition Scheme & Frontend

#### Task 4.3: Composition Scheme Support ⭐ NEW

**Story 4.3: Composition Scheme for MSMEs**

**Priority:** P0 - Critical  
**Estimate:** 8 hours

##### Subtask 4.3.1: Composition Scheme Detection
- [ ] Check business GST type
- [ ] Validate composition rules
- [ ] Block inter-state invoices
- [ ] Generate Bill of Supply

##### Subtask 4.3.2: GSTR-4 Report Generation
- [ ] Create GSTR-4 service
- [ ] Calculate composition tax
- [ ] Generate GSTR-4 JSON
- [ ] Quarterly aggregation

**Files to Create:**
- `apps/gst-service/src/services/gstr4.service.ts`

##### Subtask 4.3.3: Composition Tax Calculation
- [ ] Determine composition rate (1%, 5%, 6%)
- [ ] Calculate based on turnover
- [ ] Track composition tax payable

---

#### Task 4.4: Frontend Integration

**Story 4.4: Frontend GST Reports UI**

**Priority:** P0 - Critical  
**Estimate:** 8 hours

##### Subtask 4.4.1: Update Reports Page
- [ ] Replace client-side GSTR-1 with API
- [ ] Replace client-side GSTR-3B with API
- [ ] Add period selector
- [ ] Add loading states
- [ ] Add error handling

**Files to Modify:**
- `web-app/app/reports/page.tsx`

##### Subtask 4.4.2: Export Functionality
- [ ] Add "Export JSON" button
- [ ] Add "Export Excel" button
- [ ] Implement download handlers

##### Subtask 4.4.3: E-Invoice UI
- [ ] Add E-Invoice section to invoice detail
- [ ] "Generate IRN" button
- [ ] Display IRN and QR code
- [ ] Show status

---

### Week 5: E-Way Bill & Advanced Features

#### Task 5.3: E-Way Bill Generation ⭐ NEW

**Story 5.3: E-Way Bill for Transport**

**Priority:** P0 - Critical  
**Estimate:** 8 hours

##### Subtask 5.3.1: E-Way Bill Service
- [ ] Check invoice value (50K threshold)
- [ ] Check inter-state movement
- [ ] Prepare E-Way Bill data
- [ ] Call GSP provider

**Files to Create:**
- `apps/gst-service/src/services/ewaybill.service.ts`

##### Subtask 5.3.2: E-Way Bill Entity
- [ ] Create entity
- [ ] Store E-Way Bill number
- [ ] Store validity
- [ ] Store status
- [ ] Link to invoice

**Files to Create:**
- `apps/gst-service/src/entities/ewaybill.entity.ts`

##### Subtask 5.3.3: E-Way Bill Controller
- [ ] Create controller
- [ ] Add generate endpoint
- [ ] Add cancel endpoint
- [ ] Add update endpoint
- [ ] Add status endpoint

**Files to Create:**
- `apps/gst-service/src/controllers/ewaybill.controller.ts`

---

### Week 6: Reconciliation & Polish

#### Task 6.3: GSTR-2A/2B Reconciliation ⭐ NEW

**Story 6.3: Purchase Reconciliation**

**Priority:** P0 - Critical  
**Estimate:** 10 hours

##### Subtask 6.3.1: GSTR-2A/2B Import
- [ ] Create import endpoint
- [ ] Parse GSTR-2A/2B JSON
- [ ] Validate JSON format
- [ ] Store imported data

**Files to Create:**
- `apps/gst-service/src/services/gstr2a-reconciliation.service.ts`

##### Subtask 6.3.2: Invoice Matching
- [ ] Match purchase invoices
- [ ] Identify matched invoices
- [ ] Identify missing invoices
- [ ] Identify extra invoices
- [ ] Identify mismatches

##### Subtask 6.3.3: Reconciliation Report
- [ ] Generate reconciliation report
- [ ] Show matched/missing/extra
- [ ] Show mismatches
- [ ] Allow manual matching

---

#### Task 6.4: HSN/SAC Validation ⭐ NEW

**Story 6.4: HSN/SAC Code Validation**

**Priority:** P1 - High  
**Estimate:** 4 hours

##### Subtask 6.4.1: HSN Code Validation
- [ ] Validate HSN format (4, 6, 8 digits)
- [ ] Validate HSN structure
- [ ] Show validation errors

**Files to Create:**
- `apps/gst-service/src/utils/hsn-validator.util.ts`

##### Subtask 6.4.2: SAC Code Validation
- [ ] Validate SAC format (6 digits)
- [ ] Validate SAC structure
- [ ] Show validation errors

**Files to Create:**
- `apps/gst-service/src/utils/sac-validator.util.ts`

---

## Implementation Checklist

### Pre-Implementation (Before Week 1)
- [ ] Review this complete guide
- [ ] Get stakeholder approval
- [ ] Select GSP provider(s)
- [ ] Get GSP API credentials
- [ ] Understand GSP authentication flow
- [ ] Review GSTN schema documentation
- [ ] Setup development environment
- [ ] Create project repository branch

### Week 1 Checklist
- [ ] GST service created
- [ ] GSP provider abstraction implemented
- [ ] Business GST settings entity created
- [ ] Quarterly filing supported
- [ ] Basic GSTR-1 working
- [ ] All tests passing

### Week 2 Checklist
- [ ] Complete GSTR-1 sections implemented
- [ ] Basic GSTR-3B working
- [ ] Excel export working
- [ ] All tests passing

### Week 3 Checklist
- [ ] Complete GSTR-3B sections implemented
- [ ] E-Invoice IRN generation working
- [ ] All tests passing

### Week 4 Checklist
- [ ] Composition scheme supported
- [ ] GSTR-4 report working
- [ ] Frontend integrated
- [ ] All tests passing

### Week 5 Checklist
- [ ] E-Way Bill generation working
- [ ] Advanced features implemented
- [ ] All tests passing

### Week 6 Checklist
- [ ] GSTR-2A/2B reconciliation working
- [ ] HSN/SAC validation implemented
- [ ] Complete testing done
- [ ] Documentation complete

---

## Quick Reference

### Service Management
```bash
# Start GST service
nx serve gst-service

# Build GST service
nx build gst-service

# Test GST service
nx test gst-service

# Start all services
./scripts/start-services.sh
```

### Database
```bash
# Start database
docker-compose up -d gst_db

# Connect to database
psql -h localhost -p 5439 -U postgres -d gst_db
```

### Testing
```bash
# Run unit tests
nx test gst-service

# Run with coverage
nx test gst-service --coverage

# Run integration tests
nx test gst-service --testPathPattern=integration
```

### API Endpoints

#### GSTR-1
```
GET /api/v1/gst/gstr1?period=122024
GET /api/v1/gst/gstr1/export?period=122024&format=excel
```

#### GSTR-3B
```
GET /api/v1/gst/gstr3b?period=122024
GET /api/v1/gst/gstr3b/export?period=122024&format=excel
```

#### E-Invoice
```
POST /api/v1/gst/einvoice/generate/:invoiceId
GET /api/v1/gst/einvoice/:invoiceId
```

#### E-Way Bill
```
POST /api/v1/gst/ewaybill/generate/:invoiceId
GET /api/v1/gst/ewaybill/:invoiceId
POST /api/v1/gst/ewaybill/:id/cancel
POST /api/v1/gst/ewaybill/:id/update
```

---

## Key Decisions

### 1. GSP Provider Selection
**Question:** Which GSP provider(s) to integrate first?
**Options:**
- ClearTax IRP (Most popular)
- Tally GSP
- Multiple providers (recommended)

**Recommendation:** Start with ClearTax, design for multiple providers

### 2. Timeline
**Question:** Extend timeline or reduce scope?
**Options:**
- Option A: 6-8 weeks (complete implementation) ✅ RECOMMENDED
- Option B: 4-6 weeks (core features only, defer advanced)
- Option C: 8-10 weeks (complete + polish)

**Decision:** Option A (6-8 weeks) for complete MSME solution

### 3. Phase 1 Scope
**Question:** Include GSP abstraction in Week 1?
**Options:**
- Yes: More complete, but longer Week 1 ✅ RECOMMENDED
- No: Defer to Week 3, but need refactoring

**Decision:** Yes, include in Week 1 for better architecture

---

## Success Criteria

### Technical
- ✅ GST service running and accessible
- ✅ GSTR-1 generates GSTN-compliant JSON (all sections)
- ✅ GSTR-3B generates accurate summary (all sections)
- ✅ E-Invoice IRN generation working
- ✅ E-Way Bill generation working
- ✅ Excel exports functional
- ✅ All tests passing (>80% coverage)

### Functional
- ✅ Users can generate GSTR-1 for any period (monthly/quarterly)
- ✅ Users can generate GSTR-3B for any period (monthly/quarterly)
- ✅ Users can export reports in JSON/Excel
- ✅ Users can generate IRN for invoices (if eligible)
- ✅ Users can generate E-Way Bills (if required)
- ✅ Reports are accurate and validated
- ✅ Composition scheme fully supported

### User Experience
- ✅ Intuitive UI for report generation
- ✅ Clear error messages
- ✅ Fast report generation (<5 seconds)
- ✅ Easy export functionality

---

## Risk Mitigation

### Technical Risks
1. **GSP Integration Complexity**
   - Mitigation: Start with one provider, add abstraction layer
   - Contingency: Manual IRN entry option

2. **GSTN Schema Changes**
   - Mitigation: Version the schema, keep it configurable
   - Contingency: Update schema as needed

3. **Performance with Large Datasets**
   - Mitigation: Implement pagination, caching
   - Contingency: Optimize queries, add indexes

### Business Risks
1. **E-Invoice Provider Downtime**
   - Mitigation: Retry logic, fallback providers
   - Contingency: Queue requests, process later

2. **Data Accuracy Concerns**
   - Mitigation: Extensive testing, validation
   - Contingency: Manual review option

---

## Next Steps

### Immediate (Today)
1. ✅ Review complete guide
2. ⏳ Get stakeholder approval
3. ⏳ Select GSP provider
4. ⏳ Get GSP credentials

### This Week (Before Implementation)
1. ⏳ Finalize timeline
2. ⏳ Assign team members
3. ⏳ Setup development environment
4. ⏳ Create project branch
5. ⏳ Review GSTN schema

### Week 1 Start
1. ⏳ Begin Task 1.1 (Service Setup)
2. ⏳ Daily standups
3. ⏳ Track progress in checklist
4. ⏳ Weekly review

---

## Notes Section

**Use this space to track issues, learnings, or important notes:**

---

**Document Status:** ✅ Single Source of Truth - Complete  
**Last Updated:** 2025-01-10  
**Next Review:** After Week 1 completion

