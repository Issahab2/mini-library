import { BookList } from "@/components/books/BookList";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { CTAButton, SecondaryButton } from "@/components/ui/button-variants";
import useAuth from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useCheckoutBook } from "@/hooks/useCheckouts";
import { ArrowRight, BookOpen, Library } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";

export default function Home() {
  const { data: session } = useSession();

  const { data: booksData, isLoading: booksLoading } = useBooks(1, 8);
  const books = booksData?.books || [];

  const { isAuthenticated, hasPermission } = useAuth();
  const canCheckout = isAuthenticated && hasPermission("checkout:create");

  const checkoutMutation = useCheckoutBook();

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

  return (
    <PublicLayout>
      <div className="flex flex-col font-sans bg-background">
        {/* Main Content */}
        <section className="flex-1">
          <div className="container mx-auto px-4 pt-16 pb-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-8 flex justify-center">
                <Library className="size-16 text-primary dark:text-primary" />
              </div>
              <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground dark:text-foreground">
                Welcome to Our Library
              </h1>
              <p className="mb-8 text-xl text-muted-foreground dark:text-muted-foreground">
                Discover, borrow, and explore our vast collection of books. Your next great read is just a click away.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                {session ? (
                  <>
                    <Link href="/dashboard">
                      <CTAButton size="lg" className="gap-2">
                        Go to Dashboard
                        <ArrowRight className="size-4" />
                      </CTAButton>
                    </Link>
                    <Link href="/books">
                      <SecondaryButton size="lg" className="gap-2">
                        <BookOpen className="size-4" />
                        Browse Books
                      </SecondaryButton>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/signin">
                      <CTAButton size="lg">Get Started</CTAButton>
                    </Link>
                    <Link href="/books">
                      <SecondaryButton size="lg" className="gap-2">
                        <BookOpen className="size-4" />
                        Browse Books
                      </SecondaryButton>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Features Section */}
            <div className="mx-auto mt-24 max-w-6xl">
              <h2 className="mb-12 text-center text-3xl font-bold text-foreground dark:text-foreground">Features</h2>
              <div className="grid gap-8 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-6 transition-colors dark:border-border dark:bg-card hover:border-primary/50 dark:hover:border-primary/50">
                  <BookOpen className="mb-4 size-8 text-primary dark:text-primary" />
                  <h3 className="mb-2 text-xl font-semibold text-foreground dark:text-foreground">Browse Collection</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    Explore our extensive library of books across various genres and topics.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-6 transition-colors dark:border-border dark:bg-card hover:border-primary/50 dark:hover:border-primary/50">
                  <Library className="mb-4 size-8 text-primary dark:text-primary" />
                  <h3 className="mb-2 text-xl font-semibold text-foreground dark:text-foreground">Easy Checkout</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    Borrow books with ease and manage your checkouts from your dashboard.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-6 transition-colors dark:border-border dark:bg-card hover:border-primary/50 dark:hover:border-primary/50">
                  <ArrowRight className="mb-4 size-8 text-primary dark:text-primary" />
                  <h3 className="mb-2 text-xl font-semibold text-foreground dark:text-foreground">Quick Returns</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    Return books quickly and track your reading history all in one place.
                  </p>
                </div>
              </div>
            </div>

            {/* Books Section */}
            <div className="mx-auto mt-24">
              <h2 className="mb-12 text-center text-3xl font-bold text-foreground dark:text-foreground">Books</h2>

              <div className="space-y-6 p-4">
                <BookList
                  books={books}
                  onCheckout={canCheckout ? handleCheckout : undefined}
                  isLoading={booksLoading}
                  canCheckout={canCheckout}
                />
              </div>
              <div className="flex justify-center">
                <Link href="/books">
                  <CTAButton size="lg" className="gap-2">
                    Browse All Books
                    <ArrowRight className="size-4" />
                  </CTAButton>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
