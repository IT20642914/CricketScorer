import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MatchModel, PlayerModel } from "@/lib/models";
import { runsFromBall, ballCounts } from "@/lib/engine";
import type { BallEvent, RulesConfig } from "@/lib/types";
import { DEFAULT_RULES } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playerId } = await params;
    await connectDB();

    const player = await PlayerModel.findById(playerId).lean();
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    const matches = await MatchModel.find({
      status: { $in: ["IN_PROGRESS", "COMPLETED"] },
      $or: [{ playingXI_A: playerId }, { playingXI_B: playerId }],
    })
      .lean()
      .exec();

    const matchesPlayed = matches.length;

    let battingRuns = 0;
    let battingBalls = 0;
    let battingFours = 0;
    let battingSixes = 0;
    let battingInnings = 0;
    let battingDismissals = 0;
    const runsPerInnings: number[] = [];

    let bowlingWickets = 0;
    let bowlingRunsConceded = 0;
    let bowlingBalls = 0;

    for (const match of matches) {
      const rules: RulesConfig = {
        ...DEFAULT_RULES,
        ...(match.rulesConfig ?? {}),
      };
      const inningsList = match.innings ?? [];

      for (const innings of inningsList) {
        const events: BallEvent[] = innings.events ?? [];

        const battingTeamId = innings.battingTeamId;
        const bowlingTeamId = innings.bowlingTeamId;
        const defaultBatOrder =
          match.teamAId === battingTeamId ? match.playingXI_A ?? [] : match.playingXI_B ?? [];
        const batOrder = (innings.battingOrderOverride?.length
          ? innings.battingOrderOverride
          : defaultBatOrder) as string[];
        const bowlOrder =
          match.teamAId === bowlingTeamId ? match.playingXI_A ?? [] : match.playingXI_B ?? [];

        const playerBatted = batOrder.includes(playerId);
        const playerBowled = bowlOrder.includes(playerId);

        if (playerBatted) {
          let runsThisInnings = 0;
          let facedBall = false;
          for (const e of events) {
            if (e.strikerId !== playerId) continue;
            const batRuns = e.runsOffBat ?? 0;
            battingRuns += batRuns;
            runsThisInnings += batRuns;
            const countsAsBall =
              !e.extras?.type || (e.extras.type !== "WD" && e.extras.type !== "NB");
            if (countsAsBall) {
              battingBalls += 1;
              facedBall = true;
            }
            if (batRuns === 4) battingFours += 1;
            if (batRuns === 6) battingSixes += 1;
            if (e.wicket?.batterOutId === playerId) battingDismissals += 1;
          }
          if (facedBall) {
            battingInnings += 1;
            runsPerInnings.push(runsThisInnings);
          }
        }

        if (playerBowled) {
          for (const e of events) {
            if (e.bowlerId !== playerId) continue;
            bowlingRunsConceded += runsFromBall(e);
            if (ballCounts(e, rules)) bowlingBalls += 1;
            if (e.wicket) bowlingWickets += 1;
          }
        }
      }
    }

    const battingAverage =
      battingDismissals > 0 ? Math.round((battingRuns / battingDismissals) * 100) / 100 : null;
    const battingStrikeRate =
      battingBalls > 0 ? Math.round((battingRuns / battingBalls) * 100 * 100) / 100 : null;
    const fifties = runsPerInnings.filter((r) => r >= 50 && r < 100).length;
    const hundreds = runsPerInnings.filter((r) => r >= 100).length;

    const bowlingOvers = bowlingBalls > 0 ? bowlingBalls / 6 : 0;
    const bowlingEconomy =
      bowlingOvers > 0 ? Math.round((bowlingRunsConceded / bowlingOvers) * 100) / 100 : null;
    const bowlingAverage =
      bowlingWickets > 0
        ? Math.round((bowlingRunsConceded / bowlingWickets) * 100) / 100
        : null;

    const batting = {
      runs: battingRuns,
      balls: battingBalls,
      innings: battingInnings,
      dismissals: battingDismissals,
      average: battingAverage,
      strikeRate: battingStrikeRate,
      fours: battingFours,
      sixes: battingSixes,
      fifties,
      hundreds,
    };

    const bowling = {
      wickets: bowlingWickets,
      runsConceded: bowlingRunsConceded,
      balls: bowlingBalls,
      economy: bowlingEconomy,
      average: bowlingAverage,
    };

    return NextResponse.json({
      matchesPlayed,
      batting,
      bowling,
      runsPerInnings,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch player stats" }, { status: 500 });
  }
}
