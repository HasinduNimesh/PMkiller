/** Ideal-line + current remaining marker for a sprint burndown chart (0–1 coords). */
export function burndownProgress(input: {
  startDate: Date | null;
  endDate: Date | null;
  totalPoints: number;
  remainingPoints: number;
  now?: Date;
}): {
  progressX: number;
  remainingY: number;
  ahead: boolean;
} | null {
  const { startDate, endDate, totalPoints, remainingPoints } = input;
  if (!startDate || !endDate || totalPoints <= 0) return null;

  const span = endDate.getTime() - startDate.getTime();
  if (span <= 0) return null;

  const now = input.now ?? new Date();
  const progressX = Math.min(1, Math.max(0, (now.getTime() - startDate.getTime()) / span));
  const remainingY = Math.min(1, Math.max(0, remainingPoints / totalPoints));
  const idealY = 1 - progressX;
  return {
    progressX,
    remainingY,
    ahead: remainingY <= idealY,
  };
}
