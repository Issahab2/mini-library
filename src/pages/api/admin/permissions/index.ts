import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, createAuthHandler } from "@/lib/server";
import { HttpStatusCodes } from "@/lib/server/errors";
import * as z from "zod";

const createPermissionSchema = z.object({
  action: z.string().min(1, "Permission action is required"),
  description: z.string().optional().nullable(),
});

/**
 * GET /api/admin/permissions - List all permissions
 * POST /api/admin/permissions - Create a new permission
 * Requires: permission:manage permission
 */
export default createAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }) => {
    if (!user || !user.permissions.includes("permission:manage")) {
      return res.status(HttpStatusCodes.FORBIDDEN).json({
        error: "You do not have permission to manage permissions",
      });
    }

    if (req.method === "POST") {
      try {
        const validationResult = createPermissionSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            error: "Validation failed",
            details: validationResult.error.issues,
          });
        }

        const { action, description } = validationResult.data;

        // Check if permission with action already exists
        const existingPermission = await prisma.permission.findFirst({
          where: { action },
        });

        if (existingPermission) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            error: "Permission with this action already exists",
          });
        }

        // Create permission
        const newPermission = await prisma.permission.create({
          data: {
            action,
            description,
          },
          include: {
            _count: {
              select: {
                roles: true,
              },
            },
          },
        });

        return res.status(HttpStatusCodes.CREATED).json({
          message: "Permission created successfully",
          permission: {
            id: newPermission.id,
            action: newPermission.action,
            description: newPermission.description,
            roleCount: newPermission._count.roles,
          },
        });
      } catch (error) {
        console.error("Error creating permission:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to create permission",
        });
      }
    }

    if (req.method !== "GET") {
      return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
        error: "Method not allowed",
      });
    }

    if (!user || !user.permissions.includes("permission:manage")) {
      return res.status(HttpStatusCodes.FORBIDDEN).json({
        error: "You do not have permission to view permissions",
      });
    }

    try {
      const permissions = await prisma.permission.findMany({
        orderBy: { action: "asc" },
        include: {
          _count: {
            select: {
              roles: true,
            },
          },
        },
      });

      return res.status(HttpStatusCodes.OK).json({
        permissions: permissions.map((p) => ({
          id: p.id,
          action: p.action,
          description: p.description,
          roleCount: p._count.roles,
        })),
      });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to fetch permissions",
      });
    }
  },
  {
    requireAuth: true,
    requirePermissions: ["permission:manage"],
  }
);
