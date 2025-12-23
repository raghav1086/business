# Vyapar App - Detailed Database Schema

## Overview
This document provides the complete database schema design for the Vyapar App, including all tables, relationships, indexes, and constraints.

---

## Database: PostgreSQL

### Naming Conventions
- Tables: `snake_case`, plural (e.g., `users`, `businesses`, `invoices`)
- Columns: `snake_case` (e.g., `created_at`, `user_id`)
- Indexes: `idx_<table>_<column>` (e.g., `idx_users_email`)
- Foreign Keys: `fk_<table>_<referenced_table>` (e.g., `fk_invoices_business_id`)

---

## Core Tables

### 1. users
Stores user account information.

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    otp VARCHAR(6),
    otp_expiry TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### 2. businesses
Stores business profile information.

```sql
CREATE TABLE businesses (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    gstin VARCHAR(15) UNIQUE,
    pan VARCHAR(10),
    business_type VARCHAR(50), -- sole_proprietorship, partnership, pvt_ltd, llp
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    state_code VARCHAR(2), -- For GST calculation
    pincode VARCHAR(10),
    country VARCHAR(100) DEFAULT 'India',
    phone VARCHAR(15),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    invoice_prefix VARCHAR(10) DEFAULT 'INV',
    invoice_number_sequence INTEGER DEFAULT 1,
    financial_year_start DATE, -- e.g., '2024-04-01'
    currency VARCHAR(3) DEFAULT 'INR',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_businesses_gstin ON businesses(gstin);
CREATE INDEX idx_businesses_status ON businesses(is_active);
```

### 3. business_users
Many-to-many relationship for multiple users per business (staff, accountants).

```sql
CREATE TABLE business_users (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'staff', -- owner, accountant, staff, viewer
    permissions JSONB, -- Custom permissions
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, user_id)
);

CREATE INDEX idx_business_users_business_id ON business_users(business_id);
CREATE INDEX idx_business_users_user_id ON business_users(user_id);
```

### 4. parties
Stores customers and suppliers.

```sql
CREATE TABLE parties (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- customer, supplier, both
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    email VARCHAR(255),
    mobile VARCHAR(15),
    phone VARCHAR(15),
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_state_code VARCHAR(2),
    billing_pincode VARCHAR(10),
    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_state_code VARCHAR(2),
    shipping_pincode VARCHAR(10),
    credit_limit DECIMAL(15, 2) DEFAULT 0,
    payment_terms INTEGER, -- Days (e.g., 30)
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    balance_type VARCHAR(10), -- debit, credit
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_parties_business_id ON parties(business_id);
CREATE INDEX idx_parties_type ON parties(type);
CREATE INDEX idx_parties_name ON parties(name);
CREATE INDEX idx_parties_gstin ON parties(gstin);
```

### 5. items
Stores products/services.

```sql
CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    description TEXT,
    category_id BIGINT REFERENCES item_categories(id),
    hsn_code VARCHAR(10),
    sac_code VARCHAR(10), -- For services
    gst_rate DECIMAL(5, 2) NOT NULL, -- e.g., 18.00
    unit VARCHAR(50) DEFAULT 'pcs', -- pcs, kg, liter, etc.
    purchase_price DECIMAL(15, 2),
    sale_price DECIMAL(15, 2) NOT NULL,
    mrp DECIMAL(15, 2),
    stock_quantity DECIMAL(15, 3) DEFAULT 0,
    min_stock_level DECIMAL(15, 3) DEFAULT 0,
    track_stock BOOLEAN DEFAULT TRUE,
    track_batch BOOLEAN DEFAULT FALSE,
    track_serial BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_items_business_id ON items(business_id);
CREATE INDEX idx_items_sku ON items(sku);
CREATE INDEX idx_items_hsn_code ON items(hsn_code);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_stock ON items(stock_quantity) WHERE track_stock = TRUE;
```

### 6. item_categories
Categories for items.

```sql
CREATE TABLE item_categories (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id BIGINT REFERENCES item_categories(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_item_categories_business_id ON item_categories(business_id);
```

### 7. invoices
Stores invoices/bills.

