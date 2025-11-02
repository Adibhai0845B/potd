import axios from "axios";
import * as cheerio from "cheerio";
import GfgPotdMap from "../models/GfgPotdMap";

export async function fetchLeetCodePotd() {
  const url = "https://leetcode.com/graphql";
  const payload={
    query:`
      query questionOfToday{
        activeDailyCodingChallengeQuestion {
          date
          link
          question { title titleSlug }
        }
      }
    `
  };
  const res = await axios.post(url,payload,{headers:{
      "Content-Type": "application/json",
      "Origin": "https://leetcode.com",
      "Referer": "https://leetcode.com"
    },
    validateStatus: () => true
  });
  const q = res.data?.data?.activeDailyCodingChallengeQuestion?.question;
  if (!q) throw new Error("LeetCode POTD not found");
  return { title: q.title as string, slug: q.titleSlug as string };
}

export async function fetchGfgPotd() {
  const pages = [
    "https://www.geeksforgeeks.org/problem-of-the-day/",
    "https://www.geeksforgeeks.org/tag/potd/",
    "https://www.geeksforgeeks.org/"
  ];
  for (const p of pages) {
    try {
      const html = await axios.get(p, {
        headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9" },
        timeout: 15000, validateStatus: () => true
      });
      const $ = cheerio.load(html.data);
      const candidates: string[] = [];
      $("a,button").each((_i, el) => {
        const text = ($(el).text() || "").trim();
        const href = $(el).attr("href") || "";
        if (!href) return;
        if (/problem of the day|potd/i.test(text)) candidates.push(href);
      });
      $("a[href]").each((_i, el) => {
        const href = $(el).attr("href") || "";
        if (/geeksforgeeks\.org\/[^/]+\/?$/.test(href) || /geeksforgeeks\.org\/problems\/[^/]+\/?/.test(href)) {
          candidates.push(href);
        }
      });
      const rx = /(https?:\/\/www\.geeksforgeeks\.org\/(?:problems\/)?[a-z0-9\-]+\/)/i;
      const m = html.data.match(rx);
      if (m) candidates.push(m[1]);

      const first = candidates.find((h) => /geeksforgeeks\.org/i.test(h));
      if (first) {
        const u = new URL(first, "https://www.geeksforgeeks.org/");
        const parts = u.pathname.split("/").filter(Boolean);
        const slug = parts[parts.length - 1];
        let title = "GFG POTD";
        try {
          const probHtml = await axios.get(u.toString(), { timeout: 15000, validateStatus: () => true });
          const $p = cheerio.load(probHtml.data);
          const h1 = $p("h1, h2").first().text().trim();
          if (h1) title = h1.replace(/\s*-\s*GeeksforGeeks\s*$/, "");
          const innerLinks: string[] = [];
          $p("a[href]").each((_i, el) => {
            const href = ($p(el).attr("href") || "").toString();
            if (!href) return;
            if (/\/problems\/[a-z0-9\-]+\//i.test(href) || /\/practice\/[a-z0-9\-]+\//i.test(href) || /geeksforgeeks\.org\/problems\/[a-z0-9\-]+\//i.test(href)) {
              innerLinks.push(href);
            }
          });
          if (innerLinks.length) {
            const chosen = String(innerLinks[0]);
            const uu = new URL(chosen, u.toString());
            const pparts = uu.pathname.split("/").filter(Boolean);
            const probSlug = pparts[pparts.length - 1];
            if (probSlug) return { title: title || "GFG POTD", slug: probSlug };
          }
        }catch(e){
          // ignore
}
        if(slug){
          try{
        const existing = await (GfgPotdMap as any).findOne({ articleSlug: slug }).exec();
         if(existing&&existing.problemSlug){
              return{title: existing.title||title, slug: existing.problemSlug };
          }
          }catch(err){
            }
          return { title, slug };
        }
      }
    } catch {}
  }
  throw new Error("GFG POTD not found");
}
