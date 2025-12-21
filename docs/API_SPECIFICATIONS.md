# Vyapar App - API Specifications

## Overview
This document provides detailed API specifications for all microservices. All APIs follow RESTful conventions and use JSON for request/response bodies.

## Base URLs
- **API Gateway**: `https://api.vyapar-app.com/v1`
- **Local Development**: `http://localhost:3000/api/v1`

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "phone",
        "message": "Phone number must be 10 digits"
      }
    ]
  }
}
```

---

## Auth Service APIs

### POST /auth/send-otp
Send OTP to phone number for registration or login.

**Request Body:**
```json
{
  "phone": "9876543210",
  "country_code": "+91"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "otp_id": "uuid",
    "expires_in": 300,
    "is_new_user": true
  }
}
```

**Error Codes:**
- `RATE_LIMITED` (429): Too many OTP requests
- `INVALID_PHONE` (400): Invalid phone number format

---

### POST /auth/verify-otp
Verify OTP and get access tokens.

**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456",
  "otp_id": "uuid",
  "device_info": {
    "device_name": "iPhone 14",
    "os": "iOS 17",
    "app_version": "1.0.0"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "phone": "9876543210",
      "name": null,
      "is_new_user": true
    },
    "tokens": {
      "access_token": "eyJhbG...",
      "refresh_token": "eyJhbG...",
      "expires_in": 900
    }
  }
}
```

**Error Codes:**
- `INVALID_OTP` (400): OTP is incorrect
- `OTP_EXPIRED` (400): OTP has expired
- `MAX_ATTEMPTS` (400): Maximum verification attempts exceeded

---

### POST /auth/refresh-token
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbG..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "expires_in": 900
  }
}
```

---

### POST /auth/logout
Logout current session.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /auth/sessions
Get all active sessions for the user.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "device_name": "iPhone 14",
      "os": "iOS 17",
      "ip_address": "192.168.1.1",
      "last_active": "2025-12-20T10:00:00Z",
      "is_current": true
    }
  ]
}
```

---

### DELETE /auth/sessions/:id
Revoke a specific session.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session revoked"
}
```

---

## User APIs

### GET /users/profile
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "phone": "9876543210",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar_url": "https://...",
    "created_at": "2025-12-20T10:00:00Z"
  }
}
```

---

### PATCH /users/profile
Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "phone": "9876543210",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## Business Service APIs

### POST /businesses
Create a new business.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "ABC Traders",
  "type": "retailer",
  "gstin": "29ABCDE1234F1Z5",
  "phone": "9876543210",
  "email": "abc@traders.com",
  "address_line1": "123 Main Street",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "bank_name": "HDFC Bank",
  "account_number": "1234567890",
  "ifsc_code": "HDFC0001234",
  "upi_id": "abc@upi"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "ABC Traders",
    "gstin": "29ABCDE1234F1Z5",
    "created_at": "2025-12-20T10:00:00Z"
  }
}
```

---

### GET /businesses
Get all businesses for the user.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "ABC Traders",
      "gstin": "29ABCDE1234F1Z5",
      "type": "retailer",
      "logo_url": null
    }
  ]
}
```

---

### GET /businesses/:id
Get business details.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "ABC Traders",
    "type": "retailer",
    "gstin": "29ABCDE1234F1Z5",
    "phone": "9876543210",
    "email": "abc@traders.com",
    "address_line1": "123 Main Street",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001",
    "bank_details": {
      "bank_name": "HDFC Bank",
      "account_number": "****7890",
      "ifsc_code": "HDFC0001234"
    }
  }
}
```

---

### PATCH /businesses/:id
Update business details.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Request Body:** (partial update)
```json
{
  "name": "ABC Traders Pvt Ltd",
  "email": "contact@abctraders.com"
}
```

---

## Party APIs

### POST /parties
Create a new party (customer/supplier).

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Request Body:**
```json
{
  "name": "XYZ Enterprises",
  "type": "customer",
  "phone": "9876543211",
  "email": "xyz@enterprise.com",
  "gstin": "29XYZAB1234C1Z1",
  "billing_address_line1": "456 Market Road",
  "billing_city": "Chennai",
  "billing_state": "Tamil Nadu",
  "billing_pincode": "600001",
  "opening_balance": 5000,
  "opening_balance_type": "debit",
  "credit_limit": 50000,
  "credit_period_days": 30
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "XYZ Enterprises",
    "type": "customer",
    "phone": "9876543211",
    "current_balance": 5000,
    "balance_type": "receivable"
  }
}
```

---

### GET /parties
List all parties with filters.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Query Parameters:**
- `type`: customer | supplier | both
- `search`: Search by name, phone, or GSTIN
- `sort`: name | balance | recent
- `order`: asc | desc
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "XYZ Enterprises",
      "type": "customer",
      "phone": "9876543211",
      "gstin": "29XYZAB1234C1Z1",
      "current_balance": 5000,
      "balance_type": "receivable"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

### GET /parties/:id
Get party details.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "XYZ Enterprises",
    "type": "customer",
    "phone": "9876543211",
    "email": "xyz@enterprise.com",
    "gstin": "29XYZAB1234C1Z1",
    "billing_address": {
      "line1": "456 Market Road",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "pincode": "600001"
    },
    "financial": {
      "current_balance": 5000,
      "balance_type": "receivable",
      "credit_limit": 50000,
      "credit_period_days": 30,
      "total_sales": 150000,
      "total_receipts": 145000
    },
    "last_transaction_date": "2025-12-15"
  }
}
```

