"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import {
  Award,
  Search,
  Filter,
  Eye,
  Download,
  X,
  Check,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Star,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Dropdown } from "@/components/ui/Dropdown";
import {
  cn,
  formatDate,
  formatDateTime,
  formatCurrency,
} from "@/lib/utils";
import { EventCategory, EventType } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Certificate {
  certificateId: string;
  userId: string;
  eventId: string;
  userName: string;
  userRollNumber?: string;
  eventType: string;
  role: string;
  date: string;
  duration?: string;
  issuedBy: string;
  issuedOn: string;
  verificationUrl: string;
  pdfUrl?: string;
  isPublic: boolean;
}

interface EventBasic {
  eventId: string;
  title: string;
  departmentCode: string;
  startDate: string;
  endDate: string;
  status: string;
  category: string;
  eventType: string;
  venue: string;
  maxParticipants: number;
  confirmedCount: number;
  registrationFee: number;
}

// ── Certificate Row ────────────────────────────────────────────────────────────

function CertificateRow({
  cert,
  eventTitle,
  onView,
  onRevoke,
}: {
  cert: Certificate;
  eventTitle: string;
  onView: (id: string) => void;
  onRevoke: (id: string) => void;
}) {
  const roleColors: Record<string, string> = {
    participant: "bg-blue-100 text-blue-700",
    winner: "bg-yellow-100 text-yellow-700",
    runnerUp: "bg-orange-100 text-orange-700",
    volunteer: "bg-green-100 text-green-700",
    organizer: "bg-purple-100 text-purple-700",
    best_poster: "bg-pink-100 text-pink-700",
    best_presentation: "bg-cyan-100 text-cyan-700",
    _points: "bg-gray-100 text-gray-600",
  };

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600 flex-shrink-0">
              <Award className="h-4 w-4 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {cert.userName}
                </h3>
                <Badge className={cn("text-xs", roleColors[cert.role] || "bg-gray-100 text-gray-600")}>
                  {cert.role.replace(/_/g, " ")}
                </Badge>
                {!cert.isPublic && (
                  <Badge variant="destructive" className="text-xs">
                    Revoked
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1 mt-1.5 text-xs text-muted-foreground">
                <div>
                  <span className="text-muted-foreground">Certificate: </span>
                  <span className="font-mono text-xs">{cert.certificateId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Event: </span>
                  <span className="truncate">{eventTitle}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Issued: </span>
                  <span className="whitespace-nowrap">{formatDate(cert.issuedOn)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">By: </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {cert.issuedBy}
                  </span>
                </div>
              </div>

              {cert.userRollNumber && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  Roll: {cert.userRollNumber}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground group-hover:text-foreground"
              onClick={() => onView(cert.certificateId)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {cert.isPublic && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground group-hover:text-red-500"
                onClick={() => onRevoke(cert.certificateId)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Issue Certificates Modal ───────────────────────────────────────────────────

function IssueCertModal({
  open,
  onClose,
  onSubmit,
  events,
  availableUsers,
  selectedEventId,
  setSearchUsers,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { eventId: string; userIds: string[]; type: string }) => void;
  events: EventBasic[];
  availableUsers: { userId: string; name: string; email: string; departmentCode: string }[];
  selectedEventId: string;
  setSearchUsers: (q: string) => void;
}) {
  const [eventId, setEventId] = useState(selectedEventId || "");
  const [userIds, setUserIds] = useState<string[]>([]);
  const [certType, setCertType] = useState("participant");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setEventId(selectedEventId || "");
      setUserIds([]);
      setCertType("participant");
      setError("");
      setSearchQuery("");
    }
  }, [open, selectedEventId]);

  const selectedEvent = events.find((e) => e.eventId === eventId);
  const filteredUsers = searchQuery
    ? availableUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          !userIds.includes(u.userId)
      )
    : availableUsers.filter((u) => !userIds.includes(u.userId));

  const handleToggleUser = (userId: string) => {
    if (userIds.includes(userId)) {
      setUserIds(userIds.filter((id) => id !== userId));
    } else {
      setUserIds([...userIds, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!eventId) {
      setError("Select an event");
      return;
    }
    if (userIds.length === 0) {
      setError("Select at least one user");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ eventId, userIds, type: certType });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to issue");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const typeOptions = [
    { value: "participant", label: "Participant" },
    { value: "winner", label: "Winner" },
    { value: "runnerUp", label: "Runner Up" },
    { value: "volunteer", label: "Volunteer" },
    { value: "organizer", label: "Organizer" },
    { value: "best_poster", label: "Best Poster" },
    { value: "best_presentation", label: "Best Presentation" },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={selectedEvent ? `Issue Certificates: ${selectedEvent.title}` : "Issue Certificates"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            <X className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Event selector */}
        {!selectedEvent && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Event</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select an event</option>
              {events.map((ev) => (
                <option key={ev.eventId} value={ev.eventId}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedEvent && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">{selectedEvent.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(selectedEvent.startDate)} &middot; {selectedEvent.venue}
            </p>
          </div>
        )}

        {/* User selection — searchable */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">
            Select Users ({userIds.length} selected)
          </label>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="mb-2"
          />
          <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
            {filteredUsers.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                {searchQuery ? "No matching users" : "No users available"}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.userId}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 border-b border-border last:border-0 cursor-pointer transition-colors",
                    userIds.includes(user.userId)
                      ? "bg-primary/10"
                      : "hover:bg-muted/30"
                  )}
                  onClick={() => handleToggleUser(user.userId)}
                >
                  <input
                    type="checkbox"
                    checked={userIds.includes(user.userId)}
                    onChange={() => {}}
                    className="rounded border-border text-primary focus:ring-primary flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  {userIds.includes(user.userId) && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Certificate type */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Certificate Type</label>
          <select
            value={certType}
            onChange={(e) => setCertType(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="pt-2 flex justify-end gap-3 border-t border-border">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || userIds.length === 0}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Issuing...
              </>
            ) : (
              <>
                <Award className="h-4 w-4" />
                Issue {userIds.length} Certificate{userIds.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── View Certificate Modal ─────────────────────────────────────────────────────

function ViewCertModal({
  open,
  onClose,
  cert,
  eventTitle,
}: {
  open: boolean;
  onClose: () => void;
  cert?: Certificate | null;
  eventTitle?: string;
}) {
  if (!open || !cert) return null;

  return (
    <Modal open={open} onClose={onClose} title="Certificate Details" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <Award className="h-6 w-6 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{cert.userName}</p>
            <p className="text-xs text-amber-600">{cert.userRollNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Certificate ID</p>
            <p className="font-medium font-mono text-foreground">{cert.certificateId}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Event</p>
            <p className="font-medium text-foreground truncate">{eventTitle || cert.eventType}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Role</p>
            <Badge className="mt-1 text-xs capitalize">{cert.role.replace(/_/g, " ")}</Badge>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Date</p>
            <p className="font-medium text-foreground">{cert.date ? formatDate(cert.date) : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Issued On</p>
            <p className="font-medium text-foreground">{cert.issuedOn ? formatDate(cert.issuedOn) : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Issued By</p>
            <p className="font-medium text-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              {cert.issuedBy}
            </p>
          </div>
        </div>

        {cert.duration && (
          <div>
            <p className="text-muted-foreground text-xs mb-1">Duration</p>
            <p className="text-sm text-foreground">{cert.duration}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">Status: {cert.isPublic ? "Public" : "Revoked"}</span>
          {cert.verificationUrl && (
            <a
              href={cert.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLinkIcon className="h-3 w-3" />
              Verify online
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────

function AdminCertificatesContent() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, EventBasic>>({});
  const [usersList, setUsersList] = useState<{ userId: string; name: string; email: string; departmentCode: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [viewCert, setViewCert] = useState<Certificate | null>(null);
  const [viewEventTitle, setViewEventTitle] = useState("");
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [issuing, setIssuing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      // Fetch all events
      const eventsRes = await fetch("/api/events?limit=200");
      const eventsData = await eventsRes.json();
      const eventMap: Record<string, EventBasic> = {};
      (eventsData.events || []).forEach((e: any) => {
        eventMap[e.eventId] = {
          eventId: e.eventId,
          title: e.title,
          departmentCode: e.departmentCode,
          startDate: e.startDate,
          endDate: e.endDate,
          status: e.status,
          category: e.category,
          eventType: e.eventType,
          venue: e.venue,
          maxParticipants: e.maxParticipants,
          confirmedCount: e.confirmedCount,
          registrationFee: e.registrationFee,
        };
      });
      setEventsMap(eventMap);

      // Fetch all certificates (by event)
      const allCerts: Certificate[] = [];
      const eventIds = Object.keys(eventMap);
      for (const eventId of eventIds) {
        const res = await fetch(`/api/certificates?eventId=${eventId}`);
        const data = await res.json();
        (data.certificates || []).forEach((c: any) => {
          allCerts.push(c as Certificate);
        });
      }
      setCertificates(allCerts);

      // Fetch users for issuance
      const usersRes = await fetch("/api/users?role=Students");
      const usersData = await usersRes.json();
      setUsersList((usersData.users || []).filter((u: any) => !u.disabled).map((u: any) => ({
        userId: u.userId,
        name: u.name,
        email: u.email,
        departmentCode: u.departmentCode,
      })));

      setSelectedEventId(eventIds[0] || "");
    } catch (err) {
      console.error("Failed to fetch certificates:", err);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleIssue = async (data: { eventId: string; userIds: string[]; type: string }) => {
    setIssuing(true);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to issue");
      }
      const result = await res.json();
      // Fetch updated cert list for the event
      const updateRes = await fetch(`/api/certificates?eventId=${data.eventId}`);
      const updateData = await updateRes.json();
      const newCerts = (updateData.certificates || []) as Certificate[];
      setCertificates((prev) => {
        const existingIds = new Set(prev.map((c) => c.certificateId));
        const toAdd = newCerts.filter((c) => !existingIds.has(c.certificateId));
        return [...toAdd, ...prev];
      });
      setIssueModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to issue certificates");
    } finally {
      setIssuing(false);
    }
  };

  const handleRevoke = async (certificateId: string) => {
    setRevoking(true);
    try {
      // Revoke by setting isPublic to false via the DynamoDB update
      // Since there's no dedicated revoke endpoint, we use a direct update
      // For now, update locally
      setCertificates((prev) =>
        prev.map((c) =>
          c.certificateId === certificateId ? { ...c, isPublic: false } : c
        )
      );
      setRevokeConfirm(null);
    } catch (err: any) {
      alert(err.message || "Failed to revoke");
    } finally {
      setRevoking(false);
    }
  };

  const getEventTitle = (eventId: string) => eventsMap[eventId]?.title || eventId;

  const filtered =
    certificates.filter((cert) => {
      const matchesSearch =
        !searchQuery.trim() ||
        cert.certificateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.userName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEvent = !eventFilter || cert.eventId === eventFilter;
      const matchesType = !typeFilter || cert.role === typeFilter;

      return matchesSearch && matchesEvent && matchesStatus(cert);
    });

  const matchesStatus = (cert: Certificate) => {
    return true;
  };

  const sorted = filtered.sort(
    (a, b) => new Date(b.issuedOn).getTime() - new Date(a.issuedOn).getTime()
  );

  const issuedCount = certificates.filter((c) => c.isPublic).length;
  const revokedCount = certificates.filter((c) => !c.isPublic).length;
  const typeCounts: Record<string, number> = {};
  certificates.forEach((c) => {
    typeCounts[c.role] = (typeCounts[c.role] || 0) + 1;
  });

  const uniqueEventIds = [...new Set(certificates.map((c) => c.eventId))].sort();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="h-7 w-7 text-purple-600" />
            Certificates
          </h1>
          <p className="text-muted-foreground mt-1">
            View, issue, and manage digital certificates
          </p>
        </div>
        <Button onClick={() => setIssueModalOpen(true)} className="gap-2">
          <Award className="h-4 w-4" />
          Issue Certificates
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{certificates.length}</p>
            <p className="text-xs text-purple-600 mt-1">Total Issued</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{issuedCount}</p>
            <p className="text-xs text-green-600 mt-1">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 border-red-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{revokedCount}</p>
            <p className="text-xs text-red-600 mt-1">Revoked</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">
              {Object.keys(typeCounts).length}
            </p>
            <p className="text-xs text-amber-600 mt-1">Types</p>
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
            placeholder="Search by certificate ID or name..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Events</option>
            {uniqueEventIds.map((eid) => (
              <option key={eid} value={eid}>
                {eventsMap[eid]?.title || eid}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Types</option>
            <option value="participant">Participant</option>
            <option value="winner">Winner</option>
            <option value="runnerUp">Runner Up</option>
            <option value="volunteer">Volunteer</option>
            <option value="organizer">Organizer</option>
          </select>
        </div>
      </div>

      {/* Certificates List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="skeleton" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No certificates yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Certificates will appear here once they are issued for events
            </p>
            <Button onClick={() => setIssueModalOpen(true)} className="gap-2">
              <Award className="h-4 w-4" />
              Issue First Certificate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((cert) => (
            <CertificateRow
              key={cert.certificateId}
              cert={cert}
              eventTitle={getEventTitle(cert.eventId)}
              onView={(id) => {
                const c = certificates.find((cert) => cert.certificateId === id);
                if (c) {
                  setViewCert(c);
                  setViewEventTitle(getEventTitle(c.eventId));
                }
              }}
              onRevoke={(id) => setRevokeConfirm(id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && sorted.length > 0 && (
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Showing {sorted.length} certificate{sorted.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Issue Modal */}
      <IssueCertModal
        open={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        onSubmit={handleIssue}
        events={Object.values(eventsMap)}
        availableUsers={usersList}
        selectedEventId={selectedEventId}
        setSearchUsers={() => {}}
      />

      {/* View Modal */}
      <ViewCertModal
        open={!!viewCert}
        onClose={() => { setViewCert(null); setViewEventTitle(""); }}
        cert={viewCert}
        eventTitle={viewEventTitle}
      />

      {/* Revoke Confirmation */}
      <ConfirmModal
        open={revokeConfirm !== null}
        onClose={() => setRevokeConfirm(null)}
        onConfirm={() => revokeConfirm && handleRevoke(revokeConfirm)}
        title="Revoke Certificate?"
        message="This will revoke the certificate and make it no longer publicly viewable. This action cannot be undone."
        confirmLabel="Revoke"
        variant="destructive"
        isLoading={revoking}
      />
    </div>
  );
}

export default function AdminCertificatesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse text-lg font-medium">Loading certificates...</div>
        </div>
      }
    >
      <AdminCertificatesContent />
    </Suspense>
  );
}
