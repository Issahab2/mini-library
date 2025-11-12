import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, createMethodAuthHandler } from "@/lib/server";
import type { CreateChapterInput } from "@/lib/server/types";
import { createBookNotFoundError, HttpStatusCodes, BookErrorCodes } from "@/lib/server/errors";

// GET /api/chapters - Get chapters by bookId (public)
// POST /api/chapters - Create a new chapter (requires book:update permission)
export default createMethodAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }) => {
    if (req.method === "GET") {
      const { bookId } = req.query;

      if (!bookId || typeof bookId !== "string") {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          error: "Book ID is required",
        });
      }

      // Verify book exists
      const book = await prisma.book.findUnique({
        where: { id: bookId },
      });

      if (!book) {
        const error = createBookNotFoundError(bookId);
        return res.status(error.statusCode).json(error);
      }

      const chapters = await prisma.chapter.findMany({
        where: { bookId },
        orderBy: { order: "asc" },
      });

      return res.status(HttpStatusCodes.OK).json({ chapters });
    }

    if (req.method === "POST") {
      // User is guaranteed to be defined due to method config
      if (!user || !user.permissions.includes("book:update")) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          error: "You do not have permission to create chapters",
          code: BookErrorCodes.BOOK_UPDATE_FAILED,
        });
      }

      const data: CreateChapterInput = req.body;

      // Validate required fields
      if (!data.title || !data.bookId || data.order === undefined) {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          error: "Title, bookId, and order are required",
          code: BookErrorCodes.BOOK_UPDATE_FAILED,
        });
      }

      // Verify book exists
      const book = await prisma.book.findUnique({
        where: { id: data.bookId },
      });

      if (!book) {
        const error = createBookNotFoundError(data.bookId);
        return res.status(error.statusCode).json(error);
      }

      try {
        const chapter = await prisma.chapter.create({
          data: {
            title: data.title,
            content: data.content,
            order: data.order,
            bookId: data.bookId,
          },
        });

        return res.status(HttpStatusCodes.CREATED).json({ chapter });
      } catch (error) {
        console.error("Error creating chapter:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to create chapter",
          code: BookErrorCodes.BOOK_UPDATE_FAILED,
        });
      }
    }

    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  },
  {
    GET: { requireAuth: false }, // Public read access
    POST: { requireAuth: true, requirePermissions: ["book:update"] }, // Auth required for create
  }
);