```sql
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    party_id BIGINT REFERENCES parties(id),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    invoice_type VARCHAR(50) DEFAULT 'tax_invoice', -- tax_invoice, bill_of_supply, receipt
    invoice_date DATE NOT NULL,
    due_date DATE,
    place_of_supply VARCHAR(100),
    place_of_supply_state_code VARCHAR(2),
    reference_number VARCHAR(100),
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    discount_type VARCHAR(20), -- percentage, fixed
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    cgst_amount DECIMAL(15, 2) DEFAULT 0,
    sgst_amount DECIMAL(15, 2) DEFAULT 0,
    igst_amount DECIMAL(15, 2) DEFAULT 0,
    cess_amount DECIMAL(15, 2) DEFAULT 0,
    round_off DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    balance_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, paid, partial, overdue, cancelled
    payment_terms TEXT,
    notes TEXT,
    terms_conditions TEXT,
    pdf_path VARCHAR(500),
    eway_bill_number VARCHAR(50),
    eway_bill_date DATE,
    is_gst_applicable BOOLEAN DEFAULT TRUE,
    reverse_charge BOOLEAN DEFAULT FALSE,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_invoices_business_id ON invoices(business_id);
CREATE INDEX idx_invoices_party_id ON invoices(party_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
```

### 8. invoice_items
Line items in invoices.

```sql
CREATE TABLE invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_id BIGINT REFERENCES items(id),
    item_name VARCHAR(255) NOT NULL, -- Snapshot at time of invoice
    hsn_code VARCHAR(10),
    quantity DECIMAL(15, 3) NOT NULL,
    unit VARCHAR(50),
    unit_price DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    discount_type VARCHAR(20),
    taxable_amount DECIMAL(15, 2) NOT NULL,
    gst_rate DECIMAL(5, 2) NOT NULL,
    cgst_amount DECIMAL(15, 2) DEFAULT 0,
    sgst_amount DECIMAL(15, 2) DEFAULT 0,
    igst_amount DECIMAL(15, 2) DEFAULT 0,
    cess_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    batch_number VARCHAR(100),
    serial_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_item_id ON invoice_items(item_id);
```

### 9. payments
Stores payment transactions.

```sql
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_id BIGINT REFERENCES invoices(id),
    party_id BIGINT REFERENCES parties(id),
    payment_number VARCHAR(100) UNIQUE,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL, -- cash, bank_transfer, cheque, upi, card, online
    payment_method VARCHAR(100), -- More specific: razorpay, paytm, etc.
    transaction_id VARCHAR(255),
    cheque_number VARCHAR(100),
    cheque_date DATE,
    bank_name VARCHAR(255),
    reference_number VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed, refunded
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_payments_business_id ON payments(business_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_party_id ON payments(party_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
```

### 10. ledgers
General ledger entries for accounting.

```sql
CREATE TABLE ledgers (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    entry_type VARCHAR(50) NOT NULL, -- invoice, payment, expense, journal, opening_balance
    reference_id BIGINT, -- ID of related record (invoice_id, payment_id, etc.)
    reference_type VARCHAR(50), -- invoice, payment, expense, etc.
    party_id BIGINT REFERENCES parties(id),
    account_type VARCHAR(50) NOT NULL, -- asset, liability, income, expense, equity
    account_name VARCHAR(255) NOT NULL, -- Sales, Purchase, Cash, Bank, etc.
    debit_amount DECIMAL(15, 2) DEFAULT 0,
    credit_amount DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2),
    entry_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledgers_business_id ON ledgers(business_id);
CREATE INDEX idx_ledgers_entry_type ON ledgers(entry_type);
CREATE INDEX idx_ledgers_party_id ON ledgers(party_id);
CREATE INDEX idx_ledgers_entry_date ON ledgers(entry_date);
CREATE INDEX idx_ledgers_account_type ON ledgers(account_type);
```

### 11. expenses
Stores business expenses.

```sql
CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    expense_category_id BIGINT REFERENCES expense_categories(id),
    party_id BIGINT REFERENCES parties(id), -- If paid to a vendor
    expense_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_mode VARCHAR(50),
    description TEXT,
    receipt_url VARCHAR(500),
    gst_applicable BOOLEAN DEFAULT FALSE,
    gst_amount DECIMAL(15, 2) DEFAULT 0,
    is_billable BOOLEAN DEFAULT FALSE, -- Can be charged to customer
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_expenses_business_id ON expenses(business_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(expense_category_id);
```

### 12. expense_categories
Categories for expenses.

```sql
CREATE TABLE expense_categories (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expense_categories_business_id ON expense_categories(business_id);
```

