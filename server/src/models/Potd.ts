import mongoose, { Schema } from "mongoose";
const potdSchema=new Schema({
  date: { type: String },
  leetcode: { title: String, slug: String },
  gfg: { title: String, slug: String }
}, { timestamps: true });

potdSchema.index({ date: 1 }, { unique: true });

export default mongoose.model("Potd", potdSchema);
