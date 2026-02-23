"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Team {
  _id: string;
  teamName: string;
  playerIds: string[];
}

interface TeamStats {
  matchCount: number;
  winCount: number;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, TeamStats>>({});
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTeams(data);
        setLoading(false);
        return Array.isArray(data) ? (data as Team[]) : [];
      })
      .then((list) => {
        if (list.length === 0) return;
        setStatsLoading(true);
        Promise.all(
          list.map((t) =>
            fetch(`/api/teams/${t._id}/stats`)
              .then((r) => r.json())
              .then((s) => ({ id: t._id, stats: s }))
              .catch(() => ({ id: t._id, stats: null }))
          )
        ).then((results) => {
          const next: Record<string, TeamStats> = {};
          results.forEach(({ id, stats }) => {
            if (stats && typeof stats.matchCount === "number") {
              next[id] = { matchCount: stats.matchCount, winCount: stats.winCount ?? 0 };
            }
          });
          setStatsMap(next);
          setStatsLoading(false);
        });
      });
  }, []);

  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="page-header">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2" asChild>
          <Link href="/">←</Link>
        </Button>
        <h1 className="text-xl font-bold flex-1 text-center">Teams</h1>
        <Button size="sm" className="bg-white text-primary hover:bg-white/90" asChild>
          <Link href="/teams/new">Add</Link>
        </Button>
      </header>
      <main className="p-4 max-w-3xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : teams.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-2">No teams yet</p>
              <Button variant="link" className="text-primary p-0 h-auto" asChild>
                <Link href="/teams/new">Create your first team →</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Team</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Players</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Matches</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => {
                    const stats = statsMap[t._id];
                    return (
                      <tr key={t._id} className="border-b border-border/80 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <Link href={`/teams/${t._id}`} className="font-medium text-foreground hover:underline">
                            {t.teamName}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">{t.playerIds?.length ?? 0}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{statsLoading && !stats ? "…" : (stats ? stats.matchCount : "—")}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{statsLoading && !stats ? "…" : (stats ? stats.winCount : "—")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
