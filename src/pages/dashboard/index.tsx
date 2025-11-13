import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { CheckoutCard } from "@/components/checkouts/CheckoutCard";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { CTAButton } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useMyCheckouts } from "@/hooks/useCheckouts";
import type { BookWithRelations, CheckoutWithRelations } from "@/lib/server/types";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isAuthenticated, isStaff } = useAuth();
  const { data: checkoutsData, isLoading: checkoutsLoading } = useMyCheckouts(1, 5, "active");
  const { data: booksData, isLoading: booksLoading } = useBooks(1, 5);

  if (!isAuthenticated) {
    return (
      <CustomerDashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please sign in to view your dashboard</p>
        </div>
      </CustomerDashboardLayout>
    );
  }

  const activeCheckouts = checkoutsData?.checkouts || [];
  const overdueCount = activeCheckouts.filter((c: { isOverdue: boolean }) => c.isOverdue).length;
  const recentBooks = booksData?.books?.slice(0, 3) || [];

  return (
    <CustomerDashboardLayout>
      <PageHeader
        title="My Dashboard"
        description={`Welcome back, ${user?.name || "User"}!`}
        actions={
          isStaff ? (
            <Link href="/admin/dashboard">
              <CTAButton variant="outline">Admin Panel</CTAButton>
            </Link>
          ) : undefined
        }
      />
      <EmailVerificationBanner />
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Checkouts</CardTitle>
              <CardDescription>Books currently checked out</CardDescription>
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
              <CardDescription>Books past due date</CardDescription>
            </CardHeader>
            <CardContent>
              {checkoutsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-destructive">{overdueCount}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Books</CardTitle>
              <CardDescription>Available in library</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{booksData?.pagination?.total || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Checkouts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground">My Active Checkouts</h2>
            <Link href="/dashboard/checkouts">
              <CTAButton variant="outline">View All</CTAButton>
            </Link>
          </div>
          {checkoutsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : activeCheckouts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCheckouts.slice(0, 4).map((checkout: CheckoutWithRelations) => (
                <CheckoutCard key={checkout.id} checkout={checkout} showActions={true} canReturn={true} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No active checkouts</p>
                <Link href="/books">
                  <CTAButton className="mt-4">Browse Books</CTAButton>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Books */}
        {booksLoading ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Recently Added Books</h2>
              <Link href="/books">
                <CTAButton variant="outline">View All</CTAButton>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        ) : (
          recentBooks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-foreground">Recently Added Books</h2>
                <Link href="/books">
                  <CTAButton variant="outline">View All</CTAButton>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentBooks.map((book: BookWithRelations) => (
                  <Card key={book.id}>
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                      <CardDescription>by {book.author}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/books/${book.id}`}>
                        <CTAButton size="sm" className="w-full">
                          View Details
                        </CTAButton>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </CustomerDashboardLayout>
  );
}
