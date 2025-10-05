import axios from "axios";
import * as cheerio from "cheerio";

// Fetch recent submissions for a GFG user by scraping their profile submissions page
export async function fetchGfgSubmissions(username: string) {
  const url = `https://auth.geeksforgeeks.org/user/${username}/practice/`;
  const res = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "en-US,en;q=0.9",
    },
    timeout: 15000,
    validateStatus: () => true,
  });
  const html = res.data;
  const $ = cheerio.load(html);
  const submissions: { slug: string; status: string }[] = [];
  $(".score_card_table tbody tr").each((_i, el) => {
    const tds = $(el).find("td");
    const status = $(tds[2]).text().trim();
    if (/accepted/i.test(status)) {
      const link = $(tds[1]).find("a").attr("href") || "";
      const slugMatch = link.match(/geeksforgeeks.org\/(?:problems\/)?([a-z0-9\-]+)\//i);
      if (slugMatch && slugMatch[1]) {
        submissions.push({ slug: slugMatch[1], status: "Accepted" });
      }
    }
  });
  return submissions;
}
