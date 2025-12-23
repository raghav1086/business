# Vyapar App - Detailed API Specification

## Base URL
```
Production: https://api.vyaparapp.com/v1
Staging: https://api-staging.vyaparapp.com/v1
Development: http://localhost:3000/api/v1
```

## Authentication
All APIs (except auth endpoints) require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

---

## 1. Authentication APIs

### 1.1 Register User
**POST** `/api/auth/register`

**Request:**
```json
{
  "mobile": "+919876543210",
  "email": "user@example.com" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "otp_sent": true,
    "expires_in": 300
  }
}
```

### 1.2 Verify OTP
**POST** `/api/auth/verify-otp`

**Request:**
```json
{
  "mobile": "+919876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_token_here",
    "user": {
      "id": 123,
      "mobile": "+919876543210",
      "email": "user@example.com",
      "is_verified": true
    }
  }
}
```

### 1.3 Login
**POST** `/api/auth/login`

**Request:**
```json
{
  "mobile": "+919876543210",
  "password": "password123" // Optional if OTP login
}
```

**Response:** Same as verify-otp

### 1.4 Refresh Token
**POST** `/api/auth/refresh-token`

**Request:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "refresh_token": "new_refresh_token"
  }
}
```

### 1.5 Logout
**POST** `/api/auth/logout`

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 1.6 Forgot Password
**POST** `/api/auth/forgot-password`

**Request:**
```json
{
  "mobile": "+919876543210"
}
```

### 1.7 Reset Password
**POST** `/api/auth/reset-password`

**Request:**
```json
{
  "mobile": "+919876543210",
  "otp": "123456",
  "new_password": "newpassword123"
}
```

---

## 2. Business APIs

### 2.1 Create Business
**POST** `/api/business/create`

**Request:**
```json
{
  "name": "ABC Traders",
  "legal_name": "ABC Traders Private Limited",
  "gstin": "27ABCDE1234F1Z5",
  "pan": "ABCDE1234F",
  "business_type": "pvt_ltd",
  "address_line1": "123 Main Street",
  "address_line2": "Near Park",
  "city": "Mumbai",
  "state": "Maharashtra",
  "state_code": "27",
  "pincode": "400001",
  "phone": "+912212345678",
  "email": "contact@abctraders.com",
  "financial_year_start": "2024-04-01"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "ABC Traders",
    "gstin": "27ABCDE1234F1Z5",
    "created_at": "2024-12-20T10:00:00Z"
  }
}
```

### 2.2 Get Business
**GET** `/api/business/{id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "ABC Traders",
    "gstin": "27ABCDE1234F1Z5",
    // ... all business fields
  }
}
```

### 2.3 Update Business
**PUT** `/api/business/{id}`

**Request:** Same as create (all fields optional)

### 2.4 List Businesses (for user)
**GET** `/api/business/list`

**Query Params:**
- `page` (default: 1)
- `limit` (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "businesses": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

### 2.5 Delete Business
**DELETE** `/api/business/{id}`

---

## 3. Party (Customer/Supplier) APIs

### 3.1 Create Party
**POST** `/api/party/create`

**Request:**
```json
{
  "business_id": 1,
  "type": "customer", // customer, supplier, both
  "name": "XYZ Enterprises",
  "company_name": "XYZ Enterprises Pvt Ltd",
  "gstin": "29XYZAB5678G2H6",
  "pan": "XYZAB5678G",
  "email": "contact@xyzent.com",
  "mobile": "+919876543211",
  "billing_address_line1": "456 Business Park",
  "billing_city": "Bangalore",
  "billing_state": "Karnataka",
  "billing_state_code": "29",
  "billing_pincode": "560001",
  "credit_limit": 100000.00,
  "payment_terms": 30,
  "opening_balance": 0,
  "balance_type": "debit"
}
```

### 3.2 Get Party
**GET** `/api/party/{id}`

### 3.3 Update Party
**PUT** `/api/party/{id}`

### 3.4 List Parties
**GET** `/api/party/list`

**Query Params:**
- `business_id` (required)
- `type` (optional: customer, supplier, both)
- `search` (optional: search by name, mobile, email)
- `page`, `limit`

### 3.5 Delete Party
**DELETE** `/api/party/{id}`

### 3.6 Get Party Ledger
**GET** `/api/party/{id}/ledger`

**Query Params:**
- `from_date` (optional)
- `to_date` (optional)
- `page`, `limit`

**Response:**
```json
{
  "success": true,
  "data": {
    "party": { ... },
    "opening_balance": 0,
    "closing_balance": 50000,
    "transactions": [
      {
        "date": "2024-12-01",
        "type": "invoice",
        "reference": "INV-2024-00001",
        "debit": 100000,
        "credit": 0,
        "balance": 100000
      },
      {
        "date": "2024-12-05",
        "type": "payment",
        "reference": "PAY-2024-00001",
        "debit": 0,
        "credit": 50000,
        "balance": 50000
      }
    ]
  }
}
```

---

## 4. Item APIs

### 4.1 Create Item
**POST** `/api/item/create`

**Request:**
```json
{
  "business_id": 1,
  "name": "Premium Widget",
  "sku": "WID-001",
  "barcode": "1234567890123",
  "description": "High quality widget",
  "category_id": 5,
  "hsn_code": "8471",
  "gst_rate": 18.00,
  "unit": "pcs",
  "purchase_price": 50.00,
  "sale_price": 100.00,
  "mrp": 120.00,
  "stock_quantity": 100,
  "min_stock_level": 10,
  "track_stock": true,
  "track_batch": false,
  "track_serial": false
}
```

### 4.2 Get Item
**GET** `/api/item/{id}`

### 4.3 Update Item
**PUT** `/api/item/{id}`

### 4.4 List Items
**GET** `/api/item/list`

**Query Params:**
- `business_id` (required)
- `category_id` (optional)
- `search` (optional)
- `low_stock` (optional: true/false)
- `page`, `limit`

### 4.5 Delete Item
**DELETE** `/api/item/{id}`

### 4.6 Adjust Stock
**POST** `/api/item/{id}/adjust-stock`

**Request:**
```json
{
  "quantity": 10, // Positive to add, negative to reduce
  "movement_type": "adjustment",
  "notes": "Stock correction"
}
```

### 4.7 Get Low Stock Alerts
**GET** `/api/item/low-stock-alerts`

**Query Params:**
- `business_id` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Widget A",
        "current_stock": 5,
        "min_stock_level": 10,
        "shortage": 5
      }
    ]
  }
}
```

