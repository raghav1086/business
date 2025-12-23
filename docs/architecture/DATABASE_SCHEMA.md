# Business App - Database Schema Design

## Overview
This document defines the **complete** PostgreSQL database schema for the Business App microservices. Each microservice has its own database following the Database-per-Service pattern.

**Version:** 2.0  
**Last Updated:** 2025-12-21  
**Status:** Complete (100%)  
**Coverage:** All 35 PRD Modules

---

## Table of Contents

1. [Auth Service Database](#auth-service-database)
2. [Business Service Database](#business-service-database)
3. [Inventory Service Database](#inventory-service-database)
4. [Invoice Service Database](#invoice-service-database)
5. [Accounting Service Database](#accounting-service-database)
6. [GST Compliance Service Database](#gst-compliance-service-database)
7. [Payments Service Database](#payments-service-database)
8. [Manufacturing Service Database](#manufacturing-service-database)
9. [Warehouse Service Database](#warehouse-service-database)
10. [Import/Export Service Database](#importexport-service-database)
11. [Notification Service Database](#notification-service-database)
12. [Subscription Service Database](#subscription-service-database)
13. [Partner/CA Service Database](#partnerca-service-database)
14. [AI/ML Service Database](#aiml-service-database)
15. [Support Service Database](#support-service-database)
16. [Sync Service Database](#sync-service-database)
17. [Common Patterns & Conventions](#common-columns-pattern)
18. [ER Diagram References](#er-diagram-references)
19. [Migration Strategy](#migration-strategy)

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
    user_type VARCHAR(20) DEFAULT 'business_owner', -- business_owner, accountant, staff
    language_preference VARCHAR(10) DEFAULT 'en', -- en, hi
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
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

### Table: user_sessions
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(100) NOT NULL,
    device_name VARCHAR(100),
    device_os VARCHAR(50),
    app_version VARCHAR(20),
    ip_address VARCHAR(45),
    is_active BOOLEAN DEFAULT TRUE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_device ON user_sessions(device_id);
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
    composition_rate DECIMAL(5,2), -- 1%, 5%, 6% based on business type
    iec_number VARCHAR(10), -- Import Export Code
    drug_license_number VARCHAR(50), -- For pharmacies
    is_ecommerce_operator BOOLEAN DEFAULT FALSE,
    
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_businesses_gstin ON businesses(gstin);
CREATE INDEX idx_businesses_status ON businesses(status);
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
CREATE INDEX idx_parties_type ON parties(business_id, type);
```

### Table: party_contacts
```sql
CREATE TABLE party_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    contact_name VARCHAR(100) NOT NULL,
    designation VARCHAR(50),
    phone VARCHAR(15),
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_party_contacts_party ON party_contacts(party_id);
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
    description TEXT,
    image_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, name)
);

CREATE INDEX idx_categories_business ON categories(business_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

### Table: units
```sql
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    name VARCHAR(50) NOT NULL, -- Pieces, Kg, Ltr, etc.
    short_name VARCHAR(10) NOT NULL, -- pcs, kg, ltr
    is_default BOOLEAN DEFAULT FALSE,
    decimal_places INT DEFAULT 0, -- 0 for Pcs, 2 for Kg, 3 for Ltr
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_units_business ON units(business_id);
```

### Table: unit_conversions
```sql
CREATE TABLE unit_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    from_unit_id UUID NOT NULL REFERENCES units(id),
    to_unit_id UUID NOT NULL REFERENCES units(id),
    conversion_factor DECIMAL(15,6) NOT NULL, -- e.g., 1 Dozen = 12 Pcs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, item_id, from_unit_id, to_unit_id)
);

CREATE INDEX idx_unit_conversions_business ON unit_conversions(business_id);
CREATE INDEX idx_unit_conversions_item ON unit_conversions(item_id);
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
    
    -- Item Type
    inventory_type VARCHAR(30) DEFAULT 'trading_goods', -- raw_material, wip, finished_goods, trading_goods, consumables, services
    
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
    
    -- Tracking Options
    track_serial BOOLEAN DEFAULT FALSE,
    track_batch BOOLEAN DEFAULT FALSE,
    
    -- Valuation
    valuation_method VARCHAR(20) DEFAULT 'weighted_average', -- weighted_average, fifo, lifo, standard_cost
    standard_cost DECIMAL(15,2),
    weighted_avg_cost DECIMAL(15,2) DEFAULT 0,
    
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
CREATE INDEX idx_items_type ON items(business_id, inventory_type);
```

### Table: item_serials
```sql
CREATE TABLE item_serials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    serial_number VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'in_stock', -- in_stock, sold, returned, damaged
    purchase_date DATE,
    purchase_invoice_id UUID,
    sale_date DATE,
    sale_invoice_id UUID,
    warranty_end_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, item_id, serial_number)
);

CREATE INDEX idx_item_serials_item ON item_serials(item_id);
CREATE INDEX idx_item_serials_serial ON item_serials(serial_number);
CREATE INDEX idx_item_serials_status ON item_serials(status);
```

### Table: item_batches
```sql
CREATE TABLE item_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE,
    quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
    purchase_rate DECIMAL(15,2),
    purchase_invoice_id UUID,
    warehouse_id UUID,
    status VARCHAR(20) DEFAULT 'active', -- active, expired, consumed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, item_id, batch_number)
);

CREATE INDEX idx_item_batches_item ON item_batches(item_id);
CREATE INDEX idx_item_batches_batch ON item_batches(batch_number);
CREATE INDEX idx_item_batches_expiry ON item_batches(expiry_date);
CREATE INDEX idx_item_batches_warehouse ON item_batches(warehouse_id);
```

### Table: hsn_codes
```sql
CREATE TABLE hsn_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(8) NOT NULL UNIQUE,
    description VARCHAR(500) NOT NULL,
    gst_rate DECIMAL(5,2) NOT NULL,
    cess_rate DECIMAL(5,2) DEFAULT 0,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_hsn_codes_code ON hsn_codes(code);
CREATE INDEX idx_hsn_codes_rate ON hsn_codes(gst_rate);
```

### Table: sac_codes
```sql
CREATE TABLE sac_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) NOT NULL UNIQUE,
    description VARCHAR(500) NOT NULL,
    gst_rate DECIMAL(5,2) NOT NULL,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sac_codes_code ON sac_codes(code);
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

### Table: price_history
```sql
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    price_type VARCHAR(20) NOT NULL, -- selling_price, purchase_price, mrp
    old_price DECIMAL(15,2),
    new_price DECIMAL(15,2) NOT NULL,
    changed_by UUID NOT NULL,
    reason TEXT,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_price_history_item ON price_history(item_id);
CREATE INDEX idx_price_history_date ON price_history(effective_from);
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
    credit_note_prefix VARCHAR(10) DEFAULT 'CN',
    credit_note_next_number INT DEFAULT 1,
    debit_note_prefix VARCHAR(10) DEFAULT 'DN',
    debit_note_next_number INT DEFAULT 1,
    delivery_challan_prefix VARCHAR(10) DEFAULT 'DC',
    delivery_challan_next_number INT DEFAULT 1,
    receipt_voucher_prefix VARCHAR(10) DEFAULT 'RV',
    receipt_voucher_next_number INT DEFAULT 1,
    payment_voucher_prefix VARCHAR(10) DEFAULT 'PV',
    payment_voucher_next_number INT DEFAULT 1,
    proforma_prefix VARCHAR(10) DEFAULT 'PI',
    proforma_next_number INT DEFAULT 1,
    
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
    
    -- E-Invoice Settings
    einvoice_enabled BOOLEAN DEFAULT FALSE,
    einvoice_username VARCHAR(100),
    einvoice_password_encrypted VARCHAR(500),
    
    -- TCS Settings
    tcs_enabled BOOLEAN DEFAULT FALSE,
    default_tcs_section VARCHAR(20),
    
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
    invoice_type VARCHAR(30) NOT NULL, -- sale, purchase, quotation, proforma, delivery_challan, credit_note, debit_note, bill_of_supply
    invoice_date DATE NOT NULL,
    due_date DATE,
    
    -- Document References
    reference_invoice_id UUID REFERENCES invoices(id), -- For credit/debit notes
    order_id UUID, -- If converted from quotation/order
    grn_id UUID, -- Linked GRN for purchases
    
    -- Place of Supply (for GST)
    place_of_supply VARCHAR(100),
    is_interstate BOOLEAN DEFAULT FALSE,
    is_export BOOLEAN DEFAULT FALSE,
    is_sez BOOLEAN DEFAULT FALSE, -- Special Economic Zone
    
    -- Reverse Charge
    is_rcm BOOLEAN DEFAULT FALSE,
    rcm_tax_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Amounts
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    taxable_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    cgst_amount DECIMAL(15,2) DEFAULT 0,
    sgst_amount DECIMAL(15,2) DEFAULT 0,
    igst_amount DECIMAL(15,2) DEFAULT 0,
    cess_amount DECIMAL(15,2) DEFAULT 0,
    tcs_amount DECIMAL(15,2) DEFAULT 0,
    tds_amount DECIMAL(15,2) DEFAULT 0,
    additional_charges DECIMAL(15,2) DEFAULT 0,
    round_off DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- Payment
    paid_amount DECIMAL(15,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, partial, paid
    
    -- E-Invoice
    irn VARCHAR(64),
    irn_date TIMESTAMP WITH TIME ZONE,
    qr_code TEXT,
    ack_number VARCHAR(20),
    ack_date TIMESTAMP WITH TIME ZONE,
    e_invoice_status VARCHAR(20), -- pending, generated, cancelled
    e_invoice_error TEXT,
    
    -- E-Way Bill
    eway_bill_number VARCHAR(20),
    eway_bill_date TIMESTAMP WITH TIME ZONE,
    eway_bill_valid_until TIMESTAMP WITH TIME ZONE,
    vehicle_number VARCHAR(15),
    transport_mode VARCHAR(20), -- road, rail, air, ship
    
    -- Metadata
    terms TEXT,
    notes TEXT,
    internal_notes TEXT,
    attachments VARCHAR(500)[],
    
    -- Warehouse (for stock deduction)
    warehouse_id UUID,
    
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
CREATE INDEX idx_invoices_type ON invoices(business_id, invoice_type);
CREATE INDEX idx_invoices_irn ON invoices(irn);
CREATE INDEX idx_invoices_eway ON invoices(eway_bill_number);
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

### Table: delivery_challans
```sql
CREATE TABLE delivery_challans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    party_id UUID NOT NULL,
    challan_number VARCHAR(50) NOT NULL,
    challan_date DATE NOT NULL,
    
    -- Addresses
    from_address TEXT,
    to_address TEXT,
    
    -- Transport Details
    vehicle_number VARCHAR(15),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(15),
    transport_mode VARCHAR(20),
    
    -- Challan Details
    challan_type VARCHAR(20) DEFAULT 'supply', -- supply, job_work, others
    
    notes TEXT,
    invoice_id UUID REFERENCES invoices(id), -- Linked when invoice created
    status VARCHAR(20) DEFAULT 'pending', -- pending, delivered, cancelled
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_delivery_challans_business ON delivery_challans(business_id);
CREATE INDEX idx_delivery_challans_party ON delivery_challans(party_id);
CREATE INDEX idx_delivery_challans_invoice ON delivery_challans(invoice_id);
```

### Table: delivery_challan_items
```sql
CREATE TABLE delivery_challan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challan_id UUID NOT NULL REFERENCES delivery_challans(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id),
    item_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dc_items_challan ON delivery_challan_items(challan_id);
```

### Table: receipt_vouchers
```sql
CREATE TABLE receipt_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    party_id UUID NOT NULL,
    voucher_number VARCHAR(50) NOT NULL,
    voucher_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    
    -- Tax on Advance (CGST Act Sec 13)
    is_advance BOOLEAN DEFAULT FALSE,
    taxable_amount DECIMAL(15,2) DEFAULT 0,
    cgst_amount DECIMAL(15,2) DEFAULT 0,
    sgst_amount DECIMAL(15,2) DEFAULT 0,
    igst_amount DECIMAL(15,2) DEFAULT 0,
    
    payment_mode VARCHAR(30),
    reference_number VARCHAR(100),
    bank_name VARCHAR(100),
    
    linked_invoice_id UUID REFERENCES invoices(id),
    is_adjusted BOOLEAN DEFAULT FALSE,
    adjusted_amount DECIMAL(15,2) DEFAULT 0,
    
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_receipt_vouchers_business ON receipt_vouchers(business_id);
CREATE INDEX idx_receipt_vouchers_party ON receipt_vouchers(party_id);
CREATE INDEX idx_receipt_vouchers_date ON receipt_vouchers(voucher_date);
```

### Table: payment_vouchers
```sql
CREATE TABLE payment_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    party_id UUID NOT NULL,
    voucher_number VARCHAR(50) NOT NULL,
    voucher_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    
    payment_mode VARCHAR(30),
    reference_number VARCHAR(100),
    bank_name VARCHAR(100),
    
    -- TDS Deduction
    tds_section VARCHAR(20),
    tds_rate DECIMAL(5,2),
    tds_amount DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,
    
    linked_invoice_id UUID REFERENCES invoices(id),
    
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_vouchers_business ON payment_vouchers(business_id);
CREATE INDEX idx_payment_vouchers_party ON payment_vouchers(party_id);
CREATE INDEX idx_payment_vouchers_date ON payment_vouchers(voucher_date);
```

### Table: grns (Goods Received Notes)
```sql
CREATE TABLE grns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    grn_number VARCHAR(50) NOT NULL,
    received_date DATE NOT NULL,
    
    -- Reference
    po_number VARCHAR(50), -- Purchase Order reference
    challan_number VARCHAR(50),
    
    warehouse_id UUID,
    
    notes TEXT,
    status VARCHAR(20) DEFAULT 'received', -- received, quality_check, approved, rejected
    linked_purchase_id UUID REFERENCES invoices(id),
    
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grns_business ON grns(business_id);
CREATE INDEX idx_grns_supplier ON grns(supplier_id);
CREATE INDEX idx_grns_date ON grns(received_date);
```

### Table: grn_items
```sql
CREATE TABLE grn_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID NOT NULL REFERENCES grns(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id),
    item_name VARCHAR(200) NOT NULL,
    ordered_quantity DECIMAL(15,3),
    received_quantity DECIMAL(15,3) NOT NULL,
    accepted_quantity DECIMAL(15,3),
    rejected_quantity DECIMAL(15,3) DEFAULT 0,
    unit VARCHAR(20),
    batch_number VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grn_items_grn ON grn_items(grn_id);
```

---

## Accounting Service Database

### Table: chart_of_accounts
```sql
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(200) NOT NULL,
    account_type VARCHAR(30) NOT NULL, -- asset, liability, capital, income, expense
    account_subtype VARCHAR(50), -- current_asset, fixed_asset, current_liability, etc.
    parent_id UUID REFERENCES chart_of_accounts(id),
    is_system_account BOOLEAN DEFAULT FALSE, -- System-created, cannot delete
    is_bank_account BOOLEAN DEFAULT FALSE,
    bank_name VARCHAR(100),
    account_number VARCHAR(20),
    ifsc_code VARCHAR(11),
    opening_balance DECIMAL(15,2) DEFAULT 0,
    opening_balance_type VARCHAR(10) DEFAULT 'debit', -- debit, credit
    current_balance DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, account_code)
);

CREATE INDEX idx_coa_business ON chart_of_accounts(business_id);
CREATE INDEX idx_coa_type ON chart_of_accounts(business_id, account_type);
CREATE INDEX idx_coa_parent ON chart_of_accounts(parent_id);
```

### Table: transactions
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    
    -- Transaction Details
    transaction_type VARCHAR(30) NOT NULL, -- payment_in, payment_out, expense, journal, contra
    transaction_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    
    -- References
    party_id UUID,
    invoice_id UUID,
    account_id UUID REFERENCES chart_of_accounts(id),
    
    -- Payment Details
    payment_mode VARCHAR(30), -- cash, bank, upi, cheque, credit, card
    reference_number VARCHAR(100),
    bank_name VARCHAR(100),
    cheque_number VARCHAR(20),
    cheque_date DATE,
    
    -- TDS/TCS
    tds_section VARCHAR(20),
    tds_amount DECIMAL(15,2) DEFAULT 0,
    tcs_section VARCHAR(20),
    tcs_amount DECIMAL(15,2) DEFAULT 0,
    
    notes TEXT,
    
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_business ON transactions(business_id);
CREATE INDEX idx_transactions_party ON transactions(party_id);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(business_id, transaction_type);
```

### Table: journal_entries
```sql
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    journal_number VARCHAR(50) NOT NULL,
    journal_date DATE NOT NULL,
    narration TEXT,
    
    reference_type VARCHAR(30), -- invoice, payment, adjustment, depreciation
    reference_id UUID,
    
    total_debit DECIMAL(15,2) NOT NULL,
    total_credit DECIMAL(15,2) NOT NULL,
    
    status VARCHAR(20) DEFAULT 'active',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_journal_entries_business ON journal_entries(business_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(journal_date);
```

### Table: journal_entry_lines
```sql
CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    party_id UUID,
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    narration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_journal_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_entry_lines(account_id);
```

### Table: expenses
```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    account_id UUID REFERENCES chart_of_accounts(id),
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_mode VARCHAR(30),
    reference_number VARCHAR(100),
    vendor_name VARCHAR(200),
    vendor_gstin VARCHAR(15),
    
    -- GST on Expense
    is_gst_applicable BOOLEAN DEFAULT FALSE,
    gst_rate DECIMAL(5,2),
    cgst_amount DECIMAL(15,2) DEFAULT 0,
    sgst_amount DECIMAL(15,2) DEFAULT 0,
    igst_amount DECIMAL(15,2) DEFAULT 0,
    itc_eligible BOOLEAN DEFAULT TRUE,
    
    notes TEXT,
    receipt_url VARCHAR(500),
    
    -- Recurring
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(20), -- daily, weekly, monthly, yearly
    recurring_end_date DATE,
    next_recurring_date DATE,
    parent_expense_id UUID REFERENCES expenses(id),
    
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_expenses_business ON expenses(business_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(business_id, category);
CREATE INDEX idx_expenses_account ON expenses(account_id);
```

### Table: expense_categories
```sql
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES expense_categories(id),
    default_account_id UUID REFERENCES chart_of_accounts(id),
    is_system BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, name)
);

CREATE INDEX idx_expense_categories_business ON expense_categories(business_id);
```

### Table: ledger_entries
```sql
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    party_id UUID NOT NULL,
    
    entry_date DATE NOT NULL,
    entry_type VARCHAR(30) NOT NULL, -- invoice, payment, opening_balance, adjustment, credit_note, debit_note
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
CREATE INDEX idx_ledger_type ON ledger_entries(entry_type);
```

### Table: bank_accounts
```sql
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    account_id UUID REFERENCES chart_of_accounts(id),
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    ifsc_code VARCHAR(11),
    branch_name VARCHAR(100),
    account_type VARCHAR(20), -- savings, current, overdraft
    opening_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    
    -- Bank API Integration
    bank_integration_enabled BOOLEAN DEFAULT FALSE,
    bank_integration_provider VARCHAR(50), -- razorpayx, yodlee
    bank_integration_credentials_encrypted TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_business ON bank_accounts(business_id);
```

### Table: bank_transactions
```sql
CREATE TABLE bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    transaction_date DATE NOT NULL,
    value_date DATE,
    
    amount DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- credit, debit
    
    description TEXT,
    reference_number VARCHAR(100),
    utr_number VARCHAR(50),
    
    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT FALSE,
    matched_transaction_id UUID REFERENCES transactions(id),
    matched_at TIMESTAMP WITH TIME ZONE,
    matched_by UUID,
    match_confidence DECIMAL(5,2), -- AI matching confidence score
    
    raw_data JSONB, -- Original bank API response
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bank_txn_account ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_txn_date ON bank_transactions(transaction_date);
CREATE INDEX idx_bank_txn_reconciled ON bank_transactions(is_reconciled);
```

### Table: bank_reconciliation_sessions
```sql
CREATE TABLE bank_reconciliation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    opening_balance_bank DECIMAL(15,2) NOT NULL,
    closing_balance_bank DECIMAL(15,2) NOT NULL,
    opening_balance_book DECIMAL(15,2) NOT NULL,
    closing_balance_book DECIMAL(15,2) NOT NULL,
    
    total_matched DECIMAL(15,2) DEFAULT 0,
    total_unmatched_bank DECIMAL(15,2) DEFAULT 0,
    total_unmatched_book DECIMAL(15,2) DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bank_recon_business ON bank_reconciliation_sessions(business_id);
CREATE INDEX idx_bank_recon_account ON bank_reconciliation_sessions(bank_account_id);
```

### Table: fixed_assets
```sql
CREATE TABLE fixed_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    asset_name VARCHAR(200) NOT NULL,
    asset_code VARCHAR(50),
    asset_category VARCHAR(100),
    
    purchase_date DATE NOT NULL,
    purchase_value DECIMAL(15,2) NOT NULL,
    purchase_invoice_id UUID,
    
    -- Depreciation
    depreciation_method VARCHAR(20) NOT NULL, -- wdv, slm (Written Down Value, Straight Line)
    depreciation_rate DECIMAL(5,2) NOT NULL,
    useful_life_years INT,
    salvage_value DECIMAL(15,2) DEFAULT 0,
    
    accumulated_depreciation DECIMAL(15,2) DEFAULT 0,
    current_book_value DECIMAL(15,2),
    
    -- Location
    location VARCHAR(200),
    assigned_to VARCHAR(100),
    
    -- Disposal
    is_disposed BOOLEAN DEFAULT FALSE,
    disposal_date DATE,
    disposal_value DECIMAL(15,2),
    disposal_type VARCHAR(20), -- sold, scrapped, donated
    
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fixed_assets_business ON fixed_assets(business_id);
CREATE INDEX idx_fixed_assets_category ON fixed_assets(business_id, asset_category);
```

### Table: depreciation_entries
```sql
CREATE TABLE depreciation_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    asset_id UUID NOT NULL REFERENCES fixed_assets(id),
    financial_year VARCHAR(10) NOT NULL, -- 2024-25
    period VARCHAR(20) NOT NULL, -- monthly: 2024-04, yearly: 2024-25
    
    opening_value DECIMAL(15,2) NOT NULL,
    depreciation_amount DECIMAL(15,2) NOT NULL,
    closing_value DECIMAL(15,2) NOT NULL,
    
    journal_entry_id UUID REFERENCES journal_entries(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_depreciation_asset ON depreciation_entries(asset_id);
CREATE INDEX idx_depreciation_year ON depreciation_entries(financial_year);
```

### Table: budgets
```sql
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    financial_year VARCHAR(10) NOT NULL, -- 2024-25
    budget_name VARCHAR(100) NOT NULL,
    budget_type VARCHAR(30) NOT NULL, -- income, expense, sales, purchase
    
    account_id UUID REFERENCES chart_of_accounts(id),
    category VARCHAR(100),
    
    status VARCHAR(20) DEFAULT 'active',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_budgets_business ON budgets(business_id);
CREATE INDEX idx_budgets_year ON budgets(financial_year);
```

### Table: budget_periods
```sql
CREATE TABLE budget_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL, -- monthly, quarterly, yearly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    budget_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    variance DECIMAL(15,2) DEFAULT 0,
    variance_percent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_budget_periods_budget ON budget_periods(budget_id);
```

---

## GST Compliance Service Database

### Table: gstr1_returns
```sql
CREATE TABLE gstr1_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    return_period VARCHAR(7) NOT NULL, -- Format: YYYY-MM (e.g., 2024-04)
    financial_year VARCHAR(9) NOT NULL, -- Format: YYYY-YY (e.g., 2024-25)
    
    -- Filing Status
    filing_status VARCHAR(20) DEFAULT 'draft', -- draft, filed, accepted, rejected
    filed_at TIMESTAMP WITH TIME ZONE,
    filed_by UUID,
    ack_number VARCHAR(50),
    ack_date TIMESTAMP WITH TIME ZONE,
    
    -- Summary Totals
    total_taxable_value DECIMAL(15,2) DEFAULT 0,
    total_igst DECIMAL(15,2) DEFAULT 0,
    total_cgst DECIMAL(15,2) DEFAULT 0,
    total_sgst DECIMAL(15,2) DEFAULT 0,
    total_cess DECIMAL(15,2) DEFAULT 0,
    
    -- JSON Export
    json_export JSONB,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, return_period)
);

CREATE INDEX idx_gstr1_business ON gstr1_returns(business_id);
CREATE INDEX idx_gstr1_period ON gstr1_returns(return_period);
CREATE INDEX idx_gstr1_status ON gstr1_returns(filing_status);
```

### Table: gstr1_b2b_invoices
```sql
CREATE TABLE gstr1_b2b_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gstr1_id UUID NOT NULL REFERENCES gstr1_returns(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    
    -- Party Details
    party_gstin VARCHAR(15) NOT NULL,
    party_name VARCHAR(200),
    
    -- Invoice Details
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    invoice_value DECIMAL(15,2) NOT NULL,
    
    -- Tax Details
    taxable_value DECIMAL(15,2) NOT NULL,
    igst DECIMAL(15,2) DEFAULT 0,
    cgst DECIMAL(15,2) DEFAULT 0,
    sgst DECIMAL(15,2) DEFAULT 0,
    cess DECIMAL(15,2) DEFAULT 0,
    
    -- Place of Supply
    place_of_supply VARCHAR(2) NOT NULL, -- State code
    is_reverse_charge BOOLEAN DEFAULT FALSE,
    
    -- Document Type
    document_type VARCHAR(20) DEFAULT 'invoice', -- invoice, credit_note, debit_note
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gstr1_b2b_gstr1 ON gstr1_b2b_invoices(gstr1_id);
CREATE INDEX idx_gstr1_b2b_invoice ON gstr1_b2b_invoices(invoice_id);
CREATE INDEX idx_gstr1_b2b_party ON gstr1_b2b_invoices(party_gstin);
```

### Table: gstr1_b2c_invoices
```sql
CREATE TABLE gstr1_b2c_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gstr1_id UUID NOT NULL REFERENCES gstr1_returns(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    
    -- Invoice Details
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    invoice_value DECIMAL(15,2) NOT NULL,
    
    -- Tax Details
    taxable_value DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    igst DECIMAL(15,2) DEFAULT 0,
    cgst DECIMAL(15,2) DEFAULT 0,
    sgst DECIMAL(15,2) DEFAULT 0,
    cess DECIMAL(15,2) DEFAULT 0,
    
    -- Place of Supply
    place_of_supply VARCHAR(2) NOT NULL, -- State code
    supply_type VARCHAR(20) DEFAULT 'interstate', -- interstate, intrastate
    
    -- Category
    invoice_type VARCHAR(20) DEFAULT 'b2c_small', -- b2c_small, b2c_large
    -- b2c_small: <= 2.5L per invoice, b2c_large: > 2.5L per invoice
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gstr1_b2c_gstr1 ON gstr1_b2c_invoices(gstr1_id);
CREATE INDEX idx_gstr1_b2c_invoice ON gstr1_b2c_invoices(invoice_id);
```

### Table: gstr1_hsn_summary
```sql
CREATE TABLE gstr1_hsn_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gstr1_id UUID NOT NULL REFERENCES gstr1_returns(id) ON DELETE CASCADE,
    
    hsn_code VARCHAR(8) NOT NULL,
    description VARCHAR(500),
    uqc VARCHAR(3), -- Unit Quantity Code (PCS, KGS, etc.)
    
    -- Quantities
    quantity DECIMAL(15,3) NOT NULL,
    
    -- Taxable Value
    taxable_value DECIMAL(15,2) NOT NULL,
    
    -- Tax Rates
    tax_rate DECIMAL(5,2) NOT NULL,
    igst DECIMAL(15,2) DEFAULT 0,
    cgst DECIMAL(15,2) DEFAULT 0,
    sgst DECIMAL(15,2) DEFAULT 0,
    cess_rate DECIMAL(5,2) DEFAULT 0,
    cess_amount DECIMAL(15,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(gstr1_id, hsn_code)
);

CREATE INDEX idx_gstr1_hsn_gstr1 ON gstr1_hsn_summary(gstr1_id);
CREATE INDEX idx_gstr1_hsn_code ON gstr1_hsn_summary(hsn_code);
```

### Table: gstr3b_returns
```sql
CREATE TABLE gstr3b_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    return_period VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    financial_year VARCHAR(9) NOT NULL,
    
    -- Filing Status
    filing_status VARCHAR(20) DEFAULT 'draft',
    filed_at TIMESTAMP WITH TIME ZONE,
    filed_by UUID,
    ack_number VARCHAR(50),
    
    -- 3.1 Outward Supplies
    outward_taxable_supply DECIMAL(15,2) DEFAULT 0,
    outward_igst DECIMAL(15,2) DEFAULT 0,
    outward_cgst DECIMAL(15,2) DEFAULT 0,
    outward_sgst DECIMAL(15,2) DEFAULT 0,
    outward_cess DECIMAL(15,2) DEFAULT 0,
    
    -- 3.2 Inward Supplies (Reverse Charge)
    inward_rcm_taxable DECIMAL(15,2) DEFAULT 0,
    inward_rcm_igst DECIMAL(15,2) DEFAULT 0,
    inward_rcm_cgst DECIMAL(15,2) DEFAULT 0,
    inward_rcm_sgst DECIMAL(15,2) DEFAULT 0,
    
    -- 4. Eligible ITC
    itc_available_igst DECIMAL(15,2) DEFAULT 0,
    itc_available_cgst DECIMAL(15,2) DEFAULT 0,
    itc_available_sgst DECIMAL(15,2) DEFAULT 0,
    itc_available_cess DECIMAL(15,2) DEFAULT 0,
    
    -- 4A. ITC Reversed
    itc_reversed_igst DECIMAL(15,2) DEFAULT 0,
    itc_reversed_cgst DECIMAL(15,2) DEFAULT 0,
    itc_reversed_sgst DECIMAL(15,2) DEFAULT 0,
    itc_reversed_cess DECIMAL(15,2) DEFAULT 0,
    
    -- 4B. Net ITC Available
    itc_net_igst DECIMAL(15,2) DEFAULT 0,
    itc_net_cgst DECIMAL(15,2) DEFAULT 0,
    itc_net_sgst DECIMAL(15,2) DEFAULT 0,
    itc_net_cess DECIMAL(15,2) DEFAULT 0,
    
    -- 4C. ITC Utilized
    itc_utilized_igst DECIMAL(15,2) DEFAULT 0,
    itc_utilized_cgst DECIMAL(15,2) DEFAULT 0,
    itc_utilized_sgst DECIMAL(15,2) DEFAULT 0,
    itc_utilized_cess DECIMAL(15,2) DEFAULT 0,
    
    -- 5. Interest & Late Fee
    interest_payable DECIMAL(15,2) DEFAULT 0,
    late_fee DECIMAL(15,2) DEFAULT 0,
    penalty DECIMAL(15,2) DEFAULT 0,
    
    -- 6. Tax Payable
    tax_payable_igst DECIMAL(15,2) DEFAULT 0,
    tax_payable_cgst DECIMAL(15,2) DEFAULT 0,
    tax_payable_sgst DECIMAL(15,2) DEFAULT 0,
    tax_payable_cess DECIMAL(15,2) DEFAULT 0,
    
    -- 7. Refund Claimed
    refund_claimed_igst DECIMAL(15,2) DEFAULT 0,
    refund_claimed_cgst DECIMAL(15,2) DEFAULT 0,
    refund_claimed_sgst DECIMAL(15,2) DEFAULT 0,
    refund_claimed_cess DECIMAL(15,2) DEFAULT 0,
    
    -- 8. Debit Entries
    debit_entry_igst DECIMAL(15,2) DEFAULT 0,
    debit_entry_cgst DECIMAL(15,2) DEFAULT 0,
    debit_entry_sgst DECIMAL(15,2) DEFAULT 0,
    debit_entry_cess DECIMAL(15,2) DEFAULT 0,
    
    -- JSON Export
    json_export JSONB,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, return_period)
);

CREATE INDEX idx_gstr3b_business ON gstr3b_returns(business_id);
CREATE INDEX idx_gstr3b_period ON gstr3b_returns(return_period);
```

### Table: e_invoices
```sql
CREATE TABLE e_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    
    -- IRN Details
    irn VARCHAR(64) UNIQUE,
    irn_date TIMESTAMP WITH TIME ZONE,
    qr_code TEXT,
    
    -- Acknowledgement
    ack_number VARCHAR(20),
    ack_date TIMESTAMP WITH TIME ZONE,
    ack_status VARCHAR(20), -- success, rejected, cancelled
    
    -- E-Invoice Payload
    einvoice_json JSONB NOT NULL,
    signed_invoice_hash VARCHAR(64),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, generated, cancelled, failed
    error_code VARCHAR(20),
    error_message TEXT,
    
    -- Cancellation
    cancelled_irn VARCHAR(64),
    cancellation_reason VARCHAR(50),
    cancellation_remarks TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- IRP Details
    irp_provider VARCHAR(50), -- cleartax, tally, etc.
    irp_request_id VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_e_invoices_business ON e_invoices(business_id);
CREATE INDEX idx_e_invoices_invoice ON e_invoices(invoice_id);
CREATE INDEX idx_e_invoices_irn ON e_invoices(irn);
CREATE INDEX idx_e_invoices_status ON e_invoices(status);
```

### Table: e_way_bills
```sql
CREATE TABLE e_way_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    
    -- E-Way Bill Details
    eway_bill_number VARCHAR(12) UNIQUE,
    eway_bill_date TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Transport Details
    transport_mode VARCHAR(20) NOT NULL, -- road, rail, air, ship
    vehicle_number VARCHAR(15),
    vehicle_type VARCHAR(20), -- regular, overloaded
    distance_km INT,
    
    -- Transporter Details
    transporter_id VARCHAR(15), -- GSTIN if registered
    transporter_name VARCHAR(200),
    transporter_doc_number VARCHAR(50), -- Transporter Doc No
    transporter_doc_date DATE,
    
    -- From/To Details
    from_place VARCHAR(100) NOT NULL,
    from_state_code VARCHAR(2) NOT NULL,
    to_place VARCHAR(100) NOT NULL,
    to_state_code VARCHAR(2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, generated, cancelled, extended, rejected
    error_code VARCHAR(20),
    error_message TEXT,
    
    -- Extension
    extended_count INT DEFAULT 0,
    last_extended_at TIMESTAMP WITH TIME ZONE,
    
    -- Cancellation
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason VARCHAR(50),
    
    -- API Details
    api_provider VARCHAR(50),
    api_request_id VARCHAR(100),
    api_response JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_eway_business ON e_way_bills(business_id);
CREATE INDEX idx_eway_invoice ON e_way_bills(invoice_id);
CREATE INDEX idx_eway_number ON e_way_bills(eway_bill_number);
CREATE INDEX idx_eway_status ON e_way_bills(status);
CREATE INDEX idx_eway_valid_until ON e_way_bills(valid_until);
```

### Table: gst_credit_notes
```sql
CREATE TABLE gst_credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    credit_note_id UUID NOT NULL REFERENCES invoices(id), -- The credit note invoice
    
    -- Original Invoice Details
    original_invoice_number VARCHAR(50) NOT NULL,
    original_invoice_date DATE NOT NULL,
    
    -- Credit Note Details
    credit_note_number VARCHAR(50) NOT NULL,
    credit_note_date DATE NOT NULL,
    
    -- Reason
    reason_code VARCHAR(20) NOT NULL, -- 01-09 as per GST rules
    reason_description TEXT,
    
    -- Amounts
    credit_amount DECIMAL(15,2) NOT NULL,
    taxable_value DECIMAL(15,2) NOT NULL,
    igst DECIMAL(15,2) DEFAULT 0,
    cgst DECIMAL(15,2) DEFAULT 0,
    sgst DECIMAL(15,2) DEFAULT 0,
    cess DECIMAL(15,2) DEFAULT 0,
    
    -- GSTR-1 Reporting
    reported_in_gstr1 BOOLEAN DEFAULT FALSE,
    gstr1_period VARCHAR(7),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gst_cn_business ON gst_credit_notes(business_id);
CREATE INDEX idx_gst_cn_invoice ON gst_credit_notes(invoice_id);
CREATE INDEX idx_gst_cn_credit_note ON gst_credit_notes(credit_note_id);
```

### Table: gst_debit_notes
```sql
CREATE TABLE gst_debit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    debit_note_id UUID NOT NULL REFERENCES invoices(id),
    
    -- Original Invoice Details
    original_invoice_number VARCHAR(50) NOT NULL,
    original_invoice_date DATE NOT NULL,
    
    -- Debit Note Details
    debit_note_number VARCHAR(50) NOT NULL,
    debit_note_date DATE NOT NULL,
    
    -- Reason
    reason_code VARCHAR(20) NOT NULL,
    reason_description TEXT,
    
    -- Amounts
    debit_amount DECIMAL(15,2) NOT NULL,
    taxable_value DECIMAL(15,2) NOT NULL,
    igst DECIMAL(15,2) DEFAULT 0,
    cgst DECIMAL(15,2) DEFAULT 0,
    sgst DECIMAL(15,2) DEFAULT 0,
    cess DECIMAL(15,2) DEFAULT 0,
    
    -- GSTR-1 Reporting
    reported_in_gstr1 BOOLEAN DEFAULT FALSE,
    gstr1_period VARCHAR(7),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gst_dn_business ON gst_debit_notes(business_id);
CREATE INDEX idx_gst_dn_invoice ON gst_debit_notes(invoice_id);
```

### Table: gst_itc_ledger
```sql
CREATE TABLE gst_itc_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    
    -- Source Document
    source_type VARCHAR(30) NOT NULL, -- purchase_invoice, expense, import, rcm
    source_id UUID NOT NULL,
    source_document_number VARCHAR(50),
    source_date DATE NOT NULL,
    
    -- Vendor Details
    vendor_gstin VARCHAR(15),
    vendor_name VARCHAR(200),
    
    -- ITC Details
    itc_type VARCHAR(20) NOT NULL, -- input, capital_goods, input_services
    eligible_itc DECIMAL(15,2) NOT NULL,
    ineligible_itc DECIMAL(15,2) DEFAULT 0,
    
    -- Tax Breakdown
    igst DECIMAL(15,2) DEFAULT 0,
    cgst DECIMAL(15,2) DEFAULT 0,
    sgst DECIMAL(15,2) DEFAULT 0,
    cess DECIMAL(15,2) DEFAULT 0,
    
    -- Utilization
    utilized_igst DECIMAL(15,2) DEFAULT 0,
    utilized_cgst DECIMAL(15,2) DEFAULT 0,
    utilized_sgst DECIMAL(15,2) DEFAULT 0,
    utilized_cess DECIMAL(15,2) DEFAULT 0,
    
    -- Reversal
    reversed_igst DECIMAL(15,2) DEFAULT 0,
    reversed_cgst DECIMAL(15,2) DEFAULT 0,
    reversed_sgst DECIMAL(15,2) DEFAULT 0,
    reversed_cess DECIMAL(15,2) DEFAULT 0,
    reversal_reason TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'available', -- available, utilized, reversed, expired
    utilization_period VARCHAR(7), -- When ITC was utilized (YYYY-MM)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_itc_business ON gst_itc_ledger(business_id);
CREATE INDEX idx_itc_source ON gst_itc_ledger(source_type, source_id);
CREATE INDEX idx_itc_status ON gst_itc_ledger(status);
CREATE INDEX idx_itc_date ON gst_itc_ledger(source_date);
```

### Table: gst_composition_returns
```sql
CREATE TABLE gst_composition_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    return_period VARCHAR(7) NOT NULL,
    financial_year VARCHAR(9) NOT NULL,
    
    -- Filing Status
    filing_status VARCHAR(20) DEFAULT 'draft',
    filed_at TIMESTAMP WITH TIME ZONE,
    ack_number VARCHAR(50),
    
    -- Turnover Details
    total_turnover DECIMAL(15,2) DEFAULT 0,
    exempt_turnover DECIMAL(15,2) DEFAULT 0,
    taxable_turnover DECIMAL(15,2) DEFAULT 0,
    
    -- Tax Payable
    composition_tax_rate DECIMAL(5,2) NOT NULL,
    tax_payable DECIMAL(15,2) DEFAULT 0,
    interest_payable DECIMAL(15,2) DEFAULT 0,
    late_fee DECIMAL(15,2) DEFAULT 0,
    
    -- Payment Details
    payment_reference VARCHAR(100),
    payment_date DATE,
    
    json_export JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, return_period)
);

CREATE INDEX idx_comp_returns_business ON gst_composition_returns(business_id);
```

---

## TDS/TCS Service Database

### Table: tds_sections
```sql
CREATE TABLE tds_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_code VARCHAR(10) NOT NULL UNIQUE, -- 194A, 194C, etc.
    section_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Rate Details
    tds_rate DECIMAL(5,2) NOT NULL,
    threshold_amount DECIMAL(15,2), -- Minimum amount for TDS
    applicable_on VARCHAR(50), -- payment, invoice, contract
    
    -- Nature of Payment
    nature_of_payment VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tds_sections_code ON tds_sections(section_code);
CREATE INDEX idx_tds_sections_active ON tds_sections(is_active);
```

### Table: tds_transactions
```sql
CREATE TABLE tds_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    
    -- Source Transaction
    source_type VARCHAR(30) NOT NULL, -- payment_voucher, invoice, expense
    source_id UUID NOT NULL,
    source_document_number VARCHAR(50),
    transaction_date DATE NOT NULL,
    
    -- Party Details
    party_id UUID,
    party_pan VARCHAR(10),
    party_name VARCHAR(200),
    party_type VARCHAR(20), -- individual, company, firm
    
    -- TDS Details
    tds_section VARCHAR(10) NOT NULL,
    gross_amount DECIMAL(15,2) NOT NULL,
    tds_rate DECIMAL(5,2) NOT NULL,
    tds_amount DECIMAL(15,2) NOT NULL,
    net_amount DECIMAL(15,2) NOT NULL,
    
    -- Payment Details
    payment_date DATE,
    payment_mode VARCHAR(30),
    cheque_number VARCHAR(20),
    cheque_date DATE,
    
    -- TDS Certificate
    certificate_number VARCHAR(50),
    certificate_date DATE,
    certificate_issued BOOLEAN DEFAULT FALSE,
    
    -- Accounting
    tds_payable_account_id UUID REFERENCES chart_of_accounts(id),
    tds_receivable_account_id UUID REFERENCES chart_of_accounts(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'deducted', -- deducted, deposited, certificate_issued
    deposited_at TIMESTAMP WITH TIME ZONE,
    deposited_by UUID,
    
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tds_business ON tds_transactions(business_id);
CREATE INDEX idx_tds_source ON tds_transactions(source_type, source_id);
CREATE INDEX idx_tds_party ON tds_transactions(party_id);
CREATE INDEX idx_tds_section ON tds_transactions(tds_section);
CREATE INDEX idx_tds_date ON tds_transactions(transaction_date);
CREATE INDEX idx_tds_status ON tds_transactions(status);
```

### Table: tds_certificates
```sql
CREATE TABLE tds_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    tds_transaction_id UUID NOT NULL REFERENCES tds_transactions(id),
    
    certificate_type VARCHAR(20) NOT NULL, -- form16a, form16, form27q
    certificate_number VARCHAR(50) NOT NULL,
    certificate_date DATE NOT NULL,
    financial_year VARCHAR(9) NOT NULL,
    quarter VARCHAR(2) NOT NULL, -- Q1, Q2, Q3, Q4
    
    -- Party Details
    party_pan VARCHAR(10) NOT NULL,
    party_name VARCHAR(200) NOT NULL,
    
    -- TDS Summary
    total_tds_deducted DECIMAL(15,2) NOT NULL,
    total_tds_deposited DECIMAL(15,2) NOT NULL,
    
    -- Certificate Details
    pdf_url VARCHAR(500),
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'generated', -- generated, sent, downloaded
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_to_email VARCHAR(255),
    
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, certificate_number)
);

CREATE INDEX idx_tds_cert_business ON tds_certificates(business_id);
CREATE INDEX idx_tds_cert_transaction ON tds_certificates(tds_transaction_id);
CREATE INDEX idx_tds_cert_party ON tds_certificates(party_pan);
CREATE INDEX idx_tds_cert_fy ON tds_certificates(financial_year, quarter);
```

### Table: tds_returns
```sql
CREATE TABLE tds_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    financial_year VARCHAR(9) NOT NULL,
    quarter VARCHAR(2) NOT NULL,
    form_type VARCHAR(10) NOT NULL, -- 24Q, 26Q, 27Q, 27EQ
    
    -- Filing Status
    filing_status VARCHAR(20) DEFAULT 'draft', -- draft, filed, accepted, rejected
    filed_at TIMESTAMP WITH TIME ZONE,
    filed_by UUID,
    ack_number VARCHAR(50),
    ack_date TIMESTAMP WITH TIME ZONE,
    
    -- Summary
    total_tds_deducted DECIMAL(15,2) DEFAULT 0,
    total_tds_deposited DECIMAL(15,2) DEFAULT 0,
    total_interest DECIMAL(15,2) DEFAULT 0,
    total_penalty DECIMAL(15,2) DEFAULT 0,
    total_fee DECIMAL(15,2) DEFAULT 0,
    
    -- JSON Export
    json_export JSONB,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, financial_year, quarter, form_type)
);

CREATE INDEX idx_tds_returns_business ON tds_returns(business_id);
CREATE INDEX idx_tds_returns_fy ON tds_returns(financial_year, quarter);
```

### Table: tcs_sections
```sql
CREATE TABLE tcs_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_code VARCHAR(10) NOT NULL UNIQUE, -- 206C(1H), 206C(1), etc.
    section_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Rate Details
    tcs_rate DECIMAL(5,2) NOT NULL,
    threshold_amount DECIMAL(15,2),
    applicable_on VARCHAR(50),
    
    -- Nature of Receipt
    nature_of_receipt VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tcs_sections_code ON tcs_sections(section_code);
```

### Table: tcs_transactions
```sql
CREATE TABLE tcs_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    
    -- Source Transaction
    source_type VARCHAR(30) NOT NULL, -- invoice, receipt_voucher
    source_id UUID NOT NULL,
    source_document_number VARCHAR(50),
    transaction_date DATE NOT NULL,
    
    -- Party Details
    party_id UUID,
    party_pan VARCHAR(10),
    party_name VARCHAR(200),
    party_type VARCHAR(20),
    
    -- TCS Details
    tcs_section VARCHAR(10) NOT NULL,
    gross_amount DECIMAL(15,2) NOT NULL,
    tcs_rate DECIMAL(5,2) NOT NULL,
    tcs_amount DECIMAL(15,2) NOT NULL,
    net_amount DECIMAL(15,2) NOT NULL,
    
    -- Receipt Details
    receipt_date DATE,
    receipt_mode VARCHAR(30),
    
    -- TCS Certificate
    certificate_number VARCHAR(50),
    certificate_date DATE,
    certificate_issued BOOLEAN DEFAULT FALSE,
    
    -- Accounting
    tcs_payable_account_id UUID REFERENCES chart_of_accounts(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'collected', -- collected, deposited, certificate_issued
    deposited_at TIMESTAMP WITH TIME ZONE,
    deposited_by UUID,
    
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tcs_business ON tcs_transactions(business_id);
CREATE INDEX idx_tcs_source ON tcs_transactions(source_type, source_id);
CREATE INDEX idx_tcs_party ON tcs_transactions(party_id);
CREATE INDEX idx_tcs_section ON tcs_transactions(tcs_section);
CREATE INDEX idx_tcs_date ON tcs_transactions(transaction_date);
```

### Table: tcs_certificates
```sql
CREATE TABLE tcs_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    tcs_transaction_id UUID NOT NULL REFERENCES tcs_transactions(id),
    
    certificate_type VARCHAR(20) NOT NULL, -- form27d
    certificate_number VARCHAR(50) NOT NULL,
    certificate_date DATE NOT NULL,
    financial_year VARCHAR(9) NOT NULL,
    quarter VARCHAR(2) NOT NULL,
    
    -- Party Details
    party_pan VARCHAR(10) NOT NULL,
    party_name VARCHAR(200) NOT NULL,
    
    -- TCS Summary
    total_tcs_collected DECIMAL(15,2) NOT NULL,
    total_tcs_deposited DECIMAL(15,2) NOT NULL,
    
    -- Certificate Details
    pdf_url VARCHAR(500),
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'generated',
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_to_email VARCHAR(255),
    
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, certificate_number)
);

CREATE INDEX idx_tcs_cert_business ON tcs_certificates(business_id);
CREATE INDEX idx_tcs_cert_transaction ON tcs_certificates(tcs_transaction_id);
CREATE INDEX idx_tcs_cert_party ON tcs_certificates(party_pan);
```

### Table: tcs_returns
```sql
CREATE TABLE tcs_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    financial_year VARCHAR(9) NOT NULL,
    quarter VARCHAR(2) NOT NULL,
    form_type VARCHAR(10) NOT NULL, -- 27EQ
    
    -- Filing Status
    filing_status VARCHAR(20) DEFAULT 'draft',
    filed_at TIMESTAMP WITH TIME ZONE,
    filed_by UUID,
    ack_number VARCHAR(50),
    
    -- Summary
    total_tcs_collected DECIMAL(15,2) DEFAULT 0,
    total_tcs_deposited DECIMAL(15,2) DEFAULT 0,
    total_interest DECIMAL(15,2) DEFAULT 0,
    total_penalty DECIMAL(15,2) DEFAULT 0,
    
    -- JSON Export
    json_export JSONB,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, financial_year, quarter, form_type)
);

CREATE INDEX idx_tcs_returns_business ON tcs_returns(business_id);
CREATE INDEX idx_tcs_returns_fy ON tcs_returns(financial_year, quarter);
```

---

## Manufacturing Service Database

### Table: bills_of_materials (BOM)
```sql
CREATE TABLE bills_of_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    
    -- BOM Details
    bom_code VARCHAR(50) NOT NULL,
    bom_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Finished Product
    finished_item_id UUID NOT NULL REFERENCES items(id),
    finished_item_quantity DECIMAL(15,3) NOT NULL DEFAULT 1,
    finished_item_unit_id UUID REFERENCES units(id),
    
    -- Version Control
    version_number INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    
    -- Costing
    total_cost DECIMAL(15,2) DEFAULT 0,
    last_calculated_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, active, obsolete
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, bom_code, version_number)
);

CREATE INDEX idx_bom_business ON bills_of_materials(business_id);
CREATE INDEX idx_bom_finished_item ON bills_of_materials(finished_item_id);
CREATE INDEX idx_bom_code ON bills_of_materials(bom_code);
CREATE INDEX idx_bom_active ON bills_of_materials(is_active);
```

### Table: bom_components
```sql
CREATE TABLE bom_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_id UUID NOT NULL REFERENCES bills_of_materials(id) ON DELETE CASCADE,
    
    -- Component Item
    component_item_id UUID NOT NULL REFERENCES items(id),
    component_quantity DECIMAL(15,3) NOT NULL,
    component_unit_id UUID REFERENCES units(id),
    
    -- Wastage/Scrap
    wastage_percent DECIMAL(5,2) DEFAULT 0,
    effective_quantity DECIMAL(15,3) NOT NULL, -- quantity + wastage
    
    -- Costing
    unit_cost DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Alternative Items
    is_optional BOOLEAN DEFAULT FALSE,
    alternative_item_id UUID REFERENCES items(id),
    
    -- Sequence
    sequence_order INT DEFAULT 0,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bom_components_bom ON bom_components(bom_id);
CREATE INDEX idx_bom_components_item ON bom_components(component_item_id);
```

### Table: production_orders
```sql
CREATE TABLE production_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    
    -- Order Details
    order_number VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL,
    
    -- BOM Reference
    bom_id UUID NOT NULL REFERENCES bills_of_materials(id),
    bom_version INT,
    
    -- Finished Product
    finished_item_id UUID NOT NULL REFERENCES items(id),
    planned_quantity DECIMAL(15,3) NOT NULL,
    produced_quantity DECIMAL(15,3) DEFAULT 0,
    rejected_quantity DECIMAL(15,3) DEFAULT 0,
    unit_id UUID REFERENCES units(id),
    
    -- Warehouse
    source_warehouse_id UUID, -- Raw material warehouse
    destination_warehouse_id UUID, -- Finished goods warehouse
    
    -- Dates
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Costing
    planned_cost DECIMAL(15,2) DEFAULT 0,
    actual_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'planned', -- planned, in_progress, completed, cancelled, on_hold
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Quality
    quality_check_required BOOLEAN DEFAULT FALSE,
    quality_check_status VARCHAR(20), -- pending, passed, failed
    quality_check_by UUID,
    quality_check_at TIMESTAMP WITH TIME ZONE,
    
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, order_number)
);

CREATE INDEX idx_prod_orders_business ON production_orders(business_id);
CREATE INDEX idx_prod_orders_bom ON production_orders(bom_id);
CREATE INDEX idx_prod_orders_finished_item ON production_orders(finished_item_id);
CREATE INDEX idx_prod_orders_status ON production_orders(status);
CREATE INDEX idx_prod_orders_date ON production_orders(order_date);
```

### Table: production_order_components
```sql
CREATE TABLE production_order_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
    
    -- Component Item
    component_item_id UUID NOT NULL REFERENCES items(id),
    bom_component_id UUID REFERENCES bom_components(id),
    
    -- Quantities
    required_quantity DECIMAL(15,3) NOT NULL,
    issued_quantity DECIMAL(15,3) DEFAULT 0,
    consumed_quantity DECIMAL(15,3) DEFAULT 0,
    returned_quantity DECIMAL(15,3) DEFAULT 0,
    unit_id UUID REFERENCES units(id),
    
    -- Warehouse
    warehouse_id UUID,
    
    -- Costing
    unit_cost DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, issued, consumed, returned
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prod_comp_order ON production_order_components(production_order_id);
CREATE INDEX idx_prod_comp_item ON production_order_components(component_item_id);
```

### Table: work_orders
```sql
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    production_order_id UUID REFERENCES production_orders(id),
    
    -- Work Order Details
    work_order_number VARCHAR(50) NOT NULL,
    work_order_date DATE NOT NULL,
    
    -- Work Center/Department
    work_center_id UUID, -- Department or work center
    work_center_name VARCHAR(100),
    
    -- Operation Details
    operation_name VARCHAR(200) NOT NULL,
    operation_sequence INT DEFAULT 0,
    
    -- Quantities
    planned_quantity DECIMAL(15,3) NOT NULL,
    completed_quantity DECIMAL(15,3) DEFAULT 0,
    rejected_quantity DECIMAL(15,3) DEFAULT 0,
    
    -- Time Tracking
    planned_hours DECIMAL(10,2) DEFAULT 0,
    actual_hours DECIMAL(10,2) DEFAULT 0,
    
    -- Labor
    labor_cost_per_hour DECIMAL(10,2) DEFAULT 0,
    total_labor_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Dates
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    
    -- Quality
    quality_check_required BOOLEAN DEFAULT FALSE,
    quality_check_status VARCHAR(20),
    
    notes TEXT,
    assigned_to UUID, -- User/Employee
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, work_order_number)
);

CREATE INDEX idx_work_orders_business ON work_orders(business_id);
CREATE INDEX idx_work_orders_prod_order ON work_orders(production_order_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
```

### Table: work_order_labor
```sql
CREATE TABLE work_order_labor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    
    -- Employee/Labor
    employee_id UUID, -- Reference to employee/user
    employee_name VARCHAR(200),
    
    -- Time Tracking
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    hours_worked DECIMAL(10,2) NOT NULL,
    
    -- Cost
    hourly_rate DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'logged', -- logged, approved, paid
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_work_labor_order ON work_order_labor(work_order_id);
CREATE INDEX idx_work_labor_employee ON work_order_labor(employee_id);
```

### Table: production_issues
```sql
CREATE TABLE production_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    production_order_id UUID NOT NULL REFERENCES production_orders(id),
    
    -- Issue Details
    issue_number VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    
    -- Component Item
    component_item_id UUID NOT NULL REFERENCES items(id),
    quantity DECIMAL(15,3) NOT NULL,
    unit_id UUID REFERENCES units(id),
    
    -- Warehouse
    from_warehouse_id UUID NOT NULL,
    to_warehouse_id UUID, -- Production warehouse
    
    -- Costing
    unit_cost DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'issued', -- issued, consumed, returned
    
    notes TEXT,
    issued_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, issue_number)
);

CREATE INDEX idx_prod_issues_business ON production_issues(business_id);
CREATE INDEX idx_prod_issues_prod_order ON production_issues(production_order_id);
CREATE INDEX idx_prod_issues_item ON production_issues(component_item_id);
```

### Table: production_receipts
```sql
CREATE TABLE production_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    production_order_id UUID NOT NULL REFERENCES production_orders(id),
    
    -- Receipt Details
    receipt_number VARCHAR(50) NOT NULL,
    receipt_date DATE NOT NULL,
    
    -- Finished Product
    finished_item_id UUID NOT NULL REFERENCES items(id),
    quantity DECIMAL(15,3) NOT NULL,
    unit_id UUID REFERENCES units(id),
    
    -- Warehouse
    to_warehouse_id UUID NOT NULL,
    
    -- Quality
    quality_check_required BOOLEAN DEFAULT FALSE,
    quality_check_status VARCHAR(20), -- pending, passed, failed
    quality_check_by UUID,
    quality_check_at TIMESTAMP WITH TIME ZONE,
    
    -- Costing
    unit_cost DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'received', -- received, quality_check, approved, rejected
    
    notes TEXT,
    received_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, receipt_number)
);

CREATE INDEX idx_prod_receipts_business ON production_receipts(business_id);
CREATE INDEX idx_prod_receipts_prod_order ON production_receipts(production_order_id);
CREATE INDEX idx_prod_receipts_item ON production_receipts(finished_item_id);
```

---

## Warehouse Service Database

### Table: warehouses
```sql
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    
    -- Warehouse Details
    warehouse_code VARCHAR(50) NOT NULL,
    warehouse_name VARCHAR(200) NOT NULL,
    warehouse_type VARCHAR(30) DEFAULT 'storage', -- storage, production, transit, virtual
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(50) DEFAULT 'India',
    
    -- Contact
    manager_name VARCHAR(100),
    manager_phone VARCHAR(15),
    manager_email VARCHAR(255),
    
    -- Settings
    is_primary BOOLEAN DEFAULT FALSE,
    allow_negative_stock BOOLEAN DEFAULT FALSE,
    track_serial_numbers BOOLEAN DEFAULT TRUE,
    track_batches BOOLEAN DEFAULT TRUE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, closed
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, warehouse_code)
);

