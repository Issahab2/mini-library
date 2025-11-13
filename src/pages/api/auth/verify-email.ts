import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/server/prisma";
import { HttpStatusCodes } from "@/lib/server/errors";
import * as z from "zod";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Support both GET (from email links) and POST requests
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  }

  try {
    // Get token from query params (GET) or body (POST)
    let token: string | undefined;
    if (req.method === "GET") {
      const queryToken = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
      // Next.js automatically decodes query params, but handle edge cases
      if (typeof queryToken === "string") {
        try {
          // Only decode if it looks encoded (contains %)
          token = queryToken.includes("%") ? decodeURIComponent(queryToken) : queryToken;
        } catch {
          // If decoding fails, use the original token
          token = queryToken;
        }
      }
    } else {
      token = typeof req.body?.token === "string" ? req.body.token : undefined;
    }

    // Validate input
    const validationResult = verifyEmailSchema.safeParse({ token });
    if (!validationResult.success) {
      // For GET requests, redirect to a page with error message
      if (req.method === "GET") {
        return res.redirect(
          `/auth/error?error=VerificationFailed&message=${encodeURIComponent("Invalid or missing verification token")}`
        );
      }
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "Validation failed",
        details: validationResult.error.issues,
      });
    }

    const { token: validatedToken } = validationResult.data;

    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: validatedToken },
    });

    if (!verificationToken) {
      if (req.method === "GET") {
        return res.redirect(
          `/auth/error?error=VerificationFailed&message=${encodeURIComponent("Invalid or expired verification token")}`
        );
      }
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "Invalid or expired verification token",
      });
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token: validatedToken },
      });

      if (req.method === "GET") {
        return res.redirect(
          `/auth/error?error=VerificationExpired&message=${encodeURIComponent("Verification token has expired. Please request a new one.")}`
        );
      }

      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "Verification token has expired. Please request a new one.",
      });
    }

    // Find user by email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      if (req.method === "GET") {
        return res.redirect(`/auth/error?error=UserNotFound&message=${encodeURIComponent("User not found")}`);
      }
      return res.status(HttpStatusCodes.NOT_FOUND).json({
        error: "User not found",
      });
    }

    // Check if user is already verified
    if (user.emailVerified) {
      // Delete the token since it's already been used
      await prisma.verificationToken
        .delete({
          where: { token: validatedToken },
        })
        .catch(() => {
          // Ignore errors if token was already deleted
        });

      if (req.method === "GET") {
        return res.redirect("/auth/signin?verified=true&alreadyVerified=true");
      }
      return res.status(HttpStatusCodes.OK).json({
        message: "Email is already verified",
      });
    }

    // Update user email verification status and delete token in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { token: validatedToken },
      }),
    ]);

    // For GET requests, redirect to success page
    if (req.method === "GET") {
      return res.redirect("/auth/signin?verified=true");
    }

    return res.status(HttpStatusCodes.OK).json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to verify email",
    });
  }
}
