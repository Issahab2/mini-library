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
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Key, Plus, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const createPermissionSchema = z.object({
  action: z.string().min(1, "Permission action is required"),
  description: z.string().optional(),
});

const updatePermissionSchema = z.object({
  action: z.string().min(1, "Permission action is required"),
  description: z.string().optional(),
});

type CreatePermissionFormData = z.infer<typeof createPermissionSchema>;
type UpdatePermissionFormData = z.infer<typeof updatePermissionSchema>;

interface Permission {
  id: string;
  action: string;
  description: string | null;
  roleCount: number;
}

export default function PermissionsManagementPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreatePermissionFormData>({
    resolver: zodResolver(createPermissionSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
  } = useForm<UpdatePermissionFormData>({
    resolver: zodResolver(updatePermissionSchema),
  });

  useEffect(() => {
    if (!hasPermission("permission:manage")) {
      router.push("/admin/dashboard");
      return;
    }
    fetchPermissions();
  }, [hasPermission, router]);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/permissions");
      if (!response.ok) throw new Error("Failed to fetch permissions");
      const data = await response.json();
      setPermissions(data.permissions);
    } catch {
      toast.error("Failed to load permissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePermission = () => {
    reset({
      action: "",
      description: "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditPermission = (permission: Permission) => {
    setSelectedPermission(permission);
    resetEdit({
      action: permission.action,
      description: permission.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeletePermission = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsDeleteDialogOpen(true);
  };

  const onSubmitCreate = async (data: CreatePermissionFormData) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create permission");
      }

      toast.success("Permission created successfully");
      setIsCreateDialogOpen(false);
      fetchPermissions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create permission");
    } finally {
      setIsCreating(false);
    }
  };

  const onSubmitEdit = async (data: UpdatePermissionFormData) => {
    if (!selectedPermission) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/permissions/${selectedPermission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update permission");
      }

      toast.success("Permission updated successfully");
      setIsEditDialogOpen(false);
      fetchPermissions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update permission");
    } finally {
      setIsUpdating(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!selectedPermission) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/permissions/${selectedPermission.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete permission");
      }

      toast.success("Permission deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchPermissions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete permission");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!hasPermission("permission:manage")) {
    return null;
  }

  return (
    <AdminDashboardLayout>
      <PageHeader
        title="Permission Management"
        description="View all available permissions in the system"
        actions={
          <Button onClick={handleCreatePermission}>
            <Plus className="size-4 mr-2" />
            Create Permission
          </Button>
        }
      />
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No permissions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Assigned to Roles</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Key className="size-4" />
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{permission.action}</code>
                          </div>
                        </TableCell>
                        <TableCell>
                          {permission.description || <span className="text-muted-foreground">No description</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{permission.roleCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditPermission(permission)}>
                              <Edit className="size-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePermission(permission)}
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Permission Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Permission</DialogTitle>
            <DialogDescription>Create a new permission for the system</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="permission-action">Action</Label>
              <Input
                id="permission-action"
                {...register("action")}
                placeholder="e.g., book:create, user:manage"
                disabled={isCreating}
              />
              {errors.action && <p className="text-sm text-destructive">{errors.action.message}</p>}
              <p className="text-xs text-muted-foreground">
                Format: resource:action (e.g., book:create, checkout:manage)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission-description">Description</Label>
              <Textarea
                id="permission-description"
                {...register("description")}
                placeholder="Describe what this permission allows..."
                rows={3}
                disabled={isCreating}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
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
                {isCreating ? "Creating..." : "Create Permission"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Permission Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>Edit permission details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-permission-action">Action</Label>
              <Input
                id="edit-permission-action"
                {...registerEdit("action")}
                placeholder="e.g., book:create, user:manage"
                disabled={isUpdating}
              />
              {editErrors.action && <p className="text-sm text-destructive">{editErrors.action.message}</p>}
              <p className="text-xs text-muted-foreground">
                Format: resource:action (e.g., book:create, checkout:manage)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-permission-description">Description</Label>
              <Textarea
                id="edit-permission-description"
                {...registerEdit("description")}
                placeholder="Describe what this permission allows..."
                rows={3}
                disabled={isUpdating}
              />
              {editErrors.description && <p className="text-sm text-destructive">{editErrors.description.message}</p>}
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

      {/* Delete Permission Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Permission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedPermission?.action}? This action cannot be undone. If the
              permission is assigned to any roles, you must remove it from those roles first.
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
