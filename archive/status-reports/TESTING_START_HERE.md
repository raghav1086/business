# 🎯 Quick Start: Manual Testing Guide

**Date**: December 22, 2025  
**Goal**: Test the MVP frontend and complete user flows

---

## 🚀 Option 1: Test Frontend UI (Recommended for Now)

Since backend services need proper configuration, let's focus on **frontend UI testing** first:

### What You Can Test Without Backend:

1. **UI/UX Review** ✅
   - Navigate through all pages
   - Check responsive design
   - Verify forms render correctly
   - Test navigation
   - Check styling and layout

2. **Form Validation** ✅
   - Try submitting empty forms
   - Enter invalid data
   - Check error messages
   - Verify field validations

3. **Component Functionality** ✅
   - Buttons clickable
   - Dropdowns work
   - Date pickers functional
   - Search boxes work
   - Filters operate

### Steps:

```bash
# Frontend is already running at:
open http://localhost:3000

# Test these pages:
1. http://localhost:3000/login
2. http://localhost:3000/business/select
3. http://localhost:3000/dashboard
4. http://localhost:3000/parties
5. http://localhost:3000/inventory
6. http://localhost:3000/inventory/stock
7. http://localhost:3000/invoices
8. http://localhost:3000/invoices/create
9. http://localhost:3000/payments
10. http://localhost:3000/reports
```

---

## 🛠️ Option 2: Start Backend Services Properly

### Method A: Use Docker Compose (Easiest)

```bash
cd /Users/ashishnimrot/Project/business/app

# Start database
docker-compose up -d

# Wait for database to be ready (30 seconds)
sleep 30

# Start each service individually in separate terminals:

# Terminal 1: Auth Service
npx nx serve auth-service

# Terminal 2: Business Service  
npx nx serve business-service

# Terminal 3: Party Service
npx nx serve party-service

# Terminal 4: Inventory Service
npx nx serve inventory-service

# Terminal 5: Invoice Service
npx nx serve invoice-service

# Terminal 6: Payment Service
npx nx serve payment-service
```

### Method B: Check NX Configuration

```bash
cd /Users/ashishnimrot/Project/business/app

# Verify NX workspace
cat nx.json

# Check if services are configured
npx nx show projects

# Try building first
npx nx build auth-service
```

---

## ✅ What We Know Works (From Tests)

### Backend (200/200 tests passing) ✅
- All unit tests pass
- All integration tests pass
- Database connections work
- API endpoints respond
- GST calculations accurate
- Data validation works

### Frontend (Build successful) ✅
- All routes compile
- TypeScript errors: 0
- All components present
- Forms implemented
- API client configured

---

## 🎯 Recommended Testing Approach

### Phase 1: UI Testing (No Backend Needed) - 30 minutes

**Test the frontend interface:**

1. **Navigation Test**
   - [ ] Visit each route
   - [ ] Click all navigation links
   - [ ] Check breadcrumbs
   - [ ] Test back buttons

2. **Form UI Test**
   - [ ] All forms render
   - [ ] All fields visible
   - [ ] Labels correct
   - [ ] Buttons present
   - [ ] Validation messages show

3. **Responsive Test**
   - [ ] Resize browser window
   - [ ] Test on mobile size
   - [ ] Check tablet size
   - [ ] Verify desktop layout

4. **Invoice Form (Critical)**
   - [ ] Open /invoices/create
   - [ ] Check all fields present
   - [ ] Test "Add Item" button
   - [ ] Test "Remove Item" button
   - [ ] Check calculations display
   - [ ] Verify GST rate dropdown

### Phase 2: Backend Setup - 15 minutes

**Get services running:**

1. Verify database:
   ```bash
   docker ps | grep postgres
   ```

2. Check NX configuration:
   ```bash
   cd /Users/ashishnimrot/Project/business/app
   ls -la apps/
   ```

3. Test one service:
   ```bash
   npx nx serve auth-service --verbose
   ```

4. Check for errors in output

### Phase 3: End-to-End Testing - 45 minutes

**Once backend is running:**

1. Complete authentication flow
2. Create business
3. Add parties
4. Add items
5. Create invoices
6. Record payments
7. Check reports

