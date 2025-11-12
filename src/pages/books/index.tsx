import * as React from "react";
import { useState } from "react";
import { useBooks } from "@/hooks/useBooks";
import { useBookSearch } from "@/hooks/useSearch";
import { useCheckoutBook } from "@/hooks/useCheckouts";
import { BookList } from "@/components/books/BookList";
import { BookSearch } from "@/components/books/BookSearch";
import { PageHeader } from "@/components/layout/PageHeader";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Pagination } from "@/components/ui/pagination";
import type { BookSearchFilters } from "@/lib/server/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function BooksPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<BookSearchFilters>({});
  const [useSearch, setUseSearch] = useState(false);

  const { isAuthenticated, hasPermission } = useAuth();
  const { data: booksData, isLoading: booksLoading } = useBooks(page, 20);
  const { data: searchData, isLoading: searchLoading } = useBookSearch(filters, page, 20);

  const checkoutMutation = useCheckoutBook();

  const isLoading = useSearch ? searchLoading : booksLoading;
  const books = useSearch ? searchData?.books || [] : booksData?.books || [];
  const pagination = useSearch ? searchData?.pagination : booksData?.pagination;

  const canCheckout = isAuthenticated && hasPermission("checkout:create");

  const handleCheckout = async (bookId: string) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to checkout books");
      return;
    }
    if (!hasPermission("checkout:create")) {
      toast.error("You do not have permission to checkout books");
      return;
    }
    try {
      await checkoutMutation.mutateAsync({ bookId });
      toast.success("Book checked out successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to checkout book");
    }
  };

  const handleSearch = () => {
    setUseSearch(true);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: BookSearchFilters) => {
    setFilters(newFilters);
    setUseSearch(Object.keys(newFilters).length > 0);
  };

  return (
    <PublicLayout>
      <div className="container mx-auto py-6">
        <PageHeader title="Library Catalog" description="Browse and search our collection of books" />
        <div className="space-y-6">
          <BookSearch
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
          <BookList
            books={books}
            onCheckout={canCheckout ? handleCheckout : undefined}
            isLoading={isLoading}
            canCheckout={canCheckout}
          />
          {pagination && (
            <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
