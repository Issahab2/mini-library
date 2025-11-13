/**
 * Frontend Environment Variables Configuration
 *
 * This file centralizes all client-side environment variable access.
 * Note: Only variables prefixed with NEXT_PUBLIC_ are available on the client.
 *
 * Organization:
 * - Frontend Required: Variables that must be set for the app to function
 * - Frontend Optional: Variables with defaults or graceful degradation
 */

// ============================================================================
// FRONTEND REQUIRED ENVIRONMENT VARIABLES
// ============================================================================

// Currently no required frontend environment variables

// ============================================================================
// FRONTEND OPTIONAL ENVIRONMENT VARIABLES
// ============================================================================

/**
 * Public API URL (if different from same-origin)
 * Optional - Defaults to empty string (uses same-origin)
 */
export const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// System Variables
/**
 * Node environment (development, production, test)
 * Set automatically by Node.js/Next.js
 */
export const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Check if running in development mode
 */
export const IS_DEVELOPMENT = NODE_ENV === "development";

/**
 * Check if running in production mode
 */
export const IS_PRODUCTION = NODE_ENV === "production";
