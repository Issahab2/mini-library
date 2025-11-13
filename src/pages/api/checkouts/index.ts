import { createCheckout, createMethodAuthHandler, prisma } from "@/lib/server";
import { CheckoutErrorCodes, HttpStatusCodes } from "@/lib/server/errors";
import type { CreateCheckoutInput } from "@/lib/server/types";
import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

// GET /api/checkouts - List all checkouts (requires checkout:manage permission)
// POST /api/checkouts - Create a new checkout (requires checkout:create permission) - AUTH REQUIRED
export default createMethodAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }) => {
    if (req.method === "GET") {
      // User is guaranteed to be defined due to method config
      if (!user || !user.permissions.includes("checkout:manage")) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          error: "You do not have permission to view all checkouts",
          code: CheckoutErrorCodes.CHECKOUT_CREATE_FAILED,
        });
      }

      const { page = "1", limit = "20", status = "all" } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const where: Prisma.CheckoutWhereInput = {};
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
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.checkout.count({ where }),
      ]);

      return res.status(HttpStatusCodes.OK).json({
        checkouts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    if (req.method === "POST") {
      // User is guaranteed to be defined due to method config
      // Checkout ALWAYS requires authentication
      if (!user || !user.permissions.includes("checkout:create")) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          error: "You do not have permission to create checkouts",
          code: CheckoutErrorCodes.CHECKOUT_CREATE_FAILED,
        });
      }

      const data: CreateCheckoutInput = req.body;

      // Validate required fields
      if (!data.bookId) {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          error: "Book ID is required",
          code: CheckoutErrorCodes.CHECKOUT_CREATE_FAILED,
        });
      }

      // Use authenticated user's ID if userId not provided
      const userId = data.userId || user.id;

      try {
        const checkout = await createCheckout({
          ...data,
          userId,
        });

        return res.status(HttpStatusCodes.CREATED).json({ checkout });
      } catch (error) {
        console.error("Error creating checkout:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create checkout";
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          error: errorMessage,
          code: CheckoutErrorCodes.CHECKOUT_CREATE_FAILED,
        });
      }
    }

    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  },
  {
    GET: { requireAuth: true, requirePermissions: ["checkout:manage"] }, // Auth required for viewing all
    POST: { requireAuth: true, requirePermissions: ["checkout:create"] }, // Auth REQUIRED for checkout
  }
);
