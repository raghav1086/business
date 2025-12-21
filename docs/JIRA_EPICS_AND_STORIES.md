# Vyapar App - Jira Epics & User Stories

## Epic Overview

| Epic ID | Epic Name | Priority | Sprint Target |
|---------|-----------|----------|---------------|
| VYAPAR-E01 | Project Setup & Infrastructure | P0 | Sprint 1-2 |
| VYAPAR-E02 | Authentication & User Management | P0 | Sprint 2-3 |
| VYAPAR-E03 | Business & Party Management | P0 | Sprint 3-4 |
| VYAPAR-E04 | Inventory Management | P0 | Sprint 4-5 |
| VYAPAR-E05 | Invoice & Billing | P0 | Sprint 5-7 |
| VYAPAR-E06 | Accounting & Ledger | P1 | Sprint 7-9 |
| VYAPAR-E07 | GST Compliance & Reports | P1 | Sprint 9-10 |
| VYAPAR-E08 | Offline Sync Engine | P0 | Sprint 4-8 |
| VYAPAR-E09 | Notifications & Integrations | P2 | Sprint 10-11 |
| VYAPAR-E10 | Dashboard & Analytics | P2 | Sprint 11-12 |
| VYAPAR-E11 | Settings & Configuration | P1 | Sprint 8-9 |
| VYAPAR-E12 | Testing & QA | P0 | Continuous |

---

## EPIC 1: Project Setup & Infrastructure (VYAPAR-E01)

### User Stories

#### VYAPAR-101: Initialize NX Monorepo Workspace
**As a** developer  
**I want** a properly configured NX monorepo workspace  
**So that** I can develop frontend and backend in a unified codebase

**Acceptance Criteria:**
- [ ] NX workspace initialized with latest stable version
- [ ] TypeScript configured with strict mode
- [ ] ESLint + Prettier configured with shared rules
- [ ] Husky pre-commit hooks configured
- [ ] Commit lint with conventional commits enabled
- [ ] Path aliases configured in tsconfig.base.json
- [ ] README with setup instructions exists

**Story Points:** 5  
**Sprint:** 1

---

#### VYAPAR-102: Setup React Native Mobile Application
**As a** developer  
**I want** a React Native app scaffolded within NX  
**So that** I can build the mobile frontend

**Acceptance Criteria:**
- [ ] React Native 0.73+ app created in apps/mobile
- [ ] Metro bundler configured correctly
- [ ] iOS and Android projects generated
- [ ] App runs on iOS simulator without errors
- [ ] App runs on Android emulator without errors
- [ ] Environment variables setup (.env.development, .env.production)
- [ ] Splash screen and app icon placeholders added

**Story Points:** 5  
**Sprint:** 1

---

#### VYAPAR-103: Setup NestJS API Gateway
**As a** developer  
**I want** an API Gateway service  
**So that** it can route requests to appropriate microservices

**Acceptance Criteria:**
- [ ] NestJS app created in apps/api-gateway
- [ ] Health check endpoint /health returns 200
- [ ] Swagger documentation available at /api/docs
- [ ] CORS configured for mobile app origins
- [ ] Rate limiting middleware implemented (100 req/min)
- [ ] Request logging with correlation IDs
- [ ] Global exception filter configured

**Story Points:** 8  
**Sprint:** 1

---

#### VYAPAR-104: Setup Auth Microservice
**As a** developer  
**I want** a dedicated authentication service  
**So that** user authentication is handled independently

**Acceptance Criteria:**
- [ ] NestJS app created in apps/auth-service
- [ ] Prisma configured with PostgreSQL connection
- [ ] User schema defined with migrations
- [ ] JWT module configured with RS256
- [ ] Service communicates with API Gateway
- [ ] Health endpoint responds correctly
- [ ] Unit tests setup with Jest

**Story Points:** 8  
**Sprint:** 1

---

#### VYAPAR-105: Setup Business Microservice
**As a** developer  
**I want** a business management service  
**So that** business profiles and parties can be managed

**Acceptance Criteria:**
- [ ] NestJS app created in apps/business-service
- [ ] Prisma schemas for Business, Party, Staff defined
- [ ] Database migrations created and tested
- [ ] CRUD endpoints scaffolded
- [ ] Inter-service communication with auth-service working
- [ ] Validation pipes configured

**Story Points:** 5  
**Sprint:** 2

---

#### VYAPAR-106: Setup Inventory Microservice
**As a** developer  
**I want** an inventory management service  
**So that** items and stock can be tracked

**Acceptance Criteria:**
- [ ] NestJS app created in apps/inventory-service
- [ ] Prisma schemas for Item, Category, Unit defined
- [ ] Stock tracking fields included in schema
- [ ] HSN/SAC code support in item schema
- [ ] Database migrations created

**Story Points:** 5  
**Sprint:** 2

---

#### VYAPAR-107: Setup Invoice Microservice
**As a** developer  
**I want** an invoicing service  
**So that** billing operations can be handled

**Acceptance Criteria:**
- [ ] NestJS app created in apps/invoice-service
- [ ] Prisma schemas for Invoice, InvoiceItem, Quotation defined
- [ ] Invoice number generation logic implemented
- [ ] Tax calculation utilities created
- [ ] PDF generation capability added

**Story Points:** 8  
**Sprint:** 2

---

#### VYAPAR-108: Setup Shared Libraries
**As a** developer  
**I want** shared libraries for common code  
**So that** code duplication is minimized

**Acceptance Criteria:**
- [ ] libs/shared/dto created with common DTOs
- [ ] libs/shared/interfaces created with TypeScript interfaces
- [ ] libs/shared/constants created with app constants
- [ ] libs/shared/utils created with helper functions
- [ ] All libraries are properly exported and importable
- [ ] Circular dependency check passes

**Story Points:** 5  
**Sprint:** 1

---

