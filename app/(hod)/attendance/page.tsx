"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  Search,
  Filter,
  Check,
  X,
  Calendar,
  Clock,
  Camera,
  QrCode,
  Loader2,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  cn,
  formatDate,
  formatDateTime,
  getEventStatusLabel,
  getEventStatusColor,
  getCategoryColor,
} from "@/lib/utils";
import { EventCategory, EventType } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface HODEvent {
  eventId: string;
  title: string;
  description: string;
  departmentCode: string;
  category: EventCategory;
  eventType: EventType;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  maxParticipants: number;
  registrationFee: number;
  status: string;
  pointsAwarded: {
    participant?: number;
    volunteer?: number;
    winner?: number;
    runnerUp?: number;
    organizer?: number;
  };
  requiresOD: boolean;
  isWorkingDay: boolean;
  participantCount: number;
  confirmedCount: number;
  cancelledCount: number;
  organizerUserId: string;
  createdAt: string;
}

interface Participant {
  registrationId: string;
  eventId: string;
  userId: string;
  status: string;
  registeredAt: string;
  teamId?: string;
  teamCode?: string;
  teamRole?: string;
  user?: {
    userId: string;
    userName: string;
    email: string;
    rollNumber: string;
    departmentCode: string;
    year: string;
    role: string;
    reliabilityScore?: number;
  };
  isAttended?: boolean;
  attendedAt?: string;
}

// ── Participant Row ───────────────────────────────────────────────────────────

