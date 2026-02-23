import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PlayerModel } from "@/lib/models";
import { playerSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";
    const query = typeof search === "string" && search.trim()
      ? { fullName: new RegExp(search.trim(), "i") }
      : {};
    const players = await PlayerModel.find(query).lean();
    return NextResponse.json(players);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = playerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    await connectDB();
    const player = await PlayerModel.create({
      ...parsed.data,
      _id: new (await import("mongoose")).Types.ObjectId().toString(),
    });
    return NextResponse.json(player.toObject());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}
