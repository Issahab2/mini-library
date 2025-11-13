import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, createAuthHandler } from "@/lib/server";
import { HttpStatusCodes } from "@/lib/server/errors";
import * as z from "zod";

const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional().nullable(),
  permissionIds: z.array(z.string()).default([]),
});

/**
 * GET /api/admin/roles - List all roles with their permissions
 * POST /api/admin/roles - Create a new role
 * Requires: role:manage permission
 */
export default createAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }) => {
    if (!user || !user.permissions.includes("role:manage")) {
      return res.status(HttpStatusCodes.FORBIDDEN).json({
        error: "You do not have permission to manage roles",
      });
    }

    if (req.method === "POST") {
      try {
        const validationResult = createRoleSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            error: "Validation failed",
            details: validationResult.error.issues,
          });
        }

        const { name, description, permissionIds } = validationResult.data;

        // Check if role with name already exists
        const existingRole = await prisma.role.findFirst({
          where: { name },
        });

        if (existingRole) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            error: "Role with this name already exists",
          });
        }

        // Verify all permissions exist
        if (permissionIds.length > 0) {
          const permissions = await prisma.permission.findMany({
            where: { id: { in: permissionIds } },
          });

          if (permissions.length !== permissionIds.length) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json({
              error: "One or more permissions not found",
            });
          }
        }

        // Create role with permissions
        const newRole = await prisma.role.create({
          data: {
            name,
            description,
            permissions: {
              create: permissionIds.map((permissionId) => ({
                permissionId,
              })),
            },
          },
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

        return res.status(HttpStatusCodes.CREATED).json({
          message: "Role created successfully",
          role: {
            id: newRole.id,
            name: newRole.name,
            description: newRole.description,
            permissions: newRole.permissions.map((p) => p.permission),
            userCount: newRole._count.users,
          },
        });
      } catch (error) {
        console.error("Error creating role:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to create role",
        });
      }
    }

    if (req.method !== "GET") {
      return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
        error: "Method not allowed",
      });
    }

    if (!user || !user.permissions.includes("role:manage")) {
      return res.status(HttpStatusCodes.FORBIDDEN).json({
        error: "You do not have permission to view roles",
      });
    }

    try {
      const roles = await prisma.role.findMany({
        orderBy: { name: "asc" },
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
        roles: roles.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions.map((p) => p.permission),
          userCount: role._count.users,
        })),
      });
    } catch (error) {
      console.error("Error fetching roles:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to fetch roles",
      });
    }
  },
  {
    requireAuth: true,
    requirePermissions: ["role:manage"],
  }
);
