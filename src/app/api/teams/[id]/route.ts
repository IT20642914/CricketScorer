import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { TeamModel } from "@/lib/models";
import { teamSchema } from "@/lib/validations";

function canEditTeam(
  session: { user?: { playerId?: string; role?: string } } | null,
  team: { createdBy?: string } | null
): boolean {
  if (!session?.user) return false;
  if (session.user.role === "admin") return true;
  if (team?.createdBy && session.user.playerId && team.createdBy === session.user.playerId) return true;
  return false;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const team = await TeamModel.findById(id).lean();
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    return NextResponse.json(team);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    const existing = await TeamModel.findById(id).select("createdBy").lean();
    if (!existing) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (!canEditTeam(session, existing)) {
      return NextResponse.json(
        { error: "Only the team creator or an admin can edit this team" },
        { status: 403 }
      );
    }
    const body = await request.json();
    const parsed = teamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const team = await TeamModel.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true }
    ).lean();
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    return NextResponse.json(team);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    const existing = await TeamModel.findById(id).select("createdBy").lean();
    if (!existing) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (!canEditTeam(session, existing)) {
      return NextResponse.json(
        { error: "Only the team creator or an admin can delete this team" },
        { status: 403 }
      );
    }
    const result = await TeamModel.findByIdAndDelete(id);
    if (!result) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
