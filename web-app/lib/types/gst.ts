/**
 * GST Types
 * 
 * TypeScript types matching backend GST DTOs exactly.
 * These types ensure type safety and prevent field mapping errors.
 * 
 * IMPORTANT: These types match the backend DTOs in app/apps/gst-service/src/dto/
 */

// ============================================================================
// GSTR-1 TYPES
// ============================================================================

export interface Gstr1B2BItem {
  rate: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
}

export interface Gstr1B2BInvoice {
  invoice_number: string;
  invoice_date: string;
  invoice_value: number;
  place_of_supply: string;
  items: Gstr1B2BItem[];
}

export interface Gstr1B2BCustomer {
  customer_gstin: string;
  customer_name?: string;
  invoices: Gstr1B2BInvoice[];
}

export interface Gstr1B2CSmallSummary {
  place_of_supply: string;
  rate: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
}

export interface Gstr1B2CLargeInvoice {
  invoice_number: string;
  invoice_date: string;
  invoice_value: number;
  place_of_supply: string;
  customer_name?: string;
  customer_address?: string;
  items: Gstr1B2BItem[];
}

export interface Gstr1Cdnr {
  original_invoice_number: string;
  original_invoice_date: string;
  note_type: 'credit' | 'debit';
  note_number: string;
  note_date: string;
  reason_code: string;
  note_value: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
}

export interface Gstr1ExportInvoice {
  invoice_number: string;
  invoice_date: string;
  invoice_value: number;
  port_code?: string;
  shipping_bill_number?: string;
  shipping_bill_date?: string;
  items: Gstr1B2BItem[];
}

export interface Gstr1AdvanceReceipt {
  receipt_number: string;
  receipt_date: string;
  advance_amount: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
}

export interface Gstr1TaxPaidOnAdvance {
  original_receipt_number: string;
  original_receipt_date: string;
  invoice_number: string;
  invoice_date: string;
  tax_adjustment: number;
}

export interface Gstr1NilSummary {
  nil_rated: number;
  exempted: number;
  non_gst: number;
}

export interface Gstr1HsnSummary {
  hsn_code: string;
  description: string;
  uqc: string;
  quantity: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
}

export interface Gstr1Response {
  gstin: string;
  return_period: string;
  b2b: Gstr1B2BCustomer[];
  b2c_small: Gstr1B2CSmallSummary[];
  b2c_large?: Gstr1B2CLargeInvoice[];
  cdnr?: Gstr1Cdnr[];
  export?: Gstr1ExportInvoice[];
  advance_receipts?: Gstr1AdvanceReceipt[];
  tax_paid_on_advance?: Gstr1TaxPaidOnAdvance[];
  nil?: Gstr1NilSummary;
  hsn_summary: Gstr1HsnSummary[];
}

export interface Gstr1Request {
  period: string; // MMYYYY or Q1-YYYY
  format?: 'json' | 'excel';
}

// ============================================================================
// GSTR-3B TYPES
// ============================================================================

