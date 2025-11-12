import { Prisma } from "@prisma/client";
import type { BookSearchFilters } from "./types/book";

/**
 * Builds a Prisma query for searching books based on filters
 */
export function buildBookSearchQuery(filters: BookSearchFilters): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput = {};

  // Title search (case-insensitive, partial match)
  if (filters.title) {
    where.title = {
      contains: filters.title,
      mode: "insensitive",
    };
  }

  // Author search (case-insensitive, partial match)
  if (filters.author) {
    where.author = {
      contains: filters.author,
      mode: "insensitive",
    };
  }

  // Genre search (case-insensitive, exact or partial match)
  if (filters.genre) {
    where.genre = {
      contains: filters.genre,
      mode: "insensitive",
    };
  }

  // ISBN search (exact match)
  if (filters.isbn) {
    where.isbn = {
      contains: filters.isbn,
      mode: "insensitive",
    };
  }

  // Publisher search (case-insensitive, partial match)
  if (filters.publisher) {
    where.publisher = {
      contains: filters.publisher,
      mode: "insensitive",
    };
  }

  // Language search (case-insensitive, exact match)
  if (filters.language) {
    where.language = {
      equals: filters.language,
      mode: "insensitive",
    };
  }

  // Status filter
  if (filters.status) {
    where.status = filters.status;
  }

  // Publication year range
  if (filters.minYear || filters.maxYear) {
    where.publicationYear = {};
    if (filters.minYear) {
      where.publicationYear.gte = filters.minYear;
    }
    if (filters.maxYear) {
      where.publicationYear.lte = filters.maxYear;
    }
  }

  return where;
}

/**
 * Builds a combined search query that searches across multiple fields
 * Useful for a general search box that searches title, author, ISBN, etc.
 */
export function buildGeneralBookSearchQuery(searchTerm: string): Prisma.BookWhereInput {
  if (!searchTerm.trim()) {
    return {};
  }

  return {
    OR: [
      {
        title: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        author: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        isbn: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        publisher: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        genre: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
    ],
  };
}
