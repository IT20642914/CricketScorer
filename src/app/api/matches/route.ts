import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MatchModel } from "@/lib/models";
import { createMatchSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const query = status ? { status } : {};
    const matches = await MatchModel.find(query).sort({ date: -1 }).lean();
    return NextResponse.json(matches);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createMatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    await connectDB();
    const match = await MatchModel.create({
      ...parsed.data,
status: parsed.data.status ?? "SETUP",
  innings: parsed.data.innings ?? [],
      _id: new (await import("mongoose")).Types.ObjectId().toString(),
    });
    return NextResponse.json(match.toObject());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}
