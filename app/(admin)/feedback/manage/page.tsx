"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Search,
  Filter,
  Check,
  X,
  Clock,
  AlertCircle,
  Calendar,
  Loader2,
  Star,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Feedback {
  feedbackId: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  ratings: {
    content: number;
    venue: number;
    organization: number;
    overall: number;
  };
  comments?: string;
  submittedAt: string;
}

interface EventBasic {
  eventId: string;
  title: string;
  startDate: string;
  endDate: string;
  category: string;
  status: string;
  venue: string;
}

// ── Feedback Row ──────────────────────────────────────────────────────────────

function FeedbackRow({
  feedback,
  eventTitle,
  onView,
}: {
  feedback: Feedback;
  eventTitle: string;
  onView: (id: string) => void;
}) {
  const avgRating =
    (feedback.ratings.content +
      feedback.ratings.venue +
      feedback.ratings.organization +
      feedback.ratings.overall) /
    4;

  const stars = Math.round(avgRating);

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 flex-shrink-0">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {feedback.userName}
                </h3>
                {feedback.userEmail && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {feedback.userEmail}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1.5 text-xs text-muted-foreground">
                <div>
                  <span className="text-muted-foreground">Event: </span>
                  <span className="truncate">{eventTitle}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted: </span>
                  <span className="whitespace-nowrap">
                    {formatDateTime(feedback.submittedAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3 fill-current",
                      i < stars
                        ? "text-amber-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  {avgRating.toFixed(1)}
                </span>
              </div>
              {feedback.comments && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {feedback.comments}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground group-hover:text-foreground"
              onClick={() => onView(feedback.feedbackId)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Eye({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ── View Feedback Modal ───────────────────────────────────────────────────────

function ViewFeedbackModal({
  open,
  onClose,
  feedback,
  eventTitle,
}: {
  open: boolean;
  onClose: () => void;
  feedback?: Feedback | null;
  eventTitle?: string;
}) {
  if (!open || !feedback) return null;

  const avgRating =
    (feedback.ratings.content +
      feedback.ratings.venue +
      feedback.ratings.organization +
      feedback.ratings.overall) /
    4;

  return (
    <Modal open={open} onClose={onClose} title="Feedback Details" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <MessageSquare className="h-6 w-6 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              {feedback.userName}
            </p>
            {feedback.userEmail && (
              <p className="text-xs text-blue-600">{feedback.userEmail}</p>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">{eventTitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Content</p>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4 fill-current",
                    i < feedback.ratings.content
                      ? "text-amber-400"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Venue</p>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4 fill-current",
                    i < feedback.ratings.venue
                      ? "text-amber-400"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Organization</p>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4 fill-current",
                    i < feedback.ratings.organization
                      ? "text-amber-400"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Overall</p>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4 fill-current",
                    i < feedback.ratings.overall
                      ? "text-amber-400"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {feedback.comments && (
          <div>
            <p className="text-muted-foreground text-xs mb-1">Comments</p>
            <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">
              {feedback.comments}
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Submitted on {formatDateTime(feedback.submittedAt)}
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────

function AdminFeedbackContent() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, EventBasic>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [viewFeedback, setViewFeedback] =
    useState<Feedback | null>(null);
  const [viewEventTitle, setViewEventTitle] = useState("");

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
          startDate: e.startDate,
          endDate: e.endDate,
          category: e.category,
          status: e.status,
          venue: e.venue,
        };
      });
      setEventsMap(eventMap);

      // Fetch all feedback (by event)
      const allFeedback: Feedback[] = [];
      const eventIds = Object.keys(eventMap);
      for (const eventId of eventIds) {
        try {
          const res = await fetch(`/api/feedback?eventId=${eventId}`);
          const data = await res.json();
          (data.feedbacks || []).forEach((f: any) => {
            allFeedback.push(f as Feedback);
          });
        } catch {
          // Skip events with no feedback or API errors
        }
      }
      setFeedbacks(allFeedback);
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleView = (id: string) => {
    const f = feedbacks.find((fb) => fb.feedbackId === id);
    if (f) {
      setViewFeedback(f);
      setViewEventTitle(eventsMap[f.eventId]?.title || f.eventId);
    }
  };

  const filtered =
    feedbacks.filter((fb) => {
      const matchesSearch =
        !searchQuery.trim() ||
        fb.feedbackId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fb.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fb.comments?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEvent = !eventFilter || fb.eventId === eventFilter;

      return matchesSearch && matchesEvent;
    }) || [];

  const sorted = filtered.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  const uniqueEventIds = [...new Set(feedbacks.map((f) => f.eventId))].sort();
  const totalRatings =
    feedbacks.reduce((sum, f) => sum + f.ratings.overall, 0) || 0;
  const avgOverall =
    feedbacks.length > 0 ? totalRatings / feedbacks.length : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-blue-600" />
            Feedback Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage event feedback from participants
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{feedbacks.length}</p>
            <p className="text-xs text-blue-600 mt-1">Total Feedback</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">
              {avgOverall.toFixed(1)}
            </p>
            <p className="text-xs text-amber-600 mt-1">Avg Rating</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">
              {new Set(feedbacks.map((f) => f.userId)).size}
            </p>
            <p className="text-xs text-green-600 mt-1">Participants</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">
              {new Set(feedbacks.map((f) => f.eventId)).size}
            </p>
            <p className="text-xs text-purple-600 mt-1">Events</p>
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
            placeholder="Search by name, email, or comment..."
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
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="skeleton" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No feedback yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Feedback will appear here once participants submit their reviews
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((fb) => (
            <FeedbackRow
              key={fb.feedbackId}
              feedback={fb}
              eventTitle={eventsMap[fb.eventId]?.title || fb.eventId}
              onView={handleView}
            />
          ))}
        </div>
      )}

      {/* Pagination info */}
      {!loading && sorted.length > 0 && (
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Showing {sorted.length} feedback entry{sorted.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* View Modal */}
      <ViewFeedbackModal
        open={!!viewFeedback}
        onClose={() => {
          setViewFeedback(null);
          setViewEventTitle("");
        }}
        feedback={viewFeedback}
        eventTitle={viewEventTitle}
      />
    </div>
  );
}

export default function AdminFeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse text-lg font-medium">
            Loading feedback...
          </div>
        </div>
      }
    >
      <AdminFeedbackContent />
    </Suspense>
  );
}
