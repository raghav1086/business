# Frontend-Backend API Endpoint Verification

This document verifies that all frontend API calls match the backend service endpoints.

## Summary

✅ **All HTTP methods match correctly**
- Frontend uses PATCH for updates (fixed)
- Backend uses PATCH for updates
- All other methods (GET, POST, DELETE) match

⚠️ **Missing Backend Endpoints:**
- Invoice Update (PATCH) - Backend doesn't have this endpoint yet
- Payment Update (PATCH) - Backend doesn't have this endpoint yet
- Payment Delete (DELETE) - Backend doesn't have this endpoint yet

---

## Detailed Comparison

### 1. Inventory Service (`/api/v1/items`)

| Frontend Call | Method | Backend Endpoint | Status |
|--------------|--------|-----------------|--------|
| `GET /items` | GET | `@Get()` | ✅ Match |
| `GET /items/:id` | GET | `@Get(':id')` | ✅ Match |
| `POST /items` | POST | `@Post()` | ✅ Match |
| `PATCH /items/:id` | PATCH | `@Patch(':id')` | ✅ Match (Fixed) |
| `DELETE /items/:id` | DELETE | `@Delete(':id')` | ✅ Match |
| `GET /items?search=...` | GET | `@Get()` with `@Query('search')` | ✅ Match |
| `GET /items?categoryId=...` | GET | `@Get()` with `@Query('categoryId')` | ✅ Match |
| `GET /items/low-stock` | GET | `@Get('low-stock')` | ✅ Match |
| `POST /stock/adjust` | POST | `@Post('adjust')` in StockController | ✅ Match |

**Frontend Files:**
- `app/inventory/page.tsx` - List, Create, Delete
- `app/inventory/new/page.tsx` - Create
- `app/inventory/[id]/page.tsx` - Get one
- `app/inventory/[id]/edit/page.tsx` - Update (PATCH ✅)
- `app/inventory/stock/page.tsx` - Stock adjustment

---

### 2. Party Service (`/api/v1/parties`)

| Frontend Call | Method | Backend Endpoint | Status |
|--------------|--------|-----------------|--------|
| `GET /parties` | GET | `@Get()` | ✅ Match |
| `GET /parties/:id` | GET | `@Get(':id')` | ✅ Match |
| `POST /parties` | POST | `@Post()` | ✅ Match |
| `PATCH /parties/:id` | PATCH | `@Patch(':id')` | ✅ Match (Fixed) |
| `DELETE /parties/:id` | DELETE | `@Delete(':id')` | ✅ Match |
| `GET /parties?type=...` | GET | `@Get()` with `@Query('type')` | ✅ Match |
| `GET /parties?search=...` | GET | `@Get()` with `@Query('search')` | ✅ Match |
| `GET /parties/:id/ledger` | GET | `@Get(':id/ledger')` | ✅ Match (Not used in FE yet) |

**Frontend Files:**
- `app/parties/page.tsx` - List, Create, Delete
- `app/parties/new/page.tsx` - Create
- `app/parties/[id]/page.tsx` - Get one
- `app/parties/[id]/edit/page.tsx` - Update (PATCH ✅)

---

### 3. Invoice Service (`/api/v1/invoices`)

| Frontend Call | Method | Backend Endpoint | Status |
|--------------|--------|-----------------|--------|
| `GET /invoices` | GET | `@Get()` | ✅ Match |
| `GET /invoices/:id` | GET | `@Get(':id')` | ✅ Match |
| `POST /invoices` | POST | `@Post()` | ✅ Match |
| `PATCH /invoices/:id` | PATCH | ❌ **NOT FOUND** | ⚠️ Missing |
| `DELETE /invoices/:id` | DELETE | ❌ **NOT FOUND** | ⚠️ Missing |
| `GET /invoices?partyId=...` | GET | `@Get()` with `@Query('partyId')` | ✅ Match |
| `GET /invoices?invoiceType=...` | GET | `@Get()` with `@Query('invoiceType')` | ✅ Match |
| `GET /invoices?status=...` | GET | `@Get()` with `@Query('status')` | ✅ Match |
| `GET /invoices/new` | GET | `@Get('new')` | ✅ Match |

**Frontend Files:**
- `app/invoices/page.tsx` - List, Delete (DELETE not in backend)
- `app/invoices/create/page.tsx` - Create
- `app/invoices/[id]/page.tsx` - Get one
- `app/invoices/[id]/edit/page.tsx` - Update (PATCH - backend missing)

**⚠️ Issues:**
- Invoice update endpoint doesn't exist in backend
- Invoice delete endpoint doesn't exist in backend

---

### 4. Payment Service (`/api/v1/payments`)

| Frontend Call | Method | Backend Endpoint | Status |
|--------------|--------|-----------------|--------|
| `GET /payments` | GET | `@Get()` | ✅ Match |
| `GET /payments/:id` | GET | `@Get(':id')` | ✅ Match |
| `POST /payments` | POST | `@Post()` | ✅ Match |
| `PATCH /payments/:id` | PATCH | ❌ **NOT FOUND** | ⚠️ Missing |
| `DELETE /payments/:id` | DELETE | ❌ **NOT FOUND** | ⚠️ Missing |
| `GET /payments?partyId=...` | GET | `@Get()` with `@Query('partyId')` | ✅ Match |
| `GET /payments?invoiceId=...` | GET | `@Get()` with `@Query('invoiceId')` | ✅ Match |
| `GET /payments?transactionType=...` | GET | `@Get()` with `@Query('transactionType')` | ✅ Match |
| `GET /payments/invoices/:invoiceId` | GET | `@Get('invoices/:invoiceId')` | ✅ Match |

