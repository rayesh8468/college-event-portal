import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getDaysUntil(date: string | Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getEventStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    upcoming: "Upcoming",
    ongoing: "Ongoing",
    completed: "Completed",
    cancelled: "Cancelled",
    pending: "Pending",
    confirmed: "Confirmed",
    waitlisted: "Waitlisted",
    rejected: "Rejected",
  };
  return labels[status] || status;
}

export function getEventStatusColor(status: string): string {
  const colors: Record<string, string> = {
    upcoming: "bg-blue-100 text-blue-700",
    ongoing: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    waitlisted: "bg-orange-100 text-orange-700",
    rejected: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    Students: "bg-blue-500",
    DeptHeads: "bg-purple-500",
    SuperAdmins: "bg-red-500",
  };
  return colors[role] || "bg-gray-500";
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Technical: "bg-cyan-100 text-cyan-700",
    Cultural: "bg-pink-100 text-pink-700",
    Sports: "bg-orange-100 text-orange-700",
    Social: "bg-green-100 text-green-700",
    Academic: "bg-indigo-100 text-indigo-700",
  };
  return colors[category] || "bg-gray-100 text-gray-600";
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Technical: "code",
    Cultural: "palette",
    Sports: "trophy",
    Social: "heart",
    Academic: "book-open",
  };
  return icons[category] || "calendar";
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function generateId(prefix: string, length = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = prefix + "-";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