### 4.8 Bulk Import Items
**POST** `/api/item/bulk-import`

**Request:** Multipart form with CSV/Excel file

---

## 5. Invoice APIs

### 5.1 Create Invoice
**POST** `/api/invoice/create`

**Request:**
```json
{
  "business_id": 1,
  "party_id": 10,
  "invoice_type": "tax_invoice",
  "invoice_date": "2024-12-20",
  "due_date": "2025-01-19",
  "place_of_supply": "Mumbai",
  "place_of_supply_state_code": "27",
  "reference_number": "PO-123",
  "items": [
    {
      "item_id": 5,
      "item_name": "Premium Widget",
      "hsn_code": "8471",
      "quantity": 10,
      "unit": "pcs",
      "unit_price": 100.00,
      "discount_amount": 0,
      "gst_rate": 18.00
    },
    {
      "item_id": 6,
      "item_name": "Standard Widget",
      "hsn_code": "8471",
      "quantity": 5,
      "unit": "pcs",
      "unit_price": 50.00,
      "discount_amount": 10.00,
      "discount_type": "fixed",
      "gst_rate": 18.00
    }
  ],
  "discount_amount": 0,
  "discount_type": "percentage",
  "payment_terms": "Net 30",
  "notes": "Thank you for your business",
  "terms_conditions": "Goods once sold will not be taken back"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoice_number": "INV-2024-00001",
    "total_amount": 1270.00,
    "subtotal": 1000.00,
    "tax_amount": 180.00,
    "cgst_amount": 90.00,
    "sgst_amount": 90.00,
    "igst_amount": 0,
    "balance_amount": 1270.00,
    "status": "draft"
  }
}
```

### 5.2 Get Invoice
**GET** `/api/invoice/{id}`

**Response:** Complete invoice with items

### 5.3 Update Invoice
**PUT** `/api/invoice/{id}`

**Request:** Same as create (only draft invoices can be updated)

### 5.4 List Invoices
**GET** `/api/invoice/list`

