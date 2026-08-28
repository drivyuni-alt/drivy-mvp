/**
 * Heuristic phone-number detector for chat messages, so drivers/passengers can't route
 * around the platform onto WhatsApp.
 *
 * Two passes, because blocking only literal digits was trivial to evade:
 *
 * 1. **Digit run** — 9+ digits with an optional separator between each one, which covers
 *    "612345678", "612 345 678", "612-345-678", the spaced-out "6 1 2 3 4 5 6 7 8", and
 *    now also symbol-padded variants like "612#345#678" or "612_345_678". 9 is the length
 *    of a Spanish phone number; anything carrying a country code is longer and still caught.
 *
 * 2. **Spelled-out digits** — Spanish number words are first rewritten to digits, then
 *    pass 1 runs again. This catches "seis uno dos tres cuatro cinco seis siete ocho" and
 *    mixed forms like "612 tres cuatro cinco 678", which the previous digits-only pattern
 *    let through untouched.
 *
 * `/` and `:` are deliberately NOT separators, so dates ("25/07/2026") and times ("20:15")
 * don't false-positive. A dash-separated date ("25-07-2026") is 8 digits, under the
 * threshold. Rewriting number words can in theory trip someone counting out loud past nine
 * items in a row — rare enough to be worth the trade.
 *
 * Still a heuristic, not a guarantee: someone determined can spell numbers in another
 * language, use look-alike glyphs, or send a photo of the number. The goal is real friction
 * against the common case, not airtight moderation.
 *
 * Mirrored server-side in supabase/migrations/0018_phone_detection_spelled_digits.sql —
 * that trigger is the actual enforcement (messages are inserted straight from the browser
 * client via RLS, not through a Server Action, so a client-only check can be bypassed by
 * calling the Supabase API directly). Keep both in sync if you touch the threshold.
 */
const PHONE_NUMBER_PATTERN = /\d(?:[\s.\-_#*·•]?\d){8,}/;

const DIGIT_WORDS: Record<string, string> = {
  cero: "0",
  uno: "1",
  una: "1",
  dos: "2",
  tres: "3",
  cuatro: "4",
  cinco: "5",
  seis: "6",
  siete: "7",
  ocho: "8",
  nueve: "9",
};

const DIGIT_WORD_PATTERN = new RegExp(`\\b(${Object.keys(DIGIT_WORDS).join("|")})\\b`, "gi");

function spelledDigitsToNumbers(text: string): string {
  return text.replace(DIGIT_WORD_PATTERN, (word) => DIGIT_WORDS[word.toLowerCase()] ?? word);
}

export function containsPhoneNumber(text: string): boolean {
  return PHONE_NUMBER_PATTERN.test(text) || PHONE_NUMBER_PATTERN.test(spelledDigitsToNumbers(text));
}

export const PHONE_NUMBER_BLOCKED_MESSAGE =
  "Por seguridad, no se pueden compartir números de teléfono en el chat.";
