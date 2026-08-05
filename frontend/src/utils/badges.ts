/**
 * Badge presentation. Keys match the backend's BADGE_KEYS; human labels are
 * localized via i18n (`app.gamification.badges.<key>`), while the emoji lives
 * here so the overlay and the progress tab render badges identically.
 */

export const BADGE_EMOJI: Record<string, string> = {
  first_cook: '🍳',
  cook_10: '👨‍🍳',
  cook_25: '🥘',
  cook_50: '⭐',
  cook_100: '🏅',
  streak_3: '🔥',
  streak_7: '🔥',
  streak_30: '🏆',
  first_photo: '📸',
  distinct_5: '🌍',
  distinct_10: '🗺️',
  distinct_25: '🧭',
  night_owl: '🦉',
  weekend_chef: '🌿',
  timer_first: '⏱️',
  timer_10: '⏰',
  same_recipe_3: '❤️',
};

/** All badge keys in display order (mirrors the backend launch set). */
export const ALL_BADGE_KEYS = [
  'first_cook', 'cook_10', 'cook_25', 'cook_50', 'cook_100',
  'streak_3', 'streak_7', 'streak_30',
  'first_photo', 'distinct_5', 'distinct_10', 'distinct_25',
  'night_owl', 'weekend_chef',
  'timer_first', 'timer_10',
  'same_recipe_3',
];

export function badgeEmoji(key: string): string {
  return BADGE_EMOJI[key] ?? '🥇';
}
