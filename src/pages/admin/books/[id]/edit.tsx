import * as React from "react";
import { useRouter } from "next/router";
import { useBook, useUpdateBook } from "@/hooks/useBooks";
import { BookForm } from "@/components/books/BookForm";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import type { CreateBookInput, UpdateBookInput } from "@/lib/server/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function EditBookPage() {
  const router = useRouter();
  const { id } = router.query;
  const { hasPermission } = useAuth();
  const { data, isLoading } = useBook(id as string);
  const updateMutation = useUpdateBook();

  if (!hasPermission("book:update")) {
    return (
      <AdminDashboardLayout>
        <div className="text-center py-12">
          <p className="text-destructive">You do not have permission to edit books</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminDashboardLayout>
        <Skeleton className="h-96 w-full" />
      </AdminDashboardLayout>
    );
  }

  if (!data?.book) {
    return (
      <AdminDashboardLayout>
        <div className="text-center py-12">
          <p className="text-destructive">Book not found</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  const handleSubmit = async (data: CreateBookInput | UpdateBookInput) => {
    if (!id || typeof id !== "string") return;
    // Extract id if present, otherwise use route id
    const bookId = "id" in data ? data.id : id;
    const updateData: UpdateBookInput = {
      id: bookId,
      ...data,
    };
    try {
      await updateMutation.mutateAsync({ id: bookId, data: updateData });
      toast.success("Book updated successfully!");
      router.push("/admin/books");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update book");
    }
  };

  const handleCancel = () => {
    router.push("/admin/books");
  };

  return (
    <AdminDashboardLayout>
      <PageHeader title="Edit Book" description="Update book information" />
      <BookForm
        initialData={data.book}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateMutation.isPending}
        bookId={id as string}
        onAIGenerate={() => {
          // Refresh the book data after enrichment
          router.replace(router.asPath);
        }}
      />
    </AdminDashboardLayout>
  );
}
