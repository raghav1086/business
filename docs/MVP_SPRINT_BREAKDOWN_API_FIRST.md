# MVP Sprint Breakdown - API-First with TDD

**Version:** 2.0  
**Created:** 2025-12-21  
**Approach:** API Development First (TDD) → UI Development Second

---

## 📋 Sprint Planning Overview

- **Sprint Duration:** 2 weeks (10 working days)
- **Development Approach:** Test-Driven Development (TDD)
- **Phase 1:** API Development (Sprints 1-8, 16 weeks)
- **Phase 2:** UI Development (Sprints 9-14, 12 weeks)
- **Phase 3:** Integration & Beta (Sprints 15-16, 4 weeks)

---

## Phase 1: API Development (Sprints 1-8)

### Sprint 1: Infrastructure & Foundation (2 weeks)

**Sprint Goal:** Setup NX workspace, Data Access Layer, and development infrastructure

#### Story 1.1: Initialize NX Workspace
**As a** developer  
**I want** NX monorepo setup with proper structure  
**So that** I can develop microservices efficiently

**Tasks:**
1. **Task 1.1.1: Setup NX Workspace**
   - Initialize NX workspace in `app/` folder
   - Configure TypeScript
   - Setup shared libraries structure
   - Configure ESLint and Prettier
   - Setup Husky for git hooks

2. **Task 1.1.2: Create Microservices Structure**
   - Create `apps/api-gateway` (NestJS)
   - Create `apps/auth-service` (NestJS)
   - Create `apps/business-service` (NestJS)
   - Create `apps/inventory-service` (NestJS)
   - Create `apps/invoice-service` (NestJS)
   - Create `apps/accounting-service` (NestJS)
   - Create `apps/gst-service` (NestJS)
   - Create `apps/payment-service` (NestJS)
   - Create `apps/notification-service` (NestJS)
   - Create `apps/sync-service` (NestJS)

3. **Task 1.1.3: Create Shared Libraries**
   - Create `libs/shared/dal` - Data Access Layer
   - Create `libs/shared/dto` - DTOs and interfaces
   - Create `libs/shared/utils` - Common utilities
   - Create `libs/shared/constants` - Constants and enums
   - Create `libs/shared/types` - TypeScript types
   - Create `libs/shared/validation` - Validation schemas

4. **Task 1.1.4: Setup Testing Infrastructure**
   - Configure Jest for all services
   - Setup test database (PostgreSQL)
   - Create test utilities and helpers
   - Setup coverage reporting
   - Configure CI/CD for tests

**Acceptance Criteria:**
- [ ] NX workspace initialized in `app/` folder
- [ ] All microservices created as NX apps
- [ ] Shared libraries structure created
- [ ] Jest configured and working
- [ ] Test database setup
- [ ] CI/CD pipeline runs tests on PR

---

#### Story 1.2: Setup Data Access Layer (DAL)
**As a** developer  
**I want** a shared Data Access Layer  
**So that** business logic can be shared between mobile and web

**Tasks:**
1. **Task 1.2.1: Create DAL Base Classes**
   - Create base repository interface
   - Create base repository implementation
   - Create base entity class
   - Create query builder utilities
   - Create transaction management

2. **Task 1.2.2: Setup Database Connection**
   - Configure TypeORM for each service
   - Setup database migrations (TypeORM migrations)
   - Create database connection utilities
   - Setup connection pooling
   - Configure database logging

3. **Task 1.2.3: Create DAL for Business Service**
   - Create Business entity (matching DATABASE_SCHEMA.md)
   - Create BusinessRepository with TDD
   - Write tests for CRUD operations
   - Implement repository methods
   - Test database transactions

**Acceptance Criteria:**
- [ ] DAL base classes created
- [ ] Database connection working
- [ ] BusinessRepository implemented with tests
- [ ] All tests passing (100% coverage for DAL)
- [ ] Migrations working

---

#### Story 1.3: Setup Development Environment
**As a** developer  
**I want** local development environment  
**So that** I can run and test services locally

**Tasks:**
1. **Task 1.3.1: Docker Setup**
   - Create docker-compose.yml
   - Setup PostgreSQL container
   - Setup Redis container (for caching)
   - Configure environment variables
   - Create .env.example file

2. **Task 1.3.2: Database Setup**
   - Create database initialization scripts
   - Create seed data scripts
   - Setup migration scripts
   - Create database reset script

