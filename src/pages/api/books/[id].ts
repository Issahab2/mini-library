import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, createMethodAuthHandler } from "@/lib/server";
import type { UpdateBookInput } from "@/lib/server/types";
import { createBookNotFoundError, HttpStatusCodes, BookErrorCodes } from "@/lib/server/errors";

// GET /api/books/[id] - Get single book (public)
// PUT /api/books/[id] - Update book (requires book:update permission)
// DELETE /api/books/[id] - Delete book (requires book:delete permission)
export default createMethodAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }): Promise<void> => {
    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "Invalid book ID",
      });
    }

    if (req.method === "GET") {
      const { includeChapters = "true" } = req.query;

      const book = await prisma.book.findUnique({
        where: { id },
        include: {
          ...(includeChapters === "true" && {
            chapters: { orderBy: { order: "asc" } },
          }),
          checkouts: {
            where: {
              returnedDate: null,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!book) {
        const error = createBookNotFoundError(id);
        return res.status(error.statusCode).json(error);
      }

      // Update status based on active checkouts
      const activeCheckouts = book.checkouts || [];
      const status = activeCheckouts.length > 0 ? "CHECKED_OUT" : "AVAILABLE";

      return res.status(HttpStatusCodes.OK).json({
        book: {
          ...book,
          status,
        },
      });
    }

    if (req.method === "PUT") {
      // User is guaranteed to be defined due to method config
      if (!user || !user.permissions.includes("book:update")) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          error: "You do not have permission to update books",
          code: BookErrorCodes.BOOK_UPDATE_FAILED,
        });
      }

      const book = await prisma.book.findUnique({
        where: { id },
      });

      if (!book) {
        const error = createBookNotFoundError(id);
        return res.status(error.statusCode).json(error);
      }

      const data: UpdateBookInput = req.body;

      try {
        const updatedBook = await prisma.book.update({
          where: { id },
          data: {
            ...(data.title && { title: data.title }),
            ...(data.author && { author: data.author }),
            ...(data.isbn !== undefined && { isbn: data.isbn }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.summary !== undefined && { summary: data.summary }),
            ...(data.publisher !== undefined && { publisher: data.publisher }),
            ...(data.publicationYear !== undefined && { publicationYear: data.publicationYear }),
            ...(data.genre !== undefined && { genre: data.genre }),
            ...(data.pageCount !== undefined && { pageCount: data.pageCount }),
            ...(data.language !== undefined && { language: data.language }),
            ...(data.coverImageUrl !== undefined && { coverImageUrl: data.coverImageUrl }),
            ...(data.status && { status: data.status }),
          },
          include: {
            checkouts: {
              where: {
                returnedDate: null,
              },
            },
          },
        });

        return res.status(HttpStatusCodes.OK).json({ book: updatedBook });
      } catch (error) {
        console.error("Error updating book:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to update book",
          code: BookErrorCodes.BOOK_UPDATE_FAILED,
        });
      }
    }

    if (req.method === "DELETE") {
      // User is guaranteed to be defined due to method config
      if (!user || !user.permissions.includes("book:delete")) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          error: "You do not have permission to delete books",
          code: BookErrorCodes.BOOK_DELETE_FAILED,
        });
      }

      const book = await prisma.book.findUnique({
        where: { id },
        include: {
          checkouts: {
            where: {
              returnedDate: null,
            },
          },
        },
      });

      if (!book) {
        const error = createBookNotFoundError(id);
        return res.status(error.statusCode).json(error);
      }

      // Check if book is currently checked out
      if (book.checkouts.length > 0) {
        return res.status(HttpStatusCodes.CONFLICT).json({
          error: "Cannot delete book that is currently checked out",
          code: BookErrorCodes.BOOK_DELETE_FAILED,
        });
      }

      try {
        await prisma.book.delete({
          where: { id },
        });

        res.status(HttpStatusCodes.NO_CONTENT).end();
        return;
      } catch (error) {
        console.error("Error deleting book:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to delete book",
          code: BookErrorCodes.BOOK_DELETE_FAILED,
        });
      }
    }

    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  },
  {
    GET: { requireAuth: false }, // Public read access
    PUT: { requireAuth: true, requirePermissions: ["book:update"] }, // Auth required for update
    DELETE: { requireAuth: true, requirePermissions: ["book:delete"] }, // Auth required for delete
  }
);
