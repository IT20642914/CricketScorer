"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSession, signIn, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";

interface PlayerStatsResponse {
  matchesPlayed: number;
  batting: { runs: number; balls: number; innings: number; dismissals: number; average: number | null; strikeRate: number | null; fours: number; sixes: number; fifties: number; hundreds: number };
  bowling: { wickets: number; runsConceded: number; balls: number; economy: number | null; average: number | null };
  runsPerInnings: number[];
}

function HomeContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [showDebug, setShowDebug] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [profileStats, setProfileStats] = useState<PlayerStatsResponse | null>(null);
  const [profileStatsLoading, setProfileStatsLoading] = useState(false);

  const playerId = (session?.user as { playerId?: string } | undefined)?.playerId;

  const handleAvatarError = useCallback(() => setAvatarError(true), []);

  useEffect(() => {
    if (!showProfileSheet || !playerId) {
      setProfileStats(null);
      return;
    }
    setProfileStatsLoading(true);
    fetch(`/api/players/${playerId}/stats`)
      .then((r) => r.json())
      .then((data) => {
        if (data.matchesPlayed !== undefined) setProfileStats(data);
        else setProfileStats(null);
      })
      .catch(() => setProfileStats(null))
      .finally(() => setProfileStatsLoading(false));
  }, [showProfileSheet, playerId]);

  // Logger: see session.user in browser console (what the client gets)
  useEffect(() => {
    if (session?.user) {
      console.log("[NextAuth] client – session.user:", session.user);
    }
  }, [session?.user]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-cricket-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-2">Cricket Scorer</h1>
            <p className="text-gray-600 text-center mb-8">
              Sign in to your account to continue
            </p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-semibold">Error: {error}</p>
                <p className="text-sm">Please check your credentials and try again.</p>
              </div>
            )}

            <Button
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full mb-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <image href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMjMuNDczIDExLjExNDJjMC0uODIwNy0uMDcxNC0xLjYwOTgtLjE5ODItMi4zNjk4SDEydjQuNDc5Mkg5LjE5MWMtLjEwNzctLjY5NTItLjc5MjItMS42NzEtMS42NzY0LTIuNDQ1VjcuNzkyOGg0LjEyMTJDMTQuODk0IDYuOTE3NiAxNy45MDEgNS4zMDU1IDE4LjQ1IDMuMDc0NUgxOC40NzdWMy4wNzQ1Yy0xLjM0OTcgMS4wMDA4LTMuMDg4MiAxLjU5MTgtNC44NDcgMS43MDk3di4zMDMxYzAgMS41NjQtLjM1IDE2LjMxMjgtLjM1IDE2LjMxMjgtMi4xMDM4IDAtMy4wODgyLS4yNzQtMy4wODgyLS4yNzRzLS40ODM2LS41NTctMS4xNjQ2LTEuMTUwOGMtMS45MzI3LTEuNzI3My0zLjA4ODItNS4yMDYtMy4wODgyLTkuMDMyIDAtMy44MjU2IDEuMTU1Ny03LjMwNDcgMy4wODgyLTkuMDMyMy43ODA2LS41OTMyIDEuMTY0Ni0xLjE1MDggMS4xNjQ2LTEuMTUwOHMuOTc1LTEuMDIxNCAzLjA4ODItMS4wMjE0djEuMDIxNGMwIC4xNTQuMDUgMS42NjIuMDUgMS42NjJoMi45Mjg4YzAtLjIxNi4wMzU3LTEuNTA0LjAzNTctMS41MDR2LTEuMDIxNGMxLjc2MjQuMTE3NiAzLjQ5OC42MjExIDQuODQ3IDEuNzA5NyIgZmlsbD0iIzQyODVGNCIvPjwvZz48L3N2Zz4=" width="24" height="24" />
              </svg>
              Sign in with Google
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or continue as</span>
              </div>
            </div>

            <div className="text-center text-gray-600 text-sm">
              <p>Use your Google account to sign in securely</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="page-header flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo.jpeg"
            alt="Cricket Scoring"
            width={36}
            height={36}
            className="rounded-full object-cover bg-white/10"
          />
          <h1 className="text-xl font-bold tracking-tight">Cricket Scoring</h1>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowProfileSheet(true)}
            className="flex items-center gap-2 rounded-lg hover:bg-white/10 p-1 -m-1 transition-colors"
          >
            {session.user?.image && !avatarError ? (
              <img
                src={session.user?.image ?? ""}
                alt={session.user?.name || "User"}
                width={32}
                height={32}
                className="rounded-full border-2 border-white/30 w-8 h-8 object-cover"
                referrerPolicy="no-referrer"
                onError={handleAvatarError}
              />
            ) : (
              <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white/30 bg-white/20 text-white text-xs font-semibold">
                {session.user?.name?.slice(0, 2).toUpperCase() ?? "?"}
              </span>
            )}
            <span className="text-sm font-medium text-white/95 max-w-[120px] truncate hidden sm:inline">
              {session.user?.name}
            </span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/95 hover:bg-white/10"
            onClick={() => signOut()}
          >
            Sign out
          </Button>
        </div>
      </header>
      {/* Debug: show session values so you can see what we get (e.g. user.image) */}
      <div className="px-4 max-w-lg mx-auto">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground text-xs"
          onClick={() => setShowDebug((d) => !d)}
        >
          {showDebug ? "Hide" : "Show"} session debug
        </Button>
        {showDebug && session && (
          <Card className="mt-2 p-3 overflow-auto max-h-64">
            <p className="text-xs font-medium text-muted-foreground mb-1">session.user (what we get):</p>
            <pre className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap break-all">
              {JSON.stringify(session.user, null, 2)}
            </pre>
            <p className="text-xs text-muted-foreground mt-2">
              image URL: {session.user?.image ?? "(empty)"}
            </p>
          </Card>
        )}
      </div>
      <main className="p-4 max-w-lg mx-auto">
        <div className="space-y-3">
          <Card className="border-0 shadow-card overflow-hidden">
            <Link href="/matches/new" className="block">
              <CardContent className="flex items-center gap-4 p-4">
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/15 text-primary text-xl font-bold shrink-0">
                  +
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-semibold text-foreground">New Match</p>
                  <p className="text-sm text-muted-foreground">Create and start scoring</p>
                </div>
                <span className="text-muted-foreground">→</span>
              </CardContent>
            </Link>
          </Card>
          <Card className="border-0 shadow-card overflow-hidden">
            <Link href="/matches?status=IN_PROGRESS" className="block">
              <CardContent className="flex items-center gap-4 p-4">
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 text-amber-700 text-xl shrink-0">
                  ▶
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-semibold text-foreground">Resume Match</p>
                  <p className="text-sm text-muted-foreground">Continue live scoring</p>
                </div>
                <span className="text-muted-foreground">→</span>
              </CardContent>
            </Link>
          </Card>
          <Card className="border-0 shadow-card overflow-hidden">
            <Link href="/matches" className="block">
              <CardContent className="flex items-center gap-4 p-4">
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-secondary-foreground text-xl shrink-0">
                  ≡
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-semibold text-foreground">Match History</p>
                  <p className="text-sm text-muted-foreground">View past scorecards</p>
                </div>
                <span className="text-muted-foreground">→</span>
              </CardContent>
            </Link>
          </Card>
        </div>

        <nav className="mt-8 pt-6 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Manage</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12" asChild>
              <Link href="/players">Players</Link>
            </Button>
            <Button variant="outline" className="flex-1 h-12" asChild>
              <Link href="/teams">Teams</Link>
            </Button>
          </div>
        </nav>
      </main>

      {/* My profile sheet – open when clicking name */}
      <Sheet open={showProfileSheet} onOpenChange={setShowProfileSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>My profile</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {/* Profile */}
            <div className="flex flex-col items-center text-center">
              {session.user?.image && !avatarError ? (
                <img
                  src={session.user?.image ?? ""}
                  alt={session.user?.name || "User"}
                  width={80}
                  height={80}
                  className="rounded-full border-2 border-border object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex items-center justify-center w-20 h-20 rounded-full border-2 border-border bg-muted text-2xl font-semibold text-muted-foreground">
                  {session.user?.name?.slice(0, 2).toUpperCase() ?? "?"}
                </span>
              )}
              <h2 className="mt-3 text-xl font-semibold text-foreground">{session.user?.name}</h2>
              {session.user?.email && (
                <p className="text-sm text-muted-foreground">{session.user.email}</p>
              )}
            </div>

            {/* Stats (when linked to a player) */}
            {playerId ? (
              <>
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-foreground mb-3">My stats</h3>
                  {profileStatsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : profileStats ? (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-sm font-medium text-muted-foreground">Matches played</p>
                        <p className="text-2xl font-bold text-cricket-green">{profileStats.matchesPlayed}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs font-medium text-muted-foreground">Batting</p>
                          <p className="text-lg font-semibold">{profileStats.batting.runs} runs</p>
                          <p className="text-xs text-muted-foreground">
                            Avg {profileStats.batting.average ?? "—"} · SR {profileStats.batting.strikeRate ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {profileStats.batting.fours}×4 · {profileStats.batting.sixes}×6 · {profileStats.batting.fifties} 50s · {profileStats.batting.hundreds} 100s
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs font-medium text-muted-foreground">Bowling</p>
                          <p className="text-lg font-semibold">{profileStats.bowling.wickets} wkts</p>
                          <p className="text-xs text-muted-foreground">
                            Econ {profileStats.bowling.economy ?? "—"} · Avg {profileStats.bowling.average ?? "—"}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={playerId ? `/players/${playerId}` : "/players"} onClick={() => setShowProfileSheet(false)}>
                          View full player page →
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No stats yet. Play a match to see your stats here.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground border-t pt-4">Your account is not linked to a player yet. Stats will appear here after your next login.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cricket-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
