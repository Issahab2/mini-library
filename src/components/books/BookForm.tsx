import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookStatus } from "@prisma/client";
import type { CreateBookInput, UpdateBookInput } from "@/lib/server/types";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().optional(),
  description: z.string().optional(),
  summary: z.string().optional(),
  publisher: z.string().optional(),
  publicationYear: z.number().int().min(1000).max(2100).optional().or(z.literal("")),
  genre: z.string().optional(),
  pageCount: z.number().int().positive().optional().or(z.literal("")),
  language: z.string().optional(),
  coverImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.nativeEnum(BookStatus).optional(),
});

type BookFormData = z.infer<typeof bookSchema>;

interface BookFormProps {
  initialData?: Partial<CreateBookInput>;
  onSubmit: (data: CreateBookInput | UpdateBookInput) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function BookForm({ initialData, onSubmit, onCancel, isLoading }: BookFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: initialData?.title || "",
      author: initialData?.author || "",
      isbn: initialData?.isbn || "",
      description: initialData?.description || "",
      summary: initialData?.summary || "",
      publisher: initialData?.publisher || "",
      publicationYear: initialData?.publicationYear || undefined,
      genre: initialData?.genre || "",
      pageCount: initialData?.pageCount || undefined,
      language: initialData?.language || "",
      coverImageUrl: initialData?.coverImageUrl || "",
      status: initialData?.status || BookStatus.AVAILABLE,
    },
  });

  const status = watch("status");

  const onSubmitForm = async (data: BookFormData) => {
    const submitData: CreateBookInput | UpdateBookInput = {
      ...(initialData && "id" in initialData ? { id: (initialData as UpdateBookInput).id } : {}),
      title: data.title,
      author: data.author,
      isbn: data.isbn || undefined,
      description: data.description || undefined,
      summary: data.summary || undefined,
      publisher: data.publisher || undefined,
      publicationYear: typeof data.publicationYear === "number" ? data.publicationYear : undefined,
      genre: data.genre || undefined,
      pageCount: typeof data.pageCount === "number" ? data.pageCount : undefined,
      language: data.language || undefined,
      coverImageUrl: data.coverImageUrl || undefined,
      status: data.status,
    };
    await onSubmit(submitData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Book" : "Create New Book"}</CardTitle>
        <CardDescription>Fill in the book details below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">
                Author <span className="text-destructive">*</span>
              </Label>
              <Input id="author" {...register("author")} />
              {errors.author && <p className="text-sm text-destructive">{errors.author.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input id="isbn" {...register("isbn")} />
              {errors.isbn && <p className="text-sm text-destructive">{errors.isbn.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Input id="genre" {...register("genre")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publisher">Publisher</Label>
              <Input id="publisher" {...register("publisher")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publicationYear">Publication Year</Label>
              <Input
                id="publicationYear"
                type="number"
                {...register("publicationYear", { valueAsNumber: true })}
              />
              {errors.publicationYear && (
                <p className="text-sm text-destructive">{errors.publicationYear.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageCount">Page Count</Label>
              <Input id="pageCount" type="number" {...register("pageCount", { valueAsNumber: true })} />
              {errors.pageCount && <p className="text-sm text-destructive">{errors.pageCount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input id="language" {...register("language")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">Cover Image URL</Label>
              <Input id="coverImageUrl" type="url" {...register("coverImageUrl")} />
              {errors.coverImageUrl && <p className="text-sm text-destructive">{errors.coverImageUrl.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setValue("status", value as BookStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BookStatus.AVAILABLE}>Available</SelectItem>
                  <SelectItem value={BookStatus.CHECKED_OUT}>Checked Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea id="summary" {...register("summary")} rows={5} />
          </div>
          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : initialData ? "Update Book" : "Create Book"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

