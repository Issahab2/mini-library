import { authOptions } from "@/pages/api/auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import type { AuthenticatedUser, AuthMiddlewareOptions, AuthMiddlewareResult } from "./types/auth";
import {
  createUnauthorizedError,
  createInvalidSessionError,
  createMissingPermissionsError,
  createMissingRolesError,
  createAuthError,
} from "./errors";

/**
 * Authentication and authorization middleware for API routes
 *
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @param options - Middleware options for auth/authorization checks
 * @returns AuthMiddlewareResult with user data or error information
 *
 * @example
 * // Require authentication only
 * const result = await withAuth(req, res, { requireAuth: true });
 * if (!result.success) {
 *   return res.status(result.error!.statusCode).json({ error: result.error!.message });
 * }
 * const { user } = result;
 *
 * @example
 * // Require specific permission
 * const result = await withAuth(req, res, {
 *   requirePermissions: ["book:create"]
 * });
 *
 * @example
 * // Require specific role
 * const result = await withAuth(req, res, {
 *   requireRoles: ["Admin"]
 * });
 *
 * @example
 * // Require multiple permissions (user must have ALL)
 * const result = await withAuth(req, res, {
 *   requirePermissions: ["book:read", "book:write"],
 *   requireAllPermissions: true
 * });
 */
export async function withAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  options: AuthMiddlewareOptions = {}
): Promise<AuthMiddlewareResult> {
  const {
    requireAuth = true,
    requirePermissions = [],
    requireRoles = [],
    requireAllPermissions = false,
    requireAllRoles = false,
  } = options;

  try {
    // Get the session
    const session = await getServerSession(req, res, authOptions);

    // Check if authentication is required and user is not authenticated
    if (requireAuth && !session) {
      return {
        success: false,
        error: createUnauthorizedError(),
      };
    }

    // If no auth required and no session, return success without user
    if (!requireAuth && !session) {
      return {
        success: true,
      };
    }

    // At this point, we have a session
    if (!session?.user) {
      return {
        success: false,
        error: createInvalidSessionError(),
      };
    }

    const user: AuthenticatedUser = {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
      roles: session.user.roles || [],
      permissions: session.user.permissions || [],
    };

    // Check permissions
    if (requirePermissions.length > 0) {
      if (requireAllPermissions) {
        // User must have ALL required permissions
        const hasAllPermissions = requirePermissions.every((permission) => user.permissions.includes(permission));
        if (!hasAllPermissions) {
          return {
            success: false,
            error: createMissingPermissionsError(requirePermissions, true),
          };
        }
      } else {
        // User must have AT LEAST ONE required permission
        const hasAnyPermission = requirePermissions.some((permission) => user.permissions.includes(permission));
        if (!hasAnyPermission) {
          return {
            success: false,
            error: createMissingPermissionsError(requirePermissions, false),
          };
        }
      }
    }

    // Check roles
    if (requireRoles.length > 0) {
      if (requireAllRoles) {
        // User must have ALL required roles
        const hasAllRoles = requireRoles.every((role) => user.roles.includes(role));
        if (!hasAllRoles) {
          return {
            success: false,
            error: createMissingRolesError(requireRoles, true),
          };
        }
      } else {
        // User must have AT LEAST ONE required role
        const hasAnyRole = requireRoles.some((role) => user.roles.includes(role));
        if (!hasAnyRole) {
          return {
            success: false,
            error: createMissingRolesError(requireRoles, false),
          };
        }
      }
    }

    return {
      success: true,
      user,
      session,
    };
  } catch (error) {
    return {
      success: false,
      error: createAuthError(error instanceof Error ? error.message : "Authentication error occurred", error),
    };
  }
}

/**
 * Helper function to create an authenticated API handler
 * This wraps your handler function and automatically handles auth checks
 *
 * @param handler - Your API route handler function
 * @param options - Auth middleware options
 * @returns Wrapped handler function
 *
 * @example
 * export default createAuthHandler(
 *   async (req, res, { user }) => {
 *     // Your handler code here
 *     // user is guaranteed to be defined and authenticated
 *     res.json({ message: `Hello ${user.name}` });
 *   },
 *   { requireAuth: true, requirePermissions: ["book:read"] }
 * );
 */
export function createAuthHandler(
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    context: { user: AuthenticatedUser; session: Session }
  ) => Promise<void> | void,
  options: AuthMiddlewareOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authResult = await withAuth(req, res, options);

    if (!authResult.success || !authResult.user || !authResult.session) {
      return res.status(authResult.error?.statusCode || 401).json({
        error: authResult.error?.message || "Authentication failed",
        code: authResult.error?.code || "AUTH_ERROR",
      });
    }

    return handler(req, res, {
      user: authResult.user,
      session: authResult.session,
    });
  };
}
