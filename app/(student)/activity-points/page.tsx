"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, cn } from "@/lib/utils";
import { Progress } from "@/components/ui/Progress";
import {
  Star,
  TrendingUp,
  Award,
  Trophy,
  Heart,
  Code,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

interface ActivityPoints {
  userId: string;
  totalPoints: number;
  requiredPoints: number;
  categories: {
    Technical: number;
    Cultural: number;
    Sports: number;
    Social: number;
    Leadership: number;
  };
  lastUpdated: string;
}

const CATEGORY_INFO: Record<
  string,
  { icon: typeof Code; label: string; color: string; bgColor: string }
> = {
  Technical: { icon: Code, label: "Technical", color: "text-cyan-600", bgColor: "bg-cyan-100" },
  Cultural: { icon: Heart, label: "Cultural", color: "text-pink-600", bgColor: "bg-pink-100" },
  Sports: { icon: Trophy, label: "Sports", color: "text-orange-600", bgColor: "bg-orange-100" },
  Social: { icon: Users, label: "Social", color: "text-green-600", bgColor: "bg-green-100" },
  Leadership: { icon: Star, label: "Leadership", color: "text-purple-600", bgColor: "bg-purple-100" },
};

async function fetchPoints(userId: string): Promise<ActivityPoints> {
  try {
    const res = await fetch(`/api/points?userId=${userId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed");
    return (await res.json()) as ActivityPoints;
  } catch {
    return {
      userId,
      totalPoints: 0,
      requiredPoints: 100,
      categories: { Technical: 0, Cultural: 0, Sports: 0, Social: 0, Leadership: 0 },
      lastUpdated: new Date().toISOString(),
    };
  }
}

export default function ActivityPointsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [points, setPoints] = useState<ActivityPoints | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      fetchPoints(user.id).then((data) => {
        setPoints(data);
        setLoading(false);
      });
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const progress = points ? Math.min(100, (points.totalPoints / points.requiredPoints) * 100) : 0;
  const isComplete = points ? points.totalPoints >= points.requiredPoints : false;

  const getGrade = (pct: number) => {
    if (pct >= 100) return { label: "Target Achieved!", color: "text-green-600", icon: CheckCircle };
    if (pct >= 75) return { label: "Almost there!", color: "text-blue-600", icon: Target };
    if (pct >= 50) return { label: "Good progress", color: "text-yellow-600", icon: TrendingUp };
    if (pct >= 25) return { label: "Keep going!", color: "text-orange-600", icon: Award };
    return { label: "Start earning!", color: "text-muted-foreground", icon: Star };
  };

  const grade = getGrade(progress);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Activity Points</h1>
        <p className="text-muted-foreground mt-1">Track your points across all categories</p>
      </div>

      {authLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="skeleton">
              <CardContent className="p-6" />
            </Card>
          ))}
        </div>
      ) : !user ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Not signed in</h3>
            <p className="text-sm text-muted-foreground">Sign in to view your points</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card className="skeleton">
          <CardContent className="p-6" />
        </Card>
      ) : points ? (
        <div className="space-y-6">
          {/* Progress card */}
          <Card className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="text-4xl font-bold text-foreground">{points.totalPoints}</p>
                  <p className="text-sm text-muted-foreground">out of {points.requiredPoints} required</p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full text-2xl",
                      isComplete
                        ? "bg-green-100 text-green-600"
                        : progress >= 50
                        ? "bg-blue-100 text-blue-600"
                        : "bg-muted"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Target className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <p className={cn("text-lg font-semibold", grade.color)}>{grade.label}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>{Math.round(progress)}%</span>
                  <span>{points.requiredPoints}</span>
                </div>
              </div>

              {isComplete && (
                <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
                  <Award className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Target Achieved!</p>
                    <p className="text-xs text-green-700">
                      You have earned the required {points.requiredPoints} activity points.
                    </p>
                  </div>
                </div>
              )}

              {!isComplete && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {points.requiredPoints - points.totalPoints} more points needed
                    </p>
                    <p className="text-xs text-yellow-700">
                      Participate in more events to reach your target.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Points by Category</CardTitle>
              <CardDescription>
                Points earned in each activity category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                  const catPoints = points.categories[key as keyof typeof points.categories] || 0;
                  const catPct = points.requiredPoints > 0
                    ? Math.min(100, (catPoints / points.requiredPoints) * 100)
                    : 0;
                  const Icon = info.icon;

                  return (
                    <div
                      key={key}
                      className="rounded-lg border p-4 hover:shadow-sm transition-shadow"
                      style={{
                        borderColor:
                          catPoints > 0
                            ? info.color.replace("text-", "border-").replace("600", "200")
                            : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn("flex items-center gap-2", info.bgColor)}>
                          <Icon className={cn("h-4 w-4", info.color)} />
                          <span className="text-sm font-medium text-foreground">{info.label}</span>
                        </div>
                        <span className="text-lg font-bold text-foreground">{catPoints}</span>
                      </div>
                      <div className="space-y-1">
                        <Progress
                          value={catPct}
                          className="h-2"
                          style={{
                            backgroundColor:
                              catPoints > 0
                                ? info.color.replace("text-", "bg-").replace("600", "200")
                                : undefined,
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          {catPct.toFixed(0)}% of target
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>About Activity Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Activity points help track your participation in college events. Different event types
                award points in different categories:
              </p>
              <ul className="space-y-2 pl-4 list-disc">
                <li><span className="text-cyan-600 font-medium">Technical</span> — Workshops, hackathons, coding events</li>
                <li><span className="text-pink-600 font-medium">Cultural</span> — Cultural fests, dance, music, drama</li>
                <li><span className="text-orange-600 font-medium">Sports</span> — Sports meets, tournaments, fitness events</li>
                <li><span className="text-green-600 font-medium">Social</span> — Social campaigns, volunteering, NCC/NSS</li>
                <li><span className="text-purple-600 font-medium">Leadership</span> — Organizing events, leading teams</li>
              </ul>
              <p className="text-xs">
                Most universities require 100 activity points for graduation. Check with your department
                for specific requirements.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
