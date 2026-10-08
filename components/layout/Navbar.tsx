"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Calendar,
  Menu,
  X,
  User,
  LogOut,
  Building2,
  Ticket,
  Star,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  {
    label: "Events",
    href: "/events",
    icon: Calendar,
    roles: ["Students", "DeptHeads", "SuperAdmins"],
  },
  {
    label: "My Registrations",
    href: "/my-registrations",
    icon: Ticket,
    roles: ["Students"],
  },
  {
    label: "Activity Points",
    href: "/activity-points",
    icon: Star,
    roles: ["Students"],
  },
  {
    label: "OD Requests",
    href: "/od-requests",
    icon: FileText,
    roles: ["Students"],
  },
  {
    label: "Certificates",
    href: "/certificates",
    icon: FileText,
    roles: ["Students"],
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    icon: User,
    roles: ["Students"],
  },
  {
    label: "Teams",
    href: "/teams",
    icon: Building2,
    roles: ["Students"],
  },
];

const HEADER_LINKS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Calendar,
    roles: ["DeptHeads", "SuperAdmins"],
  },
  {
    label: "Events",
    href: "/events",
    icon: Calendar,
    roles: ["DeptHeads", "SuperAdmins"],
  },
  {
    label: "Participants",
    href: "/participants",
    icon: User,
    roles: ["DeptHeads", "SuperAdmins"],
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: Ticket,
    roles: ["DeptHeads", "SuperAdmins"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileText,
    roles: ["DeptHeads", "SuperAdmins"],
  },
  {
    label: "Announcements",
    href: "/announcements",
    icon: FileText,
    roles: ["DeptHeads", "SuperAdmins"],
  },
  {
    label: "Users",
    href: "/users",
    icon: User,
    roles: ["SuperAdmins"],
  },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const relevantLinks =
    user?.role === "Students"
      ? NAV_LINKS
      : user?.role === "DeptHeads" || user?.role === "SuperAdmins"
      ? HEADER_LINKS
      : [];

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-foreground">VIT Event Portal</span>
              <span className="ml-2 text-xs text-muted-foreground">College Events</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {relevantLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-card py-1 shadow-lg animate-fade-in">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href={`/profile`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted/50"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <nav className="px-4 py-3 space-y-1">
            {relevantLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
