import { apiUrl } from '../api';

/**
 * Returns the public image URL for a canonical ingredient icon (e.g. bls_f110100 -> /api/ingredient-icons/bls_f110100.webp).
 * Returns null if no canonicalId is provided.
 */
export function getIngredientIconUrl(canonicalId?: string | null): string | null {
  if (!canonicalId) return null;
  const cleanId = canonicalId.trim().toLowerCase();
  return apiUrl(`/api/ingredient-icons/${cleanId}.webp`);
}
