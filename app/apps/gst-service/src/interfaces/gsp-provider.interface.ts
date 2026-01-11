/**
 * GSP Provider Interface
 * 
 * Defines the contract for all GSP (GST Suvidha Provider) implementations.
 * This allows the system to support multiple GSP providers (ClearTax, Tally, etc.)
 */
export interface IGSPProvider {
  /**
   * Authenticate with GSP
   * @returns Access token
   */
  authenticate(): Promise<string>;

  /**
   * Generate E-Invoice IRN (Invoice Registration Number)
   * @param invoiceData Invoice data in E-Invoice format
   * @returns IRN and QR code data
   */
  generateIRN(invoiceData: EInvoicePayload): Promise<IRNResponse>;

  /**
   * Cancel E-Invoice IRN
   * @param irn Invoice Registration Number
   * @param cancelReason Reason for cancellation
   * @returns Cancellation response
   */
  cancelIRN(irn: string, cancelReason: string): Promise<IRNCancelResponse>;

  /**
   * Generate E-Way Bill
   * @param ewayBillData E-Way Bill data
   * @returns E-Way Bill number and details
   */
  generateEWayBill(ewayBillData: EWayBillPayload): Promise<EWayBillResponse>;

  /**
   * Cancel E-Way Bill
   * @param ewayBillNumber E-Way Bill number
   * @param cancelReason Reason for cancellation
   * @returns Cancellation response
   */
  cancelEWayBill(ewayBillNumber: string, cancelReason: string): Promise<EWayBillCancelResponse>;

  /**
   * Update E-Way Bill
   * @param ewayBillNumber E-Way Bill number
   * @param updateData Updated data
   * @returns Update response
   */
  updateEWayBill(ewayBillNumber: string, updateData: Partial<EWayBillPayload>): Promise<EWayBillResponse>;

  /**
   * Get IRN status
   * @param irn Invoice Registration Number
   * @returns IRN status
   */
  getIRNStatus(irn: string): Promise<IRNStatusResponse>;

  /**
   * Get E-Way Bill status
   * @param ewayBillNumber E-Way Bill number
   * @returns E-Way Bill status
   */
  getEWayBillStatus(ewayBillNumber: string): Promise<EWayBillStatusResponse>;
}

/**
 * E-Invoice Payload
 */
export interface EInvoicePayload {
  DocDtls: {
    Typ: string; // Document type
    No: string; // Invoice number
    Dt: string; // Invoice date (DD-MM-YYYY)
  };
  SellerDtls: {
    Gstin: string;
    LglNm: string; // Legal name
    TrdNm?: string; // Trade name
    Addr1?: string;
    Addr2?: string;
    Loc?: string; // Location
    Pin?: number;
    Stcd?: string; // State code
    Ph?: string; // Phone
    Em?: string; // Email
  };
  BuyerDtls: {
    Gstin?: string; // Optional for B2C
    LglNm: string;
    TrdNm?: string;
    Pos?: string; // Place of supply
    Addr1?: string;
    Addr2?: string;
    Loc?: string;
    Pin?: number;
    Stcd?: string;
    Ph?: string;
    Em?: string;
  };
  ItemList: Array<{
    SlNo: string; // Serial number
    PrdDesc: string; // Product description
    HsnCd: string; // HSN code
    Qty: number; // Quantity
    Unit: string; // Unit code
    Rate: number; // Rate per unit
    TotAmt: number; // Total amount
    Discount?: number;
    TaxableAmt: number;
    IgstAmt?: number;
    CgstAmt?: number;
    SgstAmt?: number;
    CesAmt?: number; // CESS amount
    CesRt?: number; // CESS rate
    CesNonAdvlAmt?: number;
    TotItemVal: number; // Total item value
  }>;
  ValDtls: {
    AssVal: number; // Assessable value
    CgstVal: number;
    SgstVal: number;
    IgstVal: number;
    CesVal: number;
    StCesVal?: number; // State CESS
    Discount?: number;
    OthChrg?: number; // Other charges
    RndOffAmt?: number; // Round off amount
    TotInvVal: number; // Total invoice value
    TotInvValFc?: number; // Total invoice value in foreign currency
  };
  PayDtls?: {
    Nm?: string; // Payment mode name
    AccDet?: string; // Account details
    Mode?: string; // Payment mode
    FinInsBr?: string; // Financial institution branch
    PayTerm?: string; // Payment terms
    PaidAmt?: number; // Paid amount
    PaymtDue?: number; // Payment due
  };
  ExpDtls?: {
    ShipBNo?: string; // Shipping bill number
    ShipBDt?: string; // Shipping bill date
    Port?: string; // Port code
    RefClm?: string; // Refund claim
    ForCur?: string; // Foreign currency
    CntCode?: string; // Country code
    ExpDuty?: number; // Export duty
  };
  EwayBillDtls?: {
    TransId?: string; // Transport ID
    TransName?: string; // Transport name
    Distance?: number; // Distance in km
    TransDocNo?: string; // Transport document number
    TransDocDt?: string; // Transport document date
    VehNo?: string; // Vehicle number
    VehType?: string; // Vehicle type
  };
}

