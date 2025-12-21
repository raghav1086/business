/**
 * GST Calculation Service
 * 
 * Handles GST calculations for invoices.
 * Supports CGST/SGST (intrastate) and IGST (interstate).
 */

export interface GstCalculationInput {
  amount: number;
  taxRate: number;
  isInterstate: boolean;
  isTaxInclusive?: boolean;
  cessRate?: number;
}

export interface GstCalculationResult {
  taxableAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalAmount: number;
}

export class GstCalculationService {
  /**
   * Calculate GST for an amount
   */
  static calculateGst(input: GstCalculationInput): GstCalculationResult {
    const {
      amount,
      taxRate,
      isInterstate,
      isTaxInclusive = false,
      cessRate = 0,
    } = input;

    let taxableAmount: number;
    let taxAmount: number;

    if (isTaxInclusive) {
      // Tax is included in the amount
      // taxableAmount = amount / (1 + taxRate/100)
      taxableAmount = amount / (1 + taxRate / 100);
      taxAmount = amount - taxableAmount;
    } else {
      // Tax is exclusive
      taxableAmount = amount;
      taxAmount = (taxableAmount * taxRate) / 100;
    }

    // Calculate CGST/SGST or IGST
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterstate) {
      // Interstate: IGST = full tax rate
      igstAmount = taxAmount;
    } else {
      // Intrastate: CGST = SGST = tax rate / 2
      cgstAmount = taxAmount / 2;
      sgstAmount = taxAmount / 2;
    }

    // Calculate CESS
    const cessAmount = cessRate > 0 ? (taxableAmount * cessRate) / 100 : 0;

    // Calculate total
    const totalAmount = taxableAmount + taxAmount + cessAmount;

    return {
      taxableAmount: this.roundToTwoDecimals(taxableAmount),
      cgstRate: isInterstate ? 0 : taxRate / 2,
      sgstRate: isInterstate ? 0 : taxRate / 2,
      igstRate: isInterstate ? taxRate : 0,
      cgstAmount: this.roundToTwoDecimals(cgstAmount),
      sgstAmount: this.roundToTwoDecimals(sgstAmount),
      igstAmount: this.roundToTwoDecimals(igstAmount),
      cessAmount: this.roundToTwoDecimals(cessAmount),
      totalAmount: this.roundToTwoDecimals(totalAmount),
    };
  }

  /**
   * Calculate GST for invoice item
   */
  static calculateItemGst(
    quantity: number,
    unitPrice: number,
    discountPercent: number,
    taxRate: number,
    isInterstate: boolean,
    isTaxInclusive: boolean = false,
    cessRate: number = 0
  ): GstCalculationResult {
    // Calculate base amount
    const baseAmount = quantity * unitPrice;

    // Apply discount
    const discountAmount = (baseAmount * discountPercent) / 100;
    const amountAfterDiscount = baseAmount - discountAmount;

    // Calculate GST
    return this.calculateGst({
      amount: amountAfterDiscount,
      taxRate,
      isInterstate,
      isTaxInclusive,
      cessRate,
    });
  }

  /**
   * Round to 2 decimal places
   */
  private static roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Calculate invoice totals from items
   */
  static calculateInvoiceTotals(
    items: Array<{
      quantity: number;
      unitPrice: number;
      discountPercent: number;
      taxRate: number;
      cessRate?: number;
    }>,
    isInterstate: boolean,
    isTaxInclusive: boolean = false
  ): {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    cessAmount: number;
    totalAmount: number;
  } {
    let subtotal = 0;
    let discountAmount = 0;
    let taxableAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let cessAmount = 0;

    for (const item of items) {
      const baseAmount = item.quantity * item.unitPrice;
      subtotal += baseAmount;

      const itemDiscount = (baseAmount * item.discountPercent) / 100;
      discountAmount += itemDiscount;

      const gstResult = this.calculateItemGst(
        item.quantity,
        item.unitPrice,
        item.discountPercent,
        item.taxRate,
        isInterstate,
        isTaxInclusive,
        item.cessRate || 0
      );

      taxableAmount += gstResult.taxableAmount;
      cgstAmount += gstResult.cgstAmount;
      sgstAmount += gstResult.sgstAmount;
      igstAmount += gstResult.igstAmount;
      cessAmount += gstResult.cessAmount;
    }

    const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount;

    return {
      subtotal: this.roundToTwoDecimals(subtotal),
      discountAmount: this.roundToTwoDecimals(discountAmount),
      taxableAmount: this.roundToTwoDecimals(taxableAmount),
      cgstAmount: this.roundToTwoDecimals(cgstAmount),
      sgstAmount: this.roundToTwoDecimals(sgstAmount),
      igstAmount: this.roundToTwoDecimals(igstAmount),
      cessAmount: this.roundToTwoDecimals(cessAmount),
      totalAmount: this.roundToTwoDecimals(totalAmount),
    };
  }
}

