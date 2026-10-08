"use client";

"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { formatDate, formatDateTime, formatCurrency, cn } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  Shield,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface EventData {
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
  confirmedCount: number;
  registrationFee: number;
  departmentCode: string;
  teamSize: { min: number; max: number } | null;
  requiresOD: boolean;
  isWorkingDay: boolean;
  pointsAwarded: {
    participant?: number;
    volunteer?: number;
  };
  status: string;
}

interface RegistrationData {
  registrationId: string;
  eventId: string;
  status: string;
  registeredAt: string;
  paymentStatus?: string;
  amountPaid?: number;
  paymentId?: string;
  odRequestId?: string;
  event: {
    eventId: string;
    title: string;
    registrationFee: number;
  };
}

async function fetchEvent(eventId: string): Promise<EventData | null> {
  try {
    const res = await fetch(`/api/events/${eventId}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.event as EventData;
  } catch {
    return null;
  }
}

async function registerForEvent(eventId: string, userId: string): Promise<{
  success: boolean;
  registration?: RegistrationData;
  error?: string;
}> {
  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, userId }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || "Registration failed" };
    }

    return {
      success: true,
      registration: data.registration,
    };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

async function createPaymentOrder(registrationId: string, amount: number): Promise<{
  orderId?: string;
  error?: string;
}> {
  try {
    const res = await fetch("/api/payment/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationId,
        amount: amount * 100,
        currency: "INR",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Failed to create payment order" };
    }
    return { orderId: data.orderId };
  } catch {
    return { error: "Network error while creating payment order" };
  }
}

async function confirmRegistration(registrationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const res = await fetch("/api/register/[id]", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || "Failed to confirm registration" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export default function RegisterPage({ params }: PageProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [event, setEvent] = useState<EventData | null>(null);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"form" | "processing" | "done">("form");
  const [confirmed, setConfirmed] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");

  useEffect(() => {
    let isMounted = true;

    params.then(({ id }) => {
      if (!isMounted) return;
      setLoading(true);
      fetchEvent(id).then((e) => {
        if (isMounted) {
          setEvent(e);
          setLoading(false);
        }
      });
    });

    return () => {
      isMounted = false;
    };
  }, [params]);

  const handleRegister = useCallback(async () => {
    if (!user || !event) return;
    if (!user.id) {
      setError("Unable to identify your account. Please sign in again.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const result = await registerForEvent(event.eventId, user.id);

    setIsProcessing(false);

    if (!result.success) {
      setError(result.error || "Registration failed");
      return;
    }

    setRegistration(result.registration ?? null);
    setSuccess(true);

    if (event.registrationFee === 0) {
      setPaymentStep("done");
      setConfirmed(true);
    } else {
      setPaymentStep("form");
    }
  }, [user, event]);

  const handlePayment = useCallback(async () => {
    if (!registration || !event) return;
    if (!user || !user.id) {
      setError("Unable to identify your account. Please sign in again.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setPaymentStep("processing");

    try {
      const result = await createPaymentOrder(
        registration.registrationId,
        event.registrationFee
      );

      if (result.error) {
        setError(result.error);
        setPaymentStep("form");
        return;
      }

      await new Promise((r) => setTimeout(r, 2000));

      const confirmResult = await confirmRegistration(registration.registrationId);

      if (confirmResult.success) {
        setPaymentStep("done");
        setConfirmed(true);
      } else {
        setError(confirmResult.error || "Payment confirmation failed");
        setPaymentStep("form");
      }
    } catch {
      setError("Payment processing failed. Please try again.");
      setPaymentStep("form");
    } finally {
      setIsProcessing(false);
    }
  }, [registration, event, user]);

  const daysUntil = event
    ? Math.ceil((new Date(event.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  if (loading || authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse h-8 w-48 bg-muted rounded mb-8" />
        <div className="space-y-4">
          <Card className="skeleton"><CardContent className="p-6" /></Card>
          <Card className="skeleton"><CardContent className="p-6" /></Card>
        </div>
      </div>
    );
  }

  if (!event) {
    notFound();
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Please sign in</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You need to be signed in to register for events.
            </p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAlreadyRegistered = registration?.status === "confirmed";
  const isPending = registration?.status === "pending" && event.registrationFee > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      <div className="mb-6">
        <Badge className={cn(
          "mb-3",
          event.category === "Technical" && "bg-cyan-100 text-cyan-700",
          event.category === "Cultural" && "bg-pink-100 text-pink-700",
          event.category === "Sports" && "bg-orange-100 text-orange-700",
          event.category === "Social" && "bg-green-100 text-green-700",
          event.category === "Academic" && "bg-indigo-100 text-indigo-700"
        )}>
          {event.category}
        </Badge>
        <h1 className="text-2xl font-bold text-foreground">Register for {event.title}</h1>
        <p className="text-muted-foreground mt-1">
          {event.eventType} - {formatDate(event.startDate)}
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(event.startDate)} - {formatDate(event.endDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatDateTime(event.startTime)} - {formatDateTime(event.endTime)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {event.venue}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {event.confirmedCount} / {event.maxParticipants} registered
            </span>
          </div>

          {event.teamSize && (
            <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 mb-4 inline-flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">Team Registration</span>
              <span className="text-muted-foreground">({event.teamSize.min}-{event.teamSize.max} members)</span>
            </div>
          )}

          {event.requiresOD && (
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/50 mb-4 inline-flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-amber-700">OD Request Required</span>
              <span className="text-muted-foreground">- Working day event</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Registration Details</CardTitle>
          <CardDescription>
            {event.registrationFee > 0
              ? `Registration fee: ${formatCurrency(event.registrationFee)}`
              : "Free registration - no payment required"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.pointsAwarded.participant && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Activity Points Earned</p>
                <p className="text-xs text-green-700">
                  +{event.pointsAwarded.participant} points for participation
                  {event.pointsAwarded.volunteer && ` - +${event.pointsAwarded.volunteer} for volunteering`}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {paymentStep === "form" && !success && event.registrationFee > 0 && (
            <div className="space-y-4 p-4 rounded-lg border border-dashed border-border bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CreditCard className="h-4 w-4" />
                Payment Information
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nameOnCard" className="text-sm font-medium text-foreground">
                    Name on Card
                  </label>
                  <Input
                    id="nameOnCard"
                    type="text"
                    placeholder="Your full name"
                    value={nameOnCard}
                    onChange={(e) => setNameOnCard(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Demo Mode</p>
                <p>In demo mode, payment is simulated. In production, Razorpay secure payment gateway will be used.</p>
              </div>
            </div>
          )}

          {paymentStep === "processing" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {event.registrationFee > 0 ? "Processing payment..." : "Completing registration..."}
              </p>
            </div>
          )}

          {paymentStep === "done" && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Registration Complete!</p>
                <p className="text-sm text-green-700 mt-1">
                  {event.registrationFee > 0
                    ? "Your payment was successful. You are now registered for this event."
                    : "You are now registered for this event."}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
                  <span className="font-mono bg-green-100 px-2 py-0.5 rounded">
                    {registration?.registrationId}
                  </span>
                  <span>Registration ID</span>
                </div>
              </div>
            </div>
          )}

          {!success && (
            <Button
              size="lg"
              className="w-full"
              onClick={handleRegister}
              isLoading={isProcessing}
              disabled={!user}
            >
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
          )}

          {success && paymentStep === "form" && event.registrationFee > 0 && (
            <Button
              size="lg"
              className="w-full"
              variant="primary"
              onClick={handlePayment}
              isLoading={isProcessing}
            >
              <CreditCard className="h-4 w-4" />
              Pay {formatCurrency(event.registrationFee)} to Confirm
            </Button>
          )}

          {isAlreadyRegistered && registration && (
            <div className="text-center">
              <Badge variant="success" className="mb-2">
                <CheckCircle className="h-3 w-3" />
                Confirmed
              </Badge>
              <p className="text-sm text-muted-foreground">
                You are already registered for this event.
              </p>
              <Link
                href={`/ticket/${registration.registrationId}`}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                View your ticket
                <Users className="h-3 w-3" />
              </Link>
            </div>
          )}

          {isPending && (
            <div className="text-center">
              <Badge variant="warning" className="mb-2">
                <AlertCircle className="h-3 w-3" />
                Pending Payment
              </Badge>
              <p className="text-sm text-yellow-700">
                Awaiting payment confirmation. Please complete the payment below.
              </p>
            </div>
          )}

          {!success && (
            <p className="text-xs text-muted-foreground text-center">
              By registering, you agree to attend the event. No-shows may affect your reliability score.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mb-6">
        <span className="flex items-center gap-1">
          <Shield className="h-3.5 w-3.5" />
          Secure registration
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle className="h-3.5 w-3.5" />
          Instant confirmation
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {daysUntil > 0 ? `Event in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}` : "Event soon"}
        </span>
      </div>

      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>
    </div>
  );
}
