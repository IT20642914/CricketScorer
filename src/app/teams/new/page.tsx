"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

interface Player {
  _id: string;
  fullName: string;
  shortName?: string;
}

const schema = z.object({
  teamName: z.string().min(1, "Team name required"),
  playerIds: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

export default function NewTeamPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState("");
  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { playerIds: [] },
  });
  const playerIds = watch("playerIds") ?? [];

  useEffect(() => {
    fetch("/api/players").then((r) => r.json()).then((d) => Array.isArray(d) && setPlayers(d));
  }, []);

  function togglePlayer(id: string) {
    setValue(
      "playerIds",
      playerIds.includes(id) ? playerIds.filter((x) => x !== id) : [...playerIds, id]
    );
  }

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setError("Failed to create team");
      return;
    }
    router.push("/teams");
  }

  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="bg-cricket-green text-white px-4 py-4 flex items-center gap-2">
        <Link href="/teams" className="text-white">←</Link>
        <h1 className="text-xl font-bold">New Team</h1>
      </header>
      <main className="p-4 max-w-lg mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team name *</label>
            <input
              {...register("teamName")}
              className="w-full px-4 py-3 rounded-lg border border-gray-300"
              placeholder="e.g. Tigers XI"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select players</label>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {players.map((p) => (
                <li key={p._id}>
                  <label className="flex items-center gap-2 py-2 px-3 bg-white rounded border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={playerIds.includes(p._id)}
                      onChange={() => togglePlayer(p._id)}
                    />
                    <span>{p.fullName}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-lg bg-cricket-green text-white font-semibold">
            Create Team
          </button>
        </form>
      </main>
    </div>
  );
}
