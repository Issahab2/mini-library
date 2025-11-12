import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateCheckoutInput } from "@/lib/server/types";

const API_BASE = "/api/checkouts";

// Fetch all checkouts (admin)
export function useCheckouts(page = 1, limit = 20, status = "all") {
  return useQuery({
    queryKey: ["checkouts", page, limit, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
      });
      const res = await fetch(`${API_BASE}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch checkouts");
      return res.json();
    },
  });
}

// Fetch user's checkouts
export function useMyCheckouts(page = 1, limit = 20, status = "all") {
  return useQuery({
    queryKey: ["my-checkouts", page, limit, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
      });
      const res = await fetch(`${API_BASE}/my-checkouts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch checkouts");
      return res.json();
    },
  });
}

// Fetch single checkout
export function useCheckout(id: string | undefined) {
  return useQuery({
    queryKey: ["checkout", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch checkout");
      return res.json();
    },
    enabled: !!id,
  });
}

// Create checkout mutation
export function useCheckoutBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCheckoutInput) => {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to checkout book");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkouts"] });
      queryClient.invalidateQueries({ queryKey: ["my-checkouts"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

// Return book mutation
export function useReturnBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (checkoutId: string) => {
      const res = await fetch(`${API_BASE}/${checkoutId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to return book");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkouts"] });
      queryClient.invalidateQueries({ queryKey: ["my-checkouts"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

