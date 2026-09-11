import { describe, expect, it } from "vitest";
import { isTaskSeverity, isTaskStatus, wouldRemoveLastAdmin } from "./org-guards";

describe("wouldRemoveLastAdmin", () => {
  it("blocks removing the sole admin", () => {
    expect(
      wouldRemoveLastAdmin({ memberRole: "ADMIN", adminCount: 1, nextRole: null }),
    ).toBe(true);
  });

  it("allows removing admin when another remains", () => {
    expect(
      wouldRemoveLastAdmin({ memberRole: "ADMIN", adminCount: 2, nextRole: null }),
    ).toBe(false);
  });

  it("blocks demoting the sole admin", () => {
    expect(
      wouldRemoveLastAdmin({ memberRole: "ADMIN", adminCount: 1, nextRole: "MEMBER" }),
    ).toBe(true);
  });

  it("allows non-admin removal", () => {
    expect(
      wouldRemoveLastAdmin({ memberRole: "MEMBER", adminCount: 1, nextRole: null }),
    ).toBe(false);
  });
});

describe("isTaskStatus / isTaskSeverity", () => {
  it("accepts valid enums", () => {
    expect(isTaskStatus("BACKLOG")).toBe(true);
    expect(isTaskStatus("TODO")).toBe(true);
    expect(isTaskStatus("NOPE")).toBe(false);
    expect(isTaskSeverity("HIGH")).toBe(true);
    expect(isTaskSeverity("URGENT")).toBe(false);
  });
});
