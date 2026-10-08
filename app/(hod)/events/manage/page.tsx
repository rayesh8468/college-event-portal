"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  X,
  Check,
  Loader2,
  ArrowRight,
  Clock,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn, formatDate, getEventStatusLabel, getEventStatusColor, getCategoryColor, formatCurrency } from "@/lib/utils";
import { EventCategory, EventType, EventStatus } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────────────

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
  status: EventStatus;
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

interface CreateEventForm {
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
  maxParticipants: string;
  registrationFee: string;
  pointsParticipant: string;
  pointsVolunteer: string;
  requiresOD: boolean;
  isWorkingDay: boolean;
}

const DEPARTMENTS = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AI&DS"];
const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "Technical", label: "Technical" },
  { value: "Cultural", label: "Cultural" },
  { value: "Sports", label: "Sports" },
  { value: "Social", label: "Social" },
  { value: "Academic", label: "Academic" },
];
const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "Workshop", label: "Workshop" },
  { value: "Hackathon", label: "Hackathon" },
  { value: "Competition", label: "Competition" },
  { value: "Talk", label: "Talk" },
  { value: "Fest", label: "Fest" },
  { value: "Campaign", label: "Campaign" },
  { value: "Seminar", label: "Seminar" },
  { value: "Exhibition", label: "Exhibition" },
];
const STATUS_FILTERS = [
  { value: "", label: "All Statuses" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// ── Event Row ────────────────────────────────────────────────────────────────

function EventRow({ event, onEdit, onDelete }: {
  event: HODEvent;
  onEdit: (event: HODEvent) => void;
  onDelete: (id: string) => void;
}) {
  const isUpcoming = event.status === "upcoming" || event.status === "ongoing";

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn("text-xs", getCategoryColor(event.category).split(" ")[0])}>
                {event.category}
              </Badge>
              <Badge variant="outline" className="text-xs border-border">
                {event.eventType}
              </Badge>
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", getEventStatusColor(event.status))}>
                {getEventStatusLabel(event.status)}
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {event.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {event.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(event.startDate)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {event.startTime} - {event.endTime}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {event.confirmedCount}/{event.maxParticipants} confirmed
              </span>
              {event.registrationFee > 0 && (
                <span className="flex items-center gap-1 text-primary font-medium">
                  {formatCurrency(event.registrationFee)}
                </span>
              )}
              {event.requiresOD && (
                <span className="flex items-center gap-1 text-amber-600">
                  <FileText className="h-3.5 w-3.5" />
                  OD Required
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground group-hover:text-foreground"
              onClick={() => onEdit(event)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground group-hover:text-red-500"
              onClick={() => onDelete(event.eventId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Create / Edit Modal ──────────────────────────────────────────────────────

function EventModal({
  isOpen,
  onClose,
  onSubmit,
  editingEvent,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEventForm) => void;
  editingEvent?: HODEvent | null;
}) {
  const [form, setForm] = useState<CreateEventForm>({
    title: "",
    description: "",
    departmentCode: DEPARTMENTS[0],
    category: "Technical",
    eventType: "Workshop",
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "17:00",
    venue: "",
    maxParticipants: "50",
    registrationFee: "0",
    pointsParticipant: "5",
    pointsVolunteer: "10",
    requiresOD: true,
    isWorkingDay: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingEvent) {
      setForm({
        title: editingEvent.title,
        description: editingEvent.description,
        departmentCode: editingEvent.departmentCode,
        category: editingEvent.category,
        eventType: editingEvent.eventType,
        startDate: editingEvent.startDate,
        endDate: editingEvent.endDate,
        startTime: editingEvent.startTime,
        endTime: editingEvent.endTime,
        venue: editingEvent.venue,
        maxParticipants: String(editingEvent.maxParticipants),
        registrationFee: String(editingEvent.registrationFee),
        pointsParticipant: String(editingEvent.pointsAwarded.participant || 5),
        pointsVolunteer: String(editingEvent.pointsAwarded.volunteer || 10),
        requiresOD: editingEvent.requiresOD,
        isWorkingDay: editingEvent.isWorkingDay,
      });
    } else {
      setForm({
        title: "",
        description: "",
        departmentCode: DEPARTMENTS[0],
        category: "Technical",
        eventType: "Workshop",
        startDate: "",
        endDate: "",
        startTime: "09:00",
        endTime: "17:00",
        venue: "",
        maxParticipants: "50",
        registrationFee: "0",
        pointsParticipant: "5",
        pointsVolunteer: "10",
        requiresOD: true,
        isWorkingDay: false,
      });
    }
    setError("");
  }, [editingEvent, isOpen]);

  const handleChange = (field: keyof CreateEventForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.venue.trim() || !form.startDate) {
      setError("Please fill in all required fields");
      return;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      setError("End date must be after start date");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">
              {editingEvent ? "Edit Event" : "Create New Event"}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                <X className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground block mb-1">Event Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Hands-on React Workshop"
                  className="w-full"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground block mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Brief description of the event..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none h-20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Department</label>
                <select
                  value={form.departmentCode}
                  onChange={(e) => handleChange("departmentCode", e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value as EventCategory)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Event Type</label>
                <select
                  value={form.eventType}
                  onChange={(e) => handleChange("eventType", e.target.value as EventType)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Start Date *</label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">End Date *</label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Start Time</label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => handleChange("startTime", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">End Time</label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => handleChange("endTime", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Venue *</label>
                <Input
                  value={form.venue}
                  onChange={(e) => handleChange("venue", e.target.value)}
                  placeholder="e.g., Room 301, Block A"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Max Participants</label>
                  <Input
                    type="number"
                    value={form.maxParticipants}
                    onChange={(e) => handleChange("maxParticipants", e.target.value)}
                    className="w-full"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Registration Fee (₹)</label>
                  <Input
                    type="number"
                    value={form.registrationFee}
                    onChange={(e) => handleChange("registrationFee", e.target.value)}
                    className="w-full"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Points (Participant)</label>
                  <Input
                    type="number"
                    value={form.pointsParticipant}
                    onChange={(e) => handleChange("pointsParticipant", e.target.value)}
                    className="w-full"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Points (Volunteer)</label>
                  <Input
                    type="number"
                    value={form.pointsVolunteer}
                    onChange={(e) => handleChange("pointsVolunteer", e.target.value)}
                    className="w-full"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresOD}
                    onChange={(e) => handleChange("requiresOD", e.target.checked)}
                    className="rounded border-border text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-foreground">Requires OD</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isWorkingDay}
                    onChange={(e) => handleChange("isWorkingDay", e.target.checked)}
                    className="rounded border-border text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-foreground">Working Day</span>
                </label>
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
                      {editingEvent ? "Update Event" : "Create Event"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// TODO: Implement FileText icon (stub for now)
function FileText({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

// ── Main Page Content ───────────────────────────────────────────────────────

function HODEventsContent() {
  const [events, setEvents] = useState<HODEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<HODEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events?limit=100");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      let filtered = (data.events || []) as HODEvent[];

      // Filter by department (HOD's department - hardcoded as CSE for now)
      filtered = filtered.filter((e) => e.departmentCode === "CSE");

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            e.venue.toLowerCase().includes(q)
        );
      }

      // Status filter
      if (statusFilter) {
        filtered = filtered.filter((e) => e.status === statusFilter);
      }

      setEvents(filtered);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreate = async (form: CreateEventForm) => {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        maxParticipants: parseInt(form.maxParticipants),
        registrationFee: parseInt(form.registrationFee),
        pointsAwarded: {
          participant: parseInt(form.pointsParticipant) || 5,
          volunteer: parseInt(form.pointsVolunteer) || 10,
        },
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to create event");
    }

    const { event } = await res.json();
    setEvents((prev) => [event as unknown as HODEvent, ...prev]);
  };

  const handleUpdate = async (form: CreateEventForm) => {
    if (!editingEvent) return;

    const res = await fetch("/api/events", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: editingEvent.eventId,
        ...form,
        maxParticipants: parseInt(form.maxParticipants),
        registrationFee: parseInt(form.registrationFee),
        pointsAwarded: {
          participant: parseInt(form.pointsParticipant) || 5,
          volunteer: parseInt(form.pointsVolunteer) || 10,
        },
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to update event");
    }

    const { event } = await res.json();
    setEvents((prev) =>
      prev.map((e) => (e.eventId === event.eventId ? (event as unknown as HODEvent) : e))
    );
  };

  const handleDelete = async (eventId: string) => {
    setDeleting(true);
    try {
      const res = await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete event");
      }

      setEvents((prev) => prev.filter((e) => e.eventId !== eventId));
      setDeleteConfirm(null);
    } catch (error: any) {
      alert(error.message || "Failed to delete event");
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (event: HODEvent) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-7 w-7 text-purple-600" />
            My Events
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage events for <span className="font-medium text-foreground">CSE Department</span>
            {" "}<span className="text-xs text-muted-foreground">(/events/manage)</span>
          </p>
        </div>
        <Button onClick={() => { setEditingEvent(null); setShowModal(true); }}>
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{events.length}</p>
            <p className="text-xs text-purple-600 mt-1">Total Events</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {events.filter((e) => e.status === "upcoming").length}
            </p>
            <p className="text-xs text-blue-600 mt-1">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">
              {events.reduce((s, e) => s + (e.confirmedCount || 0), 0)}
            </p>
            <p className="text-xs text-green-600 mt-1">Confirmed</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">
              {events.filter((e) => e.requiresOD).length}
            </p>
            <p className="text-xs text-amber-600 mt-1">Require OD</p>
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
            placeholder="Search events..."
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
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Event List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="skeleton" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No events yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || statusFilter
                ? "Try adjusting your filters"
                : "Create your first event to get started"}
            </p>
            <Button onClick={() => { setEditingEvent(null); setShowModal(true); }}>
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventRow
              key={event.eventId}
              event={event}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination info */}
      {!loading && events.length > 0 && (
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Showing {events.length} event{events.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Modals */}
      <EventModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingEvent(null); }}
        onSubmit={editingEvent ? handleUpdate : handleCreate}
        editingEvent={editingEvent}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <Card className="relative w-full max-w-sm">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Delete Event?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  This action cannot be undone. The event and all its registrations will be permanently deleted.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(deleteConfirm)}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Event"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function HODEventsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse text-lg font-medium">Loading events...</div>
        </div>
      }
    >
      <HODEventsContent />
    </Suspense>
  );
}
