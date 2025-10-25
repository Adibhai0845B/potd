import mongoose from 'mongoose';
import GfgPotdMap from '../src/models/GfgPotdMap';

async function main() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/potd-dev';
  await mongoose.connect(MONGO_URI);
  const article = process.argv[2] || 'problem-of-the-day';
  const problem = process.argv[3];
  if (!problem) {
    console.error('Usage: seedGfgMapping <articleSlug> <problemSlug>');
    process.exit(2);
  }
  const doc = await (GfgPotdMap as any).findOneAndUpdate({ articleSlug: article }, { articleSlug: article, problemSlug: problem, title: '' }, { upsert: true, new: true });
  console.log('Upserted mapping:', doc);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
