"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { Loader2, CreditCard, CheckCircle } from "lucide-react";

interface EventDetail {
  eventId: string;
  title: string;
  registrationFee: number;
}

interface RegistrationData {
  registrationId: string;
  eventId: string;
  status: string;
  paymentStatus?: string;
  paymentId?: string;
}

export function RegisterButton({
  eventId,
  event,
  registration,
}: {
  eventId: string;
  event: EventDetail;
  registration: RegistrationData | null;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      if (event.registrationFee > 0 && data.registration?.paymentStatus === "pending") {
        router.push(`/events/${eventId}/pay?paymentId=${data.registration.paymentId}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  if (authLoading) return null;

  const isPending = registration?.status === "pending";
  const isConfirmed = registration?.status === "confirmed";

  return (
    <Card className="border-primary/20 bg-primary/5 mt-6">
      <CardContent className="p-5">
        {isConfirmed ? (
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle className="h-6 w-6" />
            <div>
              <p className="font-medium">You are registered!</p>
              <p className="text-sm text-muted-foreground">
                {event.registrationFee === 0
                  ? "No payment required. Check your email for confirmation."
                  : "Payment confirmed. Check your email for event updates."}
              </p>
            </div>
          </div>
        ) : isPending ? (
          <div className="flex items-center gap-3 text-yellow-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div>
              <p className="font-medium">Registration Pending</p>
              <p className="text-sm text-muted-foreground">
                {event.registrationFee === 0
                  ? "Awaiting confirmation..."
                  : "Waiting for payment..."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {event.registrationFee > 0 ? "Register & Pay" : "Register for Event"}
                </p>
                {event.registrationFee > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(event.registrationFee)} fee
                  </p>
                )}
              </div>
              <Button
                onClick={handleRegister}
                disabled={isRegistering}
                className="bg-primary hover:bg-primary/90"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {event.registrationFee > 0 ? "Pay Now" : "Register"}
                    <CreditCard className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