#### VYAPAR-109: Setup Docker Development Environment
**As a** developer  
**I want** a Docker Compose setup  
**So that** I can run all services locally with one command

**Acceptance Criteria:**
- [ ] docker-compose.yml created with all services
- [ ] PostgreSQL container configured with volumes
- [ ] Redis container configured
- [ ] RabbitMQ container configured (optional for dev)
- [ ] All services can start with `docker-compose up`
- [ ] Hot reload works for development
- [ ] README includes Docker setup instructions

**Story Points:** 5  
**Sprint:** 2

---

#### VYAPAR-110: Setup CI/CD Pipeline
**As a** developer  
**I want** automated CI/CD pipelines  
**So that** code quality and deployments are automated

**Acceptance Criteria:**
- [ ] GitHub Actions workflow for PR checks (lint, test, build)
- [ ] Affected commands used for efficient CI
- [ ] Docker image build pipeline created
- [ ] Staging deployment workflow created
- [ ] Branch protection rules documented
- [ ] Code coverage reporting enabled (>70% threshold)

**Story Points:** 8  
**Sprint:** 2

---

## EPIC 2: Authentication & User Management (VYAPAR-E02)

### User Stories

#### VYAPAR-201: User Registration with Phone OTP
**As a** new user  
**I want** to register using my phone number  
**So that** I can quickly onboard without remembering passwords

**Acceptance Criteria:**
- [ ] User can enter 10-digit Indian phone number
- [ ] Phone number validation (starts with 6-9)
- [ ] OTP sent via SMS gateway (MSG91/Twilio)
- [ ] OTP expires in 5 minutes
- [ ] Maximum 3 OTP requests per hour per number
- [ ] User record created on successful verification
- [ ] JWT tokens (access + refresh) returned
- [ ] Error messages shown for invalid inputs

**API Endpoints:**
- `POST /api/auth/send-otp` - Request OTP
- `POST /api/auth/verify-otp` - Verify & Register/Login

**Story Points:** 8  
**Sprint:** 2

---

#### VYAPAR-202: User Login with OTP
**As a** returning user  
**I want** to login using OTP  
**So that** I can access my account securely

**Acceptance Criteria:**
- [ ] Existing user can request OTP
- [ ] OTP verified against stored hash
- [ ] Access token (15 min expiry) issued
- [ ] Refresh token (30 days expiry) issued
- [ ] Last login timestamp updated
- [ ] Device info logged for security
- [ ] Rate limiting prevents brute force (5 attempts/15 min)

**Story Points:** 5  
**Sprint:** 2

---

#### VYAPAR-203: Token Refresh Mechanism
**As a** user  
**I want** my session to be extended automatically  
**So that** I don't have to login repeatedly

**Acceptance Criteria:**
- [ ] Refresh token endpoint available
- [ ] Old refresh token invalidated on use (rotation)
- [ ] New access + refresh tokens issued
- [ ] Invalid/expired refresh token returns 401
- [ ] Multiple device sessions supported
- [ ] User can view active sessions

**API Endpoint:**
- `POST /api/auth/refresh-token`

**Story Points:** 5  
**Sprint:** 3

---

#### VYAPAR-204: User Profile Management
**As a** user  
**I want** to manage my profile information  
**So that** my details are up to date

**Acceptance Criteria:**
- [ ] User can update name
- [ ] User can update email (optional)
- [ ] User can upload profile picture (S3/Cloudinary)
- [ ] Profile picture resized to standard dimensions
- [ ] Phone number change requires re-verification
- [ ] Profile data syncs across devices

**API Endpoints:**
- `GET /api/users/profile`
- `PATCH /api/users/profile`
- `POST /api/users/profile/avatar`

**Story Points:** 5  
**Sprint:** 3

---

#### VYAPAR-205: Logout & Session Management
**As a** user  
**I want** to logout and manage my sessions  
**So that** I can secure my account

**Acceptance Criteria:**
- [ ] Logout invalidates current session tokens
- [ ] "Logout from all devices" option available
- [ ] Active sessions list shows device info
- [ ] User can revoke specific sessions
- [ ] Local app data cleared on logout

