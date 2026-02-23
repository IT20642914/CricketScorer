"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Team } from "@/lib/types";
import { DEFAULT_RULES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Step = 1 | 2 | 3 | 4 | 5;

interface WizardState {
  teamAId: string;
  teamBId: string;
  teamA: Team | null;
  teamB: Team | null;
  playingXI_A: string[];
  playingXI_B: string[];
  rules: typeof DEFAULT_RULES;
  tossWinnerTeamId: string;
  tossDecision: "BAT" | "FIELD" | "";
  matchName: string;
  date: string;
}

interface Player {
  _id: string;
  fullName: string;
}

export default function NewMatchPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [playersMap, setPlayersMap] = useState<Record<string, string>>({});
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState<WizardState>({
    teamAId: "",
    teamBId: "",
    teamA: null,
    teamB: null,
    playingXI_A: [],
    playingXI_B: [],
    rules: { ...DEFAULT_RULES },
    tossWinnerTeamId: "",
    tossDecision: "",
    matchName: "",
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    fetch("/api/teams").then((r) => r.json()).then((d) => Array.isArray(d) && setTeams(d));
    fetch("/api/players").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) {
        const map: Record<string, string> = {};
        (d as Player[]).forEach((p) => { map[p._id] = p.fullName; });
        setPlayersMap(map);
      }
    });
  }, []);

  useEffect(() => {
    const t = teams.find((x) => x._id === state.teamAId);
    setState((s) => ({ ...s, teamA: t ?? null, playingXI_A: t ? (s.playingXI_A.filter((id) => (t.playerIds ?? []).includes(id))) : [] }));
  }, [state.teamAId, teams]);

  useEffect(() => {
    const t = teams.find((x) => x._id === state.teamBId);
    setState((s) => ({ ...s, teamB: t ?? null, playingXI_B: t ? (s.playingXI_B.filter((id) => (t.playerIds ?? []).includes(id))) : [] }));
  }, [state.teamBId, teams]);

  function togglePlayingXI(team: "A" | "B", playerId: string) {
    const key = team === "A" ? "playingXI_A" : "playingXI_B";
    const list = state[key];
    const next = list.includes(playerId)
      ? list.filter((id) => id !== playerId)
      : list.length < 11
        ? [...list, playerId]
        : list;
    setState((s) => ({ ...s, [key]: next }));
  }

  async function createAndStart() {
    setError("");
    setLoading(true);
    const battingTeamId = state.tossDecision === "BAT" ? state.tossWinnerTeamId : (state.tossWinnerTeamId === state.teamAId ? state.teamBId : state.teamAId);
    const bowlingTeamId = state.tossWinnerTeamId === state.teamAId ? state.teamBId : state.teamAId;
    const payload = {
      matchName: state.matchName || "Match",
      date: state.date,
      teamAId: state.teamAId,
      teamBId: state.teamBId,
      playingXI_A: state.playingXI_A,
      playingXI_B: state.playingXI_B,
      tossWinnerTeamId: state.tossWinnerTeamId,
      tossDecision: state.tossDecision,
      rulesConfig: state.rules,
      status: "IN_PROGRESS",
      innings: [
        { battingTeamId, bowlingTeamId, events: [] },
      ],
    };
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error?.message ?? "Failed to create match");
        setLoading(false);
        return;
      }
      const match = await res.json();
      router.push(`/matches/${match._id}/score`);
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  const teamA = state.teamA;
  const teamB = state.teamB;
  const canNext =
    (step === 1 && state.teamAId && state.teamBId && state.teamAId !== state.teamBId) ||
    (step === 2 && state.playingXI_A.length >= 1 && state.playingXI_B.length >= 1) ||
    (step === 3 && true) ||
    (step === 4 && state.tossWinnerTeamId && state.tossDecision) ||
    step === 5;

  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="page-header">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2" asChild>
          <Link href="/matches">←</Link>
        </Button>
        <h1 className="text-xl font-bold flex-1 text-center">New Match — Step {step}/5</h1>
        <div className="w-10" />
      </header>
      <main className="p-4 max-w-lg mx-auto space-y-4">
        <Card>
          <CardContent className="p-5 pt-6 space-y-4">
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="matchName">Match name</Label>
              <Input
                id="matchName"
                value={state.matchName}
                onChange={(e) => setState((s) => ({ ...s, matchName: e.target.value }))}
                placeholder="e.g. Finals"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={state.date}
                onChange={(e) => setState((s) => ({ ...s, date: e.target.value }))}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Team A</Label>
              <Select value={state.teamAId || "_"} onValueChange={(v) => setState((s) => ({ ...s, teamAId: v === "_" ? "" : v }))}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Select team</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t._id} value={t._id}>{t.teamName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team B</Label>
              <Select value={state.teamBId || "_"} onValueChange={(v) => setState((s) => ({ ...s, teamBId: v === "_" ? "" : v }))}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Select team</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t._id} value={t._id}>{t.teamName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label>Playing XI — {teamA?.teamName}</Label>
              <ul className="space-y-1.5 max-h-48 overflow-y-auto rounded-md border border-input bg-muted/30 p-2">
                {(teamA?.playerIds ?? []).map((pid) => (
                  <li key={pid}>
                    <label className="flex items-center gap-3 py-2.5 px-3 rounded-md hover:bg-background cursor-pointer">
                      <Checkbox
                        checked={state.playingXI_A.includes(pid)}
                        onCheckedChange={() => togglePlayingXI("A", pid)}
                        disabled={!state.playingXI_A.includes(pid) && state.playingXI_A.length >= 11}
                      />
                      <span className="text-sm font-medium">{playersMap[pid] ?? pid}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">{state.playingXI_A.length} selected</p>
            </div>
            <div className="space-y-2">
              <Label>Playing XI — {teamB?.teamName}</Label>
              <ul className="space-y-1.5 max-h-48 overflow-y-auto rounded-md border border-input bg-muted/30 p-2">
                {(teamB?.playerIds ?? []).map((pid) => (
                  <li key={pid}>
                    <label className="flex items-center gap-3 py-2.5 px-3 rounded-md hover:bg-background cursor-pointer">
                      <Checkbox
                        checked={state.playingXI_B.includes(pid)}
                        onCheckedChange={() => togglePlayingXI("B", pid)}
                        disabled={!state.playingXI_B.includes(pid) && state.playingXI_B.length >= 11}
                      />
                      <span className="text-sm font-medium">{playersMap[pid] ?? pid}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">{state.playingXI_B.length} selected</p>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="overs">Overs per innings</Label>
              <Input
                id="overs"
                type="number"
                min={1}
                value={state.rules.oversPerInnings}
                onChange={(e) => setState((s) => ({ ...s, rules: { ...s.rules, oversPerInnings: +e.target.value || 20 } }))}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Balls per over</Label>
              <Select
                value={String(state.rules.ballsPerOver)}
                onValueChange={(v) => setState((s) => ({ ...s, rules: { ...s.rules, ballsPerOver: +v } }))}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[4, 5, 6, 8].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wideRuns">Wide runs</Label>
              <Input
                id="wideRuns"
                type="number"
                min={0}
                value={state.rules.wideRuns}
                onChange={(e) => setState((s) => ({ ...s, rules: { ...s.rules, wideRuns: +e.target.value || 0 } }))}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noBallRuns">No-ball runs</Label>
              <Input
                id="noBallRuns"
                type="number"
                min={0}
                value={state.rules.noBallRuns}
                onChange={(e) => setState((s) => ({ ...s, rules: { ...s.rules, noBallRuns: +e.target.value || 0 } }))}
                className="h-11"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wideCounts"
                checked={state.rules.wideCountsAsBall}
                onCheckedChange={(checked) => setState((s) => ({ ...s, rules: { ...s.rules, wideCountsAsBall: !!checked } }))}
              />
              <Label htmlFor="wideCounts" className="cursor-pointer font-normal">Wide counts as ball</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="nbCounts"
                checked={state.rules.noBallCountsAsBall}
                onCheckedChange={(checked) => setState((s) => ({ ...s, rules: { ...s.rules, noBallCountsAsBall: !!checked } }))}
              />
              <Label htmlFor="nbCounts" className="cursor-pointer font-normal">No-ball counts as ball</Label>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="space-y-2">
              <Label>Toss winner</Label>
              <Select value={state.tossWinnerTeamId || "_"} onValueChange={(v) => setState((s) => ({ ...s, tossWinnerTeamId: v === "_" ? "" : v }))}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Select</SelectItem>
                  {teamA && <SelectItem value={state.teamAId!}>{teamA.teamName}</SelectItem>}
                  {teamB && <SelectItem value={state.teamBId!}>{teamB.teamName}</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Decision</Label>
              <Select value={state.tossDecision || "_"} onValueChange={(v) => setState((s) => ({ ...s, tossDecision: (v === "_" ? "" : v) as "BAT" | "FIELD" }))}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Bat or Field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Select</SelectItem>
                  <SelectItem value="BAT">Bat</SelectItem>
                  <SelectItem value="FIELD">Field</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <p className="font-semibold text-foreground">Summary</p>
            <p className="text-sm text-muted-foreground">{state.matchName || "Match"} — {state.date}</p>
            <p className="text-sm">{teamA?.teamName} vs {teamB?.teamName}</p>
            <p className="text-sm">{state.rules.oversPerInnings} overs, {state.rules.ballsPerOver} balls/over</p>
            <p className="text-sm">Toss: {state.tossWinnerTeamId === state.teamAId ? teamA?.teamName : teamB?.teamName} chose to {state.tossDecision === "BAT" ? "bat" : "field"}</p>
            <p className="text-xs text-muted-foreground">Batting first: {state.tossDecision === "BAT" ? (state.tossWinnerTeamId === state.teamAId ? teamA?.teamName : teamB?.teamName) : (state.tossWinnerTeamId === state.teamAId ? teamB?.teamName : teamA?.teamName)}</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 py-2 px-3 rounded-md">{error}</p>
        )}

        <div className="flex gap-2 pt-2">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 rounded-xl"
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              Back
            </Button>
          )}
          {step < 5 ? (
            <Button
              type="button"
              className="flex-1 h-11 rounded-xl"
              onClick={() => canNext && setStep((s) => (s + 1) as Step)}
              disabled={!canNext}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1 h-11 rounded-xl"
              onClick={createAndStart}
              disabled={loading}
            >
              {loading ? "Starting…" : "Start Match"}
            </Button>
          )}
        </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