export interface Gstr3bOutputTaxByRate {
  rate: number;
  taxable_value: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

export interface Gstr3bOutputTax {
  total_taxable_value: number;
  total_igst: number;
  total_cgst: number;
  total_sgst: number;
  total_cess: number;
  by_rate: Gstr3bOutputTaxByRate[];
}

export interface Gstr3bItcByRate {
  rate: number;
  taxable_value: number;
  igst_itc: number;
  cgst_itc: number;
  sgst_itc: number;
  cess_itc: number;
}

export interface Gstr3bItc {
  total_eligible_itc: number;
  total_ineligible_itc: number;
  igst_itc: number;
  cgst_itc: number;
  sgst_itc: number;
  cess_itc: number;
  by_rate: Gstr3bItcByRate[];
  itc_reversal: number;
  net_itc_available: number;
}

export interface Gstr3bRcm {
  rcm_taxable_value: number;
  rcm_igst: number;
  rcm_cgst: number;
  rcm_sgst: number;
  rcm_cess: number;
  rcm_itc_igst: number;
  rcm_itc_cgst: number;
  rcm_itc_sgst: number;
  rcm_itc_cess: number;
  rcm_payable: number;
}

export interface Gstr3bPayment {
  payment_date: string;
  payment_mode: string;
  challan_number?: string;
  igst_paid: number;
  cgst_paid: number;
  sgst_paid: number;
  cess_paid: number;
  interest_paid: number;
  late_fee_paid: number;
  penalty_paid: number;
  other_paid: number;
  total_paid: number;
}

export interface Gstr3bResponse {
  gstin: string;
  return_period: string;
  output_tax: Gstr3bOutputTax;
  itc: Gstr3bItc;
  rcm: Gstr3bRcm;
  net_tax_payable: number;
  interest: number;
  late_fee: number;
  payments?: Gstr3bPayment[];
}

export interface Gstr3bRequest {
  period: string; // MMYYYY or Q1-YYYY
  format?: 'json' | 'excel';
}

// ============================================================================
// GSTR-4 TYPES
// ============================================================================

export interface Gstr4B2BInvoice {
  invoice_number: string;
  invoice_date: string;
  customer_gstin: string;
  customer_name?: string;
  invoice_value: number;
  place_of_supply: string;
}

export interface Gstr4B2CInvoice {
  invoice_number: string;
  invoice_date: string;
  customer_name?: string;
  invoice_value: number;
  place_of_supply: string;
}

export interface Gstr4Response {
  gstin: string;
  return_period: string;
  composition_rate: number;
  total_turnover: number;
  b2b: Gstr4B2BInvoice[];
  b2c: Gstr4B2CInvoice[];
  composition_tax_payable: number;
  interest: number;
  late_fee: number;
  payments?: any[];
}

export interface Gstr4Request {
  period: string; // Q1-YYYY (quarterly only)
  format?: 'json' | 'excel';
}

// ============================================================================
// E-INVOICE TYPES
// ============================================================================

export interface GenerateIRNRequest {
  invoice_id: string;
}

export interface GenerateIRNResponse {
  irn: string;
  irn_date: string;
  qr_code: string;
  ack_no?: string;
  ack_date?: string;
}

export interface IRNStatusResponse {
  irn: string;
  status: 'generated' | 'cancelled' | 'pending';
  irn_date?: string;
  cancel_date?: string;
  cancel_reason?: string;
}

export interface CancelIRNRequest {
  invoice_id: string;
  cancel_reason: string;
}

export interface CancelIRNResponse {
  irn: string;
  cancel_date: string;
  cancel_reason: string;
}

// ============================================================================
// E-WAY BILL TYPES
// ============================================================================

export interface GenerateEWayBillRequest {
  invoice_id: string;
}

export interface GenerateEWayBillResponse {
  eway_bill_number: string;
  eway_bill_date: string;
  validity_date: string;
  status: string;
}

export interface EWayBillStatusResponse {
  eway_bill_number: string;
  status: 'generated' | 'cancelled' | 'updated' | 'pending';
  eway_bill_date?: string;
  validity_date?: string;
  cancel_date?: string;
  cancel_reason?: string;
}

export interface CancelEWayBillRequest {
  invoice_id: string;
  cancel_reason: string;
}

export interface CancelEWayBillResponse {
  eway_bill_number: string;
  cancel_date: string;
  cancel_reason: string;
}

export interface UpdateEWayBillRequest {
  invoice_id: string;
  update_reason: string;
}

export interface UpdateEWayBillResponse {
  eway_bill_number: string;
  updated_date: string;
  update_reason: string;
}

// ============================================================================
// GSTR-2A RECONCILIATION TYPES
// ============================================================================

export interface Gstr2aImportRequest {
  period: string; // MMYYYY
  import_type: 'gstr2a' | 'gstr2b';
  data: any; // GSTR-2A/2B JSON
}

export interface Gstr2aImportResponse {
  id: string;
  business_id: string;
  period: string;
  import_type: string;
  total_invoices: number;
  matched_invoices: number;
  missing_invoices: number;
  mismatched_invoices: number;
  imported_at: string;
}

export interface Gstr2aReconciliationInvoice {
  invoice_id?: string;
  supplier_invoice_number: string;
  supplier_invoice_date: string;
  supplier_gstin: string;
  supplier_name?: string;
  taxable_value: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  match_status: 'matched' | 'missing' | 'extra' | 'mismatched';
  match_details?: any;
}

export interface Gstr2aReconciliationResponse {
  gstin: string;
  period: string;
  import_type: string;
  total_gstr2a_invoices: number;
  total_purchase_invoices: number;
  matched_count: number;
  missing_count: number;
  extra_count: number;
  mismatched_count: number;
  matched: Gstr2aReconciliationInvoice[];
  missing: Gstr2aReconciliationInvoice[];
  extra: Gstr2aReconciliationInvoice[];
  mismatched: Gstr2aReconciliationInvoice[];
}

export interface ManualMatchRequest {
  reconciliation_id: string;
  invoice_id: string;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  message: string;
  field?: string;
}

export interface ValidationWarning {
  message: string;
  field?: string;
}

export interface HsnValidationResponse {
  isValid: boolean;
  code: string;
  length?: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface SacValidationResponse {
  isValid: boolean;
  code: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidateHsnRequest {
  hsn_code: string;
}

export interface ValidateSacRequest {
  sac_code: string;
}

// ============================================================================
// BUSINESS GST SETTINGS TYPES
// ============================================================================

export interface BusinessGstSettingsRequest {
  gst_type?: 'regular' | 'composition';
  annual_turnover?: number;
  filing_frequency?: 'monthly' | 'quarterly';
  gsp_provider?: string;
  gsp_credentials?: string;
  einvoice_enabled?: boolean;
  ewaybill_enabled?: boolean;
}

export interface BusinessGstSettingsResponse {
  id: string;
  business_id: string;
  gst_type: string;
  annual_turnover?: number;
  filing_frequency: string;
  gsp_provider?: string;
  einvoice_enabled: boolean;
  ewaybill_enabled: boolean;
  created_at: string;
  updated_at: string;
}

