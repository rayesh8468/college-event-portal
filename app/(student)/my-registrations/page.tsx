"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, getEventStatusLabel, getEventStatusColor, formatCurrency, cn } from "@/lib/utils";
import { Calendar, Ticket, CheckCircle, Clock, X, AlertCircle, Users, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Registration {
  registrationId: string;
  eventId: string;
  status: string;
  registeredAt: string;
  paymentStatus?: string;
  amountPaid?: number;
  event?: {
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
    teamSize?: { min: number; max: number } | null;
  };
}

async function fetchRegistrations(userId: string): Promise<Registration[]> {
  try {
    const res = await fetch(`/api/my-registrations?userId=${userId}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.registrations || []) as Registration[];
  } catch {
    return [];
  }
}

export default function MyRegistrationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      fetchRegistrations(user.id).then((data) => {
        setRegistrations(data);
        setLoading(false);
      });
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const confirmed = registrations.filter((r) => r.status === "confirmed");
  const pending = registrations.filter((r) => r.status === "pending");
  const cancelled = registrations.filter((r) => r.status === "cancelled" || r.status === "rejected");
  const waitlisted = registrations.filter((r) => r.status === "waitlisted");

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">My Registrations</h1>
        <p className="text-muted-foreground mt-1">View and manage your event registrations</p>
      </div>

      {authLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="skeleton">
              <CardContent className="p-6" />
            </Card>
          ))}
        </div>
      ) : !user ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Not signed in</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to view your registrations
            </p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      ) : registrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No registrations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You haven&apos;t registered for any events yet.
            </p>
            <Link href="/events">
              <Button>Browse Events</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-green-50/30 border-green-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{confirmed.length}</p>
                  <p className="text-xs text-green-600">Confirmed</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50/30 border-yellow-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{pending.length}</p>
                  <p className="text-xs text-yellow-600">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50/30 border-orange-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-700">{waitlisted.length}</p>
                  <p className="text-xs text-orange-600">Waitlisted</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50/30 border-red-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                  <X className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{cancelled.length}</p>
                  <p className="text-xs text-red-600">Cancelled</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending registrations — with link to complete registration */}
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Pending Payment
                <span className="text-sm font-normal text-muted-foreground">({pending.length})</span>
              </h2>
              <div className="space-y-3">
                {pending.map((reg) => {
                  const event = reg.event;
                  return (
                    <Card key={reg.registrationId} className="border-yellow-200/50">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/events/${event?.eventId || reg.eventId}`}
                              className="text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                            >
                              {event?.title || "Event"}
                            </Link>
                            {event && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="warning">Pending</Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
                          {event && (
                            <>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(event.startDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.confirmedCount || 0} / {event.maxParticipants} going
                              </span>
                              {event.registrationFee !== undefined && event.registrationFee > 0 && (
                                <span className="flex items-center gap-1 text-primary font-medium">
                                  {formatCurrency(event.registrationFee)}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {event && event.registrationFee !== undefined && event.registrationFee > 0 ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2 flex-1">
                              <Clock className="h-3.5 w-3.5" />
                              Awaiting payment confirmation
                            </div>
                            <Link href={`/register/${event.eventId}`}>
                              <Button size="sm" className="flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5" />
                                Complete Registration
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No payment required. Check your email for confirmation.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Confirmed registrations */}
          {confirmed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Confirmed
                <span className="text-sm font-normal text-muted-foreground">({confirmed.length})</span>
              </h2>
              <div className="space-y-3">
                {confirmed.map((reg) => {
                  const event = reg.event;
                  return (
                    <Card
                      key={reg.registrationId}
                      className={cn(
                        "hover:shadow-md transition-shadow",
                        "border-green-200/50"
                      )}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/events/${event?.eventId || reg.eventId}`}
                              className="text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                            >
                              {event?.title || "Event"}
                            </Link>
                            {event && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="success">Confirmed</Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          {event && (
                            <>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(event.startDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.confirmedCount || 0} / {event.maxParticipants} going
                              </span>
                              {event.registrationFee > 0 && (
                                <span className="flex items-center gap-1 text-primary font-medium">
                                  {formatCurrency(event.registrationFee)}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-xs text-green-700">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Payment confirmed
                        </div>

                        {event && event.registrationFee !== undefined && event.registrationFee > 0 && (
                          <Link href={`/ticket/${reg.registrationId}`} className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                            View QR Ticket <Ticket className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Waitlisted */}
          {waitlisted.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Waitlisted
                <span className="text-sm font-normal text-muted-foreground">({waitlisted.length})</span>
              </h2>
              <div className="space-y-3">
                {waitlisted.map((reg) => {
                  const event = reg.event;
                  return (
                    <Card key={reg.registrationId} className="opacity-80">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <Badge variant="outline" className="border-orange-300 text-orange-700">
                              Waitlisted
                            </Badge>
                            <Link
                              href={`/events/${event?.eventId}`}
                              className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                            >
                              {event?.title || "Event"}
                            </Link>
                            {event?.startDate && (
                              <span className="text-xs text-muted-foreground">
                                {formatDate(event.startDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Cancelled / rejected */}
          {cancelled.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <X className="h-5 w-5 text-red-500" />
                Cancelled / Rejected
                <span className="text-sm font-normal text-muted-foreground">({cancelled.length})</span>
              </h2>
              <div className="space-y-3">
                {cancelled.map((reg) => {
                  const event = reg.event;
                  const isCancelled = reg.status === "cancelled";
                  return (
                    <Card key={reg.registrationId} className="opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <Badge variant="destructive">
                              {isCancelled ? "Cancelled" : "Rejected"}
                            </Badge>
                            <Link
                              href={`/events/${event?.eventId}`}
                              className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                            >
                              {event?.title || "Event"}
                            </Link>
                            {event?.startDate && (
                              <span className="text-xs text-muted-foreground">
                                {formatDate(event.startDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
