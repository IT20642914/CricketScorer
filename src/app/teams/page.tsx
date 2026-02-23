"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
      <header className="page-header">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2" asChild>
          <Link href="/">←</Link>
        </Button>
        <h1 className="text-xl font-bold flex-1 text-center">Teams</h1>
        <Button size="sm" className="bg-white text-primary hover:bg-white/90" asChild>
          <Link href="/teams/new">Add</Link>
        </Button>
      </header>
      <main className="p-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : teams.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-2">No teams yet</p>
              <Button variant="link" className="text-primary p-0 h-auto" asChild>
                <Link href="/teams/new">Create your first team →</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {teams.map((t) => (
              <Card key={t._id} className="border-0 shadow-card">
                <Link href={`/teams/${t._id}`}>
                  <CardContent className="flex justify-between items-center py-3.5 px-4">
                    <span className="font-medium text-foreground truncate pr-2">{t.teamName}</span>
                    <span className="text-muted-foreground text-sm shrink-0">
                      {(t.playerIds?.length ?? 0)} players
                    </span>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