function ParticipantRow({
  participant,
  onToggleAttended,
  selected,
  onSelect,
}: {
  participant: Participant;
  onToggleAttended: (registrationId: string) => void;
  selected: boolean;
  onSelect: (participant: Participant) => void;
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
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      )}
      onClick={() => onSelect(participant)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(participant)}
          className="rounded border-border text-purple-600 focus:ring-purple-500 flex-shrink-0"
        />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold flex-shrink-0">
          {participant.user?.userName?.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {participant.user?.userName || "Unknown User"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {participant.user?.rollNumber || "—"} &middot; {participant.user?.departmentCode || "—"}
          </p>
          {participant.teamCode && (
            <p className="text-xs text-muted-foreground">
              Team: {participant.teamCode} &middot; {participant.teamRole}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Badge className={cn("text-xs", statusColors[participant.status] || "bg-gray-100 text-gray-600")}>
          {statusLabels[participant.status] || participant.status}
        </Badge>
        {participant.isAttended ? (
          <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
            <Check className="h-3 w-3 mr-1" />
            Attended
          </Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="text-green-700 border-green-300 hover:bg-green-50 h-7"
            onClick={(e) => {
              e.stopPropagation();
              onToggleAttended(participant.registrationId);
            }}
            disabled={participant.status === "cancelled" || participant.status === "rejected"}
          >
            <Check className="h-3.5 w-3.5" />
            Mark Attended
          </Button>
        )}
      </div>
    </div>
  );
}

// ── QR Code Display Modal ─────────────────────────────────────────────────────

function QRCodeModal({
  eventId,
  eventTitle,
  open,
  onClose,
}: {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="QR Code for Attendance" size="md">
      <div className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-xl shadow-inner">
          <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
            <rect x="0" y="0" width="200" height="200" fill="white" />
            <rect x="10" y="10" width="50" height="50" fill="black" rx="4" />
            <rect x="16" y="16" width="38" height="38" fill="white" rx="2" />
            <rect x="22" y="22" width="26" height="26" fill="black" rx="2" />
            <rect x="140" y="10" width="50" height="50" fill="black" rx="4" />
            <rect x="146" y="16" width="38" height="38" fill="white" rx="2" />
            <rect x="152" y="22" width="26" height="26" fill="black" rx="2" />
            <rect x="10" y="140" width="50" height="50" fill="black" rx="4" />
            <rect x="16" y="146" width="38" height="38" fill="white" rx="2" />
            <rect x="22" y="152" width="26" height="26" fill="black" rx="2" />
            {Array.from({ length: 12 }).map((_, i) => (
              <rect key={`t${i}`} x={60 + (i % 6) * 12} y={20 + Math.floor(i / 6) * 12} width="8" height="8" fill="black" />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <rect key={`m${i}`} x={60 + (i % 5) * 12} y={50 + Math.floor(i / 5) * 12} width="8" height="8" fill="black" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <rect key={`b${i}`} x={60 + (i % 4) * 15} y={80 + Math.floor(i / 4) * 15} width="10" height="10" fill="black" />
            ))}
            {Array.from({ length: 15 }).map((_, i) => (
              <rect key={`r${i}`} x={40 + (i % 8) * 10} y={110 + Math.floor(i / 8) * 10} width="6" height="6" fill="black" />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <rect key={`d${i}`} x={80 + (i % 5) * 12} y={130 + Math.floor(i / 5) * 12} width="8" height="8" fill="black" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <rect key={`e${i}`} x={50 + (i % 4) * 15} y={155 + Math.floor(i / 4) * 8} width="10" height="5" fill="black" />
            ))}
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Scan to mark attendance</p>
          <p className="text-xs text-muted-foreground mt-1 break-all max-w-full">
            Event ID: <span className="font-mono text-primary">{eventId}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{eventTitle}</p>
        </div>
        <Button variant="outline" className="mt-2">
          <Download className="h-4 w-4 mr-2" />
          Download QR
        </Button>
      </div>
    </Modal>
  );
}

// ── Scanner Input Modal ───────────────────────────────────────────────────────

function ScannerModal({
  eventId,
  open,
  onClose,
  onScan,
}: {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onScan: (qrCode: string) => void;
}) {
  const [qrInput, setQrInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrInput.trim()) {
      onScan(qrInput.trim());
      setQrInput("");
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Scan QR Code" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-lg">
          <Camera className="h-8 w-8 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Enter QR Code Content</p>
            <p className="text-xs text-muted-foreground">Paste the scanned QR content below</p>
          </div>
        </div>
        <div className="relative">
          <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="USER-XXXXXX or event identifier..."
            className="pl-10"
            autoFocus
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Check className="h-4 w-4 mr-2" />
            Mark Attended
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Last Scan Display ─────────────────────────────────────────────────────────

function LastScanDisplay({ lastScan }: { lastScan: { userId: string; result: string; timestamp: string } | null }) {
  if (!lastScan) return null;
  return (
    <div
      className={cn(
        "mb-4 p-3 rounded-lg border flex items-center gap-3",
        lastScan.result.startsWith("Marked") ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      )}
    >
      {lastScan.result.startsWith("Marked") ? (
        <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
      ) : (
        <X className="h-5 w-5 text-red-600 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{lastScan.result}</p>
        <p className="text-xs text-muted-foreground truncate">User: {lastScan.userId}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDateTime(lastScan.timestamp)}
      </span>
    </div>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────

function HODAttendanceContent() {
  const [events, setEvents] = useState<HODEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<HODEvent | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventLoading, setEventLoading] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<{ userId: string; result: string; timestamp: string } | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events?limit=100");
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      const eventList = (data.events || [])
        .filter((e: any) => e.departmentCode === "CSE" && (e.status === "upcoming" || e.status === "ongoing"))
        .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      setEvents(eventList);
      if (eventList.length > 0 && !selectedEvent) {
        setSelectedEvent(eventList[0]);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  }, [selectedEvent]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const fetchParticipants = useCallback(async () => {
    if (!selectedEvent) return;
    setEventLoading(true);
    try {
      const res = await fetch(`/api/attendance?eventId=${selectedEvent.eventId}`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      const data = await res.json();
      setParticipants(data.participants || []);
    } catch (err) {
      console.error("Failed to fetch participants:", err);
      setParticipants([]);
    } finally {
      setEventLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const toggleParticipant = (participant: Participant) => {
    const regId = participant.registrationId;
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(regId)) {
      newSelected.delete(regId);
    } else {
      newSelected.add(regId);
    }
    setSelectedParticipants(newSelected);
  };

  const selectAll = () => {
    if (selectedParticipants.size === participants.filter((p) => p.status !== "attended").length) {
      setSelectedParticipants(new Set());
    } else {
      const toSelect = new Set(
        participants
          .filter((p) => p.status !== "attended" && p.status !== "cancelled" && p.status !== "rejected")
          .map((p) => p.registrationId)
      );
      setSelectedParticipants(toSelect);
    }
  };

  const handleToggleAttended = async (registrationId: string) => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent?.eventId, userId: registrationId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark attended");
      }
      const data = await res.json();
      if (data.success) {
        setParticipants((prev) =>
          prev.map((p) =>
            p.registrationId === registrationId
              ? { ...p, status: "attended", isAttended: true, attendedAt: new Date().toISOString() }
              : p
          )
        );
        setSelectedParticipants((prev) => {
          const next = new Set(prev);
          next.delete(registrationId);
          return next;
        });
      }
    } catch (err: any) {
      alert(err.message || "Failed to mark attendance");
    }
  };

  const handleBulkMarkAttended = async () => {
    const userIds = Array.from(selectedParticipants);
    if (userIds.length === 0) return;
    setScanning(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent?.eventId, userIds }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark attended");
      }
      const data = await res.json();
      setParticipants((prev) =>
        prev.map((p) => {
          if (data.results?.some((r: any) => r.userId === p.userId && r.success)) {
            return { ...p, status: "attended", isAttended: true, attendedAt: new Date().toISOString() };
          }
          return p;
        })
      );
      setSelectedParticipants(new Set());
    } catch (err: any) {
      alert(err.message || "Failed to mark attendance");
    } finally {
      setScanning(false);
    }
  };

  const handleQRScan = async (qrCode: string) => {
    setScanning(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent?.eventId, qrCode }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark attended");
      }
      const data = await res.json();
      if (data.success) {
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === data.results?.[0]?.userId
              ? { ...p, status: "attended", isAttended: true, attendedAt: new Date().toISOString() }
              : p
          )
        );
        setLastScan({
          userId: data.results?.[0]?.userId || qrCode,
          result: "Marked as attended",
          timestamp: new Date().toISOString(),
        });
      } else {
        setLastScan({
          userId: qrCode,
          result: "Failed: " + (data.results?.[0]?.error || "Unknown error"),
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setLastScan({
        userId: qrCode,
        result: "Error: " + err.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setScanning(false);
    }
  };

  const selectedEventParticipants = participants.filter((p) => p.eventId === selectedEvent?.eventId);
  const attendedCount = participants.filter((p) => p.isAttended).length;
  const pendingCount = participants.filter((p) => p.status === "pending").length;
  const confirmedCount = participants.filter((p) => p.status === "confirmed").length;
  const totalCount = participants.length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-purple-600" />
            Attendance
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedEvent ? `Mark attendance for "${selectedEvent.title}"` : "Select an event to manage attendance"}
          </p>
        </div>
        {selectedEvent && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowQRModal(true)} className="gap-2">
              <QrCode className="h-4 w-4" />
              Show QR Code
            </Button>
            <Button onClick={() => setShowScannerModal(true)} className="gap-2">
              <Camera className="h-4 w-4" />
              Scan QR
            </Button>
          </div>
        )}
      </div>

      {/* Event Selector */}
      {events.length > 0 && (
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground block mb-2">Select Event</label>
          <select
            value={selectedEvent?.eventId || ""}
            onChange={(e) => {
              const event = events.find((ev) => ev.eventId === e.target.value);
              setSelectedEvent(event || null);
              setSelectedParticipants(new Set());
            }}
            className="w-full sm:w-96 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">— Choose an event —</option>
            {events.map((e) => (
              <option key={e.eventId} value={e.eventId}>
                {e.title} — {formatDate(e.startDate)} ({getEventStatusLabel(e.status)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Event Info */}
      {selectedEvent && (
        <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", getCategoryColor(selectedEvent.category).split(" ")[0])}>
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selectedEvent.title}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(selectedEvent.startDate)} &middot; {selectedEvent.startTime} - {selectedEvent.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {selectedEvent.venue}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs", getEventStatusColor(selectedEvent.status))}>
                {getEventStatusLabel(selectedEvent.status)}
              </Badge>
              <Badge variant="outline" className="text-xs border-border">
                {selectedEvent.category}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {selectedEvent && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <Card className="bg-purple-50/50 border-purple-100">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-purple-700">{totalCount}</p>
              <p className="text-xs text-purple-600 mt-1">Total Registered</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50/50 border-yellow-100">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-yellow-700">{pendingCount}</p>
              <p className="text-xs text-yellow-600 mt-1">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50/50 border-green-100">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-green-700">{confirmedCount}</p>
              <p className="text-xs text-green-600 mt-1">Confirmed</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-blue-700">{attendedCount}</p>
              <p className="text-xs text-blue-600 mt-1">Attended</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50/50 border-purple-100">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-purple-700">
                {totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0}%
              </p>
              <p className="text-xs text-purple-600 mt-1">Attendance Rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selection bar */}
      {selectedEvent && selectedParticipants.size > 0 && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100 flex items-center justify-between">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{selectedParticipants.size}</span> participant(s) selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-purple-700">
              {selectedParticipants.size === participants.filter((p) => p.status !== "attended" && p.status !== "cancelled" && p.status !== "rejected").length
                ? "Deselect All"
                : "Select All"}
            </Button>
            <Button size="sm" onClick={handleBulkMarkAttended} disabled={scanning} className="gap-2">
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Mark {selectedParticipants.size} Attended
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Last scan display */}
      <LastScanDisplay lastScan={lastScan} />

      {/* Participant List */}
      {!selectedEvent ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Select an event</h3>
            <p className="text-sm text-muted-foreground">
              Choose an event from the dropdown above to manage attendance
            </p>
          </CardContent>
        </Card>
      ) : eventLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="skeleton" />
          ))}
        </div>
      ) : selectedEventParticipants.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No participants yet</h3>
            <p className="text-sm text-muted-foreground">
              Participants will appear here once they register for this event
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {selectedEventParticipants.map((participant) => (
            <ParticipantRow
              key={participant.registrationId}
              participant={participant}
              onToggleAttended={handleToggleAttended}
              selected={selectedParticipants.has(participant.registrationId)}
              onSelect={toggleParticipant}
            />
          ))}
        </div>
      )}

      {/* Pagination info */}
      {selectedEvent && !eventLoading && selectedEventParticipants.length > 0 && (
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Showing {selectedEventParticipants.length} participant{selectedEventParticipants.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        eventId={selectedEvent?.eventId || ""}
        eventTitle={selectedEvent?.title || ""}
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
      />

      {/* Scanner Modal */}
      <ScannerModal
        eventId={selectedEvent?.eventId || ""}
        open={showScannerModal}
        onClose={() => { setShowScannerModal(false); setLastScan(null); }}
        onScan={handleQRScan}
      />
    </div>
  );
}

export default function HODAttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse text-lg font-medium">Loading attendance...</div>
        </div>
      }
    >
      <HODAttendanceContent />
    </Suspense>
  );
}
