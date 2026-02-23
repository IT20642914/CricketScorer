import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MatchModel } from "@/lib/models";
import { matchSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const match = await MatchModel.findById(id).lean();
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    return NextResponse.json(match);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = matchSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    await connectDB();
    const match = await MatchModel.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true }
    ).lean();
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    return NextResponse.json(match);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update match" }, { status: 500 });
  }
}
