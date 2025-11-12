import { Button } from "@/components/ui/button";
import { CTAButton, SecondaryButton } from "@/components/ui/button-variants";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, LayoutDashboard, Library, LogOut, Moon, Sun, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";

export function GlobalNavigation() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const { isStaff } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Library className="size-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Library</h1>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          {/* Public Links */}
          <Link href="/books">
            <SecondaryButton
              variant={router.pathname === "/books" || router.pathname.startsWith("/books/") ? "default" : "ghost"}
            >
              <BookOpen className="mr-2 size-4" />
              Browse Books
            </SecondaryButton>
          </Link>

          {/* Authenticated Links */}
          {status === "loading" ? (
            <div className="h-9 w-24 animate-pulse rounded bg-muted" />
          ) : session ? (
            <>
              {isStaff && (
                <Link href="/admin/dashboard">
                  <SecondaryButton variant={router.pathname.startsWith("/admin") ? "default" : "ghost"}>
                    Admin Panel
                  </SecondaryButton>
                </Link>
              )}
              <Link href="/dashboard">
                <SecondaryButton variant={router.pathname.startsWith("/dashboard") ? "default" : "ghost"}>
                  <LayoutDashboard className="mr-2 size-4" />
                  Dashboard
                </SecondaryButton>
              </Link>
              <div className="ml-2 flex items-center gap-2 border-l border-border pl-2">
                <div className="flex items-center gap-2 px-2">
                  <User className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => signOut()} className="h-9 w-9" aria-label="Sign out">
                  <LogOut className="size-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <SecondaryButton variant="ghost">Sign In</SecondaryButton>
              </Link>
              <Link href="/auth/signup">
                <CTAButton>Sign Up</CTAButton>
              </Link>
            </>
          )}

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="ml-2 h-9 w-9"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
