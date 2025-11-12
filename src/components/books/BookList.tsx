import * as React from "react";
import { BookCard } from "./BookCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookWithRelations } from "@/lib/server/types";

interface BookListProps {
  books: BookWithRelations[];
  onCheckout?: (bookId: string) => void;
  isLoading?: boolean;
  showActions?: boolean;
  canCheckout?: boolean;
}

export function BookList({ books, onCheckout, isLoading = false, showActions = true, canCheckout = false }: BookListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No books found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} onCheckout={onCheckout} showActions={showActions} canCheckout={canCheckout} />
      ))}
    </div>
  );
}

