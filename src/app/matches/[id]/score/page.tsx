"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  computeInningsSummary,
  formatOvers,
  getCurrentBattersSimple,
  shouldEndInnings,
  ballCounts,
} from "@/lib/engine";
import type { Match, BallEvent, RulesConfig } from "@/lib/types";

interface Player {
  _id: string;
  fullName: string;
}

export default function ScorePage() {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [playersMap, setPlayersMap] = useState<Record<string, string>>({});
  const [currentBowlerId, setCurrentBowlerId] = useState<string>("");
  const [showWicket, setShowWicket] = useState(false);
  const [showNextBowler, setShowNextBowler] = useState(false);
  const [showInningsOver, setShowInningsOver] = useState(false);
  const [showByesRuns, setShowByesRuns] = useState<"B" | "LB" | null>(null);
  const [wicketKind, setWicketKind] = useState<"BOWLED" | "CAUGHT" | "LBW" | "RUN_OUT" | "STUMPED" | "HIT_WICKET" | "RETIRED">("BOWLED");
  const [wicketBatterId, setWicketBatterId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMatch = useCallback(async (id: string) => {
    const [mRes, pRes] = await Promise.all([
      fetch(`/api/matches/${id}`),
      fetch("/api/players"),
    ]);
    const m = await mRes.json();
    const players: Player[] = await pRes.json();
    if (m._id) {
      setMatch(m);
      const inn = m.innings?.[m.innings.length - 1];
      const bowl = m.teamAId === (inn?.bowlingTeamId) ? (m.playingXI_A ?? []) : (m.playingXI_B ?? []);
      if (bowl[0]) setCurrentBowlerId((prev) => prev || bowl[0]);
    }
    if (Array.isArray(players)) {
      const map: Record<string, string> = {};
      players.forEach((p) => { map[p._id] = p.fullName; });
      setPlayersMap(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const id = typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "";
    if (id) {
      setMatchId(id);
      loadMatch(id);
    }
  }, [loadMatch]);

  const currentInnings = match?.innings?.length ? match.innings[match.innings.length - 1] : null;
  const events: BallEvent[] = currentInnings?.events ?? [];
  const rules: RulesConfig = match?.rulesConfig ?? { oversPerInnings: 20, ballsPerOver: 6, wideRuns: 1, noBallRuns: 1, wideCountsAsBall: true, noBallCountsAsBall: true };
  const battingTeamId = currentInnings?.battingTeamId ?? "";
  const bowlingTeamId = currentInnings?.bowlingTeamId ?? "";
  const battingOrder = (match?.teamAId === battingTeamId ? match?.playingXI_A : match?.playingXI_B) ?? [];
  const bowlingOrder = (match?.teamAId === bowlingTeamId ? match?.playingXI_A : match?.playingXI_B) ?? [];

  const summary = currentInnings ? computeInningsSummary(events, rules) : null;
  const { strikerId, nonStrikerId } = currentInnings
    ? getCurrentBattersSimple(events, battingOrder, rules)
    : { strikerId: "", nonStrikerId: "" };

  const totalBallsBowled = summary?.totalBallsBowled ?? 0;
  const overJustFinished = totalBallsBowled > 0 && totalBallsBowled % rules.ballsPerOver === 0;

  useEffect(() => {
    if (overJustFinished) setShowNextBowler(true);
  }, [overJustFinished]);

  const isSecondInnings = (match?.innings?.length ?? 0) >= 2;
  const firstInningsRuns = match?.innings?.[0] ? computeInningsSummary(match.innings[0].events ?? [], rules).totalRuns : 0;
  const target = firstInningsRuns + 1;
  const currentRuns = summary?.totalRuns ?? 0;
  const maxBalls = rules.oversPerInnings * rules.ballsPerOver;
  const ballsLeft = Math.max(0, maxBalls - totalBallsBowled);
  const runsNeeded = Math.max(0, target - currentRuns);
  const requiredRR = ballsLeft > 0 ? (runsNeeded / (ballsLeft / rules.ballsPerOver)) : 0;

  const shouldEnd = currentInnings ? shouldEndInnings(events, rules, battingOrder) : { end: false };

  useEffect(() => {
    if (shouldEnd.end) setShowInningsOver(true);
  }, [shouldEnd.end]);

  async function addBall(payload: { runsOffBat: number; extras?: { type: "WD" | "NB" | "B" | "LB" | null; runs: number }; wicket?: { kind: string; batterOutId: string; fielderId?: string } }) {
    if (!matchId || sending) return;
    setSending(true);
    const body = {
      strikerId,
      nonStrikerId,
      bowlerId: currentBowlerId || bowlingOrder[0],
      runsOffBat: payload.runsOffBat ?? 0,
      extras: payload.extras ?? { type: null, runs: 0 },
      wicket: payload.wicket,
    };
    const res = await fetch(`/api/matches/${matchId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.match) setMatch(data.match);
    setShowWicket(false);
    setShowByesRuns(null);
    setSending(false);
  }

  async function undoLast() {
    if (!matchId || sending) return;
    setSending(true);
    const res = await fetch(`/api/matches/${matchId}/events/last`, { method: "DELETE" });
    const data = await res.json();
    if (data.match) setMatch(data.match);
    setSending(false);
  }

  async function endInnings() {
    if (!matchId || !match || sending) return;
    setSending(true);
    setShowInningsOver(false);
    const current = match.innings[match.innings.length - 1];
    const newInnings = {
      battingTeamId: current.bowlingTeamId,
      bowlingTeamId: current.battingTeamId,
      events: [] as BallEvent[],
    };
    const res = await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ innings: [...(match.innings ?? []), newInnings] }),
    });
    const data = await res.json();
    if (data._id) {
      setMatch(data);
      const newInn = data.innings?.[data.innings.length - 1];
      const newBowl = data.teamAId === newInn?.bowlingTeamId ? (data.playingXI_A ?? []) : (data.playingXI_B ?? []);
      setCurrentBowlerId(newBowl[0] ?? "");
    }
    setSending(false);
  }

  async function endMatch() {
    if (!matchId || sending) return;
    setSending(true);
    setShowInningsOver(false);
    const res = await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    const data = await res.json();
    if (data._id) setMatch(data);
    setSending(false);
  }

  function selectNextBowler(id: string) {
    setCurrentBowlerId(id);
    setShowNextBowler(false);
  }

  if (loading || !match) {
    return (
      <div className="min-h-screen bg-cricket-cream flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (match.status !== "IN_PROGRESS" || !currentInnings) {
    return (
      <div className="min-h-screen bg-cricket-cream p-4 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">No active innings.</p>
        <Link href={`/matches/${matchId}/scorecard`} className="text-cricket-green font-medium">View scorecard</Link>
      </div>
    );
  }

  const overStr = summary ? formatOvers(summary, rules.ballsPerOver) : "0";

  return (
    <div className="min-h-screen bg-cricket-cream pb-32 safe-area-pb">
      <header className="bg-cricket-green text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <Link href="/matches" className="p-2 -m-2 text-white touch-manipulation">← Back</Link>
        <h1 className="text-lg font-bold truncate flex-1 text-center mx-2">{match.matchName}</h1>
        <Link href={`/matches/${matchId}/scorecard`} className="p-2 -m-2 text-white/90 text-sm touch-manipulation">Scorecard</Link>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {/* Score card */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 border border-cricket-green/10">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-3xl font-bold text-cricket-green tabular-nums">
              {summary?.totalRuns ?? 0} <span className="text-gray-400 font-normal">/</span> {summary?.wickets ?? 0}
            </span>
            <span className="text-lg text-gray-600 font-medium">Ov {overStr}</span>
          </div>
          <div className="text-sm text-gray-500">CRR {summary?.runRate ?? 0}</div>
          {isSecondInnings && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-sm font-medium text-gray-700">Target {target}</div>
              <div className="text-sm text-gray-600">
                Need <span className="font-semibold text-cricket-green">{runsNeeded}</span> in <span className="font-semibold">{ballsLeft}</span> balls
                {ballsLeft > 0 && <span> · RRR {requiredRR.toFixed(2)}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Striker & bowler */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-gray-600">Striker: <span className="font-medium text-gray-900">{playersMap[strikerId] ?? strikerId}</span></span>
          <span className="text-gray-600">Bowler: <span className="font-medium text-gray-900">{playersMap[currentBowlerId] ?? currentBowlerId || "—"}</span></span>
        </div>

        {/* Runs: 0 1 2 3 4 6 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[0, 1, 2, 3, 4, 6].map((r) => (
            <button
              key={r}
              onClick={() => addBall({ runsOffBat: r })}
              disabled={sending || !currentBowlerId}
              className="min-h-[52px] py-4 rounded-xl bg-cricket-green text-white font-bold text-xl shadow-md active:scale-95 transition-transform touch-manipulation disabled:opacity-50 disabled:active:scale-100"
            >
              {r}
            </button>
          ))}
        </div>

        {/* One-tap extras: WD, NB, B, LB */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => addBall({ runsOffBat: 0, extras: { type: "WD", runs: rules.wideRuns } })}
            disabled={sending || !currentBowlerId}
            className="min-h-[48px] py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm shadow active:scale-95 touch-manipulation disabled:opacity-50"
          >
            Wide
          </button>
          <button
            onClick={() => addBall({ runsOffBat: 0, extras: { type: "NB", runs: rules.noBallRuns } })}
            disabled={sending || !currentBowlerId}
            className="min-h-[48px] py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm shadow active:scale-95 touch-manipulation disabled:opacity-50"
          >
            No ball
          </button>
          <button
            onClick={() => setShowByesRuns(showByesRuns === "B" ? null : "B")}
            disabled={sending || !currentBowlerId}
            className={`min-h-[48px] py-3 rounded-xl font-semibold text-sm shadow active:scale-95 touch-manipulation ${showByesRuns === "B" ? "ring-2 ring-cricket-green bg-amber-100 text-amber-900" : "bg-amber-100 text-amber-900"}`}
          >
            Byes
          </button>
          <button
            onClick={() => setShowByesRuns(showByesRuns === "LB" ? null : "LB")}
            disabled={sending || !currentBowlerId}
            className={`min-h-[48px] py-3 rounded-xl font-semibold text-sm shadow active:scale-95 touch-manipulation ${showByesRuns === "LB" ? "ring-2 ring-cricket-green bg-amber-50 text-amber-800" : "bg-amber-50 text-amber-800"}`}
          >
            Leg byes
          </button>
        </div>

        {/* Byes / Leg byes runs: 0 1 2 3 4 */}
        {showByesRuns && (
          <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs font-medium text-amber-800 mb-2">Runs ({showByesRuns === "B" ? "Byes" : "Leg byes"})</p>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4].map((r) => (
                <button
                  key={r}
                  onClick={() => addBall({ runsOffBat: 0, extras: { type: showByesRuns, runs: r } })}
                  disabled={sending}
                  className="w-12 h-12 rounded-lg bg-white border-2 border-amber-300 text-amber-900 font-bold active:scale-95 touch-manipulation"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Wicket & Undo & End */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowWicket(true)}
            disabled={sending || !currentBowlerId}
            className="min-h-[48px] px-4 py-3 rounded-xl bg-red-600 text-white font-semibold shadow active:scale-95 touch-manipulation disabled:opacity-50"
          >
            Wicket
          </button>
          <button
            onClick={undoLast}
            disabled={sending || events.length === 0}
            className="min-h-[48px] px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold active:scale-95 touch-manipulation disabled:opacity-50"
          >
            Undo
          </button>
          {!isSecondInnings && (
            <button
              onClick={endInnings}
              disabled={sending}
              className="min-h-[48px] px-4 py-3 rounded-xl bg-amber-600 text-white font-semibold shadow active:scale-95 touch-manipulation"
            >
              End innings
            </button>
          )}
          {isSecondInnings && (runsNeeded <= 0 || shouldEnd.end) && (
            <button
              onClick={endMatch}
              disabled={sending}
              className="min-h-[48px] px-4 py-3 rounded-xl bg-red-600 text-white font-semibold shadow active:scale-95 touch-manipulation"
            >
              End match
            </button>
          )}
        </div>

        {/* This over chips */}
        {events.length > 0 && (() => {
          let count = 0;
          const thisOver: BallEvent[] = [];
          for (let i = events.length - 1; i >= 0; i--) {
            const e = events[i];
            if (ballCounts(e, rules)) count++;
            thisOver.unshift(e);
            if (count >= rules.ballsPerOver) break;
          }
          return (
            <div className="mt-5">
              <p className="text-xs font-medium text-gray-500 mb-2">This over</p>
              <div className="flex flex-wrap gap-1.5">
                {thisOver.map((e) => {
                  const r = (e.runsOffBat ?? 0) + (e.extras?.runs ?? 0);
                  const w = e.wicket ? "W" : "";
                  const ext = e.extras?.type ?? "";
                  return (
                    <span key={e._id} className="inline-flex items-center justify-center min-w-[32px] px-2 py-1.5 rounded-lg bg-gray-200 text-gray-800 font-medium text-sm">
                      {w || ext || (r > 0 ? r : "·")}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </main>

      {/* Next bowler (over finished, innings not over) */}
      {showNextBowler && overJustFinished && !shouldEnd.end && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-30 p-4 pb-8 safe-area-pb">
          <div className="bg-white rounded-t-3xl rounded-b-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-cricket-green">Over complete</h3>
              <p className="text-sm text-gray-600">Select next bowler</p>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {bowlingOrder.map((id) => (
                <button
                  key={id}
                  onClick={() => selectNextBowler(id)}
                  className={`w-full text-left py-3 px-4 rounded-xl font-medium touch-manipulation mb-1 ${currentBowlerId === id ? "bg-cricket-green text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
                >
                  {playersMap[id] ?? id}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Innings over */}
      {showInningsOver && shouldEnd.end && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-xl font-bold text-cricket-green mb-1">Innings over</h3>
            <p className="text-gray-600 mb-4">
              {summary?.totalRuns ?? 0}/{summary?.wickets ?? 0} in {overStr} overs
            </p>
            {!isSecondInnings ? (
              <button
                onClick={endInnings}
                disabled={sending}
                className="w-full py-4 rounded-xl bg-cricket-green text-white font-bold text-lg touch-manipulation disabled:opacity-50"
              >
                Start 2nd innings
              </button>
            ) : (
              <button
                onClick={endMatch}
                disabled={sending}
                className="w-full py-4 rounded-xl bg-red-600 text-white font-bold text-lg touch-manipulation disabled:opacity-50"
              >
                End match
              </button>
            )}
            <button
              onClick={() => setShowInningsOver(false)}
              className="w-full mt-2 py-2 text-gray-500 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Wicket modal */}
      {showWicket && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-30 p-4 pb-8 safe-area-pb">
          <div className="bg-white rounded-t-3xl rounded-b-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold">Wicket</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={wicketKind}
                  onChange={(e) => setWicketKind(e.target.value as typeof wicketKind)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300"
                >
                  <option value="BOWLED">Bowled</option>
                  <option value="CAUGHT">Caught</option>
                  <option value="LBW">LBW</option>
                  <option value="RUN_OUT">Run out</option>
                  <option value="STUMPED">Stumped</option>
                  <option value="HIT_WICKET">Hit wicket</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batter out</label>
                <select
                  value={wicketBatterId}
                  onChange={(e) => setWicketBatterId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300"
                >
                  <option value="">Select</option>
                  {battingOrder.map((id) => (
                    <option key={id} value={id}>{playersMap[id] ?? id}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowWicket(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-300 font-medium">
                  Cancel
                </button>
                <button
                  onClick={() => wicketBatterId && addBall({ runsOffBat: 0, wicket: { kind: wicketKind, batterOutId: wicketBatterId } })}
                  disabled={!wicketBatterId || sending}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50"
                >
                  Add wicket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