CREATE INDEX idx_warehouses_business ON warehouses(business_id);
CREATE INDEX idx_warehouses_primary ON warehouses(business_id, is_primary);
CREATE INDEX idx_warehouses_status ON warehouses(status);
```

### Table: warehouse_locations
```sql
CREATE TABLE warehouse_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    
    -- Location Details
    location_code VARCHAR(50) NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    location_type VARCHAR(30) DEFAULT 'shelf', -- shelf, rack, bin, zone, floor
    
    -- Hierarchy
    parent_location_id UUID REFERENCES warehouse_locations(id),
    
    -- Dimensions (optional)
    length DECIMAL(10,2),
    width DECIMAL(10,2),
    height DECIMAL(10,2),
    capacity DECIMAL(15,3),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(warehouse_id, location_code)
);

CREATE INDEX idx_warehouse_locs_warehouse ON warehouse_locations(warehouse_id);
CREATE INDEX idx_warehouse_locs_parent ON warehouse_locations(parent_location_id);
```

### Table: warehouse_stock
```sql
CREATE TABLE warehouse_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    location_id UUID REFERENCES warehouse_locations(id),
    
    -- Stock Details
    quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(15,3) DEFAULT 0, -- Reserved for orders
    available_quantity DECIMAL(15,3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    
    -- Valuation
    unit_cost DECIMAL(15,2) DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    
    -- Last Transaction
    last_transaction_date DATE,
    last_transaction_type VARCHAR(20), -- in, out, adjustment
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(warehouse_id, item_id, location_id)
);

