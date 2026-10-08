"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import { FileText, Award, Calendar, Download, CheckCircle, ExternalLink, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface Certificate {
  certificateId: string;
  userId: string;
  eventId: string;
  userName: string;
  userRollNumber?: string;
  eventType: string;
  role: string;
  date: string;
  duration?: string;
  issuedBy: string;
  issuedOn: string;
  verificationUrl: string;
  pdfUrl?: string;
  isPublic: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  participant: "bg-blue-100 text-blue-700",
  winner: "bg-yellow-100 text-yellow-700",
  runnerUp: "bg-orange-100 text-orange-700",
  volunteer: "bg-green-100 text-green-700",
  organizer: "bg-purple-100 text-purple-700",
  _points: "bg-indigo-100 text-indigo-700",
  best_poster: "bg-pink-100 text-pink-700",
  best_presentation: "bg-cyan-100 text-cyan-700",
};

async function fetchCertificates(userId: string): Promise<Certificate[]> {
  try {
    const res = await fetch(`/api/certificates?userId=${userId}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.certificates || []) as Certificate[];
  } catch {
    return [];
  }
}

export default function CertificatesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      fetchCertificates(user.id).then((data) => {
        setCertificates(data);
        setLoading(false);
      });
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const publicCerts = certificates.filter((c) => c.isPublic);
  const privateCerts = certificates.filter((c) => !c.isPublic);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
        <p className="text-muted-foreground mt-1">View and manage your event certificates</p>
      </div>

      {authLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="skeleton"><CardContent className="p-6" /></Card>
          ))}
        </div>
      ) : !user ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Not signed in</h3>
            <p className="text-sm text-muted-foreground mb-4">Sign in to view your certificates</p>
            <a href="/login" className="inline-block"><Button>Sign In</Button></a>
          </CardContent>
        </Card>
      ) : certificates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No certificates yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Certificates are issued when you participate in, volunteer at, or win events.
              Keep participating to earn more!
            </p>
            <a href="/events" className="inline-block"><Button>Browse Events</Button></a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-blue-50/30 border-blue-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <Award className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{certificates.length}</p>
                  <p className="text-xs text-blue-600">Total Certificates</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50/30 border-green-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{publicCerts.length}</p>
                  <p className="text-xs text-green-600">Public (Shareable)</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-50/30 border-gray-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-700">{privateCerts.length}</p>
                  <p className="text-xs text-gray-600">Private</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            {loading ? (
              <Card className="skeleton"><CardContent className="p-6" /></Card>
            ) : certificates.map((cert) => (
              <CertificateCard key={cert.certificateId} cert={cert} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-start gap-3">
          <Award className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-foreground">Certificate Verification</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Each certificate has a unique verification URL. Share your public certificates with employers
              or include them in your portfolio. Private certificates are visible only to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CertificateCard({ cert }: { cert: Certificate }) {
  const roleColor = ROLE_COLORS[cert.role] || "bg-gray-100 text-gray-700";

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-secondary" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn(roleColor)}>
                <Award className="h-3 w-3 mr-1" />
                {cert.role.replace(/_/g, " ")}
              </Badge>
              {cert.isPublic ? (
                <Badge variant="outline" className="border-green-300 text-green-700">
                  <ExternalLink className="h-3 w-3 mr-1" /> Public
                </Badge>
              ) : (
                <Badge variant="outline" className="border-gray-300 text-gray-600">
                  <Clock className="h-3 w-3 mr-1" /> Private
                </Badge>
              )}
            </div>
            <h3 className="text-base font-semibold text-foreground truncate">{cert.eventType}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {cert.userName}
              {cert.userRollNumber && ` (${cert.userRollNumber})`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{cert.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="text-xs">{cert.certificateId}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" />
            <span>Issued by {cert.issuedBy}</span>
          </div>
          {cert.duration && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{cert.duration}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground max-w-xs truncate">
            Verification: {cert.verificationUrl}
          </div>
          <div className="flex items-center gap-2">
            {cert.pdfUrl && (
              <a href={cert.pdfUrl} download className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                <Download className="h-3.5 w-3.5" /> Download PDF
              </a>
            )}
            <a href={cert.verificationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
              <ExternalLink className="h-3.5 w-3.5" /> Verify
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
