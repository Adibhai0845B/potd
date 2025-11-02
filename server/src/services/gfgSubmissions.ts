import axios from "axios";
import * as cheerio from "cheerio";

export async function fetchGfgSubmissions(username: string) {
  const user = (username || "").toString().trim();
  if (!user) return [];
  const url = `https://auth.geeksforgeeks.org/user/${user}/practice/`;
  const res = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "en-US,en;q=0.9",
    },
    timeout: 15000,
    validateStatus: () => true,
  });
  const html = res.data;
  try {
    const m = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    if (m && m[1]) {
      const json = JSON.parse(m[1]);
      const userSubs = json?.props?.pageProps?.userSubmissionsInfo;
      if (userSubs && typeof userSubs === "object") {
        const submissions: { slug: string; status: string; timestamp?: number }[] = [];
        for (const diffKey of Object.keys(userSubs)) {
          const group = userSubs[diffKey] || {};
          for (const id of Object.keys(group)) {
            const item = (group as any)[id];
            if (item && item.slug && item.status === "Accepted") {
              submissions.push({ slug: item.slug, status: "Accepted" });
            }
          }
        }
        console.log(`[GFG] Parsed __NEXT_DATA__ for user=${user}, subs=${submissions.map(s => s.slug).join(",")}`);
        return submissions;
      }
    }
  } catch (e: any) {
    console.warn("[GFG] Failed to parse __NEXT_DATA__ JSON", e?.message || e);
  }
    const $ = cheerio.load(html);
  const submissions: { slug: string; status: string; timestamp?: number }[] = [];
  $(".score_card_table tbody tr").each((_i, el) => {
    const tds = $(el).find("td");
    const status = $(tds[2]).text().trim();
    // some GFG pages may include a date column; try to extract it
    let ts: number | undefined;
    const dateText = $(tds[3]).text().trim();
    if (dateText) {
      const d = new Date(dateText);
      if (!isNaN(d.getTime())) ts = Math.floor(d.getTime() / 1000);
    }
    if (/accepted/i.test(status)) {
      const link = ($(tds[1]).find("a").attr("href") || "").toString();
      const patterns = [
        /problems\/([a-z0-9\-]+)\//i,
        /practice-problems\/([a-z0-9\-]+)\//i,
        /practice\/([a-z0-9\-]+)\//i,
        /(?:geeksforgeeks.org\/)?.*?\/([a-z0-9\-]+)\/?$/i,
      ];
      let slugFound: string | null = null;
      for (const p of patterns) {
        const mm = link.match(p);
        if (mm && mm[1]) {
          slugFound = mm[1];
          break;
        }
      }
      if (slugFound) {
        if (typeof ts === "number") submissions.push({ slug: slugFound, status: "Accepted", timestamp: ts });
        else submissions.push({ slug: slugFound, status: "Accepted" });
      }
    } else if (/wrong/i.test(status) || /failed/i.test(status)) {
      // Skip wrong/failed submissions
      return;
    }
  });
  return submissions;
}

