"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Match {
  _id: string;
  matchName: string;
  date: string;
  status: string;
  teamAId: string;
  teamBId: string;
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
        if (Array.isArray(data)) setMatches(data);
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
      <header className="bg-cricket-green text-white px-4 py-4 flex items-center gap-2">
        <Link href="/" className="text-white">←</Link>
        <h1 className="text-xl font-bold flex-1">Match History</h1>
        <Link href="/matches/new" className="bg-white text-cricket-green px-3 py-1.5 rounded font-medium text-sm">New</Link>
      </header>
      <main className="p-4 max-w-lg mx-auto">
        <div className="flex gap-2 mb-4">
          {(["all", "IN_PROGRESS", "COMPLETED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-sm font-medium ${filter === f ? "bg-cricket-green text-white" : "bg-gray-200 text-gray-700"}`}
            >
              {f === "all" ? "All" : f === "IN_PROGRESS" ? "Live" : "Completed"}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <ul className="space-y-2">
            {matches.map((m) => (
              <li key={m._id}>
                <Link
                  href={m.status === "IN_PROGRESS" ? `/matches/${m._id}/score` : `/matches/${m._id}/scorecard`}
                  className="block py-3 px-4 bg-white rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="font-medium">{m.matchName}</div>
                  <div className="text-sm text-gray-600">
                    {teams[m.teamAId]?.teamName ?? "Team A"} vs {teams[m.teamBId]?.teamName ?? "Team B"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(m.date).toLocaleDateString()} · {m.status}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