**Query Params:**
- `business_id` (required)
- `party_id` (optional)
- `status` (optional: draft, sent, paid, partial, overdue, cancelled)
- `from_date`, `to_date` (optional)
- `search` (optional: invoice number, party name)
- `page`, `limit`

### 5.5 Delete Invoice
**DELETE** `/api/invoice/{id}`

**Note:** Only draft invoices can be deleted

### 5.6 Send Invoice
**POST** `/api/invoice/{id}/send`

**Request:**
```json
{
  "method": "whatsapp", // whatsapp, email, both
  "email": "customer@example.com", // if email
  "mobile": "+919876543211" // if whatsapp
}
```

### 5.7 Get Invoice PDF
**GET** `/api/invoice/{id}/pdf`

**Response:** PDF file download

### 5.8 Mark Invoice as Sent
**POST** `/api/invoice/{id}/mark-sent`

### 5.9 Cancel Invoice
**POST** `/api/invoice/{id}/cancel`

**Request:**
```json
{
  "reason": "Customer cancelled order"
}
```

---

## 6. Payment APIs

### 6.1 Record Payment
**POST** `/api/payment/record`

**Request:**
```json
{
  "business_id": 1,
  "invoice_id": 1, // Optional if advance payment
  "party_id": 10,
  "payment_date": "2024-12-20",
  "amount": 50000.00,
  "payment_mode": "bank_transfer",
  "payment_method": "razorpay",
  "transaction_id": "TXN123456789",
  "reference_number": "REF-123",
  "notes": "Partial payment received"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "payment_number": "PAY-2024-00001",
    "amount": 50000.00,
    "invoice_balance_after": 77000.00
  }
}
```

### 6.2 Get Payment
**GET** `/api/payment/{id}`

### 6.3 Update Payment
**PUT** `/api/payment/{id}`

### 6.4 List Payments
**GET** `/api/payment/list`

**Query Params:**
- `business_id` (required)
- `invoice_id` (optional)
- `party_id` (optional)
- `from_date`, `to_date` (optional)
- `payment_mode` (optional)
- `page`, `limit`

### 6.5 Delete Payment
**DELETE** `/api/payment/{id}`

### 6.6 Record Payment Against Invoice
**POST** `/api/invoice/{id}/payment`

**Request:**
```json
{
  "payment_date": "2024-12-20",
  "amount": 50000.00,
  "payment_mode": "bank_transfer",
  "transaction_id": "TXN123456789"
}
```

---

## 7. Ledger APIs

### 7.1 Get Ledger Entries
**GET** `/api/ledger/fetch`

**Query Params:**
- `business_id` (required)
- `party_id` (optional)
- `account_type` (optional: asset, liability, income, expense, equity)
- `account_name` (optional)
- `from_date`, `to_date` (optional)
- `page`, `limit`

**Response:**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": 1,
        "entry_date": "2024-12-01",
        "entry_type": "invoice",
        "reference_id": 1,
        "reference_type": "invoice",
        "account_type": "income",
        "account_name": "Sales",
        "debit_amount": 0,
        "credit_amount": 100000,
        "balance": 100000,
        "description": "Invoice INV-2024-00001"
      }
    ],
    "opening_balance": 0,
    "closing_balance": 100000
  }
}
```

---

## 8. GST APIs

### 8.1 Generate GSTR-1
**GET** `/api/gst/gstr1`

**Query Params:**
- `business_id` (required)
- `period_month` (required: 1-12)
- `period_year` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "12/2024",
    "b2b": [...],
    "b2cl": [...],
    "b2cs": [...],
    "hsn_summary": [...],
    "total_taxable_value": 1000000,
    "total_tax": 180000
  }
}
```

### 8.2 Generate GSTR-2
**GET** `/api/gst/gstr2`

**Query Params:** Same as GSTR-1

### 8.3 Generate GSTR-3B
**GET** `/api/gst/gstr3b`

**Query Params:** Same as GSTR-1

### 8.4 Generate E-way Bill
**POST** `/api/gst/eway-bill`

**Request:**
```json
{
  "invoice_id": 1,
  "transport_mode": "road", // road, rail, air, ship
  "vehicle_number": "MH01AB1234",
  "distance": 100,
  "transporter_id": "TRAN123",
  "transporter_name": "ABC Transport"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eway_bill_number": "123456789012",
    "eway_bill_date": "2024-12-20",
    "valid_upto": "2024-12-22"
  }
}
```

