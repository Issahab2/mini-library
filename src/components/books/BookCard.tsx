import { Badge } from "@/components/ui/badge";
import { CTAButton, SecondaryButton } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { BookWithRelations } from "@/lib/server/types";
import { BookStatus } from "@prisma/client";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

interface BookCardProps {
  book: BookWithRelations;
  onCheckout?: (bookId: string) => void;
  showActions?: boolean;
  isCheckedOut?: boolean;
  canCheckout?: boolean;
  authenticated?: boolean;
}

// Default book cover component
function DefaultBookCover({ title, author }: { title: string; author?: string }) {
  const initials = title
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative w-full h-full bg-linear-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
        <BookOpen className="size-12 sm:size-14 md:size-16 text-primary/60 dark:text-primary/80" />
        <div className="text-xl sm:text-2xl font-bold text-foreground/80">{initials}</div>
        {author && <div className="text-xs sm:text-sm text-muted-foreground line-clamp-1 px-2">{author}</div>}
      </div>
    </div>
  );
}

export function BookCard({
  book,
  onCheckout,
  showActions = true,
  isCheckedOut,
  canCheckout = false,
  authenticated = true,
}: BookCardProps) {
  const status = book.status || (isCheckedOut ? BookStatus.CHECKED_OUT : BookStatus.AVAILABLE);
  const [imageError, setImageError] = React.useState(false);

  // Consolidate missing data with fallbacks
  const title = book.title || "Untitled Book";
  const author = book.author || "Unknown Author";
  const genre = book.genre || null;
  const description = book.description || null;
  const tags = book.tags || [];
  const publicationYear = book.publicationYear || null;
  const pageCount = book.pageCount || null;
  const hasCoverImage = Boolean(book.coverImageUrl) && !imageError;

  // Limit tags display to first 5 tags
  const displayTags = tags.slice(0, 5);
  const remainingTagsCount = tags.length - displayTags.length;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      {/* Book Cover - Always show, either image or default */}
      <div className="relative w-full h-48 sm:h-56 md:h-64 bg-muted shrink-0">
        {hasCoverImage ? (
          <Image
            src={book.coverImageUrl!}
            alt={`${title} cover`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <DefaultBookCover title={title} author={author} />
        )}
      </div>

      <CardHeader className="shrink-0">
        <CardTitle className="line-clamp-2 min-h-12 text-base sm:text-lg">{title}</CardTitle>
        <CardDescription className="line-clamp-1 text-sm sm:text-base">by {author}</CardDescription>
      </CardHeader>

      <CardContent className="grow flex flex-col">
        <div className="space-y-2.5">
          {/* Genre */}
          {genre && (
            <div className="flex flex-wrap gap-1.5 min-w-0 w-full">
              <Badge
                variant="secondary"
                className="text-xs sm:text-sm max-w-full w-full sm:w-auto overflow-hidden"
                title={genre}
                style={{ maxWidth: "100%" }}
              >
                <span className="truncate block" style={{ maxWidth: "100%" }}>
                  {genre}
                </span>
              </Badge>
            </div>
          )}

          {/* Description */}
          {description && <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{description}</p>}

          {/* Tags */}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {displayTags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {remainingTagsCount > 0 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{remainingTagsCount} more
                </Badge>
              )}
            </div>
          )}

          {/* Publication Year and Page Count */}
          <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
            {publicationYear && <div className="block">Published: {publicationYear}</div>}
            {pageCount && pageCount > 0 && <div className="block">{pageCount} pages</div>}
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 pt-1">
            <Badge variant={status === BookStatus.AVAILABLE ? "default" : "secondary"} className="text-xs sm:text-sm">
              {status === BookStatus.AVAILABLE ? "Available" : "Checked Out"}
            </Badge>
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="flex flex-col sm:flex-row gap-2 mt-auto pt-4 shrink-0 flex-wrap">
          <Link href={`/books/${book.id}`} className="w-full sm:flex-1">
            <SecondaryButton className="w-full text-sm sm:text-base">View Details</SecondaryButton>
          </Link>
          {!authenticated ? (
            <Link
              className="w-full sm:flex-1"
              href={`/auth/signin?callbackUrl=${encodeURIComponent(`/books/${book.id}`)}`}
            >
              <CTAButton className="w-full text-sm sm:text-base">Sign in to checkout</CTAButton>
            </Link>
          ) : status === BookStatus.AVAILABLE && onCheckout && canCheckout ? (
            <CTAButton onClick={() => onCheckout(book.id)} className="w-full text-sm sm:text-base">
              Borrow Book
            </CTAButton>
          ) : (
            <CTAButton disabled className="w-full text-sm sm:text-base">
              Borrowed
            </CTAButton>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
