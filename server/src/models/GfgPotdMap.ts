import mongoose, { Schema } from "mongoose";

export interface IGfgPotdMap {
  articleSlug: string;
  problemSlug: string;
  title?: string;
  date?: string;
  createdAt?: Date;
}

const GfgPotdMapSchema = new Schema<IGfgPotdMap>(
  {
    articleSlug: { type: String, required: true, unique: true, index: true },
    problemSlug: { type: String, required: true },
    title: { type: String },
    date: { type: String },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

// Use existing model if already compiled (prevents overwrite errors in dev hot reload)
const Model = mongoose.models.GfgPotdMap || mongoose.model<IGfgPotdMap>("GfgPotdMap", GfgPotdMapSchema);

export default Model;
