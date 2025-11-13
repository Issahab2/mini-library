import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/client/utils";
import { BookOpen, LayoutDashboard, Library, LogOut, User, ShoppingCart, Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import useAuth from "@/hooks/useAuth";

interface CustomerDashboardLayoutProps {
  children: React.ReactNode;
}

const customerNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Checkouts", href: "/dashboard/checkouts", icon: ShoppingCart },
  { name: "Browse Books", href: "/books", icon: BookOpen },
];

export function CustomerDashboardLayout({ children }: CustomerDashboardLayoutProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { isStaff, isLoading, isAuthenticated } = useAuth();

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isAuthenticated && isStaff && !isLoading && router.pathname === "/dashboard") {
      router.push("/admin/dashboard");
    }
  }, [isStaff, router, isLoading, isAuthenticated]);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isStaff) {
    return <div>You are not authorized to access this page</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 w-64 border-r border-border bg-card h-screen p-4 flex-col z-10">
        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="flex items-center gap-2">
              <Library className="size-6" />
              <h2 className="text-xl font-bold">Library</h2>
            </Link>
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-8 w-8"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            )}
          </div>
          <nav className="space-y-1">
            {customerNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href.split("?")[0];
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn("w-full justify-start", isActive && "bg-secondary")}
                  >
                    <Icon className="mr-2 size-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
        {status === "authenticated" && (
          <div className="pt-4 border-t border-border shrink-0">
            <div className="flex items-center gap-2 mb-2 px-2">
              <User className="size-4" />
              <span className="text-sm font-medium truncate">{session.user?.name || session.user?.email}</span>
            </div>
            <Button variant="ghost" className="w-full justify-start" onClick={() => signOut()}>
              <LogOut className="mr-2 size-4" />
              Sign Out
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Library className="size-6 text-primary" />
            <h2 className="text-xl font-bold">Library</h2>
          </Link>
          <div className="flex items-center gap-2">
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
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border shadow-lg transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <Library className="size-6" />
              <h2 className="text-xl font-bold">Library</h2>
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
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {customerNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn("w-full justify-start", isActive && "bg-secondary")}
                  >
                    <Icon className="mr-2 size-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>
          {status === "authenticated" && (
            <div className="p-4 border-t border-border shrink-0">
              <div className="flex items-center gap-2 mb-2 px-2">
                <User className="size-4" />
                <span className="text-sm font-medium truncate">{session.user?.name || session.user?.email}</span>
              </div>
              <Button variant="ghost" className="w-full justify-start" onClick={() => signOut()}>
                <LogOut className="mr-2 size-4" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="p-4 md:p-6 md:ml-64">{children}</main>
    </div>
  );
}