CREATE INDEX idx_warehouse_stock_business ON warehouse_stock(business_id);
CREATE INDEX idx_warehouse_stock_warehouse ON warehouse_stock(warehouse_id);
CREATE INDEX idx_warehouse_stock_item ON warehouse_stock(item_id);
CREATE INDEX idx_warehouse_stock_location ON warehouse_stock(location_id);
CREATE INDEX idx_warehouse_stock_available ON warehouse_stock(available_quantity);
```

### Table: warehouse_transfers
```sql
CREATE TABLE warehouse_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    
    -- Transfer Details
    transfer_number VARCHAR(50) NOT NULL,
    transfer_date DATE NOT NULL,
    transfer_type VARCHAR(20) DEFAULT 'internal', -- internal, inter_warehouse, return
    
    -- Warehouses
    from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    
    -- Reference
    reference_type VARCHAR(30), -- production_order, purchase, sale, adjustment
    reference_id UUID,
    reference_number VARCHAR(50),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_transit, received, cancelled
    
    -- Dates
    shipped_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    
    -- Transport
    vehicle_number VARCHAR(15),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(15),
    
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, transfer_number)
);

CREATE INDEX idx_warehouse_transfers_business ON warehouse_transfers(business_id);
CREATE INDEX idx_warehouse_transfers_from ON warehouse_transfers(from_warehouse_id);
CREATE INDEX idx_warehouse_transfers_to ON warehouse_transfers(to_warehouse_id);
CREATE INDEX idx_warehouse_transfers_status ON warehouse_transfers(status);
CREATE INDEX idx_warehouse_transfers_date ON warehouse_transfers(transfer_date);
```

### Table: warehouse_transfer_items
```sql
CREATE TABLE warehouse_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES warehouse_transfers(id) ON DELETE CASCADE,
    
    -- Item Details
    item_id UUID NOT NULL REFERENCES items(id),
    quantity DECIMAL(15,3) NOT NULL,
    unit_id UUID REFERENCES units(id),
    
    -- Quantities
    shipped_quantity DECIMAL(15,3) DEFAULT 0,
    received_quantity DECIMAL(15,3) DEFAULT 0,
    rejected_quantity DECIMAL(15,3) DEFAULT 0,
    
    -- Batch/Serial
    batch_number VARCHAR(100),
    serial_numbers VARCHAR(500)[], -- Array of serial numbers
    
    -- Costing
    unit_cost DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, shipped, received, rejected
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transfer_items_transfer ON warehouse_transfer_items(transfer_id);
CREATE INDEX idx_transfer_items_item ON warehouse_transfer_items(item_id);
```

### Table: stock_movements
```sql
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    item_id UUID NOT NULL REFERENCES items(id),
    location_id UUID REFERENCES warehouse_locations(id),
    
    -- Movement Details
    movement_type VARCHAR(30) NOT NULL, -- in, out, transfer_in, transfer_out, adjustment, production_issue, production_receipt
    movement_date DATE NOT NULL,
    quantity DECIMAL(15,3) NOT NULL,
    
    -- Reference
    reference_type VARCHAR(50), -- invoice, purchase, transfer, adjustment, production_order
    reference_id UUID,
    reference_number VARCHAR(50),
    
    -- Batch/Serial
    batch_id UUID REFERENCES item_batches(id),
    serial_id UUID REFERENCES item_serials(id),
    
    -- Costing
    unit_cost DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Stock After Movement
    stock_after DECIMAL(15,3) NOT NULL,
    
    -- User
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_business ON stock_movements(business_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
```

### Table: stock_takes (Physical Stock Verification)
```sql
CREATE TABLE stock_takes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    
    -- Stock Take Details
    stock_take_number VARCHAR(50) NOT NULL,
    stock_take_date DATE NOT NULL,
    stock_take_type VARCHAR(20) DEFAULT 'full', -- full, partial, cycle_count
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, in_progress, completed, approved, cancelled
    
    -- Counts
    total_items_counted INT DEFAULT 0,
    total_items_matched INT DEFAULT 0,
    total_items_variance INT DEFAULT 0,
    
    -- Variance Summary
    total_variance_value DECIMAL(15,2) DEFAULT 0,
    
    -- Dates
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, stock_take_number)
);

