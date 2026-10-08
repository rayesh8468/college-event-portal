"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import {
  FileText,
  TrendingUp,
  Users,
  Calendar,
  Award,
  DollarSign,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  cn,
  formatDate,
  formatCurrency,
  getCategoryColor,
  getEventStatusLabel,
  getEventStatusColor,
} from "@/lib/utils";
import { EventCategory } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface EventSummary {
  eventId: string;
  title: string;
  category: EventCategory;
  eventType: string;
  startDate: string;
  endDate: string;
  venue: string;
  status: string;
  maxParticipants: number;
  registrationFee: number;
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
  departmentCode: string;
}

interface ReportData {
  totalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalRegistrations: number;
  confirmedRegistrations: number;
  attendedRegistrations: number;
  cancelledRegistrations: number;
  totalRevenue: number;
  eventsByCategory: { category: EventCategory; count: number; revenue: number }[];
  eventsByStatus: { status: string; count: number }[];
  topEvents: EventSummary[];
  recentActivity: { type: string; description: string; date: string }[];
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sublabel,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sublabel?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {sublabel && (
              <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
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

// ── Category Breakdown ────────────────────────────────────────────────────────

function CategoryBreakdown({ data }: { data: { category: string; count: number; revenue: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          Events by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item) => (
          <div key={item.category}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs", getCategoryColor(item.category).split(" ")[0])}>
                  {item.category}
                </Badge>
                <span className="text-sm text-muted-foreground">{item.count} events</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(item.revenue)}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", getCategoryColor(item.category).split(" ")[0])}
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Status Distribution ────────────────────────────────────────────────────────

function StatusDistribution({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const statusStyles: Record<string, string> = {
    upcoming: "bg-blue-500",
    ongoing: "bg-green-500",
    completed: "bg-gray-500",
    cancelled: "bg-red-500",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PieChart className="h-5 w-5 text-purple-600" />
          Events by Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item) => (
          <div key={item.status} className="flex items-center gap-3">
            <div className="w-32 flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <Badge className={cn("text-xs", getEventStatusColor(item.status))}>
                  {getEventStatusLabel(item.status)}
                </Badge>
                <span className="text-sm font-medium text-foreground">{item.count}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", statusStyles[item.status] || "bg-gray-400")}
                  style={{ width: total > 0 ? `${(item.count / total) * 100}%` : "0%" }}
                />
              </div>
            </div>
            {total > 0 && (
              <span className="text-xs text-muted-foreground">
                {((item.count / total) * 100).toFixed(1)}%
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Top Events Table ───────────────────────────────────────────────────────────

function TopEventsTable({ events }: { events: EventSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Event Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Event</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Category</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Participants</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Confirmed</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.eventId} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-3">
                    <p className="font-medium text-foreground truncate max-w-[150px]">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.eventType}</p>
                  </td>
                  <td className="py-3 px-3">
                    <Badge className={cn("text-xs", getCategoryColor(event.category).split(" ")[0])}>
                      {event.category}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{formatDate(event.startDate)}</td>
                  <td className="py-3 px-3">
                    <Badge className={cn("text-xs", getEventStatusColor(event.status))}>
                      {getEventStatusLabel(event.status)}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right text-foreground">{event.participantCount}</td>
                  <td className="py-3 px-3 text-right text-foreground">{event.confirmedCount}</td>
                  <td className="py-3 px-3 text-right">
                    {event.registrationFee > 0
                      ? formatCurrency(event.registrationFee * event.confirmedCount)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {events.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No events to display
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Revenue Chart (bar visualization) ─────────────────────────────────────────

function RevenueChart({ data }: { data: { category: string; revenue: number }[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Revenue by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item) => (
          <div key={item.category} className="flex items-center gap-3">
            <div className="w-24 flex-shrink-0">
              <Badge className={cn("text-xs", getCategoryColor(item.category).split(" ")[0])}>
                {item.category}
              </Badge>
            </div>
            <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all flex items-center justify-end pr-2"
                style={{ width: maxRevenue > 0 ? `${(item.revenue / maxRevenue) * 100}%` : "0%" }}
              >
                {item.revenue > 0 && (
                  <span className="text-xs font-medium text-white">
                    {formatCurrency(item.revenue)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Revenue</span>
          <span className="text-lg font-bold text-green-700">
            {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────

function HODReportsContent() {
  const [report, setReport] = useState<Partial<ReportData>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch("/api/events?limit=200");
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      const events = (data.events || []) as EventSummary[];

      // Filter to CSE department
      const cseEvents = events.filter((e) => e.departmentCode === "CSE");

      const totalEvents = cseEvents.length;
      const upcomingEvents = cseEvents.filter((e) => e.status === "upcoming").length;
      const ongoingEvents = cseEvents.filter((e) => e.status === "ongoing").length;
      const completedEvents = cseEvents.filter((e) => e.status === "completed").length;
      const cancelledEvents = cseEvents.filter((e) => e.status === "cancelled").length;

      const totalRegistrations = cseEvents.reduce((sum, e) => sum + (e.participantCount || 0), 0);
      const confirmedRegistrations = cseEvents.reduce((sum, e) => sum + (e.confirmedCount || 0), 0);
      const cancelledRegistrations = cseEvents.reduce((sum, e) => sum + (e.cancelledCount || 0), 0);

      // Estimate attended from confirmed (we don't have attended count in events API)
      const attendedRegistrations = confirmedRegistrations;

      const totalRevenue = cseEvents.reduce((sum, e) => sum + (e.registrationFee * (e.confirmedCount || 0)), 0);

      // Events by category
      const categories: EventCategory[] = ["Technical", "Cultural", "Sports", "Social", "Academic"];
      const eventsByCategory = categories.map((cat) => {
        const catEvents = cseEvents.filter((e) => e.category === cat);
        return {
          category: cat,
          count: catEvents.length,
          revenue: catEvents.reduce((sum, e) => sum + e.registrationFee * (e.confirmedCount || 0), 0),
        };
      }).filter((c) => c.count > 0);

      // Events by status
      const statusCounts = [
        { status: "upcoming", count: upcomingEvents },
        { status: "ongoing", count: ongoingEvents },
        { status: "completed", count: completedEvents },
        { status: "cancelled", count: cancelledEvents },
      ].filter((s) => s.count > 0);

      // Top events (sorted by confirmed count)
      const topEvents = [...cseEvents]
        .sort((a, b) => (b.confirmedCount || 0) - (a.confirmedCount || 0))
        .slice(0, 10);

      setReport({
        totalEvents,
        upcomingEvents,
        ongoingEvents,
        completedEvents,
        cancelledEvents,
        totalRegistrations,
        confirmedRegistrations,
        attendedRegistrations,
        cancelledRegistrations,
        totalRevenue,
        eventsByCategory,
        eventsByStatus: statusCounts,
        topEvents,
        recentActivity: [
          { type: "event_created", description: `${cseEvents.length} events created this period`, date: new Date().toISOString() },
          { type: "registration", description: `${totalRegistrations} total registrations`, date: new Date().toISOString() },
          { type: "attendance", description: `${attendedRegistrations} participants attended`, date: new Date().toISOString() },
        ],
      });
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const statCards = [
    {
      label: "Total Events",
      value: report.totalEvents ?? 0,
      icon: Calendar,
      color: "bg-purple-500",
      sublabel: `${report.upcomingEvents ?? 0} upcoming`,
    },
    {
      label: "Total Registrations",
      value: report.totalRegistrations ?? 0,
      icon: Users,
      color: "bg-blue-500",
      sublabel: `${report.confirmedRegistrations ?? 0} confirmed`,
    },
    {
      label: "Attendance Rate",
      value: report.totalRegistrations && report.totalRegistrations > 0
        ? `${Math.round(((report.attendedRegistrations ?? 0) / report.totalRegistrations) * 100)}%`
        : "—",
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(report.totalRevenue ?? 0),
      icon: DollarSign,
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-7 w-7 text-purple-600" />
            Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Event analytics and performance summary for <span className="font-medium text-foreground">CSE Department</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Time</option>
            <option value="this-month">This Month</option>
            <option value="this-semester">This Semester</option>
          </select>
          <Button variant="outline" onClick={fetchReport} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CategoryBreakdown data={report.eventsByCategory || []} />
        <StatusDistribution data={report.eventsByStatus || []} />
      </div>

      {/* Revenue Chart */}
      {report.eventsByCategory && report.eventsByCategory.length > 0 && (
        <div className="mb-6">
          <RevenueChart data={report.eventsByCategory} />
        </div>
      )}

      {/* Event Summary Table */}
      <div className="mb-6">
        <TopEventsTable events={report.topEvents || []} />
      </div>

      {/* Export Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export as PDF
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export as CSV
        </Button>
        <span className="text-xs text-muted-foreground">
          Reports are generated from live data
        </span>
      </div>
    </div>
  );
}

export default function HODReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse text-lg font-medium">Loading reports...</div>
        </div>
      }
    >
      <HODReportsContent />
    </Suspense>
  );
}
