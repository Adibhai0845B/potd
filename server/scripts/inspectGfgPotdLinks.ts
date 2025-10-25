import axios from 'axios';
import * as cheerio from 'cheerio';

async function main(){
  const url = 'https://www.geeksforgeeks.org/problem-of-the-day/';
  const html = (await axios.get(url, {headers: { 'User-Agent': 'Mozilla/5.0' }, timeout:15000, validateStatus: ()=>true})).data;
  const $ = cheerio.load(html);
  const found: string[] = [];
  $('a[href]').each((_i, el)=>{
    const href = ($(el).attr('href')||'').toString();
    if(!href) return;
    if(/geeksforgeeks.org/.test(href) || /\/problems\//.test(href) || /\/practice\//.test(href)){
      found.push(href.trim());
    }
  });
  console.log('Found links:', found.length);
  console.log([...new Set(found)].slice(0,200).join('\n'));
}
main().catch(e=>{console.error(e);process.exit(1)});
