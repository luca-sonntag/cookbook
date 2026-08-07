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
  distinct_5: '🧭',
  distinct_10: '🗺️',
  distinct_25: '🌍',
  night_owl: '🦉',
  weekend_chef: '📅',
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

/**
 * One-off XP awarded the first time each badge is earned. This is the
 * display-side mirror of the backend's `gamification_config.badgeXp`
 * (DEFAULT_BADGE_XP). The backend is authoritative for the actual award; this
 * map only drives the progress tab's "reward" label so the two never drift.
 */
export const BADGE_XP: Record<string, number> = {
  first_cook: 50,
  cook_10: 150,
  cook_25: 300,
  cook_50: 500,
  cook_100: 1000,
  streak_3: 100,
  streak_7: 250,
  streak_30: 1000,
  first_photo: 75,
  distinct_5: 100,
  distinct_10: 250,
  distinct_25: 500,
  night_owl: 75,
  weekend_chef: 150,
  timer_first: 50,
  timer_10: 200,
  same_recipe_3: 100,
};
