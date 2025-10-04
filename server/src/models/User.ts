import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  email: { type: String, unique: true, index: true },
  username: String,
  passwordHash: String,
  coins: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastStreakDay: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
