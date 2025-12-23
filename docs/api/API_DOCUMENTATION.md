# API Documentation

## Overview

This document provides comprehensive information about the Business Management System APIs.

## Base URLs

### Development
- Auth Service: `http://localhost:3002`
- Business Service: `http://localhost:3003`
- Party Service: `http://localhost:3004`
- Inventory Service: `http://localhost:3005`
- Invoice Service: `http://localhost:3006`
- Payment Service: `http://localhost:3007`

### Swagger Documentation
Each service provides interactive API documentation at `/api/docs`:
- Auth: http://localhost:3002/api/docs
- Business: http://localhost:3003/api/docs
- Party: http://localhost:3004/api/docs
- Inventory: http://localhost:3005/api/docs
- Invoice: http://localhost:3006/api/docs
- Payment: http://localhost:3007/api/docs

## Authentication

All endpoints (except authentication endpoints) require a valid JWT token.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Getting Access Token

1. **Send OTP**
```http
POST /api/v1/auth/send-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "purpose": "login"
}
```

Response:
```json
{
  "otp_id": "otp_abc123",
  "expires_in": 300,
  "message": "OTP sent successfully"
}
```

2. **Verify OTP**
```http
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456",
  "otp_id": "otp_abc123"
}
```

Response:
```json
{
  "user": {
    "id": "user_123",
    "phone": "9876543210",
    "name": "John Doe",
    "phone_verified": true
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "is_new_user": false
}
```

3. **Refresh Token**
```http
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## API Services

### 1. Authentication Service (Port 3002)

**Endpoints:**
- `POST /api/v1/auth/send-otp` - Send OTP to phone
- `POST /api/v1/auth/verify-otp` - Verify OTP and login
- `POST /api/v1/auth/refresh-token` - Refresh access token

### 2. Business Service (Port 3003)

**Endpoints:**
- `POST /api/v1/businesses` - Create business
- `GET /api/v1/businesses` - List all businesses
- `GET /api/v1/businesses/:id` - Get business by ID
- `PATCH /api/v1/businesses/:id` - Update business
- `DELETE /api/v1/businesses/:id` - Delete business

**Example: Create Business**
```http
POST /api/v1/businesses
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Acme Trading Company",
  "type": "retailer",
  "gstin": "27AABCU9603R1ZX",
  "pan": "AABCU9603R",
  "phone": "9876543210",
  "email": "contact@acme.com",
  "address_line1": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}
```

### 3. Party Service (Port 3004)

**Endpoints:**
- `POST /api/v1/parties` - Create party (customer/supplier)
- `GET /api/v1/parties` - List parties
- `GET /api/v1/parties/:id` - Get party details
- `PATCH /api/v1/parties/:id` - Update party
- `DELETE /api/v1/parties/:id` - Delete party
- `GET /api/v1/parties/:id/ledger` - Get party ledger

**Example: Create Party**
```http
POST /api/v1/parties
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "ABC Suppliers",
  "type": "supplier",
  "phone": "9876543210",
  "email": "abc@suppliers.com",
  "gstin": "27AABCU9603R1ZX",
  "billing_address_line1": "456 Market Road",
  "billing_city": "Mumbai",
  "billing_state": "Maharashtra",
  "billing_pincode": "400002"
}
```

### 4. Inventory Service (Port 3005)

**Endpoints:**
- `POST /api/v1/items` - Create item
- `GET /api/v1/items` - List items
- `GET /api/v1/items/:id` - Get item details
- `PATCH /api/v1/items/:id` - Update item
- `DELETE /api/v1/items/:id` - Delete item
- `POST /api/v1/stock/adjust` - Adjust stock
- `GET /api/v1/items/low-stock` - Get low stock items
- `POST /api/v1/categories` - Create category
- `GET /api/v1/categories` - List categories

**Example: Create Item**
```http
POST /api/v1/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Product A",
  "sku": "PROD-A-001",
  "hsn_code": "1234",
  "unit_of_measure": "pcs",
  "sale_price": 1000,
  "purchase_price": 800,
  "current_stock": 100,
  "low_stock_threshold": 10,
  "track_stock": true
}
```

### 5. Invoice Service (Port 3006)

**Endpoints:**
- `POST /api/v1/invoices` - Create invoice
- `GET /api/v1/invoices` - List invoices
- `GET /api/v1/invoices/:id` - Get invoice details
- `PATCH /api/v1/invoices/:id` - Update invoice
- `DELETE /api/v1/invoices/:id` - Delete invoice
- `GET /api/v1/invoices/reports/summary` - Get invoice summary

**Example: Create Invoice**
```http
POST /api/v1/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "party_id": "party_123",
  "invoice_type": "sale",
  "invoice_date": "2025-12-22",
  "due_date": "2026-01-22",
  "is_interstate": false,
  "items": [
    {
      "item_name": "Product A",
      "quantity": 10,
      "unit_price": 1000,
      "tax_rate": 18
    }
  ],
  "notes": "Thank you for your business"
}
```

### 6. Payment Service (Port 3007)

**Endpoints:**
- `POST /api/v1/payments` - Record payment
- `GET /api/v1/payments` - List payments
- `GET /api/v1/payments/:id` - Get payment details
- `GET /api/v1/payments/invoices/:invoiceId` - Get payments for invoice
- `GET /api/v1/payments/parties/:partyId` - Get payments for party

**Example: Record Payment**
```http
POST /api/v1/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoice_id": "invoice_123",
  "party_id": "party_123",
  "amount": 11800,
  "payment_date": "2025-12-22",
  "payment_mode": "upi",
  "reference_number": "UPI123456789"
}
```

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `422` - Unprocessable Entity
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Rate Limiting

- OTP endpoints: 5 requests per 5 minutes per phone number
- Other endpoints: 100 requests per minute per user

## Data Validation

### Phone Number
- Format: 10 digits starting with 6-9
- Example: `9876543210`

### GSTIN
- Format: 15 characters (2 digits + 10 alphanumeric + 3 specific chars)
- Example: `27AABCU9603R1ZX`

### PAN
- Format: 10 characters (5 letters + 4 digits + 1 letter)
- Example: `AABCU9603R`

### Pincode
- Format: 6 digits
- Example: `400001`

## Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (httpOnly cookies or secure storage)
3. **Refresh tokens before expiry**
4. **Handle errors gracefully**
5. **Implement retry logic** for network failures
6. **Log API requests** for debugging
7. **Use pagination** for large datasets
8. **Cache responses** where appropriate

## Support

For API support, contact: support@businessapp.com

## Changelog

### Version 1.0.0 (2025-12-22)
- Initial API release
- Authentication with OTP
- Business, Party, Inventory, Invoice, Payment management
- GST calculations
- Ledger tracking
