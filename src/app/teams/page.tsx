"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Team {
  _id: string;
  teamName: string;
  playerIds: string[];
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTeams(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="bg-cricket-green text-white px-4 py-4 flex items-center gap-2">
        <Link href="/" className="text-white">←</Link>
        <h1 className="text-xl font-bold flex-1">Teams</h1>
        <Link href="/teams/new" className="bg-white text-cricket-green px-3 py-1.5 rounded font-medium text-sm">Add</Link>
      </header>
      <main className="p-4 max-w-lg mx-auto">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <ul className="space-y-2">
            {teams.map((t) => (
              <li key={t._id}>
                <Link
                  href={`/teams/${t._id}`}
                  className="flex justify-between items-center py-3 px-4 bg-white rounded-lg shadow-sm border border-gray-100"
                >
                  <span className="font-medium">{t.teamName}</span>
                  <span className="text-gray-500 text-sm">{t.playerIds?.length ?? 0} players</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
