"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  Edit,
  Shield,
  UserCheck,
  X,
  Check,
  Loader2,
  AlertCircle,
  Mail,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import {
  cn,
  formatDate,
  formatDateTime,
  getRelativeTime,
} from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminUser {
  userId: string;
  email: string;
  name: string;
  departmentCode: string;
  role: "Students" | "DeptHeads" | "SuperAdmins";
  reliabilityScore?: number;
  createdAt: string;
  disabled?: boolean;
}

// ── User Row ───────────────────────────────────────────────────────────────────

function UserRow({
  user,
  onEdit,
  onDisable,
}: {
  user: AdminUser;
  onEdit: (id: string) => void;
  onDisable: (id: string) => void;
}) {
  const roleColors = {
    Students: "bg-blue-100 text-blue-700",
    DeptHeads: "bg-purple-100 text-purple-700",
    SuperAdmins: "bg-red-100 text-red-700",
  };

  const deptColors: Record<string, string> = {
    CSE: "bg-cyan-100 text-cyan-700",
    IT: "bg-green-100 text-green-700",
    ECE: "bg-orange-100 text-orange-700",
    EEE: "bg-yellow-100 text-yellow-700",
    MECH: "bg-pink-100 text-pink-700",
    CIVIL: "bg-teal-100 text-teal-700",
    "AI&DS": "bg-indigo-100 text-indigo-700",
  };

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {user.name}
                </p>
                <Badge className={cn("text-xs", roleColors[user.role])}>
                  {user.role}
                </Badge>
                {user.disabled && (
                  <Badge variant="destructive" className="text-xs">
                    Disabled
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </span>
                {user.departmentCode && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <Badge className={cn("text-xs", deptColors[user.departmentCode] || "bg-gray-100 text-gray-600")}>
                      {user.departmentCode}
                    </Badge>
                  </span>
                )}
              </div>
              {user.reliabilityScore !== undefined && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 max-w-[120px] h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${user.reliabilityScore}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Reliability: {user.reliabilityScore}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground group-hover:text-foreground"
              onClick={() => onEdit(user.userId)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {!user.disabled && user.role !== "SuperAdmins" && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground group-hover:text-red-500"
                onClick={() => onDisable(user.userId)}
              >
                <UserCheck className="h-4 w-4" />
              </Button>
            )}
            {user.disabled && (
              <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
                Disabled
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Edit User Modal ────────────────────────────────────────────────────────────

function EditUserModal({
  open,
  onClose,
  onSubmit,
  editingUser,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { userId: string; role?: string; departmentCode?: string; name?: string }) => void;
  editingUser?: AdminUser | null;
}) {
  const [role, setRole] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingUser) {
      setRole(editingUser.role);
      setDepartmentCode(editingUser.departmentCode || "");
      setName(editingUser.name);
    } else {
      setRole("");
      setDepartmentCode("");
      setName("");
    }
    setError("");
  }, [editingUser, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!role && !departmentCode && !name) {
      setError("No changes specified");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        userId: editingUser!.userId,
        role: role || undefined,
        departmentCode: departmentCode || undefined,
        name: name || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const roleOptions = [
    { value: "Students", label: "Student" },
    { value: "DeptHeads", label: "Department Head" },
    { value: "SuperAdmins", label: "Super Admin" },
  ];

  const deptOptions = [
    { value: "", label: "No department" },
    { value: "CSE", label: "CSE" },
    { value: "IT", label: "IT" },
    { value: "ECE", label: "ECE" },
    { value: "EEE", label: "EEE" },
    { value: "MECH", label: "MECH" },
    { value: "CIVIL", label: "CIVIL" },
    { value: "AI&DS", label: "AI&DS" },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit User"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            <X className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {editingUser && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-1.5">
            <p className="text-sm font-medium">{editingUser.name}</p>
            <p className="text-xs text-muted-foreground">{editingUser.email}</p>
            <p className="text-xs text-muted-foreground">ID: {editingUser.userId}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Role</label>
          <Dropdown
            options={roleOptions}
            value={role}
            onChange={setRole}
            placeholder="Select role"
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Department</label>
          <Dropdown
            options={deptOptions}
            value={departmentCode}
            onChange={setDepartmentCode}
            placeholder="Select department"
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full"
          />
        </div>

        <div className="pt-2 flex justify-end gap-3 border-t border-border">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Update
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────

function AdminUsersContent() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [disableConfirm, setDisableConfirm] = useState<string | null>(null);
  const [disabling, setDisabling] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (deptFilter) params.set("departmentCode", deptFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, deptFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdate = async (data: { userId: string; role?: string; departmentCode?: string; name?: string }) => {
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to update");
    }
    const { user } = await res.json();
    setUsers((prev) =>
      prev.map((u) => (u.userId === user.userId ? (user as unknown as AdminUser) : u))
    );
  };

  const handleDisable = async (userId: string) => {
    setDisabling(true);
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to disable");
      }
      setUsers((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, disabled: true } : u))
      );
      setDisableConfirm(null);
    } catch (err: any) {
      alert(err.message || "Failed to disable user");
    } finally {
      setDisabling(false);
    }
  };

  const studentCount = users.filter((u) => u.role === "Students").length;
  const hodCount = users.filter((u) => u.role === "DeptHeads").length;
  const adminCount = users.filter((u) => u.role === "SuperAdmins").length;
  const disabledCount = users.filter((u) => u.disabled).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-purple-600" />
            Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all users across the platform
          </p>
        </div>
        <Button onClick={() => { setEditingUser(null); setShowEditModal(true); }}>
          <Shield className="h-4 w-4" />
          Add/Edit User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{users.length}</p>
            <p className="text-xs text-purple-600 mt-1">Total Users</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{studentCount}</p>
            <p className="text-xs text-blue-600 mt-1">Students</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{hodCount}</p>
            <p className="text-xs text-purple-600 mt-1">Dept Heads</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 border-red-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{adminCount}</p>
            <p className="text-xs text-red-600 mt-1">Super Admins</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-50/50 border-gray-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{disabledCount}</p>
            <p className="text-xs text-gray-600 mt-1">Disabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Roles</option>
            <option value="Students">Students</option>
            <option value="DeptHeads">Dept Heads</option>
            <option value="SuperAdmins">Super Admins</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
            <option value="AI&DS">AI&DS</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="skeleton" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || roleFilter || deptFilter
                ? "Try adjusting your filters"
                : "No users have registered yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <UserRow
              key={user.userId}
              user={user}
              onEdit={(id) => {
                const u = users.find((u) => u.userId === id);
                if (u) setEditingUser(u);
                setShowEditModal(true);
              }}
              onDisable={(id) => setDisableConfirm(id)}
            />
          ))}
        </div>
      )}

      {/* Pagination info */}
      {!loading && users.length > 0 && (
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Showing {users.length} user{users.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Edit Modal */}
      <EditUserModal
        open={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingUser(null); }}
        onSubmit={editingUser ? handleUpdate : () => {}}
        editingUser={editingUser}
      />

      <ConfirmModal
        open={disableConfirm !== null}
        onClose={() => setDisableConfirm(null)}
        onConfirm={() => disableConfirm && handleDisable(disableConfirm)}
        title="Disable User?"
        message="This will disable the user's account. They will no longer be able to log in. This action cannot be undone."
        confirmLabel="Disable"
        variant="destructive"
        isLoading={disabling}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse text-lg font-medium">Loading users...</div>
        </div>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}
