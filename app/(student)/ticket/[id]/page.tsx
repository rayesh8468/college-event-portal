"use client";

import { notFound } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatDateTime, getCategoryColor, cn } from "@/lib/utils";
import { Calendar, MapPin, Clock, Users, QrCode, Ticket, CheckCircle, Building2 } from "lucide-react";
import Link from "next/link";
import { Suspense, useState, useEffect } from "react";

interface TicketData {
  registrationId: string;
  eventId: string;
  userId: string;
  status: string;
  registeredAt: string;
  event: {
    eventId: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    venue: string;
    category: string;
    eventType: string;
    maxParticipants: number;
    confirmedCount?: number;
    departmentCode: string;
    organizerUserId: string;
    requiresOD: boolean;
    isWorkingDay: boolean;
    teamSize: { min: number; max: number } | null;
  };
  teamCode?: string;
  teamRole?: string;
}

async function fetchTicket(registrationId: string, userId: string): Promise<TicketData | null> {
  try {
    const res = await fetch(`/api/my-registrations?userId=${userId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const regs = (data.registrations || []) as TicketData[];
    const reg = regs.find((r) => r.registrationId === registrationId);
    if (!reg) return null;

    // Fetch full event details
    const eventRes = await fetch(`/api/events/${reg.eventId}`, { cache: "no-store" });
    if (!eventRes.ok) return reg as TicketData;
    const eventData = await eventRes.json();
    return { ...reg, event: eventData.event };
  } catch {
    return null;
  }
}

function TicketDisplay({ ticket }: { ticket: TicketData }) {
  const { user } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrData = JSON.stringify({
          registrationId: ticket.registrationId,
          eventId: ticket.eventId,
          userId: ticket.userId,
        });
        const res = await fetch("/api/qr-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: qrData }),
        });
        if (res.ok) {
          const data = await res.json();
          setQrCodeUrl(data.url);
        }
      } catch {}
      setLoading(false);
    };
    generateQR();
  }, [ticket]);

  const isConfirmed = ticket.status === "confirmed";
  const daysUntil = Math.ceil(
    (new Date(ticket.event.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/my-registrations"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <Ticket className="h-4 w-4" />
          Back to My Registrations
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Your Ticket</h1>
        <p className="text-muted-foreground mt-1">Show this QR code at the event entry</p>
      </div>

      {/* Status alert */}
      {!isConfirmed && (
        <Card className="border-yellow-200 bg-yellow-50/30 mb-6">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle className="h-5 w-5 text-yellow-600" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Registration Pending</p>
              <p className="text-yellow-700">
                Your registration is pending. Please complete payment if applicable.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ticket card */}
      <Card className="overflow-hidden mb-6">
        {/* Gradient header */}
        <div className="h-2 bg-gradient-to-r from-primary via-primary/70 to-secondary" />

        <CardContent className="p-6">
          {/* Event title */}
          <div className="text-center mb-6">
            <Badge className={cn(getCategoryColor(ticket.event.category).split(" ")[0])}>
              {ticket.event.category}
            </Badge>
            <h2 className="mt-3 text-xl font-bold text-foreground">{ticket.event.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{ticket.event.eventType}</p>
          </div>

          {/* Attendee info */}
          <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-muted/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">
              {user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name || "Attendee"}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
            </div>
          </div>

          {/* Event details */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Date</p>
                <p className="font-medium text-foreground">{formatDate(ticket.event.startDate)}</p>
                {ticket.event.startDate !== ticket.event.endDate && (
                  <p className="text-muted-foreground text-xs">to {formatDate(ticket.event.endDate)}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Time</p>
                <p className="font-medium text-foreground">
                  {formatDateTime(ticket.event.startTime)} - {formatDateTime(ticket.event.endTime)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Venue</p>
                <p className="font-medium text-foreground">{ticket.event.venue}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Seats</p>
                <p className="font-medium text-foreground">
                  {ticket.event.confirmedCount || 0} / {ticket.event.maxParticipants} filled
                </p>
              </div>
            </div>
          </div>

          {/* Team info */}
          {ticket.teamCode && (
            <div className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 text-sm mb-1">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">Team Code</span>
              </div>
              <p className="text-lg font-bold text-foreground font-mono tracking-wider">
                {ticket.teamCode}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Role: {ticket.teamRole === "leader" ? "Team Leader" : "Team Member"}
              </p>
            </div>
          )}

          {/* Registration ID */}
          <div className="text-center mb-6">
            <p className="text-xs text-muted-foreground mb-1">Registration ID</p>
            <p className="text-sm font-mono text-foreground">{ticket.registrationId}</p>
          </div>

          {/* QR Code */}
          {loading ? (
            <div className="flex justify-center">
              <div className="w-48 h-48 rounded-lg bg-muted animate-pulse" />
            </div>
          ) : qrCodeUrl ? (
            <div className="flex flex-col items-center">
              <img
                src={qrCodeUrl}
                alt="QR Code for ticket validation"
                className="w-48 h-48 p-2 border-4 border-border rounded-lg bg-white shadow-lg"
              />
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Scan this QR code at the event entry
              </p>
              {daysUntil > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Event starts in {daysUntil} day{daysUntil !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-48 h-48 rounded-lg bg-muted flex items-center justify-center">
                <QrCode className="h-16 w-16 text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Verify link */}
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground mb-2">Verify this ticket</p>
            <Link
              href={`/verify/${ticket.registrationId}`}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Verify Registration <QrCode className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardContent>

        {/* Footer stripe */}
        <div className="h-1 bg-gradient-to-r from-secondary via-secondary/70 to-primary" />
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/my-registrations">
          <Button variant="outline">Back to Registrations</Button>
        </Link>
        {isConfirmed && (
          <Link href="/events">
            <Button>Find More Events</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="animate-pulse h-8 w-48 bg-muted rounded mb-8" />
        <div className="w-48 h-48 mx-auto rounded-lg bg-muted animate-pulse" />
      </div>
    }>
      <TicketPageInner paramsPromise={params} />
    </Suspense>
  );
}

async function TicketPageInner({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="animate-pulse h-8 w-48 bg-muted rounded mb-8" />
        <div className="w-48 h-48 mx-auto rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!user) {
    notFound();
  }

  const ticket = await fetchTicket(id, user.id);

  if (!ticket) {
    notFound();
  }

  return <TicketDisplay ticket={ticket} />;
}