3. **Task 1.3.3: Development Scripts**
   - Create `npm run dev` for local development
   - Create `npm run test` for running tests
   - Create `npm run db:migrate` for migrations
   - Create `npm run db:seed` for seed data
   - Create `npm run db:reset` for resetting database

**Acceptance Criteria:**
- [ ] docker-compose.yml working
- [ ] All services can run locally
- [ ] Database accessible from all services
- [ ] Seed data loads correctly
- [ ] Development scripts work

---

### Sprint 2: Business Service - Foundation (2 weeks)

**Sprint Goal:** Complete Business Service API with TDD (First service to build)

#### Story 2.1: Business Entity & Repository (TDD)
**As a** developer  
**I want** Business entity and repository with tests  
**So that** I can manage business data

**Tasks:**
1. **Task 2.1.1: Write Tests for Business Entity**
   - Test entity creation
   - Test entity validation
   - Test entity relationships
   - Test entity methods

2. **Task 2.1.2: Write Tests for BusinessRepository**
   - Test create business
   - Test find business by ID
   - Test find business by owner
   - Test update business
   - Test delete business (soft delete)
   - Test find businesses by GSTIN
   - Test business search

3. **Task 2.1.3: Implement Business Entity**
   - Create Business entity class (TypeORM)
   - Add all fields from DATABASE_SCHEMA.md
   - Add validation decorators
   - Add relationships (business_users)
   - Implement entity methods

4. **Task 2.1.4: Implement BusinessRepository**
   - Implement create method
   - Implement find methods
   - Implement update method
   - Implement delete method
   - Implement search method
   - All tests must pass

**Acceptance Criteria:**
- [ ] All entity tests written and passing
- [ ] All repository tests written and passing
- [ ] Business entity matches DATABASE_SCHEMA.md
- [ ] Repository implements all CRUD operations
- [ ] 100% test coverage for repository

---

#### Story 2.2: Business Service Layer (TDD)
**As a** developer  
**I want** Business service with business logic  
**So that** I can implement business rules

**Tasks:**
1. **Task 2.2.1: Write Tests for BusinessService**
   - Test create business
   - Test update business
   - Test get business
   - Test list businesses for owner
   - Test GSTIN validation
   - Test business deletion
   - Test business search

2. **Task 2.2.2: Implement BusinessService**
   - Implement create business logic
   - Implement update business logic
   - Implement GSTIN validation
   - Implement business rules
   - Handle errors appropriately
   - All tests must pass

3. **Task 2.2.3: Create Business DTOs**
   - Create CreateBusinessDto
   - Create UpdateBusinessDto
   - Create BusinessResponseDto
   - Add validation decorators
   - Write tests for DTOs

**Acceptance Criteria:**
- [ ] All service tests written and passing
- [ ] Business logic implemented correctly
- [ ] GSTIN validation working
- [ ] DTOs created with validation
- [ ] 100% test coverage for service

---

#### Story 2.3: Business API Endpoints (TDD)
**As a** developer  
**I want** REST API endpoints for business  
**So that** frontend can consume the API

**Tasks:**
1. **Task 2.3.1: Write Tests for BusinessController**
   - Test POST /api/v1/businesses (create)
   - Test GET /api/v1/businesses/:id (get by ID)
   - Test GET /api/v1/businesses (list for owner)
   - Test PATCH /api/v1/businesses/:id (update)
   - Test DELETE /api/v1/businesses/:id (delete)
   - Test authentication/authorization
   - Test validation errors
   - Test error handling

2. **Task 2.3.2: Implement BusinessController**
   - Create controller with NestJS decorators
   - Implement all endpoints
   - Add authentication guards
   - Add authorization checks
   - Add request validation
   - Add error handling
   - All tests must pass

3. **Task 2.3.3: Create API Documentation**
   - Add Swagger/OpenAPI decorators
   - Document all endpoints
   - Document request/response schemas
   - Document error responses
   - Generate OpenAPI spec

**Acceptance Criteria:**
- [ ] All controller tests written and passing
- [ ] All endpoints implemented
- [ ] Authentication working
- [ ] Authorization working
- [ ] Validation working
- [ ] Swagger documentation complete
- [ ] 100% test coverage for controller

---

### Sprint 3: Auth Service - OTP & Authentication (2 weeks)

**Sprint Goal:** Complete Authentication API with TDD

