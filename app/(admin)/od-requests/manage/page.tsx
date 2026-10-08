"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Filter,
  Check,
  X,
  Clock,
  AlertCircle,
  Calendar,
  Loader2,
  MapPin,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ODRequest {
  odRequestId: string;
  userId: string;
  userName: string;
  userRollNumber?: string;
  eventId: string;
  eventTitle: string;
  departmentCode: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  status: "pending" | "approved" | "rejected" | "auto_revoked";
  referenceNumber: string;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  classAdvisorNotified: boolean;
  pdfUrl?: string;
  attendanceVerified: boolean;
}

// ── OD Row ─────────────────────────────────────────────────────────────────────

function ODRow({
  od,
  onApprove,
  onReject,
  onView,
}: {
  od: ODRequest;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onView: (id: string) => void;
}) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    auto_revoked: "bg-gray-100 text-gray-600",
  };

  const isOverdue =
    od.status === "pending" &&
    new Date(od.endDate) < new Date();

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={cn(
              "p-2 rounded-lg flex-shrink-0",
              statusColors[od.status]
            )}>
              {od.status === "pending" ? (
                <AlertCircle className="h-4 w-4 text-yellow-700" />
              ) : od.status === "approved" ? (
                <Check className="h-4 w-4 text-green-700" />
              ) : (
                <X className="h-4 w-4 text-red-700" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {od.eventTitle}
                </h3>
                <Badge className={cn("text-xs", statusColors[od.status])}>
                  {od.status}
                </Badge>
                {isOverdue && (
                  <Badge className="text-xs bg-red-100 text-red-700 border border-red-200">
                    Overdue
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-muted-foreground">
                <div>
                  <span className="text-muted-foreground">User: </span>
                  <span className="font-medium">{od.userName}</span>
                  <span className="text-muted-foreground"> ({od.userRollNumber})</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Dept: </span>
                  <span className="font-medium">{od.departmentCode}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(od.startDate)} - {formatDate(od.endDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{od.venue}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{od.startTime} - {od.endTime}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ref: </span>
                  <span className="font-mono text-xs">{od.referenceNumber}</span>
                </div>
              </div>

              {od.rejectionReason && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  <span className="text-muted-foreground">Reason: </span>
                  {od.rejectionReason}
                </div>
              )}

              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>Created: {formatDateTime(od.createdAt)}</span>
                {od.approvedAt && (
                  <span>
                    Approved: {formatDateTime(od.approvedAt)}
                  </span>
                )}
                {od.attendanceVerified && (
                  <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
                    Attendance Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {od.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-700 border-green-300 hover:bg-green-50 h-8"
                  onClick={() => onApprove(od.odRequestId)}
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-700 border-red-300 hover:bg-red-50 h-8"
                  onClick={() => onReject(od.odRequestId, "")}
                >
                  <X className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground group-hover:text-foreground"
              onClick={() => onView(od.odRequestId)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Reject Reason Modal ────────────────────────────────────────────────────────

function RejectModal({
  open,
  onClose,
  onConfirm,
  odId,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  odId: string;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    onConfirm(reason);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Reject OD Request" size="md">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter the reason for rejecting this OD request. This will be visible to the student.
        </p>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1">
            Rejection Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Insufficient documentation, dates overlap with exam schedule..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none h-24"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading || !reason.trim()}
            isLoading={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Reject Request"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────

function AdminODRequestsContent() {
  const [odRequests, setODRequests] = useState<ODRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rejectConfirm, setRejectConfirm] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  const fetchODRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/od?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const list = (data.odRequests || []) as ODRequest[];
      setODRequests(list);
      setApprovedCount(list.filter((o) => o.status === "approved").length);
      setPendingCount(list.filter((o) => o.status === "pending").length);
      setRejectedCount(list.filter((o) => o.status === "rejected").length);
    } catch (err) {
      console.error("Failed to fetch OD requests:", err);
      setODRequests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchODRequests();
  }, [fetchODRequests]);

  const handleApprove = async (odId: string) => {
    try {
      // Approve via the PUT on the OD API — but the existing API doesn't have a PUT.
      // We'll use a direct update via the DynamoDB client through a new endpoint.
      // For now, we fetch and update locally by calling the update endpoint.
      const res = await fetch("/api/od", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          odRequestId: odId,
          status: "approved",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to approve");
      }

      setODRequests((prev) =>
        prev.map((o) =>
          o.odRequestId === odId
            ? { ...o, status: "approved" as const, approvedBy: "Admin", approvedAt: new Date().toISOString() }
            : o
        )
      );
      setApprovedCount((c) => c + 1);
    } catch (err: any) {
      alert(err.message || "Failed to approve");
    }
  };

  const handleReject = async (odId: string, reason: string) => {
    setRejecting(true);
    try {
      const res = await fetch("/api/od", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          odRequestId: odId,
          status: "rejected",
          rejectionReason: reason,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to reject");
      }

      setODRequests((prev) =>
        prev.map((o) =>
          o.odRequestId === odId
            ? {
                ...o,
                status: "rejected" as const,
                rejectionReason: reason,
                approvedBy: "Admin",
                approvedAt: new Date().toISOString(),
              }
            : o
        )
      );
      setRejectedCount((c) => c + 1);
      setPendingCount((c) => c - 1);
      setRejectConfirm(null);
    } catch (err: any) {
      alert(err.message || "Failed to reject");
    } finally {
      setRejecting(false);
    }
  };

  const filtered =
    odRequests.filter((od) => {
      const matchesSearch =
        !searchQuery.trim() ||
        od.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        od.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        od.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !statusFilter || od.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

  const sorted = filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-7 w-7 text-purple-600" />
            OD Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            System-wide Outstation Duty request management
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="bg-yellow-50/50 border-yellow-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
            <p className="text-xs text-yellow-600 mt-1">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
            <p className="text-xs text-green-600 mt-1">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 border-red-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
            <p className="text-xs text-red-600 mt-1">Rejected</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{odRequests.length}</p>
            <p className="text-xs text-purple-600 mt-1">Total Requests</p>
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
            placeholder="Search by user, event, or reference..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="auto_revoked">Auto Revoked</option>
          </select>
        </div>
      </div>

      {/* OD Requests List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="skeleton" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No OD requests</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter || searchQuery
                ? "Try adjusting your filters"
                : "No OD requests have been submitted yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((od) => (
            <ODRow
              key={od.odRequestId}
              od={od}
              onApprove={handleApprove}
              onReject={(id, reason) => {
                setRejectConfirm(id);
              }}
              onView={(id) => {}}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && sorted.length > 0 && (
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Showing {sorted.length} request{sorted.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Reject Modal */}
      <RejectModal
        open={rejectConfirm !== null}
        onClose={() => { setRejectConfirm(null); }}
        onConfirm={(reason) => {
          if (rejectConfirm) {
            handleReject(rejectConfirm, reason);
          }
        }}
        odId={rejectConfirm || ""}
        isLoading={rejecting}
      />
    </div>
  );
}

export default function AdminODRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse text-lg font-medium">Loading OD requests...</div>
        </div>
      }
    >
      <AdminODRequestsContent />
    </Suspense>
  );
}
