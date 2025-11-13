import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, createAuthHandler } from "@/lib/server";
import { ADMIN_EMAIL } from "@/lib/server/constants/env";
import { HttpStatusCodes } from "@/lib/server/errors";
import bcrypt from "bcryptjs";
import * as z from "zod";

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  isStaff: z.boolean().optional(),
  maxCheckoutLimit: z.number().int().min(1).optional(),
  password: z.string().min(6).optional(),
});

const updateRolesSchema = z.object({
  roleIds: z.array(z.string()),
});

/**
 * GET /api/admin/users/[id] - Get user details
 * PUT /api/admin/users/[id] - Update user
 * PUT /api/admin/users/[id]/roles - Update user roles
 */
export default createAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }) => {
    if (!user || !user.permissions.includes("user:manage")) {
      return res.status(HttpStatusCodes.FORBIDDEN).json({
        error: "You do not have permission to manage users",
      });
    }

    const { id } = req.query;

    if (req.method === "GET") {
      try {
        const userData = await prisma.user.findUnique({
          where: { id: id as string },
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            image: true,
            isStaff: true,
            maxCheckoutLimit: true,
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                checkouts: true,
              },
            },
          },
        });

        if (!userData) {
          return res.status(HttpStatusCodes.NOT_FOUND).json({
            error: "User not found",
          });
        }

        return res.status(HttpStatusCodes.OK).json({
          user: {
            ...userData,
            roles: userData.roles.map((r) => ({
              id: r.role.id,
              name: r.role.name,
              description: r.role.description,
              permissions: r.role.permissions.map((p) => p.permission),
            })),
          },
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to fetch user",
        });
      }
    }

    if (req.method === "PUT") {
      try {
        // Check if this is a roles update
        if (req.body.roleIds !== undefined) {
          const validationResult = updateRolesSchema.safeParse(req.body);
          if (!validationResult.success) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json({
              error: "Validation failed",
              details: validationResult.error.issues,
            });
          }

          const { roleIds } = validationResult.data;

          // Verify all roles exist
          const roles = await prisma.role.findMany({
            where: { id: { in: roleIds } },
          });

          if (roles.length !== roleIds.length) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json({
              error: "One or more roles not found",
            });
          }

          // Update user roles
          await prisma.$transaction([
            prisma.rolesOnUsers.deleteMany({
              where: { userId: id as string },
            }),
            ...roleIds.map((roleId) =>
              prisma.rolesOnUsers.create({
                data: {
                  userId: id as string,
                  roleId,
                },
              })
            ),
          ]);

          return res.status(HttpStatusCodes.OK).json({
            message: "User roles updated successfully",
          });
        }

        // Regular user update
        const validationResult = updateUserSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            error: "Validation failed",
            details: validationResult.error.issues,
          });
        }

        const updateData: Record<string, unknown> = {};
        if (validationResult.data.name !== undefined) {
          updateData.name = validationResult.data.name;
        }
        if (validationResult.data.email !== undefined) {
          updateData.email = validationResult.data.email;
        }
        if (validationResult.data.isStaff !== undefined) {
          updateData.isStaff = validationResult.data.isStaff;
        }
        if (validationResult.data.maxCheckoutLimit !== undefined) {
          updateData.maxCheckoutLimit = validationResult.data.maxCheckoutLimit;
        }
        if (validationResult.data.password) {
          updateData.password = await bcrypt.hash(validationResult.data.password, 10);
        }

        const updatedUser = await prisma.user.update({
          where: { id: id as string },
          data: updateData,
          select: {
            id: true,
            name: true,
            email: true,
            isStaff: true,
            maxCheckoutLimit: true,
          },
        });

        return res.status(HttpStatusCodes.OK).json({
          message: "User updated successfully",
          user: updatedUser,
        });
      } catch (error) {
        console.error("Error updating user:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to update user",
        });
      }
    }

    if (req.method === "DELETE") {
      try {
        // Get user to check if it's the admin user
        const userToDelete = await prisma.user.findUnique({
          where: { id: id as string },
          select: {
            id: true,
            email: true,
          },
        });

        if (!userToDelete) {
          return res.status(HttpStatusCodes.NOT_FOUND).json({
            error: "User not found",
          });
        }

        // Prevent deletion of the admin user
        if (userToDelete.email === ADMIN_EMAIL) {
          return res.status(HttpStatusCodes.FORBIDDEN).json({
            error: "Cannot delete the admin user. This account is protected.",
          });
        }

        // Check if user has active checkouts
        const activeCheckouts = await prisma.checkout.count({
          where: {
            userId: id as string,
            returnedDate: null,
          },
        });

        if (activeCheckouts > 0) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            error: `Cannot delete user with ${activeCheckouts} active checkout(s). Please return all books first.`,
          });
        }

        // Delete user accounts, sessions, and other related records
        await prisma.$transaction([
          prisma.account.deleteMany({
            where: { userId: id as string },
          }),
          prisma.session.deleteMany({
            where: { userId: id as string },
          }),
          prisma.passwordResetToken.deleteMany({
            where: { userId: id as string },
          }),
          prisma.rolesOnUsers.deleteMany({
            where: { userId: id as string },
          }),
          prisma.user.delete({
            where: { id: id as string },
          }),
        ]);

        return res.status(HttpStatusCodes.OK).json({
          message: "User deleted successfully",
        });
      } catch (error: unknown) {
        if (error instanceof Error && "code" in error && error.code === "P2025") {
          return res.status(HttpStatusCodes.NOT_FOUND).json({
            error: "User not found",
          });
        }
        console.error("Error deleting user:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to delete user",
        });
      }
    }

    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  },
  {
    requireAuth: true,
    requirePermissions: ["user:manage"],
  }
);