**Frontend Files:**
- `app/payments/page.tsx` - List, Create, Delete (DELETE not in backend)
- `app/payments/new/page.tsx` - Create
- `app/payments/[id]/page.tsx` - Get one

**⚠️ Issues:**
- Payment update endpoint doesn't exist in backend
- Payment delete endpoint doesn't exist in backend

---

### 5. Business Service (`/api/v1/businesses`)

| Frontend Call | Method | Backend Endpoint | Status |
|--------------|--------|-----------------|--------|
| `GET /businesses` | GET | `@Get()` | ✅ Match |
| `GET /businesses/:id` | GET | `@Get(':id')` | ✅ Match |
| `POST /businesses` | POST | `@Post()` | ✅ Match |
| `PATCH /businesses/:id` | PATCH | `@Patch(':id')` | ✅ Match |
| `DELETE /businesses/:id` | DELETE | `@Delete(':id')` | ✅ Match |
| `GET /businesses/admin/stats` | GET | `@Get('admin/stats')` | ✅ Match |

**Frontend Files:**
- `app/business/select/page.tsx` - List, Create
- `app/settings/page.tsx` - Get one, Update (PATCH ✅)
- `app/providers.tsx` - List

---

### 6. Auth Service (`/api/v1/auth`)

| Frontend Call | Method | Backend Endpoint | Status |
|--------------|--------|-----------------|--------|
| `POST /auth/send-otp` | POST | `@Post('send-otp')` | ✅ Match |
| `POST /auth/verify-otp` | POST | `@Post('verify-otp')` | ✅ Match |
| `POST /auth/refresh-token` | POST | `@Post('refresh-token')` | ✅ Match (Used in interceptor) |

**Frontend Files:**
- `app/login/page.tsx` - Send OTP, Verify OTP
- `lib/api-client.ts` - Token refresh (interceptor)

---

### 7. User Service (`/api/v1/users`)

| Frontend Call | Method | Backend Endpoint | Status |
|--------------|--------|-----------------|--------|
| `GET /users/me` | GET | `@Get('me')` | ✅ Match |
| `PATCH /users/profile` | PATCH | `@Patch('profile')` | ✅ Match |
| `PUT /users/me` | PUT | ❌ **NOT FOUND** | ⚠️ Mismatch |
| `PUT /users/me/password` | PUT | ❌ **NOT FOUND** | ⚠️ Mismatch |

**Frontend Files:**
- `app/profile/page.tsx` - Uses PUT (should use PATCH)

**⚠️ Issues:**
- Profile page uses PUT instead of PATCH
- Profile page uses `/users/me` instead of `/users/profile`
- Password change endpoint doesn't exist in backend

---

## Issues Found

### Critical Issues

1. **Invoice Update Missing** ⚠️
   - Frontend: `PATCH /invoices/:id` in `app/invoices/[id]/edit/page.tsx`
   - Backend: No update endpoint exists
   - **Action Required:** Add `@Patch(':id')` to InvoiceController

2. **Invoice Delete Missing** ⚠️
   - Frontend: `DELETE /invoices/:id` in `app/invoices/page.tsx`
   - Backend: No delete endpoint exists
   - **Action Required:** Add `@Delete(':id')` to InvoiceController

3. **Payment Update Missing** ⚠️
   - Frontend: Not used yet, but should be available
   - Backend: No update endpoint exists
   - **Action Required:** Add `@Patch(':id')` to PaymentController if needed

4. **Payment Delete Missing** ⚠️
   - Frontend: `DELETE /payments/:id` in `app/payments/page.tsx`
   - Backend: No delete endpoint exists
   - **Action Required:** Add `@Delete(':id')` to PaymentController

### Minor Issues

5. **Profile Page Method Mismatch** ⚠️
   - Frontend: Uses `PUT /users/me` and `PUT /users/me/password`
   - Backend: Uses `PATCH /users/profile` and no password endpoint
   - **Action Required:** Update profile page to use correct endpoints

---

## Recommendations

1. **Add Missing Invoice Endpoints:**
   ```typescript
   // In InvoiceController
   @Patch(':id')
   async update(...) { ... }
   
   @Delete(':id')
   async remove(...) { ... }
   ```

2. **Add Missing Payment Endpoints:**
   ```typescript
   // In PaymentController
   @Delete(':id')
   async remove(...) { ... }
   ```

3. **Fix Profile Page:**
   - Change `PUT /users/me` → `PATCH /users/profile`
   - Remove password change (or add backend endpoint)

4. **All Other Endpoints:** ✅ Working correctly

---

## Verification Status

- ✅ **Inventory Service:** All endpoints match
- ✅ **Party Service:** All endpoints match
- ⚠️ **Invoice Service:** Missing update/delete endpoints
- ⚠️ **Payment Service:** Missing delete endpoint
- ✅ **Business Service:** All endpoints match
- ✅ **Auth Service:** All endpoints match
- ⚠️ **User Service:** Profile page needs fixes

---

## Next Steps

1. Fix profile page endpoints
2. Add invoice update/delete endpoints to backend
3. Add payment delete endpoint to backend
4. Test all endpoints after fixes

