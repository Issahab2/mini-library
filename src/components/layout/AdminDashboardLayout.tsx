import { Button } from "@/components/ui/button";
import { cn } from "@/lib/client/utils";
import { BookOpen, LayoutDashboard, Library, LogOut, Moon, ShoppingCart, Sun, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

const adminNavigation = [
  { name: "Admin Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, permission: null },
  { name: "Books Management", href: "/admin/books", icon: Library, permission: "book:create" },
  { name: "Checkouts Management", href: "/admin/checkouts", icon: ShoppingCart, permission: "checkout:manage" },
  { name: "Browse Books", href: "/books", icon: BookOpen, permission: null },
];

export function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const user = session?.user as { permissions?: string[] } | undefined;

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const filteredNavigation = adminNavigation.filter((item) => {
    if (!item.permission) return true;
    return user?.permissions?.includes(item.permission);
  });

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card h-screen p-4 flex flex-col shrink-0">
        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="flex items-center gap-2">
              <Library className="size-6" />
              <h2 className="text-xl font-bold">Admin Panel</h2>
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
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + "/");
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
              <span className="text-sm font-medium">{session.user?.name || session.user?.email}</span>
            </div>
            <div className="space-y-1">
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="mr-2 size-4" />
                  Customer View
                </Button>
              </Link>
              <Button variant="ghost" className="w-full justify-start" onClick={() => signOut()}>
                <LogOut className="mr-2 size-4" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
