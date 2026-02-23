"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Player {
  _id: string;
  fullName: string;
  shortName?: string;
  email?: string;
  isKeeper?: boolean;
  stats?: {
    matchesPlayed: number;
    runs: number;
    strikeRate: number | null;
    wickets: number;
  };
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const loadPlayers = useCallback(() => {
    const params = new URLSearchParams();
    params.set("withStats", "1");
    if (search.trim()) params.set("search", search.trim());
    return fetch(`/api/players?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPlayers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    setLoading(true);
    loadPlayers();
  }, [loadPlayers]);

  async function removePlayer(id: string) {
    setRemoving(true);
    try {
      const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlayers((prev) => prev.filter((p) => p._id !== id));
        setRemoveId(null);
      }
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="page-header">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2" asChild>
          <Link href="/">←</Link>
        </Button>
        <h1 className="text-xl font-bold flex-1 text-center">Players</h1>
        <Button size="sm" className="bg-white text-primary hover:bg-white/90" asChild>
          <Link href="/players/new">Add</Link>
        </Button>
      </header>
      <main className="p-4 max-w-3xl mx-auto">
        <div className="relative mb-4">
          <Input
            type="search"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : players.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-2">No players yet</p>
              <Button variant="link" className="text-primary p-0 h-auto" asChild>
                <Link href="/players/new">Add your first player →</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Full name</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Short name</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Matches</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Runs</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">SR</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Wickets</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground hidden sm:table-cell">Email</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => {
                    const stats = p.stats;
                    return (
                      <tr key={p._id} className="border-b border-border/80 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <Link href={`/players/${p._id}`} className="font-medium text-foreground hover:underline">
                            {p.fullName}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{p.shortName ?? "—"}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{stats ? stats.matchesPlayed : "—"}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{stats ? stats.runs : "—"}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{stats?.strikeRate != null ? stats.strikeRate : "—"}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{stats ? stats.wickets : "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell truncate max-w-[180px]">{p.email ?? "—"}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" asChild>
                              <Link href={`/players/${p._id}/edit`}>Edit</Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive"
                              onClick={() => setRemoveId(p._id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>

      <Dialog open={!!removeId} onOpenChange={(open) => !open && setRemoveId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove player</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this player? This cannot be undone. They will be removed from any teams.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveId(null)} disabled={removing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => removeId && removePlayer(removeId)}
              disabled={removing}
            >
              {removing ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
