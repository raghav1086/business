# Business App - Database Schema Design

## Overview
This document defines the PostgreSQL database schema for the Business App microservices. Each microservice has its own database following the Database-per-Service pattern.

---

## Auth Service Database

### Table: users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) NOT NULL UNIQUE,
    phone_verified BOOLEAN DEFAULT FALSE,
    name VARCHAR(100),
    email VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    avatar_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
```

### Table: otp_requests
```sql
CREATE TABLE otp_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(20) NOT NULL, -- login, verify_phone, verify_email
    attempts INT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_requests(phone, purpose);
```

### Table: refresh_tokens
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_info JSONB, -- {device_name, os, app_version}
    ip_address VARCHAR(45),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

---

## Business Service Database

### Table: businesses
```sql
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL, -- Reference to users table (cross-service)
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50), -- retailer, wholesaler, manufacturer, service
    gstin VARCHAR(15),
    pan VARCHAR(10),
    phone VARCHAR(15),
    email VARCHAR(255),
    logo_url VARCHAR(500),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(50) DEFAULT 'India',
    
    -- Bank Details
    bank_name VARCHAR(100),
    account_number VARCHAR(20),
    ifsc_code VARCHAR(11),
    upi_id VARCHAR(100),
    
    -- Settings
    financial_year_start INT DEFAULT 4, -- April
    gst_type VARCHAR(20) DEFAULT 'regular', -- regular, composition, unregistered
    
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_businesses_gstin ON businesses(gstin);
```

### Table: business_users (Staff)
```sql
CREATE TABLE business_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL, -- owner, admin, accountant, salesman
    permissions JSONB, -- granular permissions
    status VARCHAR(20) DEFAULT 'active',
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, user_id)
);

CREATE INDEX idx_business_users_business ON business_users(business_id);
CREATE INDEX idx_business_users_user ON business_users(user_id);
```

### Table: parties
```sql
CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL, -- customer, supplier, both
    phone VARCHAR(15),
    email VARCHAR(255),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    
    -- Billing Address
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_pincode VARCHAR(10),
    
    -- Shipping Address
    shipping_same_as_billing BOOLEAN DEFAULT TRUE,
    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_pincode VARCHAR(10),
    
    -- Financial
    opening_balance DECIMAL(15,2) DEFAULT 0,
    opening_balance_type VARCHAR(10) DEFAULT 'credit', -- credit, debit
    credit_limit DECIMAL(15,2),
    credit_period_days INT,
    
    -- Metadata
    notes TEXT,
    tags VARCHAR(255)[],
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_parties_business ON parties(business_id);
CREATE INDEX idx_parties_name ON parties(business_id, name);
CREATE INDEX idx_parties_phone ON parties(phone);
CREATE INDEX idx_parties_gstin ON parties(gstin);
```

---

## Inventory Service Database

### Table: categories
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, name)
);

CREATE INDEX idx_categories_business ON categories(business_id);
```

### Table: units
```sql
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    name VARCHAR(50) NOT NULL, -- Pieces, Kg, Ltr, etc.
    short_name VARCHAR(10) NOT NULL, -- pcs, kg, ltr
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_units_business ON units(business_id);
```

### Table: items
```sql
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    category_id UUID REFERENCES categories(id),
    unit_id UUID REFERENCES units(id),
    
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50),
    barcode VARCHAR(50),
    hsn_code VARCHAR(8),
    sac_code VARCHAR(6),
    description TEXT,
    image_url VARCHAR(500),
    
    -- Pricing
    selling_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    purchase_price DECIMAL(15,2) DEFAULT 0,
    mrp DECIMAL(15,2),
    discount_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Tax
    tax_rate DECIMAL(5,2) DEFAULT 0, -- GST rate
    cess_rate DECIMAL(5,2) DEFAULT 0,
    tax_inclusive BOOLEAN DEFAULT FALSE,
    
    -- Stock
    current_stock DECIMAL(15,3) DEFAULT 0,
    low_stock_threshold DECIMAL(15,3),
    track_stock BOOLEAN DEFAULT TRUE,
    
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_items_business ON items(business_id);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_sku ON items(business_id, sku);
CREATE INDEX idx_items_barcode ON items(barcode);
CREATE INDEX idx_items_hsn ON items(hsn_code);
CREATE INDEX idx_items_name ON items(business_id, name);
```

### Table: stock_adjustments
```sql
CREATE TABLE stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(20) NOT NULL, -- add, reduce
    quantity DECIMAL(15,3) NOT NULL,
    reason VARCHAR(50) NOT NULL, -- damage, theft, correction, opening_stock, sale, purchase
    reference_type VARCHAR(50), -- invoice, purchase, manual
    reference_id UUID,
    notes TEXT,
    adjusted_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_adj_business ON stock_adjustments(business_id);
CREATE INDEX idx_stock_adj_item ON stock_adjustments(item_id);
CREATE INDEX idx_stock_adj_date ON stock_adjustments(created_at);
```

---

## Invoice Service Database

