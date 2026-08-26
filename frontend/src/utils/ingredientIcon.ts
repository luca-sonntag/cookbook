import { apiUrl } from '../api';

/**
 * Returns the public image URL for a canonical ingredient icon (e.g. "onion" -> /api/ingredient-icons/onion.webp).
 * Prioritizes English baseName (e.g. "onion", "rolled_oat", "egg", "butter"), falls back to canonicalId.
 */
export function getIngredientIconUrl(baseName?: string | null, canonicalId?: string | null): string | null {
  const target = baseName || canonicalId;
  if (!target) return null;
  const clean = target.trim().toLowerCase().replace(/\s+/g, '_');
  return apiUrl(`/api/ingredient-icons/${clean}.webp`);
}
