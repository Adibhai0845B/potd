import mongoose from 'mongoose';
import User from '../src/models/User';
import Potd from '../src/models/Potd';
import { recordCompletionAndAward } from '../src/services/award';

async function main(){
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/potd-dev';
  await mongoose.connect(MONGO_URI);
  try{
    const siteArg = process.argv[2] || 'gfg';
    const identifier = process.argv[3];
    if(!identifier){
      console.error('Usage: runAwardForUser <site> <gfgUsername|userId|email>');
      process.exit(2);
    }
    const site = siteArg === 'leetcode' ? 'leetcode' : 'gfg';
    let user = null as any;
  // try find by gfgUsername or leetcodeUsername or email; if identifier looks like an ObjectId, include _id
  const orClauses: any[] = [ { gfgUsername: identifier }, { leetcodeUsername: identifier }, { email: identifier } ];
  if (/^[a-f0-9]{24}$/i.test(identifier)) orClauses.push({ _id: identifier });
  user = await User.findOne({ $or: orClauses }).exec();
    if(!user){
      console.error('User not found for identifier:', identifier);
      process.exit(3);
    }
    const dateKey = new Date().toISOString().slice(0,10).replace(/-/g,'-');

    const potd = await Potd.findOne({}).sort({ createdAt: -1 }).exec();
    if(!potd){
      console.error('No POTD found in DB');
      process.exit(4);
    }

    const problem = site === 'gfg' ? potd.gfg : potd.leetcode;
    if(!problem || !problem.slug){
      console.error('POTD missing problem for site', site);
      process.exit(5);
    }

    console.log('Calling recordCompletionAndAward for user:', String(user._id), 'site=', site, 'problem=', problem);
    try{
      const res = await recordCompletionAndAward(String(user._id), site as any, { title: problem.title || '', slug: problem.slug || '' });
      console.log('Award result:', res);
    }catch(e:any){
      console.error('Award failed:', e?.message || e);
      process.exit(6);
    }
  }finally{
    await mongoose.disconnect();
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });
