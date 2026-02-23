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

interface Player {
  _id: string;
  fullName: string;
}

export default function ScorecardPage() {
  const [match, setMatch] = useState<Match | null>(null);
  const [playersMap, setPlayersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "";
    if (!id) return;
    Promise.all([
      fetch(`/api/matches/${id}`).then((r) => r.json()),
      fetch("/api/players").then((r) => r.json()),
    ]).then(([m, players]: [Match, Player[]]) => {
      if (m._id) setMatch(m);
      if (Array.isArray(players)) {
        const map: Record<string, string> = {};
        players.forEach((p) => { map[p._id] = p.fullName; });
        setPlayersMap(map);
      }
      setLoading(false);
    });
  }, []);

  if (loading || !match) {
    return (
      <div className="min-h-screen bg-cricket-cream p-4">
        <p>Loading...</p>
      </div>
    );
  }

  const rules: RulesConfig = match.rulesConfig ?? { oversPerInnings: 20, ballsPerOver: 6, wideRuns: 1, noBallRuns: 1, wideCountsAsBall: true, noBallCountsAsBall: true };
  const teamAName = "Team A";
  const teamBName = "Team B";

  return (
    <div className="min-h-screen bg-cricket-cream pb-8">
      <header className="bg-cricket-green text-white px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href={match.status === "IN_PROGRESS" ? `/matches/${match._id}/score` : "/matches"} className="text-white">←</Link>
        <h1 className="text-lg font-bold truncate flex-1 text-center mx-2">{match.matchName}</h1>
        {match.status === "IN_PROGRESS" && (
          <Link href={`/matches/${match._id}/score`} className="text-white text-sm">Score</Link>
        )}
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-6">
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

          return (
            <div key={idx} className="bg-white rounded-xl shadow p-4">
              <h2 className="font-bold text-cricket-green mb-2">
                Innings {idx + 1}{innings.maxOvers === 1 ? " (Super Over)" : ""}: {summary.totalRuns}/{summary.wickets} ({formatOvers(summary, bpo)} overs)
              </h2>
              <p className="text-sm text-gray-600 mb-3">Run rate: {summary.runRate}</p>
              {Object.keys(summary.extrasBreakdown).length > 0 && (
                <p className="text-sm text-gray-600 mb-2">
                  Extras: {Object.entries(summary.extrasBreakdown).map(([k, v]) => `${k} ${v}`).join(", ")}
                </p>
              )}

              <h3 className="font-medium mt-3 mb-1">Batting</h3>
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

              <h3 className="font-medium mt-3 mb-1">Bowling</h3>
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
                    {bowlingFigs.filter((f) => f.overs > 0 || f.balls > 0).map((f) => (
                      <tr key={f.playerId} className="border-b border-gray-100">
                        <td className="py-1">{playersMap[f.playerId] ?? f.playerId}</td>
                        <td className="text-right py-1">{f.overs}.{f.balls}</td>
                        <td className="text-right py-1">{f.runsConceded}</td>
                        <td className="text-right py-1">{f.wickets}</td>
                        <td className="text-right py-1">{f.economy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
