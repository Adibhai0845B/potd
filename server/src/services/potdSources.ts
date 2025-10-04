import axios from "axios";
import * as cheerio from "cheerio";

export async function fetchLeetCodePotd() {
  const url = "https://leetcode.com/graphql";
  const payload = {
    query: `
      query questionOfToday {
        activeDailyCodingChallengeQuestion {
          date
          link
          question { title titleSlug }
        }
      }
    `
  };
  const res = await axios.post(url, payload, {
    headers: {
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
        } catch {}
        if (slug) return { title, slug };
      }
    } catch {}
  }
  throw new Error("GFG POTD not found");
}
