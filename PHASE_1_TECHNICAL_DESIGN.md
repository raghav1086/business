# Phase 1: Technical Design Document
## Inventory Module Enhancements

**Date:** 2025-01-10  
**Phase:** 1 of 5  
**Estimated Duration:** 10-13 days

---

## Table of Contents

1. [Category Management UI](#1-category-management-ui)
2. [Unit Management UI](#2-unit-management-ui)
3. [Bulk Import/Export](#3-bulk-importexport)

---

## 1. Category Management UI

### 1.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│  /inventory/categories                                   │
│    ├── page.tsx (List + CRUD)                            │
│    └── [id]/edit/page.tsx (Edit form)                   │
│                                                           │
│  components/inventory/                                   │
│    └── category-form.tsx (Reusable form)                │
│                                                           │
│  lib/api-client.ts                                       │
│    └── categoryApi (API methods)                          │
└─────────────────────────────────────────────────────────┘
                        ↕ HTTP
┌─────────────────────────────────────────────────────────┐
│              Backend (NestJS - Inventory Service)        │
├─────────────────────────────────────────────────────────┤
│  /api/v1/categories                                       │
│    ├── GET    / (List all)                               │
│    ├── GET    /:id (Get one)                             │
│    ├── POST   / (Create)                                 │
│    ├── PATCH  /:id (Update)                              │
│    └── DELETE /:id (Delete)                              │
│                                                           │
│  Controllers: CategoryController                         │
│  Services: CategoryService                              │
│  Entities: Category (already exists)                     │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Database Schema

**Categories Table** (already exists):
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 1.3 API Endpoints

#### GET /api/v1/categories
**Query Params:**
- `search` (optional): Search by name
- `parent_id` (optional): Filter by parent
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Electronics",
        "parent_id": null,
        "description": "Electronic items",
        "sort_order": 1,
        "item_count": 25,
        "created_at": "2025-01-10T10:00:00Z",
        "updated_at": "2025-01-10T10:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

#### POST /api/v1/categories
**Request Body:**
```json
{
  "name": "Electronics",
  "parent_id": null,
  "description": "Electronic items",
  "sort_order": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Electronics",
    "parent_id": null,
    "description": "Electronic items",
    "sort_order": 1,
    "created_at": "2025-01-10T10:00:00Z",
    "updated_at": "2025-01-10T10:00:00Z"
  }
}
```

#### PATCH /api/v1/categories/:id
**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "sort_order": 2
}
```

#### DELETE /api/v1/categories/:id
**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Validation:**
- Cannot delete category if it has items
- Cannot delete category if it has child categories

### 1.4 Frontend Components

#### Category List Page (`/inventory/categories/page.tsx`)

**Features:**
- List all categories in table/card view
- Search by name
- Filter by parent category
- Create new category button
- Edit/Delete actions per category
- Show item count per category
- Sort by name or sort_order

**State Management:**
```typescript
const [categories, setCategories] = useState<Category[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [isLoading, setIsLoading] = useState(true);
const [isDialogOpen, setIsDialogOpen] = useState(false);
```

**Key Functions:**
- `fetchCategories()` - Load categories from API
- `handleCreate()` - Open create dialog
- `handleEdit(id)` - Open edit dialog
- `handleDelete(id)` - Delete with confirmation
- `handleSearch()` - Filter categories

#### Category Form Component (`components/inventory/category-form.tsx`)

**Props:**
```typescript
interface CategoryFormProps {
  category?: Category; // For edit mode
  onSuccess: () => void;
  onCancel: () => void;
}
```

**Form Fields:**
- Name (required, 2-100 chars)
- Parent Category (optional, dropdown)
- Description (optional, textarea)
- Sort Order (optional, number)

**Validation:**
- Name required and unique within business
- Parent cannot be self (if editing)
- Sort order >= 0

### 1.5 Integration with Item Forms

**Current State:**
```typescript
// Hardcoded categories
const CATEGORIES = ['Electronics', 'Clothing', ...];
```

**New Implementation:**
```typescript
// Fetch from API
const { data: categories } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const response = await categoryApi.get('/categories');
    return response.data?.data?.categories || [];
  }
});