### Table: invoice_settings
```sql
CREATE TABLE invoice_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL UNIQUE,
    
    -- Invoice Number Format
    invoice_prefix VARCHAR(10) DEFAULT 'INV',
    invoice_next_number INT DEFAULT 1,
    quotation_prefix VARCHAR(10) DEFAULT 'QT',
    quotation_next_number INT DEFAULT 1,
    purchase_prefix VARCHAR(10) DEFAULT 'PUR',
    purchase_next_number INT DEFAULT 1,
    
    -- Defaults
    default_terms TEXT,
    default_notes TEXT,
    default_due_days INT DEFAULT 30,
    tax_inclusive_default BOOLEAN DEFAULT FALSE,
    
    -- Template
    template_id VARCHAR(50) DEFAULT 'classic',
    show_logo BOOLEAN DEFAULT TRUE,
    show_signature BOOLEAN DEFAULT TRUE,
    signature_url VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: invoices
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    party_id UUID NOT NULL,
    
    -- Invoice Details
    invoice_number VARCHAR(50) NOT NULL,
    invoice_type VARCHAR(20) NOT NULL, -- sale, purchase, quotation, delivery_challan, credit_note
    invoice_date DATE NOT NULL,
    due_date DATE,
    
    -- Place of Supply (for GST)
    place_of_supply VARCHAR(100),
    is_interstate BOOLEAN DEFAULT FALSE,
    
    -- Amounts
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    taxable_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    cgst_amount DECIMAL(15,2) DEFAULT 0,
    sgst_amount DECIMAL(15,2) DEFAULT 0,
    igst_amount DECIMAL(15,2) DEFAULT 0,
    cess_amount DECIMAL(15,2) DEFAULT 0,
    additional_charges DECIMAL(15,2) DEFAULT 0,
    round_off DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- Payment
    paid_amount DECIMAL(15,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, partial, paid
    
    -- E-Invoice
    irn VARCHAR(64),
    irn_date TIMESTAMP WITH TIME ZONE,
    e_invoice_status VARCHAR(20),
    
    -- Metadata
    terms TEXT,
    notes TEXT,
    internal_notes TEXT,
    attachments VARCHAR(500)[],
    
    status VARCHAR(20) DEFAULT 'draft', -- draft, final, cancelled
    cancelled_reason TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_invoices_number ON invoices(business_id, invoice_number, invoice_type);
CREATE INDEX idx_invoices_business ON invoices(business_id);
CREATE INDEX idx_invoices_party ON invoices(party_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_status ON invoices(business_id, payment_status);
```

### Table: invoice_items
```sql
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_id UUID,
    
    -- Item Details (snapshot)
    item_name VARCHAR(200) NOT NULL,
    item_description TEXT,
    hsn_code VARCHAR(8),
    unit VARCHAR(20),
    
    -- Quantity & Pricing
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Tax
    tax_rate DECIMAL(5,2) DEFAULT 0,
    cgst_rate DECIMAL(5,2) DEFAULT 0,
    sgst_rate DECIMAL(5,2) DEFAULT 0,
    igst_rate DECIMAL(5,2) DEFAULT 0,
    cess_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Calculated
    taxable_amount DECIMAL(15,2) NOT NULL,
    cgst_amount DECIMAL(15,2) DEFAULT 0,
    sgst_amount DECIMAL(15,2) DEFAULT 0,
    igst_amount DECIMAL(15,2) DEFAULT 0,
    cess_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_item ON invoice_items(item_id);
```

---

## Accounting Service Database

### Table: transactions
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    
    -- Transaction Details
    transaction_type VARCHAR(30) NOT NULL, -- payment_in, payment_out, expense, journal
    transaction_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    
    -- References
    party_id UUID,
    invoice_id UUID,
    
    -- Payment Details
    payment_mode VARCHAR(30), -- cash, bank, upi, cheque, credit
    reference_number VARCHAR(100),
    bank_name VARCHAR(100),
    
    notes TEXT,
    
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_business ON transactions(business_id);
CREATE INDEX idx_transactions_party ON transactions(party_id);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(business_id, transaction_type);
```

### Table: expenses
```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_mode VARCHAR(30),
    reference_number VARCHAR(100),
    notes TEXT,
    receipt_url VARCHAR(500),
    
    -- Recurring
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(20), -- daily, weekly, monthly, yearly
    recurring_end_date DATE,
    
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_expenses_business ON expenses(business_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(business_id, category);
```

### Table: ledger_entries
```sql
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    party_id UUID NOT NULL,
    
    entry_date DATE NOT NULL,
    entry_type VARCHAR(30) NOT NULL, -- invoice, payment, opening_balance, adjustment
    reference_type VARCHAR(30),
    reference_id UUID,
    
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    balance DECIMAL(15,2) NOT NULL,
    
    narration TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ledger_business ON ledger_entries(business_id);
CREATE INDEX idx_ledger_party ON ledger_entries(party_id);
CREATE INDEX idx_ledger_date ON ledger_entries(entry_date);
```

---

## Sync Service Tables

### Table: sync_queue (In each service or separate sync DB)
```sql
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    user_id UUID NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    
    entity_type VARCHAR(50) NOT NULL, -- invoice, party, item, etc.
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL, -- create, update, delete
    payload JSONB NOT NULL,
    
    local_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    server_timestamp TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(20) DEFAULT 'pending', -- pending, synced, conflict, failed
    retry_count INT DEFAULT 0,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sync_queue_status ON sync_queue(status, business_id);
CREATE INDEX idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
```

### Table: sync_versions
```sql
CREATE TABLE sync_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    version INT NOT NULL DEFAULT 1,
    last_modified_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_modified_by UUID NOT NULL,
    
    UNIQUE(business_id, entity_type, entity_id)
);

CREATE INDEX idx_sync_versions_business ON sync_versions(business_id);
```

---

## Common Columns Pattern

All tables follow these conventions:
- `id`: UUID primary key
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update
- `status`: Entity status (active, deleted, etc.)
- Business-scoped entities have `business_id` for multi-tenancy
