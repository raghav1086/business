/**
 * JWT Utility Functions
 * 
 * Helper functions to decode and extract information from JWT tokens
 */

/**
 * Decode JWT token without verification (client-side only)
 * Note: This does NOT verify the token signature. For production, always verify on the backend.
 */
export function decodeJWT(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Extract user information from JWT token
 */
export function extractUserFromToken(token: string): {
  userId?: string;
  phone?: string;
  is_superadmin?: boolean;
} | null {
  const decoded = decodeJWT(token);
  if (!decoded) {
    return null;
  }

  return {
    userId: decoded.sub || decoded.userId || decoded.id,
    phone: decoded.phone,
    is_superadmin: decoded.is_superadmin || decoded.isSuperadmin || false,
  };
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return true; // Consider expired if we can't decode or no exp claim
  }

  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  return Date.now() >= expirationTime;
}

