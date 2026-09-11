/** Rank issue search hits so exact / prefix key matches float above title matches. */
export function rankIssueSearchHits<
  T extends { id: string; issueKey: string; title: string },
>(hits: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return hits;

  const scored = hits.map((hit) => {
    const key = hit.issueKey.toLowerCase();
    const title = hit.title.toLowerCase();
    let score = 0;
    if (key === q) score = 300;
    else if (key.startsWith(q)) score = 200;
    else if (key.includes(q)) score = 100;
    else if (title.includes(q)) score = 50;
    return { hit, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.hit);
}
