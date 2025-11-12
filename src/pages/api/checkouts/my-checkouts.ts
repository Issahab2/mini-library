import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, createAuthHandler } from "@/lib/server";
import { HttpStatusCodes } from "@/lib/server/errors";
import { Prisma } from "@prisma/client";

// GET /api/checkouts/my-checkouts - Get current user's checkouts
export default createAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }) => {
    if (req.method !== "GET") {
      return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
        error: "Method not allowed",
      });
    }

    const { status = "all", page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.CheckoutWhereInput = {
      userId: user.id,
    };

    if (status === "active") {
      where.returnedDate = null;
    } else if (status === "returned") {
      where.returnedDate = { not: null };
    } else if (status === "overdue") {
      where.returnedDate = null;
      where.isOverdue = true;
    }

    const [checkouts, total] = await Promise.all([
      prisma.checkout.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { checkoutDate: "desc" },
        include: {
          book: true,
        },
      }),
      prisma.checkout.count({ where }),
    ]);

    // Update overdue status for active checkouts
    // Note: checkOverdueStatus returns a checkout without relations, so we merge the updated fields
    const checkoutsWithStatus = await Promise.all(
      checkouts.map(async (checkout) => {
        if (!checkout.returnedDate) {
          const { checkOverdueStatus } = await import("@/lib/server/checkout");
          const updated = await checkOverdueStatus(checkout.id);
          // Merge updated fields while preserving the book relation
          if (updated) {
            return {
              ...checkout,
              isOverdue: updated.isOverdue,
              overdueDays: updated.overdueDays,
              lateFeeAmount: updated.lateFeeAmount,
            };
          }
        }
        return checkout;
      })
    );

    return res.status(HttpStatusCodes.OK).json({
      checkouts: checkoutsWithStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  },
  {
    requireAuth: true,
  }
);
