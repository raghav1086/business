/**
 * GSTIN Validator
 * 
 * Validates Indian GSTIN (GST Identification Number)
 * Format: 15 characters - 2 digits (state) + 10 alphanumeric (PAN) + 1 digit (entity) + 1 alphanumeric (check) + 1 letter (Z)
 */

export function validateGSTIN(gstin: string): boolean {
  if (!gstin || gstin.length !== 15) {
    return false;
  }

  // Format: 15AAACB1234A1Z5
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstinRegex.test(gstin)) {
    return false;
  }

  // Additional validation: Check digit validation (if needed)
  // For MVP, format validation is sufficient
  
  return true;
}

export function formatGSTIN(gstin: string): string {
  // Remove spaces and convert to uppercase
  const cleaned = gstin.replace(/\s+/g, '').toUpperCase();
  return cleaned;
}

