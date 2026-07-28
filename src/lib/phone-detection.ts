/**
 * Heuristic phone-number detector for chat messages: a contiguous run of 9+ digits,
 * allowing a single space/dot/dash between individual digits (so "612 345 678",
 * "612-345-678" and "612345678" all match, and evasion-by-spacing like "6 1 2 3 4 5 6
 * 7 8" still matches). 9 is the length of a Spanish phone number; anything with a
 * country code is longer and still caught.
 *
 * Deliberately excludes `/` and `:` from the allowed separators so dates
 * ("25/07/2026") and times ("20:15") don't false-positive. A dash-separated date
 * ("25-07-2026", 8 digits) stays under the 9-digit threshold too.
 *
 * This is a heuristic, not a guarantee — someone determined to evade it can still
 * break up digits with letters/emoji. The point is to add real friction to the common
 * case (pasting or typing a number normally), not to build airtight NLP moderation.
 *
 * Mirrored server-side in supabase/migrations/0014_reject_phone_numbers_in_chat.sql —
 * that trigger is the actual enforcement (messages are inserted directly by the browser
 * client, not a Server Action, so a client-only check here could be bypassed by calling
 * the Supabase API directly). Keep both patterns in sync if you change the threshold.
 */
const PHONE_NUMBER_PATTERN = /\d(?:[ .-]?\d){8,}/;

export function containsPhoneNumber(text: string): boolean {
  return PHONE_NUMBER_PATTERN.test(text);
}

export const PHONE_NUMBER_BLOCKED_MESSAGE =
  "Por seguridad, no se pueden compartir números de teléfono en el chat.";
