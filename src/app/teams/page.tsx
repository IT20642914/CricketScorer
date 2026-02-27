"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Team {
  _id: string;
  teamName: string;
  playerIds: string[];
}

interface TeamStats {
  matchCount: number;
  winCount: number;
}

interface Player {
  _id: string;
  fullName: string;
  shortName?: string;
}

const addTeamSchema = z.object({
  teamName: z.string().min(1, "Team name required"),
  playerIds: z.array(z.string()),
});
type AddTeamFormData = z.infer<typeof addTeamSchema>;

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, TeamStats>>({});
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addError, setAddError] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerDropdownOpen, setPlayerDropdownOpen] = useState(false);

  const loadTeams = useCallback(() => {
    return fetch("/api/teams")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTeams(data);
          setLoading(false);
          return data as Team[];
        }
        setLoading(false);
        return [] as Team[];
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

  useEffect(() => {
    setLoading(true);
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (showAddDialog) {
      fetch("/api/players?light=1")
        .then((r) => r.json())
        .then((d) => (Array.isArray(d) ? setPlayers(d) : setPlayers([])));
    }
  }, [showAddDialog]);

  const { register, handleSubmit, setValue, watch, reset } = useForm<AddTeamFormData>({
    resolver: zodResolver(addTeamSchema),
    defaultValues: { teamName: "", playerIds: [] },
  });
  const playerIds = watch("playerIds") ?? [];

  function addPlayer(pid: string) {
    if (!pid || playerIds.includes(pid)) return;
    setValue("playerIds", [...playerIds, pid]);
    setPlayerSearch("");
    setPlayerDropdownOpen(false);
  }

  function removePlayer(pid: string) {
    setValue(
      "playerIds",
      playerIds.filter((x) => x !== pid)
    );
  }

  const availableToAdd = players.filter((p) => !playerIds.includes(p._id));
  const searchLower = playerSearch.trim().toLowerCase();
  const filteredPlayers =
    searchLower === ""
      ? availableToAdd
      : availableToAdd.filter(
          (p) =>
            p.fullName.toLowerCase().includes(searchLower) ||
            (p.shortName?.toLowerCase().includes(searchLower) ?? false)
        );

  const playersInTeam = playerIds
    .map((pid) => players.find((p) => p._id === pid))
    .filter(Boolean) as Player[];

  async function onAddTeam(data: AddTeamFormData) {
    setAddError("");
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setAddError("Failed to create team");
      return;
    }
    setShowAddDialog(false);
    reset({ teamName: "", playerIds: [] });
    setPlayerSearch("");
    setPlayerDropdownOpen(false);
    loadTeams();
  }

  function handleCloseAddDialog(open: boolean) {
    if (!open) {
      setShowAddDialog(false);
      setAddError("");
      reset({ teamName: "", playerIds: [] });
      setPlayerSearch("");
      setPlayerDropdownOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="page-header">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2" asChild>
          <Link href="/">←</Link>
        </Button>
        <h1 className="text-xl font-bold flex-1 text-center">Teams</h1>
        <div className="w-10" />
      </header>
      <main className="p-4 max-w-3xl mx-auto">
        <div className="flex justify-end mb-4">
          <Button
            size="default"
            className="h-11 bg-cricket-green text-white hover:bg-cricket-green/90 border border-cricket-green shadow-sm font-medium px-4"
            onClick={() => setShowAddDialog(true)}
          >
            Create
          </Button>
        </div>
        {loading ? (
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
                  <tr className="border-b border-border/80">
                    <td className="py-3 px-4 text-muted-foreground">Loading…</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">Loading…</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">Loading…</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">Loading…</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        ) : teams.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-2">No teams yet</p>
              <Button
                variant="link"
                className="text-primary p-0 h-auto"
                onClick={() => setShowAddDialog(true)}
              >
                Create your first team →
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

      <Dialog open={showAddDialog} onOpenChange={handleCloseAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add team</DialogTitle>
            <DialogDescription>Create a new team and add players.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAddTeam)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-teamName">Team name *</Label>
              <Input
                id="add-teamName"
                {...register("teamName")}
                placeholder="e.g. Tigers XI"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Players</Label>
              <div className="relative">
                <Input
                  placeholder="Type to search and select player..."
                  value={playerSearch}
                  onChange={(e) => {
                    setPlayerSearch(e.target.value);
                    setPlayerDropdownOpen(true);
                  }}
                  onFocus={() => setPlayerDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setPlayerDropdownOpen(false), 150)}
                  className="h-11 pr-9"
                />
                {playerDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-48 overflow-auto">
                    {filteredPlayers.length === 0 ? (
                      <div className="py-3 px-3 text-sm text-muted-foreground">
                        {availableToAdd.length === 0 ? "All players added" : "No matches"}
                      </div>
                    ) : (
                      filteredPlayers.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          className="w-full cursor-pointer text-left px-3 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none rounded-sm"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addPlayer(p._id);
                          }}
                        >
                          {p.fullName}
                          {p.shortName ? ` (${p.shortName})` : ""}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="overflow-x-auto rounded-md border border-input">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground">Player</th>
                      <th className="w-20 text-right py-2.5 px-3 font-semibold text-foreground">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playersInTeam.map((p) => (
                      <tr key={p._id} className="border-b border-border/80">
                        <td className="py-2.5 px-3">{p.fullName}</td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive"
                            onClick={() => removePlayer(p._id)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {playersInTeam.length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-4 px-3 text-center text-muted-foreground">
                          No players yet. Type above to add.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {addError && (
              <p className="text-sm text-destructive bg-destructive/10 py-2 px-3 rounded-md">{addError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleCloseAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-cricket-green text-white hover:bg-cricket-green/90">
                Create Team
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
