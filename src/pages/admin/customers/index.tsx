import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, Edit, Plus, Search, Trash2, User, XCircle } from "lucide-react";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";

const editCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  maxCheckoutLimit: z.number().int().min(1),
  password: z.string().min(6).optional().or(z.literal("")),
});

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  maxCheckoutLimit: z.number().int().min(1),
  emailVerified: z.boolean(),
});

type EditCustomerFormData = z.infer<typeof editCustomerSchema>;
type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;

interface Customer {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  maxCheckoutLimit: number;
  _count: { checkouts: number };
}

export default function CustomersManagementPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditCustomerFormData>({
    resolver: zodResolver(editCustomerSchema),
  });

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors },
    reset: resetCreate,
    setValue: setValueCreate,
    watch: watchCreate,
  } = useForm<CreateCustomerFormData>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      maxCheckoutLimit: 5,
      emailVerified: false,
    },
  });

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        isStaff: "false", // Only fetch customers
        ...(searchQuery && { search: searchQuery }),
      });
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch customers");
      const data = await response.json();
      setCustomers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    if (!hasPermission("user:manage")) {
      router.push("/admin/dashboard");
      return;
    }
    fetchCustomers();
  }, [hasPermission, router, fetchCustomers]);

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    reset({
      name: customer.name || "",
      email: customer.email || "",
      maxCheckoutLimit: customer.maxCheckoutLimit,
      password: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateCustomer = () => {
    resetCreate({
      name: "",
      email: "",
      password: "",
      maxCheckoutLimit: 5,
      emailVerified: false,
    });
    setIsCreateDialogOpen(true);
  };

  const onSubmitCreate = async (data: CreateCustomerFormData) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          isStaff: false, // Customers are not staff
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create customer");
      }

      toast.success("Customer created successfully");
      setIsCreateDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create customer");
    } finally {
      setIsCreating(false);
    }
  };

  const onSubmitEdit = async (data: EditCustomerFormData) => {
    if (!selectedCustomer) return;

    setIsUpdating(true);
    try {
      const updateData: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        maxCheckoutLimit: data.maxCheckoutLimit,
      };

      if (data.password) {
        updateData.password = data.password;
      }

      const response = await fetch(`/api/admin/users/${selectedCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update customer");
      }

      toast.success("Customer updated successfully");
      setIsEditDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update customer");
    } finally {
      setIsUpdating(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!selectedCustomer) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedCustomer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete customer");
      }

      toast.success("Customer deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!hasPermission("user:manage")) {
    return null;
  }

  return (
    <AdminDashboardLayout>
      <PageHeader title="Customer Management" description="Manage customer accounts and settings" />
      <div className="space-y-4">
        {/* Search and Create */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder="Search customers by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleCreateCustomer}>
                <Plus className="size-4 mr-2" />
                Create Customer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No customers found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email Status</TableHead>
                        <TableHead>Checkout Limit</TableHead>
                        <TableHead>Active Checkouts</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {customer.image ? (
                                <Image
                                  src={customer.image}
                                  alt={customer.name || "Customer"}
                                  className="size-10 rounded-full"
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                                  <User className="size-5" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{customer.name || "No name"}</div>
                                <div className="text-sm text-muted-foreground">{customer.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.emailVerified ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="size-3" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="size-3" />
                                Unverified
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{customer.maxCheckoutLimit} books</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{customer._count.checkouts} active</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditCustomer(customer)}>
                                <Edit className="size-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCustomer(customer)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="size-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} disabled={isUpdating} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} disabled={isUpdating} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxCheckoutLimit">Max Checkout Limit</Label>
              <Input
                id="maxCheckoutLimit"
                type="number"
                {...register("maxCheckoutLimit", { valueAsNumber: true })}
                disabled={isUpdating}
              />
              {errors.maxCheckoutLimit && <p className="text-sm text-destructive">{errors.maxCheckoutLimit.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password (leave empty to keep current)</Label>
              <Input id="password" type="password" {...register("password")} disabled={isUpdating} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Customer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Customer</DialogTitle>
            <DialogDescription>Create a new customer account</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input id="create-name" {...registerCreate("name")} disabled={isCreating} />
              {createErrors.name && <p className="text-sm text-destructive">{createErrors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input id="create-email" type="email" {...registerCreate("email")} disabled={isCreating} />
              {createErrors.email && <p className="text-sm text-destructive">{createErrors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <Input id="create-password" type="password" {...registerCreate("password")} disabled={isCreating} />
              {createErrors.password && <p className="text-sm text-destructive">{createErrors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-maxCheckoutLimit">Max Checkout Limit</Label>
              <Input
                id="create-maxCheckoutLimit"
                type="number"
                {...registerCreate("maxCheckoutLimit", { valueAsNumber: true })}
                disabled={isCreating}
              />
              {createErrors.maxCheckoutLimit && (
                <p className="text-sm text-destructive">{createErrors.maxCheckoutLimit.message}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="create-emailVerified">Email Verified</Label>
              <Switch
                id="create-emailVerified"
                checked={watchCreate("emailVerified")}
                onCheckedChange={(checked) => setValueCreate("emailVerified", checked)}
                disabled={isCreating}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCustomer?.name || selectedCustomer?.email}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={onConfirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}
