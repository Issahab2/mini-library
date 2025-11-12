import type { User } from "@prisma/client";
import type { Session } from "next-auth";

/**
 * Authenticated user type based on Prisma User model
 * Extends the base User type with roles and permissions from the session
 */
export type AuthenticatedUser = Pick<User, "id" | "name" | "email" | "image"> & {
  roles: string[];
  permissions: string[];
};

/**
 * Options for authentication and authorization middleware
 */
export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  requirePermissions?: string[];
  requireRoles?: string[];
  requireAllPermissions?: boolean; // If true, user must have ALL permissions; if false, ANY permission
  requireAllRoles?: boolean; // If true, user must have ALL roles; if false, ANY role
}

/**
 * Result returned by the authentication middleware
 */
export interface AuthMiddlewareResult {
  success: boolean;
  user?: AuthenticatedUser;
  session?: Session;
  error?: {
    code: string;
    message: string;
    statusCode: number;
  };
}
