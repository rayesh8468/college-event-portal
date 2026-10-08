"use client";

import Link from "next/link";
import { Calendar, MapPin, Users, Clock, ArrowRight, Filter } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn, formatDate, getEventStatusLabel, getEventStatusColor, getCategoryColor } from "@/lib/utils";
import { EventType, EventCategory } from "@/lib/types";
import { Suspense, useState, useEffect } from "react";

interface EventItem {
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
  isWorkingDay: boolean;
  teamSize: { min: number; max: number } | null;
}

function EventCard({ event }: { event: EventItem }) {
  const isTeamEvent = event.teamSize !== null;

  return (
    <Link href={`/events/${event.eventId}`}>
      <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <Badge className={cn("text-xs", getCategoryColor(event.category).split(" ")[0])}>
              {event.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(event.startDate)}
            </span>
          </div>

          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {event.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {event.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {event.maxParticipants} slots
            </span>
            {event.registrationFee > 0 && (
              <span className="flex items-center gap-1 text-primary font-medium">
                ₹{event.registrationFee}
              </span>
            )}
            {isTeamEvent && event.teamSize && (
              <span className="flex items-center gap-1">
                <span className="text-primary">Team</span>
                ({event.teamSize.min}-{event.teamSize.max})
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                getEventStatusColor(event.status)
              )}>
                {getEventStatusLabel(event.status)}
              </span>
              {event.isWorkingDay && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Working day
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
              View Details <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EventGrid({ events, emptyMessage }: { events: EventItem[]; emptyMessage?: string }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No events found</h3>
        <p className="text-sm text-muted-foreground">{emptyMessage || "There are no events at the moment."}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => (
        <EventCard key={event.eventId} event={event} />
      ))}
    </div>
  );
}

function FilterBar({
  category,
  eventType,
  onCategoryChange,
  onEventTypeChange,
  categories,
  eventTypes,
}: {
  category: string;
  eventType: string;
  onCategoryChange: (v: string) => void;
  onEventTypeChange: (v: string) => void;
  categories: { value: string; label: string }[];
  eventTypes: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Filter:</span>
      </div>
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      <select
        value={eventType}
        onChange={(e) => onEventTypeChange(e.target.value)}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm"
      >
        <option value="">All Types</option>
        {eventTypes.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </div>
  );
}

async function fetchEvents(category: string, eventType: string): Promise<EventItem[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (eventType) params.set("eventType", eventType);

  try {
    const res = await fetch(`/api/events?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.events || []) as EventItem[];
  } catch {
    return [];
  }
}

function EventsPageContent() {
  const [category, setCategory] = useState("");
  const [eventType, setEventType] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const categories: { value: string; label: string }[] = [
    { value: "Technical", label: "Technical" },
    { value: "Cultural", label: "Cultural" },
    { value: "Sports", label: "Sports" },
    { value: "Social", label: "Social" },
    { value: "Academic", label: "Academic" },
  ];

  const eventTypes: { value: string; label: string }[] = [
    { value: "Workshop", label: "Workshop" },
    { value: "Hackathon", label: "Hackathon" },
    { value: "Competition", label: "Competition" },
    { value: "Talk", label: "Talk" },
    { value: "Fest", label: "Fest" },
    { value: "Campaign", label: "Campaign" },
    { value: "Seminar", label: "Seminar" },
    { value: "Exhibition", label: "Exhibition" },
  ];

  useEffect(() => {
    setLoading(true);
    fetchEvents(category, eventType).then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, [category, eventType]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Events</h1>
        <p className="text-muted-foreground mt-1">Browse and register for college events</p>
      </div>

      <FilterBar
        category={category}
        eventType={eventType}
        onCategoryChange={setCategory}
        onEventTypeChange={setEventType}
        categories={categories}
        eventTypes={eventTypes}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="skeleton" />
          ))}
        </div>
      ) : (
        <EventGrid
          events={events}
          emptyMessage="Try adjusting your filters or check back later for new events."
        />
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8"><div className="animate-pulse text-lg">Loading...</div></div>}>
      <EventsPageContent />
    </Suspense>
  );
}
