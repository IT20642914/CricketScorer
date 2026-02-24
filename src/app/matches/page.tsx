"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Match {
  _id: string;
  matchName: string;
  date: string;
  status: string;
  teamAId: string;
  teamBId: string;
  updatedAt?: string;
}

interface Team {
  _id: string;
  teamName: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "IN_PROGRESS" | "COMPLETED">("all");

  useEffect(() => {
    const q = filter === "all" ? "" : `?status=${filter}`;
    fetch(`/api/matches${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateB !== dateA) return dateB - dateA;
            const upA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const upB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return upB - upA;
          });
          setMatches(sorted);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const map: Record<string, Team> = {};
          data.forEach((t: Team) => { map[t._id] = t; });
          setTeams(map);
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="page-header">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2" asChild>
          <Link href="/">←</Link>
        </Button>
        <h1 className="text-xl font-bold flex-1 text-center">Match History</h1>
        <div className="w-10" />
      </header>
      <main className="p-4 max-w-lg mx-auto">
        <div className="flex justify-end mb-4">
          <Button
            size="default"
            className="h-11 bg-cricket-green text-white hover:bg-cricket-green/90 border border-cricket-green shadow-sm font-medium px-4"
            asChild
          >
            <Link href="/matches/new">New match</Link>
          </Button>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted p-1">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="IN_PROGRESS">Live</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : matches.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-2">No matches yet</p>
              <Button variant="link" className="text-primary p-0 h-auto" asChild>
                <Link href="/matches/new">Start a new match →</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {matches.map((m) => (
              <Card key={m._id} className="border-0 shadow-card">
                <Link
                  href={m.status === "IN_PROGRESS" ? `/matches/${m._id}/score` : `/matches/${m._id}/scorecard`}
                  className="block"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{m.matchName}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {teams[m.teamAId]?.teamName ?? "Team A"} vs {teams[m.teamBId]?.teamName ?? "Team B"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(m.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                          m.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {m.status === "IN_PROGRESS" ? "Live" : "Done"}
                      </span>
                    </div>
                  </CardContent>
                </Link>
                <div className="px-4 pb-4 pt-0 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    asChild
                  >
                    <Link href={`/matches/new?rematch=${m._id}`} onClick={(e) => e.stopPropagation()}>
                      Rematch
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
