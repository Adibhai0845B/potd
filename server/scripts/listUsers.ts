import mongoose from 'mongoose';
import User from '../src/models/User';

async function main(){
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/potd-dev';
  await mongoose.connect(MONGO_URI);
  try{
const users = await User.find({}).limit(50).lean();
console.log('Total users in DB:', users.length);
    for(const u of users){
      console.log({ _id: String(u._id), email: u.email, username: u.username, leetcodeUsername: u.leetcodeUsername, gfgUsername: u.gfgUsername });
    }
  }finally{
    await mongoose.disconnect();
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });
