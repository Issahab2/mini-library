import { PublicLayout } from "@/components/layout/PublicLayout";
import { CTAButton, SecondaryButton } from "@/components/ui/button-variants";
import { ArrowRight, BookOpen, Library } from "lucide-react";
import { useSession } from "next-auth/react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const { data: session } = useSession();

  return (
    <PublicLayout>
      <div
        className={`${geistSans.className} ${geistMono.className} flex min-h-screen flex-col bg-background font-sans`}
      >
        {/* Main Content */}
        <main className="flex-1">
          <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-8 flex justify-center">
                <Library className="size-16 text-primary" />
              </div>
              <h1 className="mb-4 text-5xl font-bold tracking-tight">Welcome to Our Library</h1>
              <p className="mb-8 text-xl text-muted-foreground">
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
              <h2 className="mb-12 text-center text-3xl font-bold">Features</h2>
              <div className="grid gap-8 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-6">
                  <BookOpen className="mb-4 size-8 text-primary" />
                  <h3 className="mb-2 text-xl font-semibold">Browse Collection</h3>
                  <p className="text-muted-foreground">
                    Explore our extensive library of books across various genres and topics.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-6">
                  <Library className="mb-4 size-8 text-primary" />
                  <h3 className="mb-2 text-xl font-semibold">Easy Checkout</h3>
                  <p className="text-muted-foreground">
                    Borrow books with ease and manage your checkouts from your dashboard.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-6">
                  <ArrowRight className="mb-4 size-8 text-primary" />
                  <h3 className="mb-2 text-xl font-semibold">Quick Returns</h3>
                  <p className="text-muted-foreground">
                    Return books quickly and track your reading history all in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PublicLayout>
  );
}
