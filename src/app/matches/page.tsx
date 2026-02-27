"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryKeys } from "@/lib/query-keys";

interface Match {
  _id: string;
  matchName: string;
  date: string;
  status: string;
  teamAId: string;
  teamBId: string;
  updatedAt?: string;
  createdByUserId?: string;
}

interface Team {
  _id: string;
  teamName: string;
}

interface MatchesResponse {
  matches: Match[];
  total: number;
}

async function fetchMatches(params: string): Promise<MatchesResponse> {
  const r = await fetch(`/api/matches${params}`);
  const data = await r.json();
  if (data?.matches && Array.isArray(data.matches)) {
    return { matches: data.matches, total: typeof data.total === "number" ? data.total : data.matches.length };
  }
  return { matches: [], total: 0 };
}

async function fetchTeams(): Promise<Team[]> {
  const r = await fetch("/api/teams");
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

const PAGE_SIZE = 10;

export default function MatchesPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<"all" | "IN_PROGRESS" | "COMPLETED">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const userId = session?.user?.id;
  const playerId = (session?.user as { playerId?: string } | undefined)?.playerId;

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (filter !== "all") p.set("status", filter);
    if (userId) p.set("forUser", userId);
    if (playerId) p.set("forPlayer", playerId);
    p.set("limit", String(PAGE_SIZE));
    p.set("page", String(currentPage));
    return `?${p.toString()}`;
  }, [filter, userId, playerId, currentPage]);

  const matchesQuery = useQuery({
    queryKey: queryKeys.matches(filter, userId ?? undefined, playerId ?? undefined, currentPage),
    queryFn: () => fetchMatches(params),
    enabled: true,
  });

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: fetchTeams,
  });

  const matchesData = matchesQuery.data ?? { matches: [], total: 0 };
  const matches = matchesData.matches;
  const totalMatches = matchesData.total;

  const teams = useMemo(() => {
    const data = Array.isArray(teamsQuery.data) ? teamsQuery.data : [];
    const map: Record<string, Team> = {};
    data.forEach((t: Team) => { map[t._id] = t; });
    return map;
  }, [teamsQuery.data]);

  const loading = matchesQuery.isLoading;
  const isRefetching = matchesQuery.isRefetching;

  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedMatches = matches;

  const goToPage = (page: number) => setCurrentPage((p) => Math.max(1, Math.min(totalPages, page)));

  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="page-header">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 active:bg-white/20 -ml-1 rounded-xl min-h-[44px] min-w-[44px]" asChild>
          <Link href="/">←</Link>
        </Button>
        <h1 className="text-lg sm:text-xl font-bold flex-1 text-center truncate">Match History</h1>
        <div className="w-10 shrink-0" />
      </header>
      <main className="page-content">
        <div className="flex flex-wrap items-center justify-end gap-2 mb-4 sm:mb-5">
          <Button
            variant="outline"
            size="sm"
            className="h-11 min-h-[44px] rounded-xl px-4"
            onClick={() => { matchesQuery.refetch(); teamsQuery.refetch(); }}
            disabled={isRefetching}
          >
            {isRefetching ? "Refreshing…" : "Refresh"}
          </Button>
          <Button
            size="default"
            className="h-11 min-h-[44px] rounded-xl bg-cricket-green text-white hover:bg-cricket-green/90 border border-cricket-green shadow-md font-medium px-5"
            asChild
          >
            <Link href="/matches/new">New match</Link>
          </Button>
        </div>
        <Tabs value={filter} onValueChange={(v) => { setFilter(v as typeof filter); setCurrentPage(1); }} className="mb-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-xl h-12 min-h-[48px]">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background text-sm font-medium">All</TabsTrigger>
            <TabsTrigger value="IN_PROGRESS" className="rounded-lg data-[state=active]:bg-background text-sm font-medium">Live</TabsTrigger>
            <TabsTrigger value="COMPLETED" className="rounded-lg data-[state=active]:bg-background text-sm font-medium">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        {loading ? (
          <ul className="space-y-2">
            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="font-semibold text-muted-foreground">Loading…</p>
                    <p className="text-sm text-muted-foreground">Loading…</p>
                    <p className="text-xs text-muted-foreground">Loading…</p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">—</span>
                </div>
              </CardContent>
            </Card>
          </ul>
        ) : matches.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-2">No matches yet</p>
              <Button variant="link" className="text-primary p-0 h-auto" asChild>
                <Link href="/matches/new">Start a new match →</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
          <ul className="space-y-3 sm:space-y-4">
            {paginatedMatches.map((m) => (
              <Card key={m._id} className="border-0 shadow-card rounded-2xl overflow-hidden transition-shadow hover:shadow-md active:scale-[0.99]">
                <Link
                  href={m.status === "IN_PROGRESS" ? `/matches/${m._id}/score` : `/matches/${m._id}/scorecard`}
                  className="block"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate text-base">{m.matchName}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {teams[m.teamAId]?.teamName ?? "Team A"} vs {teams[m.teamBId]?.teamName ?? "Team B"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(m.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
                          m.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {m.status === "IN_PROGRESS" ? "Live" : "Done"}
                      </span>
                    </div>
                  </CardContent>
                </Link>
                <div className="px-4 sm:px-5 pb-4 pt-0 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 min-h-[44px] rounded-xl px-4"
                    asChild
                  >
                    <Link href={`/matches/new?rematch=${m._id}`} onClick={(e) => e.stopPropagation()}>
                      Rematch
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 safe-area-pb">
              <p className="text-sm text-muted-foreground">
                {totalMatches === 0 ? "0 matches" : `Showing ${startIndex + 1}–${startIndex + paginatedMatches.length} of ${totalMatches}`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 min-h-[44px] rounded-xl px-4"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 min-h-[44px] rounded-xl px-4"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </main>
    </div>
  );
}
