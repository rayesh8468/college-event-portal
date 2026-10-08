"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Search,
  Filter,
  Check,
  X,
  Loader2,
  CreditCard,
  AlertCircle,
  Download,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Payment {
  paymentId: string;
  registrationId: string;
  userId: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
  createdAt: string;
  updatedAt: string;
  razorpayPaymentId?: string;
}

// ── Payment Row ────────────────────────────────────────────────────────────────

function PaymentRow({ payment, onRefund }: { payment: Payment; onRefund: (id: string) => void }) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-blue-100 text-blue-700",
    partially_refunded: "bg-purple-100 text-purple-700",
  };

  const statusLabels = {
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
    partially_refunded: "Partially Refunded",
  };

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 flex-shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {formatCurrency(payment.amount)}
                </p>
                <Badge className={cn("text-xs", statusColors[payment.status])}>
                  {statusLabels[payment.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span className="font-mono text-xs">{payment.paymentId}</span>
                <span className="text-muted-foreground">Reg: {payment.registrationId}</span>
                <span className="text-muted-foreground">User: {payment.userId}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Created: {formatDateTime(payment.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {payment.status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                className="text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => onRefund(payment.paymentId)}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Mark Paid
              </Button>
            )}
            {payment.status === "paid" && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-700 border-red-300 hover:bg-red-50"
                onClick={() => onRefund(payment.paymentId)}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Refund
              </Button>
            )}
            {payment.status === "failed" && (
              <Button
                variant="outline"
                size="sm"
                className="text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => onRefund(payment.paymentId)}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Refund Confirmation Modal ──────────────────────────────────────────────────

function RefundModal({
  open,
  onClose,
  onConfirm,
  payment,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payment?: Payment | null;
  isLoading: boolean;
}) {
  if (!open || !payment) return null;

  const isRefund = payment.status === "paid";
  const actionLabel = isRefund ? "Refund" : "Mark as Paid";

  return (
    <Modal open={open} onClose={onClose} title={isRefund ? "Refund Payment" : "Mark as Paid"} size="sm">
      <div className="space-y-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
          <p className="text-xs text-muted-foreground mt-1">Payment ID: {payment.paymentId}</p>
        </div>

        {isRefund ? (
          <p className="text-sm text-muted-foreground">
            This will refund the full amount of {formatCurrency(payment.amount)} to the user.
            This action cannot be undone.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            This will mark the pending payment of {formatCurrency(payment.amount)} as paid.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={isRefund ? "destructive" : "primary"}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isRefund ? "Refunding..." : "Processing..."}
              </>
            ) : (
              actionLabel
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────

function AdminPaymentsContent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundConfirm, setRefundConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/payments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status: newStatus }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update");
      }

      setPayments((prev) =>
        prev.map((p) => (p.paymentId === paymentId ? { ...p, status: newStatus as Payment["status"] } : p))
      );
      setRefundConfirm(false);
    } catch (err: any) {
      alert(err.message || "Failed to update payment");
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const paidCount = payments.filter((p) => p.status === "paid").length;
  const failedCount = payments.filter((p) => p.status === "failed").length;
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-purple-600" />
            Payments
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all payment transactions
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{paidCount}</p>
            <p className="text-xs text-green-600 mt-1">Paid</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50/50 border-yellow-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
            <p className="text-xs text-yellow-600 mt-1">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 border-red-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{failedCount}</p>
            <p className="text-xs text-red-600 mt-1">Failed</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{payments.length}</p>
            <p className="text-xs text-purple-600 mt-1">Total Transactions</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-blue-600 mt-1">Total Amount</p>
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
            placeholder="Search by payment ID..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="partially_refunded">Partially Refunded</option>
          </select>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="skeleton" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No payments found</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter ? "Try adjusting your status filter" : "No payment transactions yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <PaymentRow
              key={payment.paymentId}
              payment={payment}
              onRefund={(id) => {
                const p = payments.find((p) => p.paymentId === id);
                setSelectedPayment(p || null);
                setRefundConfirm(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination info */}
      {!loading && payments.length > 0 && (
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Showing {payments.length} transaction{payments.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Refund Modal */}
      <RefundModal
        open={refundConfirm}
        onClose={() => { setRefundConfirm(false); setSelectedPayment(null); }}
        onConfirm={() => {
          if (selectedPayment) {
            const newStatus = selectedPayment.status === "paid" ? "refunded"
              : selectedPayment.status === "pending" ? "paid"
              : "paid";
            handleStatusChange(selectedPayment.paymentId, newStatus);
          }
        }}
        payment={selectedPayment}
        isLoading={processing}
      />
    </div>
  );
}

export default function AdminPaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse text-lg font-medium">Loading payments...</div>
        </div>
      }
    >
      <AdminPaymentsContent />
    </Suspense>
  );
}
