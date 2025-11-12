import { BookList } from "@/components/books/BookList";
import { CheckoutList } from "@/components/checkouts/CheckoutList";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { CTAButton } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useCheckouts } from "@/hooks/useCheckouts";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isStaff, hasPermission } = useAuth();
  const { data: checkoutsData, isLoading: checkoutsLoading } = useCheckouts(1, 5, "all");
  const { data: booksData, isLoading: booksLoading } = useBooks(1, 5);

  if (!isAuthenticated) {
    return (
      <AdminDashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please sign in to view the admin dashboard</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (!isStaff) {
    return (
      <AdminDashboardLayout>
        <div className="text-center py-12">
          <p className="text-destructive">You do not have permission to access the admin dashboard</p>
          <Link href="/dashboard">
            <CTAButton className="mt-4">Go to Customer Dashboard</CTAButton>
          </Link>
        </div>
      </AdminDashboardLayout>
    );
  }

  const allCheckouts = checkoutsData?.checkouts || [];
  const activeCheckouts = allCheckouts.filter((c: { returnedDate: Date | null }) => !c.returnedDate);
  const overdueCheckouts = allCheckouts.filter(
    (c: { isOverdue: boolean; returnedDate: Date | null }) => c.isOverdue && !c.returnedDate
  );
  const totalBooks = booksData?.pagination?.total || 0;

  return (
    <AdminDashboardLayout>
      <PageHeader
        title="Admin Dashboard"
        description={`Welcome back, ${user?.name || "Admin"}! Manage your library operations.`}
      />
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Books</CardTitle>
              <CardDescription>Books in library</CardDescription>
            </CardHeader>
            <CardContent>
              {booksLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{totalBooks}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Checkouts</CardTitle>
              <CardDescription>Currently checked out</CardDescription>
            </CardHeader>
            <CardContent>
              {checkoutsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{activeCheckouts.length}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Overdue Books</CardTitle>
              <CardDescription>Past due date</CardDescription>
            </CardHeader>
            <CardContent>
              {checkoutsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-destructive">{overdueCheckouts.length}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Checkouts</CardTitle>
              <CardDescription>All time</CardDescription>
            </CardHeader>
            <CardContent>
              {checkoutsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{allCheckouts.length}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Checkouts */}
        {hasPermission("checkout:manage") && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Recent Checkouts</h2>
              <Link href="/admin/checkouts">
                <CTAButton variant="outline">View All</CTAButton>
              </Link>
            </div>
            {checkoutsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : allCheckouts.length > 0 ? (
              <CheckoutList
                checkouts={allCheckouts.slice(0, 5)}
                showUser={true}
                canReturn={hasPermission("checkout:manage")}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No checkouts found</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Recent Books */}
        {hasPermission("book:create") && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Recent Books</h2>
              <Link href="/admin/books">
                <CTAButton variant="outline">View All</CTAButton>
              </Link>
            </div>
            {booksLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : booksData?.books && booksData.books.length > 0 ? (
              <BookList books={booksData.books.slice(0, 6)} showActions={false} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No books found</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
