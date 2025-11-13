import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, createAuthHandler, ensureCustomerRole } from "@/lib/server";
import { HttpStatusCodes } from "@/lib/server/errors";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { Prisma } from "@prisma/client";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isStaff: z.boolean().default(false),
  maxCheckoutLimit: z.number().int().min(1).default(5),
  emailVerified: z.boolean().default(false),
});

/**
 * GET /api/admin/users - List all users with pagination
 * POST /api/admin/users - Create a new user
 * Requires: user:manage permission
 */
export default createAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }) => {
    if (!user || !user.permissions.includes("user:manage")) {
      return res.status(HttpStatusCodes.FORBIDDEN).json({
        error: "You do not have permission to manage users",
      });
    }

    if (req.method === "POST") {
      try {
        const validationResult = createUserSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            error: "Validation failed",
            details: validationResult.error.issues,
          });
        }

        const { name, email, password, isStaff, maxCheckoutLimit, emailVerified } = validationResult.data;

        // Check if user with email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            error: "User with this email already exists",
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            isStaff,
            maxCheckoutLimit,
            emailVerified: emailVerified ? new Date() : null,
          },
          select: {
            id: true,
            name: true,
            email: true,
            isStaff: true,
            maxCheckoutLimit: true,
            emailVerified: true,
          },
        });

        // Ensure user has Customer role if no roles are assigned
        await ensureCustomerRole(newUser.id);

        return res.status(HttpStatusCodes.CREATED).json({
          message: "User created successfully",
          user: newUser,
        });
      } catch (error) {
        console.error("Error creating user:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to create user",
        });
      }
    }

    if (req.method !== "GET") {
      return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
        error: "Method not allowed",
      });
    }

    try {
      const { page = "1", limit = "20", search = "", isStaff } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const where: Prisma.UserWhereInput = {};

      // Filter by staff status if provided
      if (isStaff !== undefined) {
        where.isStaff = isStaff === "true";
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: "insensitive" } },
          { email: { contains: search as string, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { email: "asc" },
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
                  select: {
                    id: true,
                    name: true,
                    description: true,
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
        }),
        prisma.user.count({ where }),
      ]);

      return res.status(HttpStatusCodes.OK).json({
        users: users.map((u) => ({
          ...u,
          roles: u.roles.map((r) => r.role),
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to fetch users",
      });
    }
  },
  {
    requireAuth: true,
    requirePermissions: ["user:manage"],
  }
);