#### Story 3.1: OTP Service (TDD)
**As a** developer  
**I want** OTP generation and verification service  
**So that** users can authenticate

**Tasks:**
1. **Task 3.1.1: Write Tests for OtpService**
   - Test OTP generation (6 digits)
   - Test OTP hashing
   - Test OTP verification
   - Test OTP expiry
   - Test rate limiting

2. **Task 3.1.2: Implement OtpService**
   - Implement generateOtp()
   - Implement hashOtp()
   - Implement verifyOtp()
   - Implement rate limiting
   - All tests must pass

3. **Task 3.1.3: Write Tests for OtpRepository**
   - Test store OTP request
   - Test find OTP request
   - Test update OTP request
   - Test delete expired OTPs

4. **Task 3.1.4: Implement OtpRepository**
   - Implement repository methods
   - All tests must pass

**Acceptance Criteria:**
- [ ] All OTP service tests passing
- [ ] OTP generation working
- [ ] OTP hashing secure
- [ ] Rate limiting working
- [ ] 100% test coverage

---

#### Story 3.2: OTP Request API (TDD)
**As a** developer  
**I want** API endpoint to request OTP  
**So that** users can receive OTP

**Tasks:**
1. **Task 3.2.1: Write Tests for SendOtp Endpoint**
   - Test valid phone number
   - Test invalid phone number
   - Test rate limiting
   - Test SMS integration (mock)
   - Test response format

2. **Task 3.2.2: Implement SendOtp Endpoint**
   - Create POST /api/v1/auth/send-otp
   - Validate phone number
   - Check rate limit
   - Generate and store OTP
   - Send SMS (integrate MSG91)
   - Return OTP ID
   - All tests must pass

3. **Task 3.2.3: SMS Integration**
   - Setup MSG91 account (test credentials)
   - Create SMS service
   - Write tests for SMS service
   - Implement SMS sending
   - Mock for development

**Acceptance Criteria:**
- [ ] All endpoint tests passing
- [ ] Phone validation working
- [ ] Rate limiting working
- [ ] SMS integration working (or mocked)
- [ ] Response format correct

---

#### Story 3.3: OTP Verification & User Creation (TDD)
**As a** developer  
**I want** API endpoint to verify OTP and create/login user  
**So that** users can authenticate

**Tasks:**
1. **Task 3.3.1: Write Tests for VerifyOtp Endpoint**
   - Test valid OTP verification
   - Test invalid OTP
   - Test expired OTP
   - Test max attempts exceeded
   - Test new user creation
   - Test existing user login
   - Test JWT token generation

2. **Task 3.3.2: Implement VerifyOtp Endpoint**
   - Create POST /api/v1/auth/verify-otp
   - Verify OTP
   - Create or find user
   - Generate JWT tokens
   - Store refresh token
   - Return user and tokens
   - All tests must pass

3. **Task 3.3.3: JWT Token Service**
   - Write tests for JWT service
   - Implement access token generation
   - Implement refresh token generation
   - Implement token validation
   - All tests must pass

**Acceptance Criteria:**
- [ ] All endpoint tests passing
- [ ] OTP verification working
- [ ] User creation working
- [ ] JWT tokens generated correctly
- [ ] Refresh token stored
- [ ] 100% test coverage

---

#### Story 3.4: Token Refresh API (TDD)
**As a** developer  
**I want** API endpoint to refresh tokens  
**So that** users can maintain sessions

**Tasks:**
1. **Task 3.4.1: Write Tests for RefreshToken Endpoint**
   - Test valid refresh token
   - Test invalid refresh token
   - Test expired refresh token
   - Test revoked refresh token
   - Test new tokens generation

2. **Task 3.4.2: Implement RefreshToken Endpoint**
   - Create POST /api/v1/auth/refresh-token
   - Validate refresh token
   - Generate new tokens
   - Invalidate old refresh token
   - Return new tokens
   - All tests must pass

**Acceptance Criteria:**
- [ ] All endpoint tests passing
- [ ] Token refresh working
- [ ] Old tokens invalidated
- [ ] 100% test coverage

---

### Sprint 4: Auth Service - User Management (2 weeks)

**Sprint Goal:** Complete user management APIs

#### Story 4.1: User Profile API (TDD)
**As a** developer  
**I want** API endpoints for user profile management  
**So that** users can manage their profile

