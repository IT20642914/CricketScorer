"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Player {
  _id: string;
  fullName: string;
  shortName?: string;
  isKeeper?: boolean;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/players${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPlayers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search]);

  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="bg-cricket-green text-white px-4 py-4 flex items-center gap-2">
        <Link href="/" className="text-white">←</Link>
        <h1 className="text-xl font-bold flex-1">Players</h1>
        <Link href="/players/new" className="bg-white text-cricket-green px-3 py-1.5 rounded font-medium text-sm">Add</Link>
      </header>
      <main className="p-4 max-w-lg mx-auto">
        <input
          type="search"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 mb-4"
        />
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <ul className="space-y-2">
            {players.map((p) => (
              <li key={p._id}>
                <Link
                  href={`/players/${p._id}`}
                  className="flex justify-between items-center py-3 px-4 bg-white rounded-lg shadow-sm border border-gray-100"
                >
                  <span className="font-medium">{p.fullName}</span>
                  {p.shortName && <span className="text-gray-500 text-sm">{p.shortName}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
