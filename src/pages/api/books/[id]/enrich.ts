import type { NextApiRequest, NextApiResponse } from "next";
import {
  prisma,
  createMethodAuthHandler,
  enrichBookData,
  isAIServiceAvailable,
  createBookNotFoundError,
} from "@/lib/server";
import { HttpStatusCodes, BookErrorCodes } from "@/lib/server/errors";

// POST /api/books/[id]/enrich - Enrich book with AI-generated tags and summary (requires book:update permission)
export default createMethodAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }): Promise<void> => {
    if (req.method !== "POST") {
      return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
        error: "Method not allowed",
      });
    }

    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "Invalid book ID",
      });
    }

    // User is guaranteed to be defined due to method config
    if (!user || !user.permissions.includes("book:update")) {
      return res.status(HttpStatusCodes.FORBIDDEN).json({
        error: "You do not have permission to update books",
        code: BookErrorCodes.BOOK_UPDATE_FAILED,
      });
    }

    // Check if AI service is available
    if (!isAIServiceAvailable()) {
      return res.status(HttpStatusCodes.SERVICE_UNAVAILABLE).json({
        error: "AI service is not available. Please configure OPENAI_API_KEY.",
        code: BookErrorCodes.BOOK_UPDATE_FAILED,
      });
    }

    // Fetch the book
    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      const error = createBookNotFoundError(id);
      return res.status(error.statusCode).json(error);
    }

    try {
      // Generate AI enrichment
      const aiResult = await enrichBookData(book.title, book.author, book.description || undefined);

      if (!aiResult.tags && !aiResult.summary) {
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to generate AI enrichment data",
          code: BookErrorCodes.BOOK_UPDATE_FAILED,
        });
      }

      // Update book with AI-generated data
      const updateData: {
        genre?: string;
        tags?: string[];
        summary?: string;
      } = {};

      if (aiResult.tags) {
        if (aiResult.tags.genres.length > 0) {
          updateData.genre = aiResult.tags.genres[0]; // Use first genre
        }
        if (aiResult.tags.tags.length > 0) {
          updateData.tags = aiResult.tags.tags;
        }
      }

      if (aiResult.summary) {
        updateData.summary = aiResult.summary;
      }

      const updatedBook = await prisma.book.update({
        where: { id },
        data: updateData,
        include: {
          chapters: true,
        },
      });

      return res.status(HttpStatusCodes.OK).json({
        book: updatedBook,
        message: "Book enriched successfully with AI-generated data",
      });
    } catch (error) {
      console.error("[Book Enrichment] Error:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to enrich book",
        code: BookErrorCodes.BOOK_UPDATE_FAILED,
      });
    }
  },
  {
    POST: { requireAuth: true, requirePermissions: ["book:update"] },
  }
);
