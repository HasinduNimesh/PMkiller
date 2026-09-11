import { describe, expect, it } from "vitest";
import { projectKeyFromName } from "./validators";

describe("projectKeyFromName", () => {
  it("builds initials from words", () => {
    expect(projectKeyFromName("Web App")).toBe("WA");
    expect(projectKeyFromName("Project Manager")).toBe("PM");
  });

  it("falls back for single tokens", () => {
    expect(projectKeyFromName("Website")).toBe("W");
    expect(projectKeyFromName("123")).toBe("1");
    expect(projectKeyFromName("!!!")).toBe("PRJ");
  });
});
