# PDF Requirements - Features Added to PRD

## Overview

This document summarizes all features added to the PRD based on the "Designing a 100% India-Compliant Accounting, Billing, Inventory & GST App" PDF document.

## New Modules Added (Modules 21-30)

### Module 21: Manufacturing & Production

**Source:** PDF Section on Manufacturers and Production Requirements

**Features Added:**
1. **Bill of Materials (BOM)**
   - Define BOM for finished goods
   - Link raw materials to finished goods
   - Support wastage percentage
   - Support alternate BOMs
   - Calculate BOM cost

2. **Production Vouchers**
   - Record production
   - Consume raw materials
   - Create finished goods
   - Handle by-products
   - Handle scrap
   - Calculate COGS

3. **Inventory Valuation Methods**
   - Weighted Average Cost
   - FIFO (First In First Out)
   - LIFO (Last In First Out)
   - Standard Cost
   - Method selection per item

### Module 22: Warehouse Management

**Source:** PDF Section on Multi-Warehouse Requirements

**Features Added:**
1. **Multi-Warehouse Support**
   - Create multiple warehouses
   - Separate GSTIN per warehouse (if different)
   - Warehouse-wise stock tracking
   - Default warehouse selection

2. **Inter-Warehouse Transfers**
   - Transfer stock between warehouses
   - Track transfer status
   - Link to delivery challan
   - Warehouse-wise reports

### Module 23: Import/Export Management

**Source:** PDF Section on Traders/Importers

**Features Added:**
1. **Import Management**
   - IEC (Import Export Code) number tracking
   - Bill of Entry tracking
   - Basic Customs Duty
   - IGST on import
   - Landed cost calculation
   - Import duty as cost element

2. **Export Management**
   - Shipping Bill Number
   - Export date tracking
   - FOB value
   - PERMIT number
   - Zero-rated invoices
   - LUT (Letter of Undertaking) support
   - Export incentives tracking

### Module 24: Advance Receipts & Payments

**Source:** PDF Section on "Pitfalls and Often-Missed Rules" - Tax on Advances

**Features Added:**
1. **Advance Receipts with Tax**
   - Record advance receipts
   - Calculate tax on advance (CGST Act Sec 13)
   - Post tax liability before supply
   - Link advance to invoice
   - Adjust tax on invoice creation

2. **Advance Payments**
   - Track advance payments
   - Link to purchase invoices
   - Claim ITC on invoice (not advance)

### Module 25: Goods Received Notes (GRN)

**Source:** PDF Section on Inventory Management - GRN

**Features Added:**
1. **GRN Creation**
   - Generate GRN number
   - Record goods received
   - Quality check workflow
   - Link to purchase invoices
   - Support partial receipt
   - GRN PDF generation

### Module 26: E-Commerce TCS (GSTR-8)

**Source:** PDF Section on E-Commerce and GSTR-8

**Features Added:**
1. **E-Commerce TCS Collection**
   - Identify e-commerce operators
   - Calculate 1% TCS on transactions
   - Collect TCS from sellers
   - Generate TCS certificates

2. **GSTR-8 Generation**
   - Aggregate TCS per seller
   - Format as per GSTR-8 schema
   - Generate JSON and Excel

### Module 27: Budgeting & Financial Planning

**Source:** PDF Section on Advanced Features (Budgeting)

**Features Added:**
1. **Budget Creation**
   - Create budgets by financial year
   - Budget types (income, expense, sales, purchase)
   - Period-wise budgets (monthly/quarterly/yearly)
   - Budget vs Actual reports
   - Variance analysis

### Module 28: Depreciation Management

**Source:** PDF Section on Advanced Features (Depreciation)

**Features Added:**
1. **Asset Depreciation**
   - Fixed asset tracking
   - Depreciation methods (WDV, SLM)
   - Depreciation rate (as per Income Tax Act)
   - Annual and monthly depreciation
   - Accumulated depreciation
   - Book value calculation
   - Asset disposal
   - Depreciation journal entries

### Module 29: Often-Missed Compliance Rules

**Source:** PDF Section "7. Pitfalls and Often-Missed Rules"

**Features Added:**
1. **ITC Time Limit Validation**
   - 6-month rule enforcement
   - Warning for stale invoices
   - Block ITC if > 6 months
   - Supplier GSTR-1 filing check
   - ITC eligibility report

2. **Tax Rounding Rules**
   - Round each component separately
   - Round to nearest rupee (≥0.50 up, <0.50 down)
   - Round invoice total
   - Add round-off line item
   - Handle multiple tax rates

3. **GSTR-3B vs GSTR-1 Timing**
   - Track filing dates
   - Identify differences
   - Provisional ITC claims
   - Reconciliation report

4. **Composition Scheme Limit Monitoring**
   - Track annual turnover
   - Warn at 80%/90% of limit
   - Block if limit crossed
   - Prompt to switch schemes
   - Disable inter-state sales

5. **Reverse Charge on Credit Notes**
   - Identify RCM credit notes
   - Reverse RCM liability
   - Adjust ITC
   - Update GSTR-3B

