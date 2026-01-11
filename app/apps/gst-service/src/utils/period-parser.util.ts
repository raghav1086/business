/**
 * Period Parser Utility
 * 
 * Parses period strings (MMYYYY or Q1-YYYY) to date ranges.
 */
export class PeriodParser {
  /**
   * Parse period string to start and end dates
   * 
   * Supports:
   * - MMYYYY format (e.g., "122024" for December 2024)
   * - Q1-YYYY format (e.g., "Q1-2024" for Q1 2024)
   */
  static parse(period: string): { startDate: Date; endDate: Date } {
    // Support MMYYYY format (monthly)
    if (/^\d{6}$/.test(period)) {
      const month = parseInt(period.substring(0, 2));
      const year = parseInt(period.substring(2, 6));
      
      if (month < 1 || month > 12) {
        throw new Error(`Invalid month: ${month}. Must be between 1 and 12.`);
      }
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      return { startDate, endDate };
    }
    
    // Support Q1-YYYY format (quarterly)
    if (/^Q[1-4]-\d{4}$/.test(period)) {
      const quarter = parseInt(period.substring(1, 2));
      const year = parseInt(period.substring(3, 7));
      
      const startMonth = (quarter - 1) * 3;
      const endMonth = startMonth + 2;
      
      const startDate = new Date(year, startMonth, 1);
      const endDate = new Date(year, endMonth + 1, 0, 23, 59, 59, 999);
      
      return { startDate, endDate };
    }
    
    throw new Error(
      `Invalid period format: ${period}. Expected MMYYYY (e.g., 122024) or Q1-YYYY (e.g., Q1-2024)`
    );
  }

  /**
   * Validate period format
   */
  static isValid(period: string): boolean {
    return /^\d{6}$/.test(period) || /^Q[1-4]-\d{4}$/.test(period);
  }

  /**
   * Format period for display
   */
  static format(period: string): string {
    if (/^\d{6}$/.test(period)) {
      const month = parseInt(period.substring(0, 2));
      const year = period.substring(2, 6);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[month - 1]} ${year}`;
    }
    
    if (/^Q[1-4]-\d{4}$/.test(period)) {
      return period.toUpperCase();
    }
    
    return period;
  }
}

