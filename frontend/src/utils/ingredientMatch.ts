// Helpers for deciding whether a step's instruction text mentions an ingredient.
//
// Per-step ingredient lists are computed at runtime by matching ingredient names
// against the step text — there is no stored association. The naive approach
// (substring `includes()`) conflated short names with longer ones (e.g. "Ei"
// matching inside "Eigelb"/"Eiweiß") and duplicated entries. These helpers use
// word-boundary matching instead, while still allowing German inflection suffixes
// so plurals ("Zwiebel" → "Zwiebeln", "Eigelb" → "Eigelbe") keep matching.

const BOUNDARY = `[\\s.,:;!?()\\[\\]{}'"\\-\\/]`;

/**
 * Whether `text` mentions `term` as a standalone word.
 *
 * Word boundaries ensure a short term like "Ei" never matches inside a longer
 * word such as "Eigelb" or "Eiweiß". Terms of 4+ characters may carry a short
 * trailing inflection suffix (up to 2 letters) so German plurals still match;
 * shorter terms require an exact word match.
 */
export function textMentionsTerm(term: string | undefined | null, text: string): boolean {
  if (!term || !text) return false;
  const trimmed = term.trim();
  if (trimmed.length < 2) return false;

  const escaped = trimmed.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const suffix = trimmed.length >= 4 ? `[\\p{L}]{0,2}` : '';

  try {
    const regex = new RegExp(`(?<=^|${BOUNDARY})${escaped}${suffix}(?=$|${BOUNDARY})`, 'iu');
    return regex.test(text);
  } catch {
    // Extremely old engines without lookbehind/unicode support: fall back to a
    // case-insensitive substring test rather than throwing.
    return text.toLowerCase().includes(trimmed.toLowerCase());
  }
}
