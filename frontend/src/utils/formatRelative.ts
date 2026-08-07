/**
 * Formats an ISO timestamp as a short relative string in the given language.
 * e.g. "heute", "gestern", "vor 3 Tagen", "vor 2 Monaten" (DE) /
 *      "today", "yesterday", "3 days ago", "2 months ago" (EN).
 */
export function formatRelative(iso: string, language: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const dayMs = 86400000;
  const days = Math.floor(diffMs / dayMs);

  const isDe = language.startsWith('de');

  if (days <= 0) {
    const hours = Math.floor(diffMs / 3600000);
    if (hours < 1) return isDe ? 'gerade eben' : 'just now';
    if (hours < 24) return isDe ? `vor ${hours} Std.` : `${hours}h ago`;
    return isDe ? 'heute' : 'today';
  }
  if (days === 1) return isDe ? 'gestern' : 'yesterday';
  if (days < 7) return isDe ? `vor ${days} Tagen` : `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return isDe ? `vor ${weeks} Woche${weeks > 1 ? 'n' : ''}` : `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return isDe ? `vor ${months} Monat${months > 1 ? 'en' : ''}` : `${months} month${months > 1 ? 's' : ''} ago`;
  }
  const years = Math.floor(days / 365);
  return isDe ? `vor ${years} Jahr${years > 1 ? 'en' : ''}` : `${years} year${years > 1 ? 's' : ''} ago`;
}
