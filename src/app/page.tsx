"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="bg-cricket-green text-white px-4 py-4 shadow">
        <h1 className="text-xl font-bold">Cricket Scoring</h1>
      </header>
      <main className="p-4 max-w-lg mx-auto space-y-4">
        <Link
          href="/matches/new"
          className="block w-full py-4 px-4 rounded-lg bg-cricket-green text-white font-semibold text-center shadow touch-manipulation"
        >
          New Match
        </Link>
        <Link
          href="/matches?status=IN_PROGRESS"
          className="block w-full py-4 px-4 rounded-lg bg-amber-600 text-white font-semibold text-center shadow touch-manipulation"
        >
          Resume Match
        </Link>
        <Link
          href="/matches"
          className="block w-full py-4 px-4 rounded-lg border-2 border-cricket-green text-cricket-green font-semibold text-center touch-manipulation"
        >
          Match History
        </Link>
        <nav className="flex gap-4 pt-6 border-t border-gray-300">
          <Link href="/players" className="text-cricket-green font-medium">Players</Link>
          <Link href="/teams" className="text-cricket-green font-medium">Teams</Link>
        </nav>
      </main>
    </div>
  );
}