// Use in form
<Select value={formData.category_id} onValueChange={handleCategoryChange}>
  <SelectTrigger>
    <SelectValue placeholder="Select category" />
  </SelectTrigger>
  <SelectContent>
    {categories?.map(cat => (
      <SelectItem key={cat.id} value={cat.id}>
        {cat.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Files to Modify:**
- `web-app/app/inventory/new/page.tsx`
- `web-app/app/inventory/[id]/edit/page.tsx`
- `web-app/lib/payload-utils.ts` (update to use category_id)

### 1.6 Implementation Steps

1. **Backend Verification**
   - [ ] Verify CategoryController exists
   - [ ] Verify CategoryService exists
   - [ ] Test all endpoints with Postman/curl
   - [ ] Check permissions/RBAC

2. **Frontend API Client**
   - [ ] Add categoryApi to `lib/api-client.ts`
   - [ ] Implement all CRUD methods
   - [ ] Add error handling

3. **Category List Page**
   - [ ] Create page structure
   - [ ] Implement list view
   - [ ] Add search functionality
   - [ ] Add create/edit/delete actions
   - [ ] Add loading/error states

4. **Category Form Component**
   - [ ] Create form component
   - [ ] Add form validation
   - [ ] Handle create/edit modes
   - [ ] Add parent category selector

5. **Integration with Items**
   - [ ] Update item create form
   - [ ] Update item edit form
   - [ ] Update payload builder
   - [ ] Test category selection

6. **Testing**
   - [ ] Test create category
   - [ ] Test edit category
   - [ ] Test delete category (with validation)
   - [ ] Test category selection in items
   - [ ] Test search/filter

---

## 2. Unit Management UI

### 2.1 Architecture Overview

Similar to Category Management, but for Units.

### 2.2 Database Schema

**Units Table** (already exists):
```sql
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  name VARCHAR(50) NOT NULL,
  short_name VARCHAR(10) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  decimal_places INTEGER DEFAULT 0 CHECK (decimal_places >= 0 AND decimal_places <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.3 API Endpoints

#### GET /api/v1/units
**Response:**
```json
{
  "success": true,
  "data": {
    "units": [
      {
        "id": "uuid",
        "name": "Kilogram",
        "short_name": "kg",
        "is_default": false,
        "decimal_places": 2,
        "item_count": 15,
        "created_at": "2025-01-10T10:00:00Z",
        "updated_at": "2025-01-10T10:00:00Z"
      }
    ],
    "total": 10
  }
}
```

#### POST /api/v1/units
**Request Body:**
```json
{
  "name": "Kilogram",
  "short_name": "kg",
  "is_default": false,
  "decimal_places": 2
}
```

**Validation:**
- Only one default unit per business
- Short name must be unique within business
- Decimal places: 0-5

#### PATCH /api/v1/units/:id
**Special Logic:**
- If setting `is_default: true`, unset other default units
- Cannot unset default if it's the only unit

#### DELETE /api/v1/units/:id
**Validation:**
- Cannot delete default unit if it's the only unit
- Cannot delete unit if it has items

### 2.4 Frontend Components

#### Unit List Page (`/inventory/units/page.tsx`)

**Features:**
- List all units
- Show default unit badge
- Create/Edit/Delete actions
- Set default unit action
- Show item count per unit

#### Unit Form Component (`components/inventory/unit-form.tsx`)

**Form Fields:**
- Name (required, 2-50 chars)
- Short Name (required, 1-10 chars)
- Is Default (checkbox)
- Decimal Places (0-5, number input)

**Special Handling:**
- When "Is Default" is checked, show warning about unsetting other default
- Validate short name uniqueness

### 2.5 Integration with Item Forms

**Current State:**
```typescript
const UNITS = ['pcs', 'kg', 'gm', ...];
```

**New Implementation:**
```typescript
const { data: units } = useQuery({
  queryKey: ['units'],
  queryFn: async () => {
    const response = await unitApi.get('/units');
    return response.data?.data?.units || [];
  }
});
```

### 2.6 Implementation Steps

1. **Backend Verification**
   - [ ] Verify UnitController exists
   - [ ] Test all endpoints
   - [ ] Check default unit logic

2. **Frontend API Client**
   - [ ] Add unitApi to `lib/api-client.ts`
   - [ ] Implement CRUD methods

3. **Unit List Page**
   - [ ] Create page structure
   - [ ] Implement list view
   - [ ] Add default unit indicator
   - [ ] Add set default action

4. **Unit Form Component**
   - [ ] Create form component
   - [ ] Add validation
   - [ ] Handle default unit logic

5. **Integration with Items**
   - [ ] Update item forms
   - [ ] Update payload builder
   - [ ] Test unit selection

6. **Testing**
   - [ ] Test all CRUD operations
   - [ ] Test default unit logic
   - [ ] Test validation

---

## 3. Bulk Import/Export

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│  /inventory/import                                       │
│    └── page.tsx (Import UI)                              │
│                                                           │
│  components/inventory/                                   │
│    ├── import-preview.tsx (Preview table)                │
│    └── file-upload.tsx (File upload)                     │
│                                                           │
│  lib/import-utils.ts                                     │
│    ├── parseExcelFile()                                  │
│    ├── parseCSVFile()                                    │
│    ├── validateImportData()                              │
│    └── mapCategoryNameToId()                             │
│                                                           │
│  lib/export-utils.ts                                     │
│    └── exportItemsToExcel()                              │
└─────────────────────────────────────────────────────────┘
                        ↕ HTTP
┌─────────────────────────────────────────────────────────┐
│              Backend (NestJS - Inventory Service)        │
├─────────────────────────────────────────────────────────┤
│  POST /api/v1/items/bulk                                 │
│    └── Bulk create items                                 │
│                                                           │
│  (Export can be client-side, no backend needed)          │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Import File Format

**Excel/CSV Columns:**
```
| Name | SKU | HSN Code | Category | Unit | Purchase Price | Selling Price | GST Rate | Current Stock | Low Stock Threshold | Description |
|------|-----|----------|----------|------|----------------|---------------|----------|---------------|-------------------|-------------|
| Item1| SKU1| 8471     | Electronics | pcs | 100 | 150 | 18 | 50 | 10 | Description |
```

**Required Fields:**
- Name
- Selling Price

**Optional Fields:**
- All others

**Validation Rules:**
- Name: Required, 2-200 chars
- SKU: Optional, unique within business
- HSN Code: Optional, 8 digits
- Category: Must match existing category name
- Unit: Must match existing unit name
- Prices: Must be >= 0
- GST Rate: Must be valid (0, 5, 12, 18, 28)
- Stock: Must be >= 0

### 3.3 Import Flow

```
1. User clicks "Import Items"
2. User selects file (Excel/CSV)
3. File is parsed
4. Data is validated:
   - Required fields check
   - Data type validation
   - Category/Unit name mapping
   - Duplicate SKU detection
5. Preview table shown with:
   - Valid rows (green)
   - Invalid rows (red) with error messages
6. User reviews and confirms
7. Valid items are sent to backend in batches
8. Progress indicator shown
9. Results displayed:
   - Success count
   - Failed rows with errors
```

### 3.4 Backend Bulk Endpoint

#### POST /api/v1/items/bulk

**Request Body:**
```json
{
  "items": [
    {
      "name": "Item 1",
      "sku": "SKU1",
      "hsn_code": "8471",
      "category_id": "uuid",
      "unit_id": "uuid",
      "purchase_price": 100,
      "selling_price": 150,
      "tax_rate": 18,
      "current_stock": 50,
      "low_stock_threshold": 10,
      "description": "Description"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "created": 8,
    "failed": 2,
    "errors": [
      {
        "row": 3,
        "errors": ["SKU already exists", "Invalid category"]
      }
    ]
  }
}
```

### 3.5 Export Functionality

**Export Format:**
- Excel (.xlsx) with formatting
- CSV (.csv) for simple import

**Export Includes:**
- All item fields
- Category name (not ID)
- Unit name (not ID)
- Formatted dates
- Formatted numbers

**Implementation:**
```typescript
export const exportItemsToExcel = (items: Item[], filename = 'inventory') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Items');
  
  // Headers
  worksheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'HSN Code', key: 'hsn_code', width: 12 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Purchase Price', key: 'purchase_price', width: 15 },
    { header: 'Selling Price', key: 'selling_price', width: 15 },
    { header: 'GST Rate %', key: 'gst_rate', width: 12 },
    { header: 'Current Stock', key: 'current_stock', width: 15 },
    { header: 'Low Stock Threshold', key: 'low_stock_threshold', width: 20 },
    { header: 'Description', key: 'description', width: 40 }
  ];
  
  // Add rows
  items.forEach(item => {
    worksheet.addRow({
      name: item.name,
      sku: item.sku || '',
      hsn_code: item.hsn_code || '',
      category: item.category?.name || '',
      unit: item.unit?.name || item.unit || '',
      purchase_price: item.purchase_price || 0,
      selling_price: item.selling_price || 0,
      gst_rate: item.tax_rate || 0,
      current_stock: item.current_stock || 0,
      low_stock_threshold: item.low_stock_threshold || 0,
      description: item.description || ''
    });
  });
  
  // Format header row
  worksheet.getRow(1).font = { bold: true };
  
  // Download
  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  });
};
```

### 3.6 Import Template

**Template Features:**
- Pre-filled headers
- Sample data row
- Data validation rules (dropdowns for category/unit)
- Instructions sheet
- Formatting hints

**Template Structure:**
```
Sheet 1: Items (with sample data)
Sheet 2: Instructions
  - How to fill the template
  - Required vs optional fields
  - Category/Unit names reference
  - Validation rules
```

### 3.7 Implementation Steps

1. **Export Functionality**
   - [ ] Install ExcelJS library
   - [ ] Create exportItemsToExcel function
   - [ ] Add export button to inventory list
   - [ ] Test export with sample data

2. **Import Template**
   - [ ] Create Excel template
   - [ ] Add sample data
   - [ ] Add instructions sheet
   - [ ] Add download template button

3. **File Upload Component**
   - [ ] Create file upload component
   - [ ] Support Excel and CSV
   - [ ] Show file validation

4. **File Parsing**
   - [ ] Implement Excel parser (xlsx library)
   - [ ] Implement CSV parser
   - [ ] Handle different formats
   - [ ] Error handling for invalid files

5. **Data Validation**
   - [ ] Validate required fields
   - [ ] Validate data types
   - [ ] Map category/unit names to IDs
   - [ ] Check for duplicate SKUs
   - [ ] Generate error messages

6. **Preview Component**
   - [ ] Create preview table
   - [ ] Show valid/invalid rows
   - [ ] Display error messages
   - [ ] Allow editing before import

7. **Backend Bulk Endpoint**
   - [ ] Create bulk create endpoint
   - [ ] Handle batch processing
   - [ ] Return detailed results
   - [ ] Add transaction support

8. **Import Process**
   - [ ] Send data to backend
   - [ ] Show progress indicator
   - [ ] Display results
   - [ ] Handle errors gracefully

9. **Testing**
   - [ ] Test export functionality
   - [ ] Test template download
   - [ ] Test file upload
   - [ ] Test data validation
   - [ ] Test bulk import
   - [ ] Test error handling

---

## Common Implementation Notes

### Error Handling
- All API calls should have try-catch blocks
- Show user-friendly error messages
- Log errors for debugging
- Handle network errors gracefully

### Loading States
- Show loading spinners during API calls
- Disable buttons during submission
- Show progress for bulk operations

### Validation
- Client-side validation for immediate feedback
- Server-side validation for security
- Show validation errors clearly

### Testing
- Unit tests for utility functions
- Integration tests for API calls
- E2E tests for user flows
- Manual testing checklist

---

## Dependencies

### Frontend Libraries
- `xlsx` or `exceljs` - For Excel parsing/generation
- `react-hook-form` - Form handling (already used)
- `zod` - Validation (already used)
- `@tanstack/react-query` - Data fetching (already used)

### Backend
- All endpoints already exist
- May need to add bulk endpoint for items

---

## Timeline

- **Category Management:** 3-4 days
- **Unit Management:** 3-4 days
- **Bulk Import/Export:** 4-5 days
- **Testing & Polish:** 2 days

**Total:** 10-13 days

---

**Last Updated:** 2025-01-10

