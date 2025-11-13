import * as React from "react";
import { useRouter } from "next/router";
import { useCreateBook } from "@/hooks/useBooks";
import { BookForm } from "@/components/books/BookForm";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import type { CreateBookInput, UpdateBookInput } from "@/lib/server/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function NewBookPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const createMutation = useCreateBook();

  if (!hasPermission("book:create")) {
    return (
      <AdminDashboardLayout>
        <div className="text-center py-12">
          <p className="text-destructive">You do not have permission to create books</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  const handleSubmit = async (data: CreateBookInput | UpdateBookInput) => {
    // For create, we only need CreateBookInput (no id)
    // Ensure required fields are present
    if (!data.title || !data.author) {
      toast.error("Title and author are required");
      return;
    }
    const createData: CreateBookInput = {
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      description: data.description,
      summary: data.summary,
      publisher: data.publisher,
      publicationYear: data.publicationYear,
      genre: data.genre,
      pageCount: data.pageCount,
      language: data.language,
      coverImageUrl: data.coverImageUrl,
      status: data.status,
    };
    try {
      await createMutation.mutateAsync(createData);
      toast.success("Book created successfully!");
      router.push("/admin/books");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create book");
    }
  };

  return (
    <AdminDashboardLayout>
      <PageHeader title="Create New Book" description="Add a new book to the library" />
      <BookForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        onAIGenerate={() => {
          // AI data is already populated in the form, just show success
          toast.success("AI data generated! Review and adjust as needed.");
        }}
      />
    </AdminDashboardLayout>
  );
}
