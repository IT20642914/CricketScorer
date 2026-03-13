"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  computeInningsSummary,
  computeBattingCard,
  computeBowlingFigures,
  formatOvers,
} from "@/lib/engine";
import type { Match, BallEvent, RulesConfig } from "@/lib/types";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function formatBallChip(e: BallEvent): string {
  const w = e.wicket ? "W" : "";
  const ext = e.extras?.type ?? "";
  const runsOffBat = e.runsOffBat ?? 0;
  const extRuns = e.extras?.runs ?? 0;
  const total = runsOffBat + extRuns;
  if (w) return "W";
  if (ext === "NB") return total === 0 ? "nb" : runsOffBat > 0 ? `${runsOffBat}nb (${total})` : `${total}nb`;
  if (ext === "WD") return total === 0 ? "wd" : `${extRuns}wd (${total})`;
  if (ext) return total > 0 ? `${total}${ext.toLowerCase()}` : ext;
  return total > 0 ? String(total) : "·";
}

function runsFromBall(e: BallEvent): number {
  return (e.runsOffBat ?? 0) + (e.extras?.runs ?? 0);
}

function getOversPerBowler(events: BallEvent[]): Record<string, BallEvent[][]> {
  const ballsPerBowler: Record<string, BallEvent[]> = {};
  for (const e of events) {
    const bid = e.bowlerId;
    if (bid) {
      if (!ballsPerBowler[bid]) ballsPerBowler[bid] = [];
      ballsPerBowler[bid].push(e);
    }
  }
  const out: Record<string, BallEvent[][]> = {};
  for (const [bid, balls] of Object.entries(ballsPerBowler)) {
    const byOver: Record<number, BallEvent[]> = {};
    for (const e of balls) {
      const o = e.overNumber ?? 0;
      if (!byOver[o]) byOver[o] = [];
      byOver[o].push(e);
    }
    out[bid] = Object.keys(byOver)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => byOver[Number(k)]);
  }
  return out;
}

interface Player {
  _id: string;
  fullName: string;
}

interface Team {
  _id: string;
  teamName: string;
}

