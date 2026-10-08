"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Building2, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

interface ODRequest {
  odRequestId: string;
  userId: string;
  userName?: string;
  userRollNumber?: string;
  eventId: string;
  eventTitle: string;
  departmentCode: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  status: "pending" | "approved" | "rejected" | "auto_revoked";
  referenceNumber: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  classAdvisorNotified: boolean;
  attendanceVerified: boolean;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
  auto_revoked: { label: "Auto-Revoked", color: "bg-gray-100 text-gray-600", icon: AlertCircle },
};

async function fetchODRequests(userId: string): Promise<ODRequest[]> {
  try {
    const res = await fetch(`/api/od?userId=${userId}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.odRequests || []) as ODRequest[];
  } catch {
    return [];
  }
}

export default function ODRequestsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [odRequests, setODRequests] = useState<ODRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      fetchODRequests(user.id).then((data) => {
        setODRequests(data);
        setLoading(false);
      });
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const pending = odRequests.filter((r) => r.status === "pending");
  const approved = odRequests.filter((r) => r.status === "approved");
  const rejected = odRequests.filter((r) => r.status === "rejected" || r.status === "auto_revoked");

  const totalPointsRequired = 100;
  const totalPointsEarned = 0;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">OD Requests</h1>
        <p className="text-muted-foreground mt-1">On-Duty requests for attending events on working days</p>
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
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Not signed in</h3>
            <p className="text-sm text-muted-foreground mb-4">Sign in to view your OD requests</p>
            <a href="/login" className="inline-block">
              <Button>Sign In</Button>
            </a>
          </CardContent>
        </Card>
      ) : odRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No OD requests yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              OD requests are created automatically when you register for events on working days.
            </p>
            <a href="/events" className="inline-block">
              <Button>Browse Events</Button>
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-yellow-50/30 border-yellow-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{pending.length}</p>
                  <p className="text-xs text-yellow-600">Pending Approval</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50/30 border-green-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{approved.length}</p>
                  <p className="text-xs text-green-600">Approved</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50/30 border-red-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{rejected.length}</p>
                  <p className="text-xs text-red-600">Rejected / Revoked</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Activity Points Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Points earned</span>
                <span className="font-medium">{totalPointsEarned} / {totalPointsRequired}</span>
              </div>
              <Progress value={(totalPointsEarned / totalPointsRequired) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Earn {totalPointsRequired - totalPointsEarned} more points to reach the required threshold.
              </p>
            </CardContent>
          </Card>

          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Pending Approval
                <span className="text-sm font-normal text-muted-foreground">({pending.length})</span>
              </h2>
              <div className="space-y-3">
                {pending.map((od) => (
                  <ODRequestCard key={od.odRequestId} od={od} />
                ))}
              </div>
            </section>
          )}

          {approved.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Approved
                <span className="text-sm font-normal text-muted-foreground">({approved.length})</span>
              </h2>
              <div className="space-y-3">
                {approved.map((od) => (
                  <ODRequestCard key={od.odRequestId} od={od} />
                ))}
              </div>
            </section>
          )}

          {rejected.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Rejected / Revoked
                <span className="text-sm font-normal text-muted-foreground">({rejected.length})</span>
              </h2>
              <div className="space-y-3">
                {rejected.map((od) => (
                  <ODRequestCard key={od.odRequestId} od={od} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-foreground">What is an OD Request?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              An OD (On-Duty) request is required when you attend an event on a working day.
              Your HOD must approve the request for the class to be marked as attended.
              Requests are created automatically when you register for events that fall on working days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ODRequestCard({ od }: { od: ODRequest }) {
  const config = STATUS_CONFIG[od.status];
  const StatusIcon = config.icon;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn(config.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">{od.referenceNumber}</span>
            </div>
            <h3 className="text-base font-semibold text-foreground truncate">
              {od.eventTitle}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(od.startDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDateTime(od.startTime)} - {formatDateTime(od.endTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate">{od.venue}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="text-xs">{od.departmentCode}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="text-muted-foreground">Created: {formatDateTime(od.createdAt)}</div>
          {od.status === "approved" && od.approvedAt && (
            <div className="text-green-700">Approved: {formatDateTime(od.approvedAt)}</div>
          )}
          {od.status === "rejected" && od.rejectionReason && (
            <div className="text-red-700 max-w-xs truncate">Reason: {od.rejectionReason}</div>
          )}
        </div>

        {od.status === "pending" && (
          <div className="mt-3 flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5" />
            Awaiting HOD approval
          </div>
        )}

        {od.status === "approved" && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
            <CheckCircle className="h-3.5 w-3.5" />
            You can attend this event
          </div>
        )}
      </CardContent>
    </Card>
  );
}
