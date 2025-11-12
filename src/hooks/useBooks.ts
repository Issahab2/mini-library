import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BookWithRelations, CreateBookInput, UpdateBookInput } from "@/lib/server/types";

const API_BASE = "/api/books";

// Fetch all books
export function useBooks(page = 1, limit = 20, search?: string) {
  return useQuery({
    queryKey: ["books", page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });
      const res = await fetch(`${API_BASE}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch books");
      return res.json();
    },
  });
}

// Fetch single book
export function useBook(id: string | undefined, includeChapters = true) {
  return useQuery({
    queryKey: ["book", id, includeChapters],
    queryFn: async () => {
      if (!id) return null;
      const params = new URLSearchParams({
        includeChapters: includeChapters.toString(),
      });
      const res = await fetch(`${API_BASE}/${id}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch book");
      return res.json();
    },
    enabled: !!id,
  });
}

// Create book mutation
export function useCreateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookInput) => {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create book");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

// Update book mutation
export function useUpdateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBookInput }) => {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update book");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["book", variables.id] });
    },
  });
}

// Delete book mutation
export function useDeleteBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete book");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

