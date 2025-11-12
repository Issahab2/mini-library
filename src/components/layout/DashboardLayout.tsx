import { Button } from "@/components/ui/button";
import { cn } from "@/lib/client/utils";
import { BookOpen, LayoutDashboard, Library, LogOut, Moon, ShoppingCart, Sun, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// This is a legacy layout - use CustomerDashboardLayout or AdminDashboardLayout instead
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
  { name: "My Checkouts", href: "/dashboard/checkouts", icon: ShoppingCart, permission: null },
  { name: "Books", href: "/books", icon: BookOpen, permission: null },
  { name: "Admin - Books", href: "/admin/books", icon: Library, permission: "book:create" },
  { name: "Admin - Checkouts", href: "/admin/checkouts", icon: ShoppingCart, permission: "checkout:manage" },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const user = session?.user as { permissions?: string[] } | undefined;

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const filteredNavigation = navigation.filter((item) => {
    if (!item.permission) return true;
    return user?.permissions?.includes(item.permission);
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card min-h-screen p-4 flex flex-col">
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
            <div className="mt-auto pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2 px-2">
                <User className="size-4" />
                <span className="text-sm font-medium">{session.user?.name || session.user?.email}</span>
              </div>
              <Button variant="ghost" className="w-full justify-start" onClick={() => signOut()}>
                <LogOut className="mr-2 size-4" />
                Sign Out
              </Button>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
