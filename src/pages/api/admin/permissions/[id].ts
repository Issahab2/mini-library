import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, createAuthHandler } from "@/lib/server";
import { HttpStatusCodes } from "@/lib/server/errors";
import * as z from "zod";
import { Prisma } from "@prisma/client";

const updatePermissionSchema = z.object({
  action: z.string().min(1, "Permission action is required").optional(),
  description: z.string().optional().nullable(),
});

/**
 * GET /api/admin/permissions/[id] - Get permission details
 * PUT /api/admin/permissions/[id] - Update permission
 * DELETE /api/admin/permissions/[id] - Delete permission
 * Requires: permission:manage permission
 */
export default createAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }) => {
    if (!user || !user.permissions.includes("permission:manage")) {
      return res.status(HttpStatusCodes.FORBIDDEN).json({
        error: "You do not have permission to manage permissions",
      });
    }

    const { id } = req.query;

    if (req.method === "GET") {
      try {
        const permission = await prisma.permission.findUnique({
          where: { id: id as string },
          include: {
            _count: {
              select: {
                roles: true,
              },
            },
          },
        });

        if (!permission) {
          return res.status(HttpStatusCodes.NOT_FOUND).json({
            error: "Permission not found",
          });
        }

        return res.status(HttpStatusCodes.OK).json({
          permission: {
            id: permission.id,
            action: permission.action,
            description: permission.description,
            roleCount: permission._count.roles,
          },
        });
      } catch (error) {
        console.error("Error fetching permission:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to fetch permission",
        });
      }
    }

    if (req.method === "PUT") {
      try {
        const validationResult = updatePermissionSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            error: "Validation failed",
            details: validationResult.error.issues,
          });
        }

        const { action, description } = validationResult.data;

        // Check if permission exists
        const existingPermission = await prisma.permission.findUnique({
          where: { id: id as string },
        });

        if (!existingPermission) {
          return res.status(HttpStatusCodes.NOT_FOUND).json({
            error: "Permission not found",
          });
        }

        // Check if action is being changed and if new action already exists
        if (action && action !== existingPermission.action) {
          const actionExists = await prisma.permission.findFirst({
            where: { action, id: { not: id as string } },
          });

          if (actionExists) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json({
              error: "Permission with this action already exists",
            });
          }
        }

        // Update permission
        const updateData: Prisma.PermissionUpdateInput = {};
        if (action !== undefined) updateData.action = action;
        if (description !== undefined) updateData.description = description;

        const updatedPermission = await prisma.permission.update({
          where: { id: id as string },
          data: updateData,
          include: {
            _count: {
              select: {
                roles: true,
              },
            },
          },
        });

        return res.status(HttpStatusCodes.OK).json({
          message: "Permission updated successfully",
          permission: {
            id: updatedPermission.id,
            action: updatedPermission.action,
            description: updatedPermission.description,
            roleCount: updatedPermission._count.roles,
          },
        });
      } catch (error) {
        console.error("Error updating permission:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to update permission",
        });
      }
    }

    if (req.method === "DELETE") {
      try {
        // Check if permission is assigned to any roles
        const permission = await prisma.permission.findUnique({
          where: { id: id as string },
          include: {
            _count: {
              select: {
                roles: true,
              },
            },
          },
        });

        if (!permission) {
          return res.status(HttpStatusCodes.NOT_FOUND).json({
            error: "Permission not found",
          });
        }

        if (permission._count.roles > 0) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            error: `Cannot delete permission assigned to ${permission._count.roles} role(s). Please remove from roles first.`,
          });
        }

        // Delete permission
        await prisma.permission.delete({
          where: { id: id as string },
        });

        return res.status(HttpStatusCodes.OK).json({
          message: "Permission deleted successfully",
        });
      } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
          return res.status(HttpStatusCodes.NOT_FOUND).json({ error: "Permission not found" });
        }
        console.error("Error deleting permission:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to delete permission" });
      }
    }

    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  },
  {
    requireAuth: true,
    requirePermissions: ["permission:manage"],
  }
);
