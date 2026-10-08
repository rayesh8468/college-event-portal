"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { Users, Search, Filter, Check, X, Mail, Phone, Building2, User, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn, formatDate, formatDateTime, getRelativeTime } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Participant {
  userId: string;
  userName: string;
  email: string;
  rollNumber: string;
  departmentCode: string;
  year: string;
  role: string;
  reliabilityScore?: number;
  createdAt?: string;
  points?: number;
}

interface ParticipantRow {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  startDate: string;
  venue: string;
  status: string;
  maxParticipants: number;
  registrationFee: number;
  userId: string;
  userName: string;
  email: string;
  rollNumber: string;
  departmentCode: string;
  year: string;
  points: number;
  registeredAt: string;
  paymentStatus?: string;
  amountPaid?: number;
  teamCode?: string;
}

// ── Participant Row ───────────────────────────────────────────────────────────

function ParticipantRow({
  participant,
  onView,
}: {
  participant: ParticipantRow;
  onView: (p: ParticipantRow) => void;
}) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    attended: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
    waitlisted: "bg-orange-100 text-orange-700",
    rejected: "bg-red-100 text-red-700",
  };
  const statusLabels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    attended: "Attended",
    cancelled: "Cancelled",
    waitlisted: "Waitlisted",
    rejected: "Rejected",
  };

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
              {participant.userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {participant.userName}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <User className="h-3 w-3" />
                {participant.rollNumber} &middot; {participant.departmentCode}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Mail className="h-3 w-3" />
                {participant.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Badge className={cn("text-xs", statusColors[participant.status] || "bg-gray-100 text-gray-600")}>
              {statusLabels[participant.status] || participant.status}
            </Badge>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{participant.eventTitle}</p>
              <p className="text-xs text-muted-foreground">{formatDate(participant.startDate)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground group-hover:text-foreground"
              onClick={() => onView(participant)}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── View Participant Modal ────────────────────────────────────────────────────

function ViewParticipantModal({
  participant,
  open,
  onClose,
}: {
  participant: ParticipantRow | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!participant || !open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Participant Details" size="lg">
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-semibold">
                {participant.userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">{participant.userName}</p>
                <p className="text-sm text-muted-foreground">{participant.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{participant.rollNumber}</Badge>
                  <Badge variant="outline" className="text-xs">{participant.departmentCode}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Event</p>
              <p className="text-sm font-medium text-foreground mt-1 line-clamp-1">{participant.eventTitle}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge className="mt-1 text-xs bg-green-100 text-green-700">
                {participant.status}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Registered</p>
              <p className="text-sm font-medium text-foreground mt-1">{formatDateTime(participant.registeredAt)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Venue</p>
              <p className="text-sm font-medium text-foreground mt-1">{participant.venue}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────

function HODParticipantsContent() {
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [events, setEvents] = useState<{ eventId: string; title: string; status: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [eventLoading, setEventLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantRow | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events?limit=50");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const eventList = (data.events || [])
        .filter((e: any) => e.departmentCode === "CSE")
        .map((e: any) => ({
          eventId: e.eventId,
          title: e.title,
          status: e.status,
        }));
      setEvents(eventList);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const fetchParticipants = useCallback(async () => {
    if (!selectedEventId) {
      setParticipants([]);
      return;
    }
    setEventLoading(true);
    try {
      const res = await fetch(`/api/events/${selectedEventId}/registrations`);
      if (!res.ok) throw new Error("Failed to fetch participants");
      const data = await res.json();
      setParticipants(data.registrations || []);
    } catch (err) {
      console.error("Failed to fetch participants:", err);
      setParticipants([]);
    } finally {
      setEventLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleConfirm = async (registrationId: string) => {
    try {
      const res = await fetch("/api/register", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, status: "confirmed" }),
      });
      if (!res.ok) throw new Error("Failed to confirm");
      setParticipants((prev) =>
        prev.map((p) => (p.registrationId === registrationId ? { ...p, status: "confirmed" } : p))
      );
    } catch (err) {
      alert("Failed to confirm participant");
    }
  };

  const handleCancel = async (registrationId: string) => {
    try {
      const res = await fetch("/api/register", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, status: "cancelled" }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      setParticipants((prev) =>
        prev.map((p) => (p.registrationId === registrationId ? { ...p, status: "cancelled" } : p))
      );
    } catch (err) {
      alert("Failed to cancel participant");
    }
  };

  const filtered =
    participants.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.userName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.rollNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });

  const selectedEvent = events.find((e) => e.eventId === selectedEventId);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-purple-600" />
            Participants
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedEvent ? `Participants for “${selectedEvent.title}”` : "Select an event to view participants"}
          </p>
        </div>
      </div>

      {/* Event Selector */}
      {events.length > 0 && (
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground block mb-2">Select Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setSearchQuery("");
              setStatusFilter("");
            }}
            className="w-full sm:w-80 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">— Choose an event —</option>
            {events.map((e) => (
              <option key={e.eventId} value={e.eventId}>
                {e.title} ({e.status})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stats */}
      {selectedEventId && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="bg-purple-50/50 border-purple-100">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">{participants.length}</p>
              <p className="text-xs text-purple-600 mt-1">Total Registrations</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50/50 border-yellow-100">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">
                {participants.filter((p) => p.status === "pending").length}
              </p>
              <p className="text-xs text-yellow-600 mt-1">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50/50 border-green-100">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-700">
                {participants.filter((p) => p.status === "confirmed").length}
              </p>
              <p className="text-xs text-green-600 mt-1">Confirmed</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {participants.filter((p) => p.status === "attended").length}
              </p>
              <p className="text-xs text-blue-600 mt-1">Attended</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {selectedEventId && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or roll number..."
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
              <option value="confirmed">Confirmed</option>
              <option value="attended">Attended</option>
              <option value="cancelled">Cancelled</option>
              <option value="waitlisted">Waitlisted</option>
            </select>
          </div>
        </div>
      )}

      {/* Participant List */}
      {!selectedEventId ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Select an event</h3>
            <p className="text-sm text-muted-foreground">
              Choose an event from the dropdown above to view its participants
            </p>
          </CardContent>
        </Card>
      ) : eventLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No participants found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter
                ? "Try adjusting your search or filters"
                : "No one has registered yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((participant) => (
            <ParticipantRow
              key={participant.registrationId}
              participant={participant}
              onView={setSelectedParticipant}
            />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {selectedEventId && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="border-dashed border-2 border-purple-200 hover:border-purple-400 transition-colors group">
              <CardContent className="p-5 text-center group-hover:bg-purple-50/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <Check className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-foreground">Confirm All Pending</p>
                <p className="text-xs text-muted-foreground mt-1">Confirm all pending registrations</p>
              </CardContent>
            </Card>
            <Card className="border-dashed border-2 border-purple-200 hover:border-purple-400 transition-colors group">
              <CardContent className="p-5 text-center group-hover:bg-purple-50/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-foreground">Export List</p>
                <p className="text-xs text-muted-foreground mt-1">Download participant list as CSV</p>
              </CardContent>
            </Card>
            <Card className="border-dashed border-2 border-purple-200 hover:border-purple-400 transition-colors group">
              <CardContent className="p-5 text-center group-hover:bg-purple-50/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-foreground">View All Participants</p>
                <p className="text-xs text-muted-foreground mt-1">See complete participant details</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* View Modal */}
      <ViewParticipantModal
        participant={selectedParticipant}
        open={!!selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
      />
    </div>
  );
}

export default function HODParticipantsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse text-lg font-medium">Loading participants...</div>
        </div>
      }
    >
      <HODParticipantsContent />
    </Suspense>
  );
}
