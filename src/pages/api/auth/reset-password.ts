import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/server/prisma";
import bcrypt from "bcryptjs";
import { HttpStatusCodes } from "@/lib/server/errors";
import * as z from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
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
    const validationResult = resetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "Validation failed",
        details: validationResult.error.issues,
      });
    }

    const { token, password } = validationResult.data;

    // Find reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "Invalid or expired reset token",
      });
    }

    // Check if token has expired
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "Reset token has expired. Please request a new one.",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and delete reset token in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    return res.status(HttpStatusCodes.OK).json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to reset password",
    });
  }
}
