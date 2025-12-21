import { GstCalculationService } from './gst-calculation.service';

describe('GstCalculationService', () => {
  describe('calculateGst', () => {
    it('should calculate CGST/SGST for intrastate', () => {
      const result = GstCalculationService.calculateGst({
        amount: 1000,
        taxRate: 18,
        isInterstate: false,
        isTaxInclusive: false,
      });

      expect(result.taxableAmount).toBe(1000);
      expect(result.cgstRate).toBe(9); // 18% / 2
      expect(result.sgstRate).toBe(9); // 18% / 2
      expect(result.igstRate).toBe(0);
      expect(result.cgstAmount).toBe(90); // 1000 * 9% / 2
      expect(result.sgstAmount).toBe(90);
      expect(result.igstAmount).toBe(0);
      expect(result.totalAmount).toBe(1180); // 1000 + 90 + 90
    });

    it('should calculate IGST for interstate', () => {
      const result = GstCalculationService.calculateGst({
        amount: 1000,
        taxRate: 18,
        isInterstate: true,
        isTaxInclusive: false,
      });

      expect(result.taxableAmount).toBe(1000);
      expect(result.cgstRate).toBe(0);
      expect(result.sgstRate).toBe(0);
      expect(result.igstRate).toBe(18);
      expect(result.cgstAmount).toBe(0);
      expect(result.sgstAmount).toBe(0);
      expect(result.igstAmount).toBe(180); // 1000 * 18%
      expect(result.totalAmount).toBe(1180);
    });

    it('should calculate tax-inclusive pricing', () => {
      const result = GstCalculationService.calculateGst({
        amount: 1180, // Includes 18% tax
        taxRate: 18,
        isInterstate: false,
        isTaxInclusive: true,
      });

      expect(result.taxableAmount).toBeCloseTo(1000, 2);
      expect(result.cgstAmount).toBeCloseTo(90, 2);
      expect(result.sgstAmount).toBeCloseTo(90, 2);
      expect(result.totalAmount).toBeCloseTo(1180, 2);
    });

    it('should handle different tax rates (5%, 12%, 18%, 28%)', () => {
      const rates = [5, 12, 18, 28];

      rates.forEach((rate) => {
        const result = GstCalculationService.calculateGst({
          amount: 1000,
          taxRate: rate,
          isInterstate: false,
        });

        const expectedTax = (1000 * rate) / 100;
        expect(result.cgstAmount + result.sgstAmount).toBeCloseTo(
          expectedTax,
          2
        );
      });
    });

    it('should calculate CESS', () => {
      const result = GstCalculationService.calculateGst({
        amount: 1000,
        taxRate: 18,
        isInterstate: false,
        cessRate: 1, // 1% CESS
      });

      expect(result.cessAmount).toBe(10); // 1000 * 1%
      expect(result.totalAmount).toBe(1190); // 1000 + 90 + 90 + 10
    });

    it('should round amounts to 2 decimal places', () => {
      const result = GstCalculationService.calculateGst({
        amount: 100,
        taxRate: 18,
        isInterstate: false,
      });

      // Check all amounts are properly rounded
      expect(result.taxableAmount.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
      expect(result.cgstAmount.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('calculateItemGst', () => {
    it('should calculate GST for item with quantity and discount', () => {
      const result = GstCalculationService.calculateItemGst(
        10, // quantity
        100, // unit price
        10, // discount percent
        18, // tax rate
        false // intrastate
      );

      // Base: 10 * 100 = 1000
      // Discount: 1000 * 10% = 100
      // After discount: 900
      // Tax: 900 * 18% = 162 (CGST: 81, SGST: 81)
      expect(result.taxableAmount).toBe(900);
      expect(result.cgstAmount).toBe(81);
      expect(result.sgstAmount).toBe(81);
      expect(result.totalAmount).toBe(1062); // 900 + 81 + 81
    });
  });

  describe('calculateInvoiceTotals', () => {
    it('should calculate totals for multiple items', () => {
      const items = [
        {
          quantity: 10,
          unitPrice: 100,
          discountPercent: 0,
          taxRate: 18,
          cessRate: 0,
        },
        {
          quantity: 5,
          unitPrice: 200,
          discountPercent: 10,
          taxRate: 12,
          cessRate: 0,
        },
      ];

      const result = GstCalculationService.calculateInvoiceTotals(
        items,
        false // intrastate
      );

      // Item 1: 10 * 100 = 1000, tax = 180 (CGST: 90, SGST: 90)
      // Item 2: 5 * 200 = 1000, discount = 100, after discount = 900, tax = 108 (CGST: 54, SGST: 54)
      expect(result.subtotal).toBe(2000);
      expect(result.discountAmount).toBe(100);
      expect(result.cgstAmount).toBe(144); // 90 + 54
      expect(result.sgstAmount).toBe(144); // 90 + 54
      expect(result.totalAmount).toBeGreaterThan(2000);
    });
  });
});

