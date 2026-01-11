# GST Frontend Integration Plan

## Overview
This document outlines the complete frontend integration plan for GST features, ensuring proper request/response mapping, validation, and avoiding previous issues.

## Key Principles
1. **Proper Type Mapping**: All backend DTOs must have matching TypeScript types
2. **Request/Response Mapping**: Explicit mapping functions to handle backend format
3. **Validation Integration**: HSN/SAC validation integrated in forms
4. **Error Handling**: Consistent error handling following existing patterns
5. **Loading States**: Proper loading and error states for all operations

## Implementation Steps

### Step 1: API Client Setup
- [x] Create GST API client following existing pattern
- [x] Add GST service URL to API_URLS
- [x] Ensure proper authentication headers
- [x] Add business ID header handling

### Step 2: TypeScript Types
- [x] Create types matching all backend DTOs
- [x] GSTR-1 types
- [x] GSTR-3B types
- [x] GSTR-4 types
- [x] E-Invoice types
- [x] E-Way Bill types
- [x] GSTR-2A Reconciliation types
- [x] Validation types
- [x] Business GST Settings types

### Step 3: Validation Integration
- [x] HSN validation in item forms
- [x] SAC validation in item forms
- [x] Real-time validation feedback
- [x] Error messages display

### Step 4: Reports UI
- [x] GSTR-1 report page
- [x] GSTR-3B report page
- [x] GSTR-4 report page
- [x] Period selector (monthly/quarterly)
- [x] Export functionality (JSON/Excel)
- [x] Loading states
- [x] Error handling

### Step 5: E-Invoice Integration
- [x] E-Invoice section in invoice detail page
- [x] Generate IRN button
- [x] Display IRN and QR code
- [x] Status display
- [x] Cancel IRN functionality

### Step 6: E-Way Bill Integration
- [x] E-Way Bill section in invoice detail page
- [x] Generate E-Way Bill button
- [x] Display E-Way Bill number
- [x] Update/Cancel functionality
- [x] Status display

### Step 7: GSTR-2A Reconciliation
- [x] Import GSTR-2A page
- [x] File upload/JSON input
- [x] Reconciliation report display
- [x] Match/mismatch indicators
- [x] Manual matching functionality

### Step 8: Business GST Settings
- [x] GST Settings page/section
- [x] GST type selection
- [x] Filing frequency selection
- [x] GSP provider configuration
- [x] E-Invoice/E-Way Bill toggles

## File Structure

```
web-app/
├── lib/
│   ├── api-client.ts (add gstApi)
│   └── types/
│       └── gst.ts (all GST types)
├── app/
│   ├── gst/
│   │   ├── reports/
│   │   │   ├── gstr1/
│   │   │   │   └── page.tsx
│   │   │   ├── gstr3b/
│   │   │   │   └── page.tsx
│   │   │   └── gstr4/
│   │   │       └── page.tsx
│   │   ├── reconciliation/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── invoices/
│       └── [id]/
│           └── page.tsx (add E-Invoice & E-Way Bill sections)
└── components/
    └── gst/
        ├── gstr1-report.tsx
        ├── gstr3b-report.tsx
        ├── gstr4-report.tsx
        ├── einvoice-section.tsx
        ├── ewaybill-section.tsx
        └── reconciliation-report.tsx
```

## Request/Response Mapping

### GSTR-1 Request
```typescript
// Frontend
const request = {
  period: "122024", // MMYYYY or Q1-2024
  format: "json" | "excel"
}

// Backend expects same format - direct mapping
```

### GSTR-1 Response
```typescript
// Backend returns
{
  gstin: string;
  return_period: string;
  b2b: [...];
  b2c_small: [...];
  // ... other sections
}

// Frontend uses directly - no mapping needed
```

### E-Invoice Request
```typescript
// Frontend
const request = {
  invoice_id: "uuid"
}

// Backend expects same - direct mapping
```

### E-Invoice Response
```typescript
// Backend returns
{
  irn: string;
  irn_date: string;
  qr_code: string;
  // ...
}

// Frontend uses directly
```

## Validation Mapping

### HSN Validation
```typescript
// Frontend request
{
  hsn_code: "85171290"
}

// Backend response
{
  isValid: boolean;
  code: string;
  length?: number;
  errors: Array<{ message: string; field?: string }>;
  warnings: Array<{ message: string; field?: string }>;
}
```

## Error Handling

All GST API calls should:
1. Use try-catch blocks
2. Display user-friendly error messages
3. Handle network errors
4. Handle validation errors
5. Handle business ID missing errors

## Testing Checklist

- [ ] GSTR-1 report generation
- [ ] GSTR-3B report generation
- [ ] GSTR-4 report generation
- [ ] Excel export for all reports
- [ ] E-Invoice IRN generation
- [ ] E-Way Bill generation
- [ ] GSTR-2A import and reconciliation
- [ ] HSN/SAC validation in forms
- [ ] Error handling for all operations
- [ ] Loading states
- [ ] Business ID handling

