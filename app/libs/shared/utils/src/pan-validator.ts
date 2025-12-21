/**
 * PAN Validator
 * 
 * Validates Indian PAN (Permanent Account Number)
 * Format: 10 characters - 5 letters + 4 digits + 1 letter
 */

export function validatePAN(pan: string): boolean {
  if (!pan || pan.length !== 10) {
    return false;
  }

  // Format: ABCDE1234F
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  
  return panRegex.test(pan.toUpperCase());
}

export function formatPAN(pan: string): string {
  // Remove spaces and convert to uppercase
  const cleaned = pan.replace(/\s+/g, '').toUpperCase();
  return cleaned;
}

