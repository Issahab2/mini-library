// Server-side utilities
export { prisma } from "./prisma";
export { withAuth, createAuthHandler } from "./auth";
export { createMethodAuthHandler, type MethodAuthConfig, type MethodAuthContext } from "./method-auth-handler";
export {
  validateCheckout,
  calculateDueDate,
  calculateLateFees,
  checkOverdueStatus,
  updateAllOverdueStatuses,
  createCheckout,
  returnCheckout,
} from "./checkout";
export { buildBookSearchQuery, buildGeneralBookSearchQuery } from "./search";

// Re-export types
export type { AuthenticatedUser, AuthMiddlewareOptions, AuthMiddlewareResult } from "./types";

// Re-export errors
export {
  AuthErrorCodes,
  BookErrorCodes,
  CheckoutErrorCodes,
  HttpStatusCodes,
  createError,
  createUnauthorizedError,
  createInvalidSessionError,
  createForbiddenError,
  createMissingPermissionsError,
  createMissingRolesError,
  createAuthError,
  createBookNotFoundError,
  createBookAlreadyCheckedOutError,
  createBookUnavailableError,
  createChapterNotFoundError,
  createCheckoutNotFoundError,
  createCheckoutLimitExceededError,
  createCheckoutAlreadyReturnedError,
  type AuthErrorCode,
  type BookErrorCode,
  type CheckoutErrorCode,
  type HttpStatusCode,
  type ApiError,
} from "./errors";
