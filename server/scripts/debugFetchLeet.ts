import { fetchLeetCodePotd } from '../src/services/potdSources';

async function main(){
  try{
    const p = await fetchLeetCodePotd();
    console.log('LEET:', p);
  }catch(e:any){
    console.error('ERR', e?.message || e);
    process.exit(1);
  }
}

main();