---

## 📋 UI Testing Checklist (Start Here)

### Login Page (/login)
```
□ Page loads
□ Phone input visible
□ "Send OTP" button present
□ OTP input visible
□ "Verify OTP" button present
□ Form validation works
□ Error messages styled
□ Responsive layout
```

### Business Selection (/business/select)
```
□ Page loads
□ "Create Business" button visible
□ Form fields present:
  □ Business Name
  □ GSTIN
  □ PAN
  □ Phone
  □ Email
  □ Address fields
□ Validation indicators
□ Submit button
```

### Dashboard (/dashboard)
```
□ Page loads
□ Module cards visible (6 cards)
□ Statistics section present
□ Navigation works
□ Header with business name area
□ Logout button
□ Switch business button
```

### Parties Page (/parties)
```
□ Page loads
□ "Add Party" button visible
□ Search box present
□ Filter dropdown visible
□ Table/List area
□ Empty state message (if no data)
```

### Inventory Page (/inventory)
```
□ Page loads
□ "Add Item" button visible
□ "Stock Adjustment" button visible
□ Search functionality
□ Category filter
□ Low stock toggle
□ Item list/grid area
```

### Invoice Create (/invoices/create)
```
□ Page loads
□ Invoice type dropdown (Sale/Purchase)
□ Party selection dropdown
□ Date pickers (invoice date, due date)
□ Item selection area
□ "Add Item" button
□ Quantity input
□ Rate input (auto-populated)
□ Discount input
□ Subtotal display
□ GST rate selection
□ Tax amount display (CGST/SGST/IGST)
□ Total amount display
□ Notes textarea
□ "Create Invoice" button
□ Form validation
□ Calculations visible
```

### Payments Page (/payments)
```
□ Page loads
□ "Record Payment" button visible
□ Payment list area
□ Search functionality
□ Dialog/Modal for recording
□ Invoice selection dropdown
□ Amount input
□ Payment mode dropdown
□ Reference input
□ Date picker
□ Outstanding amount display
```

### Reports Page (/reports)
```
□ Page loads
□ Report type cards visible (6 types)
□ Date range picker
□ Quick filter buttons (7 days, 30 days, This month)
□ Business Overview section
□ Sales Report section
□ Purchase Report section
□ Party Ledger section
□ Stock Report section
□ GST Report section
□ Export button (placeholder)
```

---

## 🎊 Success Criteria

### Minimum for Beta (UI Only):
- [ ] All pages accessible
- [ ] All forms render correctly
- [ ] Navigation works
- [ ] No broken layouts
- [ ] Mobile responsive
- [ ] No TypeScript errors in console

### Ideal for Beta (With Backend):
- [ ] Complete authentication flow
- [ ] Can create invoices
- [ ] GST calculations work
- [ ] Reports show data
- [ ] No critical bugs

---

## 📞 Next Steps

### Right Now:
1. **Open the app**: http://localhost:3000
2. **Follow UI Testing Checklist above**
3. **Check each page loads**
4. **Test responsiveness**
5. **Document any UI issues**

### After UI Testing:
1. **Fix backend service startup issues**
2. **Get all 6 services running**
3. **Run end-to-end tests**
4. **Complete QUICK_MANUAL_TEST.md**

---

## 📊 Current Status

```
✅ Database: Running (PostgreSQL)
✅ Frontend: Running (http://localhost:3000)
⚠️ Backend Services: Need configuration check
✅ Tests: 200/200 passing (automated)
⚠️ Manual Testing: Ready to start (UI first)
```

---

## 🚀 Quick Command Reference

```bash
# Check frontend
open http://localhost:3000

# Check database
docker ps | grep postgres

# Check services
cd /Users/ashishnimrot/Project/business/app
npx nx show projects

# View frontend console
# Press F12 in browser, check Console tab
```

---

**Recommendation**: Start with **UI Testing** (Phase 1) right now since frontend is already running. This will validate the user interface while we figure out the backend service startup.

**Time Required**: 30 minutes for comprehensive UI testing

**Start Here**: Open http://localhost:3000 and follow the "UI Testing Checklist" above!
