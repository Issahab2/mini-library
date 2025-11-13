/**
 * Error codes for authentication and authorization
 */
export const AuthErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_SESSION: "INVALID_SESSION",
  FORBIDDEN: "FORBIDDEN",
  AUTH_ERROR: "AUTH_ERROR",
  MISSING_PERMISSIONS: "MISSING_PERMISSIONS",
  MISSING_ROLES: "MISSING_ROLES",
} as const;

export type AuthErrorCode = (typeof AuthErrorCodes)[keyof typeof AuthErrorCodes];

/**
 * Error codes for book operations
 */
export const BookErrorCodes = {
  BOOK_NOT_FOUND: "BOOK_NOT_FOUND",
  BOOK_ALREADY_CHECKED_OUT: "BOOK_ALREADY_CHECKED_OUT",
  BOOK_UNAVAILABLE: "BOOK_UNAVAILABLE",
  BOOK_CREATE_FAILED: "BOOK_CREATE_FAILED",
  BOOK_UPDATE_FAILED: "BOOK_UPDATE_FAILED",
  BOOK_DELETE_FAILED: "BOOK_DELETE_FAILED",
  CHAPTER_NOT_FOUND: "CHAPTER_NOT_FOUND",
} as const;

export type BookErrorCode = (typeof BookErrorCodes)[keyof typeof BookErrorCodes];

/**
 * Error codes for checkout operations
 */
export const CheckoutErrorCodes = {
  CHECKOUT_NOT_FOUND: "CHECKOUT_NOT_FOUND",
  CHECKOUT_LIMIT_EXCEEDED: "CHECKOUT_LIMIT_EXCEEDED",
  BOOK_UNAVAILABLE: "BOOK_UNAVAILABLE",
  CHECKOUT_ALREADY_RETURNED: "CHECKOUT_ALREADY_RETURNED",
  CHECKOUT_CREATE_FAILED: "CHECKOUT_CREATE_FAILED",
  CHECKOUT_RETURN_FAILED: "CHECKOUT_RETURN_FAILED",
} as const;

export type CheckoutErrorCode = (typeof CheckoutErrorCodes)[keyof typeof CheckoutErrorCodes];

/**
 * Standard HTTP status codes
 */
export const HttpStatusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusCode = (typeof HttpStatusCodes)[keyof typeof HttpStatusCodes];

/**
 * Error response structure
 */
export interface ApiError {
  code: AuthErrorCode | string;
  message: string;
  statusCode: HttpStatusCode;
  details?: unknown;
}

/**
 * Creates a standardized error response
 *
 * @param code - Error code
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param details - Optional additional error details
 * @returns ApiError object
 *
 * @example
 * const error = createError(
 *   AuthErrorCodes.UNAUTHORIZED,
 *   "Authentication required",
 *   HttpStatusCodes.UNAUTHORIZED
 * );
 */
export function createError(
  code: AuthErrorCode | string,
  message: string,
  statusCode: HttpStatusCode,
  details?: unknown
): ApiError {
  return {
    code,
    message,
    statusCode,
    ...(typeof details === "object" && details ? { details } : {}),
  };
}

/**
 * Creates an unauthorized error (401)
 */
export function createUnauthorizedError(message = "Authentication required"): ApiError {
  return createError(AuthErrorCodes.UNAUTHORIZED, message, HttpStatusCodes.UNAUTHORIZED);
}

/**
 * Creates an invalid session error (401)
 */
export function createInvalidSessionError(message = "Invalid session data"): ApiError {
  return createError(AuthErrorCodes.INVALID_SESSION, message, HttpStatusCodes.UNAUTHORIZED);
}

/**
 * Creates a forbidden error (403)
 */
export function createForbiddenError(message = "Access forbidden"): ApiError {
  return createError(AuthErrorCodes.FORBIDDEN, message, HttpStatusCodes.FORBIDDEN);
}

/**
 * Creates a missing permissions error (403)
 */
