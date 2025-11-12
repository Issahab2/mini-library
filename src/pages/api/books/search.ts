import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, buildBookSearchQuery } from "@/lib/server";
import type { BookSearchFilters } from "@/lib/server/types";
import { HttpStatusCodes } from "@/lib/server/errors";

// GET /api/books/search - Advanced search with filters
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  }

  const {
    title,
    author,
    genre,
    isbn,
    publisher,
    status,
    language,
    minYear,
    maxYear,
    page = "1",
    limit = "20",
    includeChapters = "false",
  } = req.query;

  const filters: BookSearchFilters = {
    ...(title && { title: title as string }),
    ...(author && { author: author as string }),
    ...(genre && { genre: genre as string }),
    ...(isbn && { isbn: isbn as string }),
    ...(publisher && { publisher: publisher as string }),
    ...(status && { status: status as "AVAILABLE" | "CHECKED_OUT" }),
    ...(language && { language: language as string }),
    ...(minYear && { minYear: parseInt(minYear as string, 10) }),
    ...(maxYear && { maxYear: parseInt(maxYear as string, 10) }),
  };

  const where = buildBookSearchQuery(filters);

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
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
      filters,
    });
  } catch (error) {
    console.error("Error searching books:", error);
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to search books",
    });
  }
}

