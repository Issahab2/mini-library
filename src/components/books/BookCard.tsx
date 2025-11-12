import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CTAButton, SecondaryButton } from "@/components/ui/button-variants";
import { BookStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import type { BookWithRelations } from "@/lib/server/types";

interface BookCardProps {
  book: BookWithRelations;
  onCheckout?: (bookId: string) => void;
  showActions?: boolean;
  isCheckedOut?: boolean;
  canCheckout?: boolean;
}

export function BookCard({ book, onCheckout, showActions = true, isCheckedOut, canCheckout = false }: BookCardProps) {
  const status = book.status || (isCheckedOut ? BookStatus.CHECKED_OUT : BookStatus.AVAILABLE);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {book.coverImageUrl && (
        <div className="relative w-full h-64 bg-muted">
          <Image
            src={book.coverImageUrl}
            alt={book.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="line-clamp-2">{book.title}</CardTitle>
        <CardDescription className="line-clamp-1">by {book.author}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {book.genre && (
            <Badge variant="secondary" className="mr-2">
              {book.genre}
            </Badge>
          )}
          {book.publicationYear && (
            <span className="text-sm text-muted-foreground">Published: {book.publicationYear}</span>
          )}
          {book.pageCount && (
            <span className="text-sm text-muted-foreground block">{book.pageCount} pages</span>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={status === BookStatus.AVAILABLE ? "default" : "secondary"}>
              {status === BookStatus.AVAILABLE ? "Available" : "Checked Out"}
            </Badge>
          </div>
        </div>
      </CardContent>
      {showActions && (
        <CardFooter className="flex gap-2">
          <Link href={`/books/${book.id}`} className="flex-1">
            <SecondaryButton className="w-full">View Details</SecondaryButton>
          </Link>
          {status === BookStatus.AVAILABLE && onCheckout && canCheckout && (
            <CTAButton onClick={() => onCheckout(book.id)} className="flex-1">
              Checkout
            </CTAButton>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

