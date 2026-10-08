"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  FileText,
  Clock,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn, formatDate, getEventStatusLabel, getEventStatusColor } from "@/lib/utils";
import { EventCategory } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardEvent {
  eventId: string;
  title: string;
  departmentCode: string;
  category: EventCategory;
  startDate: string;
  startTime: string;
  venue: string;
  status: string;
  maxParticipants: number;
  confirmedCount: number;
  cancelledCount: number;
  participantCount: number;
  registrationFee: number;
}

interface ODRequest {
  odRequestId: string;
  userName: string;
  eventTitle: string;
  departmentCode: string;
  startDate: string;
  status: string;
  referenceNumber: string;
}

interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  totalRegistrations: number;
  pendingODs: number;
  totalParticipants: number;
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-lg", color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Recent Event Row ─────────────────────────────────────────────────────────

function EventRow({ event }: { event: DashboardEvent }) {
  return (
    <Link
      href={`/events/${event.eventId}`}
      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("p-2 rounded-lg flex-shrink-0", getEventStatusColor(event.status).split(" ")[0])}>
          <Calendar className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {event.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {event.departmentCode} &middot; {formatDate(event.startDate)} &middot; {event.venue}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Badge className={cn("text-xs", getEventStatusColor(event.status))}>
          {getEventStatusLabel(event.status)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {event.confirmedCount}/{event.maxParticipants}
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}

// ── Pending OD Row ───────────────────────────────────────────────────────────

function ODRow({ od }: { od: ODRequest }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{od.userName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {od.eventTitle} &middot; {od.referenceNumber}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-xs">
          {od.status}
        </Badge>
        <Button variant="ghost" size="sm" className="text-xs h-7">
          Review
        </Button>
      </div>
    </div>
  );
}

// ── Main Dashboard Content ──────────────────────────────────────────────────

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<DashboardEvent[]>([]);
  const [pendingODs, setPendingODs] = useState<ODRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventsRes, odRes] = await Promise.all([
          fetch("/api/events?limit=50"),
          fetch("/api/od"),
        ]);

        const eventsData = await eventsRes.json();
        const odData = await odRes.json();

        const events: DashboardEvent[] = (eventsData.events || [])
          .filter((e: any) => e.departmentCode === "CSE") // HOD's department
          .slice(0, 5);

        const ods: ODRequest[] = (odData.odRequests || [])
          .filter((o: any) => o.status === "pending")
          .slice(0, 5);

        const totalRegistrations = events.reduce((sum: number, e: any) => {
          return sum + (e.participantCount || 0) + (e.confirmedCount || 0);
        }, 0);

        setStats({
          totalEvents: eventsData.events?.length || 0,
          upcomingEvents: (eventsData.events || []).filter(
            (e: any) => e.status === "upcoming"
          ).length,
          ongoingEvents: (eventsData.events || []).filter(
            (e: any) => e.status === "ongoing"
          ).length,
          completedEvents: (eventsData.events || []).filter(
            (e: any) => e.status === "completed"
          ).length,
          totalRegistrations,
          pendingODs: ods.length,
          totalParticipants: totalRegistrations,
        });

        setRecentEvents(events);
        setPendingODs(ods);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const departmentColor = "bg-purple-100 text-purple-700";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-7 w-7 text-purple-600" />
            HOD Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Badge className={departmentColor}>CSE Department</Badge>
            Welcome back, HOD
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/events/create">
            <Button>
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </Link>
          <Link href="/events">
            <Button variant="outline">
              View All Events
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Events"
          value={loading ? "-" : stats?.totalEvents ?? 0}
          icon={Calendar}
          color="bg-purple-500"
          trend="This semester"
        />
        <StatCard
          label="Upcoming Events"
          value={loading ? "-" : stats?.upcomingEvents ?? 0}
          icon={Clock}
          color="bg-blue-500"
        />
        <StatCard
          label="Total Registrations"
          value={loading ? "-" : stats?.totalRegistrations ?? 0}
          icon={Users}
          color="bg-green-500"
          trend="+12 this week"
        />
        <StatCard
          label="Pending OD Requests"
          value={loading ? "-" : stats?.pendingODs ?? 0}
          icon={FileText}
          color="bg-amber-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg skeleton" />
                ))}
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No events yet</p>
                <Link href="/events/create" className="inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline">
                  <Plus className="h-3.5 w-3.5" />
                  Create your first event
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((event) => (
                  <EventRow key={event.eventId} event={event} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending OD Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              Pending OD Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg skeleton" />
                ))}
              </div>
            ) : pendingODs.length === 0 ? (
              <div className="text-center py-6">
                <Check className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">No pending OD requests</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {pendingODs.map((od) => (
                  <ODRow key={od.odRequestId} od={od} />
                ))}
              </div>
            )}
            {!loading && pendingODs.length > 0 && (
              <Link
                href="/od-requests"
                className="mt-3 block text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View all OD requests &rarr;
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/events/create" className="group">
            <Card className="h-full border-dashed border-2 border-purple-200 hover:border-purple-400 transition-colors group-hover:bg-purple-50/50">
              <CardContent className="p-5 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <Plus className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-foreground">Create Event</p>
                <p className="text-xs text-muted-foreground mt-1">New event registration</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/participants" className="group">
            <Card className="h-full border-dashed border-2 border-purple-200 hover:border-purple-400 transition-colors group-hover:bg-purple-50/50">
              <CardContent className="p-5 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-foreground">Participants</p>
                <p className="text-xs text-muted-foreground mt-1">View & manage</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/attendance" className="group">
            <Card className="h-full border-dashed border-2 border-purple-200 hover:border-purple-400 transition-colors group-hover:bg-purple-50/50">
              <CardContent className="p-5 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-foreground">Attendance</p>
                <p className="text-xs text-muted-foreground mt-1">Mark & track</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/reports" className="group">
            <Card className="h-full border-dashed border-2 border-purple-200 hover:border-purple-400 transition-colors group-hover:bg-purple-50/50">
              <CardContent className="p-5 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-foreground">Reports</p>
                <p className="text-xs text-muted-foreground mt-1">Event analytics</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Building2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
    </svg>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function HODDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse text-lg font-medium">Loading dashboard...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
