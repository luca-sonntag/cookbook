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
    glowColor: '#6EE7B7',
    categoryLabel: 'REZEPT-EMPFEHLUNG',
  },
};

/** Escape XML special characters for SVG text. */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Wrap title into lines of at most maxChars length. */
function wrapText(text: string, maxChars: number = 22): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 3); // Max 3 lines
}

/** In-memory cache for fetched Google Noto Color Emoji PNG buffers */
const emojiPngCache = new Map<string, Buffer | null>();

/** Convert a unicode emoji character (e.g. 🍕 or 🍳) to Noto Emoji hex string format */
function emojiToNotoHex(emoji: string): string {
  return Array.from(emoji)
    .map((char) => char.codePointAt(0)!.toString(16).toLowerCase())
    .filter((hex) => hex !== 'fe0f') // strip variation selector-16
    .join('_'); // googlefonts/noto-emoji uses underscores
}

/** Fetch official Google Noto Color Emoji PNG (128x128) with fallback to Twemoji */
async function fetchEmojiPng(emoji: string): Promise<Buffer | null> {
  const notoHex = emojiToNotoHex(emoji);
  if (emojiPngCache.has(notoHex)) {
    return emojiPngCache.get(notoHex)!;
  }

  // Official Google Noto Color Emoji PNG (Android style)
  const primaryUrl = `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u${notoHex}.png`;
  // Fallback to Twemoji PNG
  const fallbackUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${notoHex}.png`;

  try {
    let res = await fetch(primaryUrl);
    if (!res.ok) {
      res = await fetch(fallbackUrl);
    }
    if (!res.ok) {
      console.warn(`[bannerGenerator] Failed to fetch emoji for ${emoji} (${notoHex})`);
      emojiPngCache.set(notoHex, null);
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    emojiPngCache.set(notoHex, buf);
    return buf;
  } catch (err) {
    console.warn('[bannerGenerator] Failed to fetch emoji PNG:', err);
    emojiPngCache.set(notoHex, null);
    return null;
  }
}

export interface BannerOptions {
  theme?: string;
  title?: string;
  emoji?: string;
}

export interface IconOptions {
  theme?: string;
  emoji?: string;
}

/**
 * Generates an 800x400 SVG string for a rich recipe notification card.
 */
export function generateBannerSVG(options: BannerOptions): string {
  const normalizedTheme = (options.theme?.toLowerCase() as BannerTheme) || 'emerald';
  const palette = THEME_PALETTES[normalizedTheme] || THEME_PALETTES.emerald;

  const rawTitle = options.title || 'Neues Rezept entdeckt';

  // Strip emojis from SVG title text so librsvg doesn't render missing glyph boxes
  const textOnlyTitle = rawTitle
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
    .trim();

  const titleLines = wrapText(textOnlyTitle || rawTitle, 22);

  const safeTitleLines = titleLines.map(escapeXml);
  const safeCategory = escapeXml(palette.categoryLabel);

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

  <!-- Category / Theme Pill (Left) -->
  <rect x="48" y="48" width="auto" height="34" rx="8" fill="#FFFFFF" fill-opacity="0.2" />
  <text x="62" y="71" font-size="15" font-weight="900" fill="#FFFFFF" letter-spacing="1.5" font-family="system-ui, -apple-system, sans-serif">
    ${safeCategory}
  </text>

  <!-- Main Recipe Title Text (Left) -->
  <g filter="url(#shadow)">
    ${safeTitleLines.map((line, idx) => `
      <text x="48" y="${152 + idx * 46}" font-size="38" font-weight="900" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" letter-spacing="-0.5">
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
  let instance = sharp(Buffer.from(svgString));

  if (options.emoji) {
    const emojiPng = await fetchEmojiPng(options.emoji);
    if (emojiPng) {
      const resizedEmoji = await sharp(emojiPng).resize(160, 160).toBuffer();
      instance = instance.composite([{ input: resizedEmoji, top: 120, left: 540 }]);
    }
  }

  return instance.png({ quality: 90 }).toBuffer();
}

/**
 * Generates a 256x256 square PNG image buffer with the theme gradient and centered emoji for collapsed notifications.
 */
export async function generateIconPNG(options: IconOptions): Promise<Buffer> {
  const themeKey = (options.theme?.toLowerCase() as BannerTheme) in THEME_PALETTES
    ? (options.theme?.toLowerCase() as BannerTheme)
    : 'emerald';

  const palette = THEME_PALETTES[themeKey];

  const svgString = `
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.startColor}" />
      <stop offset="100%" stop-color="${palette.endColor}" />
    </linearGradient>
    <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${palette.glowColor}" stop-opacity="0.4" />
      <stop offset="100%" stop-color="${palette.glowColor}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="256" height="256" rx="48" fill="url(#bgGrad)" />
  <circle cx="128" cy="128" r="100" fill="url(#ambientGlow)" />
</svg>
`.trim();

  let instance = sharp(Buffer.from(svgString));

  if (options.emoji) {
    const emojiPng = await fetchEmojiPng(options.emoji);
    if (emojiPng) {
      const resizedEmoji = await sharp(emojiPng).resize(160, 160).toBuffer();
      instance = instance.composite([{ input: resizedEmoji, top: 48, left: 48 }]);
    }
  }

  return instance.png({ quality: 90 }).toBuffer();
}
