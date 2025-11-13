import * as React from "react";
import { useState } from "react";
import { useCheckouts, useReturnBook } from "@/hooks/useCheckouts";
import { CheckoutList } from "@/components/checkouts/CheckoutList";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function AdminCheckoutsPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all" | "active" | "returned" | "overdue">("all");
  const [returningCheckoutId, setReturningCheckoutId] = useState<string | null>(null);

  const { data, isLoading } = useCheckouts(page, 20, status);
  const returnMutation = useReturnBook();

  if (!hasPermission("checkout:manage")) {
    return (
      <AdminDashboardLayout>
        <div className="text-center py-12">
          <p className="text-destructive">You do not have permission to manage checkouts</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  const handleReturn = async (checkoutId: string) => {
    setReturningCheckoutId(checkoutId);
    try {
      await returnMutation.mutateAsync(checkoutId);
      toast.success("Book returned successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to return book");
    } finally {
      setReturningCheckoutId(null);
    }
  };

  return (
    <AdminDashboardLayout>
      <PageHeader
        title="Manage Checkouts"
        description="View and manage all book checkouts"
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
        showUser={true}
        canReturn={true}
        returningCheckoutId={returningCheckoutId}
      />
      {data?.pagination && (
        <Pagination
          currentPage={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </AdminDashboardLayout>
  );
}
