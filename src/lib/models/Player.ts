import mongoose, { Schema, model, models } from "mongoose";
import type { Player as IPlayer } from "@/lib/types";

const PlayerSchema = new Schema<IPlayer>(
  {
    fullName: { type: String, required: true },
    shortName: String,
    battingStyle: String,
    bowlingStyle: String,
    isKeeper: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PlayerModel = models.Player ?? model<IPlayer>("Player", PlayerSchema);
