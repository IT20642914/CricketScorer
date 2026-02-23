"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Team } from "@/lib/types";
import { DEFAULT_RULES } from "@/lib/types";

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
      <header className="bg-cricket-green text-white px-4 py-4 flex items-center gap-2">
        <Link href="/" className="text-white">←</Link>
        <h1 className="text-xl font-bold">New Match — Step {step}/5</h1>
      </header>
      <main className="p-4 max-w-lg mx-auto space-y-4">
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Match name</label>
              <input
                value={state.matchName}
                onChange={(e) => setState((s) => ({ ...s, matchName: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300"
                placeholder="e.g. Finals"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={state.date}
                onChange={(e) => setState((s) => ({ ...s, date: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team A</label>
              <select
                value={state.teamAId}
                onChange={(e) => setState((s) => ({ ...s, teamAId: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300"
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>{t.teamName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team B</label>
              <select
                value={state.teamBId}
                onChange={(e) => setState((s) => ({ ...s, teamBId: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300"
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>{t.teamName}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Playing XI — {teamA?.teamName}</label>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {(teamA?.playerIds ?? []).map((pid) => (
                  <li key={pid}>
                    <label className="flex items-center gap-2 py-2 px-3 bg-white rounded border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.playingXI_A.includes(pid)}
                        onChange={() => togglePlayingXI("A", pid)}
                        disabled={!state.playingXI_A.includes(pid) && state.playingXI_A.length >= 11}
                      />
                      <span>{playersMap[pid] ?? pid}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-1">{state.playingXI_A.length} selected</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Playing XI — {teamB?.teamName}</label>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {(teamB?.playerIds ?? []).map((pid) => (
                  <li key={pid}>
                    <label className="flex items-center gap-2 py-2 px-3 bg-white rounded border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.playingXI_B.includes(pid)}
                        onChange={() => togglePlayingXI("B", pid)}
                        disabled={!state.playingXI_B.includes(pid) && state.playingXI_B.length >= 11}
                      />
                      <span>{playersMap[pid] ?? pid}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-1">{state.playingXI_B.length} selected</p>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overs per innings</label>
              <input
                type="number"
                min={1}
                value={state.rules.oversPerInnings}
                onChange={(e) => setState((s) => ({ ...s, rules: { ...s.rules, oversPerInnings: +e.target.value || 20 } }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Balls per over</label>
              <select
                value={state.rules.ballsPerOver}
                onChange={(e) => setState((s) => ({ ...s, rules: { ...s.rules, ballsPerOver: +e.target.value } }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300"
              >
                {[4, 5, 6, 8].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wide runs</label>
              <input
                type="number"
                min={0}
                value={state.rules.wideRuns}
                onChange={(e) => setState((s) => ({ ...s, rules: { ...s.rules, wideRuns: +e.target.value || 0 } }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No-ball runs</label>
              <input
                type="number"
                min={0}
                value={state.rules.noBallRuns}
                onChange={(e) => setState((s) => ({ ...s, rules: { ...s.rules, noBallRuns: +e.target.value || 0 } }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="wideCounts"
                checked={state.rules.wideCountsAsBall}
                onChange={(e) => setState((s) => ({ ...s, rules: { ...s.rules, wideCountsAsBall: e.target.checked } }))}
              />
              <label htmlFor="wideCounts">Wide counts as ball</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="nbCounts"
                checked={state.rules.noBallCountsAsBall}
                onChange={(e) => setState((s) => ({ ...s, rules: { ...s.rules, noBallCountsAsBall: e.target.checked } }))}
              />
              <label htmlFor="nbCounts">No-ball counts as ball</label>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Toss winner</label>
              <select
                value={state.tossWinnerTeamId}
                onChange={(e) => setState((s) => ({ ...s, tossWinnerTeamId: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300"
              >
                <option value="">Select</option>
                {teamA && <option value={state.teamAId}>{teamA.teamName}</option>}
                {teamB && <option value={state.teamBId}>{teamB.teamName}</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
              <select
                value={state.tossDecision}
                onChange={(e) => setState((s) => ({ ...s, tossDecision: e.target.value as "BAT" | "FIELD" }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300"
              >
                <option value="">Select</option>
                <option value="BAT">Bat</option>
                <option value="FIELD">Field</option>
              </select>
            </div>
          </>
        )}

        {step === 5 && (
          <div className="space-y-2">
            <p className="font-medium">Summary</p>
            <p>{state.matchName || "Match"} — {state.date}</p>
            <p>{teamA?.teamName} vs {teamB?.teamName}</p>
            <p>{state.rules.oversPerInnings} overs, {state.rules.ballsPerOver} balls/over</p>
            <p>Toss: {state.tossWinnerTeamId === state.teamAId ? teamA?.teamName : teamB?.teamName} chose to {state.tossDecision === "BAT" ? "bat" : "field"}</p>
            <p className="text-sm text-gray-600">Batting first: {state.tossDecision === "BAT" ? (state.tossWinnerTeamId === state.teamAId ? teamA?.teamName : teamB?.teamName) : (state.tossWinnerTeamId === state.teamAId ? teamB?.teamName : teamA?.teamName)}</p>
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2 pt-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="flex-1 py-3 rounded-lg border border-gray-300 font-medium"
            >
              Back
            </button>
          )}
          {step < 5 ? (
            <button
              type="button"
              onClick={() => canNext && setStep((s) => (s + 1) as Step)}
              disabled={!canNext}
              className="flex-1 py-3 rounded-lg bg-cricket-green text-white font-semibold disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={createAndStart}
              disabled={loading}
              className="flex-1 py-3 rounded-lg bg-cricket-green text-white font-semibold disabled:opacity-50"
            >
              {loading ? "Starting…" : "Start Match"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
