import { APP_URL, IS_DEVELOPMENT } from "@/lib/server/constants/env";
import { HttpStatusCodes } from "@/lib/server/errors";
import { sendPasswordResetEmail } from "@/lib/server/email";
import { prisma } from "@/lib/server/prisma";
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import * as z from "zod";

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

    const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`;

    // Send password reset email
    const emailResult = await sendPasswordResetEmail({
      email: user.email!,
      name: user.name,
      resetUrl,
    });

    // In development, log the reset URL if email service is not available
    if (IS_DEVELOPMENT) {
      if (!emailResult.success) {
        console.warn("Email service unavailable. Password reset URL:", resetUrl);
      } else {
        console.log("Password reset email sent successfully");
      }
    }

    // If email failed but we're in development, still return the URL
    const response: { message: string; resetUrl?: string } = {
      message: "If an account with that email exists, a password reset link has been sent.",
    };

    // Only include resetUrl in development if email service is unavailable
    if (IS_DEVELOPMENT && !emailResult.success) {
      response.resetUrl = resetUrl;
    }

    return res.status(HttpStatusCodes.OK).json(response);
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to process password reset request",
    });
  }
}
