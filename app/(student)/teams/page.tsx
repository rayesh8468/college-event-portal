"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, cn } from "@/lib/utils";
import { Building2, Users, UserPlus, CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface TeamMember {
  userId: string;
  userName: string;
  rollNumber?: string;
  departmentCode: string;
  year: string;
  role: "leader" | "member";
  joinedAt: string;
}

interface Team {
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

async function fetchTeams(userId: string): Promise<Team[]> {
  try {
    const res = await fetch(`/api/teams?userId=${userId}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.teams || []) as Team[];
  } catch {
    return [];
  }
}

export default function TeamsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      fetchTeams(user.id).then((data) => {
        setTeams(data);
        setLoading(false);
      });
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const myTeams = teams.filter((t) => t.leaderUserId === user?.id);
  const forming = teams.filter((t) => t.status === "forming");
  const active = teams.filter((t) => t.status === "ready" || t.status === "registered");

  const getStatus = (status: string) => {
    switch (status) {
      case "forming": return { label: "Forming", color: "bg-yellow-100 text-yellow-700", icon: Clock };
      case "ready": return { label: "Ready", color: "bg-blue-100 text-blue-700", icon: Users };
      case "registered": return { label: "Registered", color: "bg-green-100 text-green-700", icon: CheckCircle };
      case "completed": return { label: "Completed", color: "bg-gray-100 text-gray-600", icon: CheckCircle };
      default: return { label: status, color: "bg-gray-100 text-gray-600", icon: AlertCircle };
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">My Teams</h1>
        <p className="text-muted-foreground mt-1">Manage your event teams and team members</p>
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
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Not signed in</h3>
            <p className="text-sm text-muted-foreground mb-4">Sign in to manage your teams</p>
            <a href="/login" className="inline-block"><Button>Sign In</Button></a>
          </CardContent>
        </Card>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No teams yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Teams are created when you register for events that require team participation.
              Register for a team event to create your first team!
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
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{myTeams.length}</p>
                  <p className="text-xs text-blue-600">My Teams</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50/30 border-yellow-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{forming.length}</p>
                  <p className="text-xs text-yellow-600">Forming</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50/30 border-green-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{active.length}</p>
                  <p className="text-xs text-green-600">Active</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {loading ? (
              <Card className="skeleton"><CardContent className="p-6" /></Card>
            ) : myTeams.map((team) => (
              <TeamCard key={team.teamId} team={team} getStatus={getStatus} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-foreground">How Teams Work</h3>
            <p className="text-sm text-muted-foreground mt-1">
              For team events, you create a team and invite members. Team leaders can add members who register
              for the same event. Each team gets a unique team code. Minimum and maximum team sizes are set
              by the event organizer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamCard({ team, getStatus }: { team: Team; getStatus: (s: string) => { label: string; color: string; icon: typeof Clock } }) {
  const status = getStatus(team.status);
  const StatusIcon = status.icon;

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-secondary" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn(status.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {team.teamCode}
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground truncate">{team.eventTitle}</h3>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>{team.members.length} / {team.maxSize} members</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate">Leader: {team.leaderName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">Created {formatDate(team.createdAt)}</span>
          </div>
          {team.registeredAt && (
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="text-xs text-green-600">Registered</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {team.members.map((member) => (
            <div key={member.userId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                {member.userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{member.userName}</p>
                <p className="text-xs text-muted-foreground">
                  {member.role === "leader" ? "Team Leader" : "Member"}
                  {member.rollNumber && ` (${member.rollNumber})`}
                </p>
              </div>
              {member.role === "leader" && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Leader</Badge>
              )}
            </div>
          ))}

          {team.status === "forming" && team.members.length < team.maxSize && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <span>
                {team.maxSize - team.members.length} more member
                {team.maxSize - team.members.length !== 1 ? "s" : ""} needed
              </span>
              <button className="ml-auto text-xs text-primary hover:underline font-medium">Invite Members</button>
            </div>
          )}
        </div>

        {team.status === "forming" && team.members.length >= team.maxSize && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            Team is full! Ready to register.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
