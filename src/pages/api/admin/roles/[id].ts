import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, createAuthHandler } from "@/lib/server";
import { HttpStatusCodes } from "@/lib/server/errors";
import * as z from "zod";
import { Prisma } from "@prisma/client";

const updateRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").optional(),
  description: z.string().optional().nullable(),
  permissionIds: z.array(z.string()).optional(),
});

/**
 * GET /api/admin/roles/[id] - Get role details
 * PUT /api/admin/roles/[id] - Update role
 * DELETE /api/admin/roles/[id] - Delete role
 * Requires: role:manage permission
 */
export default createAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }) => {
    if (!user || !user.permissions.includes("role:manage")) {
      return res.status(HttpStatusCodes.FORBIDDEN).json({
        error: "You do not have permission to manage roles",
      });
    }

    const { id } = req.query;

    if (req.method === "GET") {
      try {
        const role = await prisma.role.findUnique({
          where: { id: id as string },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
            _count: {
              select: {
                users: true,
              },
            },
          },
        });

        if (!role) {
          return res.status(HttpStatusCodes.NOT_FOUND).json({
            error: "Role not found",
          });
        }

        return res.status(HttpStatusCodes.OK).json({
          role: {
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: role.permissions.map((p) => p.permission),
            userCount: role._count.users,
          },
        });
      } catch (error) {
        console.error("Error fetching role:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to fetch role",
        });
      }
    }

    if (req.method === "PUT") {
      try {
        const validationResult = updateRoleSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            error: "Validation failed",
            details: validationResult.error.issues,
          });
        }

        const { name, description, permissionIds } = validationResult.data;

        // Check if role exists
        const existingRole = await prisma.role.findUnique({
          where: { id: id as string },
        });

        if (!existingRole) {
          return res.status(HttpStatusCodes.NOT_FOUND).json({
            error: "Role not found",
          });
        }

        // Check if name is being changed and if new name already exists
        if (name && name !== existingRole.name) {
          const nameExists = await prisma.role.findFirst({
            where: { name, id: { not: id as string } },
          });

          if (nameExists) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json({
              error: "Role with this name already exists",
            });
          }
        }

        // Verify permissions if provided
        if (permissionIds !== undefined) {
          const permissions = await prisma.permission.findMany({
            where: { id: { in: permissionIds } },
          });

          if (permissions.length !== permissionIds.length) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json({
              error: "One or more permissions not found",
            });
          }
        }

        // Update role
        const updateData: Prisma.RoleUpdateInput = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;

        // Update permissions if provided
        if (permissionIds !== undefined) {
          await prisma.$transaction([
            prisma.permissionsOnRoles.deleteMany({
              where: { roleId: id as string },
            }),
            ...permissionIds.map((permissionId) =>
              prisma.permissionsOnRoles.create({
                data: {
                  roleId: id as string,
                  permissionId,
                },
              })
            ),
          ]);
        }

        const updatedRole = await prisma.role.update({
          where: { id: id as string },
          data: updateData,
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
            _count: {
              select: {
                users: true,
              },
            },
          },
        });

        return res.status(HttpStatusCodes.OK).json({
          message: "Role updated successfully",
          role: {
            id: updatedRole.id,
            name: updatedRole.name,
            description: updatedRole.description,
            permissions: updatedRole.permissions.map((p) => p.permission),
            userCount: updatedRole._count.users,
          },
        });
      } catch (error) {
        console.error("Error updating role:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to update role",
        });
      }
    }

    if (req.method === "DELETE") {
      try {
        // Check if role has users assigned
        const role = await prisma.role.findUnique({
          where: { id: id as string },
          include: {
            _count: {
              select: {
                users: true,
              },
            },
          },
        });

        if (!role) {
          return res.status(HttpStatusCodes.NOT_FOUND).json({
            error: "Role not found",
          });
        }

        if (role._count.users > 0) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            error: `Cannot delete role with ${role._count.users} user(s) assigned. Please reassign users first.`,
          });
        }

        // Delete role permissions and role
        await prisma.$transaction([
          prisma.permissionsOnRoles.deleteMany({
            where: { roleId: id as string },
          }),
          prisma.role.delete({
            where: { id: id as string },
          }),
        ]);

        return res.status(HttpStatusCodes.OK).json({
          message: "Role deleted successfully",
        });
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "P2025") {
          return res.status(HttpStatusCodes.NOT_FOUND).json({
            error: "Role not found",
          });
        }
        console.error("Error deleting role:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to delete role",
        });
      }
    }

    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  },
  {
    requireAuth: true,
    requirePermissions: ["role:manage"],
  }
);
