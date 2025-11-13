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
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Shield, Users, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;
type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Array<{ id: string; action: string; description: string | null }>;
  userCount: number;
}

interface Permission {
  id: string;
  action: string;
  description: string | null;
}

export default function RolesManagementPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [editSelectedPermissionIds, setEditSelectedPermissionIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
  } = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
  });

  useEffect(() => {
    if (!hasPermission("role:manage")) {
      router.push("/admin/dashboard");
      return;
    }
    fetchRoles();
    fetchPermissions();
  }, [hasPermission, router]);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/roles");
      if (!response.ok) throw new Error("Failed to fetch roles");
      const data = await response.json();
      setRoles(data.roles);
    } catch {
      toast.error("Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/admin/permissions");
      if (!response.ok) throw new Error("Failed to fetch permissions");
      const data = await response.json();
      setPermissions(data.permissions);
    } catch {
      // Silently fail - permissions are optional for role creation
    }
  };

  const handleCreateRole = () => {
    reset({
      name: "",
      description: "",
    });
    setSelectedPermissionIds([]);
    setIsCreateDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    resetEdit({
      name: role.name,
      description: role.description || "",
    });
    setEditSelectedPermissionIds(role.permissions.map((p) => p.id));
    setIsEditDialogOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const onSubmitCreate = async (data: CreateRoleFormData) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          permissionIds: selectedPermissionIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create role");
      }

      toast.success("Role created successfully");
      setIsCreateDialogOpen(false);
      fetchRoles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create role");
    } finally {
      setIsCreating(false);
    }
  };

  const onSubmitEdit = async (data: UpdateRoleFormData) => {
    if (!selectedRole) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          permissionIds: editSelectedPermissionIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update role");
      }

      toast.success("Role updated successfully");
      setIsEditDialogOpen(false);
      fetchRoles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setIsUpdating(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!selectedRole) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete role");
      }

      toast.success("Role deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchRoles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete role");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!hasPermission("role:manage")) {
    return null;
  }

  return (
    <AdminDashboardLayout>
      <PageHeader
        title="Role Management"
        description="View roles and their assigned permissions"
        actions={
          <Button onClick={handleCreateRole}>
            <Plus className="size-4 mr-2" />
            Create Role
          </Button>
        }
      />
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No roles found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              <Shield className="size-4" />
                              {role.name}
                            </div>
                            {role.description && (
                              <div className="text-sm text-muted-foreground">{role.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Users className="size-3" />
                            {role.userCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.length > 0 ? (
                              role.permissions.map((permission) => (
                                <Badge key={permission.id} variant="secondary" className="text-xs">
                                  {permission.action}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No permissions</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditRole(role)}>
                              <Edit className="size-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRole(role)}
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

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>Create a new role and assign permissions</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input id="role-name" {...register("name")} placeholder="e.g., Librarian" disabled={isCreating} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                {...register("description")}
                placeholder="Describe the role's purpose..."
                rows={3}
                disabled={isCreating}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                {permissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No permissions available</p>
                ) : (
                  permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`perm-${permission.id}`}
                        checked={selectedPermissionIds.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPermissionIds([...selectedPermissionIds, permission.id]);
                          } else {
                            setSelectedPermissionIds(selectedPermissionIds.filter((id) => id !== permission.id));
                          }
                        }}
                        disabled={isCreating}
                      />
                      <Label htmlFor={`perm-${permission.id}`} className="font-normal cursor-pointer flex-1">
                        <div>
                          <code className="text-sm font-mono">{permission.action}</code>
                          {permission.description && (
                            <div className="text-xs text-muted-foreground">{permission.description}</div>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>
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
                {isCreating ? "Creating..." : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Edit role details and permissions</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role-name">Role Name</Label>
              <Input
                id="edit-role-name"
                {...registerEdit("name")}
                placeholder="e.g., Librarian"
                disabled={isUpdating}
              />
              {editErrors.name && <p className="text-sm text-destructive">{editErrors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role-description">Description</Label>
              <Textarea
                id="edit-role-description"
                {...registerEdit("description")}
                placeholder="Describe the role's purpose..."
                rows={3}
                disabled={isUpdating}
              />
              {editErrors.description && <p className="text-sm text-destructive">{editErrors.description.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                {permissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No permissions available</p>
                ) : (
                  permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-perm-${permission.id}`}
                        checked={editSelectedPermissionIds.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditSelectedPermissionIds([...editSelectedPermissionIds, permission.id]);
                          } else {
                            setEditSelectedPermissionIds(
                              editSelectedPermissionIds.filter((id) => id !== permission.id)
                            );
                          }
                        }}
                        disabled={isUpdating}
                      />
                      <Label htmlFor={`edit-perm-${permission.id}`} className="font-normal cursor-pointer flex-1">
                        <div>
                          <code className="text-sm font-mono">{permission.action}</code>
                          {permission.description && (
                            <div className="text-xs text-muted-foreground">{permission.description}</div>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>
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

      {/* Delete Role Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedRole?.name}? This action cannot be undone. If the role has users
              assigned, you must reassign them first.
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
