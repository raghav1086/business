# Business App - Detailed Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** 2025-12-20  
**Status:** Draft

---

## Table of Contents

1. [Introduction](#introduction)
2. [Module 1: User Onboarding & Authentication](#module-1-user-onboarding--authentication)
3. [Module 2: Business Setup & Management](#module-2-business-setup--management)
4. [Module 3: Party Management](#module-3-party-management)
5. [Module 4: Inventory Management](#module-4-inventory-management)
6. [Module 5: Billing & Invoicing](#module-5-billing--invoicing)
7. [Module 6: Accounting & Ledgers](#module-6-accounting--ledgers)
8. [Module 7: GST Compliance & Reports](#module-7-gst-compliance--reports)
9. [Module 8: Payments & Receivables](#module-8-payments--receivables)
10. [Module 10: Offline Sync Engine](#module-10-offline-sync-engine)
11. [Module 11: Security & Compliance](#module-11-security--compliance)
12. [Module 12: Admin & Configuration](#module-12-admin--configuration)
13. [Module 13: Multi-User & RBAC](#module-13-multi-user--rbac)
14. [Module 14: Notifications & Integrations](#module-14-notifications--integrations)
15. [Module 15: Advanced Inventory Types (India-Specific)](#module-15-advanced-inventory-types-india-specific)
16. [Module 16: TDS & TCS Management](#module-16-tds--tcs-management)
17. [Module 17: Advanced GST Features](#module-17-advanced-gst-features)
18. [Module 18: All Invoice Types (India-Specific)](#module-18-all-invoice-types-india-specific)
19. [Module 19: Complete Accounting Books](#module-19-complete-accounting-books)
20. [Module 20: India-Specific Reports](#module-20-india-specific-reports)
21. [Module 21: Manufacturing & Production](#module-21-manufacturing--production)
22. [Module 22: Warehouse Management](#module-22-warehouse-management)
23. [Module 23: Import/Export Management](#module-23-importexport-management)
24. [Module 24: Advance Receipts & Payments](#module-24-advance-receipts--payments)
25. [Module 25: Goods Received Notes (GRN)](#module-25-goods-received-notes-grn)
26. [Module 26: E-Commerce TCS (GSTR-8)](#module-26-e-commerce-tcs-gstr-8)
27. [Module 27: Budgeting & Financial Planning](#module-27-budgeting--financial-planning)
28. [Module 28: Depreciation Management](#module-28-depreciation-management)
29. [Module 29: Often-Missed Compliance Rules](#module-29-often-missed-compliance-rules)
30. [Module 30: SME Business Type Specific Features](#module-30-sme-business-type-specific-features)
31. [Module 31: Regulatory Future-Proofing & Data Retention](#module-31-regulatory-future-proofing--data-retention)
32. [Module 32: Partner Ecosystem (Accountants & CAs)](#module-32-partner-ecosystem-accountants--cas)
33. [Module 33: Support & Operations](#module-33-support--operations)
34. [Module 34: Pricing & Subscription Management](#module-34-pricing--subscription-management)
35. [Module 35: AI & Agentic AI Features](#module-35-ai--agentic-ai-features)

---

## Introduction

This PRD provides a comprehensive, granular breakdown of all features for the Business App. Each module includes:
- **Problem Statement**: Why this feature is needed
- **User Stories**: High-level user requirements
- **Tasks**: Major work items
- **Subtasks**: Detailed implementation steps
- **Acceptance Criteria**: Measurable success criteria

---

## Module 1: User Onboarding & Authentication

### Problem Statement
MSME owners in India need a quick, secure way to onboard and access their business management app without remembering complex passwords. Traditional email/password systems create friction and security risks. OTP-based authentication provides instant access while maintaining security.

### User Story 1.1: User Registration with Phone OTP

**As a** new business owner  
**I want** to register using my phone number with OTP verification  
**So that** I can quickly start using the app without email setup

#### Task 1.1.1: Implement OTP Request API

**Subtasks:**
1. Create `/api/auth/send-otp` endpoint in auth-service
2. Validate phone number format (10 digits, starts with 6-9)
3. Check rate limiting (max 3 requests per hour per number)
4. Generate 6-digit OTP
5. Hash OTP using bcrypt before storing
6. Store OTP in `otp_requests` table with expiry (5 minutes)
7. Integrate SMS gateway (MSG91/Twilio)
8. Send OTP via SMS
9. Return OTP ID (not OTP) to client
10. Log OTP request for audit

**Acceptance Criteria:**
- [ ] API accepts phone number in format: `{country_code: "+91", phone: "9876543210"}`
- [ ] Invalid phone numbers return 400 with clear error message
- [ ] Rate limiting prevents more than 3 OTP requests per hour
- [ ] OTP expires after 5 minutes
- [ ] OTP is hashed before storage (never stored in plain text)
- [ ] SMS is sent successfully (mock in development)
- [ ] Response includes `otp_id` and `expires_in` (seconds)
- [ ] Database record created with `purpose: "registration"`

#### Task 1.1.2: Implement OTP Verification API

**Subtasks:**
1. Create `/api/auth/verify-otp` endpoint
2. Accept `phone`, `otp`, `otp_id`, and `device_info`
3. Validate OTP ID exists and not expired
4. Verify OTP hash matches
5. Check attempt count (max 5 attempts per OTP)
6. If verified, check if user exists
7. If new user, create user record in `users` table
8. Generate JWT access token (15 min expiry)
9. Generate JWT refresh token (30 days expiry)
10. Store refresh token in `refresh_tokens` table
11. Log device info and IP address
12. Update `otp_requests.verified_at`
13. Return user data and tokens

**Acceptance Criteria:**
- [ ] API accepts `{phone, otp, otp_id, device_info}`
- [ ] Invalid OTP returns 400 with "Invalid OTP" message
- [ ] Expired OTP returns 400 with "OTP expired" message
- [ ] More than 5 failed attempts blocks OTP
- [ ] New users are created with `is_new_user: true`
- [ ] Existing users are logged in with `is_new_user: false`
- [ ] JWT tokens are generated with RS256 algorithm
- [ ] Refresh token stored with device info
- [ ] Response includes user object and tokens object
- [ ] `last_login_at` updated for existing users

#### Task 1.1.3: Build Mobile Registration UI

**Subtasks:**
1. Create Welcome screen with "Get Started" button
2. Create Phone Number Input screen
3. Add country code selector (default: +91)
4. Add phone number input with validation
5. Add "Send OTP" button
6. Create OTP Input screen with 6 input fields
7. Auto-focus next field on input
8. Auto-submit on 6th digit entry
9. Add "Resend OTP" button with countdown timer (60 seconds)
10. Show loading state during API calls
11. Handle error states with user-friendly messages
12. Navigate to Business Setup on success
13. Store tokens securely in Keychain/Keystore

**Acceptance Criteria:**
- [ ] Phone input validates format in real-time
- [ ] OTP screen shows 6 individual input boxes
- [ ] Auto-focus works correctly (next field on input)
- [ ] Auto-submit triggers when 6 digits entered
- [ ] Resend button disabled for 60 seconds, then enabled
- [ ] Loading spinner shown during API calls
- [ ] Error messages are clear and actionable
- [ ] Success animation shown on verification
- [ ] Tokens stored securely (not in AsyncStorage)
- [ ] Navigation to next screen on success

### User Story 1.2: User Login with OTP

**As a** returning user  
**I want** to login using OTP  
**So that** I can access my account securely without passwords

#### Task 1.2.1: Implement Login OTP Flow

**Subtasks:**
1. Reuse `/api/auth/send-otp` with `purpose: "login"`
2. Reuse `/api/auth/verify-otp` for login
3. Check if user exists before sending OTP
4. Return `is_new_user: false` for existing users
5. Update `last_login_at` timestamp
6. Invalidate old refresh tokens (optional: keep last 5 devices)

**Acceptance Criteria:**
- [ ] Login uses same OTP endpoints with different purpose
- [ ] Existing users get `is_new_user: false`
- [ ] Non-existent users get appropriate error
- [ ] Last login timestamp updated
- [ ] Device info logged correctly

#### Task 1.2.2: Build Mobile Login UI

**Subtasks:**
1. Create Login screen (similar to registration)
2. Add "New User? Register" link
3. Reuse OTP input component
4. Show "Login" instead of "Register" in button text
5. Navigate to Home/Dashboard on success

**Acceptance Criteria:**
- [ ] Login screen matches registration flow
- [ ] Navigation to registration works
- [ ] On success, navigates to main app (not business setup)

### User Story 1.3: Token Refresh & Session Management

**As a** logged-in user  
**I want** my session to stay active automatically  
**So that** I don't have to login repeatedly

#### Task 1.3.1: Implement Token Refresh API

**Subtasks:**
1. Create `/api/auth/refresh-token` endpoint
2. Accept refresh token in request body
3. Validate refresh token signature
4. Check if token exists in database and not revoked
5. Check if token not expired
6. Invalidate old refresh token (delete or mark revoked)
7. Generate new access token (15 min expiry)
8. Generate new refresh token (30 days expiry)
9. Store new refresh token
10. Return new tokens

**Acceptance Criteria:**
- [ ] API accepts `{refresh_token: "..."}`
- [ ] Invalid refresh token returns 401
- [ ] Expired refresh token returns 401
- [ ] Revoked refresh token returns 401
- [ ] Old refresh token invalidated (cannot reuse)
- [ ] New tokens generated and returned
- [ ] Response format matches login response

#### Task 1.3.2: Implement Auto Token Refresh in Mobile App

**Subtasks:**
1. Create token refresh interceptor in API client
2. Intercept 401 responses
3. Attempt token refresh automatically
4. Retry original request with new token
5. If refresh fails, logout user and redirect to login
6. Refresh token proactively before expiry (e.g., 1 min before)

**Acceptance Criteria:**
- [ ] 401 responses trigger automatic refresh
- [ ] Original request retried after refresh
- [ ] User not logged out on single 401 (refresh attempted first)
- [ ] User logged out if refresh fails
- [ ] Proactive refresh happens before expiry
- [ ] No infinite refresh loops

#### Task 1.3.3: Implement Session Management UI

**Subtasks:**
1. Create Settings > Security screen
2. Display list of active sessions
3. Show device name, OS, IP, last active time
4. Highlight current device
5. Add "Logout" button for each session
6. Add "Logout from all devices" button
7. Implement logout API calls

**Acceptance Criteria:**
- [ ] All active sessions displayed
- [ ] Current device clearly marked
- [ ] Logout from specific device works
- [ ] Logout from all devices invalidates all refresh tokens
- [ ] UI updates immediately after logout

### User Story 1.4: User Profile Management

**As a** user  
**I want** to manage my profile information  
**So that** my details are accurate

#### Task 1.4.1: Implement Profile APIs

**Subtasks:**
1. Create `GET /api/users/profile` endpoint
2. Create `PATCH /api/users/profile` endpoint
3. Allow updating: name, email
4. Validate email format if provided
5. Email verification flow (optional, send OTP to email)
6. Create `POST /api/users/profile/avatar` endpoint
7. Upload avatar to S3/Cloudinary
8. Resize image to 200x200px
9. Update `avatar_url` in user record
10. Return updated user object

**Acceptance Criteria:**
- [ ] GET returns current user profile
- [ ] PATCH updates allowed fields only
- [ ] Email validation works
- [ ] Avatar uploads successfully
- [ ] Image resized to standard dimensions
- [ ] Old avatar deleted from storage
- [ ] Response includes updated user data

#### Task 1.4.2: Build Profile Management UI

**Subtasks:**
1. Create Profile screen
2. Display current profile info
3. Add edit mode toggle
4. Form fields: Name, Email, Phone (read-only)
5. Avatar upload with image picker
6. Save button
7. Show success/error messages
8. Handle image upload progress

**Acceptance Criteria:**
- [ ] Profile data displayed correctly
- [ ] Edit mode allows changes
- [ ] Image picker works (camera + gallery)
- [ ] Upload progress shown
- [ ] Success message on save
- [ ] Error handling for failed uploads

---

## Module 2: Business Setup & Management

### Problem Statement
Business owners need to configure their business profile with accurate GST and contact details so that all invoices and reports reflect correct information. Many MSMEs have multiple businesses and need to switch between them easily.

### User Story 2.1: Create Business Profile

**As a** business owner  
**I want** to create my business profile with GST and address details  
**So that** my invoices have correct business information

#### Task 2.1.1: Implement Business Creation API

**Subtasks:**
1. Create `POST /api/businesses` endpoint
2. Validate required fields: name, type, address
3. Validate GSTIN format (15 chars, checksum validation)
4. Validate PAN format if provided
5. Validate pincode and auto-populate state
6. Validate phone number format
7. Validate email format
8. Check GSTIN uniqueness (if provided)
9. Create business record in `businesses` table
10. Link business to user (owner_id)
11. Create default invoice settings
12. Create default units (Pcs, Kg, Ltr, etc.)
13. Return created business object

**Acceptance Criteria:**
- [ ] API accepts all business fields
- [ ] GSTIN validated with checksum algorithm
- [ ] Invalid GSTIN returns 400 error
- [ ] Duplicate GSTIN returns 409 conflict
- [ ] State auto-populated from pincode
- [ ] Business record created successfully
- [ ] Default settings created
- [ ] Response includes business ID

#### Task 2.1.2: Implement GSTIN Validation Service

**Subtasks:**
1. Create GSTIN validation utility
2. Check length (15 characters)
3. Validate format: 2-digit state code + 10-digit PAN + 1-digit entity + 1-digit check + 1-digit Z
4. Implement checksum algorithm
5. Optionally call GSTN API for verification (if available)
6. Return validation result with error details

**Acceptance Criteria:**
- [ ] Invalid length returns error
- [ ] Invalid format returns error
- [ ] Checksum validation works correctly
- [ ] Valid GSTIN passes validation
- [ ] Error messages are descriptive

#### Task 2.1.3: Build Business Creation UI

**Subtasks:**
1. Create Business Setup screen
2. Form fields:
   - Business Name (required)
   - Business Type dropdown (Retailer, Wholesaler, Manufacturer, Service)
   - GSTIN (optional, with validation)
   - PAN (optional)
   - Phone (optional)
   - Email (optional)
   - Address Line 1 (required)
   - Address Line 2 (optional)
   - City (required)
   - State (auto-filled from pincode)
   - Pincode (required, with validation)
   - Bank Name (optional)
   - Account Number (optional)
   - IFSC Code (optional)
   - UPI ID (optional)
3. Add logo upload (optional)
4. Add "Save" button
5. Show validation errors inline
6. Show loading state
7. Navigate to Home on success

**Acceptance Criteria:**
- [ ] All required fields validated
- [ ] GSTIN validation shows error immediately
- [ ] State auto-populated from pincode
- [ ] Logo upload works
- [ ] Form submission creates business
- [ ] Success navigation works
- [ ] Error messages are clear

### User Story 2.2: Edit Business Profile

**As a** business owner  
**I want** to update my business details  
**So that** changes reflect in future invoices

#### Task 2.2.1: Implement Business Update API

**Subtasks:**
1. Create `PATCH /api/businesses/:id` endpoint
2. Validate business ownership (user must be owner)
3. Allow partial updates
4. GSTIN change requires re-verification flag
5. Update business record
6. Log changes in audit log
7. Return updated business

**Acceptance Criteria:**
- [ ] Only owner can update
- [ ] Partial updates work
- [ ] GSTIN change triggers verification flow
- [ ] Audit log created
- [ ] Response includes updated data

#### Task 2.2.2: Build Business Edit UI

**Subtasks:**
1. Create Business Settings screen
2. Display current business info
3. Make fields editable
4. Add "Save Changes" button
5. Show confirmation for GSTIN changes
6. Handle logo update/removal

**Acceptance Criteria:**
- [ ] All fields editable (except GSTIN without verification)
- [ ] Changes saved successfully
- [ ] Confirmation shown for GSTIN changes

### User Story 2.3: Multi-Business Support

**As a** user managing multiple businesses  
**I want** to switch between businesses  
**So that** I can manage all ventures from one app

#### Task 2.3.1: Implement Business Switching API

**Subtasks:**
1. Create `GET /api/businesses` endpoint (list all user's businesses)
2. Check user permissions for each business
3. Return business list with metadata
4. Create `POST /api/businesses/:id/switch` endpoint
5. Validate user has access to business
6. Update user's active business preference
7. Return business details

**Acceptance Criteria:**
- [ ] List returns all accessible businesses
- [ ] Switch validates permissions
- [ ] Active business preference stored
- [ ] Response includes business details

#### Task 2.3.2: Build Business Switcher UI

**Subtasks:**
1. Add business switcher in app header/drawer
2. Display current business name
3. Show dropdown/list of all businesses
4. Allow selection of different business
5. Reload app data on switch
6. Show business count (e.g., "3 businesses")
7. Add "Add New Business" option

**Acceptance Criteria:**
- [ ] Current business displayed
- [ ] Switcher shows all businesses
- [ ] Switch updates app state
- [ ] Data reloads correctly
- [ ] "Add New Business" navigates to creation

---

## Module 3: Party Management

### Problem Statement
Businesses need to maintain a database of customers and suppliers with their contact details, GST information, and credit terms. Quick access to party information is essential for creating invoices and tracking receivables/payables.

### User Story 3.1: Add Customer/Supplier (Party)

**As a** business user  
**I want** to add customers and suppliers  
**So that** I can create invoices and track transactions

#### Task 3.1.1: Implement Party Creation API

**Subtasks:**
1. Create `POST /api/parties` endpoint
2. Validate required: name, type
3. Validate phone format (if provided)
4. Validate email format (if provided)
5. Validate GSTIN format (if provided)
6. Check duplicate by phone number (optional)
7. Create party record in `parties` table
8. Create opening balance ledger entry (if provided)
9. Return created party with current balance

**Acceptance Criteria:**
- [ ] API accepts all party fields
- [ ] Required fields validated
- [ ] GSTIN validated if provided
- [ ] Duplicate detection works
- [ ] Opening balance creates ledger entry
- [ ] Response includes party ID and balance

#### Task 3.1.2: Build Add Party UI

**Subtasks:**
1. Create Add Party screen
2. Form fields:
   - Party Name (required)
   - Party Type (Customer/Supplier/Both) - radio buttons
   - Phone (optional, with validation)
   - Email (optional, with validation)
   - GSTIN (optional, with validation)
   - Billing Address (all fields)
   - Shipping Address (checkbox: same as billing)
   - Opening Balance (optional)
   - Opening Balance Type (Debit/Credit) - radio
   - Credit Limit (optional)
   - Credit Period Days (optional)
   - Notes (optional)
3. Add "Save" button
4. Show validation errors
5. Navigate back on success

**Acceptance Criteria:**
- [ ] All fields work correctly
- [ ] Validation shows errors
- [ ] "Same as billing" checkbox works
- [ ] Form submission creates party
- [ ] Navigation works

### User Story 3.2: Party List & Search

**As a** business user  
**I want** to view and search parties  
**So that** I can quickly find customers/suppliers

#### Task 3.2.1: Implement Party List API

**Subtasks:**
1. Create `GET /api/parties` endpoint
2. Support query params: search, type, sort, order, page, limit
3. Implement search by name, phone, GSTIN
4. Filter by party type
5. Sort by name, balance, recent activity
6. Implement pagination
7. Calculate current balance for each party
8. Return list with metadata (total, page, limit)

**Acceptance Criteria:**
- [ ] Search works across name, phone, GSTIN
- [ ] Filters work correctly
- [ ] Sorting works
- [ ] Pagination works
- [ ] Balance calculated correctly
- [ ] Response includes metadata

#### Task 3.2.2: Build Party List UI

**Subtasks:**
1. Create Party List screen
2. Add search bar at top
3. Add filter chips (All, Customer, Supplier)
4. Display party cards/list:
   - Name
   - Phone (clickable to call)
   - Balance (red if receivable, green if payable)
   - Type badge
5. Add sort dropdown
6. Implement infinite scroll pagination
7. Add "Add Party" FAB button
8. Add quick actions: Call, WhatsApp, Create Invoice
9. Navigate to party detail on tap

**Acceptance Criteria:**
- [ ] Search works in real-time
- [ ] Filters update list
- [ ] Infinite scroll loads more
- [ ] Quick actions work
- [ ] Navigation to detail works
- [ ] Balance colors correct

### User Story 3.3: Party Detail & Ledger

**As a** business user  
**I want** to see party details and transaction history  
**So that** I can track my relationship with them

#### Task 3.3.1: Implement Party Detail API

**Subtasks:**
1. Create `GET /api/parties/:id` endpoint
2. Return full party profile
3. Calculate current balance
4. Get last transaction date
5. Calculate total business value
6. Create `GET /api/parties/:id/ledger` endpoint
7. Return ledger entries with pagination
8. Calculate opening and closing balance
9. Include invoice and payment references

**Acceptance Criteria:**
- [ ] Detail endpoint returns all party data
- [ ] Balance calculated correctly
- [ ] Ledger entries chronological
- [ ] Opening/closing balance correct
- [ ] References linked correctly

#### Task 3.3.2: Build Party Detail UI

**Subtasks:**
1. Create Party Detail screen
2. Display party profile at top
3. Show balance prominently
4. Add tabs: Details, Transactions, Ledger
5. Transactions tab: List invoices and payments
6. Ledger tab: Show ledger entries with running balance
7. Add action buttons: Edit, Delete, Statement, Create Invoice
8. Add date filter for ledger

**Acceptance Criteria:**
- [ ] All tabs work
- [ ] Transactions listed correctly
- [ ] Ledger shows running balance
- [ ] Actions work correctly
- [ ] Date filter works

---

## Module 4: Inventory Management

### Problem Statement
Businesses need to track inventory items with pricing, stock levels, and tax information. Low stock alerts help prevent stockouts. Barcode scanning speeds up data entry.

### User Story 4.1: Add Item/Product

**As a** business user  
**I want** to add products to inventory  
**So that** I can include them in invoices

#### Task 4.1.1: Implement Item Creation API

**Subtasks:**
1. Create `POST /api/items` endpoint
2. Validate required: name, selling_price
3. Validate SKU uniqueness per business
4. Validate HSN code format (8 digits)
5. Validate tax rate (0, 5, 12, 18, 28)
6. Create item record
7. Create opening stock adjustment entry (if provided)
8. Return created item

**Acceptance Criteria:**
- [ ] All validations work
- [ ] SKU uniqueness enforced
- [ ] HSN validated
- [ ] Opening stock creates adjustment entry
- [ ] Response includes item ID

#### Task 4.1.2: Build Add Item UI

**Subtasks:**
1. Create Add Item screen
2. Form fields:
   - Item Name (required)
   - SKU (optional, auto-generated if not provided)
   - Barcode (optional)
   - Category (dropdown with "Create New" option)
   - HSN Code (optional, with search)
   - Unit (dropdown: Pcs, Kg, Ltr, etc.)
   - Selling Price (required)
   - Purchase Price (optional)
   - MRP (optional)
   - Tax Rate (dropdown: 0%, 5%, 12%, 18%, 28%)
   - Opening Stock (optional)
   - Low Stock Threshold (optional)
   - Description (optional)
   - Image (optional, camera/gallery)
3. Add "Save" button
4. Show validation errors
5. Navigate back on success

**Acceptance Criteria:**
- [ ] All fields work
- [ ] Category creation inline works
- [ ] HSN search works
- [ ] Image upload works
- [ ] Form submission creates item

### User Story 4.2: Stock Management

**As a** business user  
**I want** to track and adjust stock  
**So that** inventory is accurate

#### Task 4.2.1: Implement Stock Adjustment API

**Subtasks:**
1. Create `POST /api/items/:id/stock-adjustment` endpoint
2. Accept: adjustment_type (add/reduce), quantity, reason, notes
3. Validate quantity > 0
4. Validate reason is provided
5. Update item's current_stock
6. Create stock_adjustments record
7. Return updated stock

**Acceptance Criteria:**
- [ ] Stock updated correctly
- [ ] Adjustment logged
- [ ] Reason required
- [ ] Response includes old and new stock

#### Task 4.2.2: Build Stock Adjustment UI

**Subtasks:**
1. Create Stock Adjustment screen
2. Display current stock
3. Radio buttons: Add Stock / Reduce Stock
4. Quantity input
5. Reason dropdown: Damage, Theft, Correction, Opening Stock, Other
6. Notes textarea
7. Add "Save" button
8. Show confirmation for reduce if stock goes negative
9. Show updated stock after save

**Acceptance Criteria:**
- [ ] Adjustment type selection works
- [ ] Quantity validation works
- [ ] Reason required
- [ ] Confirmation for negative stock
- [ ] Stock updates correctly

### User Story 4.3: Demand Forecasting & Reorder Suggestions

**As a** business user  
**I want** demand forecasting and reorder suggestions  
**So that** I can maintain optimal stock levels

#### Task 4.3.1: Implement Demand Forecasting

**Subtasks:**
1. Analyze historical sales data (last 3-6 months)
2. Calculate average daily sales per item
3. Calculate sales trend (increasing/decreasing/stable)
4. Consider seasonality (if data available)
5. Forecast demand for next 30/60/90 days
6. Calculate reorder quantity based on:
   - Forecasted demand
   - Lead time (supplier delivery time)
   - Safety stock
   - Current stock
7. Generate reorder suggestions
8. Prioritize by urgency (low stock + high demand)
9. Return forecast and suggestions

**Acceptance Criteria:**
- [ ] Historical data analyzed
- [ ] Daily sales calculated
- [ ] Trend identified
- [ ] Demand forecasted
- [ ] Reorder quantity calculated
- [ ] Suggestions prioritized
- [ ] Response includes forecast

#### Task 4.3.2: Build Demand Forecasting UI

**Subtasks:**
1. Create Demand Forecasting screen
2. Show forecasted demand per item
3. Show reorder suggestions
4. Display priority (High/Medium/Low)
5. Show historical sales chart
6. Show forecast trend line
7. Add "Create Purchase Order" action
8. Filter by category
9. Export suggestions

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Forecast shown
- [ ] Suggestions displayed
- [ ] Priority shown
- [ ] Charts render
- [ ] PO creation works
- [ ] Export works

### User Story 4.4: Low Stock Alerts

**As a** business user  
**I want** to be alerted when stock is low  
**So that** I can reorder in time

#### Task 4.3.1: Implement Low Stock Detection

**Subtasks:**
1. Create background job to check low stock
2. Query items where current_stock <= low_stock_threshold
3. Group by business
4. Send push notification to business owner
5. Create daily summary notification (optional setting)
6. Mark items as low_stock in database

**Acceptance Criteria:**
- [ ] Low stock detected correctly
- [ ] Notifications sent
- [ ] Daily summary works
- [ ] Items marked correctly

#### Task 4.3.2: Build Low Stock UI

**Subtasks:**
1. Add "Low Stock" filter in item list
2. Highlight low stock items (red badge)
3. Create Low Stock screen showing all low stock items
4. Add "Reorder" quick action
5. Show threshold vs current stock

**Acceptance Criteria:**
- [ ] Filter works
- [ ] Items highlighted
- [ ] Low Stock screen shows all
- [ ] Reorder action works

---

## Module 5: Billing & Invoicing

### Problem Statement
Businesses need to create GST-compliant invoices quickly. Invoices must calculate taxes correctly (CGST/SGST for intra-state, IGST for inter-state), support discounts, and generate professional PDFs for sharing.

### User Story 5.1: Create Sales Invoice

**As a** business user  
**I want** to create GST-compliant sales invoices  
**So that** I can bill customers properly

#### Task 5.1.1: Implement Invoice Creation API

**Subtasks:**
1. Create `POST /api/invoices` endpoint
2. Validate required: party_id, invoice_date, items
3. Validate items array not empty
4. Validate each item has quantity > 0
5. Generate invoice number (format: INV-YYYY-XXXXX)
6. Calculate subtotal (sum of item amounts)
7. Apply item-level discounts
8. Calculate taxable amount
9. Determine place of supply (party's state)
10. Determine if intra-state or inter-state
11. Calculate CGST/SGST (if intra-state) or IGST (if inter-state)
12. Apply additional charges
13. Apply overall discount
14. Calculate round off
15. Calculate total amount
16. Create invoice record
17. Create invoice_items records
18. Deduct stock for each item
19. Create ledger entries
20. Return created invoice

**Acceptance Criteria:**
- [ ] All validations work
- [ ] Invoice number generated correctly
- [ ] Tax calculations correct (CGST/SGST/IGST)
- [ ] Stock deducted correctly
- [ ] Ledger entries created
- [ ] Response includes full invoice data

#### Task 5.1.2: Implement Tax Calculation Logic

**Subtasks:**
1. Create tax calculation utility
2. Determine place of supply
3. Compare business state with party state
4. If same state: Calculate CGST and SGST (each = tax_rate / 2)
5. If different state: Calculate IGST (tax_rate)
6. Handle tax-inclusive pricing
7. Handle multiple tax rates in one invoice
8. Calculate round off to nearest rupee
9. Return tax breakdown

**Acceptance Criteria:**
- [ ] Intra-state: CGST + SGST calculated
- [ ] Inter-state: IGST calculated
- [ ] Tax-inclusive handled correctly
- [ ] Multiple rates handled
- [ ] Round off correct

#### Task 5.1.3: Build Invoice Creation UI

**Subtasks:**
1. Create Create Invoice screen
2. Step 1: Select Party (searchable dropdown, with "Add New" option)
3. Step 2: Add Items
   - Search items
   - Add item to list
   - Quantity input
   - Price (editable)
   - Discount per item (% or fixed)
   - Remove item
4. Step 3: Invoice Details
   - Invoice date (default: today)
   - Due date (default: +30 days)
   - Additional charges
   - Overall discount
   - Notes
   - Terms
5. Step 4: Review & Save
   - Show summary
   - Tax breakdown
   - Total amount
   - "Save as Draft" button
   - "Save & Generate PDF" button
6. Show loading during save
7. Navigate to invoice detail on success

**Acceptance Criteria:**
- [ ] Multi-step form works
- [ ] Party selection works
- [ ] Item search and add works
- [ ] Calculations update in real-time
- [ ] Draft saving works
- [ ] PDF generation works
- [ ] Navigation works

### User Story 5.2: Payment Gateway Integration in Invoices

**As a** business user  
**I want** to add "Pay Now" links in invoices  
**So that** customers can pay instantly and reduce DSO

#### Task 5.2.1: Implement Payment Gateway Integration

**Subtasks:**
1. Integrate payment gateway (Razorpay/Stripe/PayU)
2. Create payment link generation service
3. Generate unique payment link per invoice
4. Support UPI payment (UPI ID, QR code)
5. Support card payments (credit/debit)
6. Support net banking
7. Support wallet payments
8. Generate payment link URL
9. Generate QR code for UPI
10. Track payment status
11. Auto-update invoice on payment success
12. Send payment confirmation

**Acceptance Criteria:**
- [ ] Payment gateway integrated
- [ ] Payment link generated per invoice
- [ ] UPI payment works
- [ ] Card payment works
- [ ] Net banking works
- [ ] QR code generated
- [ ] Payment status tracked
- [ ] Invoice auto-updated
- [ ] Confirmation sent

#### Task 5.2.2: Build Payment Link UI

**Subtasks:**
1. Add "Pay Now" button in invoice PDF
2. Add "Pay Now" link in invoice email/SMS
3. Display payment link in invoice detail
4. Show QR code in invoice PDF
5. Show payment status (Pending, Paid, Failed)
6. Allow manual payment link generation
7. Show payment history

**Acceptance Criteria:**
- [ ] "Pay Now" button in PDF
- [ ] Link in email/SMS
- [ ] QR code displayed
- [ ] Status shown
- [ ] History displayed

### User Story 5.3: Invoice PDF Generation

**As a** business user  
**I want** to generate PDF invoices  
**So that** I can share them with customers

#### Task 5.3.1: Implement PDF Generation Service

**Subtasks:**
1. Create PDF generation service
2. Design invoice template (A4)
3. Include business logo and details
4. Include customer details
5. Include invoice number and date
6. Include itemized list with taxes
7. Include tax summary (CGST, SGST, IGST breakdown)
8. Include total in words
9. Add QR code for UPI payment
10. Add signature placeholder
11. Generate PDF using library (pdfkit/react-pdf)
12. Support thermal formats (58mm, 80mm)
13. Return PDF buffer/URL

**Acceptance Criteria:**
- [ ] PDF generated successfully
- [ ] All details included
- [ ] Formatting professional
- [ ] QR code included
- [ ] Thermal formats work
- [ ] PDF size reasonable (<1MB)

#### Task 5.3.2: Build PDF View & Share UI

**Subtasks:**
1. Create Invoice PDF View screen
2. Display PDF using PDF viewer
3. Add share button
4. Share options: WhatsApp, Email, SMS, Print, Save
5. Implement WhatsApp sharing (with PDF attachment)
6. Implement Email sharing
7. Implement SMS sharing (with link)
8. Implement Print (thermal & regular)
9. Show share history

**Acceptance Criteria:**
- [ ] PDF displays correctly
- [ ] All share options work
- [ ] WhatsApp sends PDF
- [ ] Email sends PDF
- [ ] SMS sends link
- [ ] Print works

---

## Module 6: Accounting & Ledgers

### Problem Statement
Businesses need to track all financial transactions, maintain ledgers for parties, and generate accounting reports for decision-making and compliance. Manual double-entry bookkeeping is error-prone. Pre-built chart of accounts and automated ledger posting reduces errors by ~90%.

### User Story 6.0: Pre-built Chart of Accounts

**As a** business owner  
**I want** a pre-built chart of accounts  
**So that** I don't have to set up accounts manually

#### Task 6.0.1: Implement Pre-built Chart of Accounts

**Subtasks:**
1. Create `chart_of_accounts` table (account_code, account_name, account_type, parent_id)
2. Create default chart of accounts for Indian businesses:
   - Assets (Current, Fixed)
   - Liabilities (Current, Long-term)
   - Capital
   - Income (Sales, Other Income)
   - Expenses (Purchase, Operating, Direct, Indirect)
   - Tax Accounts (GST Payable, GST Receivable, TDS Payable, TCS Payable)
3. Create `POST /api/chart-of-accounts/initialize` endpoint
4. Initialize chart of accounts on business creation
5. Allow customization (add/edit/delete accounts)
6. Support account hierarchy (parent-child)
7. Auto-post transactions to correct accounts
8. Return chart of accounts

**Acceptance Criteria:**
- [ ] Default accounts created
- [ ] All account types included
- [ ] Tax accounts included
- [ ] Hierarchy supported
- [ ] Customization allowed
- [ ] Auto-posting works

#### Task 6.0.2: Build Chart of Accounts UI

**Subtasks:**
1. Create Chart of Accounts screen
2. Show account tree (hierarchical)
3. Show account code, name, type
4. Add "New Account" button
5. Edit/Delete accounts
6. Show account balance
7. Filter by account type
8. Export chart of accounts

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Tree displayed
- [ ] Accounts shown
- [ ] Add/Edit/Delete works
- [ ] Balance shown
- [ ] Filter works
- [ ] Export works

### User Story 6.1: Party Ledger

**As a** business user  
**I want** to see party-wise ledger  
**So that** I can track balances

#### Task 6.1.1: Implement Ledger API

**Subtasks:**
1. Create `GET /api/ledger/party/:partyId` endpoint
2. Accept query params: from_date, to_date, page, limit
3. Calculate opening balance (sum of entries before from_date)
4. Fetch ledger entries in date range
5. Calculate running balance for each entry
6. Calculate closing balance
7. Include invoice and payment references
8. Return entries with opening/closing balance

**Acceptance Criteria:**
- [ ] Opening balance calculated correctly
- [ ] Entries chronological
- [ ] Running balance correct
- [ ] Closing balance correct
- [ ] References linked

#### Task 6.1.2: Build Ledger UI

**Subtasks:**
1. Create Ledger screen
2. Show opening balance at top
3. List entries in table:
   - Date
   - Type (Invoice/Payment)
   - Reference Number
   - Description
   - Debit
   - Credit
   - Balance
4. Show closing balance at bottom
5. Add date range filter
6. Add export to PDF/Excel button
7. Implement export functionality

**Acceptance Criteria:**
- [ ] Entries displayed correctly
- [ ] Balance calculations correct
- [ ] Date filter works
- [ ] Export works
- [ ] PDF/Excel generated

### User Story 6.2: Automated Bank Reconciliation with Bank Feeds

**As a** business user  
**I want** automated bank reconciliation  
**So that** I don't have to manually match transactions

#### Task 6.2.1: Implement Bank Feed Integration

**Subtasks:**
1. Research bank API integrations (RazorpayX, Yodlee, Plaid equivalent for India)
2. Create bank feed service
3. Support multiple banks (HDFC, ICICI, SBI, etc.)
4. Store bank credentials securely (encrypted)
5. Fetch bank statements automatically (daily/weekly)
6. Parse transaction data (date, amount, description, reference)
7. Store bank transactions
8. Match with ledger entries automatically:
   - Match by amount and date
   - Match by reference number
   - Fuzzy matching for similar amounts
9. Identify matched transactions
10. Identify unmatched transactions
11. Allow manual matching
12. Generate reconciliation report
13. Update reconciliation status

**Acceptance Criteria:**
- [ ] Bank API integrated
- [ ] Credentials stored securely
- [ ] Statements fetched
- [ ] Transactions parsed
- [ ] Auto-matching works
- [ ] Manual matching works
- [ ] Report generated

#### Task 6.2.2: Build Bank Reconciliation UI

**Subtasks:**
1. Create Bank Reconciliation screen
2. Show bank accounts list
3. Show matched transactions (green)
4. Show unmatched bank transactions (yellow)
5. Show unmatched ledger entries (red)
6. Allow manual match (drag-drop or select)
7. Show reconciliation summary
8. Add date range filter
9. Export reconciliation report
10. Show last reconciliation date

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Accounts shown
- [ ] Matched/unmatched displayed
- [ ] Manual match works
- [ ] Summary shown
- [ ] Filter works
- [ ] Export works

### User Story 6.3: Expense Recording

**As a** business user  
**I want** to record expenses  
**So that** I can track spending

#### Task 6.2.1: Implement Expense API

**Subtasks:**
1. Create `POST /api/expenses` endpoint
2. Validate required: category, amount, expense_date
3. Create expense record
4. Create transaction entry
5. Create ledger entry (if party linked)
6. Support recurring expenses
7. Return created expense

**Acceptance Criteria:**
- [ ] Expense created
- [ ] Transaction entry created
- [ ] Recurring expenses scheduled
- [ ] Response includes expense ID

#### Task 6.2.2: Build Expense UI

**Subtasks:**
1. Create Add Expense screen
2. Form fields:
   - Category (dropdown with "Create New")
   - Amount (required)
   - Date (required)
   - Payment Mode
   - Reference Number
   - Notes
   - Receipt Image (optional)
   - Recurring toggle
   - Recurring frequency (if enabled)
3. Add "Save" button
4. Show expense list screen
5. Add filters and search

**Acceptance Criteria:**
- [ ] Form works
- [ ] Receipt upload works
- [ ] Recurring expenses created
- [ ] List displays correctly

---

## Module 7: GST Compliance & Reports

### Problem Statement
GST-registered businesses must file monthly/quarterly returns (GSTR-1, GSTR-3B). They need accurate reports in GSTN format. Businesses above 5Cr turnover need E-Invoices.

### User Story 7.1: GSTR-1 Report Generation

**As a** GST-registered business  
**I want** to generate GSTR-1 report  
**So that** I can file my returns

#### Task 7.1.1: Implement GSTR-1 Generation

**Subtasks:**
1. Create `GET /api/gst/gstr1` endpoint
2. Accept query param: period (MMYYYY format)
3. Fetch all invoices for the period
4. Separate B2B invoices (GSTIN provided) and B2C (no GSTIN)
5. For B2B: Group by customer GSTIN
6. For B2C: Group by place of supply and tax rate
7. Generate HSN-wise summary
8. Format data according to GSTN JSON schema
9. Validate data (check for missing HSN, invalid GSTIN, etc.)
10. Return JSON and Excel export options

**Acceptance Criteria:**
- [ ] B2B invoices grouped correctly
- [ ] B2C invoices summarized correctly
- [ ] HSN summary generated
- [ ] JSON format matches GSTN schema
- [ ] Excel export works
- [ ] Validation errors highlighted

#### Task 7.1.2: Build GSTR-1 UI

**Subtasks:**
1. Create GST Reports screen
2. Add GSTR-1 section
3. Period selector (month/quarter)
4. Show report summary:
   - Total invoices
   - B2B count
   - B2C count
   - Total taxable value
   - Total tax
5. Add "Generate Report" button
6. Display report data in table
7. Show validation errors if any
8. Add "Export JSON" button
9. Add "Export Excel" button
10. Add "Upload to GSTN" button (future)

**Acceptance Criteria:**
- [ ] Period selection works
- [ ] Report generated correctly
- [ ] Data displayed correctly
- [ ] Exports work
- [ ] Validation errors shown

### User Story 7.2: Direct GST Portal Upload

**As a** GST-registered business  
**I want** to upload returns directly to GSTN portal  
**So that** I don't have to manually file

#### Task 7.2.1: Implement GST Portal Integration

**Subtasks:**
1. Research GSTN API/GSP (GST Suvidha Provider) integration
2. Create GST portal service
3. Store GSTN credentials securely
4. Implement authentication with GSTN
5. Upload GSTR-1 JSON to portal
6. Upload GSTR-3B JSON to portal
7. Track upload status
8. Handle upload errors
9. Support GSP partners (if needed)
10. Return upload confirmation

**Acceptance Criteria:**
- [ ] GSTN API integrated
- [ ] Credentials stored securely
- [ ] Authentication works
- [ ] GSTR-1 uploaded
- [ ] GSTR-3B uploaded
- [ ] Status tracked
- [ ] Errors handled
- [ ] Confirmation received

#### Task 7.2.2: Build Portal Upload UI

**Subtasks:**
1. Add "Upload to GSTN" button in GST reports
2. Show credential setup (first time)
3. Show upload progress
4. Show upload status (Success/Failed)
5. Show upload history
6. Allow retry on failure
7. Show error messages

**Acceptance Criteria:**
- [ ] Button works
- [ ] Credentials setup works
- [ ] Progress shown
- [ ] Status displayed
- [ ] History shown
- [ ] Retry works

### User Story 7.3: GST Deadline Reminders

**As a** GST-registered business  
**I want** to receive deadline reminders  
**So that** I don't miss filing dates and avoid penalties

#### Task 7.3.1: Implement Deadline Reminder System

**Subtasks:**
1. Create `gst_deadlines` table (return_type, period, due_date, reminder_days)
2. Create background job to check upcoming deadlines
3. Calculate days until due date
4. Send reminders at 7 days, 3 days, 1 day before
5. Send penalty warning if overdue
6. Calculate penalty amount (if applicable)
7. Send via push notification
8. Send via email
9. Send via SMS
10. Track reminder sent

**Acceptance Criteria:**
- [ ] Deadlines tracked
- [ ] Reminders sent at correct intervals
- [ ] Penalty calculated
- [ ] Multiple channels used
- [ ] Reminders logged

#### Task 7.3.2: Build Deadline Reminder UI

**Subtasks:**
1. Create GST Deadlines screen
2. Show upcoming deadlines (next 30 days)
3. Show overdue returns
4. Show penalty amounts (if any)
5. Add "Mark as Filed" button
6. Show reminder history
7. Configure reminder preferences

**Acceptance Criteria:**
- [ ] Deadlines shown
- [ ] Overdue highlighted
- [ ] Penalties shown
- [ ] Filing status updated
- [ ] History shown
- [ ] Preferences saved

### User Story 7.4: E-Invoice Generation

**As a** business with turnover above threshold (₹5Cr currently, ₹2Cr from FY2025)  
**I want** to generate E-Invoices  
**So that** I comply with mandate

#### Task 7.4.1: Implement E-Invoice Integration

**Subtasks:**
1. Research IRP (Invoice Registration Portal) API
2. Create E-Invoice service
3. Check business turnover against threshold (configurable, currently ₹5Cr, will be ₹2Cr from FY2025)
4. Auto-enable e-invoicing if threshold exceeded
5. Generate E-Invoice JSON (as per IRP schema)
6. Call IRP API to generate IRN
7. Store IRN and QR code in invoice
8. Support B2C e-invoicing (voluntary pilot, prepare for mandatory)
9. Generate dynamic QR code for B2C invoices (if enabled)
10. Handle errors and retries
11. Implement E-Invoice cancellation
12. Add sandbox mode for testing
13. Auto-push to GSTR-1 and e-way bill portal (as per IRP integration)

**Acceptance Criteria:**
- [ ] Threshold checked (₹5Cr/₹2Cr)
- [ ] Auto-enablement works
- [ ] E-Invoice JSON generated correctly
- [ ] IRN generated successfully
- [ ] QR code stored
- [ ] B2C e-invoicing supported
- [ ] Dynamic QR for B2C works
- [ ] Auto-push to GSTR-1 works
- [ ] Errors handled
- [ ] Cancellation works
- [ ] Sandbox mode works

#### Task 7.4.2: Build E-Invoice UI

**Subtasks:**
1. Add "Generate E-Invoice" button in invoice detail
2. Show E-Invoice status (Not Generated, Generated, Cancelled)
3. Display IRN and QR code if generated
4. Add "Cancel E-Invoice" option
5. Show loading during generation
6. Show error messages

**Acceptance Criteria:**
- [ ] Generation works
- [ ] Status displayed
- [ ] QR code shown
- [ ] Cancellation works
- [ ] Errors handled

---

## Module 8: Payments & Receivables

### Problem Statement
Businesses need to record payments received and made, track outstanding receivables and payables, and send payment reminders to customers.

### User Story 8.1: Record Payment

**As a** business user  
**I want** to record payments received  
**So that** I can track outstanding amounts

#### Task 8.1.1: Implement Payment Recording API

**Subtasks:**
1. Create `POST /api/invoices/:id/payments` endpoint
2. Validate required: amount, payment_date, payment_mode
3. Validate amount <= outstanding amount
4. Create payment transaction
5. Update invoice paid_amount
6. Update invoice payment_status (unpaid/partial/paid)
7. Create ledger entry
8. Update party balance
9. Return updated invoice

**Acceptance Criteria:**
- [ ] Payment recorded
- [ ] Invoice status updated
- [ ] Ledger entry created
- [ ] Party balance updated
- [ ] Response includes updated data

#### Task 8.1.2: Build Payment Recording UI

**Subtasks:**
1. Create Record Payment screen
2. Display invoice details
3. Show outstanding amount
4. Form fields:
   - Amount (required, max: outstanding)
   - Payment Date (default: today)
   - Payment Mode (Cash, UPI, Bank Transfer, Cheque, Credit Card)
   - Reference Number (optional)
   - Notes (optional)
5. Add "Record Payment" button
6. Show confirmation
7. Update invoice detail after save

**Acceptance Criteria:**
- [ ] Form works
- [ ] Amount validation works
- [ ] Payment recorded
- [ ] Invoice updated
- [ ] UI refreshes

### User Story 8.2: Receivables Dashboard with Aging

**As a** business owner  
**I want** to see receivables dashboard with aging  
**So that** I can track outstanding payments effectively

#### Task 8.2.1: Implement Receivables Dashboard

**Subtasks:**
1. Create `GET /api/receivables/dashboard` endpoint
2. Calculate total receivables
3. Calculate receivables by age buckets (0-30, 30-60, 60-90, 90+ days)
4. Calculate average DSO (Days Sales Outstanding)
5. Get top debtors by amount
6. Get overdue invoices count
7. Calculate collection efficiency
8. Return dashboard data

**Acceptance Criteria:**
- [ ] Total receivables calculated
- [ ] Aging buckets calculated correctly
- [ ] DSO calculated
- [ ] Top debtors identified
- [ ] Overdue count accurate
- [ ] Collection efficiency calculated

#### Task 8.2.2: Build Receivables Dashboard UI

**Subtasks:**
1. Create Receivables Dashboard screen
2. Show total receivables card
3. Show aging chart (pie/bar chart)
4. Show aging table (0-30, 30-60, 60-90, 90+ days)
5. Show top debtors list
6. Show overdue invoices count
7. Show DSO metric
8. Show collection efficiency
9. Add date filter
10. Add export option

**Acceptance Criteria:**
- [ ] Dashboard displays correctly
- [ ] Charts render
- [ ] Aging table accurate
- [ ] Top debtors shown
- [ ] Metrics accurate
- [ ] Filter works
- [ ] Export works

### User Story 8.3: Bulk Collection Tracking

**As a** business user  
**I want** to track bulk collections  
**So that** I can manage multiple payments efficiently

#### Task 8.3.1: Implement Bulk Collection

**Subtasks:**
1. Create `POST /api/payments/bulk` endpoint
2. Accept array of payments
3. Validate each payment
4. Process payments in batch
5. Create payment transactions
6. Update invoices
7. Create ledger entries
8. Return success/failure summary

**Acceptance Criteria:**
- [ ] Bulk endpoint works
- [ ] Multiple payments processed
- [ ] Validations work
- [ ] Transactions created
- [ ] Invoices updated
- [ ] Summary returned

#### Task 8.3.2: Build Bulk Collection UI

**Subtasks:**
1. Create Bulk Payment screen
2. Select multiple invoices
3. Enter payment details (amount, date, mode)
4. Apply to selected invoices
5. Show preview
6. Process bulk payment
7. Show success/failure summary

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Multiple invoices selected
- [ ] Details entered
- [ ] Preview shown
- [ ] Bulk processing works
- [ ] Summary shown

### User Story 8.4: Payment Reminders

**As a** business user  
**I want** to send payment reminders  
**So that** customers pay on time

#### Task 8.2.1: Implement Reminder System

**Subtasks:**
1. Create background job to check overdue invoices
2. Identify invoices past due date
3. Group by party
4. Generate reminder message
5. Send via WhatsApp (if number available)
6. Send via SMS (if WhatsApp not available)
7. Send via Email (if email available)
8. Log reminder sent
9. Support manual reminder trigger

**Acceptance Criteria:**
- [ ] Overdue invoices identified
- [ ] Reminders sent via multiple channels
- [ ] Logging works
- [ ] Manual trigger works

#### Task 8.2.2: Build Reminder UI

**Subtasks:**
1. Add "Send Reminder" button in invoice detail
2. Show reminder history
3. Create Reminders screen showing all overdue invoices
4. Bulk reminder option
5. Customize reminder message
6. Show last reminder date

**Acceptance Criteria:**
- [ ] Reminder button works
- [ ] History displayed
- [ ] Bulk reminder works
- [ ] Message customization works

---

## Module 9: Reports & Analytics

### Problem Statement
Business owners need insights into sales, profits, stock, and cash flow to make informed decisions. Visual charts and summaries help understand business performance quickly.

### User Story 9.1: Sales Analytics

**As a** business owner  
**I want** to see sales trends and insights  
**So that** I can make informed decisions

#### Task 9.1.1: Implement Sales Analytics API

**Subtasks:**
1. Create `GET /api/analytics/sales` endpoint
2. Accept query params: from_date, to_date, group_by (day/week/month)
3. Calculate daily/weekly/monthly sales
4. Calculate growth percentage
5. Get top selling items
6. Get top customers
7. Get sales by category
8. Calculate average order value
9. Return analytics data

**Acceptance Criteria:**
- [ ] Sales calculated correctly
- [ ] Growth percentage calculated
- [ ] Top items/customers identified
- [ ] Category breakdown correct
- [ ] Response includes all metrics

#### Task 9.1.2: Build Sales Analytics UI

**Subtasks:**
1. Create Analytics screen
2. Add date range selector
3. Display sales chart (line/bar chart)
4. Show key metrics cards:
   - Total Sales
   - Growth %
   - Average Order Value
   - Total Orders
5. Show top selling items table
6. Show top customers table
7. Show sales by category (pie chart)
8. Add export option

**Acceptance Criteria:**
- [ ] Charts render correctly
- [ ] Metrics accurate
- [ ] Tables display correctly
- [ ] Export works

### User Story 9.2: Profit & Loss Report

**As a** business owner  
**I want** to see profit and loss  
**So that** I understand profitability

#### Task 9.2.1: Implement P&L API

**Subtasks:**
1. Create `GET /api/reports/pnl` endpoint
2. Accept query params: from_date, to_date
3. Calculate revenue (total sales)
4. Calculate COGS (cost of goods sold from purchase invoices)
5. Calculate gross profit (revenue - COGS)
6. Calculate expenses (from expenses table)
7. Calculate net profit (gross profit - expenses)
8. Compare with previous period
9. Return P&L data

**Acceptance Criteria:**
- [ ] Revenue calculated correctly
- [ ] COGS calculated correctly
- [ ] Expenses included
- [ ] Net profit correct
- [ ] Comparison works

#### Task 9.2.2: Build P&L UI

**Subtasks:**
1. Create P&L Report screen
2. Add date range selector
3. Display P&L statement:
   - Revenue
   - COGS
   - Gross Profit
   - Expenses (breakdown)
   - Net Profit
4. Show comparison with previous period
5. Add export to PDF/Excel
6. Show percentage changes

**Acceptance Criteria:**
- [ ] Statement displayed correctly
- [ ] Comparison shown
- [ ] Export works
- [ ] Percentages calculated

---

## Module 10: Offline Sync Engine

### Problem Statement
Many MSMEs operate in areas with poor internet connectivity. The app must work fully offline and sync data when online. Multiple devices must stay in sync without conflicts.

### User Story 10.1: Local Database Setup

**As a** mobile user  
**I want** data stored locally  
**So that** the app works offline

#### Task 10.1.1: Setup WatermelonDB

**Subtasks:**
1. Install WatermelonDB in React Native app
2. Define database schema (mirror server schema)
3. Create models: Business, Party, Item, Invoice, etc.
4. Setup encryption (SQLCipher)
5. Create database instance
6. Setup initial sync on login
7. Test database operations

**Acceptance Criteria:**
- [ ] Database initialized
- [ ] All models defined
- [ ] Encryption enabled
- [ ] Initial sync works
- [ ] CRUD operations work offline

#### Task 10.1.2: Implement Data Models

**Subtasks:**
1. Create Business model with fields
2. Create Party model
3. Create Item model
4. Create Invoice model
5. Create InvoiceItem model
6. Create Transaction model
7. Define relationships
8. Add indexes for performance
9. Test model operations

**Acceptance Criteria:**
- [ ] All models created
- [ ] Relationships defined
- [ ] Indexes added
- [ ] Operations work

### User Story 10.2: Offline Create Operations

**As a** user without internet  
**I want** to create invoices and records offline  
**So that** business isn't disrupted

#### Task 10.2.1: Implement Offline Write Operations

**Subtasks:**
1. Create offline service layer
2. All write operations go to local DB first
3. Generate local UUIDs for new records
4. Mark records as `sync_pending: true`
5. Add to sync queue
6. Return success immediately
7. Show pending sync indicator
8. Handle validation offline

**Acceptance Criteria:**
- [ ] Writes go to local DB
- [ ] Local UUIDs generated
- [ ] Sync queue maintained
- [ ] Success returned immediately
- [ ] Indicator shown

#### Task 10.2.2: Build Offline UI Indicators

**Subtasks:**
1. Add sync status icon in header
2. Show states: Synced, Syncing, Pending (count), Error
3. Add "Pending Changes" badge with count
4. Show offline banner when no internet
5. Disable online-only features when offline
6. Show sync progress

**Acceptance Criteria:**
- [ ] Status icon visible
- [ ] States displayed correctly
- [ ] Pending count accurate
- [ ] Offline banner shown
- [ ] Features disabled appropriately

### User Story 10.3: Background Sync

**As a** user  
**I want** data to sync automatically when online  
**So that** I don't have to manually sync

#### Task 10.3.1: Implement Sync Service

**Subtasks:**
1. Create sync service
2. Detect network connectivity
3. Trigger sync when online
4. Fetch pending changes from local DB
5. Batch changes for efficiency
6. Call sync API endpoints
7. Handle conflicts
8. Update local records with server IDs
9. Mark records as synced
10. Fetch server changes
11. Update local DB
12. Notify user on completion
13. Implement partial data caching:
    - Cache frequently accessed data (items, parties, recent invoices)
    - Keep UI responsive during sync
    - Load cached data first, then update from server
    - Cache invalidation strategy
    - Cache size limits
14. Optimize sync performance:
    - Delta sync (only changed data)
    - Compress large payloads
    - Prioritize critical data
    - Background sync with low priority

**Acceptance Criteria:**
- [ ] Sync triggers automatically
- [ ] Changes sent to server
- [ ] Server changes fetched
- [ ] Conflicts handled
- [ ] Local DB updated
- [ ] Notification shown

#### Task 10.3.2: Implement Conflict Resolution

**Subtasks:**
1. Detect conflicts (same record modified on multiple devices)
2. Use version vectors for tracking
3. Last-write-wins for simple conflicts
4. Manual resolution UI for complex conflicts
5. Show conflict details to user
6. Allow user to choose version
7. Merge changes where possible
8. Log conflicts

**Acceptance Criteria:**
- [ ] Conflicts detected
- [ ] Simple conflicts auto-resolved
- [ ] Complex conflicts shown to user
- [ ] User can resolve
- [ ] No data loss

---

## Module 11: Security & Compliance

### Problem Statement
User data must be protected according to DPDP Act. Sensitive financial data requires encryption. Audit logs are needed for compliance.

### User Story 11.1: Data Encryption

**As a** system  
**I want** all sensitive data encrypted  
**So that** data is protected

#### Task 11.1.1: Implement Encryption

**Subtasks:**
1. Encrypt data in transit (TLS 1.3)
2. Encrypt sensitive fields at rest (AES-256)
3. Encrypt local database (SQLCipher)
4. Encrypt backups
5. Manage encryption keys securely
6. Rotate keys periodically

**Acceptance Criteria:**
- [ ] TLS 1.3 enabled
- [ ] Sensitive fields encrypted
- [ ] Local DB encrypted
- [ ] Backups encrypted
- [ ] Keys managed securely

### User Story 11.2: Audit Logging

**As a** system  
**I want** all actions logged  
**So that** we have audit trail

#### Task 11.2.1: Implement Audit Log

**Subtasks:**
1. Create audit_logs table
2. Log all data modifications
3. Log user actions (login, logout, etc.)
4. Log API calls
5. Include: user_id, action, entity_type, entity_id, timestamp, IP, device
6. Store logs for 1 year
7. Provide audit log API (admin only)

**Acceptance Criteria:**
- [ ] All modifications logged
- [ ] User actions logged
- [ ] Logs include required fields
- [ ] Retention policy enforced
- [ ] API works

---

## Module 12: Admin & Configuration

### Problem Statement
Businesses need to configure invoice settings, tax rates, and app preferences. These settings affect how invoices are generated and how the app behaves.

### User Story 12.1: Invoice Settings

**As a** business user  
**I want** to customize invoice settings  
**So that** invoices match my preferences

#### Task 12.1.1: Implement Invoice Settings API

**Subtasks:**
1. Create `GET /api/invoice-settings` endpoint
2. Create `PATCH /api/invoice-settings` endpoint
3. Store settings: prefix, next_number, terms, notes, template, etc.
4. Validate settings
5. Return settings

**Acceptance Criteria:**
- [ ] Settings retrieved
- [ ] Settings updated
- [ ] Validation works
- [ ] Response correct

#### Task 12.1.2: Build Invoice Settings UI

**Subtasks:**
1. Create Invoice Settings screen
2. Form fields:
   - Invoice Prefix
   - Starting Number
   - Default Terms
   - Default Notes
   - Tax Inclusive Default
   - Template Selection
   - Show Logo toggle
   - Show Signature toggle
3. Add "Save" button
4. Show preview

**Acceptance Criteria:**
- [ ] All fields work
- [ ] Settings saved
- [ ] Preview works

---

## Module 13: Multi-User & RBAC

### Problem Statement
Businesses have multiple staff (accountant, salesman, admin) who need different levels of access. Owners need to manage permissions and invite staff.

### User Story 13.1: Staff Management

**As a** business owner  
**I want** to invite staff members  
**So that** they can help manage the business

#### Task 13.1.1: Implement Staff Invitation API

**Subtasks:**
1. Create `POST /api/businesses/:id/staff/invite` endpoint
2. Accept: phone, role, permissions
3. Validate phone number
4. Check if user exists
5. Create invitation record
6. Send invitation SMS/WhatsApp
7. Create business_user record when accepted
8. Return invitation details

**Acceptance Criteria:**
- [ ] Invitation created
- [ ] SMS/WhatsApp sent
- [ ] User can accept
- [ ] Business_user record created
- [ ] Permissions assigned

#### Task 13.1.2: Build Staff Management UI

**Subtasks:**
1. Create Staff Management screen
2. Show list of staff members
3. Add "Invite Staff" button
4. Invitation form: Phone, Role, Permissions
5. Show invitation status
6. Allow revoke access
7. Show last active time

**Acceptance Criteria:**
- [ ] Staff list displayed
- [ ] Invitation works
- [ ] Permissions shown
- [ ] Revoke works

### User Story 13.2: Role-Based Access Control

**As a** system  
**I want** to enforce permissions  
**So that** users only access allowed features

#### Task 13.2.1: Implement RBAC Middleware

**Subtasks:**
1. Create permission constants
2. Create RBAC middleware
3. Check user role and permissions
4. Allow/deny based on permissions
5. Apply to all protected endpoints
6. Return 403 if unauthorized

**Acceptance Criteria:**
- [ ] Permissions checked
- [ ] Access denied for unauthorized
- [ ] All endpoints protected

---

## Module 14: Notifications & Integrations

### Problem Statement
Businesses need to send invoices, payment reminders, and alerts via WhatsApp, SMS, and push notifications. These integrations improve customer communication.

### User Story 14.1: WhatsApp Integration

**As a** business user  
**I want** to send invoices via WhatsApp  
**So that** customers receive them instantly

#### Task 14.1.1: Implement WhatsApp API Integration

**Subtasks:**
1. Research WhatsApp Business API
2. Setup WhatsApp Business Account
3. Get API credentials
4. Create WhatsApp service
5. Implement send message with PDF
6. Implement template messages
7. Handle errors and retries
8. Log sent messages

**Acceptance Criteria:**
- [ ] WhatsApp API integrated
- [ ] Messages sent successfully
- [ ] PDF attachments work
- [ ] Templates work
- [ ] Errors handled

#### Task 14.1.2: Build WhatsApp Share UI

**Subtasks:**
1. Add "Share via WhatsApp" button in invoice
2. Check if party has WhatsApp number
3. Show WhatsApp picker if multiple numbers
4. Send invoice PDF
5. Show success/error message
6. Log share action

**Acceptance Criteria:**
- [ ] Button works
- [ ] Number detection works
- [ ] PDF sent
- [ ] Messages shown

### User Story 14.2: Push Notifications

**As a** user  
**I want** to receive push notifications  
**So that** I'm alerted about important events

#### Task 14.2.1: Implement Push Notifications

**Subtasks:**
1. Setup Firebase Cloud Messaging
2. Register device tokens
3. Create notification service
4. Send notifications for:
   - Payment reminders
   - Low stock alerts
   - Invoice due alerts
   - New staff invitations
5. Handle notification preferences
6. Track notification delivery

**Acceptance Criteria:**
- [ ] FCM integrated
- [ ] Tokens registered
- [ ] Notifications sent
- [ ] Preferences respected
- [ ] Delivery tracked

#### Task 14.2.2: Build Notification Settings UI

**Subtasks:**
1. Create Notification Settings screen
2. Toggle switches for each notification type
3. Save preferences
4. Show notification history

**Acceptance Criteria:**
- [ ] Settings saved
- [ ] Preferences applied
- [ ] History shown

---

## Module 15: Advanced Inventory Types (India-Specific)

### Problem Statement
Indian businesses deal with various inventory types requiring different tracking methods. Some items need serial number tracking, batch/lot tracking, expiry date management, and MRP compliance. Different inventory categories (Raw Materials, WIP, Finished Goods, Trading Goods, Consumables) need separate handling.

### User Story 15.1: Serial Number Tracking

**As a** business selling high-value items  
**I want** to track items by serial number  
**So that** I can manage warranties and prevent theft

#### Task 15.1.1: Implement Serial Number Management

**Subtasks:**
1. Add `track_serial` boolean field to items table
2. Create `item_serials` table (item_id, serial_number, status, purchase_date, sale_date, warranty_end_date)
3. Add serial number input in purchase invoices
4. Validate serial number uniqueness per item
5. Track serial number status (in_stock, sold, returned, damaged)
6. Link serial numbers to invoices
7. Generate serial number report
8. Support bulk serial number import

**Acceptance Criteria:**
- [ ] Serial numbers stored per item
- [ ] Uniqueness enforced
- [ ] Status tracked correctly
- [ ] Linked to invoices
- [ ] Report generated
- [ ] Bulk import works

#### Task 15.1.2: Build Serial Number UI

**Subtasks:**
1. Add "Track Serial" toggle in item creation
2. Add serial number input in purchase invoice
3. Display serial numbers in item detail
4. Show serial number history
5. Add serial number search
6. Create Serial Number Report screen

**Acceptance Criteria:**
- [ ] Toggle works
- [ ] Input validated
- [ ] History displayed
- [ ] Search works
- [ ] Report generated

### User Story 15.2: Batch/Lot Number Tracking

**As a** business dealing with batches  
**I want** to track items by batch/lot number  
**So that** I can manage expiry and recalls

#### Task 15.2.1: Implement Batch Tracking

**Subtasks:**
1. Add `track_batch` boolean field to items table
2. Create `item_batches` table (item_id, batch_number, manufacturing_date, expiry_date, quantity, purchase_date)
3. Add batch input in purchase invoices
4. Track batch-wise stock
5. FIFO/LIFO batch selection for sales
6. Expiry date alerts
7. Batch expiry report
8. Support multiple batches per item

**Acceptance Criteria:**
- [ ] Batches stored per item
- [ ] Expiry dates tracked
- [ ] FIFO/LIFO selection works
- [ ] Alerts generated
- [ ] Report works

#### Task 15.2.2: Build Batch Tracking UI

**Subtasks:**
1. Add "Track Batch" toggle in item creation
2. Add batch input in purchase (batch number, MFG date, expiry date)
3. Show batch-wise stock in item detail
4. Display expiry alerts
5. Create Batch Expiry Report
6. Add batch selection in sales (FIFO/LIFO)

**Acceptance Criteria:**
- [ ] Toggle works
- [ ] Batch input works
- [ ] Stock shown correctly
- [ ] Alerts displayed
- [ ] Report generated
- [ ] Selection method works

### User Story 15.3: Inventory Categories (Raw Materials, WIP, Finished Goods)

**As a** manufacturer  
**I want** to categorize inventory by type  
**So that** I can track production stages

#### Task 15.3.1: Implement Inventory Categories

**Subtasks:**
1. Add `inventory_type` field to items (raw_material, wip, finished_goods, trading_goods, consumables, services)
2. Create separate stock tracking per type
3. Raw Materials: Track for production
4. WIP: Track work in progress items
5. Finished Goods: Track completed products
6. Trading Goods: Track items for resale
7. Consumables: Track office supplies
8. Services: Track service items (SAC codes)
9. Generate category-wise reports

**Acceptance Criteria:**
- [ ] Categories defined
- [ ] Stock tracked per category
- [ ] Reports generated
- [ ] Production flow tracked

#### Task 15.3.2: Build Category Management UI

**Subtasks:**
1. Add inventory type dropdown in item creation
2. Show category-wise stock summary
3. Create category-wise reports
4. Add category filter in item list
5. Show category in item detail

**Acceptance Criteria:**
- [ ] Dropdown works
- [ ] Summary displayed
- [ ] Reports generated
- [ ] Filter works

### User Story 15.4: MRP Compliance

**As a** retailer  
**I want** to track MRP and ensure compliance  
**So that** I don't violate pricing regulations

#### Task 15.4.1: Implement MRP Tracking

**Subtasks:**
1. Add MRP field to items (already exists, enhance)
2. Validate selling price <= MRP
3. Show MRP on invoices
4. Generate MRP violation report
5. Support MRP changes with history
6. Track MRP by state (if different)

**Acceptance Criteria:**
- [ ] MRP stored
- [ ] Validation works
- [ ] Shown on invoices
- [ ] Violations reported
- [ ] History maintained

---

## Module 16: TDS & TCS Management

### Problem Statement
Indian businesses must deduct TDS (Tax Deducted at Source) on certain payments and collect TCS (Tax Collected at Source) on certain sales. Proper TDS/TCS tracking and certificate generation is mandatory for compliance.

### User Story 16.1: TDS Deduction on Payments

**As a** business making payments  
**I want** to deduct TDS as per rules  
**So that** I comply with tax regulations

#### Task 16.1.1: Implement TDS Deduction

**Subtasks:**
1. Create `tds_configurations` table (section, rate, threshold, applicable_to)
2. Add TDS section selection in payment recording
3. Calculate TDS amount based on section and rate
4. Validate threshold (deduct only if payment > threshold)
5. Create TDS ledger entry
6. Generate TDS certificate (Form 16A)
7. Track TDS payable to government
8. Support multiple TDS sections per payment

**Acceptance Criteria:**
- [ ] TDS sections configured
- [ ] Calculation correct
- [ ] Threshold validated
- [ ] Ledger entry created
- [ ] Certificate generated
- [ ] Payable tracked

#### Task 16.1.2: Build TDS UI

**Subtasks:**
1. Add TDS section dropdown in payment screen
2. Show TDS amount calculation
3. Display TDS summary
4. Create TDS Payable Report
5. Generate Form 16A
6. Add TDS payment recording

**Acceptance Criteria:**
- [ ] Dropdown works
- [ ] Calculation shown
- [ ] Summary displayed
- [ ] Report generated
- [ ] Form 16A generated

### User Story 16.2: TCS Collection on Sales

**As a** business making certain sales  
**I want** to collect TCS as per rules  
**So that** I comply with tax regulations

#### Task 16.2.1: Implement TCS Collection

**Subtasks:**
1. Create `tcs_configurations` table (section, rate, threshold, applicable_to)
2. Add TCS section in invoice settings
3. Calculate TCS on applicable invoices
4. Show TCS separately on invoice
5. Create TCS ledger entry
6. Track TCS collected
7. Generate TCS certificate
8. Support TCS on specific item categories

**Acceptance Criteria:**
- [ ] TCS sections configured
- [ ] Calculation correct
- [ ] Shown on invoice
- [ ] Ledger entry created
- [ ] Collected tracked
- [ ] Certificate generated

#### Task 16.2.2: Build TCS UI

**Subtasks:**
1. Add TCS toggle in invoice settings
2. Show TCS amount in invoice
3. Display TCS summary
4. Create TCS Collected Report
5. Generate TCS certificate

**Acceptance Criteria:**
- [ ] Toggle works
- [ ] Amount shown
- [ ] Summary displayed
- [ ] Report generated
- [ ] Certificate generated

---

## Module 17: Advanced GST Features

### Problem Statement
Indian GST has complex features like Reverse Charge Mechanism (RCM), Composition Scheme, Input Tax Credit (ITC) tracking, and GSTR-2A/2B reconciliation. These must be properly handled for compliance.

### User Story 17.1: Reverse Charge Mechanism (RCM)

**As a** business receiving RCM services  
**I want** to handle RCM correctly  
**So that** I comply with GST rules

#### Task 17.1.1: Implement RCM Handling

**Subtasks:**
1. Add `is_rcm` boolean field to invoices
2. Identify RCM applicable services (as per GST rules)
3. Calculate RCM tax (business pays tax instead of supplier)
4. Show RCM tax separately on purchase invoice
5. Create RCM tax payable entry
6. Include RCM in GSTR-3B
7. Track RCM ITC (if eligible)
8. Generate RCM report

**Acceptance Criteria:**
- [ ] RCM identified correctly
- [ ] Tax calculated
- [ ] Shown on invoice
- [ ] Payable tracked
- [ ] Included in returns
- [ ] Report generated

#### Task 17.1.2: Build RCM UI

**Subtasks:**
1. Add "RCM Applicable" toggle in purchase invoice
2. Show RCM tax calculation
3. Display RCM summary
4. Create RCM Report
5. Show RCM in GSTR-3B

**Acceptance Criteria:**
- [ ] Toggle works
- [ ] Calculation shown
- [ ] Summary displayed
- [ ] Report generated

### User Story 17.2: Composition Scheme Support

**As a** business under composition scheme  
**I want** to handle composition tax  
**So that** I comply with scheme rules

#### Task 17.2.1: Implement Composition Scheme

**Subtasks:**
1. Add `gst_type: 'composition'` in business settings
2. Calculate composition tax rate (1%, 5%, 6% based on business type)
3. Generate Bill of Supply (not Tax Invoice) for composition businesses
4. Restrict inter-state sales (composition businesses can't do inter-state)
5. Include composition tax in GSTR-4 (quarterly return)
6. Track composition tax payable
7. Validate composition scheme rules

**Acceptance Criteria:**
- [ ] Scheme type stored
- [ ] Tax rate calculated
- [ ] Bill of Supply generated
- [ ] Inter-state restricted
- [ ] GSTR-4 included
- [ ] Rules validated

#### Task 17.2.2: Build Composition Scheme UI

**Subtasks:**
1. Add composition scheme option in business setup
2. Show composition tax rate
3. Generate Bill of Supply instead of Tax Invoice
4. Display composition tax summary
5. Create Composition Tax Report
6. Show GSTR-4 data

**Acceptance Criteria:**
- [ ] Option available
- [ ] Rate shown
- [ ] Bill of Supply generated
- [ ] Summary displayed
- [ ] Report generated

### User Story 17.3: Input Tax Credit (ITC) Tracking

**As a** GST-registered business  
**I want** to track ITC accurately  
**So that** I can claim credit correctly

#### Task 17.3.1: Implement ITC Tracking

**Subtasks:**
1. Calculate ITC from purchase invoices (CGST, SGST, IGST)
2. Track ITC by tax rate
3. Separate eligible and ineligible ITC
4. Track ITC utilization (against output tax)
5. Calculate ITC reversal (if any)
6. Generate ITC register
7. Reconcile with GSTR-2A/2B
8. Show ITC summary in GSTR-3B

**Acceptance Criteria:**
- [ ] ITC calculated from purchases
- [ ] Tracked by rate
- [ ] Eligible/ineligible separated
- [ ] Utilization tracked
- [ ] Reversal calculated
- [ ] Register generated
- [ ] Reconciliation works

#### Task 17.3.2: Build ITC UI

**Subtasks:**
1. Create ITC Register screen
2. Show ITC by tax rate
3. Display eligible vs ineligible ITC
4. Show ITC utilization
5. Show ITC reversal
6. Create ITC Reconciliation screen (with GSTR-2A/2B)
7. Show ITC in GSTR-3B

**Acceptance Criteria:**
- [ ] Register displayed
- [ ] Rates shown
- [ ] Eligible/ineligible shown
- [ ] Utilization shown
- [ ] Reconciliation works
- [ ] GSTR-3B includes ITC

### User Story 17.4: GSTR-2A/2B Reconciliation

**As a** GST-registered business  
**I want** to reconcile my purchases with GSTR-2A/2B  
**So that** I claim correct ITC

#### Task 17.4.1: Implement GSTR-2A/2B Reconciliation

**Subtasks:**
1. Import GSTR-2A/2B JSON from GSTN portal
2. Match purchase invoices with GSTR-2A/2B data
3. Identify matched invoices
4. Identify missing invoices (in our system but not in GSTR-2A)
5. Identify extra invoices (in GSTR-2A but not in our system)
6. Identify mismatched amounts
7. Generate reconciliation report
8. Allow manual matching
9. Track reconciliation status

**Acceptance Criteria:**
- [ ] JSON imported
- [ ] Matching works
- [ ] Missing identified
- [ ] Extra identified
- [ ] Mismatches shown
- [ ] Report generated
- [ ] Manual match works

#### Task 17.4.2: Build Reconciliation UI

**Subtasks:**
1. Create GSTR-2A/2B Import screen
2. Show matched invoices (green)
3. Show missing invoices (red)
4. Show extra invoices (yellow)
5. Show mismatched amounts
6. Allow manual match
7. Generate reconciliation report
8. Show reconciliation summary

**Acceptance Criteria:**
- [ ] Import works
- [ ] Colors indicate status
- [ ] Manual match works
- [ ] Report generated
- [ ] Summary shown

---

## Module 18: All Invoice Types (India-Specific)

### Problem Statement
Indian GST requires different invoice types for different scenarios. Businesses need to generate Tax Invoice, Bill of Supply, Credit Note, Debit Note, Delivery Challan, Receipt Voucher, Payment Voucher, and Proforma Invoice based on the transaction type.

### User Story 18.1: Tax Invoice vs Bill of Supply

**As a** business user  
**I want** to generate correct invoice type  
**So that** I comply with GST rules

#### Task 18.1.1: Implement Invoice Type Logic

**Subtasks:**
1. Determine invoice type based on:
   - GST registration status
   - Composition scheme
   - Transaction type
   - Tax applicability
2. Generate Tax Invoice for GST-registered businesses (with tax)
3. Generate Bill of Supply for:
   - Composition scheme businesses
   - Exempt supplies
   - Non-GST supplies
4. Different numbering for each type
5. Different templates for each type
6. Include required fields per type

**Acceptance Criteria:**
- [ ] Type determined correctly
- [ ] Tax Invoice generated
- [ ] Bill of Supply generated
- [ ] Numbering separate
- [ ] Templates different
- [ ] Fields correct

#### Task 18.1.2: Build Invoice Type UI

**Subtasks:**
1. Auto-select invoice type based on business settings
2. Allow manual override (with validation)
3. Show invoice type in invoice list
4. Different PDF templates per type
5. Show type-specific fields

**Acceptance Criteria:**
- [ ] Auto-selection works
- [ ] Override works
- [ ] Type shown
- [ ] Templates correct
- [ ] Fields shown

### User Story 18.2: Credit Note & Debit Note

**As a** business user  
**I want** to generate credit/debit notes  
**So that** I can adjust invoices

#### Task 18.2.1: Implement Credit/Debit Note

**Subtasks:**
1. Create credit note for:
   - Returns
   - Discounts
   - Damages
   - Price reductions
2. Create debit note for:
   - Additional charges
   - Price increases
3. Link credit/debit note to original invoice
4. Calculate tax adjustment
5. Generate credit/debit note number
6. Include in GSTR-1
7. Generate PDF

**Acceptance Criteria:**
- [ ] Credit note created
- [ ] Debit note created
- [ ] Linked to invoice
- [ ] Tax adjusted
- [ ] Number generated
- [ ] Included in returns
- [ ] PDF generated

#### Task 18.2.2: Build Credit/Debit Note UI

**Subtasks:**
1. Add "Create Credit Note" button in invoice detail
2. Add "Create Debit Note" button
3. Credit Note form (reason, amount, items)
4. Debit Note form
5. Show linked invoices
6. Generate PDF
7. Include in GSTR-1

**Acceptance Criteria:**
- [ ] Buttons work
- [ ] Forms work
- [ ] Linking shown
- [ ] PDF generated
- [ ] GSTR-1 includes

### User Story 18.3: Delivery Challan

**As a** business making deliveries  
**I want** to generate delivery challans  
**So that** I can track goods movement

#### Task 18.3.1: Implement Delivery Challan

**Subtasks:**
1. Create delivery_challans table
2. Generate challan number
3. Include: from address, to address, items, quantity, vehicle details
4. Generate PDF
5. Link to invoice (if invoice created later)
6. Support multiple challans per invoice
7. Track challan status

**Acceptance Criteria:**
- [ ] Challan created
- [ ] Number generated
- [ ] Details included
- [ ] PDF generated
- [ ] Linking works
- [ ] Status tracked

#### Task 18.3.2: Build Delivery Challan UI

**Subtasks:**
1. Create "New Delivery Challan" screen
2. Form fields (party, items, vehicle, driver)
3. Generate PDF
4. Show challan list
5. Link to invoice
6. Print challan

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Form complete
- [ ] PDF generated
- [ ] List shown
- [ ] Linking works

### User Story 18.4: Receipt & Payment Vouchers

**As a** business user  
**I want** to generate receipt and payment vouchers  
**So that** I can record cash transactions

#### Task 18.4.1: Implement Vouchers

**Subtasks:**
1. Create receipt_vouchers table
2. Create payment_vouchers table
3. Generate voucher number
4. Include party, amount, mode, reference
5. Create ledger entries
6. Generate PDF
7. Support TDS on payments
8. Track voucher status

**Acceptance Criteria:**
- [ ] Vouchers created
- [ ] Numbers generated
- [ ] Details included
- [ ] Ledger entries created
- [ ] PDF generated
- [ ] TDS supported
- [ ] Status tracked

#### Task 18.4.2: Build Voucher UI

**Subtasks:**
1. Create "New Receipt Voucher" screen
2. Create "New Payment Voucher" screen
3. Form fields (party, amount, mode, reference)
4. Generate PDF
5. Show voucher list
6. Print vouchers

**Acceptance Criteria:**
- [ ] Screens work
- [ ] Forms complete
- [ ] PDF generated
- [ ] List shown
- [ ] Print works

---

## Module 19: Complete Accounting Books

### Problem Statement
Indian businesses must maintain proper books of accounts as per Companies Act and Income Tax Act. These include Cash Book, Bank Book, Journal, Ledger, Trial Balance, Trading Account, Profit & Loss Account, and Balance Sheet.

### User Story 19.1: Cash Book & Bank Book

**As a** business user  
**I want** to view cash and bank books  
**So that** I can track cash and bank transactions

#### Task 19.1.1: Implement Cash Book

**Subtasks:**
1. Create cash_book_entries view/table
2. Include all cash transactions (receipts, payments, expenses)
3. Calculate opening balance
4. Calculate running balance
5. Calculate closing balance
6. Filter by date range
7. Export to PDF/Excel
8. Support multiple cash accounts

**Acceptance Criteria:**
- [ ] Entries included
- [ ] Opening balance calculated
- [ ] Running balance correct
- [ ] Closing balance correct
- [ ] Filter works
- [ ] Export works
- [ ] Multiple accounts supported

#### Task 19.1.2: Implement Bank Book

**Subtasks:**
1. Create bank_book_entries view/table
2. Include all bank transactions
3. Group by bank account
4. Calculate opening/closing balance per account
5. Filter by date range
6. Export to PDF/Excel
7. Support multiple bank accounts

**Acceptance Criteria:**
- [ ] Entries included
- [ ] Grouped by account
- [ ] Balances calculated
- [ ] Filter works
- [ ] Export works
- [ ] Multiple accounts supported

#### Task 19.1.3: Build Cash/Bank Book UI

**Subtasks:**
1. Create Cash Book screen
2. Create Bank Book screen
3. Show entries in table
4. Display opening/closing balance
5. Add date range filter
6. Add export buttons
7. Show balance summary

**Acceptance Criteria:**
- [ ] Screens work
- [ ] Entries shown
- [ ] Balances displayed
- [ ] Filter works
- [ ] Export works

### User Story 19.2: Journal Entries

**As a** business user  
**I want** to create journal entries  
**So that** I can record non-cash transactions

#### Task 19.2.1: Implement Journal Entries

**Subtasks:**
1. Create journal_entries table
2. Support double-entry bookkeeping
3. Validate debit = credit
4. Link to ledger accounts
5. Generate journal number
6. Support multiple debit/credit entries
7. Create ledger entries
8. Generate PDF

**Acceptance Criteria:**
- [ ] Entries created
- [ ] Double-entry validated
- [ ] Debit = credit enforced
- [ ] Ledger linked
- [ ] Number generated
- [ ] Multiple entries supported
- [ ] PDF generated

#### Task 19.2.2: Build Journal Entry UI

**Subtasks:**
1. Create "New Journal Entry" screen
2. Add debit entries (account, amount, narration)
3. Add credit entries (account, amount, narration)
4. Show debit/credit total
5. Validate totals match
6. Save entry
7. Show journal list
8. Generate PDF

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Entries added
- [ ] Totals shown
- [ ] Validation works
- [ ] Save works
- [ ] List shown
- [ ] PDF generated

### User Story 19.3: Trial Balance

**As a** business user  
**I want** to view trial balance  
**So that** I can verify books are balanced

#### Task 19.3.1: Implement Trial Balance

**Subtasks:**
1. Create trial_balance view
2. Group all ledger accounts
3. Calculate debit total per account
4. Calculate credit total per account
5. Calculate balance (debit - credit)
6. Validate total debit = total credit
7. Filter by date
8. Export to PDF/Excel

**Acceptance Criteria:**
- [ ] Accounts grouped
- [ ] Totals calculated
- [ ] Balance calculated
- [ ] Validation works
- [ ] Filter works
- [ ] Export works

#### Task 19.3.2: Build Trial Balance UI

**Subtasks:**
1. Create Trial Balance screen
2. Show accounts in table (name, debit, credit, balance)
3. Show total debit
4. Show total credit
5. Highlight if not balanced
6. Add date filter
7. Add export buttons

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Accounts shown
- [ ] Totals displayed
- [ ] Highlighting works
- [ ] Filter works
- [ ] Export works

### User Story 19.4: Trading, P&L, and Balance Sheet

**As a** business user  
**I want** to view financial statements  
**So that** I can understand business performance

#### Task 19.4.1: Implement Trading Account

**Subtasks:**
1. Calculate opening stock
2. Calculate purchases (less returns)
3. Calculate direct expenses
4. Calculate closing stock
5. Calculate cost of goods sold
6. Calculate gross profit (sales - COGS)
7. Generate Trading Account report
8. Export to PDF/Excel

**Acceptance Criteria:**
- [ ] Opening stock calculated
- [ ] Purchases calculated
- [ ] Expenses included
- [ ] Closing stock calculated
- [ ] COGS calculated
- [ ] Gross profit calculated
- [ ] Report generated
- [ ] Export works

#### Task 19.4.2: Implement Profit & Loss Account

**Subtasks:**
1. Get gross profit from Trading Account
2. Add indirect income
3. Subtract indirect expenses
4. Calculate net profit/loss
5. Support comparison with previous period
6. Generate P&L report
7. Export to PDF/Excel

**Acceptance Criteria:**
- [ ] Gross profit included
- [ ] Income added
- [ ] Expenses subtracted
- [ ] Net profit calculated
- [ ] Comparison works
- [ ] Report generated
- [ ] Export works

#### Task 19.4.3: Implement Balance Sheet

**Subtasks:**
1. Calculate assets (current + fixed)
2. Calculate liabilities (current + long-term)
3. Calculate capital (opening + profit - drawings)
4. Validate assets = liabilities + capital
5. Support comparison with previous period
6. Generate Balance Sheet report
7. Export to PDF/Excel

**Acceptance Criteria:**
- [ ] Assets calculated
- [ ] Liabilities calculated
- [ ] Capital calculated
- [ ] Validation works
- [ ] Comparison works
- [ ] Report generated
- [ ] Export works

#### Task 19.4.4: Build Financial Statements UI

**Subtasks:**
1. Create Financial Statements screen
2. Add tabs: Trading, P&L, Balance Sheet
3. Show each statement
4. Add date range filter
5. Add comparison toggle
6. Add export buttons
7. Show summary cards

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Tabs work
- [ ] Statements shown
- [ ] Filter works
- [ ] Comparison works
- [ ] Export works

---

## Module 20: India-Specific Reports

### Problem Statement
Indian businesses need specific reports for compliance and decision-making. These include Form 16/16A, TDS/TCS reports, GSTR-9 (Annual Return), GSTR-9C (Reconciliation), and various statutory reports.

### User Story 20.1: Form 16/16A Generation

**As a** business making TDS payments  
**I want** to generate Form 16/16A  
**So that** I can provide certificates to deductees

#### Task 20.1.1: Implement Form 16/16A

**Subtasks:**
1. Generate Form 16 (for salary TDS)
2. Generate Form 16A (for non-salary TDS)
3. Include deductor details
4. Include deductee details
5. Include TDS details (section, rate, amount)
6. Include PAN verification
7. Generate PDF in prescribed format
8. Support bulk generation

**Acceptance Criteria:**
- [ ] Form 16 generated
- [ ] Form 16A generated
- [ ] Details included
- [ ] Format correct
- [ ] PDF generated
- [ ] Bulk generation works

#### Task 20.1.2: Build Form 16/16A UI

**Subtasks:**
1. Create TDS Certificates screen
2. Show list of TDS deductions
3. Add "Generate Form 16A" button
4. Select deductee and period
5. Generate PDF
6. Download certificate
7. Email certificate option

**Acceptance Criteria:**
- [ ] Screen works
- [ ] List shown
- [ ] Button works
- [ ] Selection works
- [ ] PDF generated
- [ ] Download works
- [ ] Email works

### User Story 20.2: GSTR-9 (Annual Return)

**As a** GST-registered business  
**I want** to generate GSTR-9  
**So that** I can file annual return

#### Task 20.2.1: Implement GSTR-9

**Subtasks:**
1. Aggregate data for financial year
2. Include all GSTR-1 data (12 months)
3. Include all GSTR-3B data (12 months)
4. Calculate annual totals
5. Reconcile with monthly returns
6. Generate GSTR-9 JSON
7. Export to Excel
8. Validate data

**Acceptance Criteria:**
- [ ] Data aggregated
- [ ] GSTR-1 included
- [ ] GSTR-3B included
- [ ] Totals calculated
- [ ] Reconciliation works
- [ ] JSON generated
- [ ] Excel export works
- [ ] Validation works

#### Task 20.2.2: Build GSTR-9 UI

**Subtasks:**
1. Create GSTR-9 screen
2. Select financial year
3. Show annual summary
4. Show month-wise breakdown
5. Show reconciliation status
6. Generate JSON
7. Export Excel
8. Show validation errors

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Year selection works
- [ ] Summary shown
- [ ] Breakdown shown
- [ ] Reconciliation shown
- [ ] JSON generated
- [ ] Excel exported
- [ ] Errors shown

### User Story 20.3: GSTR-9C (Reconciliation Statement)

**As a** business with turnover >5Cr  
**I want** to generate GSTR-9C  
**So that** I can file reconciliation statement

#### Task 20.3.1: Implement GSTR-9C

**Subtasks:**
1. Reconcile GSTR-9 with audited financial statements
2. Identify differences
3. Calculate adjustments
4. Generate reconciliation statement
5. Include auditor details
6. Generate GSTR-9C JSON
7. Export to Excel

**Acceptance Criteria:**
- [ ] Reconciliation works
- [ ] Differences identified
- [ ] Adjustments calculated
- [ ] Statement generated
- [ ] Auditor details included
- [ ] JSON generated
- [ ] Excel exported

#### Task 20.3.2: Build GSTR-9C UI

**Subtasks:**
1. Create GSTR-9C screen
2. Import audited financial statements
3. Show reconciliation
4. Show differences
5. Allow adjustments
6. Generate JSON
7. Export Excel

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Import works
- [ ] Reconciliation shown
- [ ] Differences shown
- [ ] Adjustments allowed
- [ ] JSON generated
- [ ] Excel exported

---

## Module 21: Manufacturing & Production

### Problem Statement
Manufacturers need to track raw materials through production to finished goods. They require Bill of Materials (BOM), production vouchers, inventory valuation methods (FIFO, Weighted Average), and handling of by-products and scrap. This is critical for accurate COGS calculation and GST compliance.

### User Story 21.1: Bill of Materials (BOM)

**As a** manufacturer  
**I want** to define BOM for finished goods  
**So that** I can track raw material consumption

#### Task 21.1.1: Implement BOM Management

**Subtasks:**
1. Create `boms` table (finished_item_id, raw_item_id, quantity, unit, wastage_percent)
2. Create `bom_items` table for multiple raw materials per BOM
3. Create `POST /api/boms` endpoint
4. Link finished goods to raw materials
5. Define quantity of each raw material needed
6. Support wastage percentage
7. Support alternate BOMs for same finished good
8. Validate BOM (no circular references)
9. Calculate total cost of BOM
10. Return BOM details

**Acceptance Criteria:**
- [ ] BOM created with multiple raw materials
- [ ] Quantities defined correctly
- [ ] Wastage calculated
- [ ] Circular references prevented
- [ ] Cost calculated
- [ ] Alternate BOMs supported

#### Task 21.1.2: Build BOM UI

**Subtasks:**
1. Create BOM Management screen
2. Select finished good
3. Add raw materials with quantities
4. Set wastage percentage
5. Show total cost calculation
6. Save BOM
7. Show BOM list
8. Edit/Delete BOM

**Acceptance Criteria:**
- [ ] BOM creation works
- [ ] Materials added correctly
- [ ] Cost shown
- [ ] List displayed
- [ ] Edit/Delete works

### User Story 21.2: Production Vouchers

**As a** manufacturer  
**I want** to record production  
**So that** I can track finished goods creation

#### Task 21.2.1: Implement Production Vouchers

**Subtasks:**
1. Create `production_vouchers` table
2. Create `POST /api/production-vouchers` endpoint
3. Select finished good and BOM
4. Enter production quantity
5. Consume raw materials as per BOM
6. Calculate actual vs expected consumption
7. Handle wastage
8. Create finished goods stock
9. Update raw material stock
10. Create COGS entries
11. Support by-products (optional output)
12. Support scrap (waste material with value)
13. Generate production voucher number

**Acceptance Criteria:**
- [ ] Production voucher created
- [ ] Raw materials consumed
- [ ] Finished goods created
- [ ] Stock updated correctly
- [ ] COGS calculated
- [ ] By-products handled
- [ ] Scrap tracked

#### Task 21.2.2: Build Production Voucher UI

**Subtasks:**
1. Create "New Production Voucher" screen
2. Select finished good
3. Auto-load BOM
4. Enter production quantity
5. Show expected raw material consumption
6. Allow actual consumption adjustment
7. Add by-products (if any)
8. Add scrap (if any)
9. Show cost calculation
10. Save voucher
11. Show production history

**Acceptance Criteria:**
- [ ] Screen works
- [ ] BOM loaded
- [ ] Consumption shown
- [ ] Adjustments allowed
- [ ] By-products/scrap added
- [ ] Cost calculated
- [ ] History shown

### User Story 21.3: Inventory Valuation Methods

**As a** manufacturer  
**I want** to use different valuation methods  
**So that** I can calculate accurate COGS

#### Task 21.3.1: Implement Valuation Methods

**Subtasks:**
1. Support Weighted Average Cost method
2. Support FIFO (First In First Out)
3. Support LIFO (Last In First Out) - optional
4. Support Standard Cost method
5. Calculate weighted average on each purchase:
   ```
   new_avg_cost = ((old_qty * old_avg_cost) + (purchased_qty * purchased_rate)) / (old_qty + purchased_qty)
   ```
6. For FIFO: Maintain lot-wise stock
7. For FIFO: Pop from oldest lots on sale
8. For LIFO: Pop from newest lots on sale
9. Allow business to select valuation method per item
10. Generate valuation reports

**Acceptance Criteria:**
- [ ] Weighted Average calculated correctly
- [ ] FIFO works with lots
- [ ] LIFO works (if enabled)
- [ ] Standard Cost works
- [ ] Method selectable per item
- [ ] Reports generated

#### Task 21.3.2: Build Valuation UI

**Subtasks:**
1. Add valuation method selection in item settings
2. Show current average cost
3. Show lot-wise stock (for FIFO)
4. Create Valuation Report screen
5. Show stock value by method
6. Compare methods

**Acceptance Criteria:**
- [ ] Method selection works
- [ ] Average cost shown
- [ ] Lot-wise stock shown
- [ ] Report generated
- [ ] Comparison works

---

## Module 22: Warehouse Management

### Problem Statement
Businesses with multiple locations need to track stock across warehouses. They need inter-warehouse transfers, warehouse-wise stock reports, and the ability to manage stock separately per warehouse.

### User Story 22.1: Multi-Warehouse Support

**As a** business with multiple locations  
**I want** to manage stock across warehouses  
**So that** I can track inventory by location

#### Task 22.1.1: Implement Warehouse Management

**Subtasks:**
1. Create `warehouses` table (id, business_id, name, address, gstin_if_different, is_default)
2. Create `POST /api/warehouses` endpoint
3. Create warehouse with name and address
4. Support separate GSTIN per warehouse (if different)
5. Mark default warehouse
6. Create `GET /api/warehouses` endpoint
7. List all warehouses
8. Update warehouse details
9. Delete warehouse (only if no stock)

**Acceptance Criteria:**
- [ ] Warehouse created
- [ ] GSTIN stored (if different)
- [ ] Default marked
- [ ] List works
- [ ] Update works
- [ ] Delete validated

#### Task 22.1.2: Implement Warehouse-Wise Stock

**Subtasks:**
1. Modify stock tracking to include warehouse_id
2. Create `warehouse_stock` table (warehouse_id, item_id, quantity, avg_cost)
3. Track stock per warehouse
4. Update stock on purchase (select warehouse)
5. Update stock on sale (select warehouse)
6. Show warehouse-wise stock in item detail
7. Generate warehouse-wise stock report

**Acceptance Criteria:**
- [ ] Stock tracked per warehouse
- [ ] Purchase updates correct warehouse
- [ ] Sale updates correct warehouse
- [ ] Stock shown per warehouse
- [ ] Report generated

#### Task 22.1.3: Build Warehouse UI

**Subtasks:**
1. Create Warehouse Management screen
2. Add "New Warehouse" button
3. Warehouse form (name, address, GSTIN)
4. Show warehouse list
5. Edit/Delete warehouses
6. Show warehouse-wise stock in item detail
7. Create Warehouse Stock Report

**Acceptance Criteria:**
- [ ] Management screen works
- [ ] Form works
- [ ] List shown
- [ ] Edit/Delete works
- [ ] Stock shown per warehouse
- [ ] Report generated

### User Story 22.2: Inter-Warehouse Transfers

**As a** business with multiple warehouses  
**I want** to transfer stock between warehouses  
**So that** I can balance inventory

#### Task 22.2.1: Implement Warehouse Transfers

**Subtasks:**
1. Create `warehouse_transfers` table
2. Create `POST /api/warehouse-transfers` endpoint
3. Select from warehouse
4. Select to warehouse
5. Add items with quantities
6. Generate transfer number
7. Reduce stock from source warehouse
8. Increase stock in destination warehouse
9. Track transfer status (pending, in_transit, completed)
10. Support delivery challan for transfer
11. Create ledger entries (if needed)

**Acceptance Criteria:**
- [ ] Transfer created
- [ ] Stock reduced from source
- [ ] Stock increased in destination
- [ ] Status tracked
- [ ] Challan linked
- [ ] Ledger entries created

#### Task 22.2.2: Build Transfer UI

**Subtasks:**
1. Create "New Warehouse Transfer" screen
2. Select from warehouse
3. Select to warehouse
4. Add items with quantities
5. Show stock availability
6. Generate transfer number
7. Save transfer
8. Show transfer list
9. Update transfer status
10. Link delivery challan

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Warehouses selected
- [ ] Items added
- [ ] Stock shown
- [ ] Transfer saved
- [ ] List shown
- [ ] Status updated

---

## Module 23: Import/Export Management

### Problem Statement
Businesses engaged in import/export need to track IEC numbers, import duties, CVD (Countervailing Duty), export zero-rated supplies, and PERMIT records. This is critical for accurate cost calculation and GST compliance.

### User Story 23.1: Import Management

**As a** business importing goods  
**I want** to track imports and duties  
**So that** I can calculate accurate costs

#### Task 23.1.1: Implement Import Tracking

**Subtasks:**
1. Add `iec_number` field to businesses table (Import Export Code)
2. Create `import_records` table (bill_of_entry_number, import_date, supplier, items, basic_customs_duty, igst_on_import, total_duty, landed_cost)
3. Create `POST /api/imports` endpoint
4. Enter bill of entry number
5. Enter import date
6. Add items imported
7. Enter basic customs duty
8. Calculate IGST on import (as per GST rules)
9. Calculate total landed cost (item cost + duty + IGST)
10. Update item cost with landed cost
11. Create purchase entry with import details
12. Track import duty as cost element

**Acceptance Criteria:**
- [ ] IEC number stored
- [ ] Import record created
- [ ] Duties entered
- [ ] IGST calculated
- [ ] Landed cost calculated
- [ ] Item cost updated
- [ ] Purchase entry created

#### Task 23.1.2: Build Import UI

**Subtasks:**
1. Create Import Management screen
2. Add "New Import" button
3. Import form:
   - Bill of Entry Number
   - Import Date
   - Supplier
   - Items with quantities
   - Basic Customs Duty
   - IGST on Import
4. Show landed cost calculation
5. Save import
6. Show import list
7. Link to purchase invoice

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Form complete
- [ ] Cost calculated
- [ ] Import saved
- [ ] List shown
- [ ] Purchase linked

### User Story 23.2: Export Management

**As a** business exporting goods  
**I want** to track exports as zero-rated  
**So that** I comply with GST rules

#### Task 23.2.1: Implement Export Tracking

**Subtasks:**
1. Create `export_records` table (shipping_bill_number, export_date, customer, items, fob_value, permit_number)
2. Create `POST /api/exports` endpoint
3. Mark invoices as export (zero-rated)
4. Enter shipping bill number
5. Enter export date
6. Enter FOB value
7. Enter PERMIT number (if applicable)
8. Create zero-rated invoice (0% GST)
9. Track export in GSTR-1 (zero-rated supplies)
10. Support LUT (Letter of Undertaking) for exports
11. Track export incentives (if any)

**Acceptance Criteria:**
- [ ] Export record created
- [ ] Invoice marked zero-rated
- [ ] Shipping bill tracked
- [ ] PERMIT tracked
- [ ] GSTR-1 includes
- [ ] LUT supported

#### Task 23.2.2: Build Export UI

**Subtasks:**
1. Create Export Management screen
2. Add "New Export" button
3. Export form:
   - Shipping Bill Number
   - Export Date
   - Customer
   - Items
   - FOB Value
   - PERMIT Number
4. Mark invoice as export
5. Show zero-rated status
6. Save export
7. Show export list
8. Generate export report

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Form complete
- [ ] Zero-rated marked
- [ ] Export saved
- [ ] List shown
- [ ] Report generated

---

## Module 24: Advance Receipts & Payments

### Problem Statement
As per CGST Act Section 13, tax is due on advance receipts even before supply. Businesses need to track advance receipts and payments separately, calculate tax on advances, and adjust when actual invoice is created.

### User Story 24.1: Advance Receipts with Tax

**As a** business receiving advances  
**I want** to record advance receipts with tax  
**So that** I comply with GST rules

#### Task 24.1.1: Implement Advance Receipts

**Subtasks:**
1. Create `advance_receipts` table (party_id, amount, tax_amount, receipt_date, linked_invoice_id)
2. Create `POST /api/advance-receipts` endpoint
3. Enter advance amount
4. Calculate tax on advance (as per CGST Act Sec 13)
5. Create advance receipt voucher
6. Post tax liability (even before supply)
7. Create ledger entries
8. Link advance to invoice when created
9. Adjust tax (reverse advance tax, post actual tax)
10. Track unadjusted advances

**Acceptance Criteria:**
- [ ] Advance receipt created
- [ ] Tax calculated on advance
- [ ] Tax liability posted
- [ ] Voucher generated
- [ ] Linked to invoice
- [ ] Tax adjusted
- [ ] Unadjusted tracked

#### Task 24.1.2: Build Advance Receipt UI

**Subtasks:**
1. Create Advance Receipts screen
2. Add "New Advance Receipt" button
3. Form:
   - Party
   - Amount
   - Date
   - Payment Mode
4. Show tax calculation
5. Save receipt
6. Show advance list
7. Link to invoice
8. Show unadjusted advances

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Form works
- [ ] Tax shown
- [ ] Receipt saved
- [ ] List shown
- [ ] Linking works

### User Story 24.2: Advance Payments

**As a** business making advance payments  
**I want** to track advance payments  
**So that** I can claim ITC when invoice received

#### Task 24.2.1: Implement Advance Payments

**Subtasks:**
1. Create `advance_payments` table (party_id, amount, payment_date, linked_invoice_id)
2. Create `POST /api/advance-payments` endpoint
3. Enter advance payment amount
4. Create advance payment voucher
5. Track advance payments
6. Link to purchase invoice when received
7. Claim ITC on invoice (not on advance)
8. Track unadjusted advances

**Acceptance Criteria:**
- [ ] Advance payment created
- [ ] Voucher generated
- [ ] Payment tracked
- [ ] Linked to invoice
- [ ] ITC claimed correctly
- [ ] Unadjusted tracked

---

## Module 25: Goods Received Notes (GRN)

### Problem Statement
Businesses need to record goods received separately from purchase invoices. GRN helps track physical receipt of goods, quality checks, and later linking to purchase invoices.

### User Story 25.1: GRN Creation

**As a** business receiving goods  
**I want** to create GRN  
**So that** I can track physical receipt

#### Task 25.1.1: Implement GRN

**Subtasks:**
1. Create `grns` table (grn_number, supplier_id, received_date, items, status, linked_purchase_id)
2. Create `POST /api/grns` endpoint
3. Generate GRN number
4. Select supplier
5. Add received items with quantities
6. Enter received date
7. Track GRN status (received, quality_check, approved, rejected)
8. Update stock on approval (optional, can wait for invoice)
9. Link GRN to purchase invoice
10. Support partial receipt
11. Generate GRN PDF

**Acceptance Criteria:**
- [ ] GRN created
- [ ] Number generated
- [ ] Items added
- [ ] Status tracked
- [ ] Stock updated (if approved)
- [ ] Linked to invoice
- [ ] PDF generated

#### Task 25.1.2: Build GRN UI

**Subtasks:**
1. Create GRN Management screen
2. Add "New GRN" button
3. GRN form:
   - Supplier
   - Received Date
   - Items with quantities
   - Status
4. Show GRN list
5. Update status
6. Link to purchase invoice
7. Generate PDF

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Form works
- [ ] List shown
- [ ] Status updated
- [ ] Linking works
- [ ] PDF generated

---

## Module 26: E-Commerce TCS (GSTR-8)

### Problem Statement
E-commerce operators need to collect TCS (Tax Collected at Source) at 1% under GST and file GSTR-8. This is mandatory for e-commerce platforms.

### User Story 26.1: E-Commerce TCS Collection

**As an** e-commerce operator  
**I want** to collect TCS on transactions  
**So that** I comply with GST rules

#### Task 26.1.1: Implement E-Commerce TCS

**Subtasks:**
1. Add `is_ecommerce_operator` flag to businesses
2. Create `ecommerce_tcs` table (seller_id, transaction_id, amount, tcs_amount, transaction_date)
3. Create `POST /api/ecommerce/tcs` endpoint
4. Calculate 1% TCS on e-commerce transactions
5. Collect TCS from sellers
6. Track TCS collected
7. Generate TCS certificates for sellers
8. Include in GSTR-8

**Acceptance Criteria:**
- [ ] E-commerce flag stored
- [ ] TCS calculated (1%)
- [ ] TCS collected
- [ ] Tracked correctly
- [ ] Certificates generated
- [ ] GSTR-8 includes

#### Task 26.1.2: Implement GSTR-8

**Subtasks:**
1. Create `GET /api/gst/gstr8` endpoint
2. Aggregate TCS collected per seller
3. Format as per GSTR-8 schema
4. Generate JSON
5. Export to Excel
6. Validate data

**Acceptance Criteria:**
- [ ] GSTR-8 generated
- [ ] TCS aggregated
- [ ] Format correct
- [ ] JSON generated
- [ ] Excel exported
- [ ] Validation works

#### Task 26.1.3: Build E-Commerce TCS UI

**Subtasks:**
1. Create E-Commerce TCS screen
2. Show TCS collected per seller
3. Show transaction details
4. Generate TCS certificates
5. Generate GSTR-8
6. Export GSTR-8

**Acceptance Criteria:**
- [ ] Screen works
- [ ] TCS shown
- [ ] Certificates generated
- [ ] GSTR-8 generated
- [ ] Export works

---

## Module 27: Budgeting & Financial Planning

### Problem Statement
Businesses need to create budgets, compare actuals vs budget, and plan finances. This helps in financial control and decision-making.

### User Story 27.1: Budget Creation

**As a** business owner  
**I want** to create budgets  
**So that** I can plan finances

#### Task 27.1.1: Implement Budgeting

**Subtasks:**
1. Create `budgets` table (business_id, financial_year, budget_type, account_id, period, budget_amount)
2. Create `POST /api/budgets` endpoint
3. Select financial year
4. Select budget type (income, expense, sales, purchase)
5. Select account/category
6. Enter budget amount per period (monthly/quarterly/yearly)
7. Support multiple budgets per year
8. Track budget vs actual
9. Generate budget reports

**Acceptance Criteria:**
- [ ] Budget created
- [ ] Year selected
- [ ] Type selected
- [ ] Amount entered
- [ ] Period defined
- [ ] Multiple budgets supported
- [ ] Reports generated

#### Task 27.1.2: Build Budget UI

**Subtasks:**
1. Create Budget Management screen
2. Add "New Budget" button
3. Budget form:
   - Financial Year
   - Budget Type
   - Account/Category
   - Period
   - Amount
4. Show budget list
5. Create Budget vs Actual Report
6. Show variance analysis

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Form works
- [ ] List shown
- [ ] Report generated
- [ ] Variance shown

---

## Module 28: Depreciation Management

### Problem Statement
Businesses need to calculate depreciation on fixed assets as per Income Tax Act. This is required for accurate P&L and tax calculations.

### User Story 28.1: Asset Depreciation

**As a** business owner  
**I want** to calculate depreciation  
**So that** I can claim tax benefits

#### Task 28.1.1: Implement Depreciation

**Subtasks:**
1. Create `fixed_assets` table (asset_name, purchase_date, purchase_value, depreciation_method, rate, useful_life)
2. Create `POST /api/assets` endpoint
3. Add fixed asset
4. Select depreciation method (WDV - Written Down Value, SLM - Straight Line Method)
5. Enter depreciation rate (as per Income Tax Act)
6. Calculate annual depreciation
7. Calculate monthly depreciation
8. Track accumulated depreciation
9. Calculate book value (purchase value - accumulated depreciation)
10. Generate depreciation journal entries
11. Support asset sale/disposal

**Acceptance Criteria:**
- [ ] Asset created
- [ ] Method selected
- [ ] Rate entered
- [ ] Depreciation calculated
- [ ] Accumulated tracked
- [ ] Book value calculated
- [ ] Journal entries created

#### Task 28.1.2: Build Depreciation UI

**Subtasks:**
1. Create Asset Management screen
2. Add "New Asset" button
3. Asset form:
   - Asset Name
   - Purchase Date
   - Purchase Value
   - Depreciation Method
   - Rate
   - Useful Life
4. Show asset list
5. Show depreciation schedule
6. Generate depreciation report
7. Calculate current book value

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Form works
- [ ] List shown
- [ ] Schedule shown
- [ ] Report generated
- [ ] Book value shown

---

## Module 29: Often-Missed Compliance Rules

### Problem Statement
Many GST and tax rules are often missed by developers, leading to compliance issues. These include ITC time limits, tax rounding nuances, advance tax, GSTR timing issues, and other subtle rules.

### User Story 29.1: ITC Time Limit Validation

**As a** GST-registered business  
**I want** to be warned about ITC time limits  
**So that** I don't lose ITC eligibility

#### Task 29.1.1: Implement ITC Time Limit Checks

**Subtasks:**
1. Check invoice date vs current date
2. Enforce 6-month rule (ITC must be claimed within 6 months of invoice date)
3. Warn if invoice is older than 6 months
4. Block ITC claim if > 6 months
5. Check supplier GSTR-1 filing status
6. Warn if supplier hasn't filed (GSTR-2A/2B missing)
7. Flag ineligible ITC
8. Show ITC eligibility report

**Acceptance Criteria:**
- [ ] 6-month check works
- [ ] Warning shown
- [ ] Blocking works
- [ ] Supplier filing checked
- [ ] Ineligible flagged
- [ ] Report generated

### User Story 29.2: Tax Rounding Rules

**As a** system  
**I want** to round taxes correctly  
**So that** invoices are compliant

#### Task 29.2.1: Implement Tax Rounding

**Subtasks:**
1. Round each tax component (CGST, SGST, IGST) separately
2. Round to nearest rupee (≥0.50 up, <0.50 down)
3. Round invoice total to nearest rupee
4. Add "round-off" line item if needed
5. Ensure total matches sum of components
6. Handle multiple tax rates in one invoice
7. Test edge cases (0.49, 0.50, 0.51)

**Acceptance Criteria:**
- [ ] Each component rounded
- [ ] Rounding rule correct
- [ ] Total rounded
- [ ] Round-off added
- [ ] Total matches
- [ ] Multiple rates handled

### User Story 29.3: GSTR-3B vs GSTR-1 Timing

**As a** business user  
**I want** to handle timing differences  
**So that** returns are accurate

#### Task 29.3.1: Implement Timing Reconciliation

**Subtasks:**
1. Track GSTR-1 filing date per period
2. Track GSTR-3B filing date per period
3. Identify invoices in GSTR-1 but not in GSTR-3B
4. Identify invoices in GSTR-3B but not in GSTR-1
5. Allow provisional ITC claims
6. Reconcile after both returns filed
7. Generate reconciliation report
8. Flag mismatches

**Acceptance Criteria:**
- [ ] Filing dates tracked
- [ ] Differences identified
- [ ] Provisional claims allowed
- [ ] Reconciliation works
- [ ] Report generated
- [ ] Mismatches flagged

### User Story 29.4: Composition Scheme Limit Monitoring

**As a** composition scheme business  
**I want** to be warned about turnover limits  
**So that** I can switch schemes in time

#### Task 29.4.1: Implement Limit Monitoring

**Subtasks:**
1. Track annual turnover
2. Check against composition limit (₹1.5 Cr for goods, ₹50 Lakh for services)
3. Warn at 80% of limit
4. Warn at 90% of limit
5. Block new invoices if limit crossed
6. Prompt to switch to regular scheme
7. Disable inter-state sales for composition
8. Track limit changes

**Acceptance Criteria:**
- [ ] Turnover tracked
- [ ] Limit checked
- [ ] Warnings shown
- [ ] Blocking works
- [ ] Prompt shown
- [ ] Inter-state disabled

### User Story 29.5: Reverse Charge on Credit Notes

**As a** business user  
**I want** RCM adjusted on credit notes  
**So that** tax liability is correct

#### Task 29.5.1: Implement RCM Credit Note Adjustment

**Subtasks:**
1. Identify credit notes for RCM invoices
2. Reverse RCM tax liability
3. Adjust ITC (if any)
4. Update GSTR-3B
5. Track RCM adjustments
6. Generate adjustment report

**Acceptance Criteria:**
- [ ] Credit notes identified
- [ ] RCM reversed
- [ ] ITC adjusted
- [ ] GSTR-3B updated
- [ ] Adjustments tracked
- [ ] Report generated

---

## Module 30: SME Business Type Specific Features

### Problem Statement
Different SME types (Retailers, Wholesalers, Service Providers, Manufacturers, Pharmacies) have unique needs. The app must support features specific to each business type.

### User Story 30.1: POS Mode for Retailers

**As a** retailer  
**I want** a POS mode  
**So that** I can bill customers quickly

#### Task 30.1.1: Implement POS Mode

**Subtasks:**
1. Create POS mode toggle
2. Simplified invoice screen (barcode scan, quick add)
3. Quick payment options (Cash, UPI, Card)
4. Thermal printer support
5. Receipt generation
6. Customer selection (optional, can be walk-in)
7. Quick stock check
8. Daily sales summary
9. Cash drawer integration (optional)

**Acceptance Criteria:**
- [ ] POS mode works
- [ ] Simplified screen
- [ ] Barcode scan works
- [ ] Quick payment works
- [ ] Thermal print works
- [ ] Receipt generated
- [ ] Summary shown

### User Story 30.2: B2B Quotations & Orders for Wholesalers

**As a** wholesaler  
**I want** quotation and order workflow  
**So that** I can manage B2B sales

#### Task 30.2.1: Implement Quotation-Order-Invoice Flow

**Subtasks:**
1. Create quotation (already exists, enhance)
2. Convert quotation to order
3. Track order status (pending, confirmed, dispatched, delivered)
4. Convert order to invoice
5. Support partial delivery
6. Track order fulfillment
7. Generate order reports

**Acceptance Criteria:**
- [ ] Quotation created
- [ ] Converted to order
- [ ] Status tracked
- [ ] Converted to invoice
- [ ] Partial delivery supported
- [ ] Reports generated

### User Story 30.3: Service Provider Workflows

**As a** service provider  
**I want** service-specific features  
**So that** I can bill for services

#### Task 30.3.1: Implement Service Features

**Subtasks:**
1. Support SAC codes (not HSN)
2. Time-based billing (hourly rates)
3. Project-based billing
4. Recurring service invoices
5. Service completion certificates
6. Service tax history (legacy, if needed)

**Acceptance Criteria:**
- [ ] SAC codes supported
- [ ] Time billing works
- [ ] Project billing works
- [ ] Recurring invoices work
- [ ] Certificates generated

### User Story 30.4: Pharmacy-Specific Features

**As a** pharmacy owner  
**I want** pharmacy-specific features  
**So that** I comply with regulations

#### Task 30.4.1: Implement Pharmacy Features

**Subtasks:**
1. Track drug license number
2. Show drug license on invoices (mandatory)
3. Batch/expiry tracking (already exists, enhance)
4. Schedule H/X drug tracking
5. RCM for scheduled drugs
6. Prescription tracking (optional)
7. Low stock alerts for essential medicines

**Acceptance Criteria:**
- [ ] Drug license tracked
- [ ] Shown on invoices
- [ ] Batch/expiry works
- [ ] Schedule drugs tracked
- [ ] RCM handled
- [ ] Alerts work

### User Story 30.5: Alternate Units of Measure (UOM)

**As a** business user  
**I want** to use alternate UOMs  
**So that** I can track in different units

#### Task 30.5.1: Implement Alternate UOM

**Subtasks:**
1. Define base unit (e.g., Pcs)
2. Define alternate units (e.g., Dozen, Box)
3. Define conversion factors (1 Dozen = 12 Pcs)
4. Support purchase in one unit, sale in another
5. Auto-convert quantities
6. Show stock in base and alternate units
7. Support multiple alternate units per item

**Acceptance Criteria:**
- [ ] Base unit defined
- [ ] Alternate units defined
- [ ] Conversion factors work
- [ ] Auto-conversion works
- [ ] Stock shown in both units
- [ ] Multiple units supported

---

## Module 31: Regulatory Future-Proofing & Data Retention

### Problem Statement
GST regulations evolve constantly. E-invoicing thresholds are dropping (₹5Cr → ₹2Cr from FY2025), B2C e-invoicing is being piloted, and GSTN is rolling out new systems (IMS, RCM/ITC ledgers). The app must be architected to adapt to these changes without major redeployments. Additionally, GST audit requirements mandate 5-8 years of data retention.

### User Story 31.1: Dynamic E-Invoice Threshold Management

**As a** system  
**I want** to handle changing e-invoice thresholds  
**So that** businesses comply automatically as rules change

#### Task 31.1.1: Implement Threshold Management

**Subtasks:**
1. Create `gst_thresholds` configuration table (threshold_type, amount, effective_date, status)
2. Store e-invoice threshold (currently ₹5Cr, will be ₹2Cr from FY2025)
3. Auto-detect business turnover
4. Check if business exceeds threshold
5. Auto-enable e-invoicing if threshold exceeded
6. Notify business of threshold change
7. Support threshold updates via configuration (not code)
8. Track threshold history

**Acceptance Criteria:**
- [ ] Thresholds stored in database
- [ ] Auto-detection works
- [ ] Auto-enablement works
- [ ] Notifications sent
- [ ] Updates via config (not code)
- [ ] History tracked

### User Story 31.2: B2C E-Invoice Support

**As a** retailer  
**I want** to generate B2C e-invoices  
**So that** I comply with future mandates

#### Task 31.2.1: Implement B2C E-Invoice

**Subtasks:**
1. Add B2C e-invoice flag in invoice settings
2. Generate dynamic QR code for B2C invoices
3. Encode IRN and invoice details in QR
4. Support voluntary B2C e-invoicing (pilot)
5. Generate IRN for B2C invoices (if enabled)
6. Display QR code on invoice
7. Allow customer/authority verification via QR scan
8. Prepare for mandatory B2C e-invoicing

**Acceptance Criteria:**
- [ ] B2C flag works
- [ ] Dynamic QR generated
- [ ] IRN encoded in QR
- [ ] Voluntary mode works
- [ ] QR displayed on invoice
- [ ] Verification works

### User Story 31.3: Data-Driven Tax Rules

**As a** system  
**I want** tax rules to be data-driven  
**So that** rate changes don't require code deployment

#### Task 31.3.1: Implement Data-Driven Tax Engine

**Subtasks:**
1. Create `tax_rules` table (rule_type, rate, effective_date, applicable_to, conditions)
2. Store GST rates (0%, 5%, 12%, 18%, 28%) with effective dates
3. Store composition rates (1%, 5%, 6%)
4. Store TDS/TCS rates by section
5. Store exemption rules
6. Store RCM rules
7. Tax engine reads from database (not hard-coded)
8. Support rule versioning
9. Auto-apply rules based on effective date
10. Allow rule updates via admin panel

**Acceptance Criteria:**
- [ ] Rules stored in database
- [ ] Rates configurable
- [ ] Effective dates work
- [ ] Versioning works
- [ ] Auto-application works
- [ ] Admin updates work

### User Story 31.4: GSTN IMS Integration

**As a** GST-registered business  
**I want** to use GSTN Invoice Management System  
**So that** I can accept/reject supplier invoices for ITC

#### Task 31.4.1: Implement IMS Integration

**Subtasks:**
1. Research GSTN IMS API
2. Create IMS service
3. Fetch supplier invoices from IMS
4. Display pending invoices for review
5. Allow accept/reject action
6. Submit accept/reject to IMS
7. Track IMS status
8. Reconcile with purchase invoices
9. Generate IMS reports

**Acceptance Criteria:**
- [ ] IMS API integrated
- [ ] Invoices fetched
- [ ] Accept/reject works
- [ ] Status tracked
- [ ] Reconciliation works
- [ ] Reports generated

### User Story 31.5: Data Retention & Audit Trail

**As a** system  
**I want** to retain data for 5-8 years  
**So that** businesses can comply with GST audits

#### Task 31.5.1: Implement Data Retention

**Subtasks:**
1. Create data retention policy (5-8 years for GST data)
2. Implement archival strategy (hot storage → cold storage)
3. Archive old transactions (after 2 years)
4. Keep archived data accessible
5. Support data export (Excel/JSON) for audits
6. Maintain complete audit trail
7. Log all data access
8. Support point-in-time data retrieval
9. Encrypt archived data
10. Test data restoration

**Acceptance Criteria:**
- [ ] Retention policy enforced
- [ ] Archival works
- [ ] Archived data accessible
- [ ] Export works
- [ ] Audit trail complete
- [ ] Restoration tested

---

## Module 32: Partner Ecosystem (Accountants & CAs)

### Problem Statement
Accountants, CAs, and GST practitioners manage multiple clients. They need multi-client access, practice management tools, document exchange, and integrations with popular CA tools like Tally. White-label options enable franchisees and resellers.

### User Story 32.1: Accountant Multi-Client Access

**As an** accountant/CA  
**I want** to access multiple client businesses  
**So that** I can manage all clients from one dashboard

#### Task 32.1.1: Implement Accountant Access

**Subtasks:**
1. Create `accountant_users` table (accountant_id, client_business_id, access_level, status)
2. Add `user_type` field (business_owner, accountant, staff)
3. Create `POST /api/accountants/invite-client` endpoint
4. Allow accountant to invite client businesses
5. Client accepts invitation
6. Accountant can switch between clients
7. Show client list in accountant dashboard
8. Track access logs
9. Support multiple accountants per client
10. Support multiple clients per accountant

**Acceptance Criteria:**
- [ ] Accountant type supported
- [ ] Invitation works
- [ ] Client acceptance works
- [ ] Switching works
- [ ] Dashboard shows clients
- [ ] Access logged
- [ ] Multiple relationships supported

#### Task 32.1.2: Build Accountant Dashboard

**Subtasks:**
1. Create Accountant Dashboard screen
2. Show client list with key metrics:
   - Business name
   - Pending GST filings
   - Outstanding receivables
   - Low stock alerts
   - Recent activity
3. Add "Switch Client" dropdown
4. Show practice-wide metrics:
   - Total clients
   - Total pending filings
   - Total receivables across clients
5. Quick actions per client
6. Client search/filter

**Acceptance Criteria:**
- [ ] Dashboard displays
- [ ] Client list shown
- [ ] Metrics accurate
- [ ] Switching works
- [ ] Practice metrics shown
- [ ] Search works

### User Story 32.2: Practice Mode for CAs

**As a** CA  
**I want** practice management features  
**So that** I can efficiently manage my practice

#### Task 32.2.1: Implement Practice Mode

**Subtasks:**
1. Create practice mode toggle
2. Show practice-wide reports:
   - All clients' GST filings status
   - All clients' pending returns
   - All clients' compliance alerts
   - Practice revenue (if applicable)
3. Bulk operations across clients:
   - Bulk GST filing
   - Bulk report generation
   - Bulk reminder sending
4. Client grouping (by industry, location, etc.)
5. Practice calendar (filing deadlines across clients)
6. Practice analytics

**Acceptance Criteria:**
- [ ] Practice mode works
- [ ] Reports generated
- [ ] Bulk operations work
- [ ] Grouping works
- [ ] Calendar works
- [ ] Analytics shown

### User Story 32.3: Document Exchange & CA Collaboration

**As a** business owner  
**I want** to share documents with my CA  
**So that** they can help with accounting

#### Task 32.3.1: Implement Document Exchange

**Subtasks:**
1. Create `ca_documents` table (business_id, accountant_id, document_type, file_url, uploaded_by, status)
2. Create `POST /api/ca/documents/upload` endpoint
3. Allow business to upload documents (receipts, invoices, etc.)
4. Allow CA to upload documents (reports, certificates, etc.)
5. Create chat/messaging system
6. Support file attachments in chat
7. Notify recipient on upload/message
8. Track document status (pending, reviewed, approved)
9. Support document categories
10. Search documents

**Acceptance Criteria:**
- [ ] Upload works
- [ ] Chat works
- [ ] Attachments work
- [ ] Notifications sent
- [ ] Status tracked
- [ ] Search works

#### Task 32.3.2: Build Document Exchange UI

**Subtasks:**
1. Create CA Collaboration screen
2. Show document list
3. Add "Upload Document" button
4. Show chat/messages
5. File preview
6. Document status indicators
7. Filter by category/status
8. Search documents

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Upload works
- [ ] Chat works
- [ ] Preview works
- [ ] Filters work
- [ ] Search works

### User Story 32.4: Tally Integration

**As a** CA using Tally  
**I want** to export data to Tally  
**So that** I can use Tally for advanced reporting

#### Task 32.4.1: Implement Tally Export

**Subtasks:**
1. Research Tally file format (.TXT export)
2. Create Tally export service
3. Export chart of accounts to Tally
4. Export transactions to Tally
5. Export invoices to Tally
6. Export ledgers to Tally
7. Generate Tally-compatible file
8. Support Tally Prime format
9. Validate exported data
10. Allow scheduled exports

**Acceptance Criteria:**
- [ ] Tally format understood
- [ ] Export service works
- [ ] Accounts exported
- [ ] Transactions exported
- [ ] Invoices exported
- [ ] File generated correctly
- [ ] Validation works
- [ ] Scheduled exports work

#### Task 32.4.2: Build Tally Export UI

**Subtasks:**
1. Create Tally Export screen
2. Select data to export (accounts, transactions, invoices, ledgers)
3. Select date range
4. Add "Export to Tally" button
5. Generate and download file
6. Show export history
7. Schedule recurring exports

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Selection works
- [ ] Export works
- [ ] Download works
- [ ] History shown
- [ ] Scheduling works

### User Story 32.5: White-Label & Franchise Support

**As a** franchisee/reseller  
**I want** to white-label the app  
**So that** I can brand it under my name

#### Task 32.5.1: Implement White-Label

**Subtasks:**
1. Create `white_label_configs` table (partner_id, logo_url, primary_color, secondary_color, app_name, domain)
2. Create white-label configuration API
3. Allow partner to upload logo
4. Allow partner to set brand colors
5. Allow partner to set app name
6. Support custom domain
7. Apply branding to:
   - App logo
   - App colors
   - Email templates
   - Invoice templates
   - PDFs
8. Create partner portal
9. Support multiple white-label instances

**Acceptance Criteria:**
- [ ] Configuration stored
- [ ] Logo upload works
- [ ] Colors applied
- [ ] App name changed
- [ ] Domain support works
- [ ] Branding applied everywhere
- [ ] Portal works
- [ ] Multiple instances supported

#### Task 32.5.2: Build Partner Portal

**Subtasks:**
1. Create Partner Portal (web app)
2. Partner login
3. White-label configuration UI
4. Client management (for franchisees)
5. Revenue/referral tracking
6. Support ticket management
7. Training materials
8. Analytics dashboard

**Acceptance Criteria:**
- [ ] Portal works
- [ ] Login works
- [ ] Configuration UI works
- [ ] Client management works
- [ ] Revenue tracked
- [ ] Support works
- [ ] Analytics shown

---

## Module 33: Support & Operations

### Problem Statement
SMEs need comprehensive support to adopt and use the app effectively. Tiered support (self-help, reactive, priority) with multiple channels (knowledge base, chat, email, phone) and multilingual support is essential. Interactive onboarding reduces friction.

### User Story 33.1: Interactive Setup Wizard

**As a** new business owner  
**I want** an interactive setup wizard  
**So that** I can configure the app quickly

#### Task 33.1.1: Implement Setup Wizard

**Subtasks:**
1. Create multi-step setup wizard
2. Step 1: Business Details
   - Business name, type
   - GSTIN (with validation)
   - Address
3. Step 2: Business Settings
   - Financial year start
   - GST type (Regular/Composition)
   - Default tax rates
4. Step 3: Invoice Settings
   - Invoice prefix
   - Default terms
   - Template selection
5. Step 4: Inventory Setup (optional)
   - Add sample items
   - Set up categories
6. Step 5: Party Setup (optional)
   - Add sample customers
7. Step 6: Completion
   - Show summary
   - Offer demo/tutorial
   - Create first invoice prompt
8. Save progress (allow resume)
9. Skip optional steps
10. Show progress indicator

**Acceptance Criteria:**
- [ ] Wizard works
- [ ] All steps complete
- [ ] Validation works
- [ ] Progress saved
- [ ] Resume works
- [ ] Optional steps skippable
- [ ] Progress shown

#### Task 33.1.2: Build Setup Wizard UI

**Subtasks:**
1. Create Setup Wizard screen
2. Multi-step form with navigation
3. Progress bar
4. "Next" and "Back" buttons
5. "Skip" for optional steps
6. "Save & Continue Later" option
7. Validation messages
8. Success screen on completion

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Navigation works
- [ ] Progress shown
- [ ] Buttons work
- [ ] Skip works
- [ ] Save works
- [ ] Validation shown

### User Story 33.2: Knowledge Base & FAQ

**As a** user  
**I want** access to knowledge base  
**So that** I can find answers without contacting support

#### Task 33.2.1: Implement Knowledge Base

**Subtasks:**
1. Create knowledge base system
2. Organize articles by category:
   - Getting Started
   - Invoicing
   - GST Filing
   - Inventory
   - Reports
   - Troubleshooting
3. Support rich content (text, images, videos)
4. Add search functionality
5. Add article ratings (helpful/not helpful)
6. Track article views
7. Support multiple languages (English, Hindi)
8. Create FAQ section
9. Add "Related Articles" suggestions
10. Support article versioning

**Acceptance Criteria:**
- [ ] Knowledge base works
- [ ] Categories organized
- [ ] Rich content supported
- [ ] Search works
- [ ] Ratings work
- [ ] Views tracked
- [ ] Multilingual supported
- [ ] FAQ works
- [ ] Suggestions work
- [ ] Versioning works

#### Task 33.2.2: Build Knowledge Base UI

**Subtasks:**
1. Create Help/Support screen
2. Show knowledge base categories
3. Add search bar
4. Display article list
5. Show article content
6. Add "Was this helpful?" feedback
7. Show related articles
8. Add "Contact Support" option
9. Show FAQ section
10. Support language switching

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Categories shown
- [ ] Search works
- [ ] Articles displayed
- [ ] Feedback works
- [ ] Related articles shown
- [ ] Support contact works
- [ ] FAQ shown
- [ ] Language switch works

### User Story 33.3: In-App Contextual Help

**As a** user  
**I want** contextual help while using the app  
**So that** I understand features without leaving the screen

#### Task 33.3.1: Implement Contextual Help

**Subtasks:**
1. Add help icons/tooltips to key UI elements
2. Create tooltip system
3. Show tooltips on first visit
4. Support "Show me how" videos
5. Add inline help text
6. Support "?" help buttons
7. Context-aware help (show relevant articles)
8. Allow users to disable tooltips
9. Track help usage

**Acceptance Criteria:**
- [ ] Tooltips work
- [ ] First-visit tooltips shown
- [ ] Videos work
- [ ] Inline help shown
- [ ] Help buttons work
- [ ] Context-aware help works
- [ ] Disable option works
- [ ] Usage tracked

### User Story 33.4: Video Tutorials

**As a** new user  
**I want** video tutorials  
**So that** I can learn the app quickly

#### Task 33.4.1: Implement Video Tutorials

**Subtasks:**
1. Create video library
2. Record tutorials for:
   - Getting Started
   - Creating First Invoice
   - GST Filing
   - Inventory Management
   - Reports
3. Host videos (YouTube/Vimeo/self-hosted)
4. Create tutorial player
5. Support video chapters
6. Add subtitles/captions
7. Support multiple languages
8. Track video views
9. Show completion progress
10. Recommend next tutorial

**Acceptance Criteria:**
- [ ] Video library works
- [ ] Tutorials recorded
- [ ] Player works
- [ ] Chapters work
- [ ] Subtitles work
- [ ] Multilingual supported
- [ ] Views tracked
- [ ] Progress shown
- [ ] Recommendations work

### User Story 33.5: Chatbot Support

**As a** user  
**I want** a chatbot for quick answers  
**So that** I get instant help

#### Task 33.5.1: Implement Chatbot

**Subtasks:**
1. Integrate chatbot (Dialogflow/Amazon Lex/Custom)
2. Train chatbot on:
   - Common questions
   - Feature explanations
   - Troubleshooting steps
   - GST rules
3. Support natural language queries
4. Provide relevant answers
5. Escalate to human support if needed
6. Support multiple languages
7. Learn from interactions
8. Show chat history
9. Support file uploads in chat

**Acceptance Criteria:**
- [ ] Chatbot integrated
- [ ] Trained on common questions
- [ ] Natural language works
- [ ] Answers relevant
- [ ] Escalation works
- [ ] Multilingual supported
- [ ] Learning works
- [ ] History shown
- [ ] File uploads work

### User Story 33.6: Tiered Support System

**As a** support team  
**I want** a tiered support system  
**So that** we can handle support efficiently

#### Task 33.6.1: Implement Support Tiers

**Subtasks:**
1. Define support tiers:
   - Tier 1: Self-help (Knowledge base, FAQ, Chatbot)
   - Tier 2: Reactive (Email, Chat, WhatsApp)
   - Tier 3: Priority (Phone, Dedicated Account Manager)
2. Create support ticket system
3. Route tickets by tier
4. Set SLAs per tier:
   - Tier 1: Instant (self-service)
   - Tier 2: 24 hours (email/chat)
   - Tier 3: 4 hours (phone/priority)
5. Support ticket assignment
6. Track response times
7. Support ticket escalation
8. Generate support reports

**Acceptance Criteria:**
- [ ] Tiers defined
- [ ] Ticket system works
- [ ] Routing works
- [ ] SLAs enforced
- [ ] Assignment works
- [ ] Response times tracked
- [ ] Escalation works
- [ ] Reports generated

#### Task 33.6.2: Build Support UI

**Subtasks:**
1. Create Support screen
2. Show support options:
   - Knowledge Base
   - Chatbot
   - Email Support
   - Live Chat
   - Phone Support (if available)
3. Create ticket form
4. Show ticket status
5. Show ticket history
6. Show response times
7. Support file attachments
8. Show support hours

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Options shown
- [ ] Ticket form works
- [ ] Status shown
- [ ] History shown
- [ ] Attachments work
- [ ] Hours shown

### User Story 33.7: Multilingual Support

**As a** user  
**I want** the app in my language  
**So that** I can use it comfortably

#### Task 33.7.1: Implement Multilingual Support

**Subtasks:**
1. Create translation system
2. Support languages: English, Hindi (initial)
3. Create translation files
4. Translate all UI text
5. Translate error messages
6. Translate help content
7. Support RTL languages (if needed)
8. Allow language switching
9. Store user language preference
10. Support dynamic language loading

**Acceptance Criteria:**
- [ ] Translation system works
- [ ] English supported
- [ ] Hindi supported
- [ ] All text translated
- [ ] Errors translated
- [ ] Help translated
- [ ] Language switch works
- [ ] Preference stored
- [ ] Dynamic loading works

---

## Module 34: Pricing & Subscription Management

### Problem Statement
Indian SMEs are price-sensitive. A freemium model with clear tier differentiation attracts users. Feature gating based on subscription tier ensures sustainable monetization while providing value at each level.

### User Story 34.1: Subscription Tiers

**As a** business owner  
**I want** to choose a subscription plan  
**So that** I get features matching my needs

#### Task 34.1.1: Implement Subscription Tiers

**Subtasks:**
1. Define subscription tiers:
   - **Free Tier**: 
     - 1 business
     - Basic invoicing (50 invoices/month)
     - Basic inventory (100 items)
     - Mobile app only
     - Basic reports
     - No GST filing
   - **Basic Plan** (₹399/year or ₹33/month):
     - 1 business
     - Unlimited invoices
     - Unlimited inventory
     - Web + Mobile
     - GST filing (GSTR-1, 3B)
     - E-Invoice support
   - **Premium Plan** (₹2,500/year or ₹217/month):
     - 3 businesses
     - All Basic features
     - Multi-warehouse
     - Advanced reports
     - E-Way Bill
     - Bank reconciliation
     - Priority support
   - **Enterprise Plan** (Custom pricing):
     - Unlimited businesses
     - All Premium features
     - White-label option
     - API access
     - Dedicated support
     - Custom integrations
2. Create `subscription_plans` table
3. Create `business_subscriptions` table
4. Implement feature gating
5. Check subscription on feature access
6. Show upgrade prompts
7. Track subscription usage

**Acceptance Criteria:**
- [ ] Tiers defined
- [ ] Plans stored
- [ ] Feature gating works
- [ ] Access checks work
- [ ] Upgrade prompts shown
- [ ] Usage tracked

#### Task 34.1.2: Build Subscription Management UI

**Subtasks:**
1. Create Pricing/Plans screen
2. Show all plans with features
3. Feature comparison table
4. "Select Plan" buttons
5. Show current plan
6. Show usage vs limits
7. "Upgrade" button
8. "Downgrade" option (at end of cycle)
9. Billing history
10. Payment method management

**Acceptance Criteria:**
- [ ] Screen works
- [ ] Plans shown
- [ ] Comparison works
- [ ] Selection works
- [ ] Current plan shown
- [ ] Usage shown
- [ ] Upgrade works
- [ ] Billing history shown

### User Story 34.2: Feature Gating

**As a** system  
**I want** to gate features by subscription  
**So that** free users can't access premium features

#### Task 34.2.1: Implement Feature Gates

**Subtasks:**
1. Create feature flags per subscription tier
2. Define feature-to-tier mapping:
   - Free: Basic invoicing, basic inventory
   - Basic: GST filing, e-invoice
   - Premium: Multi-warehouse, advanced reports
   - Enterprise: White-label, API
3. Check feature access on API calls
4. Check feature access on UI
5. Return 403 if feature not available
6. Show upgrade prompt in UI
7. Log feature access attempts
8. Support trial periods

**Acceptance Criteria:**
- [ ] Feature flags defined
- [ ] Mapping correct
- [ ] API checks work
- [ ] UI checks work
- [ ] 403 returned correctly
- [ ] Prompts shown
- [ ] Access logged
- [ ] Trials work

### User Story 34.3: Usage Tracking & Limits

**As a** system  
**I want** to track usage against limits  
**So that** free users don't exceed limits

#### Task 34.3.1: Implement Usage Tracking

**Subtasks:**
1. Track usage metrics:
   - Invoices created (monthly)
   - Items added (total)
   - Businesses created
   - Storage used
   - API calls made
2. Create `usage_tracking` table
3. Increment counters on actions
4. Check limits before allowing action
5. Show usage dashboard
6. Warn at 80% of limit
7. Block at 100% of limit
8. Reset monthly limits
9. Show upgrade prompt when limit reached

**Acceptance Criteria:**
- [ ] Metrics tracked
- [ ] Counters incremented
- [ ] Limits checked
- [ ] Dashboard shown
- [ ] Warnings shown
- [ ] Blocking works
- [ ] Reset works
- [ ] Prompts shown

---

## Module 35: AI & Agentic AI Features

### Problem Statement
Indian SMEs face acute accounting challenges: manual bookkeeping causes errors, GST filing is complex and time-consuming, inventory management lacks intelligence, and compliance requires constant monitoring. AI and Agentic AI can autonomously execute multi-step finance workflows, reducing errors by ~80%, cutting workload, and providing competitive advantage. AI can transform invoicing, GST compliance, inventory, reporting, and CA collaboration.

### User Story 35.1: Intelligent Invoice Data Extraction (OCR)

**As a** business user  
**I want** to extract invoice data from images/PDFs  
**So that** I don't have to manually enter data

#### Task 35.1.1: Implement OCR for Invoice Extraction

**Subtasks:**
1. Integrate OCR service (Google Vision API, AWS Textract, or Tesseract)
2. Support image formats (JPG, PNG) from camera/gallery
3. Support PDF invoices
4. Support WhatsApp image uploads
5. Extract invoice fields:
   - Invoice number
   - Date
   - Party name
   - Items with quantities
   - Amounts
   - Tax details
   - GSTIN
   - HSN codes
6. Use AI/ML model to identify field positions
7. Validate extracted data
8. Auto-categorize items by HSN/SAC codes
9. Flag anomalies (missing fields, wrong formats)
10. Suggest corrections
11. Store extracted data for learning
12. Return structured invoice data

**Acceptance Criteria:**
- [ ] OCR integrated
- [ ] Multiple formats supported
- [ ] Fields extracted correctly
- [ ] HSN/SAC auto-categorized
- [ ] Anomalies flagged
- [ ] Corrections suggested
- [ ] Data validated
- [ ] Learning improves accuracy

#### Task 35.1.2: Build OCR UI

**Subtasks:**
1. Add "Scan Invoice" button in invoice creation
2. Camera capture option
3. Gallery selection option
4. PDF upload option
5. WhatsApp image import
6. Show extraction progress
7. Display extracted data in form
8. Highlight fields needing review
9. Allow manual correction
10. Show confidence scores
11. Save extracted invoice

**Acceptance Criteria:**
- [ ] Scan button works
- [ ] Camera works
- [ ] Gallery works
- [ ] PDF upload works
- [ ] Progress shown
- [ ] Data displayed
- [ ] Highlights work
- [ ] Corrections allowed
- [ ] Confidence shown

### User Story 35.2: AI-Powered Invoice Validation

**As a** business user  
**I want** AI to validate my invoices  
**So that** errors are caught before submission

#### Task 35.2.1: Implement AI Invoice Validator

**Subtasks:**
1. Create AI validation service
2. Check invoice calculations:
   - Subtotal accuracy
   - Tax calculations (CGST/SGST/IGST)
   - Total amount
   - Round-off
3. Validate GST details:
   - GSTIN format and checksum
   - HSN/SAC code validity
   - Tax rate correctness
   - Place of supply logic
4. Cross-check against past data:
   - Compare with similar invoices
   - Flag unusual amounts
   - Flag unusual items
5. Detect anomalies:
   - Duplicate invoice numbers
   - Missing mandatory fields
   - Inconsistent data
6. Suggest corrections:
   - Wrong HSN code → suggest correct one
   - Missing tax → suggest tax rate
   - Wrong calculation → show correct
7. Use ML model trained on invoice patterns
8. Return validation results with confidence

**Acceptance Criteria:**
- [ ] Calculations validated
- [ ] GST details validated
- [ ] Cross-checking works
- [ ] Anomalies detected
- [ ] Corrections suggested
- [ ] ML model improves over time
- [ ] Confidence scores provided

#### Task 35.2.2: Build Validation UI

**Subtasks:**
1. Show validation results in real-time
2. Highlight errors in red
3. Highlight warnings in yellow
4. Show suggestions in blue
5. Add "Apply Suggestion" buttons
6. Show validation score
7. Block submission if critical errors
8. Allow override with reason

**Acceptance Criteria:**
- [ ] Results shown in real-time
- [ ] Errors highlighted
- [ ] Warnings shown
- [ ] Suggestions displayed
- [ ] Apply buttons work
- [ ] Score shown
- [ ] Blocking works
- [ ] Override works

### User Story 35.3: Natural Language Invoice Creation

**As a** business user  
**I want** to create invoices using natural language  
**So that** invoicing is faster

#### Task 35.3.1: Implement NLP Invoice Creation

**Subtasks:**
1. Integrate LLM (GPT-4, Claude, or local model)
2. Create NLP processing service
3. Parse natural language queries:
   - "Generate invoice for 500 widgets to ABC Co."
   - "Create invoice for XYZ Ltd for ₹50,000"
   - "Bill customer ABC for 10 items at ₹1000 each"
4. Extract entities:
   - Party name
   - Items and quantities
   - Amounts
   - Dates
5. Match parties from database
6. Match items from inventory
7. Auto-fill invoice form
8. Show preview
9. Allow edits before saving
10. Learn from user corrections
11. Support multiple languages (English, Hindi)

**Acceptance Criteria:**
- [ ] LLM integrated
- [ ] NLP parsing works
- [ ] Entities extracted
- [ ] Parties matched
- [ ] Items matched
- [ ] Form auto-filled
- [ ] Preview shown
- [ ] Learning works
- [ ] Multilingual supported

#### Task 35.3.2: Build NLP Invoice UI

**Subtasks:**
1. Add "AI Invoice" button
2. Create chat interface
3. User types natural language query
4. Show processing indicator
5. Display extracted invoice
6. Show confidence for each field
7. Allow edits
8. Save invoice
9. Show chat history
10. Support voice input (optional)

**Acceptance Criteria:**
- [ ] Button works
- [ ] Chat interface works
- [ ] Query processed
- [ ] Invoice displayed
- [ ] Confidence shown
- [ ] Edits allowed
- [ ] Save works
- [ ] History shown
- [ ] Voice input works (if enabled)

### User Story 35.4: Smart Invoice Templates with Autofill

**As a** business user  
**I want** smart templates that autofill  
**So that** I save time on repetitive invoices

#### Task 35.4.1: Implement Smart Templates

**Subtasks:**
1. Analyze invoice history
2. Identify patterns:
   - Frequent customers
   - Common items per customer
   - Typical quantities
   - Regular discounts
   - Payment terms
3. Create smart templates per customer
4. Auto-suggest items when customer selected
5. Auto-fill quantities based on history
6. Auto-apply discounts
7. Auto-set payment terms
8. Learn from user behavior
9. Improve suggestions over time
10. Support template customization

**Acceptance Criteria:**
- [ ] History analyzed
- [ ] Patterns identified
- [ ] Templates created
- [ ] Suggestions shown
- [ ] Autofill works
- [ ] Learning improves accuracy
- [ ] Customization works

### User Story 35.5: AI-Powered Payment Reminder Agents

**As a** business user  
**I want** AI agents to send payment reminders  
**So that** I don't have to manually follow up

#### Task 35.5.1: Implement Reminder Agents

**Subtasks:**
1. Create AI reminder agent service
2. Monitor invoice due dates
3. Analyze customer payment history
4. Determine optimal reminder timing:
   - Early reminder (before due date)
   - On due date
   - After due date (escalation)
5. Personalize reminder messages:
   - Friendly tone for good payers
   - Firm tone for repeat defaulters
   - Customize per customer relationship
6. Generate reminder messages using LLM
7. Send via WhatsApp/Email/SMS
8. Track reminder effectiveness
9. Learn which messages work best
10. Escalate to partial payment negotiation (if enabled)
11. Auto-schedule follow-ups

**Acceptance Criteria:**
- [ ] Agent service works
- [ ] Due dates monitored
- [ ] History analyzed
- [ ] Timing optimized
- [ ] Messages personalized
- [ ] LLM generates messages
- [ ] Multiple channels used
- [ ] Effectiveness tracked
- [ ] Learning improves
- [ ] Escalation works

### User Story 35.6: AI-Powered Payment Matching

**As a** business user  
**I want** AI to match payments from bank statements  
**So that** reconciliation is automatic

#### Task 35.6.1: Implement AI Payment Matching

**Subtasks:**
1. Fetch bank transactions (via API or OCR)
2. Extract payment details:
   - Amount
   - Date
   - Reference number
   - Description
   - UPI ID (if UPI)
3. Use AI to match with invoices:
   - Exact amount match
   - Fuzzy amount match (within tolerance)
   - Reference number matching
   - Date proximity matching
   - Party name extraction from description
4. Calculate match confidence score
5. Auto-match high-confidence transactions
6. Flag low-confidence for manual review
7. Handle partial payments
8. Handle multiple invoices per payment
9. Learn from user corrections
10. Improve matching accuracy over time

**Acceptance Criteria:**
- [ ] Bank transactions fetched
- [ ] Details extracted
- [ ] Matching algorithm works
- [ ] Confidence calculated
- [ ] Auto-match works
- [ ] Manual review flagged
- [ ] Partial payments handled
- [ ] Learning improves

### User Story 35.7: Autonomous GST Filing Agents

**As a** GST-registered business  
**I want** AI agents to file GST returns  
**So that** I don't have to do it manually

#### Task 35.7.1: Implement GST Filing Agents

**Subtasks:**
1. Create GST Filing Agent service
2. **Invoice Ingestion Agent:**
   - Scan and parse all invoices
   - Match supplier/recipient data
   - Highlight errors (wrong GSTIN, HSN mismatches)
3. **Reconciliation Agent:**
   - Compare purchase ledgers to sales
   - Auto-match input tax credits
   - Flag unclaimed ITC
   - Identify mismatches
4. **GST Return Filing Agent:**
   - Pre-fill GSTR-1 using invoice data
   - Pre-fill GSTR-3B using calculations
   - Apply validation rules
   - Generate return JSON
   - Schedule filing ahead of deadlines
5. **Compliance & Alert Agent:**
   - Monitor GST notifications
   - Track rule changes
   - Update logic automatically
   - Notify users of impacts
6. **Audit Trail Agent:**
   - Capture all agent actions
   - Log transaction edits
   - Maintain secure audit log
7. Integrate with GSTN API
8. Auto-submit returns (with user approval)
9. Handle errors and retries
10. Generate filing reports

**Acceptance Criteria:**
- [ ] Agents created
- [ ] Invoice ingestion works
- [ ] Reconciliation works
- [ ] Return pre-filling works
- [ ] Compliance monitoring works
- [ ] Audit trail maintained
- [ ] GSTN integration works
- [ ] Auto-submission works
- [ ] Error handling works
- [ ] Reports generated

#### Task 35.7.2: Build GST Agent UI

**Subtasks:**
1. Create GST Agents Dashboard
2. Show agent status (Active, Processing, Completed)
3. Show agent actions log
4. Show reconciliation results
5. Show return preview
6. Add "Approve & File" button
7. Show filing status
8. Show compliance alerts
9. Show audit trail

**Acceptance Criteria:**
- [ ] Dashboard works
- [ ] Status shown
- [ ] Actions logged
- [ ] Results shown
- [ ] Preview works
- [ ] Approval works
- [ ] Status tracked
- [ ] Alerts shown
- [ ] Audit trail shown

### User Story 35.8: AI Bookkeeping Agents

**As a** business user  
**I want** AI to classify transactions automatically  
**So that** bookkeeping is error-free

#### Task 35.8.1: Implement Bookkeeping Agents

**Subtasks:**
1. Create AI bookkeeping agent service
2. Train on chart of accounts
3. Train on tax rules (GST, TDS, TCS)
4. Auto-classify transactions:
   - Read expense receipts (OCR)
   - Identify expense category
   - Post to correct account
   - Apply GST logic
   - Apply TDS logic (if applicable)
5. Detect anomalies:
   - Duplicate entries
   - Outlier expenses
   - Unusual patterns
6. Auto-post recurring journals:
   - Salary entries
   - Depreciation
   - Rent
   - Utilities
7. Continuous bank reconciliation:
   - Match bank feeds to payments
   - Auto-post missing entries
   - Flag discrepancies
8. Learn from user corrections
9. Improve classification accuracy
10. Generate bookkeeping reports

**Acceptance Criteria:**
- [ ] Agent service works
- [ ] Training completed
- [ ] Classification works
- [ ] Anomalies detected
- [ ] Recurring journals posted
- [ ] Reconciliation works
- [ ] Learning improves
- [ ] Reports generated

### User Story 35.9: AI-Powered Reporting with Natural Language

**As a** business owner  
**I want** to query my data in natural language  
**So that** I get insights instantly

#### Task 35.9.1: Implement NLP Reporting

**Subtasks:**
1. Integrate LLM for reporting
2. Create NLP query processor
3. Support natural language queries:
   - "What's my outstanding receivables?"
   - "Show me this quarter's profit and loss"
   - "Give me sales by state"
   - "What are my top 5 customers?"
   - "Show me expenses this month"
4. Parse query intent
5. Identify data requirements
6. Query database
7. Generate narrative report using LLM
8. Create charts/visualizations
9. Include insights and notes
10. Support follow-up questions
11. Maintain conversation context
12. Support multiple languages

**Acceptance Criteria:**
- [ ] LLM integrated
- [ ] Query parsing works
- [ ] Intent identified
- [ ] Data queried
- [ ] Narrative generated
- [ ] Charts created
- [ ] Insights included
- [ ] Follow-ups work
- [ ] Context maintained
- [ ] Multilingual supported

#### Task 35.9.2: Build NLP Reporting UI

**Subtasks:**
1. Create "Ask Accountant" chat interface
2. User types natural language query
3. Show processing indicator
4. Display report/results
5. Show charts/visualizations
6. Show narrative insights
7. Allow follow-up questions
8. Show conversation history
9. Export report (PDF/Excel)
10. Support voice input

**Acceptance Criteria:**
- [ ] Chat interface works
- [ ] Query processed
- [ ] Results displayed
- [ ] Charts shown
- [ ] Insights shown
- [ ] Follow-ups work
- [ ] History shown
- [ ] Export works
- [ ] Voice input works

### User Story 35.10: Smart Inventory Prediction & Auto-Reorder

**As a** business user  
**I want** AI to predict demand and suggest reorders  
**So that** I maintain optimal stock

#### Task 35.10.1: Implement AI Demand Prediction

**Subtasks:**
1. Create ML demand forecasting model
2. Analyze historical sales data (6-12 months)
3. Consider factors:
   - Sales trends (increasing/decreasing/stable)
   - Seasonality patterns
   - Lead times
   - Current stock levels
   - Supplier delivery times
4. Predict demand for next 30/60/90 days
5. Calculate optimal reorder quantity:
   - Forecasted demand
   - Safety stock
   - Lead time
   - Economic order quantity (EOQ)
6. Generate reorder suggestions
7. Prioritize by urgency
8. Consider multi-warehouse balancing
9. Learn from actual sales vs predictions
10. Improve accuracy over time

**Acceptance Criteria:**
- [ ] ML model created
- [ ] Historical data analyzed
- [ ] Factors considered
- [ ] Demand predicted
- [ ] Reorder quantity calculated
- [ ] Suggestions generated
- [ ] Prioritization works
- [ ] Multi-warehouse considered
- [ ] Learning improves

#### Task 35.10.2: Implement Auto-Reorder Agent

**Subtasks:**
1. Create auto-reorder agent
2. Monitor stock levels
3. Check against reorder suggestions
4. Auto-generate purchase orders (if enabled)
5. Send to suppliers (if API available)
6. Notify user of auto-orders
7. Allow approval workflow
8. Track order status
9. Learn from user approvals/rejections

**Acceptance Criteria:**
- [ ] Agent works
- [ ] Stock monitored
- [ ] Suggestions checked
- [ ] POs generated
- [ ] Suppliers notified
- [ ] User notified
- [ ] Approval works
- [ ] Status tracked
- [ ] Learning works

### User Story 35.11: AI-Powered Anomaly Detection

**As a** business owner  
**I want** AI to detect anomalies  
**So that** I catch errors and fraud early

#### Task 35.11.1: Implement Anomaly Detection

**Subtasks:**
1. Create anomaly detection service
2. Use ML models to identify patterns
3. Detect anomalies:
   - Unusual invoice amounts
   - Duplicate invoices
   - Unusual expense patterns
   - Stock discrepancies
   - Payment mismatches
   - Unusual customer behavior
4. Calculate anomaly scores
5. Flag high-risk anomalies
6. Generate alerts
7. Provide explanations
8. Learn from user feedback
9. Reduce false positives over time
10. Generate anomaly reports

**Acceptance Criteria:**
- [ ] Service works
- [ ] ML models identify patterns
- [ ] Anomalies detected
- [ ] Scores calculated
- [ ] Alerts generated
- [ ] Explanations provided
- [ ] Learning improves
- [ ] Reports generated

### User Story 35.12: AI CA Collaboration Portal

**As a** CA  
**I want** AI-powered collaboration features  
**So that** I can serve clients better

#### Task 35.12.1: Implement AI CA Portal

**Subtasks:**
1. Create AI-powered CA portal
2. Embedded chat interface (like ChatGPT)
3. CA can ask compliance questions:
   - "What's the input tax credit refund?"
   - "Show me client X's GST filing status"
   - "What are the compliance alerts?"
4. AI retrieves data and answers
5. Generate draft memos/alerts:
   - "Client X's books are finalized"
   - "GST filing draft ready for review"
6. Smart notifications:
   - High-value invoice uploaded
   - GST filing due
   - Compliance issues detected
7. AI advisory insights:
   - "Client's GST turnover exceeded threshold"
   - "Consider new compliance plan"
8. Multi-client view with AI summaries
9. Support natural language queries
10. Maintain conversation context

**Acceptance Criteria:**
- [ ] Portal works
- [ ] Chat interface works
- [ ] Questions answered
- [ ] Data retrieved
- [ ] Memos generated
- [ ] Notifications sent
- [ ] Insights provided
- [ ] Multi-client view works
- [ ] NLP works
- [ ] Context maintained

---

## Appendix: Implementation Notes

### Phased Development Approach

As per industry best practices and competitor analysis, development should proceed in phases:

**Phase 1 - Core Accounting & Billing (MVP):**
- Master data (customers, suppliers, items, chart of accounts)
- Sales invoices, purchase bills, receipts, payments
- Journal entries, ledgers
- Basic reporting (Trial Balance, P&L, Balance Sheet)

**Phase 2 - Inventory Management & Pricing:**
- Stock tracking, stock adjustments
- Multi-warehouse support
- Inventory valuation (Weighted Average, FIFO)
- Batch/Serial/Expiry tracking
- MRP and pricing

**Phase 3 - Basic GST Compliance:**
- GST calculations (CGST/SGST/IGST)
- HSN/SAC codes
- GSTR-1, GSTR-3B generation
- ITC tracking
- Composition scheme support

**Phase 4 - Advanced Features:**
- E-Invoice, E-Way Bill
- Manufacturing (BOM, Production)
- Import/Export
- Advanced reports
- Multi-user, multi-branch

### Critical Compliance Rules (Often Missed)

1. **ITC Time Limits**: 6 months from invoice date
2. **Tax on Advances**: Tax due on advance receipt (CGST Act Sec 13)
3. **Tax Rounding**: Each component rounded separately, then total
4. **GSTR Timing**: Handle differences between GSTR-1 and GSTR-3B
5. **Composition Limits**: Monitor turnover, warn at 80%/90% of limit
6. **RCM on Credit Notes**: Reverse RCM liability on credit notes
7. **HSN Digits**: 4-digit for ≤₹5Cr, 6-digit for >₹5Cr turnover

### All Features Now Covered

All features from all PDF documents have been incorporated into the PRD:

**From "Designing a 100% India-Compliant..." PDF:**
- ✅ Manufacturing & Production (BOM, Production Vouchers)
- ✅ Warehouse Management (Multi-warehouse, Transfers)
- ✅ Import/Export (IEC, Duties, Zero-rated)
- ✅ Advance Receipts/Payments (with tax)
- ✅ GRN (Goods Received Notes)
- ✅ E-Commerce TCS (GSTR-8)
- ✅ Budgeting & Depreciation
- ✅ Often-Missed Compliance Rules
- ✅ SME Business Type Specific Features
- ✅ All Inventory Types (Serial, Batch, Categories, MRP)
- ✅ All GST Returns (GSTR-1, 3B, 4, 8, 9, 9C)
- ✅ All Invoice Types
- ✅ Complete Accounting Books

**From "360° SME Accounting SaaS: Pain Points..." PDF:**
- ✅ Payment Gateway Integration (Pay Now links)
- ✅ Receivables Dashboard with Aging
- ✅ Bulk Collection Tracking
- ✅ Direct GST Portal Upload
- ✅ GST Deadline Reminders
- ✅ Demand Forecasting & Reorder Suggestions
- ✅ Pre-built Chart of Accounts
- ✅ Automated Bank Reconciliation
- ✅ Partial Data Caching

**From "Strategic Analysis..." PDF:**
- ✅ Regulatory Future-Proofing (Dynamic thresholds, B2C e-invoice)
- ✅ Data-Driven Tax Rules
- ✅ GSTN IMS Integration
- ✅ Data Retention (5-8 years)
- ✅ Accountant Multi-Client Access
- ✅ Practice Mode for CAs
- ✅ Document Exchange & CA Collaboration
- ✅ Tally Integration
- ✅ White-Label & Franchise Support
- ✅ Interactive Setup Wizard
- ✅ Knowledge Base & FAQ
- ✅ In-App Contextual Help
- ✅ Video Tutorials
- ✅ Chatbot Support
- ✅ Tiered Support System
- ✅ Multilingual Support
- ✅ Subscription Tiers & Feature Gating
- ✅ Usage Tracking & Limits

**From "AI & Agentic AI..." PDF:**
- ✅ Intelligent Invoice Data Extraction (OCR)
- ✅ AI-Powered Invoice Validation
- ✅ Natural Language Invoice Creation
- ✅ Smart Invoice Templates with Autofill
- ✅ AI-Powered Payment Reminder Agents
- ✅ AI-Powered Payment Matching
- ✅ Autonomous GST Filing Agents
- ✅ AI Bookkeeping Agents
- ✅ AI-Powered Reporting with NLP
- ✅ Smart Inventory Prediction & Auto-Reorder
- ✅ AI-Powered Anomaly Detection
- ✅ AI CA Collaboration Portal

---

**End of PRD Document**