CREATE INDEX idx_stock_takes_business ON stock_takes(business_id);
CREATE INDEX idx_stock_takes_warehouse ON stock_takes(warehouse_id);
CREATE INDEX idx_stock_takes_status ON stock_takes(status);
CREATE INDEX idx_stock_takes_date ON stock_takes(stock_take_date);
```

### Table: stock_take_items
```sql
CREATE TABLE stock_take_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_take_id UUID NOT NULL REFERENCES stock_takes(id) ON DELETE CASCADE,
    
    -- Item Details
    item_id UUID NOT NULL REFERENCES items(id),
    location_id UUID REFERENCES warehouse_locations(id),
    
    -- Quantities
    system_quantity DECIMAL(15,3) NOT NULL, -- Quantity in system
    counted_quantity DECIMAL(15,3), -- Physical count
    variance_quantity DECIMAL(15,3) GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
    
    -- Valuation
    unit_cost DECIMAL(15,2) DEFAULT 0,
    variance_value DECIMAL(15,2) GENERATED ALWAYS AS (variance_quantity * unit_cost) STORED,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, counted, verified, adjusted
    
    -- Count Details
    counted_by UUID,
    counted_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_take_items_take ON stock_take_items(stock_take_id);
CREATE INDEX idx_stock_take_items_item ON stock_take_items(item_id);
CREATE INDEX idx_stock_take_items_variance ON stock_take_items(variance_quantity);
```

---

## Import/Export Service Database

### Table: import_export_codes (IEC)
```sql
CREATE TABLE import_export_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    
    -- IEC Details
    iec_number VARCHAR(10) NOT NULL UNIQUE,
    iec_issue_date DATE NOT NULL,
    iec_expiry_date DATE,
    issuing_authority VARCHAR(100) DEFAULT 'DGFT',
    
    -- Business Details (as per IEC)
    legal_name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200),
    pan VARCHAR(10) NOT NULL,
    gstin VARCHAR(15),
    
    -- Address
    registered_address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    
    -- Contact
    contact_person VARCHAR(100),
    contact_phone VARCHAR(15),
    contact_email VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, cancelled, expired
    
    -- Documents
    certificate_url VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, iec_number)
);

