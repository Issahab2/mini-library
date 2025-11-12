import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/server/prisma";
import { HttpStatusCodes } from "@/lib/server/errors";
import * as z from "zod";
import crypto from "crypto";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  }

  try {
    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "Validation failed",
        details: validationResult.error.issues,
      });
    }

    const { email } = validationResult.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      // Still return success to prevent email enumeration
      return res.status(HttpStatusCodes.OK).json({
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expires,
      },
    });

    // In a real application, you would send an email here
    // For now, we'll return the token in development (remove in production!)
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetUrl);

    // In development, log the reset URL (remove in production!)
    if (process.env.NODE_ENV === "development") {
      console.log("Password reset URL:", resetUrl);
    }

    return res.status(HttpStatusCodes.OK).json({
      message: "If an account with that email exists, a password reset link has been sent.",
      // Only include in development
      ...(process.env.NODE_ENV === "development" && { resetUrl }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to process password reset request",
    });
  }
}