### Module 30: SME Business Type Specific Features

**Source:** PDF Section "1. SME Business Types & Requirements"

**Features Added:**
1. **POS Mode for Retailers**
   - Simplified invoice screen
   - Barcode scanning
   - Quick payment options
   - Thermal printer support
   - Daily sales summary

2. **B2B Quotation-Order Workflow for Wholesalers**
   - Quotation to Order conversion
   - Order status tracking
   - Order to Invoice conversion
   - Partial delivery support

3. **Service Provider Workflows**
   - SAC codes (not HSN)
   - Time-based billing
   - Project-based billing
   - Recurring service invoices
   - Service completion certificates

4. **Pharmacy-Specific Features**
   - Drug license number tracking
   - Drug license on invoices (mandatory)
   - Schedule H/X drug tracking
   - RCM for scheduled drugs
   - Prescription tracking (optional)

5. **Alternate Units of Measure (UOM)**
   - Base unit definition
   - Alternate units (Dozen, Box, etc.)
   - Conversion factors
   - Purchase in one unit, sale in another
   - Auto-conversion
   - Stock in multiple units

## Critical Compliance Rules Added

### From PDF Section "7. Pitfalls and Often-Missed Rules"

1. ✅ **ITC Time Limits**: 6 months from invoice date
2. ✅ **Tax on Advances**: CGST Act Sec 13 - tax due on advance receipt
3. ✅ **Tax Rounding**: Each component rounded separately
4. ✅ **GSTR Timing**: Handle GSTR-1 vs GSTR-3B differences
5. ✅ **Composition Limits**: Monitor turnover, warn at thresholds
6. ✅ **RCM on Credit Notes**: Reverse RCM liability
7. ✅ **State/VAT Carryovers**: Support pre-GST balances
8. ✅ **HSN Digits**: 4-digit for ≤₹5Cr, 6-digit for >₹5Cr

## Inventory Types - Complete Coverage

### All Types from PDF Now Covered:

1. ✅ **Raw Materials** - For manufacturers
2. ✅ **Work in Progress (WIP)** - Production stages
3. ✅ **Finished Goods** - Completed products
4. ✅ **Trading Goods** - For resale
5. ✅ **Consumables** - Office supplies
6. ✅ **Services** - SAC codes
7. ✅ **Serial Number Items** - High-value tracking
8. ✅ **Batch/Lot Items** - Expiry tracking
9. ✅ **By-products** - Manufacturing output
10. ✅ **Scrap** - Waste with value

## Phased Development Approach

### From PDF Section "2. Phased Development Roadmap"

The PRD now includes implementation notes for phased development:

**Phase 1 - Core Accounting & Billing (MVP)**
- Master data, invoices, payments, ledgers
- Basic reporting

**Phase 2 - Inventory Management & Pricing**
- Stock tracking, valuation, batch/serial
- Multi-warehouse

**Phase 3 - Basic GST Compliance**
- GST calculations, HSN/SAC
- GSTR-1, GSTR-3B
- ITC tracking

**Phase 4 - Advanced Features**
- E-Invoice, E-Way Bill
- Manufacturing, Import/Export
- Advanced reports

## Competitor Analysis Insights Incorporated

### From PDF Section "8. Competitor Comparison"

Features inspired by competitors:

1. **From Zoho Books:**
   - Automatic HSN/GSTIN validation
   - Pre-validation to prevent GST errors
   - Direct IRP integration capability

2. **From Busy Accounting:**
   - Auto-download GSTR-2A/2B
   - Multi-warehouse support
   - Manufacturing features (BOM, Production)
   - Columnar reports capability

3. **From myBillBook:**
   - Mobile-first design
   - Quick invoice creation
   - Barcode scanning
   - Multi-device support

4. **From Competitors:**
   - Offline-first architecture
   - Ease of use
   - SMS/WhatsApp sharing

## Summary

**Total Modules:** 30 (was 20, added 10 new modules)

**New Features Added:**
- Manufacturing & Production (BOM, Production Vouchers, Valuation)
- Warehouse Management (Multi-warehouse, Transfers)
- Import/Export (IEC, Duties, Zero-rated)
- Advance Receipts/Payments (with tax)
- GRN (Goods Received Notes)
- E-Commerce TCS (GSTR-8)
- Budgeting & Depreciation
- Often-Missed Compliance Rules
- SME Business Type Specific Features
- Alternate UOM

**Compliance Coverage:**
- ✅ All GST Returns (GSTR-1, 3B, 4, 8, 9, 9C)
- ✅ All GST Features (E-Invoice, E-Way Bill, RCM, Composition, ITC)
- ✅ All Tax Features (TDS, TCS)
- ✅ All Accounting Books
- ✅ All Invoice Types
- ✅ All Inventory Types
- ✅ All Compliance Rules

**Result:** 100% coverage of all requirements from the PDF document.

---

**Last Updated:** 2025-12-20  
**Source:** "Designing a 100% India-Compliant Accounting, Billing, Inventory & GST App.pdf"

