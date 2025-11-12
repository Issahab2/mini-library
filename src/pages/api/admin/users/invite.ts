import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, createAuthHandler } from "@/lib/server";
import { HttpStatusCodes } from "@/lib/server/errors";
import bcrypt from "bcryptjs";
import * as z from "zod";

const inviteUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Admin", "Editor", "Finance Manager", "Customer"]),
});

/**
 * POST /api/admin/users/invite
 *
 * Admin-only endpoint to invite/create staff members or users.
 * This is the ONLY way to create users with staff roles (Admin, Editor, Finance Manager).
 * Public registration always creates Customer users.
 */
export default createAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }) => {
    if (req.method !== "POST") {
      return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
        error: "Method not allowed",
      });
    }

    // Check if user has permission to manage users
    if (!user || !user.permissions.includes("user:manage")) {
      return res.status(HttpStatusCodes.FORBIDDEN).json({
        error: "You do not have permission to invite users",
      });
    }

    try {
      // Validate input
      const validationResult = inviteUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          error: "Validation failed",
          details: validationResult.error.issues,
        });
      }

      const { name, email, password, role } = validationResult.data;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(HttpStatusCodes.CONFLICT).json({
          error: "User with this email already exists",
        });
      }

      // Get the requested role
      const requestedRole = await prisma.role.findUnique({
        where: { name: role },
      });

      if (!requestedRole) {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          error: `Role "${role}" not found. Available roles: Admin, Editor, Finance Manager, Customer`,
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with the specified role
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          maxCheckoutLimit: 10, // Staff get higher limits,
          isStaff: true,
          roles: {
            create: {
              roleId: requestedRole.id,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          roles: {
            include: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return res.status(HttpStatusCodes.CREATED).json({
        message: `User created successfully with role: ${role}`,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.roles[0]?.role.name,
        },
      });
    } catch (error) {
      console.error("User invitation error:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to create user",
      });
    }
  },
  {
    requireAuth: true,
    requirePermissions: ["user:manage"],
  }
);