**Tasks:**
1. **Task 4.1.1: Write Tests for User Profile Endpoints**
   - Test GET /api/v1/users/profile
   - Test PATCH /api/v1/users/profile
   - Test POST /api/v1/users/profile/avatar
   - Test validation
   - Test authorization

2. **Task 4.1.2: Implement User Profile Endpoints**
   - Implement GET endpoint
   - Implement PATCH endpoint
   - Implement avatar upload
   - Add validation
   - Add authorization
   - All tests must pass

**Acceptance Criteria:**
- [ ] All endpoint tests passing
- [ ] Profile management working
- [ ] Avatar upload working
- [ ] 100% test coverage

---

#### Story 4.2: Session Management API (TDD)
**As a** developer  
**I want** API endpoints for session management  
**So that** users can manage their active sessions

**Tasks:**
1. **Task 4.2.1: Write Tests for Session Endpoints**
   - Test GET /api/v1/auth/sessions (list sessions)
   - Test DELETE /api/v1/auth/sessions/:id (logout session)
   - Test DELETE /api/v1/auth/sessions/all (logout all)

2. **Task 4.2.2: Implement Session Endpoints**
   - Implement list sessions
   - Implement logout session
   - Implement logout all
   - All tests must pass

**Acceptance Criteria:**
- [ ] All endpoint tests passing
- [ ] Session management working
- [ ] 100% test coverage

---

### Sprint 5: Party Service (2 weeks)

**Sprint Goal:** Complete Party Management API with TDD

#### Story 5.1: Party Entity & Repository (TDD)
**As a** developer  
**I want** Party entity and repository  
**So that** I can manage party data

**Tasks:**
1. **Task 5.1.1: Write Tests for Party Entity & Repository**
   - Test entity creation
   - Test CRUD operations
   - Test search functionality
   - Test filtering (customers/suppliers)

2. **Task 5.1.2: Implement Party Entity & Repository**
   - Create Party entity
   - Implement PartyRepository
   - All tests must pass

**Acceptance Criteria:**
- [ ] All tests passing
- [ ] 100% test coverage

---

#### Story 5.2: Party Service & API (TDD)
**As a** developer  
**I want** Party service and API endpoints  
**So that** frontend can manage parties

**Tasks:**
1. **Task 5.2.1: Write Tests for PartyService**
   - Test create party
   - Test update party
   - Test get party
   - Test list parties
   - Test search parties
   - Test delete party

2. **Task 5.2.2: Implement PartyService**
   - Implement all service methods
   - All tests must pass

3. **Task 5.2.3: Write Tests for PartyController**
   - Test all endpoints
   - Test validation
   - Test authorization

4. **Task 5.2.4: Implement PartyController**
   - Implement all endpoints
   - All tests must pass

**Acceptance Criteria:**
- [ ] All tests passing
- [ ] All endpoints working
- [ ] 100% test coverage

---

#### Story 5.3: Party Ledger API (TDD)
**As a** developer  
**I want** API endpoint for party ledger  
**So that** frontend can display ledger

**Tasks:**
1. **Task 5.3.1: Write Tests for Party Ledger**
   - Test GET /api/v1/parties/:id/ledger
   - Test date range filtering
   - Test balance calculation
   - Test transaction entries

2. **Task 5.3.2: Implement Party Ledger**
   - Implement ledger calculation
   - Implement endpoint
   - All tests must pass

**Acceptance Criteria:**
- [ ] All tests passing
- [ ] Ledger calculation accurate
- [ ] 100% test coverage

---

### Sprint 6: Inventory Service (2 weeks)

**Sprint Goal:** Complete Inventory Management API with TDD

#### Story 6.1: Item Entity & Repository (TDD)
**As a** developer  
**I want** Item entity and repository  
**So that** I can manage inventory items

**Tasks:**
1. **Task 6.1.1: Write Tests for Item Entity & Repository**
   - Test entity creation
   - Test CRUD operations
   - Test search functionality
   - Test category filtering

2. **Task 6.1.2: Implement Item Entity & Repository**
   - Create Item entity
   - Create Category entity
   - Implement ItemRepository
   - All tests must pass

**Acceptance Criteria:**
- [ ] All tests passing
- [ ] 100% test coverage

---

#### Story 6.2: Stock Management API (TDD)
**As a** developer  
**I want** API endpoints for stock management  
**So that** frontend can manage stock

