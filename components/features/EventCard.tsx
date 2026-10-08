"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { cn, formatDate, getEventStatusLabel, getEventStatusColor, getCategoryColor } from "@/lib/utils";
import { EventCategory, EventType, EventStatus } from "@/lib/types";

export interface EventCardProps {
  eventId: string;
  title: string;
  description?: string;
  category?: EventCategory;
  eventType?: EventType;
  startDate?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  maxParticipants?: number;
  confirmedCount?: number;
  registrationFee?: number;
  status?: EventStatus;
  requiresOD?: boolean;
  isWorkingDay?: boolean;
  onClick?: () => void;
  className?: string;
}

export function EventCard({
  title,
  description,
  category,
  eventType,
  startDate,
  startTime,
  endTime,
  venue,
  maxParticipants,
  confirmedCount,
  registrationFee,
  status = "upcoming",
  requiresOD,
  isWorkingDay,
  onClick,
  className,
}: EventCardProps) {
  const statusLabel = getEventStatusLabel(status);
  const statusColor = getEventStatusColor(status);
  const isClickable = !!onClick;

  return (
    <Card
      className={cn(
        "group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5",
        isClickable && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {category && (
                <Badge className={cn("text-xs", getCategoryColor(category).split(" ")[0])}>
                  {category}
                </Badge>
              )}
              {eventType && (
                <Badge variant="outline" className="text-xs border-border">
                  {eventType}
                </Badge>
              )}
              <Badge className={cn("text-xs", statusColor)}>{statusLabel}</Badge>
              {requiresOD && (
                <Badge className="text-xs bg-amber-100 text-amber-700">OD Required</Badge>
              )}
              {isWorkingDay && (
                <Badge variant="outline" className="text-xs border-border">Working Day</Badge>
              )}
            </div>

            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {title}
            </h3>

            {description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-muted-foreground">
              {startDate && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {formatDate(startDate)}
                </span>
              )}
              {startTime && endTime && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {startTime} – {endTime}
                </span>
              )}
              {venue && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {venue}
                </span>
              )}
              {maxParticipants != null && confirmedCount != null && (
                <span className="flex items-center gap-1">
                  <UsersIcon className="h-3.5 w-3.5" />
                  {confirmedCount}/{maxParticipants} confirmed
                </span>
              )}
              {registrationFee != null && registrationFee > 0 && (
                <span className="flex items-center gap-1 text-primary font-medium">
                  ₹{registrationFee.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>

          {isClickable && (
            <div className="flex-shrink-0 flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          )}
        </div>

        {!isClickable && registrationFee != null && registrationFee > 0 && (
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Registration Fee</span>
            <span className="font-medium text-primary">₹{registrationFee.toLocaleString("en-IN")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-4" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
