import mongoose from 'mongoose';
import { fetchLeetCodeSubmissions } from '../src/services/leetcodeSubmissions';
import { fetchGfgSubmissions } from '../src/services/gfgSubmissions';
import Potd from '../src/models/Potd';
import { getTodayKey, normalizeSlug } from '../src/lib/date';

async function main(){
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/potd-dev';
  await mongoose.connect(MONGO_URI);
  const date = getTodayKey();
  console.log('Today key:', date);
  const potd = await Potd.findOne({ date }).lean();
  console.log('POTD from DB:', potd);

  const lcUser = 'adibhai0845R';
  const gfgUser = 'adityakrishnpmib';

  console.log(`\nFetching LeetCode subs for ${lcUser}...`);
  const lcSubs = await fetchLeetCodeSubmissions(lcUser);
  console.log('LeetCode subs count:', lcSubs.length);
  if (lcSubs.length) console.log('Top subs:', lcSubs.slice(0,5));

  if (potd?.leetcode?.slug) {
    const potdSlug = normalizeSlug('leetcode', potd.leetcode.slug);
    console.log('POTD leetcode slug (norm):', potdSlug);
    const found = lcSubs.find((s:any) => typeof s.slug === 'string' && normalizeSlug('leetcode', s.slug) === potdSlug && s.status === 'Accepted');
    console.log('LeetCode match found:', !!found, found || 'none');
    if (found && typeof found.timestamp === 'number') {
      const ts = found.timestamp as number;
      const matchToday = getTodayKey(undefined, new Date(ts*1000)) === date;
      console.log('LeetCode matched submission timestamp:', ts, '=> same day?', matchToday);
    }
  }

  console.log(`\nFetching GFG subs for ${gfgUser}...`);
  const gfgSubs = await fetchGfgSubmissions(gfgUser);
  console.log('GFG subs count:', gfgSubs.length);
  if (gfgSubs.length) console.log('Top subs:', gfgSubs.slice(0,10).map((s:any)=>s.slug));

  if (potd?.gfg?.slug) {
    const potdSlug = normalizeSlug('gfg', potd.gfg.slug);
    console.log('POTD gfg slug (norm):', potdSlug);
    const found = gfgSubs.find((s:any) => typeof s.slug === 'string' && normalizeSlug('gfg', s.slug) === potdSlug && s.status === 'Accepted');
    console.log('GFG match found (exact norm):', !!found, found || 'none');
    if (!found) {
      // permissive checks
      const hits = gfgSubs.filter((s:any)=> typeof s.slug === 'string' && (potdSlug.includes(normalizeSlug('gfg', s.slug)) || normalizeSlug('gfg', s.slug).includes(potdSlug) || potdSlug.endsWith(normalizeSlug('gfg', s.slug)) || normalizeSlug('gfg', s.slug).endsWith(potdSlug)));
      console.log('GFG permissive hits:', hits.map((h:any)=>h.slug));
    }
  }

  await mongoose.disconnect();
}

main().catch(e=>{console.error(e); process.exit(1);});
