import { NextRequest, NextResponse } from "next/server";
import { requireAuth, errorResponse, getOr404 } from "@/lib/api-helpers";

/**
 * POST /api/payment/create
 *   Creates a Razorpay order for payment.
 *   Body: { registrationId, amount, currency = "INR" }
 *   Returns: { orderId, amount, currency, receipt, name, description, image, razorpayOptions }
 *
 * In demo mode, returns a mock Razorpay order response.
 * In production, uses the Razorpay SDK to create a real order.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { registrationId, amount, currency = "INR" } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    if (demoMode) {
      // Mock Razorpay order response for demo mode
      const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return NextResponse.json({
        orderId: mockOrderId,
        amount,
        currency,
        receipt: `rec_${mockOrderId}`,
        name: process.env.NEXT_PUBLIC_SITE_NAME || "VIT Event Portal",
        description: "Event Registration Payment",
        image: "/logo.png",
        // Options to pass to the frontend Razorpay popup
        razorpayOptions: {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_demo",
        },
      });
    }

    // Production implementation would use:
    // const Razorpay = await import("razorpay");
    // const razorpay = new Razorpay({ key_id, key_secret });
    // const order = await razorpay.orders.create({ amount, currency, receipt });
    // return NextResponse.json(order);

    return NextResponse.json({ error: "Payment not configured" }, { status: 501 });
  } catch (error) {
    console.error("POST /api/payment/create error:", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
