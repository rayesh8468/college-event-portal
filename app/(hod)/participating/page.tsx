"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  Check,
  X,
  Calendar,
  User,
  Mail,
  Phone,
  Trophy,
  Star,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import {
  cn,
  formatDate,
  formatDateTime,
  formatCurrency,
  getEventStatusLabel,
  getEventStatusColor,
  getCategoryColor,
  getRelativeTime,
} from "@/lib/utils";
import { EventCategory, EventType } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface Participant {
  userId: string;
  userName: string;
  email: string;
  rollNumber: string;
  departmentCode: string;
  year: string;
  role: "Students" | "DeptHeads" | "SuperAdmins";
  reliabilityScore?: number;
  createdAt?: string;
}

interface ParticipantRowData {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventCategory: EventCategory;
  eventType: EventType;
  eventStartDate: string;
  eventVenue: string;
  eventStatus: string;
  userId: string;
  userName: string;
  email: string;
  rollNumber: string;
  departmentCode: string;
  year: string;
  status: string;
  registeredAt: string;
  attendedAt?: string;
  teamId?: string;
  teamCode?: string;
  teamRole?: string;
  paymentId?: string;
  paymentStatus?: string;
  amountPaid?: number;
  odRequestId?: string;
  notes?: string;
}

interface EventOption {
  value: string;
  label: string;
  eventId: string;
}

// ── Participants Page Content ───────────────────────────────────────────────

