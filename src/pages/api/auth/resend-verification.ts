import { createAuthHandler } from "@/lib/server";
import { sendVerificationEmail } from "@/lib/server/email";
import { HttpStatusCodes } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * POST /api/auth/resend-verification
 *
 * Resend verification email for the authenticated user
 */
export default createAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }) => {
    if (req.method !== "POST") {
      return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
        error: "Method not allowed",
      });
    }

    if (!user || !user.email) {
      return res.status(HttpStatusCodes.UNAUTHORIZED).json({
        error: "You must be logged in to resend verification email",
      });
    }

    try {
      // Check if user is already verified
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, email: true, name: true, emailVerified: true },
      });

      if (!dbUser) {
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          error: "User not found",
        });
      }

      if (dbUser.emailVerified) {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          error: "Email is already verified",
        });
      }

      // Delete any existing verification tokens for this user
      await prisma.verificationToken.deleteMany({
        where: { identifier: dbUser.email! },
      });

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const expires = new Date();
      expires.setHours(expires.getHours() + 24); // Token expires in 24 hours

      // Create verification token
      await prisma.verificationToken.create({
        data: {
          identifier: dbUser.email!,
          token: verificationToken,
          expires,
        },
      });

      // Send verification email (non-blocking - graceful degradation)
      sendVerificationEmail({
        email: dbUser.email!,
        name: dbUser.name || "User",
        token: verificationToken,
      }).catch((error) => {
        console.error("Failed to send verification email:", error);
        // Don't fail the request if email fails
      });

      return res.status(HttpStatusCodes.OK).json({
        message: "Verification email sent successfully. Please check your inbox.",
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to resend verification email",
      });
    }
  },
  {
    requireAuth: true,
  }
);
