import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/router";
import { useBooks, useDeleteBook } from "@/hooks/useBooks";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { CTAButton, ErrorButton } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import type { BookWithRelations } from "@/lib/server/types";
import { BookStatus } from "@prisma/client";
import Image from "next/image";
import { Edit, Trash2 } from "lucide-react";

export default function AdminBooksPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading } = useBooks(page, 20);
  const deleteMutation = useDeleteBook();

  const canCreate = hasPermission("book:create");
  const canUpdate = hasPermission("book:update");
  const canDelete = hasPermission("book:delete");

  const handleDelete = async () => {
    if (!bookToDelete) return;
    try {
      await deleteMutation.mutateAsync(bookToDelete.id);
      toast.success("Book deleted successfully");
      setDeleteDialogOpen(false);
      setBookToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete book");
    }
  };

  const handleDeleteClick = (book: BookWithRelations) => {
    setBookToDelete({ id: book.id, title: book.title });
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (bookId: string) => {
    router.push(`/admin/books/${bookId}/edit`);
  };

  if (!session) {
    return (
      <AdminDashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please sign in to access this page</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (!canCreate && !canUpdate && !canDelete) {
    return (
      <AdminDashboardLayout>
        <div className="text-center py-12">
          <p className="text-destructive">You do not have permission to manage books</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  const books = data?.books || [];

  return (
    <AdminDashboardLayout>
      <PageHeader
        title="Manage Books"
        description="Create, edit, and delete books"
        actions={
          canCreate ? <CTAButton onClick={() => router.push("/admin/books/new")}>Create New Book</CTAButton> : null
        }
      />
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-16 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : books.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <p className="text-muted-foreground">No books found</p>
                </TableCell>
              </TableRow>
            ) : (
              books.map((book: BookWithRelations) => {
                const status = book.status || BookStatus.AVAILABLE;
                return (
                  <TableRow key={book.id}>
                    <TableCell>
                      {book.coverImageUrl ? (
                        <div className="relative h-16 w-12 overflow-hidden rounded border border-border">
                          <Image src={book.coverImageUrl} alt={book.title} fill className="object-cover" sizes="48px" />
                        </div>
                      ) : (
                        <div className="h-16 w-12 rounded border border-border bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No cover</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{book.title}</div>
                      {book.publicationYear && (
                        <div className="text-sm text-muted-foreground">{book.publicationYear}</div>
                      )}
                    </TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{book.isbn || "—"}</span>
                    </TableCell>
                    <TableCell>
                      {book.genre ? (
                        <Badge variant="secondary">{book.genre}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status === BookStatus.AVAILABLE ? "default" : "secondary"}>
                        {status === BookStatus.AVAILABLE ? "Available" : "Checked Out"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(book.id)}
                            className="h-8 w-8"
                            aria-label="Edit book"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(book)}
                            className="h-8 w-8 text-destructive hover:text-destructive-foreground hover:bg-destructive/10 dark:hover:bg-destructive/20"
                            aria-label="Delete book"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {data?.pagination && (
        <Pagination
          currentPage={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{bookToDelete?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <ErrorButton onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </ErrorButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}