### 8.5 Get Tax Summary
**GET** `/api/gst/tax-summary`

**Query Params:**
- `business_id` (required)
- `from_date`, `to_date` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "2024-12-01 to 2024-12-31",
    "sales": {
      "taxable_value": 1000000,
      "cgst": 90000,
      "sgst": 90000,
      "igst": 0,
      "cess": 0
    },
    "purchase": {
      "taxable_value": 500000,
      "cgst": 45000,
      "sgst": 45000,
      "igst": 0,
      "cess": 0
    },
    "net_payable": {
      "cgst": 45000,
      "sgst": 45000,
      "igst": 0,
      "cess": 0
    }
  }
}
```

---

## 9. Reports APIs

### 9.1 Profit & Loss Report
**GET** `/api/reports/profit-loss`

**Query Params:**
- `business_id` (required)
- `from_date`, `to_date` (required)
- `group_by` (optional: day, week, month)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "2024-12-01 to 2024-12-31",
    "income": {
      "sales": 1000000,
      "other_income": 50000,
      "total": 1050000
    },
    "expenses": {
      "purchases": 500000,
      "operating_expenses": 200000,
      "other_expenses": 50000,
      "total": 750000
    },
    "net_profit": 300000
  }
}
```

### 9.2 Balance Sheet
**GET** `/api/reports/balance-sheet`

**Query Params:**
- `business_id` (required)
- `as_on_date` (required)

### 9.3 Sales Report
**GET** `/api/reports/sales`

**Query Params:**
- `business_id` (required)
- `from_date`, `to_date` (required)
- `party_id` (optional)
- `item_id` (optional)
- `group_by` (optional: day, week, month, party, item)

### 9.4 Purchase Report
**GET** `/api/reports/purchase`

**Query Params:** Same as sales report

### 9.5 Outstanding Report
**GET** `/api/reports/outstanding`

**Query Params:**
- `business_id` (required)
- `party_id` (optional)
- `as_on_date` (optional, default: today)

**Response:**
```json
{
  "success": true,
  "data": {
    "receivables": 500000,
    "payables": 200000,
    "net_outstanding": 300000,
    "party_wise": [
      {
        "party_id": 10,
        "party_name": "XYZ Enterprises",
        "outstanding": 100000,
        "overdue": 50000
      }
    ]
  }
}
```

### 9.6 Tax Summary Report
**GET** `/api/reports/tax-summary`

**Query Params:**
- `business_id` (required)
- `from_date`, `to_date` (required)

---

## 10. Dashboard APIs

### 10.1 Get Dashboard Data
**GET** `/api/dashboard`

**Query Params:**
- `business_id` (required)
- `period` (optional: today, week, month, year, default: month)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "December 2024",
    "summary": {
      "total_sales": 1000000,
      "total_purchases": 500000,
      "receivables": 300000,
      "payables": 100000,
      "profit": 400000
    },
    "recent_invoices": [...],
    "recent_payments": [...],
    "low_stock_items": [...],
    "overdue_invoices": [...],
    "charts": {
      "sales_trend": [...],
      "top_customers": [...],
      "top_items": [...]
    }
  }
}
```

---

## 11. Sync APIs (Offline)

### 11.1 Get Sync Data
**GET** `/api/sync/data`

**Query Params:**
- `business_id` (required)
- `last_sync_at` (optional: timestamp)
- `entity_types` (optional: comma-separated: invoices,items,parties)

**Response:**
```json
{
  "success": true,
  "data": {
    "sync_timestamp": "2024-12-20T10:00:00Z",
    "invoices": [...],
    "items": [...],
    "parties": [...],
    "payments": [...]
  }
}
```

### 11.2 Push Sync Data
**POST** `/api/sync/push`

**Request:**
```json
{
  "business_id": 1,
  "device_id": "device_123",
  "data": {
    "invoices": [...],
    "items": [...],
    "payments": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "synced": 10,
    "conflicts": 2,
    "conflict_details": [...]
  }
}
```

---

## Rate Limiting
- Free tier: 100 requests/minute
- Paid tier: 1000 requests/minute

## Pagination
Default: 20 items per page, max 100

---

**Last Updated:** December 2024