---

### GET /parties/:id/ledger
Get party ledger entries.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Query Parameters:**
- `from`: Start date (YYYY-MM-DD)
- `to`: End date (YYYY-MM-DD)
- `page`: Page number
- `limit`: Items per page

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "opening_balance": 0,
    "closing_balance": 5000,
    "entries": [
      {
        "id": "uuid",
        "date": "2025-12-10",
        "type": "invoice",
        "reference": "INV-2025-00001",
        "description": "Sales Invoice",
        "debit": 15000,
        "credit": 0,
        "balance": 15000
      },
      {
        "id": "uuid",
        "date": "2025-12-15",
        "type": "payment",
        "reference": "REC-001",
        "description": "Payment Received - UPI",
        "debit": 0,
        "credit": 10000,
        "balance": 5000
      }
    ]
  }
}
```

---

## Inventory APIs

### POST /items
Create a new item.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Request Body:**
```json
{
  "name": "Samsung Galaxy S24",
  "sku": "SAM-S24-128",
  "barcode": "8901234567890",
  "category_id": "uuid",
  "unit_id": "uuid",
  "hsn_code": "85171290",
  "selling_price": 79999,
  "purchase_price": 65000,
  "mrp": 84999,
  "tax_rate": 18,
  "current_stock": 10,
  "low_stock_threshold": 5,
  "description": "Samsung Galaxy S24 128GB"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Samsung Galaxy S24",
    "sku": "SAM-S24-128",
    "selling_price": 79999,
    "current_stock": 10,
    "tax_rate": 18
  }
}
```

---

### GET /items
List all items with filters.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Query Parameters:**
- `search`: Search by name, SKU, or barcode
- `category`: Category ID
- `stock_status`: in_stock | low_stock | out_of_stock
- `sort`: name | price | stock
- `order`: asc | desc
- `page`: Page number
- `limit`: Items per page

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Samsung Galaxy S24",
      "sku": "SAM-S24-128",
      "category": "Mobile Phones",
      "selling_price": 79999,
      "current_stock": 10,
      "stock_status": "in_stock",
      "image_url": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

---

### POST /items/:id/stock-adjustment
Adjust stock quantity.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Request Body:**
```json
{
  "adjustment_type": "reduce",
  "quantity": 2,
  "reason": "damage",
  "notes": "Damaged during transit"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "item_id": "uuid",
    "previous_stock": 10,
    "adjustment": -2,
    "current_stock": 8
  }
}
```

---

## Invoice APIs

### POST /invoices
Create a new invoice.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Request Body:**
```json
{
  "party_id": "uuid",
  "invoice_type": "sale",
  "invoice_date": "2025-12-20",
  "due_date": "2026-01-20",
  "place_of_supply": "Karnataka",
  "items": [
    {
      "item_id": "uuid",
      "quantity": 2,
      "unit_price": 79999,
      "discount_percent": 5,
      "tax_rate": 18
    }
  ],
  "additional_charges": 500,
  "discount_amount": 0,
  "terms": "Goods once sold cannot be returned",
  "notes": "Thank you for your business"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "invoice_number": "INV-2025-00042",
    "party": {
      "id": "uuid",
      "name": "XYZ Enterprises"
    },
    "invoice_date": "2025-12-20",
    "subtotal": 151998.10,
    "discount_amount": 7999.90,
    "taxable_amount": 143998.20,
    "cgst_amount": 12959.84,
    "sgst_amount": 12959.84,
    "total_amount": 170418,
    "payment_status": "unpaid"
  }
}
```

---

### GET /invoices
List all invoices with filters.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Query Parameters:**
- `type`: sale | purchase | quotation
- `status`: unpaid | partial | paid | draft | cancelled
- `party_id`: Filter by party
- `from`: Start date
- `to`: End date
- `search`: Search by invoice number
- `page`: Page number
- `limit`: Items per page

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "invoice_number": "INV-2025-00042",
      "party_name": "XYZ Enterprises",
      "invoice_date": "2025-12-20",
      "total_amount": 170418,
      "paid_amount": 0,
      "balance_due": 170418,
      "payment_status": "unpaid",
      "status": "final"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 230,
    "summary": {
      "total_sales": 5000000,
      "total_receivable": 750000
    }
  }
}
```

