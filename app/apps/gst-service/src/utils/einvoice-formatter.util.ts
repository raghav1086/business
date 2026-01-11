import { Invoice, InvoiceItem } from '../services/invoice-client.service';
import { Party } from '../services/party-client.service';
import { Business } from '../services/business-client.service';
import { EInvoicePayload } from '../interfaces/gsp-provider.interface';

/**
 * E-Invoice Formatter Utility
 * 
 * Converts invoice data to E-Invoice format (GSTN schema).
 */
export class EInvoiceFormatter {
  /**
   * Convert invoice to E-Invoice payload
   */
  static formatInvoice(
    invoice: Invoice,
    invoiceItems: InvoiceItem[],
    business: Business,
    party: Party
  ): EInvoicePayload {
    // Format invoice date
    const invoiceDate = this.formatDate(invoice.invoice_date);

    // Build item list
    const itemList = invoiceItems.map((item, index) => {
      const hsnCode = item.hsn_code || 'N/A';
      const unit = item.unit || 'PCS';
      const unitCode = this.getUnitCode(unit);

      return {
        SlNo: String(index + 1),
        PrdDesc: item.item_name || item.item_description || 'Item',
        HsnCd: hsnCode,
        Qty: item.quantity || 0,
        Unit: unitCode,
        Rate: this.roundToTwoDecimals(item.unit_price || 0),
        TotAmt: this.roundToTwoDecimals((item.unit_price || 0) * (item.quantity || 0)),
        Discount: this.roundToTwoDecimals(item.discount_amount || 0),
        TaxableAmt: this.roundToTwoDecimals(item.taxable_amount || 0),
        IgstAmt: this.roundToTwoDecimals(item.igst_amount || 0),
        CgstAmt: this.roundToTwoDecimals(item.cgst_amount || 0),
        SgstAmt: this.roundToTwoDecimals(item.sgst_amount || 0),
        CesAmt: this.roundToTwoDecimals(item.cess_amount || 0),
        CesRt: item.cess_rate || 0,
        CesNonAdvlAmt: 0,
        TotItemVal: this.roundToTwoDecimals(
          (item.taxable_amount || 0) +
          (item.cgst_amount || 0) +
          (item.sgst_amount || 0) +
          (item.igst_amount || 0) +
          (item.cess_amount || 0)
        ),
      };
    });

    // Build payload
    const payload: EInvoicePayload = {
      DocDtls: {
        Typ: 'INV', // Invoice
        No: invoice.invoice_number,
        Dt: invoiceDate,
      },
      SellerDtls: {
        Gstin: business.gstin || '',
        LglNm: business.name,
        TrdNm: business.name,
        Addr1: business.address?.street || '',
        Addr2: '',
        Loc: business.address?.city || '',
        Pin: business.address?.pincode ? parseInt(business.address.pincode) : undefined,
        Stcd: business.state_code || '',
        Ph: '',
        Em: '',
      },
      BuyerDtls: {
        Gstin: party.gstin,
        LglNm: party.name,
        TrdNm: party.name,
        Pos: invoice.place_of_supply || party.state_code || '',
        Addr1: party.address?.street || '',
        Addr2: '',
        Loc: party.address?.city || '',
        Pin: party.address?.pincode ? parseInt(party.address.pincode) : undefined,
        Stcd: party.state_code || '',
        Ph: party.phone || '',
        Em: party.email || '',
      },
      ItemList: itemList,
      ValDtls: {
        AssVal: this.roundToTwoDecimals(invoice.taxable_amount || 0),
        CgstVal: this.roundToTwoDecimals(invoice.cgst_amount || 0),
        SgstVal: this.roundToTwoDecimals(invoice.sgst_amount || 0),
        IgstVal: this.roundToTwoDecimals(invoice.igst_amount || 0),
        CesVal: this.roundToTwoDecimals(invoice.cess_amount || 0),
        StCesVal: 0,
        Discount: this.roundToTwoDecimals(invoice.discount_amount || 0),
        OthChrg: 0,
        RndOffAmt: this.roundToTwoDecimals(invoice.round_off || 0),
        TotInvVal: this.roundToTwoDecimals(invoice.total_amount || 0),
      },
    };

    // Add payment details if available
    if (invoice.payment_status && invoice.payment_status !== 'unpaid') {
      payload.PayDtls = {
        PaidAmt: this.roundToTwoDecimals(invoice.paid_amount || 0),
        PaymtDue: this.roundToTwoDecimals((invoice.total_amount || 0) - (invoice.paid_amount || 0)),
      };
    }

    // Add export details if export invoice
    if (invoice.is_export) {
      payload.ExpDtls = {
        Port: '', // Extract from notes or separate field
        ForCur: 'INR',
        CntCode: 'IN',
      };
    }

    return payload;
  }

  /**
   * Format date to DD-MM-YYYY
   */
  private static formatDate(date: Date | string): string {
    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else {
      d = new Date();
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Get unit code for E-Invoice
   */
  private static getUnitCode(unit: string): string {
    const unitMap: Record<string, string> = {
      'PCS': 'PCS',
      'NOS': 'NOS',
      'KG': 'KGS',
      'LTR': 'LTR',
      'MTR': 'MTR',
      'SQM': 'SQM',
      'CBM': 'CBM',
      'BOX': 'BOX',
      'PKT': 'PKT',
      'SET': 'SET',
      'PAIR': 'PRS',
      'DOZ': 'DOZ',
      'BAG': 'BAG',
      'BTL': 'BTL',
      'CAN': 'CAN',
      'CARTON': 'CTN',
      'PACK': 'PAC',
    };

    return unitMap[unit.toUpperCase()] || 'PCS';
  }

  /**
   * Round to 2 decimal places
   */
  private static roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}

