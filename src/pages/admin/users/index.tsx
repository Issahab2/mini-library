import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Edit, Plus, Search, Shield, Trash2, User, XCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const editUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  isStaff: z.boolean(),
  maxCheckoutLimit: z.number().int().min(1),
  password: z.string().min(6).optional().or(z.literal("")),
});

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isStaff: z.boolean(),
  maxCheckoutLimit: z.number().int().min(1),
  emailVerified: z.boolean(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;
type CreateUserFormData = z.infer<typeof createUserSchema>;

interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  isStaff: boolean;
  maxCheckoutLimit: number;
  roles: Array<{ id: string; name: string; description: string | null }>;
  _count: { checkouts: number };
}

export default function UsersManagementPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingRoles, setIsUpdatingRoles] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors },
    reset: resetCreate,
    setValue: setValueCreate,
    watch: watchCreate,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      isStaff: true,
      maxCheckoutLimit: 5,
      emailVerified: true,
    },
  });

  const isStaff = watch("isStaff");
  const createIsStaff = watchCreate("isStaff");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        isStaff: "true", // Only fetch staff users
        ...(searchQuery && { search: searchQuery }),
      });
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery]);
  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/roles");
      if (!response.ok) throw new Error("Failed to fetch roles");
      const data = await response.json();
      setRoles(data.roles);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  }, [setRoles]);

  useEffect(() => {
    if (!hasPermission("user:manage")) {
      router.push("/admin/dashboard");
      return;
    }
    fetchUsers();
    fetchRoles();
  }, [hasPermission, router, fetchUsers, fetchRoles]);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    reset({
      name: user.name || "",
      email: user.email || "",
      isStaff: user.isStaff,
      maxCheckoutLimit: user.maxCheckoutLimit,
      password: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditRoles = (user: User) => {
    setSelectedUser(user);
    setSelectedRoleIds(user.roles.map((r) => r.id));
    setIsRoleDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateUser = () => {
    resetCreate({
      name: "",
      email: "",
      password: "",
      isStaff: true,
      maxCheckoutLimit: 5,
      emailVerified: true,
    });
    setIsCreateDialogOpen(true);
  };

  const onSubmitCreate = async (data: CreateUserFormData) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      toast.success("User created successfully");
      setIsCreateDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setIsCreating(false);
    }
  };

  const onSubmitEdit = async (data: EditUserFormData) => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      const updateData: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        isStaff: data.isStaff,
        maxCheckoutLimit: data.maxCheckoutLimit,
      };

      if (data.password) {
        updateData.password = data.password;
      }

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  const onSubmitRoles = async () => {
    if (!selectedUser) return;

    setIsUpdatingRoles(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleIds: selectedRoleIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update roles");
      }

      toast.success("User roles updated successfully");
      setIsRoleDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update roles");
    } finally {
      setIsUpdatingRoles(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!hasPermission("user:manage")) {
    return null;
  }

  return (
    <AdminDashboardLayout>
      <PageHeader title="Staff Management" description="Manage staff users, roles, and permissions" />
      <div className="space-y-4">
        {/* Search and Create */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleCreateUser}>
                <Plus className="size-4 mr-2" />
                Create Staff
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email Status</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Checkouts</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {user.image ? (
                                <Image
                                  src={user.image}
                                  alt={user.name || "User"}
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
                                <div className="font-medium">{user.name || "No name"}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.emailVerified ? (
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
                            <div className="flex flex-wrap gap-1">
                              {user.roles.length > 0 ? (
                                user.roles.map((role) => (
                                  <Badge key={role.id} variant="outline">
                                    {role.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">No roles</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.isStaff ? (
                              <Badge variant="default" className="gap-1">
                                <Shield className="size-3" />
                                Staff
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Customer</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{user._count.checkouts} active</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                <Edit className="size-4 mr-1" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditRoles(user)}>
                                <Shield className="size-4 mr-1" />
                                Roles
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="isStaff">Staff Member</Label>
              <Switch
                id="isStaff"
                checked={isStaff}
                onCheckedChange={(checked) => setValue("isStaff", checked)}
                disabled={isUpdating}
              />
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

      {/* Edit Roles Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>Assign roles to {selectedUser?.name || selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRoleIds([...selectedRoleIds, role.id]);
                        } else {
                          setSelectedRoleIds(selectedRoleIds.filter((id) => id !== role.id));
                        }
                      }}
                      disabled={isUpdatingRoles}
                    />
                    <Label htmlFor={`role-${role.id}`} className="font-normal cursor-pointer">
                      {role.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRoleDialogOpen(false)}
                disabled={isUpdatingRoles}
              >
                Cancel
              </Button>
              <Button type="button" onClick={onSubmitRoles} disabled={isUpdatingRoles}>
                {isUpdatingRoles ? "Saving..." : "Save Roles"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Staff Member</DialogTitle>
            <DialogDescription>Create a new staff user account</DialogDescription>
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
              <Label htmlFor="create-isStaff">Staff Member</Label>
              <Switch
                id="create-isStaff"
                checked={createIsStaff}
                onCheckedChange={(checked) => setValueCreate("isStaff", checked)}
                disabled={isCreating}
              />
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
                {isCreating ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.name || selectedUser?.email}? This action cannot be undone.
              If the user has active checkouts, they must be returned first.
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