---

### GET /invoices/:id
Get invoice details.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "invoice_number": "INV-2025-00042",
    "invoice_type": "sale",
    "invoice_date": "2025-12-20",
    "due_date": "2026-01-20",
    "party": {
      "id": "uuid",
      "name": "XYZ Enterprises",
      "gstin": "29XYZAB1234C1Z1",
      "address": "456 Market Road, Chennai"
    },
    "items": [
      {
        "id": "uuid",
        "item_name": "Samsung Galaxy S24",
        "hsn_code": "85171290",
        "quantity": 2,
        "unit": "Pcs",
        "unit_price": 79999,
        "discount_percent": 5,
        "taxable_amount": 151998.10,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "cgst_amount": 12959.84,
        "sgst_amount": 12959.84,
        "total_amount": 169917.78
      }
    ],
    "summary": {
      "subtotal": 159998,
      "discount": 7999.90,
      "taxable_amount": 151998.10,
      "cgst": 12959.84,
      "sgst": 12959.84,
      "igst": 0,
      "additional_charges": 500,
      "round_off": 0.22,
      "total": 170418
    },
    "payment_status": "unpaid",
    "paid_amount": 0,
    "balance_due": 170418,
    "payments": [],
    "terms": "Goods once sold cannot be returned",
    "notes": "Thank you for your business"
  }
}
```

---

### POST /invoices/:id/payments
Record payment against invoice.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Request Body:**
```json
{
  "amount": 100000,
  "payment_date": "2025-12-22",
  "payment_mode": "bank_transfer",
  "reference_number": "UTR123456789"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "invoice_id": "uuid",
    "amount": 100000,
    "previous_balance": 170418,
    "new_balance": 70418,
    "payment_status": "partial"
  }
}
```

---

### GET /invoices/:id/pdf
Generate PDF for invoice.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Query Parameters:**
- `format`: a4 | thermal_58 | thermal_80

**Response (200 OK):**
Returns PDF file binary with `Content-Type: application/pdf`

---

## GST APIs

### GET /gst/gstr1
Generate GSTR-1 report data.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Query Parameters:**
- `period`: MMYYYY (e.g., 122025 for Dec 2025)
- `format`: json | excel

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "gstin": "29ABCDE1234F1Z5",
    "return_period": "122025",
    "b2b": [
      {
        "customer_gstin": "29XYZAB1234C1Z1",
        "invoices": [
          {
            "invoice_number": "INV-2025-00042",
            "invoice_date": "2025-12-20",
            "invoice_value": 170418,
            "place_of_supply": "29-Karnataka",
            "items": [
              {
                "rate": 18,
                "taxable_value": 151998.10,
                "cgst": 12959.84,
                "sgst": 12959.84
              }
            ]
          }
        ]
      }
    ],
    "b2c_small": {
      "summary": [
        {
          "place_of_supply": "29-Karnataka",
          "rate": 18,
          "taxable_value": 50000,
          "cgst": 4500,
          "sgst": 4500
        }
      ]
    },
    "hsn_summary": [
      {
        "hsn_code": "85171290",
        "description": "Mobile Phones",
        "uqc": "PCS",
        "quantity": 10,
        "taxable_value": 800000,
        "cgst": 72000,
        "sgst": 72000,
        "igst": 0
      }
    ]
  }
}
```

---

## Sync APIs

### POST /sync/push
Push local changes to server.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Request Body:**
```json
{
  "device_id": "device-uuid",
  "changes": [
    {
      "entity_type": "invoice",
      "entity_id": "local-uuid",
      "operation": "create",
      "local_timestamp": "2025-12-20T10:00:00Z",
      "payload": { ... }
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "synced": [
      {
        "local_id": "local-uuid",
        "server_id": "server-uuid",
        "entity_type": "invoice"
      }
    ],
    "conflicts": [],
    "failed": []
  }
}
```

---

### GET /sync/pull
Pull server changes since last sync.

**Headers:** `Authorization: Bearer <token>`, `X-Business-Id: <business_uuid>`

**Query Parameters:**
- `since`: Last sync timestamp (ISO 8601)
- `device_id`: Device identifier

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "changes": [
      {
        "entity_type": "party",
        "entity_id": "uuid",
        "operation": "update",
        "timestamp": "2025-12-20T11:00:00Z",
        "payload": { ... }
      }
    ],
    "sync_timestamp": "2025-12-20T12:00:00Z"
  }
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request data |
| INVALID_OTP | 400 | OTP verification failed |
| OTP_EXPIRED | 400 | OTP has expired |
| UNAUTHORIZED | 401 | Authentication required |
| TOKEN_EXPIRED | 401 | Access token expired |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
