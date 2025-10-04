import mongoose, { Schema, Types } from "mongoose";

const completionSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", index: true },
  date: { type: String, index: true }, // YYYY-MM-DD
  site: { type: String, enum: ["leetcode", "gfg"] },
  problemSlug: String,
  problemTitle: String,
  awarded: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

completionSchema.index({ userId: 1, date: 1, site: 1 }, { unique: true });

export default mongoose.model("Completion", completionSchema);