**API Endpoints:**
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/sessions`
- `DELETE /api/auth/sessions/:id`

**Story Points:** 5  
**Sprint:** 3

---

#### VYAPAR-206: Mobile App Auth Flow UI
**As a** mobile user  
**I want** a smooth authentication UI  
**So that** onboarding is seamless

**Acceptance Criteria:**
- [ ] Welcome screen with "Get Started" CTA
- [ ] Phone number input with country code (+91)
- [ ] OTP input with auto-focus and auto-submit
- [ ] Resend OTP button with countdown timer
- [ ] Loading states during API calls
- [ ] Error handling with user-friendly messages
- [ ] Success animation on login
- [ ] Secure storage of tokens (Keychain/Keystore)

**Story Points:** 8  
**Sprint:** 3

---

## EPIC 3: Business & Party Management (VYAPAR-E03)

### User Stories

#### VYAPAR-301: Create Business Profile
**As a** business owner  
**I want** to create my business profile  
**So that** my invoices have correct business details

**Acceptance Criteria:**
- [ ] Business name (required, 3-100 chars)
- [ ] Business type dropdown (Retailer, Wholesaler, Manufacturer, Service)
- [ ] GSTIN validation (15-char format with checksum)
- [ ] Business address with pincode
- [ ] State auto-populated from pincode
- [ ] Phone number (optional, secondary)
- [ ] Email (optional)
- [ ] Business logo upload (optional)
- [ ] Bank details for invoices (optional)
- [ ] UPI ID (optional)

**API Endpoint:**
- `POST /api/business`

**Story Points:** 8  
**Sprint:** 3

---

#### VYAPAR-302: Edit Business Profile
**As a** business owner  
**I want** to update my business details  
**So that** changes reflect in future invoices

**Acceptance Criteria:**
- [ ] All fields editable except GSTIN (requires verification)
- [ ] GSTIN change triggers re-verification flow
- [ ] Logo can be changed/removed
- [ ] Changes saved with timestamp
- [ ] Audit log maintained for compliance

**API Endpoint:**
- `PATCH /api/business/:id`

**Story Points:** 5  
**Sprint:** 4

---

#### VYAPAR-303: Multi-Business Support
**As a** user managing multiple businesses  
**I want** to switch between businesses  
**So that** I can manage all my ventures from one app

**Acceptance Criteria:**
- [ ] User can create up to 3 businesses (free tier)
- [ ] Business switcher in app header/drawer
- [ ] Each business has isolated data
- [ ] Last selected business remembered
- [ ] Clear visual indication of active business

**Story Points:** 8  
**Sprint:** 4

---

#### VYAPAR-304: Add Customer (Party)
**As a** business user  
**I want** to add customers  
**So that** I can create invoices for them

**Acceptance Criteria:**
- [ ] Party name (required)
- [ ] Party type: Customer / Supplier / Both
- [ ] Phone number with click-to-call
- [ ] GSTIN (optional, validated if provided)
- [ ] Billing address
- [ ] Shipping address (optional, can copy from billing)
- [ ] Email for invoice delivery
- [ ] Opening balance (debit/credit)
- [ ] Credit limit setting
- [ ] Credit period (days)

**API Endpoint:**
- `POST /api/parties`

**Story Points:** 8  
**Sprint:** 4

---

#### VYAPAR-305: Party List & Search
**As a** business user  
**I want** to view and search parties  
**So that** I can quickly find customers/suppliers

**Acceptance Criteria:**
- [ ] List view with party name, phone, balance
- [ ] Search by name, phone, GSTIN
- [ ] Filter by type (Customer/Supplier/Both)
- [ ] Sort by name, balance, recent activity
- [ ] Infinite scroll pagination
- [ ] Quick actions: Call, WhatsApp, Create Invoice
- [ ] Balance shown in red (receivable) / green (payable)

**API Endpoint:**
- `GET /api/parties?search=&type=&sort=&page=`

**Story Points:** 5  
**Sprint:** 4

---

#### VYAPAR-306: Party Detail View
**As a** business user  
**I want** to see party details and history  
**So that** I can track my relationship with them

**Acceptance Criteria:**
- [ ] Full party profile displayed
- [ ] Transaction history (invoices, payments)
- [ ] Outstanding balance calculation
- [ ] Last transaction date
- [ ] Total business value
- [ ] Quick actions: Edit, Delete, Statement

**API Endpoint:**
- `GET /api/parties/:id`
- `GET /api/parties/:id/transactions`

**Story Points:** 5  
**Sprint:** 4

---

#### VYAPAR-307: Import Parties from Contacts
**As a** business user  
**I want** to import parties from phone contacts  
**So that** I can quickly add existing contacts

**Acceptance Criteria:**
- [ ] Permission requested for contacts access
- [ ] Contact list displayed with search
- [ ] Multi-select contacts for import
- [ ] Name and phone pre-filled
- [ ] Duplicate detection by phone number
- [ ] Import progress indicator

**Story Points:** 5  
**Sprint:** 5

---

## EPIC 4: Inventory Management (VYAPAR-E04)

### User Stories

#### VYAPAR-401: Add Item/Product
**As a** business user  
**I want** to add products to my inventory  
**So that** I can include them in invoices

**Acceptance Criteria:**
- [ ] Item name (required, unique per business)
- [ ] Item code/SKU (auto-generated or manual)
- [ ] Category selection (create new inline)
- [ ] HSN/SAC code with search
- [ ] Unit of measurement (Pcs, Kg, Ltr, etc.)
- [ ] Selling price
- [ ] Purchase price (for profit calculation)
- [ ] Tax rate (GST: 0%, 5%, 12%, 18%, 28%)
- [ ] Opening stock quantity
- [ ] Low stock alert threshold
- [ ] Item image (optional)
- [ ] Item description (optional)

**API Endpoint:**
- `POST /api/items`

**Story Points:** 8  
**Sprint:** 4

---

#### VYAPAR-402: Item List & Search
**As a** business user  
**I want** to view and search items  
**So that** I can manage my inventory

**Acceptance Criteria:**
- [ ] Grid/List view toggle
- [ ] Search by name, SKU, HSN
- [ ] Filter by category
- [ ] Filter by stock status (In Stock, Low Stock, Out of Stock)
- [ ] Sort by name, price, stock
- [ ] Stock quantity visible in list
- [ ] Quick stock adjustment action

**API Endpoint:**
- `GET /api/items?search=&category=&status=`

**Story Points:** 5  
**Sprint:** 5

---

#### VYAPAR-403: Edit Item
**As a** business user  
**I want** to edit item details  
**So that** information stays current

**Acceptance Criteria:**
- [ ] All fields editable
- [ ] Price change doesn't affect past invoices
- [ ] Stock adjustment logged separately
- [ ] Audit trail for price changes

**API Endpoint:**
- `PATCH /api/items/:id`

**Story Points:** 3  
**Sprint:** 5

---

#### VYAPAR-404: Stock Adjustment
**As a** business user  
**I want** to adjust stock manually  
**So that** I can account for damages, theft, or corrections

**Acceptance Criteria:**
- [ ] Add or reduce stock quantity
- [ ] Adjustment reason (required): Damage, Theft, Correction, Opening Stock
- [ ] Notes field for details
- [ ] Adjustment logged with timestamp
- [ ] Stock history viewable

**API Endpoint:**
- `POST /api/items/:id/stock-adjustment`

**Story Points:** 5  
**Sprint:** 5

---

#### VYAPAR-405: Low Stock Alerts
**As a** business user  
**I want** to be alerted when stock is low  
**So that** I can reorder in time

**Acceptance Criteria:**
- [ ] Push notification when item reaches low stock threshold
- [ ] Low stock items highlighted in list
- [ ] "Low Stock" filter in item list
- [ ] Daily summary notification (optional setting)
- [ ] Quick reorder action (creates purchase order)

**Story Points:** 5  
**Sprint:** 6

---

#### VYAPAR-406: Item Categories
**As a** business user  
**I want** to organize items in categories  
**So that** inventory is structured

**Acceptance Criteria:**
- [ ] Create category with name
- [ ] Edit category name
- [ ] Delete category (only if no items linked)
- [ ] Assign category while creating item
- [ ] Change item category

**API Endpoints:**
- `POST /api/categories`
- `GET /api/categories`
- `PATCH /api/categories/:id`
- `DELETE /api/categories/:id`

**Story Points:** 3  
**Sprint:** 5

---

#### VYAPAR-407: Barcode Scanning
**As a** business user  
**I want** to scan barcodes to add/find items  
**So that** data entry is faster

**Acceptance Criteria:**
- [ ] Camera-based barcode scanner
- [ ] Supports EAN-13, UPC-A, Code 128
- [ ] Scanned code searches existing items
- [ ] If not found, offers to create new item with code
- [ ] Barcode stored with item
- [ ] Works offline

**Story Points:** 8  
**Sprint:** 6

---

## EPIC 5: Invoice & Billing (VYAPAR-E05)

### User Stories

#### VYAPAR-501: Create Sales Invoice
**As a** business user  
**I want** to create GST-compliant sales invoices  
**So that** I can bill my customers properly

**Acceptance Criteria:**
- [ ] Select party (customer) - required
- [ ] Add new party inline if not exists
- [ ] Invoice date (default: today)
- [ ] Invoice number auto-generated (format: INV-YYYY-XXXXX)
- [ ] Add line items from inventory
- [ ] Quantity input with unit
- [ ] Price auto-filled, editable
- [ ] Discount per item (% or fixed)
- [ ] Tax auto-calculated based on item tax rate
- [ ] CGST/SGST for intra-state, IGST for inter-state
- [ ] Additional charges (Shipping, Packaging)
- [ ] Overall discount option
- [ ] Round off to nearest rupee
- [ ] Notes/Terms field
- [ ] Save as Draft option
- [ ] Stock auto-deducted on save

**API Endpoint:**
- `POST /api/invoices`

**Story Points:** 13  
**Sprint:** 5-6

---

#### VYAPAR-502: Invoice PDF Generation
**As a** business user  
**I want** to generate PDF invoices  
**So that** I can share them with customers

**Acceptance Criteria:**
- [ ] Professional invoice template
- [ ] Business logo and details
- [ ] Customer details
- [ ] Itemized list with taxes
- [ ] Tax summary (CGST, SGST, IGST breakdown)
- [ ] Total in words
- [ ] QR code for UPI payment (optional)
- [ ] Digital signature placeholder
- [ ] A4 and Thermal (58mm/80mm) formats
- [ ] PDF generated locally (offline capable)

**Story Points:** 8  
**Sprint:** 6

---

#### VYAPAR-503: Share Invoice
**As a** business user  
**I want** to share invoices via multiple channels  
**So that** customers receive them conveniently

**Acceptance Criteria:**
- [ ] Share via WhatsApp (with PDF attachment)
- [ ] Share via SMS (invoice link)
- [ ] Share via Email
- [ ] Copy invoice link
- [ ] Print option (thermal & regular)
- [ ] Share history logged

**Story Points:** 5  
**Sprint:** 6

---

#### VYAPAR-504: Invoice List & Filters
**As a** business user  
**I want** to view all invoices with filters  
**So that** I can manage billing history

**Acceptance Criteria:**
- [ ] List view with invoice#, party, amount, status, date
- [ ] Filter by date range
- [ ] Filter by status (Paid, Unpaid, Partial, Draft)
- [ ] Filter by party
- [ ] Search by invoice number
- [ ] Sort by date, amount
- [ ] Total amount summary at bottom

**API Endpoint:**
- `GET /api/invoices?status=&from=&to=&party=`

**Story Points:** 5  
**Sprint:** 6

---

#### VYAPAR-505: Invoice Detail View
**As a** business user  
**I want** to view invoice details  
**So that** I can see complete information

**Acceptance Criteria:**
- [ ] Full invoice displayed
- [ ] Payment history for this invoice
- [ ] Outstanding amount
- [ ] Quick actions: Edit, Delete, Duplicate, Record Payment
- [ ] Share options
- [ ] Activity log (created, edited, shared, paid)

**API Endpoint:**
- `GET /api/invoices/:id`

**Story Points:** 3  
**Sprint:** 6

---

#### VYAPAR-506: Edit Invoice
**As a** business user  
**I want** to edit invoices  
**So that** I can correct mistakes

**Acceptance Criteria:**
- [ ] Editable only if not fully paid
- [ ] All fields editable
- [ ] Stock adjustments reversed and re-applied
- [ ] Edit history maintained
- [ ] Warning if GST return already filed

**API Endpoint:**
- `PATCH /api/invoices/:id`

**Story Points:** 5  
**Sprint:** 7

---

#### VYAPAR-507: Delete/Cancel Invoice
**As a** business user  
**I want** to cancel invoices  
**So that** incorrect invoices can be voided

**Acceptance Criteria:**
- [ ] Cancel marks invoice as cancelled (not deleted)
- [ ] Stock restored on cancellation
- [ ] Cancellation reason required
- [ ] Cancelled invoices visible with filter
- [ ] Cannot cancel if payments recorded (must reverse first)

**API Endpoint:**
- `POST /api/invoices/:id/cancel`

**Story Points:** 3  
**Sprint:** 7

---

#### VYAPAR-508: Create Quotation/Estimate
**As a** business user  
**I want** to create quotations  
**So that** I can share pricing before billing

**Acceptance Criteria:**
- [ ] Similar form to invoice
- [ ] Quotation number format: QT-YYYY-XXXXX
- [ ] Validity date field
- [ ] No stock deduction
- [ ] Convert to Invoice action
- [ ] Track quotation status (Sent, Accepted, Rejected, Expired)

**API Endpoint:**
- `POST /api/quotations`

**Story Points:** 8  
**Sprint:** 7

---

#### VYAPAR-509: Create Purchase Invoice
**As a** business user  
**I want** to record purchases  
**So that** I can track expenses and input tax credit

**Acceptance Criteria:**
- [ ] Select supplier (party type: Supplier)
- [ ] Purchase invoice number (from supplier)
- [ ] Date of purchase
- [ ] Add items (increases stock)
- [ ] Tax details for ITC
- [ ] Payment status tracking

**API Endpoint:**
- `POST /api/purchases`

**Story Points:** 8  
**Sprint:** 7

---

#### VYAPAR-510: Record Payment Against Invoice
**As a** business user  
**I want** to record payments received  
**So that** I can track outstanding amounts

**Acceptance Criteria:**
- [ ] Payment amount (partial or full)
- [ ] Payment mode (Cash, UPI, Bank Transfer, Cheque)
- [ ] Payment date
- [ ] Reference number (for bank/cheque)
- [ ] Invoice status auto-updates (Partial/Paid)
- [ ] Multiple payments per invoice supported

**API Endpoint:**
- `POST /api/invoices/:id/payments`

**Story Points:** 5  
**Sprint:** 7

---

## EPIC 6: Accounting & Ledger (VYAPAR-E06)

### User Stories

#### VYAPAR-601: Party Ledger View
**As a** business user  
**I want** to see party-wise ledger  
**So that** I can track balances with each party

**Acceptance Criteria:**
- [ ] Opening balance shown
- [ ] All transactions listed chronologically
- [ ] Running balance column
- [ ] Debit/Credit columns
- [ ] Filter by date range
- [ ] Export to PDF/Excel
- [ ] Current outstanding highlighted

**API Endpoint:**
- `GET /api/ledger/party/:partyId`

**Story Points:** 5  
**Sprint:** 7

---

#### VYAPAR-602: Cash & Bank Book
**As a** business user  
**I want** to view cash and bank transactions  
**So that** I can reconcile balances

**Acceptance Criteria:**
- [ ] Cash book with all cash transactions
- [ ] Bank book with bank transactions
- [ ] Date-wise listing
- [ ] Opening and closing balance
- [ ] Filter by date range

**API Endpoint:**
- `GET /api/ledger/cashbook`
- `GET /api/ledger/bankbook`

**Story Points:** 5  
**Sprint:** 8

---

#### VYAPAR-603: Expense Recording
**As a** business user  
**I want** to record business expenses  
**So that** I can track spending

**Acceptance Criteria:**
- [ ] Expense category selection
- [ ] Amount
- [ ] Date
- [ ] Payment mode
- [ ] Notes
- [ ] Attach receipt image
- [ ] Recurring expense option

**API Endpoint:**
- `POST /api/expenses`

**Story Points:** 5  
**Sprint:** 8

---

#### VYAPAR-604: Day Book Report
**As a** business user  
**I want** a day book report  
**So that** I can see all transactions for a day

**Acceptance Criteria:**
- [ ] All transactions for selected date
- [ ] Sales, Purchases, Payments, Receipts, Expenses
- [ ] Summary totals
- [ ] Filter by transaction type

**API Endpoint:**
- `GET /api/reports/daybook?date=`

**Story Points:** 5  
**Sprint:** 8

---

#### VYAPAR-605: Profit & Loss Report
**As a** business user  
**I want** to see profit and loss  
**So that** I can understand business performance

**Acceptance Criteria:**
- [ ] Revenue (Sales)
- [ ] Cost of Goods Sold
- [ ] Gross Profit
- [ ] Expenses breakdown
- [ ] Net Profit
- [ ] Date range filter
- [ ] Comparison with previous period

**API Endpoint:**
- `GET /api/reports/pnl?from=&to=`

**Story Points:** 8  
**Sprint:** 9

---

## EPIC 7: GST Compliance & Reports (VYAPAR-E07)

### User Stories

#### VYAPAR-701: GSTR-1 Report Generation
**As a** GST-registered business  
**I want** to generate GSTR-1 report  
**So that** I can file my returns

**Acceptance Criteria:**
- [ ] Select return period (month/quarter)
- [ ] B2B invoices listing (>2.5L)
- [ ] B2C invoices summary
- [ ] HSN-wise summary
- [ ] JSON export in GST portal format
- [ ] Excel export option
- [ ] Validation errors highlighted

**API Endpoint:**
- `GET /api/gst/gstr1?period=`

**Story Points:** 13  
**Sprint:** 9

---

#### VYAPAR-702: GSTR-3B Summary
**As a** GST-registered business  
**I want** to see GSTR-3B summary  
**So that** I know my tax liability

**Acceptance Criteria:**
- [ ] Output tax summary
- [ ] Input tax credit summary
- [ ] Net tax payable
- [ ] Interest calculation if late
- [ ] Export for manual filing

**API Endpoint:**
- `GET /api/gst/gstr3b?period=`

**Story Points:** 8  
**Sprint:** 10

---

#### VYAPAR-703: HSN Summary Report
**As a** GST-registered business  
**I want** HSN-wise sales summary  
**So that** I can report correctly

**Acceptance Criteria:**
- [ ] HSN code wise grouping
- [ ] Taxable value
- [ ] Tax amounts (CGST, SGST, IGST)
- [ ] Quantity
- [ ] Required for GSTR-1

**Story Points:** 5  
**Sprint:** 9

---

#### VYAPAR-704: E-Invoice Generation
**As a** business with turnover >5Cr  
**I want** to generate E-Invoices  
**So that** I comply with government mandate

**Acceptance Criteria:**
- [ ] Integrate with IRP (Invoice Registration Portal)
- [ ] Auto-generate IRN (Invoice Reference Number)
- [ ] QR code on invoice
- [ ] E-Invoice JSON generation
- [ ] Cancel E-Invoice option
- [ ] Sandbox testing mode

**Story Points:** 13  
**Sprint:** 10

---

## EPIC 8: Offline Sync Engine (VYAPAR-E08)

### User Stories

#### VYAPAR-801: Local Database Setup
**As a** mobile user  
**I want** data stored locally  
**So that** the app works offline

**Acceptance Criteria:**
- [ ] WatermelonDB configured in React Native
- [ ] All schemas mirrored locally
- [ ] Encrypted local database (SQLCipher)
- [ ] Initial sync on login
- [ ] Data persists after app restart

**Story Points:** 8  
**Sprint:** 4

---

#### VYAPAR-802: Create Operations Offline
**As a** user without internet  
**I want** to create invoices and records offline  
**So that** business isn't disrupted

**Acceptance Criteria:**
- [ ] Create invoice offline
- [ ] Create party offline
- [ ] Add items offline
- [ ] Record payments offline
- [ ] Pending sync indicator shown
- [ ] Queue maintained for sync

**Story Points:** 13  
**Sprint:** 5

---

#### VYAPAR-803: Background Sync
**As a** user  
**I want** data to sync automatically when online  
**So that** I don't have to manually sync

**Acceptance Criteria:**
- [ ] Sync triggers when network available
- [ ] Sync runs in background
- [ ] Notification on sync completion
- [ ] Retry logic for failed syncs
- [ ] Bandwidth-efficient delta sync

**Story Points:** 8  
**Sprint:** 6

---

#### VYAPAR-804: Conflict Resolution
**As a** user with multiple devices  
**I want** conflicts resolved automatically  
**So that** data is consistent

**Acceptance Criteria:**
- [ ] Last-write-wins for simple conflicts
- [ ] Version vectors for tracking
- [ ] Manual resolution UI for complex conflicts
- [ ] Conflict log maintained
- [ ] No data loss guaranteed

**Story Points:** 13  
**Sprint:** 7

---

#### VYAPAR-805: Sync Status Indicator
**As a** user  
**I want** to see sync status  
**So that** I know if data is up to date

**Acceptance Criteria:**
- [ ] Sync icon in app header
- [ ] States: Synced, Syncing, Pending, Error
- [ ] Tap to force sync
- [ ] Last sync timestamp
- [ ] Pending changes count

**Story Points:** 3  
**Sprint:** 6

---

## EPIC 9: Notifications & Integrations (VYAPAR-E09)

### User Stories

#### VYAPAR-901: Push Notifications
**As a** user  
**I want** to receive push notifications  
**So that** I'm alerted about important events

**Acceptance Criteria:**
- [ ] Firebase Cloud Messaging integrated
- [ ] Payment reminders
- [ ] Low stock alerts
- [ ] Invoice due alerts
- [ ] Notification preferences settings

**Story Points:** 5  
**Sprint:** 10

---

#### VYAPAR-902: WhatsApp Integration
**As a** business user  
**I want** to send invoices via WhatsApp  
**So that** customers receive them instantly

**Acceptance Criteria:**
- [ ] WhatsApp Business API integration
- [ ] Invoice PDF shared as document
- [ ] Payment reminders via WhatsApp
- [ ] Template messages approved

**Story Points:** 8  
**Sprint:** 10

---

#### VYAPAR-903: SMS Notifications
**As a** business user  
**I want** to send SMS to customers  
**So that** they're notified even without internet

**Acceptance Criteria:**
- [ ] SMS gateway integration (MSG91)
- [ ] Invoice link via SMS
- [ ] Payment reminders
- [ ] DND compliance
- [ ] SMS credits system

**Story Points:** 5  
**Sprint:** 11

---

## EPIC 10: Dashboard & Analytics (VYAPAR-E10)

### User Stories

#### VYAPAR-1001: Home Dashboard
**As a** business user  
**I want** to see key metrics on home  
**So that** I get a business snapshot

**Acceptance Criteria:**
- [ ] Today's sales total
- [ ] Total receivables
- [ ] Total payables
- [ ] Low stock items count
- [ ] Recent transactions list
- [ ] Quick action buttons (New Invoice, Add Payment)

**Story Points:** 8  
**Sprint:** 11

---

#### VYAPAR-1002: Sales Analytics
**As a** business user  
**I want** to see sales trends  
**So that** I can make informed decisions

**Acceptance Criteria:**
- [ ] Sales chart (daily/weekly/monthly)
- [ ] Top selling items
- [ ] Top customers
- [ ] Sales by category
- [ ] Period comparison

**Story Points:** 8  
**Sprint:** 11

---

#### VYAPAR-1003: Stock Reports
**As a** business user  
**I want** comprehensive stock reports  
**So that** I can manage inventory effectively

**Acceptance Criteria:**
- [ ] Current stock value
- [ ] Stock movement report
- [ ] Dead stock identification
- [ ] Reorder suggestions

**Story Points:** 5  
**Sprint:** 12

---

## EPIC 11: Settings & Configuration (VYAPAR-E11)

### User Stories

#### VYAPAR-1101: Invoice Settings
**As a** business user  
**I want** to customize invoice settings  
**So that** invoices match my preferences

**Acceptance Criteria:**
- [ ] Invoice prefix customization
- [ ] Starting invoice number
- [ ] Default terms & conditions
- [ ] Default notes
- [ ] Tax inclusive/exclusive default
- [ ] Invoice template selection

**Story Points:** 5  
**Sprint:** 8

---

#### VYAPAR-1102: Tax Configuration
**As a** business user  
**I want** to configure tax rates  
**So that** correct taxes are applied

**Acceptance Criteria:**
- [ ] GST rates configuration
- [ ] Cess configuration
- [ ] State selection for GST
- [ ] Composition scheme toggle

**Story Points:** 3  
**Sprint:** 8

---

#### VYAPAR-1103: App Preferences
**As a** user  
**I want** to customize app settings  
**So that** it works as I prefer

**Acceptance Criteria:**
- [ ] Language selection (Hindi, English)
- [ ] Dark/Light theme
- [ ] Notification preferences
- [ ] Default printer settings
- [ ] Currency format

**Story Points:** 5  
**Sprint:** 9

---

#### VYAPAR-1104: Data Backup & Restore
**As a** user  
**I want** to backup my data  
**So that** I don't lose it

**Acceptance Criteria:**
- [ ] Manual backup to cloud
- [ ] Auto-backup option (daily)
- [ ] Backup to Google Drive/local
- [ ] Restore from backup
- [ ] Backup encryption

**Story Points:** 8  
**Sprint:** 9

---

## EPIC 12: Testing & QA (VYAPAR-E12)

### User Stories

#### VYAPAR-1201: Unit Test Coverage
**As a** developer  
**I want** comprehensive unit tests  
**So that** code quality is maintained

**Acceptance Criteria:**
- [ ] 80% code coverage for services
- [ ] All business logic tested
- [ ] Mocks for external services
- [ ] Tests run in CI pipeline

**Story Points:** Ongoing  
**Sprint:** Continuous

---

#### VYAPAR-1202: API Integration Tests
**As a** developer  
**I want** API integration tests  
**So that** endpoints work correctly

**Acceptance Criteria:**
- [ ] All endpoints have integration tests
- [ ] Test database seeding
- [ ] Authentication flow tested
- [ ] Error scenarios covered

**Story Points:** Ongoing  
**Sprint:** Continuous

---

#### VYAPAR-1203: E2E Mobile Tests
**As a** QA  
**I want** end-to-end mobile tests  
**So that** user flows are verified

**Acceptance Criteria:**
- [ ] Detox/Appium setup
- [ ] Critical flows automated (Login, Create Invoice, Payment)
- [ ] Tests run on CI
- [ ] Screenshot comparison for UI

**Story Points:** Ongoing  
**Sprint:** Continuous

---

#### VYAPAR-1204: Performance Testing
**As a** developer  
**I want** performance benchmarks  
**So that** app performs well under load

**Acceptance Criteria:**
- [ ] API response time <200ms (p95)
- [ ] App startup time <3s
- [ ] Invoice PDF generation <2s
- [ ] Load test: 1000 concurrent users
- [ ] Memory leak detection

**Story Points:** 8  
**Sprint:** 10-12

---

## EPIC 13: E-Way Bill & Advanced GST (VYAPAR-E13)

### User Stories

#### VYAPAR-1301: E-Way Bill Generation
**As a** business with goods movement >50K  
**I want** to generate E-Way Bills  
**So that** I comply with transportation rules

**Acceptance Criteria:**
- [ ] E-Way Bill generated for invoices >50K
- [ ] Integration with E-Way Bill portal API
- [ ] E-Way Bill number generated and stored
- [ ] QR code for E-Way Bill on invoice
- [ ] Update E-Way Bill status
- [ ] Cancel E-Way Bill option
- [ ] Bulk E-Way Bill generation

**Story Points:** 13  
**Sprint:** 11

---

#### VYAPAR-1302: E-Way Bill List & Management
**As a** business user  
**I want** to view and manage E-Way Bills  
**So that** I can track transportation compliance

**Acceptance Criteria:**
- [ ] List all E-Way Bills
- [ ] Filter by date, status
- [ ] View E-Way Bill details
- [ ] Print E-Way Bill
- [ ] Extend validity if needed
- [ ] Cancel E-Way Bill

**Story Points:** 5  
**Sprint:** 11

---

## EPIC 14: Bank Reconciliation (VYAPAR-E14)

### User Stories

#### VYAPAR-1401: Bank Statement Import
**As a** business user  
**I want** to import bank statements  
**So that** I can reconcile transactions automatically

**Acceptance Criteria:**
- [ ] Import from Excel/CSV
- [ ] Support multiple bank formats
- [ ] Parse transactions (date, amount, description, reference)
- [ ] Validate data format
- [ ] Show import preview
- [ ] Handle duplicate imports
- [ ] Map bank transactions to ledger entries

**Story Points:** 13  
**Sprint:** 12

---

#### VYAPAR-1402: Automatic Reconciliation
**As a** business user  
**I want** transactions matched automatically  
**So that** reconciliation is faster

**Acceptance Criteria:**
- [ ] Match by amount and date
- [ ] Match by reference number
- [ ] Fuzzy matching for similar amounts
- [ ] Show matched transactions
- [ ] Show unmatched transactions
- [ ] Manual match option
- [ ] Reconciliation report

**Story Points:** 13  
**Sprint:** 12

---

#### VYAPAR-1403: Bank Reconciliation Report
**As a** business user  
**I want** to see reconciliation status  
**So that** I know what's reconciled

**Acceptance Criteria:**
- [ ] Show reconciled transactions
- [ ] Show pending reconciliation
- [ ] Show bank balance vs ledger balance
- [ ] Date range filter
- [ ] Export to PDF/Excel
- [ ] Reconciliation summary

**Story Points:** 8  
**Sprint:** 12

---

## EPIC 15: Multi-User & Role Management (VYAPAR-E15)

### User Stories

#### VYAPAR-1501: Invite Staff Members
**As a** business owner  
**I want** to invite staff to my business  
**So that** they can help manage operations

**Acceptance Criteria:**
- [ ] Invite by phone number
- [ ] Assign role (Owner, Admin, Accountant, Salesman)
- [ ] Set granular permissions
- [ ] Send invitation via SMS/WhatsApp
- [ ] Track invitation status
- [ ] Resend invitation
- [ ] Cancel invitation

**Story Points:** 8  
**Sprint:** 10

---

#### VYAPAR-1502: Role-Based Permissions
**As a** business owner  
**I want** to control what staff can do  
**So that** sensitive operations are protected

**Acceptance Criteria:**
- [ ] Define permission sets per role
- [ ] Permissions: View/Edit/Delete for each module
- [ ] Restrict financial data access
- [ ] Restrict settings access
- [ ] View-only mode for some roles
- [ ] Permission matrix UI
- [ ] Audit log for permission changes

**Story Points:** 13  
**Sprint:** 10

---

#### VYAPAR-1503: Staff Management UI
**As a** business owner  
**I want** to manage my staff  
**So that** I can control access

**Acceptance Criteria:**
- [ ] List all staff members
- [ ] Show roles and permissions
- [ ] Edit staff permissions
- [ ] Remove staff access
- [ ] View staff activity
- [ ] Last active time
- [ ] Active sessions per staff

**Story Points:** 8  
**Sprint:** 10

---

## EPIC 16: Subscription & Billing (VYAPAR-E16)

### User Stories

#### VYAPAR-1601: Subscription Plans
**As a** business owner  
**I want** to choose a subscription plan  
**So that** I can access features I need

**Acceptance Criteria:**
- [ ] Free tier (limited features)
- [ ] Basic plan (₹X/month)
- [ ] Premium plan (₹Y/month)
- [ ] Enterprise plan (custom pricing)
- [ ] Feature comparison table
- [ ] Plan selection UI
- [ ] Upgrade/downgrade options

**Story Points:** 8  
**Sprint:** 11

---

#### VYAPAR-1602: Payment Gateway Integration
**As a** business owner  
**I want** to pay for subscription  
**So that** I can access premium features

**Acceptance Criteria:**
- [ ] Integrate Razorpay/Stripe
- [ ] Support credit/debit cards
- [ ] Support UPI
- [ ] Support net banking
- [ ] Secure payment processing
- [ ] Payment success/failure handling
- [ ] Receipt generation
- [ ] Auto-renewal option

**Story Points:** 13  
**Sprint:** 11

---

#### VYAPAR-1603: Subscription Management
**As a** business owner  
**I want** to manage my subscription  
**So that** I can control my plan

**Acceptance Criteria:**
- [ ] View current plan
- [ ] View billing history
- [ ] Upgrade plan
- [ ] Downgrade plan (at end of billing cycle)
- [ ] Cancel subscription
- [ ] Payment method management
- [ ] Invoice download

**Story Points:** 8  
**Sprint:** 11

---

## EPIC 17: Advanced Reports (VYAPAR-E17)

### User Stories

#### VYAPAR-1701: Stock Aging Report
**As a** business user  
**I want** to see stock aging  
**So that** I can identify dead stock

**Acceptance Criteria:**
- [ ] Group stock by age (0-30, 30-60, 60-90, 90+ days)
- [ ] Show stock value by age
- [ ] Identify slow-moving items
- [ ] Export to Excel
- [ ] Date range filter

**Story Points:** 8  
**Sprint:** 12

---

#### VYAPAR-1702: Debtor Aging Report
**As a** business user  
**I want** to see debtor aging  
**So that** I can follow up on overdue payments

**Acceptance Criteria:**
- [ ] Group receivables by age (0-30, 30-60, 60-90, 90+ days)
- [ ] Show party-wise aging
- [ ] Total outstanding by age
- [ ] Export to Excel
- [ ] Send reminder to overdue parties

**Story Points:** 8  
**Sprint:** 12

---

#### VYAPAR-1703: Creditor Aging Report
**As a** business user  
**I want** to see creditor aging  
**So that** I know what I owe

**Acceptance Criteria:**
- [ ] Group payables by age
- [ ] Show supplier-wise aging
- [ ] Total payable by age
- [ ] Export to Excel
- [ ] Payment planning

**Story Points:** 5  
**Sprint:** 12

---

#### VYAPAR-1704: Item-wise Sales Report
**As a** business user  
**I want** to see item-wise sales  
**So that** I can identify best sellers

**Acceptance Criteria:**
- [ ] Sales by item
- [ ] Quantity sold
- [ ] Revenue per item
- [ ] Profit margin per item
- [ ] Date range filter
- [ ] Export to Excel

**Story Points:** 5  
**Sprint:** 12

---

## EPIC 18: Bulk Operations (VYAPAR-E18)

### User Stories

#### VYAPAR-1801: Bulk Import Items
**As a** business user  
**I want** to import items from Excel  
**So that** I can add many items quickly

**Acceptance Criteria:**
- [ ] Excel template download
- [ ] Import Excel file
- [ ] Validate data
- [ ] Show import preview
- [ ] Handle duplicates
- [ ] Import progress indicator
- [ ] Import summary (success/failed)

**Story Points:** 8  
**Sprint:** 12

---

#### VYAPAR-1802: Bulk Import Parties
**As a** business user  
**I want** to import parties from Excel  
**So that** I can add many customers quickly

**Acceptance Criteria:**
- [ ] Excel template download
- [ ] Import Excel file
- [ ] Validate data
- [ ] Show import preview
- [ ] Handle duplicates by phone
- [ ] Import progress
- [ ] Import summary

**Story Points:** 8  
**Sprint:** 12

---

#### VYAPAR-1803: Bulk Payment Recording
**As a** business user  
**I want** to record multiple payments at once  
**So that** I can save time

**Acceptance Criteria:**
- [ ] Select multiple invoices
- [ ] Enter payment details once
- [ ] Apply to selected invoices
- [ ] Preview before save
- [ ] Bulk save
- [ ] Success/failure summary

**Story Points:** 5  
**Sprint:** 12

---
