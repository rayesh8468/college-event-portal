// ── User & Auth ──────────────────────────────────────────────────────

export interface User {
  userId: string;
  email: string;
  name: string;
  departmentCode: string;
  role: "Students" | "DeptHeads" | "SuperAdmins";
  reliabilityScore?: number;
  createdAt?: string;
}

export interface Department {
  departmentCode: string;
  name: string;
  hodUserId?: string;
  active: boolean;
}

export type EventType =
  | "Workshop"
  | "Hackathon"
  | "Competition"
  | "Talk"
  | "Fest"
  | "Campaign"
  | "Seminar"
  | "Exhibition";

export type EventCategory =
  | "Technical"
  | "Cultural"
  | "Sports"
  | "Social"
  | "Academic";

export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface TeamSizeConfig {
  min: number;
  max: number;
  crossDeptAllowed: boolean;
  crossYearAllowed: boolean;
}

export interface Event {
  eventId: string;
  title: string;
  description: string;
  departmentCode: string;
  organizerUserId: string;
  category: EventCategory;
  eventType: EventType;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  maxParticipants: number;
  teamSize: TeamSizeConfig | null;
  registrationFee: number;
  status: EventStatus;
  pointsAwarded: {
    participant?: number;
    winner?: number;
    runnerUp?: number;
    volunteer?: number;
    organizer?: number;
  };
  requiresOD: boolean;
  createdBy: string;
  createdAt: string;
  isWorkingDay: boolean;
  participantCount?: number;
  confirmedCount?: number;
  cancelledCount?: number;
}

export type RegistrationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "waitlisted"
  | "rejected";

export interface Registration {
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  registeredAt: string;
  teamId?: string;
  teamCode?: string;
  teamRole?: "leader" | "member";
  paymentId?: string;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  amountPaid?: number;
  odRequestId?: string;
  notes?: string;
}

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

export interface Payment {
  paymentId: string;
  registrationId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: string;
  updatedAt: string;
}

export type CertificateType =
  | "participant"
  | "winner"
  | "runnerUp"
  | "volunteer"
  | "organizer"
  | "_points"
  | "best_poster"
  | "best_presentation";

export interface Certificate {
  certificateId: string;
  userId: string;
  eventId: string;
  userName: string;
  userRollNumber?: string;
  eventType: string;
  role: CertificateType;
  date: string;
  duration?: string;
  issuedBy: string;
  issuedOn: string;
  verificationUrl: string;
  pdfUrl?: string;
  isPublic: boolean;
}

export type ODStatus = "pending" | "approved" | "rejected" | "auto_revoked";

export interface ODRequest {
  odRequestId: string;
  userId: string;
  userName: string;
  userRollNumber?: string;
  eventId: string;
  eventTitle: string;
  departmentCode: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  status: ODStatus;
  referenceNumber: string;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  classAdvisorNotified: boolean;
  pdfUrl?: string;
  attendanceVerified?: boolean;
}

export type PointCategory =
  | "Technical"
  | "Cultural"
  | "Sports"
  | "Social"
  | "Leadership";

export interface ActivityPoints {
  userId: string;
  totalPoints: number;
  requiredPoints: number;
  categories: Record<PointCategory, number>;
  lastUpdated: string;
}

export interface Feedback {
  feedbackId: string;
  eventId: string;
  userId: string;
  userName: string;
  ratings: {
    content: number;
    venue: number;
    organization: number;
    overall: number;
  };
  comments?: string;
  submittedAt: string;
}

export type TeamMemberRole = "leader" | "member";

export interface TeamMember {
  userId: string;
  userName: string;
  rollNumber?: string;
  departmentCode: string;
  year: string;
  role: TeamMemberRole;
  joinedAt: string;
}

export interface Team {
  teamId: string;
  teamCode: string;
  eventId: string;
  eventTitle: string;
  leaderUserId: string;
  leaderName: string;
  leaderRollNumber?: string;
  status: "forming" | "ready" | "registered" | "completed";
  members: TeamMember[];
  minSize: number;
  maxSize: number;
  createdAt: string;
  registeredAt?: string;
}

export interface WaitlistEntry {
  waitlistId: string;
  eventId: string;
  userId: string;
  userName: string;
  departmentCode: string;
  createdAt: string;
  position: number;
  status: "waiting" | "promoted" | "expired";
}

export interface Announcement {
  announcementId: string;
  title: string;
  content: string;
  authorUserId: string;
  authorName: string;
  departmentCode?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  expiresAt?: string;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  icon?: string;
  trend?: "up" | "down";
  color?: string;
}
