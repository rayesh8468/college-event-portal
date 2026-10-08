import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import { PaymentForm } from "@/components/events/PaymentForm";

interface EventDetail {
  eventId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  registrationFee: number;
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

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const { id } = await params;
  const { paymentId } = await searchParams;
  const event = await fetchEvent(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Event
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-2">Complete Payment</h1>
      <p className="text-muted-foreground mb-6">
        Complete your payment to confirm registration for {event.title}
      </p>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Payment Details</CardTitle>
          <CardDescription>Event: {event.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Event Date</p>
              <p className="font-medium">{formatDate(event.startDate)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-medium">{event.startTime} - {event.endTime}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Venue</p>
              <p className="font-medium">{event.venue}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Fee</p>
              <p className="font-medium text-primary text-lg">{formatCurrency(event.registrationFee)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground mb-2">Payment Summary</p>
            <div className="flex justify-between font-medium">
              <span>Registration Fee</span>
              <span>{formatCurrency(event.registrationFee)}</span>
            </div>
            <div className="border-t border-border my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(event.registrationFee)}</span>
            </div>
          </div>

          {paymentId && (
            <div className="rounded-lg border border-border bg-yellow-50 p-4">
              <p className="text-sm font-medium text-yellow-700 mb-2">Payment ID</p>
              <p className="font-mono text-sm">{paymentId}</p>
            </div>
          )}

          <PaymentForm eventId={id} event={event} existingPaymentId={paymentId} />
        </CardContent>
      </Card>
    </div>
  );
}
