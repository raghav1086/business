/**
 * Phone Number Validator
 * 
 * Validates Indian phone numbers
 * Format: 10 digits, starting with 6-9
 */

export function validateIndianPhone(phone: string): boolean {
  if (!phone || phone.length !== 10) {
    return false;
  }

  // Must start with 6, 7, 8, or 9
  const phoneRegex = /^[6-9][0-9]{9}$/;
  
  return phoneRegex.test(phone);
}

export function formatIndianPhone(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Return last 10 digits if longer
  if (cleaned.length >= 10) {
    return cleaned.slice(-10);
  }
  
  return cleaned;
}

