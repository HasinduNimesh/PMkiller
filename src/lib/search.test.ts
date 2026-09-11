import { describe, expect, it } from "vitest";
import { rankIssueSearchHits } from "./search";

describe("rankIssueSearchHits", () => {
  const hits = [
    { id: "1", issueKey: "API-12", title: "WEB docs" },
    { id: "2", issueKey: "WEB-1", title: "Login" },
    { id: "3", issueKey: "WEB-12", title: "Auth redirect" },
    { id: "4", issueKey: "MOB-3", title: "Fix WEB-12 mention in copy" },
  ];

  it("prefers exact issue key", () => {
    const ranked = rankIssueSearchHits(hits, "WEB-12");
    expect(ranked[0]?.issueKey).toBe("WEB-12");
  });

  it("prefers key prefix over title match", () => {
    const ranked = rankIssueSearchHits(hits, "WEB");
    expect(ranked[0]?.issueKey.startsWith("WEB")).toBe(true);
    expect(ranked.map((h) => h.issueKey)).toContain("MOB-3");
    expect(ranked.findIndex((h) => h.issueKey === "MOB-3")).toBeGreaterThan(
      ranked.findIndex((h) => h.issueKey.startsWith("WEB")),
    );
  });
});
