import { buildGeneralBookSearchQuery, createMethodAuthHandler, prisma } from "@/lib/server";
import { BookErrorCodes, HttpStatusCodes } from "@/lib/server/errors";
import type { CreateBookInput } from "@/lib/server/types";
import type { NextApiRequest, NextApiResponse } from "next";

// GET /api/books - List books with optional search (public)
// POST /api/books - Create a new book (requires book:create permission)
export default createMethodAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }) => {
    if (req.method === "GET") {
      const { search, page = "1", limit = "20", includeChapters = "false" } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const where = search ? buildGeneralBookSearchQuery(search as string) : {};

      const [books, total] = await Promise.all([
        prisma.book.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: "desc" },
          include: {
            chapters: includeChapters === "true" ? { orderBy: { order: "asc" } } : false,
            _count: {
              select: {
                checkouts: {
                  where: {
                    returnedDate: null,
                  },
                },
              },
            },
          },
        }),
        prisma.book.count({ where }),
      ]);

      // Update status based on active checkouts
      const booksWithStatus = books.map((book) => ({
        ...book,
        status: book._count.checkouts > 0 ? "CHECKED_OUT" : "AVAILABLE",
      }));

      return res.status(HttpStatusCodes.OK).json({
        books: booksWithStatus,
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
      if (!user || !user.permissions.includes("book:create")) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          error: "You do not have permission to create books",
          code: BookErrorCodes.BOOK_CREATE_FAILED,
        });
      }

      const data: CreateBookInput = req.body;

      // Validate required fields
      if (!data.title || !data.author) {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          error: "Title and author are required",
          code: BookErrorCodes.BOOK_CREATE_FAILED,
        });
      }

      try {
        // Merge user data with AI-enriched data (user data takes precedence)
        const book = await prisma.book.create({
          data: {
            title: data.title,
            author: data.author,
            isbn: data.isbn,
            description: data.description,
            summary: data.summary,
            publisher: data.publisher,
            publicationYear: data.publicationYear,
            genre: data.genre,
            tags: data.tags,
            pageCount: data.pageCount,
            language: data.language,
            coverImageUrl: data.coverImageUrl,
            status: data.status || "AVAILABLE",
          },
          include: {
            chapters: true,
          },
        });

        return res.status(HttpStatusCodes.CREATED).json({ book });
      } catch (error) {
        console.error("Error creating book:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to create book",
          code: BookErrorCodes.BOOK_CREATE_FAILED,
        });
      }
    }

    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  },
  {
    GET: { requireAuth: false }, // Public read access
    POST: { requireAuth: true, requirePermissions: ["book:create"] }, // Auth required for create
  }
);
