export const POINTS_PER_LEVEL = 200;

export function computeLevel(totalPoints: number): number {
  return Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
}
