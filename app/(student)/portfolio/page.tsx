"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { formatDate, cn } from "@/lib/utils";
import { Award, Star, Trophy, Heart, Code, Users, Target, Calendar, ExternalLink, Download, Plus, X, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface PortfolioItem {
  id: string;
  type: "certificate" | "event" | "achievement";
  title: string;
  description: string;
  date: string;
  category: string;
  points?: number;
  verificationUrl?: string;
  isPublic: boolean;
  icon?: string;
}

interface ActivityPoints {
  userId: string;
  totalPoints: number;
  requiredPoints: number;
  categories: Record<string, number>;
  lastUpdated: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Technical: "bg-cyan-100 text-cyan-700",
  Cultural: "bg-pink-100 text-pink-700",
  Sports: "bg-orange-100 text-orange-700",
  Social: "bg-green-100 text-green-700",
  Leadership: "bg-purple-100 text-purple-700",
};

async function fetchPortfolioData(userId: string): Promise<{ certificates: PortfolioItem[]; points: ActivityPoints }> {
  try {
    const [certsRes, pointsRes] = await Promise.all([
      fetch(`/api/certificates?userId=${userId}`, { cache: "no-store" }),
      fetch(`/api/points?userId=${userId}`, { cache: "no-store" }),
    ]);

    const certsData = await certsRes.json();
    const pointsData = await pointsRes.json();

    const certificates: PortfolioItem[] = (certsData.certificates || []).map((c: any) => ({
      id: c.certificateId,
      type: "certificate" as const,
      title: c.eventType,
      description: `Certificate for ${c.role.replace(/_/g, " ")} role`,
      date: c.date,
      category: c.role,
      points: 0,
      verificationUrl: c.verificationUrl,
      isPublic: c.isPublic,
      icon: "award",
    }));

    return { certificates, points: pointsData as ActivityPoints };
  } catch {
    return { certificates: [], points: { userId, totalPoints: 0, requiredPoints: 100, categories: {}, lastUpdated: new Date().toISOString() } };
  }
}

export default function PortfolioPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [points, setPoints] = useState<ActivityPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      fetchPortfolioData(user.id).then((data) => {
        setPortfolioItems(data.certificates);
        setPoints(data.points);
        setLoading(false);
      });
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const filteredItems = filter === "all"
    ? portfolioItems
    : portfolioItems.filter((item) => item.category === filter);

  const publicItems = portfolioItems.filter((item) => item.isPublic);
  const privateItems = portfolioItems.filter((item) => !item.isPublic);

  const progress = points ? Math.min(100, (points.totalPoints / points.requiredPoints) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
        <p className="text-muted-foreground mt-1">Showcase your achievements and certificates</p>
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
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Not signed in</h3>
            <p className="text-sm text-muted-foreground mb-4">Sign in to view your portfolio</p>
            <a href="/login" className="inline-block"><Button>Sign In</Button></a>
          </CardContent>
        </Card>
      ) : portfolioItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Your portfolio is empty</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Participate in events, earn certificates, and achieve milestones to build your portfolio.
              Your certificates and achievements will appear here automatically.
            </p>
            <a href="/events" className="inline-block"><Button>Browse Events</Button></a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-indigo-50/30 border-indigo-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                  <Star className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-700">{portfolioItems.length}</p>
                  <p className="text-xs text-indigo-600">Total Items</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50/30 border-green-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                  <ExternalLink className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{publicItems.length}</p>
                  <p className="text-xs text-green-600">Public</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-50/30 border-gray-200/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                  <Download className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-700">{privateItems.length}</p>
                  <p className="text-xs text-gray-600">Private</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Points summary */}
          {points && points.totalPoints > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Activity Points Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <p className="text-3xl font-bold text-foreground">{points.totalPoints}</p>
                    <p className="text-sm text-muted-foreground">out of {points.requiredPoints} required</p>
                  </div>
                  <div className="w-full sm:w-64">
                    <Progress value={progress} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{Math.round(progress)}%</span>
                      <span>{points.requiredPoints}</span>
                    </div>
                  </div>
                </div>

                {/* Category breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(points.categories).map(([category, catPoints]) => {
                    const colorClass = CATEGORY_COLORS[category] || "bg-gray-100 text-gray-700";
                    const Icon = category === "Technical" ? Code
                      : category === "Cultural" ? Heart
                      : category === "Sports" ? Trophy
                      : category === "Social" ? Users
                      : category === "Leadership" ? Star : Target;

                    return (
                      <div key={category} className="rounded-lg border p-3" style={{
                        borderColor: catPoints > 0 ? "rgba(99,102,241,0.3)" : undefined,
                      }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={cn("h-4 w-4", catPoints > 0 ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-medium text-foreground">{category}</span>
                        </div>
                        <p className="text-lg font-bold text-foreground">{catPoints}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {["all", "certificate", "event", "achievement"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg font-medium transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  f === "all" ? "capitalize" : f
                )}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>

          {/* Items list */}
          <div className="space-y-3">
            {loading ? (
              <Card className="skeleton"><CardContent className="p-6" /></Card>
            ) : filteredItems.map((item) => (
              <PortfolioItemCard key={item.id} item={item} />
            ))}
          </div>

          {filteredItems.length === 0 && filter !== "all" && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No {filter} items in your portfolio yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-start gap-3">
          <Star className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-foreground">Build Your Portfolio</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your portfolio automatically collects certificates and achievements from events you participate in.
              Share your public items on LinkedIn, resumes, or college applications. Use the visibility toggle
              on each item to control what is publicly visible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioItemCard({ item }: { item: PortfolioItem }) {
  const categoryColor = CATEGORY_COLORS[item.category] || "bg-gray-100 text-gray-700";

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-secondary" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn(categoryColor)}>
                <Award className="h-3 w-3 mr-1" />
                {item.category}
              </Badge>
              {item.isPublic ? (
                <Badge variant="outline" className="border-green-300 text-green-700">
                  <ExternalLink className="h-3 w-3 mr-1" /> Public
                </Badge>
              ) : (
                <Badge variant="outline" className="border-gray-300 text-gray-600">
                  <Clock className="h-3 w-3 mr-1" /> Private
                </Badge>
              )}
            </div>
            <h3 className="text-base font-semibold text-foreground truncate">{item.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(item.date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" />
            <span className="text-xs capitalize">{item.type}</span>
          </div>
          {item.points !== undefined && item.points > 0 && (
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" />
              <span className="text-xs">+{item.points} pts</span>
            </div>
          )}
          {item.verificationUrl && (
            <div className="flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="text-xs">Verifiable</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          {item.verificationUrl && (
            <a href={item.verificationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
              <ExternalLink className="h-3.5 w-3.5" /> View Certificate
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
