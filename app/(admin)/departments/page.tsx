"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  X,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import { cn, formatDate } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Department {
  departmentCode: string;
  name: string;
  hodUserId: string;
  hodName: string;
  active: boolean;
}

// ── Department Card ────────────────────────────────────────────────────────────

function DepartmentCard({
  dept,
  onEdit,
  onDelete,
}: {
  dept: Department;
  onEdit: (code: string) => void;
  onDelete: (code: string) => void;
}) {
  const statusKey = dept.active ? "active" : "inactive";
  const statusColors = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-red-100 text-red-700",
  };

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {dept.name}
                </h3>
                <Badge className="text-xs font-mono border-border">
                  {dept.departmentCode}
                </Badge>
                <Badge className={cn("text-xs", statusColors[statusKey])}>
                  {dept.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                {dept.hodName ? (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    HOD: {dept.hodName}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">
                    No HOD assigned
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground group-hover:text-foreground"
              onClick={() => onEdit(dept.departmentCode)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {dept.active && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground group-hover:text-red-500"
                onClick={() => onDelete(dept.departmentCode)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Create / Edit Modal ────────────────────────────────────────────────────────

function DepartmentModal({
  open,
  onClose,
  onSubmit,
  editingDept,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { departmentCode: string; name: string; hodUserId?: string }) => void;
  editingDept?: Department | null;
}) {
  const [departmentCode, setDepartmentCode] = useState("");
  const [name, setName] = useState("");
  const [hodUserId, setHodUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [availableHODs, setAvailableHODs] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (editingDept) {
      setDepartmentCode(editingDept.departmentCode);
      setName(editingDept.name);
      setHodUserId(editingDept.hodUserId || "");
    } else {
      setDepartmentCode("");
      setName("");
      setHodUserId("");
    }
    setError("");

    // Fetch available HODs (DeptHeads and SuperAdmins)
    fetch("/api/users?role=DeptHeads")
      .then((res) => res.json())
      .then((data) => {
        setAvailableHODs(
          (data.users || [])
            .filter((u: any) => !u.disabled)
            .map((u: any) => ({ value: u.userId, label: `${u.name} (${u.email})` }))
        );
      })
      .catch(() => setAvailableHODs([]));
  }, [editingDept, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!departmentCode.trim()) {
      setError("Department code is required");
      return;
    }
    if (!name.trim()) {
      setError("Department name is required");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        departmentCode: departmentCode.toUpperCase().trim(),
        name: name.trim(),
        hodUserId: hodUserId || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const isEditing = !!editingDept;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit Department: ${editingDept!.name}` : "Create Department"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            <X className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {editingDept && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Editing <strong>{editingDept.name}</strong> ({editingDept.departmentCode})
            </p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-foreground block mb-1">
            Department Code <span className="text-destructive">*</span>
          </label>
          <Input
            value={departmentCode}
            onChange={(e) => setDepartmentCode(e.target.value.toUpperCase())}
            placeholder="e.g., CSE, IT, AI&DS"
            className="w-full font-mono text-sm"
            maxLength={10}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use uppercase letters and & only
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1">
            Department Name <span className="text-destructive">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Computer Science & Engineering"
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1">
            Head of Department
          </label>
          <Dropdown
            options={[
              { value: "", label: "None (no HOD assigned)" },
              ...availableHODs,
            ]}
            value={hodUserId}
            onChange={setHodUserId}
            placeholder="Select HOD"
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
                {isEditing ? "Update" : "Create"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────

function AdminDepartmentsContent() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      let list = (data.departments || []) as Department[];

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.departmentCode.toLowerCase().includes(q)
        );
      }

      setDepartments(list);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCreate = async (data: { departmentCode: string; name: string; hodUserId?: string }) => {
    const res = await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to create");
    }
    const { department } = await res.json();
    setDepartments((prev) => [...prev, department as unknown as Department]);
  };

  const handleUpdate = async (data: { departmentCode: string; name: string; hodUserId?: string }) => {
    if (!editingDept) return;
    const res = await fetch("/api/departments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, departmentCode: editingDept.departmentCode }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to update");
    }
    const { department } = await res.json();
    setDepartments((prev) =>
      prev.map((d) =>
        d.departmentCode === department.departmentCode
          ? (department as unknown as Department)
          : d
      )
    );
  };

  const handleDelete = async (departmentCode: string) => {
    setDeleting(true);
    try {
      const res = await fetch("/api/departments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentCode }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to deactivate");
      }
      setDepartments((prev) =>
        prev.map((d) => (d.departmentCode === departmentCode ? { ...d, active: false } : d))
      );
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message || "Failed to deactivate department");
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = departments.filter((d) => d.active).length;
  const inactiveCount = departments.filter((d) => !d.active).length;
  const unassignedCount = departments.filter((d) => !d.hodUserId).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-7 w-7 text-purple-600" />
            Departments
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage college departments and HOD assignments
          </p>
        </div>
        <Button onClick={() => { setEditingDept(null); setShowCreateModal(true); }}>
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{departments.length}</p>
            <p className="text-xs text-purple-600 mt-1">Total Departments</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{activeCount}</p>
            <p className="text-xs text-green-600 mt-1">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{unassignedCount}</p>
            <p className="text-xs text-amber-600 mt-1">Unassigned HODs</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 border-red-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{inactiveCount}</p>
            <p className="text-xs text-red-600 mt-1">Inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Departments List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="skeleton" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No departments yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first department to get started
            </p>
            <Button onClick={() => { setEditingDept(null); setShowCreateModal(true); }}>
              <Plus className="h-4 w-4" />
              Add Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.departmentCode}
              dept={dept}
              onEdit={(code) => {
                const d = departments.find((d) => d.departmentCode === code);
                if (d) setEditingDept(d);
                setShowCreateModal(true);
              }}
              onDelete={(code) => setDeleteConfirm(code)}
            />
          ))}
        </div>
      )}

      {/* Pagination info */}
      {!loading && departments.length > 0 && (
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Showing {departments.length} department{departments.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Modal */}
      <DepartmentModal
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingDept(null); }}
        onSubmit={editingDept ? handleUpdate : handleCreate}
        editingDept={editingDept}
      />

      <ConfirmModal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Deactivate Department?"
        message={`This will deactivate the department "${deleteConfirm}". Events and registrations associated with this department will not be affected.`}
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={deleting}
      />
    </div>
  );
}

export default function AdminDepartmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse text-lg font-medium">Loading departments...</div>
        </div>
      }
    >
      <AdminDepartmentsContent />
    </Suspense>
  );
}
