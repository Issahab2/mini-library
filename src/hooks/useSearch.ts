import { useQuery } from "@tanstack/react-query";
import type { BookSearchFilters } from "@/lib/server/types";

const API_BASE = "/api/books";

// Search books with filters
export function useBookSearch(filters: BookSearchFilters, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["book-search", filters, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.title && { title: filters.title }),
        ...(filters.author && { author: filters.author }),
        ...(filters.genre && { genre: filters.genre }),
        ...(filters.isbn && { isbn: filters.isbn }),
        ...(filters.publisher && { publisher: filters.publisher }),
        ...(filters.status && { status: filters.status }),
        ...(filters.language && { language: filters.language }),
        ...(filters.minYear && { minYear: filters.minYear.toString() }),
        ...(filters.maxYear && { maxYear: filters.maxYear.toString() }),
      });
      const res = await fetch(`${API_BASE}/search?${params}`);
      if (!res.ok) throw new Error("Failed to search books");
      return res.json();
    },
    enabled: Object.keys(filters).length > 0,
  });
}

