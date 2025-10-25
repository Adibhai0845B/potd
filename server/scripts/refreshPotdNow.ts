import mongoose from 'mongoose';
import { refreshPotdOnce } from '../src/jobs/potdJob';

async function main(){
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/potd-dev';
  await mongoose.connect(MONGO_URI);
  try{
    const r = await refreshPotdOnce();
    console.log('Refreshed POTD:', r);
  }catch(e:any){
    console.error('Refresh failed:', e?.message || e);
    process.exitCode = 1;
  }finally{
    await mongoose.disconnect();
  }
}

main();
