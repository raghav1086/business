import { Invoice, InvoiceItem } from '../services/invoice-client.service';
import { Party } from '../services/party-client.service';
import { Business } from '../services/business-client.service';
import { EWayBillPayload } from '../interfaces/gsp-provider.interface';

/**
 * E-Way Bill Formatter Utility
 * 
 * Converts invoice data to E-Way Bill format.
 */
export class EWayBillFormatter {
  private readonly EWAYBILL_THRESHOLD = 50000; // 50K

  /**
   * Check if E-Way Bill is required
   */
  static isRequired(invoice: Invoice): boolean {
    // E-Way Bill required if invoice value >= 50K
    return (invoice.total_amount || 0) >= 50000;
  }

  /**
   * Convert invoice to E-Way Bill payload
   */
  static formatInvoice(
    invoice: Invoice,
    invoiceItems: InvoiceItem[],
    business: Business,
    party: Party
  ): EWayBillPayload {
    // Determine supply type
    const supplyType = invoice.invoice_type === 'sale' ? 'O' : 'I'; // O = Outward, I = Inward

    // Build item list
    const itemList = invoiceItems.map((item) => {
      return {
        productName: item.item_name || 'Item',
        productDesc: item.item_description,
        hsnCode: item.hsn_code || 'N/A',
        quantity: item.quantity || 0,
        qtyUnit: this.getUnitCode(item.unit || 'PCS'),
        cgstRate: item.cgst_rate || 0,
        sgstRate: item.sgst_rate || 0,
        igstRate: item.igst_rate || 0,
        cessRate: item.cess_rate || 0,
        cessNonAdvol: 0,
        taxableAmount: this.roundToTwoDecimals(item.taxable_amount || 0),
      };
    });

    // Build payload
    const payload: EWayBillPayload = {
      userGstin: business.gstin || '',
      supplyType: supplyType,
      subSupplyType: invoice.is_export ? 'EXPWP' : undefined, // Export with payment
      docType: 'INV', // Invoice
      docNo: invoice.invoice_number,
      docDate: this.formatDate(invoice.invoice_date),
      fromGstin: business.gstin,
      fromTrdName: business.name,
      fromAddr1: business.address?.street || '',
      fromAddr2: '',
      fromPlace: business.address?.city || '',
      fromPincode: business.address?.pincode ? parseInt(business.address.pincode) : undefined,
      fromStateCode: business.state_code || '',
      toGstin: party.gstin,
      toTrdName: party.name,
      toAddr1: party.address?.street || '',
      toAddr2: '',
      toPlace: party.address?.city || '',
      toPincode: party.address?.pincode ? parseInt(party.address.pincode) : undefined,
      toStateCode: party.state_code || '',
      itemList: itemList,
    };

    // Add transport details if available (from invoice notes or separate fields)
    // For now, these are optional and can be added later
    if (invoice.notes) {
      const transportMatch = invoice.notes.match(/transport[:\s]+([A-Z0-9]+)/i);
      if (transportMatch) {
        payload.transporterId = transportMatch[1];
      }

      const vehicleMatch = invoice.notes.match(/vehicle[:\s]+([A-Z0-9]+)/i);
      if (vehicleMatch) {
        payload.vehicleNo = vehicleMatch[1];
      }

      const distanceMatch = invoice.notes.match(/distance[:\s]+(\d+)/i);
      if (distanceMatch) {
        payload.transDistance = parseInt(distanceMatch[1]);
      }
    }

    // Default transport mode to Road (1) if not specified
    payload.transMode = payload.transMode || '1';

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
   * Get unit code for E-Way Bill
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

