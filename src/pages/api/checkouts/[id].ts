import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, createMethodAuthHandler, returnCheckout } from "@/lib/server";
import {
  createCheckoutNotFoundError,
  createCheckoutAlreadyReturnedError,
  HttpStatusCodes,
  CheckoutErrorCodes,
} from "@/lib/server/errors";

// GET /api/checkouts/[id] - Get single checkout (auth required)
// PUT /api/checkouts/[id] - Return a book (requires checkout:return or checkout:manage permission) - AUTH REQUIRED
export default createMethodAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }) => {
    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "Invalid checkout ID",
      });
    }

    if (req.method === "GET") {
      const checkout = await prisma.checkout.findUnique({
        where: { id },
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
        const error = createCheckoutNotFoundError(id);
        return res.status(error.statusCode).json(error);
      }

      // User is guaranteed to be defined due to method config
      // Check if user can view this checkout
      // Users can view their own checkouts, or if they have checkout:manage permission
      if (!user || (checkout.userId !== user.id && !user.permissions.includes("checkout:manage"))) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          error: "You do not have permission to view this checkout",
          code: CheckoutErrorCodes.CHECKOUT_CREATE_FAILED,
        });
      }

      return res.status(HttpStatusCodes.OK).json({ checkout });
    }

    if (req.method === "PUT") {
      // User is guaranteed to be defined due to method config
      if (!user) {
        return res.status(HttpStatusCodes.UNAUTHORIZED).json({
          error: "Authentication required",
          code: "UNAUTHORIZED",
        });
      }

      // Check permission - users can return their own checkouts, or if they have checkout:manage
      const checkout = await prisma.checkout.findUnique({
        where: { id },
      });

      if (!checkout) {
        const error = createCheckoutNotFoundError(id);
        return res.status(error.statusCode).json(error);
      }

      // Check if user can return this checkout
      const canReturn =
        checkout.userId === user.id ||
        user.permissions.includes("checkout:return") ||
        user.permissions.includes("checkout:manage");

      if (!canReturn) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          error: "You do not have permission to return this checkout",
          code: CheckoutErrorCodes.CHECKOUT_RETURN_FAILED,
        });
      }

      if (checkout.returnedDate) {
        const error = createCheckoutAlreadyReturnedError(id);
        return res.status(error.statusCode).json(error);
      }

      try {
        const returnedCheckout = await returnCheckout(id);

        return res.status(HttpStatusCodes.OK).json({ checkout: returnedCheckout });
      } catch (error) {
        console.error("Error returning checkout:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to return checkout";
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          error: errorMessage,
          code: CheckoutErrorCodes.CHECKOUT_RETURN_FAILED,
        });
      }
    }

    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  },
  {
    GET: { requireAuth: true }, // Auth required to view checkout
    PUT: { requireAuth: true }, // Auth REQUIRED to return book
  }
);
