import { describe, expect, it } from "vitest";
import { hashApiToken, isPersonalApiToken, mintApiToken } from "@/lib/api-tokens";

describe("api tokens", () => {
  it("mints pmk_ tokens with stable hashes", () => {
    const a = mintApiToken();
    expect(isPersonalApiToken(a.token)).toBe(true);
    expect(a.tokenHash).toBe(hashApiToken(a.token));
    expect(a.prefix.length).toBeGreaterThanOrEqual(8);
    expect(a.token.startsWith(a.prefix)).toBe(true);
  });

  it("rejects non-personal secrets", () => {
    expect(isPersonalApiToken("shared-secret")).toBe(false);
  });
});
