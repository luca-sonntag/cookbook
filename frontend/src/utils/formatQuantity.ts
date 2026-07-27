// Single source of truth for rendering ingredient amounts.
//
// Historically two independent formatters existed — one in the recipe view
// (useRecipeScaling) that snapped count values onto fractions but fell back to
// raw decimals, and one in the shopping list that only ever printed decimals.
// The result was the same ingredient showing "¾" in one place and "0.9" in
// another. This util unifies both so every surface renders amounts the same way.
//
// Returns only the numeric part (no unit); callers render the unit separately.

const WEIGHT_VOLUME_UNITS = ['g', 'ml', 'kg', 'l', 'gramm', 'milliliter', 'liter', 'kilogramm'];

/**
 * Format an already-scaled amount into a human-friendly string.
 *
 * Rules:
 *  - Weight/volume units (g, ml, kg, l, …) or large values (>= 20): plain numbers —
 *    whole number when integer or >= 10, otherwise one decimal place.
 *  - Count / kitchen-spoon units (Stück, EL, TL, no unit): snapped to the nearest
 *    quarter and rendered as a whole number or mixed fraction — never a raw decimal
 *    like "0.9" or "1.4".
 */
export function formatQuantity(amount: number | undefined | null, unit?: string | null): string {
  if (!amount) return '';

  const lowerUnit = (unit || '').toLowerCase().trim();
  const isWeightOrVolume = WEIGHT_VOLUME_UNITS.includes(lowerUnit);

  // Weights, volumes, or large values: numeric rounding.
  if (isWeightOrVolume || amount >= 20) {
    if (amount % 1 === 0) return amount.toString();
    if (amount >= 10) return Math.round(amount).toString();
    return (Math.round(amount * 10) / 10).toString();
  }

  // Count / spoon units: snap to nearest quarter, render as whole/fraction.
  return formatAsFraction(amount);
}

function formatAsFraction(value: number): string {
  const quarters = Math.round(value * 4);

  // A tiny positive value that snaps to zero still deserves a visible amount.
  if (quarters === 0) return value > 0 ? '¼' : '0';

  const whole = Math.floor(quarters / 4);
  const remainder = quarters % 4;
  const glyph = remainder === 1 ? '¼' : remainder === 2 ? '½' : remainder === 3 ? '¾' : '';

  if (!glyph) return whole.toString();
  if (whole === 0) return glyph;
  return `${whole} ${glyph}`;
}
