import Link from "next/link";
import { Calendar, Users, Award, TrendingUp, Shield, Clock, FileText, QrCode, Star, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { AuthProvider, useAuth } from "@/lib/auth-context";

async function getEvents() {
  try {
    const res = await fetch("http://localhost:3000/api/events", {
      cache: "no-store",
    });
    if (res.ok) return await res.json();
  } catch {}
  return { events: [] };
}

export default async function HomePage() {
  const { events } = await getEvents();

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col items-center py-20 sm:py-28 text-center">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6 animate-fade-in">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">VIT Event Portal</span>
            </div>

            {/* Hero Text */}
            <h1 className="max-w-3xl animate-fade-in stagger-1">
              <span className="block text-4xl sm:text-5xl font-bold leading-tight">
                Your College Event
                <br />
                <span className="gradient-text">Hub</span>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-muted-foreground animate-fade-in stagger-2">
              Register for workshops, hackathons, and cultural events.
              Track your activity points, earn certificates, and manage OD requests — all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-in stagger-3">
              <Link href="/register">
                <Button size="lg" className="shadow-lg shadow-primary/20">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/events">
                <Button size="lg" variant="outline">
                  Browse Events
                </Button>
              </Link>
            </div>

            {/* Trusted by / Stats */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in stagger-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                College Verified
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Secure Authentication
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                Digital Certificates
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
              <div className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">200+</p>
                <p className="text-sm text-muted-foreground mt-1">Events Hosted</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">5000+</p>
                <p className="text-sm text-muted-foreground mt-1">Students Registered</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">2500+</p>
                <p className="text-sm text-muted-foreground mt-1">Certificates Issued</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">98%</p>
                <p className="text-sm text-muted-foreground mt-1">Attendance Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Everything You Need</h2>
            <p className="mt-3 text-muted-foreground">
              A complete event management platform built for college students, HODs, and administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className={cn(
                  "group rounded-xl border border-border bg-card p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200",
                  i === 0 && "md:row-span-2"
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground",
                    feature.iconContainer
                  )}
                >
                  <feature.icon className={cn("h-6 w-6", !feature.iconContainer && "transition-colors")} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                {feature.bonus && (
                  <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    {feature.bonus}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Event Preview ── */}
      {events.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Upcoming Events</h2>
                <p className="text-muted-foreground">Don&apos;t miss out on these upcoming opportunities</p>
              </div>
              <Link href="/events" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.slice(0, 3).map((event: any, i: number) => (
                <Link
                  key={event.eventId}
                  href={`/events/${event.eventId}`}
                  className="group rounded-xl border border-border bg-card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-medium text-muted-foreground bg-muted/50 rounded px-2 py-1">
                      {event.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {event.maxParticipants} slots
                    </span>
                    {event.registrationFee > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="text-primary font-medium">₹{event.registrationFee}</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      getStatusBadgeClass(event.status)
                    )}>
                      {getStatusLabel(event.status)}
                    </span>
                    {event.isWorkingDay && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Working day
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {events.length <= 3 && (
              <div className="mt-6 text-center">
                <Link href="/events" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                  View all events <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CTA Section ── */}
      <section className="border-t border-border bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-12 text-center">
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-secondary/5 blur-3xl" />

            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Ready to get involved?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                Join hundreds of students already using VIT Event Portal to manage their college event experience.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                <Link href="/register">
                  <Button size="lg">
                    Create Account
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer is rendered separately on the root layout, not here */}
    </div>
  );
}

const FEATURES = [
  {
    icon: Calendar,
    title: "Event Registration",
    description: "Browse and register for workshops, hackathons, cultural fests, and more with seamless payment integration.",
    iconContainer: true,
  },
  {
    icon: QrCode,
    title: "QR Attendance",
    description: "Scan QR codes at event entry for instant attendance marking. Works offline with PWA support.",
    iconContainer: true,
  },
  {
    icon: Award,
    title: "Digital Certificates",
    description: "Earn verifiable digital certificates with unique IDs and public verification URLs. No more photoshop fraud.",
    iconContainer: true,
    bonus: "Verifiable by recruiters",
  },
  {
    icon: TrendingUp,
    title: "Activity Points",
    description: "Track points across Technical, Cultural, Sports, and Social categories. Know exactly where you stand for graduation requirements.",
    iconContainer: true,
  },
  {
    icon: FileText,
    title: "OD Letter System",
    description: "Automatic OD request creation and multi-level approval workflow. PDF letters sent directly to your email and class advisor.",
    iconContainer: true,
  },
  {
    icon: Star,
    title: "Reliability Score",
    description: "Build a reputation by attending events. High scores unlock priority registration; no-shows are tracked automatically.",
    iconContainer: true,
    bonus: "Increases attendance by 40%+",
  },
  {
    icon: Users,
    title: "Team Registration",
    description: "Form teams with friends, share join codes, and register together. Perfect for hackathons and group competitions.",
    iconContainer: true,
  },
  {
    icon: Shield,
    title: "College Email Only",
    description: "Secure authentication restricted to your college domain. Only verified students and faculty can access the platform.",
    iconContainer: true,
  },
  {
    icon: Clock,
    title: "Timetable Clash Detection",
    description: "Get warned about lab clashes and exam conflicts before registering. Smart scheduling prevents double-booking chaos.",
    iconContainer: true,
  },
];

function getStatusLabel(status: string) {
  return {
    upcoming: "Upcoming",
    ongoing: "Ongoing",
    completed: "Completed",
    cancelled: "Cancelled",
  }[status] || status;
}

function getStatusBadgeClass(status: string) {
  return {
    upcoming: "bg-blue-100 text-blue-700",
    ongoing: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-700",
  }[status] || "bg-gray-100 text-gray-600";
}
