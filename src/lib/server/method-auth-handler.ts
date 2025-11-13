import { authOptions } from "@/pages/api/auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import {
  createAuthError,
  createInvalidSessionError,
  createMissingPermissionsError,
  createMissingRolesError,
  createUnauthorizedError,
} from "./errors";
import type { AuthenticatedUser, AuthMiddlewareOptions } from "./types/auth";

/**
 * Method-based authentication configuration
 */
export interface MethodAuthConfig {
  [method: string]: AuthMiddlewareOptions;
}

/**
 * Context passed to handler - user and session are optional
 */
export interface MethodAuthContext {
  user?: AuthenticatedUser;
  session?: Session;
}

/**
 * Creates an API handler with method-based authentication requirements
 *
 * @param handler - Your API route handler function
 * @param methodConfig - Configuration for each HTTP method's auth requirements
 * @returns Wrapped handler function
 *
 * @example
 * export default createMethodAuthHandler(
 *   async (req, res, { user, session }) => {
 *     if (req.method === "GET") {
 *       // Public endpoint - user may be undefined
 *       return res.json({ books: [] });
 *     }
 *     if (req.method === "POST") {
 *       // Requires auth - user is guaranteed to be defined
 *       return res.json({ message: `Hello ${user.name}` });
 *     }
 *   },
 *   {
 *     GET: { requireAuth: false },
 *     POST: { requireAuth: true, requirePermissions: ["book:create"] }
 *   }
 * );
 */
export function createMethodAuthHandler(
  handler: (req: NextApiRequest, res: NextApiResponse, context: MethodAuthContext) => Promise<void> | void,
  methodConfig: MethodAuthConfig
) {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const method = req.method || "GET";
    const config = methodConfig[method] || { requireAuth: false };

    // If no auth required for this method, call handler without auth
    if (!config.requireAuth) {
      return handler(req, res, {});
    }

    // Auth is required - get session and validate
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        const error = createUnauthorizedError();
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
        });
        return;
      }

      if (!session.user) {
        const error = createInvalidSessionError();
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
        });
        return;
      }

      const user: AuthenticatedUser = {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        roles: session.user.roles || [],
        permissions: session.user.permissions || [],
      };

      // Check permissions if required
      if (config.requirePermissions && config.requirePermissions.length > 0) {
        if (config.requireAllPermissions) {
          const hasAllPermissions = config.requirePermissions.every((permission) =>
            user.permissions.includes(permission)
          );
          if (!hasAllPermissions) {
            const error = createMissingPermissionsError(config.requirePermissions, true);
            res.status(error.statusCode).json({
              error: error.message,
              code: error.code,
            });
            return;
          }
        } else {
          const hasAnyPermission = config.requirePermissions.some((permission) =>
            user.permissions.includes(permission)
          );
          if (!hasAnyPermission) {
            const error = createMissingPermissionsError(config.requirePermissions, false);
            res.status(error.statusCode).json({
              error: error.message,
              code: error.code,
            });
            return;
          }
        }
      }

      // Check roles if required
      if (config.requireRoles && config.requireRoles.length > 0) {
        if (config.requireAllRoles) {
          const hasAllRoles = config.requireRoles.every((role) => user.roles.includes(role));
          if (!hasAllRoles) {
            const error = createMissingRolesError(config.requireRoles, true);
            res.status(error.statusCode).json({
              error: error.message,
              code: error.code,
            });
            return;
          }
        } else {
          const hasAnyRole = config.requireRoles.some((role) => user.roles.includes(role));
          if (!hasAnyRole) {
            const error = createMissingRolesError(config.requireRoles, false);
            res.status(error.statusCode).json({
              error: error.message,
              code: error.code,
            });
            return;
          }
        }
      }

      // All checks passed - call handler with authenticated context
      return handler(req, res, { user, session });
    } catch (error) {
      const authError = createAuthError(
        error instanceof Error ? error.message : "Authentication error occurred",
        error
      );
      res.status(authError.statusCode).json({
        error: authError.message,
        code: authError.code,
      });
      return;
    }
  };
}
