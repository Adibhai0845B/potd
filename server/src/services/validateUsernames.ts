import axios from "axios";
import * as cheerio from "cheerio";

export async function validateLeetCodeUsername(username: string): Promise<boolean> {
  const user = (username || "").toString().trim();
  if (!user) return false;
  const url = "https://leetcode.com/graphql";
  const payload = {
    query: `
      query userPublicProfile($username: String!) {
        matchedUser(username: $username) {
          username
        }
      }
    `,
    variables: { username },
  };
  try {
    const res = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "Referer": `https://leetcode.com/${username}/`,
        "Origin": "https://leetcode.com",
      },
      timeout: 10000,
      validateStatus: () => true,
    });
    const matchedUser = res.data?.data?.matchedUser;
    return !!matchedUser;
  } catch (e: any) {
    console.warn("[LeetCode Validate] Error validating username", username, (e as any)?.message || e);
    return false;
  }
}

export async function validateGfgUsername(username: string): Promise<boolean> {
  const user = (username || "").toString().trim();
  if (!user) return false;
  const url = `https://auth.geeksforgeeks.org/user/${user}/practice/`;
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
      validateStatus: () => true,
    });
    if (res.status !== 200) return false;
    const html = res.data;
    const $ = cheerio.load(html);
    // Check if the page has the practice submissions table or user info
    const hasTable = $(".score_card_table").length > 0;
    const hasUserInfo = html.includes(`user/${user}`) && !html.includes("User not found");
    return hasTable || hasUserInfo;
  } catch (e: any) {
    console.warn("[GFG Validate] Error validating username", username, (e as any)?.message || e);
    return false;
  }
}
