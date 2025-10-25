import axios from "axios";

export async function fetchLeetCodeSubmissions(username: string) {
  const user = (username || "").toString().trim();
  if (!user) return [];
  const url = "https://leetcode.com/graphql";
  const payload = {
    query: `
      query recentAcSubmissions($username: String!) {
        recentAcSubmissionList(username: $username, limit: 20) {
          id
          title
          titleSlug
          timestamp
        }
      }
    `,
    variables: { username },
  };
  const res = await axios.post(url, payload, {
    headers: {
      "Content-Type": "application/json",
      "Referer": `https://leetcode.com/${username}/`,
      "Origin": "https://leetcode.com",
    },
    timeout: 15000,
    validateStatus: () => true,
  });
  const list = res.data?.data?.recentAcSubmissionList || [];
  // Return array of { slug, status, timestamp }
  return list.map((item: any) => ({ slug: item.titleSlug, status: "Accepted", timestamp: item.timestamp }));
}
