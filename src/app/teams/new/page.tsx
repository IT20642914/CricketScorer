"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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
      <header className="page-header">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2" asChild>
          <Link href="/teams">←</Link>
        </Button>
        <h1 className="text-xl font-bold flex-1 text-center">New Team</h1>
        <div className="w-10" />
      </header>
      <main className="p-4 max-w-lg mx-auto">
        <Card>
          <CardContent className="p-5 pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team name *</Label>
                <Input
                  id="teamName"
                  {...register("teamName")}
                  placeholder="e.g. Tigers XI"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Select players</Label>
                <ul className="space-y-1.5 max-h-56 overflow-y-auto rounded-md border border-input bg-muted/30 p-2">
                  {players.map((p) => (
                    <li key={p._id}>
                      <label className="flex items-center gap-3 py-2.5 px-3 rounded-md hover:bg-background cursor-pointer">
                        <Checkbox
                          checked={playerIds.includes(p._id)}
                          onCheckedChange={() => togglePlayer(p._id)}
                        />
                        <span className="text-sm font-medium">{p.fullName}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">{playerIds.length} selected</p>
              </div>
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 py-2 px-3 rounded-md">{error}</p>
              )}
              <Button type="submit" className="w-full h-11">Create Team</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
