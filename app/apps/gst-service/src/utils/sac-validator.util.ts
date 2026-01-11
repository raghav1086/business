/**
 * SAC Validator Utility
 * 
 * Validates SAC (Services Accounting Code) codes.
 * SAC codes are used for services and are always 6 digits.
 */

export interface SacValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  code?: string;
}

/**
 * Validate SAC code
 * 
 * SAC codes:
 * - Must be numeric
 * - Must be exactly 6 digits
 * - First 2 digits: Section (99 for services)
 * - Next 2 digits: Group
 * - Last 2 digits: Service code
 * 
 * @param sacCode - SAC code to validate
 * @returns Validation result
 */
export function validateSacCode(sacCode: string | null | undefined): SacValidationResult {
  const result: SacValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Handle null/undefined
  if (!sacCode) {
    return {
      isValid: false,
      errors: ['SAC code is required'],
      warnings: [],
    };
  }

  // Trim whitespace
  const trimmed = sacCode.trim();
  result.code = trimmed;

  // Check if empty after trimming
  if (trimmed.length === 0) {
    result.isValid = false;
    result.errors.push('SAC code cannot be empty');
    return result;
  }

  // Check if numeric
  if (!/^\d+$/.test(trimmed)) {
    result.isValid = false;
    result.errors.push('SAC code must contain only digits');
    return result;
  }

  // Check length (must be exactly 6 digits)
  if (trimmed.length !== 6) {
    result.isValid = false;
    result.errors.push(
      `SAC code must be exactly 6 digits. Found ${trimmed.length} digits`
    );
    return result;
  }

  // Validate structure
  const section = trimmed.substring(0, 2);
  if (section !== '99') {
    result.warnings.push('SAC codes typically start with 99 (services section)');
  }

  // Check if valid SAC structure
  if (!isValidSacStructure(trimmed)) {
    result.warnings.push('SAC code structure may not be valid');
  }

  return result;
}

/**
 * Check if SAC code has valid structure
 * 
 * SAC structure:
 * - 99XXXX: Services
 * - Section 99 is standard for services
 */
function isValidSacStructure(sacCode: string): boolean {
  const section = sacCode.substring(0, 2);
  const group = sacCode.substring(2, 4);
  const service = sacCode.substring(4, 6);

  // Section must be 99 for services
  if (section !== '99') {
    return false;
  }

  // Group should be between 00-99
  const groupNum = parseInt(group, 10);
  if (groupNum < 0 || groupNum > 99) {
    return false;
  }

  // Service code should be between 00-99
  const serviceNum = parseInt(service, 10);
  if (serviceNum < 0 || serviceNum > 99) {
    return false;
  }

  return true;
}

/**
 * Format SAC code (pad with zeros if needed)
 */
export function formatSacCode(sacCode: string): string {
  const trimmed = sacCode.trim();
  if (!/^\d+$/.test(trimmed)) {
    return trimmed; // Return as-is if not numeric
  }

  // Pad to 6 digits if shorter
  if (trimmed.length < 6) {
    return trimmed.padStart(6, '0');
  }

  // Truncate if longer (shouldn't happen if validated)
  if (trimmed.length > 6) {
    return trimmed.substring(0, 6);
  }

  return trimmed;
}

/**
 * Get SAC code description
 */
export function getSacDescription(sacCode: string): string {
  if (sacCode.length !== 6) {
    return 'Invalid SAC code length';
  }

  const section = sacCode.substring(0, 2);
  const group = sacCode.substring(2, 4);
  const service = sacCode.substring(4, 6);

  if (section === '99') {
    return `Service - Group ${group}, Code ${service}`;
  }

  return `Section ${section}, Group ${group}, Code ${service}`;
}

