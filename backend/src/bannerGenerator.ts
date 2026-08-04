import sharp from 'sharp';

export type BannerTheme =
  | 'italian'
  | 'fresh'
  | 'asian'
  | 'hearty'
  | 'sweet'
  | 'breakfast'
  | 'seafood'
  | 'emerald';

interface ThemePalette {
  startColor: string;
  endColor: string;
  glowColor: string;
  categoryLabel: string;
}

const THEME_PALETTES: Record<BannerTheme, ThemePalette> = {
  italian: {
    startColor: '#D9381E',
    endColor: '#F39C12',
    glowColor: '#FF7E67',
    categoryLabel: 'ITALIENISCH & COMFORT',
  },
  fresh: {
    startColor: '#10B981',
    endColor: '#046A38',
    glowColor: '#34D399',
    categoryLabel: 'FRISCH & GESUND',
  },
  asian: {
    startColor: '#E11D48',
    endColor: '#D97706',
    glowColor: '#FB7185',
    categoryLabel: 'ASIATISCH & WÜRZIG',
  },
  hearty: {
    startColor: '#B45309',
    endColor: '#581C87',
    glowColor: '#F59E0B',
    categoryLabel: 'HERZHAFT & DEFTIG',
  },
  sweet: {
    startColor: '#DB2777',
    endColor: '#7C3AED',
    glowColor: '#F472B6',
    categoryLabel: 'SÜSSES & DESSERTS',
  },
  breakfast: {
    startColor: '#D97706',
    endColor: '#CA8A04',
    glowColor: '#FBBF24',
    categoryLabel: 'FRÜHSTÜCK & BRUNCH',
  },
  seafood: {
    startColor: '#0284C7',
    endColor: '#0F766E',
    glowColor: '#38BDF8',
    categoryLabel: 'FISCH & MEERESFRÜCHTE',
  },
  emerald: {
    startColor: '#059669',
    endColor: '#064E3B',
    glowColor: '#10B981',
    categoryLabel: 'REZEPT-EMPFEHLUNG',
  },
};

/** Escapes XML special characters in string values for safe SVG injection. */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Wraps title string into line array if it exceeds max line width. */
function wrapText(text: string, maxCharsPerLine = 24): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + (currentLine ? ' ' : '') + word).length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine += (currentLine ? ' ' : '') + word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.slice(0, 2); // Max 2 lines for high visual impact
}

export interface BannerOptions {
  theme?: string;
  title?: string;
  emoji?: string;
}

/**
 * Generates an 800x400 SVG string for a rich recipe notification card.
 */
export function generateBannerSVG(options: BannerOptions): string {
  const normalizedTheme = (options.theme?.toLowerCase() as BannerTheme) || 'emerald';
  const palette = THEME_PALETTES[normalizedTheme] || THEME_PALETTES.emerald;

  const rawTitle = options.title || 'Neues Rezept entdeckt';
  const titleLines = wrapText(rawTitle, 22);
  const emoji = options.emoji || '🍳';

  const safeTitleLines = titleLines.map(escapeXml);
  const safeCategory = escapeXml(palette.categoryLabel);
  const safeEmoji = escapeXml(emoji);

  return `
<svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.startColor}" />
      <stop offset="100%" stop-color="${palette.endColor}" />
    </linearGradient>

    <!-- Radial Ambient Glow -->
    <radialGradient id="ambientGlow" cx="70%" cy="30%" r="60%">
      <stop offset="0%" stop-color="${palette.glowColor}" stop-opacity="0.4" />
      <stop offset="100%" stop-color="${palette.glowColor}" stop-opacity="0" />
    </radialGradient>

    <!-- Glassmorphism Filter -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.3" />
    </filter>

    <filter id="glowShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- Base Rectangle -->
  <rect width="800" height="400" fill="url(#bgGrad)" />

  <!-- Ambient Light Orbs -->
  <circle cx="620" cy="180" r="220" fill="url(#ambientGlow)" />
  <circle cx="100" cy="340" r="180" fill="url(#ambientGlow)" />

  <!-- Glassmorphism Large Emoji Circle Container (Right) -->
  <g filter="url(#shadow)">
    <circle cx="620" cy="200" r="115" fill="#FFFFFF" fill-opacity="0.15" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="2.5" />
    <text x="620" y="238" font-size="110" text-anchor="middle" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">
      ${safeEmoji}
    </text>
  </g>

  <!-- App Branding Header Pill (Top Left) -->
  <g filter="url(#glowShadow)">
    <rect x="48" y="44" width="180" height="34" rx="17" fill="#000000" fill-opacity="0.25" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="1" />
    <!-- App Fork/Spoon Icon Symbol -->
    <circle cx="68" cy="61" r="9" fill="#10B981" />
    <text x="68" y="65" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">S</text>
    <text x="86" y="66" font-size="12" font-weight="800" fill="#FFFFFF" letter-spacing="1.5" font-family="system-ui, -apple-system, sans-serif">SNAGBITE</text>
  </g>

  <!-- Category / Theme Pill (Left) -->
  <rect x="48" y="106" width="auto" height="26" rx="6" fill="#FFFFFF" fill-opacity="0.2" />
  <text x="58" y="123" font-size="11" font-weight="800" fill="#FFFFFF" letter-spacing="1.2" font-family="system-ui, -apple-system, sans-serif">
    ${safeCategory}
  </text>

  <!-- Main Recipe Title Text (Left) -->
  <g filter="url(#shadow)">
    ${safeTitleLines.map((line, idx) => `
      <text x="48" y="${185 + idx * 46}" font-size="38" font-weight="900" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" letter-spacing="-0.5">
        ${line}
      </text>
    `).join('')}
  </g>

  <!-- Decorative Sub-bar Accent -->
  <rect x="48" y="325" width="120" height="4" rx="2" fill="#FFFFFF" fill-opacity="0.6" />
  <text x="180" y="330" font-size="13" font-weight="600" fill="#FFFFFF" fill-opacity="0.8" font-family="system-ui, -apple-system, sans-serif">
    Dein Kochbuch wartet auf dich
  </text>
</svg>
`.trim();
}

/**
 * Generates an 800x400 PNG image buffer from the SVG template for Android push notifications.
 */
export async function generateBannerPNG(options: BannerOptions): Promise<Buffer> {
  const svgString = generateBannerSVG(options);
  return sharp(Buffer.from(svgString))
    .png({ quality: 90 })
    .toBuffer();
}
