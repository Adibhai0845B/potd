import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  email: { type: String, unique: true, index: true },
  username: String,
  passwordHash: String,
  coins: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastStreakDay: { type: String, default: "" },
  leetcodeUsername: { type: String, default: "" },
  gfgUsername: { type: String, default: "" }
}, { timestamps: true });

// API token for extension/background authenticated submissions
userSchema.add({
  apiToken: { type: String, default: "", index: true, sparse: true }
});
userSchema.add({
  resetToken: { type: String, index: true, sparse: true },
  resetTokenExpiry: { type: Number, default: 0 },
});

export default mongoose.model("User", userSchema);
