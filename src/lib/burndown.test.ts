import { describe, expect, it } from "vitest";
import { burndownProgress } from "./burndown";

describe("burndownProgress", () => {
  const start = new Date("2026-09-01T00:00:00Z");
  const end = new Date("2026-09-11T00:00:00Z");

  it("returns null without dates or points", () => {
    expect(
      burndownProgress({
        startDate: null,
        endDate: end,
        totalPoints: 10,
        remainingPoints: 5,
      }),
    ).toBeNull();
    expect(
      burndownProgress({
        startDate: start,
        endDate: end,
        totalPoints: 0,
        remainingPoints: 0,
      }),
    ).toBeNull();
  });

  it("marks midpoint progress and ahead/behind vs ideal", () => {
    const mid = new Date("2026-09-06T00:00:00Z");
    const ahead = burndownProgress({
      startDate: start,
      endDate: end,
      totalPoints: 10,
      remainingPoints: 4,
      now: mid,
    });
    expect(ahead?.progressX).toBeCloseTo(0.5);
    expect(ahead?.remainingY).toBeCloseTo(0.4);
    expect(ahead?.ahead).toBe(true);

    const behind = burndownProgress({
      startDate: start,
      endDate: end,
      totalPoints: 10,
      remainingPoints: 8,
      now: mid,
    });
    expect(behind?.ahead).toBe(false);
  });
});
