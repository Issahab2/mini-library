import { Button } from "@/components/ui/button";
import { CTAButton, SecondaryButton } from "@/components/ui/button-variants";
import { BookOpen, LayoutDashboard, Library, LogOut, Moon, Sun, User, Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";

export function GlobalNavigation() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  // Prevent body scroll when sidebar is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Library className="size-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Library</h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {/* Public Links */}
          <Link href="/books">
            <SecondaryButton
              variant={router.pathname === "/books" || router.pathname.startsWith("/books/") ? "default" : "ghost"}
            >
              <BookOpen className="mr-2 size-4" />
              <span className="hidden lg:inline">Browse Books</span>
              <span className="lg:hidden">Books</span>
            </SecondaryButton>
          </Link>

          {/* Authenticated Links */}
          {status === "loading" ? (
            <div className="h-9 w-24 animate-pulse rounded bg-muted" />
          ) : session ? (
            <>
              <Link href="/dashboard">
                <SecondaryButton variant={router.pathname.startsWith("/dashboard") ? "default" : "ghost"}>
                  <LayoutDashboard className="mr-2 size-4" />
                  <span className="hidden lg:inline">Dashboard</span>
                  <span className="lg:hidden">Dash</span>
                </SecondaryButton>
              </Link>
              <div className="ml-2 flex items-center gap-2 border-l border-border pl-2">
                <div className="hidden lg:flex items-center gap-2 px-2">
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

        {/* Mobile Menu Button & Theme Toggle */}
        <div className="flex md:hidden items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 h-screen w-screen z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-screen w-80 max-w-[85vw] bg-background border-r border-border shadow-lg md:hidden transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } ${!mobileMenuOpen ? "pointer-events-none" : ""}`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <Library className="size-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Library</h1>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              className="h-9 w-9"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </Button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {/* Public Links */}
            <Link href="/books" className="block" onClick={() => setMobileMenuOpen(false)}>
              <SecondaryButton
                variant={router.pathname === "/books" || router.pathname.startsWith("/books/") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <BookOpen className="mr-2 size-4" />
                Browse Books
              </SecondaryButton>
            </Link>

            {/* Authenticated Links */}
            {status === "loading" ? (
              <div className="h-9 w-full animate-pulse rounded bg-muted" />
            ) : session ? (
              <>
                <Link href="/dashboard" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <SecondaryButton
                    variant={router.pathname.startsWith("/dashboard") ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    <LayoutDashboard className="mr-2 size-4" />
                    Dashboard
                  </SecondaryButton>
                </Link>
                <div className="pt-2 border-t border-border space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <User className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {session.user?.name || session.user?.email}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    <LogOut className="mr-2 size-4" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <SecondaryButton variant="ghost" className="w-full justify-start">
                    Sign In
                  </SecondaryButton>
                </Link>
                <Link href="/auth/signup" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <CTAButton className="w-full justify-start">Sign Up</CTAButton>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
