import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/server/prisma";
import bcrypt from "bcryptjs";
import { HttpStatusCodes } from "@/lib/server/errors";
import * as z from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  }

  try {
    // Validate input
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "Validation failed",
        details: validationResult.error.issues,
      });
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(HttpStatusCodes.CONFLICT).json({
        error: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // IMPORTANT: Public registration ALWAYS creates Customer users only.
    // Staff members (Admin, Editor, Finance Manager) must be created/invited by admins.
    // Get the Customer role - this is the ONLY role that can be assigned via public registration
    const customerRole = await prisma.role.findUnique({
      where: { name: "Customer" },
    });

    if (!customerRole) {
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Customer role not found. Please run the seed script first.",
      });
    }

    // Create user with Customer role ONLY
    // Staff roles must be assigned by admins through the admin panel
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isStaff: false, // Public registration always creates customers
        roles: {
          create: {
            roleId: customerRole.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return res.status(HttpStatusCodes.CREATED).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to create user",
    });
  }
}
