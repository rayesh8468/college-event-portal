"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";

interface EventDetail {
  eventId: string;
  title: string;
  registrationFee: number;
}

export function PaymentForm({
  eventId,
  event,
  existingPaymentId,
}: {
  eventId: string;
  event: EventDetail;
  existingPaymentId?: string;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState(existingPaymentId || "");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const handlePay = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!paymentId) {
      // Create payment order first
      setIsCreatingOrder(true);
      setError(null);

      try {
        const res = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registrationId: "",
            amount: event.registrationFee,
            currency: "INR",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to create payment order");
          setIsCreatingOrder(false);
          return;
        }

        setPaymentId(data.orderId || "");
        setIsCreatingOrder(false);
      } catch (err) {
        setError("An error occurred. Please try again.");
        setIsCreatingOrder(false);
        return;
      }
    }

    // Simulate payment (in demo mode, just confirm directly)
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Payment verification failed");
        setIsProcessing(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/events/${eventId}`);
      }, 2000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="space-y-4">
      {!paymentId && (
        <Button
          onClick={handlePay}
          disabled={isCreatingOrder || isProcessing}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {isCreatingOrder ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Order...
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay {formatCurrency(event.registrationFee)}
            </>
          )}
        </Button>
      )}

      {paymentId && !success && (
        <Button
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying Payment...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Payment
            </>
          )}
        </Button>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="font-medium text-green-700">Payment Successful!</p>
          <p className="text-sm text-green-600">Your registration is now confirmed.</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-4 w-4 text-red-600 mb-1" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!paymentId && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Demo mode: Payment is simulated. In production, this would redirect to Razorpay.
        </p>
      )}
    </div>
  );
}
