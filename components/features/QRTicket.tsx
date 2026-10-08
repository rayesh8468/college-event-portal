"use client";

import * as React from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export interface QRTicketProps {
  ticketId: string;
  eventTitle: string;
  eventId: string;
  userName: string;
  userRollNumber?: string;
  date?: string;
  time?: string;
  venue?: string;
  qrPayload?: string;
  onClick?: () => void;
  onQRClick?: () => void;
  showDownload?: boolean;
  className?: string;
}

export function QRTicket({
  ticketId,
  eventTitle,
  eventId,
  userName,
  userRollNumber,
  date,
  time,
  venue,
  qrPayload,
  onClick,
  onQRClick,
  showDownload = false,
  className,
}: QRTicketProps) {
  const payload = qrPayload ?? `TICKET:${ticketId}:${eventId}`;
  const [qrSvg, setQrSvg] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const svg = await QRCode.toString(payload, {
          type: "svg",
          width: 220,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
        if (!cancelled) setQrSvg(svg);
      } catch {
        // fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [payload]);

  const handleClick = () => {
    onClick?.();
    onQRClick?.();
  };

  return (
    <Card
      className={cn(
        "border-2 border-dashed border-border bg-card overflow-hidden",
        onClick ? "cursor-pointer hover:border-primary/50 transition-colors" : "",
        className
      )}
      onClick={onClick}
    >
      <div className="bg-primary/10 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TicketHeaderIcon className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">VIT Event Portal</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{ticketId}</span>
      </div>

      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex-shrink-0 w-full sm:w-40">
            {loading ? (
              <div className="w-40 h-40 mx-auto rounded-lg bg-muted flex items-center justify-center">
                <LoaderIcon className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : qrSvg ? (
              <div
                className="w-40 h-40 mx-auto rounded-lg bg-white p-1 shadow-sm"
                onClick={handleClick}
                role={onQRClick ? "button" : undefined}
                tabIndex={onQRClick ? 0 : undefined}
              >
                <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              </div>
            ) : (
              <div className="w-40 h-40 mx-auto rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                QR unavailable
              </div>
            )}

            {showDownload && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadQRSvg(qrSvg);
                }}
                disabled={!qrSvg}
              >
                <DownloadIcon className="h-3.5 w-3.5 mr-1" />
                Download QR
              </Button>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground line-clamp-1">{eventTitle}</h3>
            <div className="my-3 border-t border-border" />

            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Attendee</p>
                <p className="font-medium text-foreground">{userName}</p>
                {userRollNumber && (
                  <p className="text-xs text-muted-foreground font-mono">{userRollNumber}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs">Date</p>
                <p className="font-medium text-foreground">{date || "—"}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Time</p>
                <p className="font-medium text-foreground">{time || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Venue</p>
                <p className="font-medium text-foreground">{venue || "—"}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <ScanIcon className="h-3.5 w-3.5" />
              Show this ticket at the event for QR attendance
            </p>
          </div>
        </div>
      </CardContent>

      <div className="bg-muted/30 px-5 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Ticket #{ticketId}</span>
        <span>{eventId}</span>
      </div>
    </Card>
  );
}

function downloadQRSvg(svg: string) {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vit-qr-ticket.svg";
  a.click();
  URL.revokeObjectURL(url);
}

function TicketHeaderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="3" y1="9" x2="21" y2="9" />
    </svg>
  );
}