**Tasks:**
1. **Task 6.2.1: Write Tests for Stock Management**
   - Test stock adjustment
   - Test stock query
   - Test low stock alerts
   - Test stock history

2. **Task 6.2.2: Implement Stock Management**
   - Implement StockService
   - Implement StockController
   - All tests must pass

**Acceptance Criteria:**
- [ ] All tests passing
- [ ] Stock management working
- [ ] 100% test coverage

---

### Sprint 7: Invoice Service - Part 1 (2 weeks)

**Sprint Goal:** Complete Invoice Creation API with TDD

#### Story 7.1: Invoice Entity & Repository (TDD)
**As a** developer  
**I want** Invoice entity and repository  
**So that** I can manage invoices

**Tasks:**
1. **Task 7.1.1: Write Tests for Invoice Entity & Repository**
   - Test entity creation
   - Test CRUD operations
   - Test invoice number generation
   - Test invoice search

2. **Task 7.1.2: Implement Invoice Entity & Repository**
   - Create Invoice entity
   - Create InvoiceItem entity
   - Implement InvoiceRepository
   - All tests must pass

**Acceptance Criteria:**
- [ ] All tests passing
- [ ] 100% test coverage

---

#### Story 7.2: GST Calculation Service (TDD)
**As a** developer  
**I want** GST calculation service  
**So that** invoices have correct tax calculations

**Tasks:**
1. **Task 7.2.1: Write Tests for GST Calculation**
   - Test CGST/SGST for intrastate
   - Test IGST for interstate
   - Test different tax rates (5%, 12%, 18%, 28%)
   - Test tax rounding
   - Test tax-inclusive pricing

2. **Task 7.2.2: Implement GST Calculation Service**
   - Implement calculateGst()
   - Implement calculateInvoiceTotal()
   - All tests must pass

**Acceptance Criteria:**
- [ ] All tests passing
- [ ] GST calculations accurate
- [ ] 100% test coverage

---

#### Story 7.3: Invoice Creation API (TDD)
**As a** developer  
**I want** API endpoint to create invoices  
**So that** frontend can create invoices

**Tasks:**
1. **Task 7.3.1: Write Tests for Create Invoice Endpoint**
   - Test create invoice with items
   - Test GST calculation
   - Test invoice number generation
   - Test validation
   - Test stock deduction (if applicable)

2. **Task 7.3.2: Implement Create Invoice Endpoint**
   - Create POST /api/v1/invoices
   - Implement invoice creation logic
   - Calculate GST
   - Generate invoice number
   - Deduct stock
   - All tests must pass

**Acceptance Criteria:**
- [ ] All tests passing
- [ ] Invoice creation working
- [ ] GST calculations correct
- [ ] 100% test coverage

---

### Sprint 8: Invoice Service - Part 2 & Other Services (2 weeks)

**Sprint Goal:** Complete remaining invoice APIs and other services

#### Story 8.1: Invoice List & Detail API (TDD)
**As a** developer  
**I want** API endpoints for invoice list and detail  
**So that** frontend can display invoices

**Tasks:**
1. **Task 8.1.1: Write Tests for Invoice List/Detail**
   - Test GET /api/v1/invoices (list)
   - Test GET /api/v1/invoices/:id (detail)
   - Test filtering and search
   - Test pagination

2. **Task 8.1.2: Implement Invoice List/Detail**
   - Implement list endpoint
   - Implement detail endpoint
   - All tests must pass

**Acceptance Criteria:**
- [ ] All tests passing
- [ ] 100% test coverage

---

#### Story 8.2: Payment Service API (TDD)
**As a** developer  
**I want** Payment recording API  
**So that** frontend can record payments

**Tasks:**
1. **Task 8.2.1: Write Tests for Payment API**
   - Test record payment
   - Test payment against invoice
   - Test payment list

2. **Task 8.2.2: Implement Payment API**
   - Implement payment endpoints
   - All tests must pass

**Acceptance Criteria:**
- [ ] All tests passing
- [ ] 100% test coverage

---

#### Story 8.3: Accounting Service API (TDD)
**As a** developer  
**I want** Accounting APIs  
**So that** frontend can display accounting data

**Tasks:**
1. **Task 8.3.1: Write Tests for Accounting API**
   - Test chart of accounts
   - Test transactions
   - Test ledger entries