### 13. stock_movements
Tracks inventory stock changes.

```sql
CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL, -- purchase, sale, adjustment, transfer, return
    reference_id BIGINT, -- invoice_id, purchase_id, etc.
    reference_type VARCHAR(50),
    quantity DECIMAL(15, 3) NOT NULL, -- Positive for in, negative for out
    balance_after DECIMAL(15, 3) NOT NULL,
    batch_number VARCHAR(100),
    serial_number VARCHAR(100),
    movement_date DATE NOT NULL,
    notes TEXT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_movements_business_id ON stock_movements(business_id);
CREATE INDEX idx_stock_movements_item_id ON stock_movements(item_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
```

### 14. gst_reports
Stores GST report data.

```sql
CREATE TABLE gst_reports (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- gstr1, gstr2, gstr3b
    period_month INTEGER NOT NULL, -- 1-12
    period_year INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, generated, filed
    data JSONB, -- Report data in JSON format
    filed_at TIMESTAMP,
    filing_reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gst_reports_business_id ON gst_reports(business_id);
CREATE INDEX idx_gst_reports_period ON gst_reports(period_year, period_month);
CREATE INDEX idx_gst_reports_type ON gst_reports(report_type);
```

### 15. credit_notes
Stores credit notes/debit notes.

```sql
CREATE TABLE credit_notes (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_id BIGINT REFERENCES invoices(id),
    party_id BIGINT NOT NULL REFERENCES parties(id),
    credit_note_number VARCHAR(100) UNIQUE NOT NULL,
    credit_note_date DATE NOT NULL,
    type VARCHAR(20) NOT NULL, -- credit_note, debit_note
    reason TEXT,
    subtotal DECIMAL(15, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    pdf_path VARCHAR(500),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_credit_notes_business_id ON credit_notes(business_id);
CREATE INDEX idx_credit_notes_invoice_id ON credit_notes(invoice_id);
CREATE INDEX idx_credit_notes_party_id ON credit_notes(party_id);
```

### 16. sync_logs
Tracks offline sync operations.

```sql
CREATE TABLE sync_logs (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    device_id VARCHAR(255),
    sync_type VARCHAR(50), -- full, incremental
    status VARCHAR(50), -- pending, in_progress, completed, failed
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_logs_business_id ON sync_logs(business_id);
CREATE INDEX idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
```

### 17. audit_logs
Audit trail for important operations.

```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT REFERENCES businesses(id),
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- create, update, delete, view
    entity_type VARCHAR(100) NOT NULL, -- invoice, payment, item, etc.
    entity_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_business_id ON audit_logs(business_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### 18. notifications
Stores user notifications.

```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id BIGINT REFERENCES businesses(id),
    type VARCHAR(50) NOT NULL, -- invoice_due, low_stock, payment_received, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_business_id ON notifications(business_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

---

## Relationships Summary

1. **User → Business**: One-to-Many (owner)
2. **Business → Business Users**: One-to-Many (staff)
3. **Business → Parties**: One-to-Many
4. **Business → Items**: One-to-Many
5. **Business → Invoices**: One-to-Many
6. **Invoice → Invoice Items**: One-to-Many
7. **Invoice → Payments**: One-to-Many
8. **Party → Invoices**: One-to-Many
9. **Party → Payments**: One-to-Many
10. **Item → Invoice Items**: One-to-Many
11. **Item → Stock Movements**: One-to-Many

---

## Database Functions & Triggers

### Auto-update updated_at timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Repeat for other tables...
```

### Auto-generate invoice number
```sql
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    prefix VARCHAR;
    sequence_num INTEGER;
    new_number VARCHAR;
BEGIN
    SELECT invoice_prefix, invoice_number_sequence INTO prefix, sequence_num
    FROM businesses WHERE id = NEW.business_id;
    
    new_number := prefix || '-' || TO_CHAR(NEW.invoice_date, 'YYYY') || '-' || LPAD(sequence_num::TEXT, 5, '0');
    NEW.invoice_number := new_number;
    
    UPDATE businesses SET invoice_number_sequence = sequence_num + 1 WHERE id = NEW.business_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_invoice_number BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();
```

---

## Migration Strategy

1. Use migration tools (Sequelize migrations, Flyway, etc.)
2. Version control all migrations
3. Test migrations on staging before production
4. Maintain rollback scripts
5. Document breaking changes

---

**Last Updated:** December 2024

