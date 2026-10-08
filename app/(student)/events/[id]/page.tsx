import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { Calendar, MapPin, Users, Clock, ArrowLeft, CheckCircle, AlertCircle, CreditCard, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { formatDate, formatDateTime, formatCurrency, getEventStatusLabel, getEventStatusColor, getCategoryColor, cn } from "@/lib/utils";
import { EventType, EventCategory, TeamSizeConfig } from "@/lib/types";
import { RegisterButton } from "@/components/events/RegisterButton";

interface EventDetail {
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
  teamSize: TeamSizeConfig | null;
  registrationFee: number;
  status: string;
  pointsAwarded: {
    participant?: number;
    winner?: number;
    volunteer?: number;
    organizer?: number;
  };
  requiresOD: boolean;
  isWorkingDay: boolean;
  participantCount?: number;
  confirmedCount?: number;
  createdAt: string;
}

interface RegistrationData {
  registrationId: string;
  eventId: string;
  status: string;
  registeredAt: string;
  paymentStatus?: string;
  amountPaid?: number;
  teamId?: string;
  teamCode?: string;
  teamRole?: string;
  odRequestId?: string;
  paymentId?: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchEvent(id: string): Promise<EventDetail | null> {
  try {
    const host = (await headers()).get("host") || "localhost:3000";
    const res = await fetch(`http://${host}/api/events/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.event as EventDetail;
  } catch {
    return null;
  }
}

async function checkRegistration(eventId: string, userId: string): Promise<RegistrationData | null> {
  try {
    const res = await fetch(`/api/my-registrations?eventId=${eventId}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const regs = (data.registrations || []) as RegistrationData[];
    return regs.find((r) => r.eventId === eventId) || null;
  } catch {
    return null;
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await fetchEvent(id);

  if (!event) {
    notFound();
  }

  // Check registration status for authenticated user
  let registration: RegistrationData | null = null;
  try {
    const { cookies } = await import("next/headers");
    const authCookie = (await cookies()).get("auth_token");
    if (authCookie) {
      const payload = JSON.parse(atob(authCookie.value.split(".")[1]));
      registration = await checkRegistration(event.eventId, payload.sub || payload.userId);
    }
  } catch {
    // If we can't decode, registration stays null
  }

  const isTeamEvent = event.teamSize !== null;
  const alreadyRegistered = registration !== null;
  const canRegister = event.status === "upcoming" && !alreadyRegistered;
  const isRegisteredPending = registration?.status === "pending";
  const isRegisteredConfirmed = registration?.status === "confirmed";
  const daysUntil = Math.ceil(
    (new Date(event.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      {/* Header */}
      <div className="mb-6">
        <Badge className={cn("mb-3", getCategoryColor(event.category).split(" ")[0])}>
          {event.category}
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{event.title}</h1>
        <p className="text-muted-foreground mt-2">
          {event.eventType} • {getEventStatusLabel(event.status)}
        </p>
      </div>

      {/* Status & date info */}
      <div className="rounded-xl border p-4 mb-6 bg-card">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
            getEventStatusColor(event.status)
          )}>
            <CheckCircle className="h-3.5 w-3.5" />
            {getEventStatusLabel(event.status)}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formatDate(event.startDate)} - {formatDate(event.endDate)}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatDateTime(event.startTime)} - {formatDateTime(event.endTime)}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {event.venue}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4" />
            {event.confirmedCount || 0} / {event.maxParticipants} registered
          </span>
        </div>
        {daysUntil > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {daysUntil} day{daysUntil !== 1 ? "s" : ""} until event
          </p>
        )}
      </div>

      {/* Team badge */}
      {isTeamEvent && event.teamSize && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Building2 className="h-4 w-4" />
            Team Registration Required
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Team size: {event.teamSize.min} - {event.teamSize.max} members
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About this event</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </CardContent>
          </Card>

          {/* Points */}
          {event.pointsAwarded.participant && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Badge variant="success">+{event.pointsAwarded.participant} points</Badge>
                  <span className="text-sm text-muted-foreground">for participation</span>
                </div>
                {event.pointsAwarded.volunteer && (
                  <div className="mt-2 flex items-center gap-3">
                    <Badge variant="info">+{event.pointsAwarded.volunteer} points</Badge>
                    <span className="text-sm text-muted-foreground">for volunteering</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* OD Info */}
          {event.requiresOD && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="text-base text-amber-800">OD Request Required</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700">
                  This event is on a working day. An OD (On Duty) request will be created automatically
                  when you register. You will need your HOD's approval to attend.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Registration section — LINK to /register/[id] page */}
          {canRegister && (
            <Card>
              <CardHeader>
                <CardTitle>Register for this event</CardTitle>
                <CardDescription>
                  {event.registrationFee > 0
                    ? `Registration fee: ${formatCurrency(event.registrationFee)}`
                    : "Free registration"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/register/${event.eventId}`}>
                  <Button size="lg" className="w-full">
                    {event.registrationFee > 0 ? (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Register & Pay {formatCurrency(event.registrationFee)}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Register for Free
                      </>
                    )}
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  By registering, you agree to attend the event. No-shows may affect your reliability score.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Already registered: pending — link to register page to complete payment */}
          {isRegisteredPending && (
            <Card className="border-yellow-200 bg-yellow-50/30">
              <CardHeader>
                <CardTitle className="text-base text-yellow-800">Registration Pending</CardTitle>
                <CardDescription>Complete payment to confirm your registration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Awaiting payment</p>
                    <p className="text-sm text-yellow-700">
                      Your registration has been created but payment is not yet confirmed.
                    </p>
                  </div>
                </div>
                {event.registrationFee > 0 && (
                  <Link href={`/register/${event.eventId}`}>
                    <Button size="lg" className="w-full">
                      <CreditCard className="h-4 w-4" />
                      Complete Payment {formatCurrency(event.registrationFee)}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Already registered: confirmed */}
          {isRegisteredConfirmed && (
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="flex items-center gap-3 py-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Confirmed</p>
                  <p className="text-sm text-green-700">
                    You are registered for this event. Good luck!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed event */}
          {event.status === "completed" && (
            <Card className="border-gray-200 bg-muted/30">
              <CardContent className="flex items-center gap-3 py-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">This event has ended</p>
                  <p className="text-sm text-muted-foreground">
                    This event is no longer open for registration.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{event.eventType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Department</span>
                <span className="font-medium">{event.departmentCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slots</span>
                <span className="font-medium">{event.confirmedCount || 0} / {event.maxParticipants}</span>
              </div>
              {event.registrationFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="font-medium text-primary">{formatCurrency(event.registrationFee)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Points</span>
                <span className="font-medium text-green-600">+{event.pointsAwarded.participant || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">OD Required</span>
                <span className="font-medium">{event.requiresOD ? "Yes" : "No"}</span>
              </div>
              {isTeamEvent && event.teamSize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Size</span>
                  <span className="font-medium text-primary">{event.teamSize.min}-{event.teamSize.max}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">What&apos;s Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!alreadyRegistered ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <span>Register for the event</span>
                  </div>
                  {event.registrationFee > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                      <span>Complete payment to confirm</span>
                    </div>
                  )}
                  {event.requiresOD && (
                    <div className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                      <span>Get OD approval from your HOD</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                    <span>Attend the event and scan QR for attendance</span>
                  </div>
                </div>
              ) : isRegisteredConfirmed ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>You are registered</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span>Check your email for event updates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span>Attend on {formatDate(event.startDate)}</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Registration Button */}
      <RegisterButton eventId={event.eventId} event={event} registration={registration} />
    </div>
  );
}
