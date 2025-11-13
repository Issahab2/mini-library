import * as React from "react";
import { useRouter } from "next/router";
import { useBook } from "@/hooks/useBooks";
import { useCheckoutBook } from "@/hooks/useCheckouts";
import { ChapterList } from "@/components/books/ChapterList";
import { CTAButton, SecondaryButton } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookStatus } from "@prisma/client";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PublicLayout } from "@/components/layout/PublicLayout";

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
        <BookOpen className="size-16 text-primary/60 dark:text-primary/80" />
        <div className="text-2xl font-bold text-foreground/80">{initials}</div>
        {author && <div className="text-xs text-muted-foreground line-clamp-1">{author}</div>}
      </div>
    </div>
  );
}

export default function BookDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, hasPermission } = useAuth();
  const { data, isLoading, error } = useBook(id as string, true);
  const checkoutMutation = useCheckoutBook();

  const book = data?.book;
  const [imageError, setImageError] = React.useState(false);

  // Consolidate missing data with fallbacks
  const title = book?.title || "Untitled Book";
  const author = book?.author || "Unknown Author";
  const isAvailable = book?.status === BookStatus.AVAILABLE;
  const canCheckout = isAuthenticated && hasPermission("checkout:create");
  const hasCoverImage = Boolean(book?.coverImageUrl) && !imageError;

  const handleCheckout = async () => {
    if (!book) return;
    if (!isAuthenticated) {
      toast.error("Please sign in to checkout books");
      return;
    }
    if (!canCheckout) {
      toast.error("You do not have permission to checkout books");
      return;
    }
    try {
      await checkoutMutation.mutateAsync({ bookId: book.id });
      toast.success("Book checked out successfully!");
      router.push("/dashboard/checkouts");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to checkout book");
    }
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto py-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !book) {
    return (
      <PublicLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">Book not found</p>
              <Link href="/books">
                <SecondaryButton className="mt-4">Back to Catalog</SecondaryButton>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl">{title}</CardTitle>
                    <CardDescription className="text-lg mt-2">by {author}</CardDescription>
                  </div>
                  <Badge variant={isAvailable ? "default" : "secondary"}>
                    {isAvailable ? "Available" : "Checked Out"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Book Cover - Always show, either image or default */}
                <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
                  {hasCoverImage ? (
                    <Image
                      src={book.coverImageUrl!}
                      alt={`${title} cover`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 66vw"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <DefaultBookCover title={title} author={author} />
                  )}
                </div>
                {/* Book Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {book.isbn && (
                    <div>
                      <span className="font-medium">ISBN:</span> {book.isbn}
                    </div>
                  )}
                  {book.publisher && (
                    <div>
                      <span className="font-medium">Publisher:</span> {book.publisher}
                    </div>
                  )}
                  {book.publicationYear && (
                    <div>
                      <span className="font-medium">Year:</span> {book.publicationYear}
                    </div>
                  )}
                  {book.genre && (
                    <div>
                      <span className="font-medium">Genre:</span> {book.genre}
                    </div>
                  )}
                  {book.pageCount > 0 && (
                    <div>
                      <span className="font-medium">Pages:</span> {book.pageCount}
                    </div>
                  )}
                  {book.language && (
                    <div>
                      <span className="font-medium">Language:</span> {book.language}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {book.tags && book.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {book.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {book.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{book.description}</p>
                  </div>
                )}

                {/* Summary */}
                {book.summary && (
                  <div>
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{book.summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            {book.chapters && book.chapters.length > 0 && <ChapterList chapters={book.chapters} />}
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isAvailable && canCheckout ? (
                  <CTAButton onClick={handleCheckout} className="w-full" disabled={checkoutMutation.isPending}>
                    {checkoutMutation.isPending ? "Processing..." : "Checkout Book"}
                  </CTAButton>
                ) : isAvailable && !canCheckout ? (
                  <p className="text-sm text-muted-foreground">
                    {isAuthenticated
                      ? "You do not have permission to checkout books"
                      : "Please sign in to checkout this book"}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">This book is currently checked out</p>
                )}
                <Link href="/books">
                  <SecondaryButton className="w-full">Back to Catalog</SecondaryButton>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
