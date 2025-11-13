import { prisma } from "./prisma";

/**
 * Ensures a user has the Customer role assigned.
 * If the user has no roles, assigns the Customer role.
 * This is the default role for all users.
 *
 * @param userId - The ID of the user to check/assign role
 * @returns Promise<boolean> - Returns true if role was assigned, false if user already had roles
 */
export async function ensureCustomerRole(userId: string): Promise<boolean> {
  // Check if user has any roles
  const userWithRoles = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
    },
  });

  if (!userWithRoles) {
    throw new Error(`User with id ${userId} not found`);
  }

  // If user already has roles, no need to assign Customer role
  if (userWithRoles.roles && userWithRoles.roles.length > 0) {
    return false;
  }

  // Get the Customer role
  const customerRole = await prisma.role.findUnique({
    where: { name: "Customer" },
  });

  if (!customerRole) {
    console.error("Customer role not found. Please run the seed script first.");
    return false;
  }

  // Assign Customer role to user
  await prisma.rolesOnUsers.create({
    data: {
      userId: userWithRoles.id,
      roleId: customerRole.id,
    },
  });

  return true;
}
