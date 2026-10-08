"use client";

import { useState, useEffect } from "react";
import { FileText, Check, X, Loader2, Shield, Award, Calendar, User, Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

export function CertificateVerifyContent() {
  const [certificateId, setCertificateId] = useState("");
  const [certificate, setCertificate] = useState<any>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateId.trim()) {
      setError("Please enter a certificate ID");
      return;
    }

    setLoading(true);
    setError("");
    setCertificate(null);
    setVerified(null);

    try {
      const res = await fetch("/api/certificates", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      // Try to get certificate by ID — we'll use the query approach
      // Since the API uses eventId/userId filters, we'll check via a direct lookup
      // For public verification, we use the certificate ID directly

      const verifyRes = await fetch(`/api/certificates/verify/${encodeURIComponent(certificateId)}`);
      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        if (verifyRes.status === 404) {
          setVerified(false);
          setError("Certificate not found");
        } else {
          setError(data.error || "Verification failed");
        }
        return;
      }

      const data = await verifyRes.json();
      setCertificate(data.certificate);
      setVerified(true);
    } catch (err) {
      setError("Failed to verify certificate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Header */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border-b border-border">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Award className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">VIT Event Portal</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Certificate Verification</h1>
          <p className="mt-3 text-muted-foreground">
            Verify the authenticity of a digital certificate issued by VIT Event Portal
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" />
              Secure verification
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              Unique certificate IDs
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-primary" />
              Publicly verifiable
            </span>
          </div>
        </div>
      </div>

      {/* Verification Form */}
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-6">
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label
                  htmlFor="cert-id"
                  className="text-sm font-medium text-foreground block mb-1.5"
                >
                  Certificate ID
                </label>
                <Input
                  id="cert-id"
                  value={certificateId}
                  onChange={(e) => {
                    setCertificateId(e.target.value.toUpperCase());
                    setError("");
                  }}
                  placeholder="e.g., CERT-2025-CSE-00001"
                  className="font-mono text-sm w-full"
                  autoComplete="off"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the certificate ID found on the certificate
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  <X className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !certificateId.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Verify Certificate
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Example IDs */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Example: CERT-2025-CSE-00001
        </p>
      </div>

      {/* Result */}
      {certificate && verified !== null && (
        <div className="mx-auto max-w-2xl px-4 pb-16">
          <Card
            className={cn(
              "border-2 transition-all",
              verified
                ? "border-green-200 bg-green-50/50"
                : "border-red-200 bg-red-50/50"
            )}
          >
            <CardContent className="p-6">
              {verified ? (
                /* Verified — Valid Certificate */
                <div className="space-y-5">
                  {/* Valid badge */}
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold text-green-700">Valid Certificate</h2>
                      <p className="text-sm text-green-600">This certificate is authentic and verified</p>
                    </div>
                  </div>

                  {/* Certificate details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Recipient</p>
                      <p className="font-medium text-foreground">{certificate.userName}</p>
                      {certificate.userRollNumber && (
                        <p className="text-xs text-muted-foreground">{certificate.userRollNumber}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Certificate ID</p>
                      <p className="font-medium font-mono text-foreground">{certificate.certificateId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Event</p>
                      <p className="font-medium text-foreground">{certificate.eventType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Role</p>
                      <Badge className="mt-1 text-xs capitalize">{certificate.role}</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Date</p>
                      <p className="font-medium text-foreground">
                        {certificate.date ? formatDate(certificate.date) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Issued On</p>
                      <p className="font-medium text-foreground">
                        {certificate.issuedOn ? formatDate(certificate.issuedOn) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Issued By</p>
                      <p className="font-medium text-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {certificate.issuedBy}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Duration</p>
                      <p className="font-medium text-foreground">{certificate.duration || "—"}</p>
                    </div>
                  </div>

                  {/* Public verification URL */}
                  {certificate.verificationUrl && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1.5">Verification URL</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono break-all text-foreground">
                          {typeof window !== "undefined" ? window.location.origin : ""}
                          {certificate.verificationUrl}
                        </code>
                      </div>
                    </div>
                  )}

                  {/* Footer note */}
                  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                    <p>
                      This certificate was issued by VIT Event Portal. The certificate ID{" "}
                      <span className="font-mono font-medium text-foreground">{certificate.certificateId}</span>{" "}
                      can be used to verify its authenticity at any time.
                    </p>
                  </div>
                </div>
              ) : (
                /* Invalid — Certificate Not Found */
                <div className="text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
                    <X className="h-7 w-7 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-red-700">Certificate Not Found</h2>
                  <p className="mt-2 text-sm text-red-600">
                    No certificate exists with the ID "{certificateId}"
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Please check the certificate ID and try again
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification timestamp */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Verified on {new Date().toLocaleString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