CREATE INDEX idx_iec_business ON import_export_codes(business_id);
CREATE INDEX idx_iec_number ON import_export_codes(iec_number);
CREATE INDEX idx_iec_status ON import_export_codes(status);
```

### Table: import_orders
```sql
CREATE TABLE import_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    
    -- Order Details
    order_number VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL,
    
    -- Supplier (Foreign)
    supplier_name VARCHAR(200) NOT NULL,
    supplier_address TEXT,
    supplier_country VARCHAR(100) NOT NULL,
    supplier_email VARCHAR(255),
    supplier_phone VARCHAR(20),
    
    -- Shipping Details
    port_of_loading VARCHAR(100),
    port_of_discharge VARCHAR(100),
    country_of_origin VARCHAR(100),
    country_of_consignment VARCHAR(100),
    
    -- Incoterms
    incoterm VARCHAR(10), -- FOB, CIF, EXW, etc.
    
    -- Currency
    currency_code VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(15,6) DEFAULT 1,
    
    -- Amounts
    total_amount_foreign DECIMAL(15,2) NOT NULL,
    total_amount_inr DECIMAL(15,2) NOT NULL,
    
    -- Customs
    customs_duty DECIMAL(15,2) DEFAULT 0,
    igst_on_import DECIMAL(15,2) DEFAULT 0,
    total_customs_duty DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, ordered, shipped, in_transit, customs_cleared, received, cancelled
    
    -- Dates
    expected_shipment_date DATE,
    actual_shipment_date DATE,
    expected_arrival_date DATE,
    actual_arrival_date DATE,
    customs_cleared_date DATE,
    received_date DATE,
    
    -- Documents
    proforma_invoice_url VARCHAR(500),
    shipping_bill_number VARCHAR(50),
    bill_of_lading_number VARCHAR(50),
    airway_bill_number VARCHAR(50),
    customs_document_url VARCHAR(500),
    
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, order_number)
);

