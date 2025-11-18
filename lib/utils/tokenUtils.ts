import { v4 as uuidv4 } from 'uuid'

/**
 * Generate a unique token for bandmate access
 */
export function generateBandmateToken(): string {
  // Generate a URL-safe token
  return uuidv4().replace(/-/g, '').substring(0, 32)
}

/**
 * Generate a unique share token for band calendar
 */
export function generateShareToken(): string {
  // Generate a URL-safe token
  return uuidv4().replace(/-/g, '').substring(0, 24)
}

