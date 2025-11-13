/**
 * Environment Variables Configuration
 *
 * This file centralizes all environment variable access.
 * All process.env calls should go through this file.
 *
 * Organization:
 * - Backend Required: Variables that must be set for the app to function
 * - Backend Optional: Variables with defaults or graceful degradation
 */

// ============================================================================
// BACKEND REQUIRED ENVIRONMENT VARIABLES
// ============================================================================

/**
 * Database connection URL (PostgreSQL)
 * Required for Prisma to connect to the database
 */
export const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required but not set in environment variables");
}

/**
 * NextAuth secret for JWT encryption
 * Required for session management and token signing
 */
export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

if (!NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is required but not set in environment variables");
}

// Seed Script Variables - Optional
/**
 * Admin user email for seed script
 * Optional - Defaults to "admin@library.com"
 */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@library.com";

/**
 * Admin user password for seed script
 * Optional - Defaults to "admin123"
 */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

/**
 * Admin user name for seed script
 * Optional - Defaults to "Admin User"
 */
export const ADMIN_NAME = process.env.ADMIN_NAME || "Admin User";

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
  throw new Error("ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME are required but not set in environment variables");
}

// ============================================================================
// BACKEND OPTIONAL ENVIRONMENT VARIABLES
// ============================================================================

/**
 * Google OAuth Client ID
 * Optional - Only required if using Google OAuth provider
 */
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

/**
 * Google OAuth Client Secret
 * Optional - Only required if using Google OAuth provider
 */
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

/**
 * Application URL
 * Optional - Base URL for the application (defaults to localhost:3000)
 * Used for email links and webhooks
 */
export const APP_URL = process.env.APP_URL || "http://localhost:3000";

// Email Service (Resend) - Optional
/**
 * Resend API Key
 * Optional - Email service will gracefully degrade if not set
 */
export const RESEND_API_KEY = process.env.RESEND_API_KEY;

/**
 * Email sender address
 * Optional - Defaults to "noreply@example.com"
 */
export const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || "noreply@example.com";

/**
 * Email sender name
 * Optional - Defaults to "Mini Library"
 */
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Mini Library";

// QStash Service (Upstash) - Optional
/**
 * QStash API Token
 * Optional - QStash service will gracefully degrade if not set
 */
export const QSTASH_TOKEN = process.env.QSTASH_TOKEN;

/**
 * QStash API URL
 * Optional - Can be auto-detected if not provided
 */
export const QSTASH_URL = process.env.QSTASH_URL;

// AI Service (OpenAI) - Optional
/**
 * OpenAI API Key
 * Optional - AI service will gracefully degrade if not set
 */
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
