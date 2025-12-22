# 🧪 Quick Manual Testing Checklist

**URL**: http://localhost:3000  
**Estimated Time**: 30-45 minutes  
**Goal**: Validate all critical user flows work correctly

---

## ✅ Pre-Test Setup

- [x] Backend database running (PostgreSQL on port 5433)
- [x] Frontend dev server running (http://localhost:3000)
- [ ] Browser: Chrome/Firefox/Safari (recommended: Chrome)
- [ ] Open browser console (F12) to see OTP codes
- [ ] Have notepad ready to document issues

---

## 🚀 Test Execution

### Test 1: Authentication Flow (5 minutes)

**Steps:**
1. [ ] Open http://localhost:3000
2. [ ] Enter phone: `9876543210`
3. [ ] Click "Send OTP"
4. [ ] Check browser console for OTP (should be 6 digits)
5. [ ] Enter the OTP from console
6. [ ] Click "Verify OTP"

**Expected:**
- ✅ OTP displayed in console
- ✅ Redirect to `/business/select`
- ✅ No errors

**Actual Result:**
```
□ Pass  □ Fail
Notes: ___________________________________
```

---

### Test 2: Business Creation (3 minutes)

**Steps:**
1. [ ] Click "Create New Business"
2. [ ] Fill form:
   - Business Name: `Test Electronics Store`
   - GSTIN: `27AABCU9603R1ZM`
   - PAN: `AABCU9603R`
   - Phone: `9876543210`
   - Email: `test@example.com`
   - Address Line 1: `Shop No 5`
   - City: `Mumbai`
   - State: `Maharashtra`
   - Pincode: `400001`
3. [ ] Click "Create Business"

**Expected:**
- ✅ Redirect to `/dashboard`
- ✅ Business name in header
- ✅ Dashboard shows "Test Electronics Store"

**Actual Result:**
```
□ Pass  □ Fail
Notes: ___________________________________
```

---

### Test 3: Add Customers (5 minutes)

**Steps:**
1. [ ] Click "Parties" card from dashboard
2. [ ] Click "Add Party"
3. [ ] Fill Customer 1:
   - Party Name: `ABC Retailers`
   - Type: `Customer`
   - GSTIN: `27AAAAA0000A1Z5`
   - Phone: `9876543211`
   - Email: `abc@example.com`
   - Billing Address: `123 Main St, Mumbai, Maharashtra, 400001`
   - Credit Period: `30` days
4. [ ] Click "Add Party"
5. [ ] Verify customer appears in list
6. [ ] Add Customer 2:
   - Party Name: `XYZ Traders`
   - Type: `Customer`
   - GSTIN: `29BBBBB0000B1Z5` (Karnataka - different state!)
   - Phone: `9876543212`
   - Email: `xyz@example.com`
   - Billing Address: `456 Park Ave, Bangalore, Karnataka, 560001`
   - Credit Period: `15` days
7. [ ] Click "Add Party"

**Expected:**
- ✅ Both customers visible in list
- ✅ Can search by name
- ✅ Can filter by "Customer" type

**Actual Result:**
```
□ Pass  □ Fail
Notes: ___________________________________
```

---

### Test 4: Add Supplier (3 minutes)

**Steps:**
1. [ ] Click "Add Party"
2. [ ] Fill Supplier:
   - Party Name: `Laptop Distributors`
   - Type: `Supplier`
   - GSTIN: `27CCCCC0000C1Z5`
   - Phone: `9876543213`
   - Email: `supplier@example.com`
   - Billing Address: `789 Supply St, Mumbai, Maharashtra, 400002`
   - Credit Period: `45` days
3. [ ] Click "Add Party"

**Expected:**
- ✅ Supplier appears in list
- ✅ Filter by "Supplier" shows only supplier

**Actual Result:**
```
□ Pass  □ Fail
Notes: ___________________________________
```

---

### Test 5: Add Inventory Items (7 minutes)

**Steps:**
1. [ ] Click "Inventory" from dashboard
2. [ ] Click "Add Item"
3. [ ] Add Item 1:
   - Item Name: `Laptop HP 14`
   - Category: `Electronics`
   - HSN Code: `84713000`
   - Unit: `pcs`
   - Purchase Price: `35000`
   - Sale Price: `42000`
   - GST Rate: `18`
   - Min Stock: `5`
4. [ ] Click "Add Item"
5. [ ] Add Item 2:
   - Item Name: `Mouse Wireless`
   - Category: `Accessories`
   - HSN Code: `84716060`
   - Unit: `pcs`
   - Purchase Price: `250`
   - Sale Price: `350`
   - GST Rate: `18`
   - Min Stock: `10`
6. [ ] Click "Add Item"
7. [ ] Add Item 3:
   - Item Name: `Keyboard Mechanical`
   - Category: `Accessories`
   - HSN Code: `84716060`
   - Unit: `pcs`
   - Purchase Price: `1500`
   - Sale Price: `2000`
   - GST Rate: `18`
   - Min Stock: `8`
8. [ ] Click "Add Item"

**Expected:**
- ✅ All 3 items in list
- ✅ Search works
- ✅ Filter by category works

**Actual Result:**
```
□ Pass  □ Fail
Notes: ___________________________________
```

---

### Test 6: Stock Adjustment (5 minutes)

**Steps:**
1. [ ] Click "Stock Adjustment" button
2. [ ] Select item: `Laptop HP 14`
3. [ ] Choose: `Increase Stock`
4. [ ] Enter quantity: `20`
5. [ ] Enter reason: `Initial stock purchase`
6. [ ] Click "Adjust Stock"
7. [ ] Go back to Inventory list
8. [ ] Verify "Laptop HP 14" shows current stock: `20 pcs`
9. [ ] Repeat for Mouse: Add `50 pcs`
10. [ ] Repeat for Keyboard: Add `30 pcs`

**Expected:**
- ✅ Stock adjustments successful
- ✅ Current stock displayed correctly
- ✅ No low stock warnings (stock > min)

**Actual Result:**
```
□ Pass  □ Fail
Notes: ___________________________________
```

---

### Test 7: Create Sale Invoice - Intra-State (10 minutes)

**Steps:**
1. [ ] Navigate to Invoices
2. [ ] Click "Create Invoice"
3. [ ] Select Type: `Sale`
4. [ ] Select Party: `ABC Retailers` (Maharashtra - same state)
5. [ ] Invoice Date: Today's date
6. [ ] Due Date: 30 days from today
7. [ ] Click "Add Item" (first row)
8. [ ] Select Item: `Laptop HP 14`
9. [ ] Verify rate auto-filled: `42000`
10. [ ] Enter Quantity: `2`
11. [ ] Enter Discount: `5` (percent)
12. [ ] Click "Add Item" (add second row)
13. [ ] Select Item: `Mouse Wireless`
14. [ ] Quantity: `5`
15. [ ] Discount: `0`
16. [ ] Verify calculations:
    - **IMPORTANT**: Check if CGST + SGST shown (intra-state)
    - Subtotal should include discounts
    - Tax should be split (9% CGST + 9% SGST = 18%)
17. [ ] Add Notes: `Thank you for your business`
18. [ ] Click "Create Invoice"

**Expected:**
- ✅ Invoice created successfully
- ✅ **CGST + SGST shown** (not IGST)
- ✅ Calculations accurate
- ✅ Invoice appears in list
- ✅ Status: "Pending"

**Actual Result:**
```
□ Pass  □ Fail
CGST shown: □ Yes  □ No
SGST shown: □ Yes  □ No
IGST shown: □ Yes  □ No (should be No)

Notes: ___________________________________
```

---

### Test 8: Create Sale Invoice - Inter-State (10 minutes)

**Steps:**
1. [ ] Click "Create Invoice"
2. [ ] Select Type: `Sale`
3. [ ] Select Party: `XYZ Traders` (Karnataka - different state!)
4. [ ] Invoice Date: Today
5. [ ] Due Date: 15 days from today
6. [ ] Add Item: `Keyboard Mechanical`
7. [ ] Quantity: `3`
8. [ ] Discount: `10`
9. [ ] Verify calculations:
    - **IMPORTANT**: Check if IGST shown (inter-state)
    - Should show IGST 18% (not CGST+SGST)
10. [ ] Click "Create Invoice"

**Expected:**
- ✅ Invoice created successfully
- ✅ **IGST shown** (not CGST+SGST)
- ✅ Calculations accurate
- ✅ Invoice in list

**Actual Result:**
```
□ Pass  □ Fail
IGST shown: □ Yes  □ No (should be Yes)
CGST shown: □ Yes  □ No (should be No)
SGST shown: □ Yes  □ No (should be No)

Notes: ___________________________________
```

---

### Test 9: Record Payment (5 minutes)

**Steps:**
1. [ ] Navigate to Payments
2. [ ] Click "Record Payment"
3. [ ] Select Invoice: First invoice (ABC Retailers)
4. [ ] Verify Outstanding shown correctly
5. [ ] Enter Amount: Enter partial amount (e.g., 50000)
6. [ ] Payment Mode: `UPI`
7. [ ] Reference: `UPI123456789`
8. [ ] Payment Date: Today
9. [ ] Notes: `Partial payment received`
10. [ ] Click "Record Payment"

**Expected:**
- ✅ Payment recorded
- ✅ Payment appears in list
- ✅ Outstanding reduced
- ✅ Invoice still "Pending" (partial payment)

**Actual Result:**
```
□ Pass  □ Fail
Notes: ___________________________________
```

---

### Test 10: Reports Verification (7 minutes)

**Steps:**
1. [ ] Navigate to Reports
2. [ ] Check "Business Overview":
   - [ ] Total Sales > 0
   - [ ] Outstanding Receivables > 0
   - [ ] Total Parties = 3
   - [ ] Total Items = 3
3. [ ] Click "Sales Report":
   - [ ] Both invoices listed
   - [ ] Amounts match
4. [ ] Click "Party Ledger":
   - [ ] ABC Retailers shows balance
   - [ ] XYZ Traders shows balance
5. [ ] Click "Stock Report":
   - [ ] All items with correct stock
6. [ ] Click "GST Report":
   - [ ] Tax amounts shown
7. [ ] Test date filters:
   - [ ] Click "Last 7 Days"
   - [ ] Click "This Month"

**Expected:**
- ✅ All reports load
- ✅ Data accurate
- ✅ Date filters work
- ✅ Numbers match dashboard

**Actual Result:**
```
□ Pass  □ Fail
Notes: ___________________________________
```

---

### Test 11: Dashboard Statistics (3 minutes)

**Steps:**
1. [ ] Navigate to Dashboard
2. [ ] Verify statistics:
   - [ ] Total Sales shows amount (should match invoices)
   - [ ] Outstanding shows amount (total - payments)
   - [ ] Total Parties = 3
   - [ ] Low Stock Items = 0 (we added stock above min)
   - [ ] Total Items = 3
   - [ ] Total Invoices = 2
   - [ ] Payments Received shows amount

**Expected:**
- ✅ All numbers match actual data
- ✅ No placeholder values (like ₹0)
- ✅ Calculations correct

**Actual Result:**
```
□ Pass  □ Fail
Notes: ___________________________________
```

---

## 📊 Test Summary

### Results
```
Total Tests: 11
Passed: _____ / 11
Failed: _____ / 11
Pass Rate: _____%
```

### Critical Issues Found
```
1. ________________________________
2. ________________________________
3. ________________________________
```

### Minor Issues Found
```
1. ________________________________
2. ________________________________
3. ________________________________
```

### Suggestions/Improvements
```
1. ________________________________
2. ________________________________
3. ________________________________
```

---

## ✅ Pass Criteria

**Minimum to proceed to Beta:**
- [ ] 10/11 tests passing (90%+)
- [ ] No P0 (critical) bugs
- [ ] GST calculations accurate (inter/intra state)
- [ ] Complete user flow works end-to-end
- [ ] Dashboard shows real data
- [ ] No data loss or corruption

---

## 🎯 Next Steps Based on Results

### If 11/11 Pass ✅
- **Status**: READY FOR BETA
- **Action**: Proceed to staging deployment
- **Timeline**: Deploy tomorrow

### If 10/11 Pass ✅
- **Status**: MINOR FIXES NEEDED
- **Action**: Fix minor issues, retest
- **Timeline**: Deploy in 2 days

### If 8-9/11 Pass ⚠️
- **Status**: FIXES REQUIRED
- **Action**: Fix issues, comprehensive retest
- **Timeline**: Deploy in 3-4 days

### If < 8/11 Pass ❌
- **Status**: MAJOR ISSUES
- **Action**: Debug and fix critical bugs
- **Timeline**: 1 week before beta

---

**Testing Completed On**: _______________  
**Tester Name**: _______________  
**Overall Status**: ⬜ PASS  ⬜ FAIL  ⬜ NEEDS WORK