export function createMissingPermissionsError(permissions: string[], requireAll = false): ApiError {
  const message = requireAll
    ? `Missing required permissions: ${permissions.join(", ")}`
    : `Missing required permission. Required: ${permissions.join(" or ")}`;

  return createError(AuthErrorCodes.MISSING_PERMISSIONS, message, HttpStatusCodes.FORBIDDEN, {
    requiredPermissions: permissions,
    requireAll,
  });
}

/**
 * Creates a missing roles error (403)
 */
export function createMissingRolesError(roles: string[], requireAll = false): ApiError {
  const message = requireAll
    ? `Missing required roles: ${roles.join(", ")}`
    : `Missing required role. Required: ${roles.join(" or ")}`;

  return createError(AuthErrorCodes.MISSING_ROLES, message, HttpStatusCodes.FORBIDDEN, {
    requiredRoles: roles,
    requireAll,
  });
}

/**
 * Creates an authentication error (500)
 */
export function createAuthError(message: string, originalError?: unknown): ApiError {
  return createError(
    AuthErrorCodes.AUTH_ERROR,
    message,
    HttpStatusCodes.INTERNAL_SERVER_ERROR,
    originalError instanceof Error ? { originalMessage: originalError.message } : undefined
  );
}

// Book-specific error creators

/**
 * Creates a book not found error (404)
 */
export function createBookNotFoundError(bookId?: string): ApiError {
  return createError(
    BookErrorCodes.BOOK_NOT_FOUND,
    bookId ? `Book with ID ${bookId} not found` : "Book not found",
    HttpStatusCodes.NOT_FOUND,
    { bookId }
  );
}

/**
 * Creates a book already checked out error (409)
 */
export function createBookAlreadyCheckedOutError(bookId: string): ApiError {
  return createError(
    BookErrorCodes.BOOK_ALREADY_CHECKED_OUT,
    `Book with ID ${bookId} is already checked out`,
    HttpStatusCodes.CONFLICT,
    { bookId }
  );
}

/**
 * Creates a book unavailable error (409)
 */
export function createBookUnavailableError(bookId: string): ApiError {
  return createError(
    BookErrorCodes.BOOK_UNAVAILABLE,
    `Book with ID ${bookId} is currently unavailable`,
    HttpStatusCodes.CONFLICT,
    { bookId }
  );
}

/**
 * Creates a chapter not found error (404)
 */
export function createChapterNotFoundError(chapterId?: string): ApiError {
  return createError(
    BookErrorCodes.CHAPTER_NOT_FOUND,
    chapterId ? `Chapter with ID ${chapterId} not found` : "Chapter not found",
    HttpStatusCodes.NOT_FOUND,
    { chapterId }
  );
}

// Checkout-specific error creators

/**
 * Creates a checkout not found error (404)
 */
export function createCheckoutNotFoundError(checkoutId?: string): ApiError {
  return createError(
    CheckoutErrorCodes.CHECKOUT_NOT_FOUND,
    checkoutId ? `Checkout with ID ${checkoutId} not found` : "Checkout not found",
    HttpStatusCodes.NOT_FOUND,
    { checkoutId }
  );
}

/**
 * Creates a checkout limit exceeded error (400)
 */
export function createCheckoutLimitExceededError(currentCheckouts: number, maxCheckouts: number): ApiError {
  return createError(
    CheckoutErrorCodes.CHECKOUT_LIMIT_EXCEEDED,
    `Checkout limit exceeded. You have ${currentCheckouts} active checkouts out of ${maxCheckouts} allowed.`,
    HttpStatusCodes.BAD_REQUEST,
    { currentCheckouts, maxCheckouts }
  );
}

/**
 * Creates a checkout already returned error (409)
 */
export function createCheckoutAlreadyReturnedError(checkoutId: string): ApiError {
  return createError(
    CheckoutErrorCodes.CHECKOUT_ALREADY_RETURNED,
    `Checkout with ID ${checkoutId} has already been returned`,
    HttpStatusCodes.CONFLICT,
    { checkoutId }
  );
}
