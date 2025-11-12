import * as React from "react";
import { useState } from "react";
import { useMyCheckouts, useReturnBook } from "@/hooks/useCheckouts";
import { CheckoutList } from "@/components/checkouts/CheckoutList";
import { PageHeader } from "@/components/layout/PageHeader";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function MyCheckoutsPage() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all" | "active" | "returned" | "overdue">("all");

  const { data, isLoading } = useMyCheckouts(page, 20, status);
  const returnMutation = useReturnBook();

  if (!isAuthenticated) {
    return (
      <CustomerDashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please sign in to view your checkouts</p>
        </div>
      </CustomerDashboardLayout>
    );
  }

  const handleReturn = async (checkoutId: string) => {
    try {
      await returnMutation.mutateAsync(checkoutId);
      toast.success("Book returned successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to return book");
    }
  };

  return (
    <CustomerDashboardLayout>
      <PageHeader
        title="My Checkouts"
        description="View and manage your book checkouts"
        actions={
          <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Checkouts</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <CheckoutList
        checkouts={data?.checkouts || []}
        onReturn={handleReturn}
        isLoading={isLoading}
        showUser={false}
        canReturn={true}
      />
      {data?.pagination && (
        <Pagination
          currentPage={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </CustomerDashboardLayout>
  );
}

