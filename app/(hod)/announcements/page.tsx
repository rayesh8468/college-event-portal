"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Clock,
  X,
  Check,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal, ConfirmModal } from "@/components/ui/Modal";

import { cn, formatDate, formatDateTime, getRelativeTime } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Announcement {
  announcementId: string;
  title: string;
  content: string;
  authorUserId: string;
  authorName: string;
  departmentCode?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  expiresAt?: string;
}

// ── Announcement Card ──────────────────────────────────────────────────────────

function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
}: {
  announcement: Announcement;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const priorityColors = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
  };

  const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date();
  const isUrgent = !announcement.expiresAt || new Date(announcement.expiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={cn("p-2 rounded-lg flex-shrink-0", priorityColors[announcement.priority])}>
              {announcement.priority === "high" ? (
                <AlertCircle className="h-4 w-4 text-white" />
              ) : (
                <FileText className="h-4 w-4 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {announcement.title}
                </h3>
                <Badge className={cn("text-xs", priorityColors[announcement.priority])}>
                  {announcement.priority}
                </Badge>
                {isExpired && (
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                    Expired
                  </Badge>
                )}
                {isUrgent && !isExpired && (
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                    Urgent
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {announcement.content}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(announcement.createdAt)}
                </span>
                {announcement.departmentCode && (
                  <span className="flex items-center gap-1">
                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                      {announcement.departmentCode}
                    </span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  By {announcement.authorName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground group-hover:text-foreground"
              onClick={() => onEdit(announcement.announcementId)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground group-hover:text-red-500"
              onClick={() => onDelete(announcement.announcementId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Create / Edit Modal ────────────────────────────────────────────────────────

function AnnouncementModal({
  open,
  onClose,
  onSubmit,
  editingAnnouncement,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; priority: "low" | "medium" | "high"; departmentCode?: string; expiresAt?: string }) => void;
  editingAnnouncement?: Announcement | null;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [departmentCode, setDepartmentCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingAnnouncement) {
      setTitle(editingAnnouncement.title);
      setContent(editingAnnouncement.content);
      setPriority(editingAnnouncement.priority);
      setDepartmentCode(editingAnnouncement.departmentCode || "");
      setExpiresAt(editingAnnouncement.expiresAt || "");
    } else {
      setTitle("");
      setContent("");
      setPriority("medium");
      setDepartmentCode("");
      setExpiresAt("");
    }
    setError("");
  }, [editingAnnouncement, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ title, content, priority, departmentCode: departmentCode || undefined, expiresAt: expiresAt || undefined });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={editingAnnouncement ? "Edit Announcement" : "Create Announcement"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            <X className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title"
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Content *</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Announcement content..."
            className="w-full min-h-[120px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Department</label>
            <select
              value={departmentCode}
              onChange={(e) => setDepartmentCode(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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

        <div>
          <label className="text-sm font-medium text-foreground block mb-1">
            Expiry Date <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full"
            min={new Date().toISOString().slice(0, 16)}
          />
          <p className="text-xs text-muted-foreground mt-1">Leave empty for no expiry</p>
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
                {editingAnnouncement ? "Update" : "Create"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────

function HODAnnouncementsContent() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      let list = (data.announcements || []) as Announcement[];
      // Filter to CSE department announcements, plus platform-wide
      list = list.filter((a) => !a.departmentCode || a.departmentCode === "CSE");
      setAnnouncements(list);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async (data: { title: string; content: string; priority: "low" | "medium" | "high"; departmentCode?: string; expiresAt?: string }) => {
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to create");
    }
    const { announcement } = await res.json();
    setAnnouncements((prev) => [announcement as unknown as Announcement, ...prev]);
  };

  const handleUpdate = async (data: { title: string; content: string; priority: "low" | "medium" | "high"; departmentCode?: string; expiresAt?: string }) => {
    if (!editingAnnouncement) return;
    const res = await fetch("/api/announcements", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, announcementId: editingAnnouncement.announcementId }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to update");
    }
    const { announcement } = await res.json();
    setAnnouncements((prev) =>
      prev.map((a) => (a.announcementId === announcement.announcementId ? (announcement as unknown as Announcement) : a))
    );
  };

  const handleDelete = async (announcementId: string) => {
    setDeleting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete");
      }
      setAnnouncements((prev) => prev.filter((a) => a.announcementId !== announcementId));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const filtered =
    announcements.filter((a) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery.trim() ||
        a.title.toLowerCase().includes(searchLower) ||
        a.content.toLowerCase().includes(searchLower) ||
        a.authorName.toLowerCase().includes(searchLower);

      const matchesPriority = !priorityFilter || a.priority === priorityFilter;

      const isExpired = a.expiresAt && new Date(a.expiresAt) < new Date();
      const matchesStatus = true; // could add active/expired filter

      return matchesSearch && matchesPriority && matchesStatus;
    });

  const sorted = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const highPriorityCount = announcements.filter((a) => a.priority === "high" && !a.expiresAt || (a.expiresAt && new Date(a.expiresAt) > new Date())).length;
  const activeCount = announcements.filter((a) => {
    if (a.expiresAt) return new Date(a.expiresAt) > new Date();
    return true;
  }).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-7 w-7 text-purple-600" />
            Announcements
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage announcements for <span className="font-medium text-foreground">CSE Department</span>
          </p>
        </div>
        <Button onClick={() => { setEditingAnnouncement(null); setShowCreateModal(true); }}>
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{announcements.length}</p>
            <p className="text-xs text-purple-600 mt-1">Total Announcements</p>
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
            <p className="text-2xl font-bold text-amber-700">{highPriorityCount}</p>
            <p className="text-xs text-amber-600 mt-1">Urgent</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {announcements.filter((a) => a.priority === "high").length}
            </p>
            <p className="text-xs text-blue-600 mt-1">High Priority</p>
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
            placeholder="Search announcements..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="skeleton" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No announcements yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || priorityFilter
                ? "Try adjusting your filters"
                : "Create your first announcement to get started"}
            </p>
            <Button onClick={() => { setEditingAnnouncement(null); setShowCreateModal(true); }}>
              <Plus className="h-4 w-4" />
              Create Announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((announcement) => (
            <AnnouncementCard
              key={announcement.announcementId}
              announcement={announcement}
              onEdit={(id) => {
                const a = announcements.find((ann) => ann.announcementId === id);
                if (a) setEditingAnnouncement(a);
                setShowCreateModal(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination info */}
      {!loading && sorted.length > 0 && (
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Showing {sorted.length} announcement{sorted.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Modals */}
      <AnnouncementModal
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingAnnouncement(null); }}
        onSubmit={editingAnnouncement ? handleUpdate : handleCreate}
        editingAnnouncement={editingAnnouncement}
      />

      <ConfirmModal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Announcement?"
        message="This action cannot be undone. The announcement will be permanently deleted."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleting}
      />
    </div>
  );
}

export default function HODAnnouncementsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse text-lg font-medium">Loading announcements...</div>
        </div>
      }
    >
      <HODAnnouncementsContent />
    </Suspense>
  );
}
