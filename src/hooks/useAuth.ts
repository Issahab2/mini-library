import { useSession } from "next-auth/react";
import { useMemo } from "react";
import type { User } from "@prisma/client";

type UserWithPermissions = Pick<User, "id" | "name" | "email" | "image" | "isStaff" | "emailVerified"> & {
  roles: string[];
  permissions: string[];
};

/**
 * A custom hook to abstract and centralize authentication logic.
 *
 * It provides the current session status, user data,
 * and convenient helper functions for checking roles and permissions.
 */
export const useAuth = () => {
  const { data: session, status } = useSession();

  const authState = useMemo(() => {
    const user = session?.user as UserWithPermissions | undefined;
    const isAuthenticated = status === "authenticated";
    const isLoading = status === "loading";

    const roles = user?.roles || [];
    const permissions = user?.permissions || [];

    /**
     * Checks if the current user has a specific permission.
     * @param {string} permission - The permission string to check (e.g., "book:edit").
     * @returns {boolean} True if the user has the permission, false otherwise.
     */
    const hasPermission = (permission: string): boolean => {
      return permissions.includes(permission);
    };

    /**
     * Checks if the current user has a specific role.
     * @param {string} role - The role name to check (e.g., "Admin").
     * @returns {boolean} True if the user has the role, false otherwise.
     */
    const hasRole = (role: string): boolean => {
      return roles.includes(role);
    };

    /**
     * Checks if the current user is a staff member.
     * This flag is stored in the database and included in the session.
     */
    const isStaff = (user as UserWithPermissions & { isStaff?: boolean })?.isStaff || false;

    /**
     * Checks if the current user is a customer (authenticated but not staff).
     */
    const isCustomer = isAuthenticated && !isStaff;

    return {
      // Session status
      status,
      isLoading,
      isAuthenticated,
      isUnauthenticated: status === "unauthenticated",

      // User data
      user,
      userId: user?.id,

      // RBAC helpers
      roles,
      permissions,
      hasPermission,
      hasRole,

      // User type flags
      isStaff,
      isCustomer,

      session,
    };
  }, [session, status]);

  return authState;
};

export default useAuth;
