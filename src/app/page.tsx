"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="page-header flex items-center justify-center gap-3">
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
      </header>
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
    </div>
  );
}