CREATE INDEX idx_import_orders_business ON import_orders(business_id);
CREATE INDEX idx_import_orders_date ON import_orders(order_date);
CREATE INDEX idx_import_orders_status ON import_orders(status);
```

### Table: import_order_items
```sql
CREATE TABLE import_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_order_id UUID NOT NULL REFERENCES import_orders(id) ON DELETE CASCADE,
    
    -- Item Details
    item_id UUID REFERENCES items(id),
    item_name VARCHAR(200) NOT NULL,
    item_description TEXT,
    hsn_code VARCHAR(8),
    
    -- Quantities
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(20),
    
    -- Pricing
    unit_price_foreign DECIMAL(15,2) NOT NULL,
    unit_price_inr DECIMAL(15,2) NOT NULL,
    total_amount_foreign DECIMAL(15,2) NOT NULL,
    total_amount_inr DECIMAL(15,2) NOT NULL,
    
    -- Customs
    customs_duty_rate DECIMAL(5,2) DEFAULT 0,
    customs_duty_amount DECIMAL(15,2) DEFAULT 0,
    igst_rate DECIMAL(5,2) DEFAULT 0,
    igst_amount DECIMAL(15,2) DEFAULT 0,
    total_customs_duty DECIMAL(15,2) DEFAULT 0,
    
    -- Valuation
    assessable_value DECIMAL(15,2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_import_items_order ON import_order_items(import_order_id);
CREATE INDEX idx_import_items_item ON import_order_items(item_id);
```

### Table: export_orders
```sql
CREATE TABLE export_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    
    -- Order Details
    order_number VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL,
    
    -- Customer (Foreign)
    customer_name VARCHAR(200) NOT NULL,
    customer_address TEXT,
    customer_country VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Shipping Details
    port_of_loading VARCHAR(100),
    port_of_discharge VARCHAR(100),
    destination_country VARCHAR(100) NOT NULL,
    
    -- Incoterms
    incoterm VARCHAR(10), -- FOB, CIF, EXW, etc.
    
    -- Currency
    currency_code VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(15,6) DEFAULT 1,
    
    -- Amounts
    total_amount_foreign DECIMAL(15,2) NOT NULL,
    total_amount_inr DECIMAL(15,2) NOT NULL,
    
    -- Export Benefits
    export_benefit_type VARCHAR(50), -- advance_authorization, eou, sez, etc.
    export_benefit_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, confirmed, shipped, in_transit, delivered, cancelled
    
    -- Dates
    expected_shipment_date DATE,
    actual_shipment_date DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Documents
    proforma_invoice_url VARCHAR(500),
    shipping_bill_number VARCHAR(50),
    bill_of_lading_number VARCHAR(50),
    airway_bill_number VARCHAR(50),
    export_invoice_url VARCHAR(500),
    packing_list_url VARCHAR(500),
    
    -- GST
    is_export BOOLEAN DEFAULT TRUE,
    export_type VARCHAR(20) DEFAULT 'with_payment', -- with_payment, without_payment, deemed_export
    lutf_number VARCHAR(50), -- Letter of Undertaking Number
    
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, order_number)
);

CREATE INDEX idx_export_orders_business ON export_orders(business_id);
CREATE INDEX idx_export_orders_date ON export_orders(order_date);
CREATE INDEX idx_export_orders_status ON export_orders(status);
```

### Table: export_order_items
```sql
CREATE TABLE export_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_order_id UUID NOT NULL REFERENCES export_orders(id) ON DELETE CASCADE,
    
    -- Item Details
    item_id UUID REFERENCES items(id),
    item_name VARCHAR(200) NOT NULL,
    item_description TEXT,
    hsn_code VARCHAR(8),
    
    -- Quantities
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(20),
    
    -- Pricing
    unit_price_foreign DECIMAL(15,2) NOT NULL,
    unit_price_inr DECIMAL(15,2) NOT NULL,
    total_amount_foreign DECIMAL(15,2) NOT NULL,
    total_amount_inr DECIMAL(15,2) NOT NULL,
    
    -- Export Benefits
    export_benefit_rate DECIMAL(5,2) DEFAULT 0,
    export_benefit_amount DECIMAL(15,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_export_items_order ON export_order_items(export_order_id);
CREATE INDEX idx_export_items_item ON export_order_items(item_id);
```

### Table: shipping_bills
```sql
CREATE TABLE shipping_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    export_order_id UUID REFERENCES export_orders(id),
    import_order_id UUID REFERENCES import_orders(id),
    
    -- Shipping Bill Details
    shipping_bill_number VARCHAR(50) NOT NULL,
    shipping_bill_date DATE NOT NULL,
    shipping_bill_type VARCHAR(20) DEFAULT 'export', -- export, import
    
    -- Port Details
    port_code VARCHAR(10),
    port_name VARCHAR(100),
    
    -- Customs
    customs_house_code VARCHAR(10),
    customs_house_name VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'filed', -- filed, assessed, cleared, rejected
    
    -- Dates
    filed_date DATE,
    assessed_date DATE,
    cleared_date DATE,
    
    -- Amounts
    assessable_value DECIMAL(15,2) DEFAULT 0,
    total_duty DECIMAL(15,2) DEFAULT 0,
    
    -- Documents
    document_url VARCHAR(500),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, shipping_bill_number)
);

CREATE INDEX idx_shipping_bills_business ON shipping_bills(business_id);
CREATE INDEX idx_shipping_bills_export ON shipping_bills(export_order_id);
CREATE INDEX idx_shipping_bills_import ON shipping_bills(import_order_id);
CREATE INDEX idx_shipping_bills_number ON shipping_bills(shipping_bill_number);
```

### Table: customs_duty_payments
```sql
CREATE TABLE customs_duty_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    import_order_id UUID NOT NULL REFERENCES import_orders(id),
    
    -- Payment Details
    payment_number VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    
    -- Duty Breakdown
    basic_customs_duty DECIMAL(15,2) DEFAULT 0,
    additional_customs_duty DECIMAL(15,2) DEFAULT 0,
    education_cess DECIMAL(15,2) DEFAULT 0,
    igst_on_import DECIMAL(15,2) DEFAULT 0,
    total_duty DECIMAL(15,2) NOT NULL,
    
    -- Payment
    payment_mode VARCHAR(30),
    payment_reference VARCHAR(100),
    bank_name VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'paid', -- paid, pending, failed
    
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, payment_number)
);

CREATE INDEX idx_customs_payments_business ON customs_duty_payments(business_id);
CREATE INDEX idx_customs_payments_import ON customs_duty_payments(import_order_id);
CREATE INDEX idx_customs_payments_date ON customs_duty_payments(payment_date);
```

---

## Notification Service Database

### Table: notification_templates
```sql
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID, -- NULL for system-wide templates
    
    -- Template Details
    template_code VARCHAR(50) NOT NULL UNIQUE,
    template_name VARCHAR(200) NOT NULL,
    notification_type VARCHAR(30) NOT NULL, -- email, sms, push, whatsapp
    
    -- Content
    subject VARCHAR(500), -- For email
    body_text TEXT NOT NULL,
    body_html TEXT, -- For email
    
    -- Variables
    variables JSONB, -- Available variables like {invoice_number}, {amount}, etc.
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE, -- System templates cannot be deleted
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notif_templates_code ON notification_templates(template_code);
CREATE INDEX idx_notif_templates_type ON notification_templates(notification_type);
CREATE INDEX idx_notif_templates_active ON notification_templates(is_active);
```

### Table: notifications
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID,
    user_id UUID NOT NULL,
    
    -- Notification Details
    notification_type VARCHAR(30) NOT NULL, -- email, sms, push, whatsapp, in_app
    category VARCHAR(50), -- invoice, payment, stock_alert, gst_filing, etc.
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Content
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500), -- Deep link or URL
    
    -- Template
    template_id UUID REFERENCES notification_templates(id),
    template_variables JSONB, -- Variables used in template
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, read, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Error
    error_message TEXT,
    retry_count INT DEFAULT 0,
    
    -- Reference
    reference_type VARCHAR(50), -- invoice, payment, etc.
    reference_id UUID,
    
    -- Expiry
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_business ON notifications(business_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_reference ON notifications(reference_type, reference_id);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_notifications_unread ON notifications(user_id, status) WHERE status != 'read';
```

### Table: notification_preferences
```sql
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    business_id UUID,
    
    -- Preferences by Category
    category VARCHAR(50) NOT NULL, -- invoice, payment, stock_alert, etc.
    
    -- Channel Preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    
    -- Frequency
    frequency VARCHAR(20) DEFAULT 'immediate', -- immediate, daily_digest, weekly_digest, never
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id, category)
);

CREATE INDEX idx_notif_prefs_user ON notification_preferences(user_id);
CREATE INDEX idx_notif_prefs_business ON notification_preferences(business_id);
```

