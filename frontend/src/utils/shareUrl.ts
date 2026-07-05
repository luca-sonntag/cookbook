/**
 * Extract the first http(s) URL from arbitrary shared text (e.g. the payload
 * of a Web Share Target or an Android ACTION_SEND intent), stripping trailing
 * punctuation. Returns null when no URL is present.
 */
export function parseSharedUrl(text: string): string | null {
  const match = text.match(/(https?:\/\/[^\s]+)/i);
  if (!match) return null;
  return match[1].replace(/[.,;:!?)]+$/, '');
}
