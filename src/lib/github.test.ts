import { describe, expect, it } from "vitest";
import { extractIssueKeys, normalizeGithubRepo, verifyGithubSignature } from "./github";
import { createHmac } from "crypto";

describe("extractIssueKeys", () => {
  it("finds keys in title and body", () => {
    const keys = extractIssueKeys("Fix WEB-12 and WEB-15: login crash\n\nCloses WEB-12");
    expect(keys.sort()).toEqual(["WEB-12", "WEB-15"]);
  });

  it("scopes to project key when provided", () => {
    expect(extractIssueKeys("WEB-3 and API-9", "WEB")).toEqual(["WEB-3"]);
  });
});

describe("normalizeGithubRepo", () => {
  it("accepts owner/repo and URLs", () => {
    expect(normalizeGithubRepo("acme/website")).toBe("acme/website");
    expect(normalizeGithubRepo("https://github.com/Acme/Website.git")).toBe("acme/website");
  });
});

describe("verifyGithubSignature", () => {
  it("validates sha256 HMAC", () => {
    const secret = "test-secret";
    const body = '{"ok":true}';
    const sig = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
    expect(verifyGithubSignature(body, sig, secret)).toBe(true);
    expect(verifyGithubSignature(body, "sha256=deadbeef", secret)).toBe(false);
  });
});
