/**
 * HSN Validator Utility
 * 
 * Validates HSN (Harmonized System of Nomenclature) codes.
 * HSN codes are used for goods and can be 4, 6, or 8 digits.
 */

export interface HsnValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  code?: string;
  length?: number;
}

/**
 * Validate HSN code
 * 
 * HSN codes:
 * - Must be numeric
 * - Can be 4, 6, or 8 digits
 * - 4 digits: Chapter level
 * - 6 digits: Heading level
 * - 8 digits: Sub-heading level (most specific)
 * 
 * @param hsnCode - HSN code to validate
 * @returns Validation result
 */
export function validateHsnCode(hsnCode: string | null | undefined): HsnValidationResult {
  const result: HsnValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Handle null/undefined
  if (!hsnCode) {
    return {
      isValid: false,
      errors: ['HSN code is required'],
      warnings: [],
    };
  }

  // Trim whitespace
  const trimmed = hsnCode.trim();
  result.code = trimmed;

  // Check if empty after trimming
  if (trimmed.length === 0) {
    result.isValid = false;
    result.errors.push('HSN code cannot be empty');
    return result;
  }

  // Check if numeric
  if (!/^\d+$/.test(trimmed)) {
    result.isValid = false;
    result.errors.push('HSN code must contain only digits');
    return result;
  }

  // Check length
  result.length = trimmed.length;
  if (trimmed.length !== 4 && trimmed.length !== 6 && trimmed.length !== 8) {
    result.isValid = false;
    result.errors.push(
      `HSN code must be 4, 6, or 8 digits. Found ${trimmed.length} digits`
    );
    return result;
  }

  // Validate structure
  if (trimmed.length === 6) {
    // 6-digit HSN should start with valid 4-digit chapter
    const chapter = trimmed.substring(0, 4);
    if (!isValidHsnChapter(chapter)) {
      result.warnings.push('First 4 digits may not be a valid HSN chapter');
    }
  } else if (trimmed.length === 8) {
    // 8-digit HSN should start with valid 6-digit heading
    const heading = trimmed.substring(0, 6);
    if (!isValidHsnHeading(heading)) {
      result.warnings.push('First 6 digits may not be a valid HSN heading');
    }
  }

  return result;
}

/**
 * Check if a 4-digit code is a valid HSN chapter
 * 
 * HSN chapters range from 01 to 97
 */
function isValidHsnChapter(chapter: string): boolean {
  const chapterNum = parseInt(chapter, 10);
  return chapterNum >= 1 && chapterNum <= 97;
}

/**
 * Check if a 6-digit code is a valid HSN heading
 * 
 * This is a basic check - in reality, we'd need a database of valid headings
 */
function isValidHsnHeading(heading: string): boolean {
  const chapter = heading.substring(0, 4);
  return isValidHsnChapter(chapter);
}

/**
 * Format HSN code (pad with zeros if needed, but maintain original length preference)
 */
export function formatHsnCode(hsnCode: string): string {
  const trimmed = hsnCode.trim();
  if (!/^\d+$/.test(trimmed)) {
    return trimmed; // Return as-is if not numeric
  }

  // Don't pad - maintain original length
  // Users should enter the correct length
  return trimmed;
}

/**
 * Get HSN code level description
 */
export function getHsnLevelDescription(length: number): string {
  switch (length) {
    case 4:
      return 'Chapter level (4 digits)';
    case 6:
      return 'Heading level (6 digits)';
    case 8:
      return 'Sub-heading level (8 digits)';
    default:
      return 'Invalid length';
  }
}

