"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

interface Player {
  _id: string;
  fullName: string;
}
interface Team {
  _id: string;
  teamName: string;
  playerIds: string[];
}

const schema = z.object({
  teamName: z.string().min(1),
  playerIds: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

export default function EditTeamPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { teamName: "", playerIds: [] },
  });
  const playerIds = watch("playerIds") ?? [];

  useEffect(() => {
    Promise.all([
      fetch(`/api/teams/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/players").then((r) => r.json()),
    ]).then(([t, p]) => {
      if (t) setTeam(t);
      if (Array.isArray(p)) setPlayers(p);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (team) {
      setValue("teamName", team.teamName);
      setValue("playerIds", team.playerIds ?? []);
    }
  }, [team, setValue]);

  function togglePlayer(pid: string) {
    setValue(
      "playerIds",
      playerIds.includes(pid) ? playerIds.filter((x) => x !== pid) : [...playerIds, pid]
    );
  }

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch(`/api/teams/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setError("Failed to update");
      return;
    }
    router.push("/teams");
  }

  if (loading || !team) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="bg-cricket-green text-white px-4 py-4 flex items-center gap-2">
        <Link href="/teams" className="text-white">←</Link>
        <h1 className="text-xl font-bold">Edit Team</h1>
      </header>
      <main className="p-4 max-w-lg mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team name *</label>
            <input {...register("teamName")} className="w-full px-4 py-3 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Players</label>
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
          <button type="submit" className="w-full py-3 rounded-lg bg-cricket-green text-white font-semibold">Save</button>
        </form>
      </main>
    </div>
  );
}
