import type { Book, Chapter, BookStatus } from "@prisma/client";

export type BookWithRelations = Book & {
  chapters?: Chapter[];
  checkouts?: Array<{
    id: string;
    userId: string;
    checkoutDate: Date;
    dueDate: Date;
    returnedDate: Date | null;
  }>;
};

export interface CreateBookInput {
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  summary?: string;
  publisher?: string;
  publicationYear?: number;
  genre?: string;
  tags?: string[];
  pageCount?: number;
  language?: string;
  coverImageUrl?: string;
  status?: BookStatus;
}

export interface UpdateBookInput extends Partial<CreateBookInput> {
  id: string;
}

export interface BookSearchFilters {
  title?: string;
  author?: string;
  genre?: string;
  isbn?: string;
  publisher?: string;
  status?: BookStatus;
  language?: string;
  minYear?: number;
  maxYear?: number;
}

export interface CreateChapterInput {
  title: string;
  content?: string;
  order: number;
  bookId: string;
}

export interface UpdateChapterInput {
  id: string;
  title?: string;
  content?: string;
  order?: number;
}