/**
 * IRN Response
 */
export interface IRNResponse {
  success: boolean;
  irn: string; // Invoice Registration Number
  ackNo: string; // Acknowledgement number
  ackDate: string; // Acknowledgement date
  qrCode: string; // QR code data (base64)
  ewayBillNo?: string; // E-Way Bill number (if generated)
  signedInvoice?: string; // Signed invoice JSON
  signedQRCode?: string; // Signed QR code
  error?: string;
  errorCode?: string;
}

/**
 * IRN Cancel Response
 */
export interface IRNCancelResponse {
  success: boolean;
  irn: string;
  cancelDate: string;
  error?: string;
  errorCode?: string;
}

/**
 * E-Way Bill Payload
 */
export interface EWayBillPayload {
  userGstin: string;
  supplyType: string; // 'O' for Outward, 'I' for Inward
  subSupplyType?: string;
  docType: string; // 'INV' for Invoice
  docNo: string; // Document number
  docDate: string; // Document date (DD-MM-YYYY)
  fromGstin?: string; // From GSTIN (for inter-state)
  fromTrdName?: string;
  fromAddr1?: string;
  fromAddr2?: string;
  fromPlace?: string;
  fromPincode?: number;
  fromStateCode?: string;
  toGstin?: string; // To GSTIN
  toTrdName?: string;
  toAddr1?: string;
  toAddr2?: string;
  toPlace?: string;
  toPincode?: number;
  toStateCode?: string;
  itemList: Array<{
    productName: string;
    productDesc?: string;
    hsnCode: string;
    quantity: number;
    qtyUnit: string;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    cessRate?: number;
    cessNonAdvol?: number;
    taxableAmount: number;
  }>;
  transMode?: string; // Transport mode (1=Road, 2=Rail, 3=Air, 4=Ship)
  transDistance?: number; // Distance in km
  transporterId?: string; // Transporter ID
  transporterName?: string;
  vehicleNo?: string;
  vehicleType?: string; // 'R' for Regular, 'O' for Over Dimensional Cargo
}

/**
 * E-Way Bill Response
 */
export interface EWayBillResponse {
  success: boolean;
  ewayBillNo: string; // E-Way Bill number
  ewayBillDate: string; // E-Way Bill date
  validUpto: string; // Valid until date
  error?: string;
  errorCode?: string;
}

/**
 * E-Way Bill Cancel Response
 */
export interface EWayBillCancelResponse {
  success: boolean;
  ewayBillNo: string;
  cancelDate: string;
  error?: string;
  errorCode?: string;
}

/**
 * IRN Status Response
 */
export interface IRNStatusResponse {
  success: boolean;
  irn: string;
  status: string; // 'ACTIVE', 'CANCELLED', etc.
  ackNo?: string;
  ackDate?: string;
  error?: string;
}

/**
 * E-Way Bill Status Response
 */
export interface EWayBillStatusResponse {
  success: boolean;
  ewayBillNo: string;
  status: string; // 'ACTIVE', 'CANCELLED', 'EXPIRED', etc.
  validUpto?: string;
  error?: string;
}

