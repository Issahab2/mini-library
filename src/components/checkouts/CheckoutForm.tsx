import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CTAButton } from "@/components/ui/button-variants";
import type { BookWithRelations } from "@/lib/server/types";

interface CheckoutFormProps {
  books: BookWithRelations[];
  selectedBookId?: string;
  onBookSelect: (bookId: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  maxDurationDays?: number;
}

export function CheckoutForm({
  books,
  selectedBookId,
  onBookSelect,
  onSubmit,
  isLoading = false,
  maxDurationDays = 14,
}: CheckoutFormProps) {
  const availableBooks = books.filter((book) => book.status === "AVAILABLE");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout a Book</CardTitle>
        <CardDescription>Select a book to checkout</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="book">Select Book</Label>
          <Select value={selectedBookId || ""} onValueChange={onBookSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a book..." />
            </SelectTrigger>
            <SelectContent>
              {availableBooks.length === 0 ? (
                <SelectItem value="none" disabled>
                  No available books
                </SelectItem>
              ) : (
                availableBooks.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title} by {book.author}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        {selectedBookId && (
          <div className="text-sm text-muted-foreground">
            <p>Maximum checkout duration: {maxDurationDays} days</p>
          </div>
        )}
        <CTAButton onClick={onSubmit} disabled={!selectedBookId || isLoading} className="w-full">
          {isLoading ? "Processing..." : "Checkout Book"}
        </CTAButton>
      </CardContent>
    </Card>
  );
}