### Table: audit_logs
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID,
    user_id UUID,
    
    -- Action Details
    action_type VARCHAR(50) NOT NULL, -- create, update, delete, view, export, login, logout
    entity_type VARCHAR(50) NOT NULL, -- invoice, party, item, etc.
    entity_id UUID,
    
    -- Changes
    old_values JSONB, -- Previous values (for update/delete)
    new_values JSONB, -- New values (for create/update)
    changed_fields VARCHAR(500)[], -- Array of changed field names
    
    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB, -- {device_name, os, app_version}
    
    -- Reference
    reference_type VARCHAR(50),
    reference_id UUID,
    reference_number VARCHAR(50),
    
    -- Metadata
    description TEXT,
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, error, critical
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_business ON audit_logs(business_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
```

### Table: activity_logs
```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID,
    user_id UUID,
    
    -- Activity Details
    activity_type VARCHAR(50) NOT NULL, -- invoice_created, payment_received, stock_low, etc.
    activity_category VARCHAR(50), -- sales, purchase, inventory, accounting, etc.
    
    -- Content
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Reference
    reference_type VARCHAR(50),
    reference_id UUID,
    reference_number VARCHAR(50),
    
    -- Metadata
    metadata JSONB, -- Additional context data
    
    -- Visibility
    is_public BOOLEAN DEFAULT FALSE, -- Visible to all users in business
    is_system BOOLEAN DEFAULT FALSE, -- System-generated activity
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_business ON activity_logs(business_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_category ON activity_logs(activity_category);
CREATE INDEX idx_activity_logs_reference ON activity_logs(reference_type, reference_id);
CREATE INDEX idx_activity_logs_date ON activity_logs(created_at);
```

### Table: system_events
```sql
CREATE TABLE system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID,
    
    -- Event Details
    event_type VARCHAR(50) NOT NULL, -- sync_completed, backup_created, report_generated, etc.
    event_category VARCHAR(50), -- system, sync, backup, report, integration
    
    -- Content
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'success', -- success, warning, error, info
    
    -- Metadata
    metadata JSONB,
    error_message TEXT,
    error_stack TEXT,
    
    -- Duration (for operations)
    duration_ms INT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_system_events_business ON system_events(business_id);
CREATE INDEX idx_system_events_type ON system_events(event_type);
CREATE INDEX idx_system_events_category ON system_events(event_category);
CREATE INDEX idx_system_events_status ON system_events(status);
CREATE INDEX idx_system_events_date ON system_events(created_at);
```

---

## Subscription Service Database

### Table: subscription_plans
```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Plan Details
    plan_code VARCHAR(50) NOT NULL UNIQUE,
    plan_name VARCHAR(200) NOT NULL,
    description TEXT,
    plan_type VARCHAR(20) NOT NULL, -- free, basic, professional, enterprise, custom
    
    -- Pricing
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Features
    max_users INT,
    max_businesses INT DEFAULT 1,
    max_invoices_per_month INT,
    max_items INT,
    max_parties INT,
    
    -- Features Flags
    features JSONB, -- {gst_filing: true, multi_warehouse: true, manufacturing: false, etc.}
    
    -- Limits
    storage_limit_mb INT, -- Storage limit in MB
    api_calls_per_month INT,
    
    -- Trial
    trial_days INT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    
    -- Display
    display_order INT DEFAULT 0,
    popular_badge BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sub_plans_code ON subscription_plans(plan_code);
CREATE INDEX idx_sub_plans_type ON subscription_plans(plan_type);
CREATE INDEX idx_sub_plans_active ON subscription_plans(is_active);
```

### Table: subscriptions
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    user_id UUID NOT NULL, -- Owner/subscriber
    
    -- Plan
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    plan_code VARCHAR(50) NOT NULL,
    
    -- Billing
    billing_cycle VARCHAR(20) NOT NULL, -- monthly, yearly
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    trial_start_date DATE,
    trial_end_date DATE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- trial, active, cancelled, expired, suspended
    cancellation_reason TEXT,
    
    -- Auto-renewal
    auto_renew BOOLEAN DEFAULT TRUE,
    next_billing_date DATE,
    
    -- Payment
    payment_gateway VARCHAR(50), -- razorpay, stripe, etc.
    payment_gateway_subscription_id VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_business ON subscriptions(business_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
```

### Table: subscription_invoices
```sql
CREATE TABLE subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    business_id UUID NOT NULL,
    
    -- Invoice Details
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Amounts
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Payment
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed, refunded
    paid_amount DECIMAL(10,2) DEFAULT 0,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment Gateway
    payment_gateway VARCHAR(50),
    payment_gateway_payment_id VARCHAR(100),
    payment_receipt_url VARCHAR(500),
    
    -- Period
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, cancelled
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, invoice_number)
);

CREATE INDEX idx_sub_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX idx_sub_invoices_business ON subscription_invoices(business_id);
CREATE INDEX idx_sub_invoices_status ON subscription_invoices(payment_status);
CREATE INDEX idx_sub_invoices_date ON subscription_invoices(invoice_date);
```

### Table: subscription_usage
```sql
CREATE TABLE subscription_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Usage Metrics
    invoices_created INT DEFAULT 0,
    invoices_limit INT,
    items_count INT DEFAULT 0,
    items_limit INT,
    parties_count INT DEFAULT 0,
    parties_limit INT,
    storage_used_mb DECIMAL(10,2) DEFAULT 0,
    storage_limit_mb INT,
    api_calls_count INT DEFAULT 0,
    api_calls_limit INT,
    
    -- Users
    active_users_count INT DEFAULT 0,
    users_limit INT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, subscription_id, period_start)
);

CREATE INDEX idx_sub_usage_business ON subscription_usage(business_id);
CREATE INDEX idx_sub_usage_subscription ON subscription_usage(subscription_id);
CREATE INDEX idx_sub_usage_period ON subscription_usage(period_start);
```

---

## Support Service Database

### Table: support_tickets
```sql
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID,
    user_id UUID NOT NULL,
    
    -- Ticket Details
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    subject VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    
    -- Category
    category VARCHAR(50), -- technical, billing, feature_request, bug, general
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Status
    status VARCHAR(20) DEFAULT 'open', -- open, assigned, in_progress, resolved, closed, cancelled
    
    -- Assignment
    assigned_to UUID, -- Support agent
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Resolution
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    resolution_notes TEXT,
    
    -- Feedback
    rating INT, -- 1-5
    feedback TEXT,
    
    -- Reference
    reference_type VARCHAR(50), -- invoice, payment, etc.
    reference_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_business ON support_tickets(business_id);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_number ON support_tickets(ticket_number);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);
```

### Table: support_ticket_messages
```sql
CREATE TABLE support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    
    -- Message Details
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, system, attachment
    
    -- Sender
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL, -- user, agent, system
    sender_name VARCHAR(200),
    
    -- Attachments
    attachments JSONB, -- [{url, filename, size, type}]
    
    -- Status
    is_internal BOOLEAN DEFAULT FALSE, -- Internal note (not visible to user)
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket ON support_ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_sender ON support_ticket_messages(sender_id);
CREATE INDEX idx_ticket_messages_created ON support_ticket_messages(created_at);
```

### Table: knowledge_base_articles
```sql
CREATE TABLE knowledge_base_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Article Details
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    
    -- Category
    category VARCHAR(50),
    tags VARCHAR(100)[],
    
    -- SEO
    meta_title VARCHAR(500),
    meta_description TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Views & Helpfulness
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    
    -- Author
    author_id UUID,
    published_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_kb_articles_slug ON knowledge_base_articles(slug);
CREATE INDEX idx_kb_articles_category ON knowledge_base_articles(category);
CREATE INDEX idx_kb_articles_status ON knowledge_base_articles(status);
CREATE INDEX idx_kb_articles_featured ON knowledge_base_articles(is_featured);
```

---

## Partner/CA Service Database

### Table: partner_types
```sql
CREATE TABLE partner_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Type Details
    type_code VARCHAR(50) NOT NULL UNIQUE,
    type_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Examples: CA, accountant, consultant, auditor, tax_advisor
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_partner_types_code ON partner_types(type_code);
```

### Table: partners
```sql
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Partner Details
    partner_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    partner_type_id UUID REFERENCES partner_types(id),
    
    -- Contact
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    
    -- Professional Details
    registration_number VARCHAR(50), -- CA registration, etc.
    registration_authority VARCHAR(100), -- ICAI, etc.
    experience_years INT,
    specialization VARCHAR(500)[],
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(50) DEFAULT 'India',
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended, verified
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Rating
    rating DECIMAL(3,2) DEFAULT 0, -- 0-5
    total_reviews INT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_partners_code ON partners(partner_code);
CREATE INDEX idx_partners_type ON partners(partner_type_id);
CREATE INDEX idx_partners_email ON partners(email);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_verified ON partners(is_verified);
```

### Table: business_partner_connections
```sql
CREATE TABLE business_partner_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    partner_id UUID NOT NULL REFERENCES partners(id),
    
    -- Connection Details
    connection_status VARCHAR(20) DEFAULT 'pending', -- pending, active, rejected, cancelled
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Request
    requested_by UUID NOT NULL, -- Business owner
    request_message TEXT,
    
    -- Response
    responded_by UUID, -- Partner
    response_message TEXT,
    
    -- Permissions
    permissions JSONB, -- {view_invoices: true, view_reports: true, file_gst: true, etc.}
    
    -- Access
    access_level VARCHAR(20) DEFAULT 'view_only', -- view_only, limited, full
    can_file_returns BOOLEAN DEFAULT FALSE,
    can_approve_transactions BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, partner_id)
);

CREATE INDEX idx_bp_connections_business ON business_partner_connections(business_id);
CREATE INDEX idx_bp_connections_partner ON business_partner_connections(partner_id);
CREATE INDEX idx_bp_connections_status ON business_partner_connections(connection_status);
CREATE INDEX idx_bp_connections_active ON business_partner_connections(is_active);
```

### Table: partner_access_logs
```sql
CREATE TABLE partner_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_partner_connection_id UUID NOT NULL REFERENCES business_partner_connections(id),
    partner_id UUID NOT NULL REFERENCES partners(id),
    business_id UUID NOT NULL,
    
    -- Access Details
    action_type VARCHAR(50) NOT NULL, -- view, download, file_return, approve, etc.
    entity_type VARCHAR(50), -- invoice, report, gstr, etc.
    entity_id UUID,
    
    -- Access
    ip_address VARCHAR(45),
    user_agent TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Result
    status VARCHAR(20) DEFAULT 'success', -- success, denied, error
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_partner_access_connection ON partner_access_logs(business_partner_connection_id);
CREATE INDEX idx_partner_access_partner ON partner_access_logs(partner_id);
CREATE INDEX idx_partner_access_business ON partner_access_logs(business_id);
CREATE INDEX idx_partner_access_date ON partner_access_logs(accessed_at);
```

### Table: partner_services
```sql
CREATE TABLE partner_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id),
    
    -- Service Details
    service_code VARCHAR(50) NOT NULL,
    service_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Pricing
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'INR',
    pricing_type VARCHAR(20), -- fixed, hourly, per_transaction, subscription
    
    -- Category
    category VARCHAR(50), -- gst_filing, tax_consulting, audit, bookkeeping, etc.
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(partner_id, service_code)
);

CREATE INDEX idx_partner_services_partner ON partner_services(partner_id);
CREATE INDEX idx_partner_services_category ON partner_services(category);
CREATE INDEX idx_partner_services_active ON partner_services(is_active);
```

### Table: partner_service_bookings
```sql
CREATE TABLE partner_service_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    partner_id UUID NOT NULL REFERENCES partners(id),
    partner_service_id UUID NOT NULL REFERENCES partner_services(id),
    
    -- Booking Details
    booking_number VARCHAR(50) NOT NULL,
    booking_date DATE NOT NULL,
    
    -- Service Period
    service_period_start DATE,
    service_period_end DATE,
    
    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Payment
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, in_progress, completed, cancelled
    
    -- Completion
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    
    -- Feedback
    rating INT, -- 1-5
    feedback TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, booking_number)
);

CREATE INDEX idx_service_bookings_business ON partner_service_bookings(business_id);
CREATE INDEX idx_service_bookings_partner ON partner_service_bookings(partner_id);
CREATE INDEX idx_service_bookings_service ON partner_service_bookings(partner_service_id);
CREATE INDEX idx_service_bookings_status ON partner_service_bookings(status);
```

---

## AI/ML Service Database

### Table: ml_models
```sql
CREATE TABLE ml_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Model Details
    model_code VARCHAR(50) NOT NULL UNIQUE,
    model_name VARCHAR(200) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- prediction, classification, recommendation, nlp
    
    -- Use Cases
    use_case VARCHAR(100), -- sales_forecast, stock_prediction, payment_prediction, invoice_classification, etc.
    description TEXT,
    
    -- Model Info
    model_version VARCHAR(20) NOT NULL,
    model_path VARCHAR(500), -- Path to model file
    model_metadata JSONB, -- Model configuration, hyperparameters, etc.
    
    -- Performance
    accuracy DECIMAL(5,4), -- 0-1
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    
    -- Training
    training_data_size INT,
    training_completed_at TIMESTAMP WITH TIME ZONE,
    last_trained_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, training, active, deprecated
    is_active BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ml_models_code ON ml_models(model_code);
CREATE INDEX idx_ml_models_type ON ml_models(model_type);
CREATE INDEX idx_ml_models_use_case ON ml_models(use_case);
CREATE INDEX idx_ml_models_active ON ml_models(is_active);
```

### Table: ml_predictions
```sql
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    model_id UUID NOT NULL REFERENCES ml_models(id),
    
    -- Prediction Details
    prediction_type VARCHAR(50) NOT NULL, -- sales_forecast, stock_prediction, payment_prediction, etc.
    
    -- Input Data
    input_data JSONB NOT NULL, -- Features used for prediction
    
    -- Prediction
    predicted_value DECIMAL(15,2),
    predicted_class VARCHAR(100), -- For classification
    predicted_probability DECIMAL(5,4), -- Confidence score 0-1
    
    -- Output
    prediction_result JSONB, -- Full prediction output
    
    -- Reference
    reference_type VARCHAR(50), -- invoice, party, item, etc.
    reference_id UUID,
    
    -- Validation
    actual_value DECIMAL(15,2), -- Actual value (for validation)
    actual_class VARCHAR(100),
    is_validated BOOLEAN DEFAULT FALSE,
    validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Accuracy
    prediction_error DECIMAL(15,2), -- Difference between predicted and actual
    accuracy_score DECIMAL(5,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ml_predictions_business ON ml_predictions(business_id);
CREATE INDEX idx_ml_predictions_model ON ml_predictions(model_id);
CREATE INDEX idx_ml_predictions_type ON ml_predictions(prediction_type);
CREATE INDEX idx_ml_predictions_reference ON ml_predictions(reference_type, reference_id);
CREATE INDEX idx_ml_predictions_validated ON ml_predictions(is_validated);
CREATE INDEX idx_ml_predictions_date ON ml_predictions(created_at);
```

### Table: ml_recommendations
```sql
CREATE TABLE ml_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    user_id UUID,
    
    -- Recommendation Details
    recommendation_type VARCHAR(50) NOT NULL, -- item_suggestion, price_suggestion, party_suggestion, etc.
    recommendation_category VARCHAR(50), -- sales, purchase, inventory, etc.
    
    -- Recommendation
    recommended_item_id UUID, -- Item, party, etc.
    recommended_item_type VARCHAR(50), -- item, party, action, etc.
    recommendation_text TEXT,
    
    -- Score
    confidence_score DECIMAL(5,4) NOT NULL, -- 0-1
    relevance_score DECIMAL(5,4),
    
    -- Context
    context_data JSONB, -- Context in which recommendation was made
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, shown, accepted, rejected, ignored
    shown_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    
    -- Feedback
    user_feedback VARCHAR(20), -- helpful, not_helpful, irrelevant
    feedback_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ml_recommendations_business ON ml_recommendations(business_id);
CREATE INDEX idx_ml_recommendations_user ON ml_recommendations(user_id);
CREATE INDEX idx_ml_recommendations_type ON ml_recommendations(recommendation_type);
CREATE INDEX idx_ml_recommendations_status ON ml_recommendations(status);
CREATE INDEX idx_ml_recommendations_score ON ml_recommendations(confidence_score);
```

### Table: ml_training_data
```sql
CREATE TABLE ml_training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID,
    model_id UUID REFERENCES ml_models(id),
    
    -- Data Details
    data_type VARCHAR(50) NOT NULL, -- sales, purchase, inventory, payment, etc.
    data_category VARCHAR(50), -- training, validation, test
    
    -- Features
    features JSONB NOT NULL, -- Input features
    
    -- Labels
    label_value DECIMAL(15,2), -- For regression
    label_class VARCHAR(100), -- For classification
    
    -- Metadata
    metadata JSONB, -- Additional context
    
    -- Source
    source_type VARCHAR(50), -- invoice, transaction, etc.
    source_id UUID,
    
    -- Quality
    data_quality_score DECIMAL(5,4), -- 0-1
    is_anomaly BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ml_training_data_business ON ml_training_data(business_id);
CREATE INDEX idx_ml_training_data_model ON ml_training_data(model_id);
CREATE INDEX idx_ml_training_data_type ON ml_training_data(data_type);
CREATE INDEX idx_ml_training_data_category ON ml_training_data(data_category);
CREATE INDEX idx_ml_training_data_source ON ml_training_data(source_type, source_id);
```

### Table: ml_model_performance
```sql
CREATE TABLE ml_model_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES ml_models(id),
    
    -- Performance Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Metrics
    total_predictions INT DEFAULT 0,
    correct_predictions INT DEFAULT 0,
    incorrect_predictions INT DEFAULT 0,
    
    -- Accuracy Metrics
    accuracy DECIMAL(5,4) DEFAULT 0,
    precision DECIMAL(5,4) DEFAULT 0,
    recall DECIMAL(5,4) DEFAULT 0,
    f1_score DECIMAL(5,4) DEFAULT 0,
    
    -- Regression Metrics (if applicable)
    mae DECIMAL(15,2) DEFAULT 0, -- Mean Absolute Error
    mse DECIMAL(15,2) DEFAULT 0, -- Mean Squared Error
    rmse DECIMAL(15,2) DEFAULT 0, -- Root Mean Squared Error
    r2_score DECIMAL(5,4) DEFAULT 0,
    
    -- Usage
    total_requests INT DEFAULT 0,
    successful_requests INT DEFAULT 0,
    failed_requests INT DEFAULT 0,
    avg_response_time_ms INT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(model_id, period_start)
);

CREATE INDEX idx_ml_performance_model ON ml_model_performance(model_id);
CREATE INDEX idx_ml_performance_period ON ml_model_performance(period_start);
```

### Table: ai_chat_sessions
```sql
CREATE TABLE ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID,
    user_id UUID NOT NULL,
    
    -- Session Details
    session_title VARCHAR(500),
    session_type VARCHAR(50) DEFAULT 'general', -- general, accounting_help, gst_help, etc.
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, completed, archived
    
    -- Metadata
    metadata JSONB,
    
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    last_message_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_sessions_business ON ai_chat_sessions(business_id);
CREATE INDEX idx_ai_chat_sessions_user ON ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_sessions_status ON ai_chat_sessions(status);
```

### Table: ai_chat_messages
```sql
CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    
    -- Message Details
    message TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL, -- user, assistant, system
    
    -- AI Response
    ai_model VARCHAR(50), -- gpt-4, claude, etc.
    ai_response TEXT,
    tokens_used INT,
    
    -- Context
    context_data JSONB, -- Business context, previous messages, etc.
    
    -- Status
    status VARCHAR(20) DEFAULT 'sent', -- sent, processing, completed, failed
    
    -- Feedback
    is_helpful BOOLEAN,
    feedback_text TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_messages_session ON ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_type ON ai_chat_messages(message_type);
CREATE INDEX idx_ai_chat_messages_created ON ai_chat_messages(created_at);
```

### Table: ai_insights
```sql
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    
    -- Insight Details
    insight_type VARCHAR(50) NOT NULL, -- sales_trend, cash_flow, inventory_optimization, etc.
    insight_category VARCHAR(50), -- financial, operational, compliance
    
    -- Content
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    insight_data JSONB, -- Structured insight data
    
    -- Severity
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, critical
    priority INT DEFAULT 0, -- 0-10
    
    -- Action
    recommended_action TEXT,
    action_url VARCHAR(500),
    
    -- Status
    status VARCHAR(20) DEFAULT 'new', -- new, viewed, dismissed, acted_upon
    viewed_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    acted_upon_at TIMESTAMP WITH TIME ZONE,
    
    -- Reference
    reference_type VARCHAR(50),
    reference_id UUID,
    
    -- Validity
    valid_from DATE,
    valid_until DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_business ON ai_insights(business_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX idx_ai_insights_category ON ai_insights(insight_category);
CREATE INDEX idx_ai_insights_severity ON ai_insights(severity);
CREATE INDEX idx_ai_insights_status ON ai_insights(status);
CREATE INDEX idx_ai_insights_reference ON ai_insights(reference_type, reference_id);
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

---

## ER Diagrams

### Core Entity Relationships

```
┌─────────────┐
│   users     │
└──────┬──────┘
       │
       │ (owner_id)
       │
┌──────▼──────────┐
│   businesses    │
└──────┬──────────┘
       │
       ├─────────────────────────────────────────────┐
       │                                             │
┌──────▼──────┐                            ┌────────▼────────┐
│   parties   │                            │     items      │
└──────┬──────┘                            └────────┬───────┘
       │                                             │
       │                                             │
┌──────▼──────┐                            ┌────────▼────────┐
│  invoices   │◄───────────────────────────┤ invoice_items  │
└──────┬──────┘                            └────────────────┘
       │
       ├─────────────────┐
       │                 │
┌──────▼──────┐  ┌───────▼──────┐
│  payments   │  │  e_invoices  │
└─────────────┘  └───────────────┘
```

### GST Compliance Relationships

```
┌─────────────┐
│  invoices   │
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
┌──────▼──────┐  ┌────────▼────────┐
│ e_invoices │  │  e_way_bills    │
└────────────┘  └──────────────────┘
       │
       │
┌──────▼──────────┐
│  gstr1_returns  │
└──────┬──────────┘
       │
       ├──────────────────────┐
       │                      │
┌──────▼──────────┐  ┌───────▼──────────┐
│ gstr1_b2b_      │  │ gstr1_b2c_      │
│   invoices      │  │   invoices      │
└─────────────────┘  └─────────────────┘
```

### Manufacturing Relationships

```
┌─────────────┐
│    items    │ (Finished Product)
└──────┬──────┘
       │
       │ (finished_item_id)
       │
┌──────▼──────────────┐
│ bills_of_materials  │
└──────┬──────────────┘
       │
       │ (bom_id)
       │
┌──────▼──────────────┐
│  bom_components     │
└──────┬──────────────┘
       │
       │ (component_item_id)
       │
┌──────▼──────┐
│    items    │ (Raw Material)
└─────────────┘

┌──────────────────┐
│ production_orders │
└────────┬──────────┘
         │
         ├──────────────────────┐
         │                      │
┌────────▼──────────┐  ┌───────▼──────────────┐
│ production_order_  │  │  production_issues   │
│   components       │  └──────────────────────┘
└────────────────────┘
```

### Warehouse Relationships

```
┌─────────────┐
│ warehouses  │
└──────┬──────┘
       │
       ├──────────────────────┐
       │                      │
┌──────▼──────────┐  ┌────────▼──────────────┐
│ warehouse_      │  │  warehouse_stock       │
│  locations      │  └────────┬──────────────┘
└─────────────────┘           │
                               │
                    ┌──────────▼──────────┐
                    │  stock_movements    │
                    └─────────────────────┘
```

### Accounting Relationships

```
┌──────────────────┐
│ chart_of_accounts│
└────────┬─────────┘
         │
         ├──────────────────────┐
         │                      │
┌────────▼──────────┐  ┌────────▼──────────┐
│  transactions     │  │ journal_entries  │
└───────────────────┘  └────────┬──────────┘
                                │
                    ┌───────────▼─────────────┐
                    │ journal_entry_lines     │
                    └─────────────────────────┘
```

### TDS/TCS Relationships

```
┌──────────────────┐
│ payment_vouchers │
└────────┬─────────┘
         │
         │ (source_id)
         │
┌────────▼──────────┐
│ tds_transactions  │
└────────┬──────────┘
         │
         │ (tds_transaction_id)
         │
┌────────▼──────────┐
│ tds_certificates   │
└────────────────────┘

┌──────────────────┐
│ receipt_vouchers │
└────────┬─────────┘
         │
         │ (source_id)
         │
┌────────▼──────────┐
│ tcs_transactions  │
└────────────────────┘
```

---

## Comprehensive Indexes Summary

### Performance Optimization Indexes

All tables have been indexed for optimal query performance. Key indexing strategies:

#### 1. Business-Scoped Queries
- All business-scoped tables have `idx_*_business` on `business_id`
- Enables fast filtering by business

#### 2. Foreign Key Indexes
- All foreign key relationships are indexed
- Enables fast joins and referential integrity checks

#### 3. Status-Based Queries
- Status columns are indexed where frequently filtered
- Examples: `idx_*_status`, `idx_*_payment_status`

#### 4. Date Range Queries
- Date columns used in filtering/sorting are indexed
- Examples: `idx_*_date`, `idx_*_created_at`

#### 5. Search & Lookup Indexes
- Unique identifiers: phone, email, GSTIN, PAN
- Document numbers: invoice_number, order_number
- Codes: SKU, barcode, HSN, SAC

#### 6. Composite Indexes
- Multi-column indexes for common query patterns
- Examples: `(business_id, status)`, `(entity_type, entity_id)`

### Index Categories by Service

#### Auth Service
- User lookup: phone, email
- Session management: user_id, device_id
- Token management: token_hash

#### Business Service
- Business lookup: owner_id, GSTIN
- Party search: name, phone, GSTIN, type
- Multi-business: business_id + various fields

#### Inventory Service
- Item search: name, SKU, barcode, HSN
- Stock queries: warehouse_id, item_id
- Category hierarchy: parent_id
- Low stock alerts: current_stock, threshold

#### Invoice Service
- Invoice lookup: invoice_number, party_id, date
- Payment tracking: payment_status
- E-Invoice: IRN, status
- E-Way Bill: eway_bill_number, valid_until

#### GST Compliance Service
- Return filing: return_period, filing_status
- GSTR-1: party_gstin, invoice_id
- ITC tracking: source_type, source_id, status
- E-Invoice: IRN, status

#### TDS/TCS Service
- Transaction lookup: source_type, source_id
- Certificate tracking: certificate_number, party_pan
- Return filing: financial_year, quarter

#### Manufacturing Service
- BOM lookup: finished_item_id, bom_code
- Production orders: status, date, finished_item_id
- Component tracking: component_item_id

#### Warehouse Service
- Stock queries: warehouse_id, item_id, location_id
- Transfers: from_warehouse, to_warehouse, status
- Stock movements: warehouse_id, item_id, date, type
- Stock takes: warehouse_id, status, date

#### Import/Export Service
- Order tracking: order_number, status, date
- IEC lookup: iec_number
- Shipping bills: shipping_bill_number

#### Notification Service
- User notifications: user_id, status, category
- Unread notifications: user_id + status (partial index)
- Reference tracking: reference_type, reference_id

#### Subscription Service
- Subscription lookup: business_id, status, end_date
- Usage tracking: business_id, subscription_id, period
- Invoice tracking: subscription_id, payment_status

#### Partner/CA Service
- Connection lookup: business_id, partner_id, status
- Access logs: connection_id, partner_id, date
- Service bookings: business_id, partner_id, status

#### AI/ML Service
- Predictions: business_id, model_id, type
- Recommendations: business_id, user_id, status, score
- Training data: model_id, data_type, category
- Performance: model_id, period

### Index Maintenance

#### Regular Maintenance Tasks
1. **Analyze Tables**: Run `ANALYZE` regularly to update statistics
2. **Rebuild Indexes**: Rebuild fragmented indexes periodically
3. **Monitor Index Usage**: Track unused indexes for removal
4. **Partial Indexes**: Use partial indexes for filtered queries (e.g., unread notifications)

#### Index Monitoring Queries
```sql
-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- Find large indexes
SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;

-- Index usage statistics
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Index Best Practices

1. **Don't Over-Index**: Too many indexes slow down writes
2. **Index Foreign Keys**: Always index foreign keys
3. **Composite Indexes**: Create for common multi-column queries
4. **Partial Indexes**: Use for filtered queries (WHERE status = 'active')
5. **Covering Indexes**: Include frequently selected columns
6. **Monitor Performance**: Track query performance and adjust indexes

---

## Database Statistics

### Total Tables by Service
- **Auth Service**: 4 tables
- **Business Service**: 4 tables
- **Inventory Service**: 10 tables
- **Invoice Service**: 9 tables
- **Accounting Service**: 12 tables
- **GST Compliance Service**: 11 tables
- **TDS/TCS Service**: 8 tables
- **Manufacturing Service**: 8 tables
- **Warehouse Service**: 8 tables
- **Import/Export Service**: 7 tables
- **Notification Service**: 6 tables
- **Subscription Service**: 4 tables
- **Support Service**: 3 tables
- **Partner/CA Service**: 6 tables
- **AI/ML Service**: 8 tables
- **Sync Service**: 2 tables

**Total: 110+ tables across all microservices**

### Key Relationships
- **One-to-Many**: Business → Parties, Invoices, Items
- **Many-to-Many**: Business ↔ Partners (via connections)
- **Hierarchical**: Categories, Chart of Accounts, Warehouse Locations
- **Temporal**: Ledger entries, Stock movements, Audit logs

---

## Migration Strategy

### Phase 1: Core Services
1. Auth Service
2. Business Service
3. Inventory Service
4. Invoice Service

### Phase 2: Financial Services
1. Accounting Service
2. Payments Service
3. GST Compliance Service
4. TDS/TCS Service

### Phase 3: Advanced Features
1. Manufacturing Service
2. Warehouse Service
3. Import/Export Service

### Phase 4: Supporting Services
1. Notification Service
2. Subscription Service
3. Support Service
4. Partner/CA Service
5. AI/ML Service
6. Sync Service

### Migration Tools
- Use migration tools like **Flyway** or **Liquibase**
- Version control all schema changes
- Test migrations on staging before production
- Maintain rollback scripts

---

## Notes

1. **UUID Primary Keys**: All tables use UUID for distributed system compatibility
2. **Soft Deletes**: Use `status` column instead of hard deletes where appropriate
3. **Audit Trail**: All critical tables have audit logs
4. **Multi-tenancy**: All business-scoped tables include `business_id`
5. **Time Zones**: All timestamps use `TIMESTAMP WITH TIME ZONE`
6. **JSONB**: Used for flexible schema (metadata, features, etc.)
7. **Indexes**: Comprehensive indexing for performance
8. **Constraints**: Foreign keys, unique constraints, check constraints as needed
