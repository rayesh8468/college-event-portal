"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatDateTime, cn, formatCurrency } from "@/lib/utils";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, CheckCircle, Clock, Calendar, Award, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface Feedback {
  feedbackId: string;
  eventId: string;
  userId: string;
  userName: string;
  ratings: {
    content: number;
    venue: number;
    organization: number;
    overall: number;
  };
  comments?: string;
  submittedAt: string;
}

interface Event {
  eventId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  category: string;
  status: string;
  maxParticipants: number;
  confirmedCount?: number;
  registrationFee: number;
  venue: string;
  eventType: string;
}

async function fetchFeedback(userId: string): Promise<Feedback[]> {
  try {
    const res = await fetch("/api/feedback", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.feedbacks || []).filter((f: any) => f.userId === userId) as Feedback[];
  } catch {
    return [];
  }
}

async function fetchEvents(userId: string): Promise<Event[]> {
  try {
    const res = await fetch("/api/events", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    const events = (data.events || []) as Event[];
    return events.filter((e) =>
      e.status === "completed" ||
      (e.status === "ongoing" && new Date(e.endDate) < new Date())
    );
  } catch {
    return [];
  }
}

async function submitFeedback(eventId: string, ratings: { content: number; venue: number; organization: number; overall: number }, comments?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, ratings, comments }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to submit feedback" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

function RatingStars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-lg transition-colors hover:scale-110 focus:outline-none"
        >
          {star <= (hover || value) ? (
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          ) : (
            <Star className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      Promise.all([
        fetchFeedback(user.id),
        fetchEvents(user.id),
      ]).then(([fb, evts]) => {
        setFeedback(fb);
        setEvents(evts);
        setLoading(false);
      });
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const submittedIds = new Set(feedback.map((f) => f.eventId));
  const pendingEvents = events.filter((e) => !submittedIds.has(e.eventId));

  const handleSubmit = async (eventId: string) => {
    if (!user || Object.keys(ratings).length < 4) {
      setError("Please rate all categories before submitting.");
      return;
    }

    const ratingValues = {
      content: ratings["content"] || 0,
      venue: ratings["venue"] || 0,
      organization: ratings["organization"] || 0,
      overall: ratings["overall"] || 0,
    };

    setSubmitting(true);
    setError(null);

    const result = await submitFeedback(eventId, ratingValues, comments || undefined);

    setSubmitting(false);

    if (result.success) {
      setFeedback((prev) => [
        ...prev,
        {
          feedbackId: `FB-${Date.now()}`,
          eventId,
          userId: user!.id,
          userName: user!.name,
          ratings: ratingValues,
          comments: comments || undefined,
          submittedAt: new Date().toISOString(),
        },
      ]);
      setRatings({});
      setComments("");
    } else {
      setError(result.error || "Failed to submit feedback");
    }
  };

  const getAverageRating = (fb: Feedback) => {
    const avg = (fb.ratings.content + fb.ratings.venue + fb.ratings.organization + fb.ratings.overall) / 4;
    return avg.toFixed(1);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Feedback</h1>
        <p className="text-muted-foreground mt-1">Rate and review events you have attended</p>
      </div>

      {authLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="skeleton"><CardContent className="p-6" /></Card>
          ))}
        </div>
      ) : !user ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Not signed in</h3>
            <p className="text-sm text-muted-foreground mb-4">Sign in to submit feedback</p>
            <a href="/login" className="inline-block"><Button>Sign In</Button></a>
          </CardContent>
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No events to review</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Events you have attended will appear here. Complete feedback to help us improve future events.
            </p>
            <a href="/events" className="inline-block"><Button>Browse Events</Button></a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="bg-yellow-50/30 border-yellow-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100">
                  <Star className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{pendingEvents.length}</p>
                  <p className="text-xs text-yellow-600">Events to Review</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50/30 border-green-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{feedback.length}</p>
                  <p className="text-xs text-green-600">Reviews Submitted</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submitted feedback */}
          {feedback.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Your Reviews
                <span className="text-sm font-normal text-muted-foreground">({feedback.length})</span>
              </h2>
              <div className="space-y-3">
                {feedback.map((fb) => {
                  const event = events.find((e) => e.eventId === fb.eventId);
                  return (
                    <Card key={fb.feedbackId} className="border-green-200/50">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" /> Submitted
                              </Badge>
                            </div>
                            <h3 className="text-base font-semibold text-foreground truncate">
                              {event?.title || "Event"}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-medium text-foreground">{getAverageRating(fb)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Content: {fb.ratings.content}/5</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Venue: {fb.ratings.venue}/5</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Award className="h-3.5 w-3.5" />
                            <span>Organization: {fb.ratings.organization}/5</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5" />
                            <span>Overall: {fb.ratings.overall}/5</span>
                          </div>
                        </div>

                        {fb.comments && (
                          <div className="p-3 rounded-lg bg-muted/50 mb-2">
                            <p className="text-sm text-muted-foreground">{fb.comments}</p>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Submitted: {formatDateTime(fb.submittedAt)}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Pending events to review */}
          {pendingEvents.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Events to Review
                <span className="text-sm font-normal text-muted-foreground">({pendingEvents.length})</span>
              </h2>
              <div className="space-y-3">
                {pendingEvents.map((event) => (
                  <Card key={event.eventId}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={cn(
                              "bg-cyan-100 text-cyan-700",
                              event.category === "Technical" && "bg-cyan-100 text-cyan-700",
                              event.category === "Cultural" && "bg-pink-100 text-pink-700",
                              event.category === "Sports" && "bg-orange-100 text-orange-700",
                              event.category === "Social" && "bg-green-100 text-green-700",
                              event.category === "Academic" && "bg-indigo-100 text-indigo-700"
                            )}>
                              {event.category}
                            </Badge>
                          </div>
                          <h3 className="text-base font-semibold text-foreground truncate">{event.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {event.eventType} • {formatDate(event.endDate)}
                          </p>
                        </div>
                        {event.registrationFee > 0 && (
                          <span className="text-sm font-medium text-primary">{formatCurrency(event.registrationFee)}</span>
                        )}
                      </div>

                      <div className="mb-4 p-4 rounded-lg bg-muted/50 space-y-3">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">How would you rate the content?</label>
                          <RatingStars
                            value={ratings[`content-${event.eventId}`] || 0}
                            onChange={(v) => setRatings((prev) => ({ ...prev, [`content-${event.eventId}`]: v }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">How was the venue?</label>
                          <RatingStars
                            value={ratings[`venue-${event.eventId}`] || 0}
                            onChange={(v) => setRatings((prev) => ({ ...prev, [`venue-${event.eventId}`]: v }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">How was the organization?</label>
                          <RatingStars
                            value={ratings[`organization-${event.eventId}`] || 0}
                            onChange={(v) => setRatings((prev) => ({ ...prev, [`organization-${event.eventId}`]: v }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Overall rating</label>
                          <RatingStars
                            value={ratings[`overall-${event.eventId}`] || 0}
                            onChange={(v) => setRatings((prev) => ({ ...prev, [`overall-${event.eventId}`]: v }))}
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="text-sm font-medium text-foreground mb-2 block">Comments (optional)</label>
                        <textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Share your experience..."
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                          rows={3}
                        />
                      </div>

                      {error && (
                        <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                          <AlertCircle className="h-3.5 w-3.5" /> {error}
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full"
                        disabled={submitting}
                        onClick={() => handleSubmit(event.eventId)}
                      >
                        {submitting ? "Submitting..." : "Submit Review"}
                        <Star className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-foreground">Why Feedback Matters</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your honest feedback helps event organizers improve future events and helps fellow students
              make informed decisions. Reviews are anonymous when shared publicly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
