import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { decryptSecret, encryptSecret, isEncryptedSecret } from "@/lib/secret-crypto";

describe("secret-crypto", () => {
  const prev = process.env.AUTH_SECRET;

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-for-unit-tests-only";
  });

  afterEach(() => {
    process.env.AUTH_SECRET = prev;
  });

  it("round-trips plaintext", () => {
    const enc = encryptSecret("gho_example_token");
    expect(isEncryptedSecret(enc)).toBe(true);
    expect(decryptSecret(enc)).toBe("gho_example_token");
  });

  it("passes through legacy plaintext", () => {
    expect(decryptSecret("gho_legacy")).toBe("gho_legacy");
    expect(isEncryptedSecret("gho_legacy")).toBe(false);
  });
});