function ParticipantsContent() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [participants, setParticipants] = useState<ParticipantRowData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [eventLoading, setEventLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<ParticipantRowData | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events?limit=200");
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      const eventList: EventOption[] = (data.events || [])
        .filter((e: any) => e.departmentCode === "CSE")
        .map((e: any) => ({
          value: e.eventId,
          label: `${e.title} (${formatDate(e.startDate)})`,
          eventId: e.eventId,
        }));
      setEvents(eventList);
    } catch (error) {
      console.error("Failed to fetch events:", error);
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
      const res = await fetch(`/api/register?eventId=${selectedEventId}`);
      if (!res.ok) throw new Error("Failed to fetch participants");
      const data = await res.json();
      let list: ParticipantRowData[] = (data.registrations || []).map(
        (r: any) => ({
          ...r,
          status: r.status || "pending",
        })
      );

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(
          (p) =>
            p.userName.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            p.rollNumber.toLowerCase().includes(q)
        );
      }

      // Status filter
      if (statusFilter) {
        list = list.filter((p) => p.status === statusFilter);
      }

      // Department filter
      if (departmentFilter) {
        list = list.filter((p) => p.departmentCode === departmentFilter);
      }

      setParticipants(list);
    } catch (error) {
      console.error("Failed to fetch participants:", error);
      setParticipants([]);
    } finally {
      setEventLoading(false);
    }
  }, [selectedEventId, searchQuery, statusFilter, departmentFilter]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const getEventTitle = (eventId: string) => {
    const ev = events.find((e) => e.eventId === eventId);
    return ev?.label || eventId;
  };

  const selectedEventTitle = selectedEventId
    ? events.find((e) => e.eventId === selectedEventId)?.label || selectedEventId
    : "";

  const totalParticipants = participants.length;
  const attendedCount = participants.filter((p) => p.status === "attended").length;
  const pendingCount = participants.filter((p) => p.status === "pending").length;
  const confirmedCount = participants.filter((p) => p.status === "confirmed").length;
  const cancelledCount = participants.filter((p) => p.status === "cancelled").length;
  const waitlistedCount = participants.filter((p) => p.status === "waitlisted").length;

  const departments = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AI&DS"];

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
            View and manage registered participants across events
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="w-full sm:w-auto">
          <Select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setSearchQuery("");
              setStatusFilter("");
              setDepartmentFilter("");
            }}
            className="w-full sm:w-72"
          >
            <option value="">Select an event</option>
            {events.map((ev) => (
              <option key={ev.value} value={ev.value}>
                {ev.label}
              </option>
            ))}
          </Select>
        </div>

        {selectedEventId && (
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name / roll / email"
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-36"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="attended">Attended</option>
              <option value="cancelled">Cancelled</option>
              <option value="waitlisted">Waitlisted</option>
            </Select>

            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-36"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Stats */}
      {selectedEventId && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="bg-purple-50/50 border-purple-100">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">{totalParticipants}</p>
              <p className="text-xs text-purple-600 mt-1">Total Participants</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{pendingCount}</p>
              <p className="text-xs text-blue-600 mt-1">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50/50 border-green-100">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{confirmedCount}</p>
              <p className="text-xs text-green-600 mt-1">Confirmed</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50/50 border-amber-100">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{attendedCount}</p>
              <p className="text-xs text-amber-600 mt-1">Attended</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Event selector info */}
      {!selectedEventId && (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Select an Event</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose an event from the dropdown above to view its participants
            </p>
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No events found. Create an event first.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Participants List */}
      {selectedEventId && eventLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg skeleton" />
          ))}
        </div>
      ) : participants.length === 0 && selectedEventId ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No participants yet</h3>
            <p className="text-sm text-muted-foreground">
              Participants will appear here once they register for this event
            </p>
          </CardContent>
        </Card>
      ) : participants.length > 0 ? (
        <div className="space-y-2">
          {participants.map((p) => (
            <Card key={p.registrationId} className="hover:shadow-sm transition-shadow group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-sm font-semibold flex-shrink-0">
                      {p.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">
                          {p.userName}
                        </p>
                        <Badge variant="outline" className="text-xs border-border">
                          {p.rollNumber}
                        </Badge>
                        <Badge
                          className={cn(
                            "text-xs",
                            getEventStatusColor(p.status || "pending").split(" ")[0]
                          )}
                        >
                          {getEventStatusLabel(p.status || "pending")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {p.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {p.departmentCode} &middot; {p.year}
                        </span>
                        {p.teamCode && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Team: {p.teamCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-700 border-green-300 bg-green-50 h-8"
                        onClick={() => {}}
                      >
                        Confirm
                      </Button>
                    )}
                    {p.status === "confirmed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-700 border-amber-300 bg-amber-50 h-8"
                        onClick={() => {}}
                      >
                        Mark Attended
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground group-hover:text-foreground"
                      onClick={() => setShowDetails(p)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Details Modal */}
      <Modal
        open={showDetails !== null}
        onClose={() => setShowDetails(null)}
        title="Participant Details"
      >
        {showDetails && (
          <div className="space-y-4">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-semibold">
                    {showDetails.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">{showDetails.userName}</p>
                    <p className="text-sm text-muted-foreground">{showDetails.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Roll Number</p>
                    <p className="font-medium text-foreground">{showDetails.rollNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Department</p>
                    <p className="font-medium text-foreground">{showDetails.departmentCode}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Year</p>
                    <p className="font-medium text-foreground">{showDetails.year}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">User ID</p>
                    <p className="font-medium text-foreground font-mono text-xs">{showDetails.userId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registration Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Event</p>
                    <p className="font-medium text-foreground">{showDetails.eventTitle}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <Badge
                      className={cn(
                        "text-xs",
                        getEventStatusColor(showDetails.status || "pending").split(" ")[0]
                      )}
                    >
                      {getEventStatusLabel(showDetails.status || "pending")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Registered At</p>
                    <p className="font-medium text-foreground">{formatDateTime(showDetails.registeredAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Attended At</p>
                    <p className="font-medium text-foreground">
                      {showDetails.attendedAt ? formatDateTime(showDetails.attendedAt) : "Not attended"}
                    </p>
                  </div>
                </div>
                {showDetails.teamCode && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs border-border">
                      Team: {showDetails.teamCode}
                    </Badge>
                    <span className="text-muted-foreground capitalize">
                      Role: {showDetails.teamRole}
                    </span>
                  </div>
                )}
                {showDetails.paymentStatus && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        showDetails.paymentStatus === "paid"
                          ? "border-green-300 text-green-700"
                          : "border-red-300 text-red-700"
                      )}
                    >
                      {showDetails.paymentStatus === "paid" ? "Paid" : showDetails.paymentStatus}
                    </Badge>
                    {showDetails.amountPaid && (
                      <span>
                        {formatCurrency(showDetails.amountPaid)}
                      </span>
                    )}
                  </div>
                )}
                {showDetails.notes && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Notes</p>
                    <p className="text-sm text-foreground">{showDetails.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Modal>
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
      <ParticipantsContent />
    </Suspense>
  );
}