2. **Task 8.3.2: Implement Accounting API**
   - Implement accounting endpoints
   - All tests must pass

**Acceptance Criteria:**
- [ ] All tests passing
- [ ] 100% test coverage

---

#### Story 8.4: GST Service API (TDD)
**As a** developer  
**I want** GST report generation APIs  
**So that** frontend can generate GST reports

**Tasks:**
1. **Task 8.4.1: Write Tests for GST API**
   - Test GSTR-1 generation
   - Test GSTR-3B generation
   - Test E-Invoice generation

2. **Task 8.4.2: Implement GST API**
   - Implement GST report endpoints
   - All tests must pass

**Acceptance Criteria:**
- [ ] All tests passing
- [ ] 100% test coverage

---

## Phase 2: UI Development (Sprints 9-14)

### Sprint 9: Mobile App Foundation (2 weeks)

**Sprint Goal:** Setup React Native app and basic navigation

#### Story 9.1: React Native App Setup
**As a** developer  
**I want** React Native app setup  
**So that** I can start building UI

**Tasks:**
1. **Task 9.1.1: Setup React Native App**
   - Initialize React Native app in NX workspace
   - Configure navigation (React Navigation)
   - Setup API client (Axios)
   - Setup state management (Redux/Zustand)
   - Configure environment variables

2. **Task 9.1.2: Create Base Components**
   - Create Button component
   - Create Input component
   - Create Card component
   - Create Loading component
   - Create Error component

3. **Task 9.1.3: Setup API Integration**
   - Create API service layer
   - Setup authentication interceptor
   - Setup error handling
   - Setup token refresh

**Acceptance Criteria:**
- [ ] React Native app running
- [ ] Navigation working
- [ ] API client configured
- [ ] Base components created

---

### Sprint 10: Authentication UI (2 weeks)

**Sprint Goal:** Build authentication screens

#### Story 10.1: Login & Registration UI
**As a** developer  
**I want** login and registration screens  
**So that** users can authenticate

**Tasks:**
1. **Task 10.1.1: Build Phone Login Screen**
   - Create phone input screen
   - Integrate with send-otp API
   - Handle errors
   - Add loading states

2. **Task 10.1.2: Build OTP Verification Screen**
   - Create OTP input component
   - Integrate with verify-otp API
   - Handle errors
   - Add resend functionality

3. **Task 10.1.3: Build Welcome/Onboarding Screen**
   - Create onboarding screens
   - Add skip functionality
   - Store onboarding status

**Acceptance Criteria:**
- [ ] All screens working
- [ ] API integration working
- [ ] Error handling working
- [ ] Navigation working

---

### Sprint 11: Business Setup UI (2 weeks)

**Sprint Goal:** Build business setup screens

#### Story 11.1: Business Setup UI
**As a** developer  
**I want** business setup screens  
**So that** users can setup their business

**Tasks:**
1. **Task 11.1.1: Build Business Setup Form**
   - Create business setup screen
   - Integrate with business API
   - Add GSTIN validation
   - Handle errors

2. **Task 11.1.2: Build Business List Screen**
   - Create business list screen
   - Integrate with business API
   - Add business switching

**Acceptance Criteria:**
- [ ] Business setup working
- [ ] API integration working
- [ ] Validation working

---

### Sprint 12: Party & Inventory UI (2 weeks)

**Sprint Goal:** Build party and inventory management screens

#### Story 12.1: Party Management UI
**As a** developer  
**I want** party management screens  
**So that** users can manage parties

**Tasks:**
1. **Task 12.1.1: Build Party List Screen**
   - Create party list screen
   - Integrate with party API
   - Add search and filter

2. **Task 12.1.2: Build Add/Edit Party Screen**
   - Create party form
   - Integrate with party API
   - Handle validation

3. **Task 12.1.3: Build Party Detail Screen**
   - Create party detail screen
   - Integrate with party API
   - Show ledger

**Acceptance Criteria:**
- [ ] All screens working
- [ ] API integration working

---

#### Story 12.2: Inventory Management UI
**As a** developer  
**I want** inventory management screens  
**So that** users can manage inventory

**Tasks:**
1. **Task 12.2.1: Build Item List Screen**
   - Create item list screen
   - Integrate with inventory API
   - Add search and filter

2. **Task 12.2.2: Build Add/Edit Item Screen**
   - Create item form
   - Integrate with inventory API
   - Handle validation

