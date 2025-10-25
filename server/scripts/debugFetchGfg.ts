import{fetchGfgSubmissions}from'../src/services/gfgSubmissions';
async function main(){
 const username = process.argv[2] || 'adityakrishnpmib';
try{
  const subs = await fetchGfgSubmissions(username);
console.log('SUBS:', subs.length);
for(const s of subs) console.log('-', s.slug, s.timestamp ? `ts=${s.timestamp}` : '');
  }catch(e:any){
    console.error('ERR', e?.message || e);
    process.exit(1);
  }
}
main();
