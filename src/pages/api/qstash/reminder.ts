import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/server/prisma";
import { sendOverdueReminderEmail } from "@/lib/server/email";
import { HttpStatusCodes } from "@/lib/server/errors";
import { verifySignature } from "@upstash/qstash/nextjs";
import { QSTASH_TOKEN } from "@/lib/server/constants/env";

// Disable body parsing for QStash signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * QStash webhook endpoint to handle overdue book reminders
 * This endpoint is called by QStash when a scheduled reminder is triggered
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  }

  try {
    // verifySignature parses the body automatically
    // req.body will be the parsed JSON after verification
    const body = req.body as { checkoutId?: string; type?: string };
    const { checkoutId, type } = body;

    if (!checkoutId || type !== "overdue_reminder") {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "Invalid request body",
      });
    }

    // Fetch checkout with book and user details
    const checkout = await prisma.checkout.findUnique({
      where: { id: checkoutId },
      include: {
        book: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!checkout) {
      console.warn(`[QStash Webhook] Checkout ${checkoutId} not found`);
      return res.status(HttpStatusCodes.NOT_FOUND).json({
        error: "Checkout not found",
      });
    }

    // Check if book has already been returned
    if (checkout.returnedDate) {
      console.log(`[QStash Webhook] Checkout ${checkoutId} already returned, skipping reminder`);
      return res.status(HttpStatusCodes.OK).json({
        message: "Checkout already returned, reminder skipped",
      });
    }

    // Update overdue status
    const { calculateLateFees } = await import("@/lib/server/checkout");
    const { isOverdue, overdueDays, lateFeeAmount } = calculateLateFees(
      checkout.dueDate,
      Number(checkout.lateFeePerDay)
    );

    // Update checkout with current overdue status
    await prisma.checkout.update({
      where: { id: checkoutId },
      data: {
        isOverdue,
        overdueDays,
        lateFeeAmount: isOverdue ? lateFeeAmount : null,
      },
    });

    // Send overdue reminder email (non-blocking - graceful degradation)
    if (checkout.user.email) {
      sendOverdueReminderEmail({
        email: checkout.user.email,
        name: checkout.user.name || "User",
        bookTitle: checkout.book.title,
        bookAuthor: checkout.book.author,
        dueDate: checkout.dueDate,
        overdueDays: overdueDays > 0 ? overdueDays : 0,
        lateFeeAmount: lateFeeAmount > 0 ? lateFeeAmount : null,
      }).catch((error) => {
        console.error("Failed to send overdue reminder email:", error);
        // Don't fail the webhook if email fails
      });
    }

    return res.status(HttpStatusCodes.OK).json({
      message: "Reminder processed successfully",
      checkoutId,
    });
  } catch (error) {
    console.error("[QStash Webhook] Error processing reminder:", error);
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to process reminder",
    });
  }
}

// Verify QStash signature if token is configured

// Conditionally wrap handler with signature verification
const wrappedHandler = QSTASH_TOKEN
  ? verifySignature(handler)
  : (() => {
      // Log warning if QStash is not configured
      console.warn("[QStash Webhook] QSTASH_TOKEN not configured. Webhook signature verification is disabled.");
      return handler;
    })();

export default wrappedHandler;
