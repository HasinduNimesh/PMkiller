import { describe, expect, it } from "vitest";
import { computeCpm } from "./cpm";

describe("computeCpm", () => {
  it("identifies the critical path", () => {
    const result = computeCpm([
      { id: "A", durationDays: 3, predecessorIds: [] },
      { id: "B", durationDays: 5, predecessorIds: ["A"] },
      { id: "C", durationDays: 2, predecessorIds: ["A"] },
      { id: "D", durationDays: 4, predecessorIds: ["B", "C"] },
    ]);

    expect(result.hasCycle).toBe(false);
    expect(result.projectDuration).toBe(12);
    expect(result.criticalPathIds.sort()).toEqual(["A", "B", "D"]);
    const c = result.tasks.find((t) => t.id === "C")!;
    expect(c.slack).toBe(3);
  });

  it("detects cycles", () => {
    const result = computeCpm([
      { id: "A", durationDays: 1, predecessorIds: ["B"] },
      { id: "B", durationDays: 1, predecessorIds: ["A"] },
    ]);
    expect(result.hasCycle).toBe(true);
  });
});