**Acceptance Criteria:**
- [ ] All screens working
- [ ] API integration working

---

### Sprint 13: Invoice UI (2 weeks)

**Sprint Goal:** Build invoice creation and management screens

#### Story 13.1: Invoice Creation UI
**As a** developer  
**I want** invoice creation screens  
**So that** users can create invoices

**Tasks:**
1. **Task 13.1.1: Build Invoice Creation Flow**
   - Create multi-step invoice form
   - Step 1: Party selection
   - Step 2: Add items
   - Step 3: Review
   - Step 4: Save/Share
   - Integrate with invoice API

2. **Task 13.1.2: Build Invoice List Screen**
   - Create invoice list screen
   - Integrate with invoice API
   - Add filters

3. **Task 13.1.3: Build Invoice Detail Screen**
   - Create invoice detail screen
   - Integrate with invoice API
   - Add PDF preview

**Acceptance Criteria:**
- [ ] Invoice creation working
- [ ] All screens working
- [ ] API integration working

---

### Sprint 14: Reports & Dashboard UI (2 weeks)

**Sprint Goal:** Build reports and dashboard screens

#### Story 14.1: Dashboard UI
**As a** developer  
**I want** dashboard screen  
**So that** users can see business overview

**Tasks:**
1. **Task 14.1.1: Build Dashboard Screen**
   - Create dashboard layout
   - Add stats cards
   - Add recent transactions
   - Integrate with APIs

**Acceptance Criteria:**
- [ ] Dashboard working
- [ ] API integration working

---

#### Story 14.2: Reports UI
**As a** developer  
**I want** reports screens  
**So that** users can view reports

**Tasks:**
1. **Task 14.2.1: Build Reports Screen**
   - Create reports list
   - Add GST reports
   - Add financial reports
   - Integrate with APIs

**Acceptance Criteria:**
- [ ] Reports working
- [ ] API integration working

---

## Phase 3: Integration & Beta (Sprints 15-16)

### Sprint 15: Integration & Testing (2 weeks)

**Sprint Goal:** Integration testing and bug fixes

#### Story 15.1: End-to-End Testing
**As a** developer  
**I want** E2E tests  
**So that** I can verify complete flows

**Tasks:**
1. **Task 15.1.1: Write E2E Tests**
   - Test registration flow
   - Test invoice creation flow
   - Test payment recording flow
   - Test GST report generation

2. **Task 15.1.2: Fix Integration Issues**
   - Fix API integration issues
   - Fix UI issues
   - Fix data flow issues

**Acceptance Criteria:**
- [ ] All E2E tests passing
- [ ] No critical bugs

---

### Sprint 16: Polish & Beta Prep (2 weeks)

**Sprint Goal:** Final polish and beta preparation

#### Story 16.1: Performance Optimization
**As a** developer  
**I want** optimized performance  
**So that** app is fast

**Tasks:**
1. **Task 16.1.1: Optimize API Performance**
   - Optimize database queries
   - Add caching
   - Optimize response times

2. **Task 16.1.2: Optimize UI Performance**
   - Optimize rendering
   - Add lazy loading
   - Optimize images

**Acceptance Criteria:**
- [ ] Performance targets met
- [ ] App loads quickly

---

#### Story 16.2: Beta Preparation
**As a** developer  
**I want** beta-ready app  
**So that** we can launch beta

**Tasks:**
1. **Task 16.2.1: Final Testing**
   - Complete testing
   - Fix all critical bugs
   - Fix high-priority bugs

2. **Task 16.2.2: Documentation**
   - Complete API documentation
   - Complete user documentation
   - Create help guides

**Acceptance Criteria:**
- [ ] All critical bugs fixed
- [ ] Documentation complete
- [ ] Ready for beta

---

## 📊 Summary

### Development Approach
- **TDD First**: Write tests before implementation
- **API First**: Complete APIs before UI
- **Business Service First**: Start with Business service
- **100% Test Coverage**: Aim for 100% coverage on critical services

### Key Principles
1. Red → Green → Refactor (TDD cycle)
2. One service at a time
3. Document as you go (Swagger)
4. Test everything
5. Incremental development

### Success Metrics
- **Phase 1**: All APIs implemented with 80%+ test coverage
- **Phase 2**: All UI screens implemented and integrated
- **Phase 3**: E2E tests passing, ready for beta

---

**Let's build this! 🎯**