export default function ScorecardPage() {
  const [match, setMatch] = useState<Match | null>(null);
  const [playersMap, setPlayersMap] = useState<Record<string, string>>({});
  const [teamsMap, setTeamsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [viewOvers, setViewOvers] = useState<{ inningsIndex: number; bowlerId: string } | null>(null);

  useEffect(() => {
    const id = typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "";
    if (!id) return;
    Promise.all([
      fetch(`/api/matches/${id}`).then((r) => r.json()),
      fetch("/api/players?light=1").then((r) => r.json()),
      fetch("/api/teams").then((r) => r.json()),
    ]).then(([m, players, teams]: [Match, Player[], Team[]]) => {
      if (m._id) setMatch(m);
      if (Array.isArray(players)) {
        const map: Record<string, string> = {};
        players.forEach((p) => { map[p._id] = p.fullName; });
        setPlayersMap(map);
      }
      if (Array.isArray(teams)) {
        const map: Record<string, string> = {};
        teams.forEach((t) => { map[t._id] = t.teamName; });
        setTeamsMap(map);
      }
      setLoading(false);
    });
  }, []);

  if (loading || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2">
        <Spinner className="h-5 w-5 border-cricket-green border-t-transparent text-cricket-green" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const rules: RulesConfig = match.rulesConfig ?? { oversPerInnings: 20, ballsPerOver: 6, wideRuns: 1, noBallRuns: 1, wideCountsAsBall: false, noBallCountsAsBall: false };
  const teamAName = teamsMap[match.teamAId] ?? "Team A";
  const teamBName = teamsMap[match.teamBId] ?? "Team B";
  const getTeamName = (teamId: string) => (match.teamAId === teamId ? teamAName : teamBName);

  /** Compute match result (who won or tie) for completed matches. */
  function getMatchResult(): string | null {
    if (!match || match.status !== "COMPLETED") return null;
    const inns = match.innings ?? [];
    if (inns.length < 2) return null;
    const isSO = inns.length >= 4 && (inns[inns.length - 1]?.maxOvers === 1);
    const first = isSO ? inns[inns.length - 2]! : inns[0]!;
    const second = isSO ? inns[inns.length - 1]! : inns[1]!;
    const bpo1 = first.ballsPerOver ?? rules.ballsPerOver;
    const bpo2 = second.ballsPerOver ?? rules.ballsPerOver;
    const r1 = computeInningsSummary(first.events ?? [], rules, bpo1).totalRuns;
    const w1 = computeInningsSummary(first.events ?? [], rules, bpo1).wickets;
    const r2 = computeInningsSummary(second.events ?? [], rules, bpo2).totalRuns;
    const w2 = computeInningsSummary(second.events ?? [], rules, bpo2).wickets;
    const team1Bat = first.battingTeamId;
    const team2Bat = second.battingTeamId;
    const team1Name = match.teamAId === team1Bat ? teamAName : teamBName;
    const team2Name = match.teamAId === team2Bat ? teamAName : teamBName;
    const maxWk = (match.playingXI_A?.length ?? 11) - 1;
    if (r2 > r1) return `${team2Name} won by ${maxWk - w2} wicket${maxWk - w2 !== 1 ? "s" : ""}`;
    if (r2 < r1) return `${team1Name} won by ${r1 - r2} run${r1 - r2 !== 1 ? "s" : ""}`;
    return "Match tied";
  }

  const resultMessage = getMatchResult();

  return (
    <div className="min-h-screen pb-8">
      <header className="bg-cricket-green text-white px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href={match.status === "IN_PROGRESS" ? `/matches/${match._id}/score` : "/matches"} className="text-white">←</Link>
        <h1 className="text-lg font-bold truncate flex-1 text-center mx-2">{match.matchName}</h1>
        {match.status === "IN_PROGRESS" && (
          <Link href={`/matches/${match._id}/score`} className="text-white text-sm">Score</Link>
        )}
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-6">
        {resultMessage && (
          <div className="rounded-xl bg-cricket-green text-white p-4 text-center shadow-md">
            <p className="text-xs font-medium uppercase tracking-wider opacity-90">Result</p>
            <p className="text-xl font-bold mt-1">{resultMessage}</p>
          </div>
        )}
        <p className="text-gray-600 text-sm">
          {new Date(match.date).toLocaleDateString()} · {match.status}
        </p>

        {(match.innings ?? []).map((innings, idx) => {
          const events: BallEvent[] = innings.events ?? [];
          const bpo = innings.ballsPerOver ?? rules.ballsPerOver;
          const summary = computeInningsSummary(events, rules, bpo);
          const defaultBatOrder = match.teamAId === innings.battingTeamId ? (match.playingXI_A ?? []) : (match.playingXI_B ?? []);
          const batOrder = (innings.battingOrderOverride?.length ? innings.battingOrderOverride : defaultBatOrder) as string[];
          const bowlOrder = match.teamAId === innings.bowlingTeamId ? (match.playingXI_A ?? []) : (match.playingXI_B ?? []);
          const battingCard = computeBattingCard(events, batOrder);
          const bowlingFigs = computeBowlingFigures(events, rules, bowlOrder, bpo);
          const oversPerBowler = getOversPerBowler(events);

          return (
            <div key={idx} className="bg-white rounded-xl shadow p-4">
              <h2 className="font-bold text-cricket-green mb-1">
                Innings {idx + 1}{innings.maxOvers === 1 ? " (Super Over)" : ""}: {summary.totalRuns}/{summary.wickets} ({formatOvers(summary, bpo)} overs)
              </h2>
              <p className="text-sm text-gray-700 font-medium mb-1">
                Batting: {getTeamName(innings.battingTeamId)} · Bowling: {getTeamName(innings.bowlingTeamId)}
              </p>
              <p className="text-sm text-gray-600 mb-3">Run rate: {summary.runRate}</p>
              {Object.keys(summary.extrasBreakdown).length > 0 && (
                <p className="text-sm text-gray-600 mb-2">
                  Extras: {Object.entries(summary.extrasBreakdown).map(([k, v]) => `${k} ${v}`).join(", ")}
                </p>
              )}

              <h3 className="font-medium mt-3 mb-1">Batting – {getTeamName(innings.battingTeamId)}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Batter</th>
                      <th className="text-right py-1">R</th>
                      <th className="text-right py-1">B</th>
                      <th className="text-right py-1">4s</th>
                      <th className="text-right py-1">6s</th>
                      <th className="text-right py-1">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {battingCard.map((b) => (
                      <tr key={b.playerId} className="border-b border-gray-100">
                        <td className="py-1">
                          {playersMap[b.playerId] ?? b.playerId}
                          {b.dismissalText && <span className="text-gray-500 text-xs block">{b.dismissalText}</span>}
                        </td>
                        <td className="text-right py-1">{b.runs}{!b.out && b.balls > 0 ? "*" : ""}</td>
                        <td className="text-right py-1">{b.balls}</td>
                        <td className="text-right py-1">{b.fours}</td>
                        <td className="text-right py-1">{b.sixes}</td>
                        <td className="text-right py-1">{b.strikeRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="font-medium mt-3 mb-1">Bowling – {getTeamName(innings.bowlingTeamId)}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Bowler</th>
                      <th className="text-right py-1">O</th>
                      <th className="text-right py-1">R</th>
                      <th className="text-right py-1">W</th>
                      <th className="text-right py-1">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bowlingFigs.filter((f) => f.overs > 0 || f.balls > 0).map((f) => {
                      const bowlerOvers = oversPerBowler[f.playerId] ?? [];
                      const firstOverBalls = bowlerOvers[0] ?? [];
                      return (
                        <tr key={f.playerId} className="border-b border-gray-100">
                          <td className="py-1">
                            <div>{playersMap[f.playerId] ?? f.playerId}</div>
                            {firstOverBalls.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {firstOverBalls.map((e) => (
                                  <span
                                    key={e._id}
                                    className="inline-flex items-center justify-center min-w-[26px] px-1 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-medium text-xs"
                                  >
                                    {formatBallChip(e)}
                                  </span>
                                ))}
                              </div>
                            )}
                            {bowlerOvers.length > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs mt-0.5 -ml-1 text-amber-700 hover:text-amber-900 p-0"
                                onClick={() => setViewOvers({ inningsIndex: idx, bowlerId: f.playerId })}
                              >
                                View overs
                              </Button>
                            )}
                          </td>
                          <td className="text-right py-1 align-top">{f.overs}.{f.balls}</td>
                          <td className="text-right py-1 align-top">{f.runsConceded}</td>
                          <td className="text-right py-1 align-top">{f.wickets}</td>
                          <td className="text-right py-1 align-top">{f.economy}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* View overs – ball-by-ball per over for selected bowler */}
        <Dialog open={!!viewOvers} onOpenChange={(open) => !open && setViewOvers(null)}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-primary">
                {viewOvers && (playersMap[viewOvers.bowlerId] ?? viewOvers.bowlerId)} – Overs
              </DialogTitle>
            </DialogHeader>
            {viewOvers && (() => {
              const inn = match.innings?.[viewOvers.inningsIndex];
              const evts: BallEvent[] = inn?.events ?? [];
              const overs = getOversPerBowler(evts)[viewOvers.bowlerId] ?? [];
              return (
                <div className="space-y-3 py-2">
                  {overs.map((overBalls, i) => (
                    <div key={i}>
                      <p className="text-xs font-medium text-gray-600 mb-1.5">Over {i + 1}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {overBalls.map((e) => (
                          <span
                            key={e._id}
                            className="inline-flex items-center justify-center min-w-[32px] px-2 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium text-sm"
                          >
                            {formatBallChip(e)}
                          </span>
                        ))}
                        <span className="text-xs text-gray-500 self-center ml-1 tabular-nums">
                          = {overBalls.reduce((s, e) => s + runsFromBall(e), 0)} runs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
