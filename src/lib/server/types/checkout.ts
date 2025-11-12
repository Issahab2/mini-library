import type { Checkout, Book, User } from "@prisma/client";

export type CheckoutWithRelations = Checkout & {
  book: Book;
  user: Pick<User, "id" | "name" | "email">;
};

export interface CreateCheckoutInput {
  bookId: string;
  userId?: string; // Optional - will use authenticated user's ID if not provided
  maxDurationDays?: number;
  lateFeePerDay?: number;
}

export interface ReturnCheckoutInput {
  checkoutId: string;
}

export interface CheckoutValidationResult {
  valid: boolean;
  error?: string;
  currentCheckouts?: number;
  maxCheckouts?: number;
}
