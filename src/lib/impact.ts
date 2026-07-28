/**
 * Rough, documented assumptions used to turn a trip's distance into the "money saved" /
 * "CO2 saved" numbers shown on the profile — see docs/07-decisiones-fase-5.md. Not a
 * rigorous cost or carbon-accounting model, just enough to make the gamification
 * numbers move in the right direction as trips complete.
 */
export const ALTERNATIVE_COST_PER_KM_EUR = 0.25;
export const CO2_SAVED_PER_KM_KG = 0.12;

/** How much cheaper this trip was than the assumed cost of driving/getting there alone. */
export function estimateMoneySavedEur(distanceKm: number, pricePaidEur: number): number {
  return Math.max(0, distanceKm * ALTERNATIVE_COST_PER_KM_EUR - pricePaidEur);
}

/** CO2 avoided by not taking a separate solo car trip over the same distance. */
export function estimateCo2SavedKg(distanceKm: number): number {
  return distanceKm * CO2_SAVED_PER_KM_KG;
}
