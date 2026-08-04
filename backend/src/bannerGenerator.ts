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
function wrapText(text: string, maxCharsPerLine = 22): string[] {
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

function emojiToNotoHex(emoji: string): string {
  const comp = Array.from(emoji).map((char) => char.codePointAt(0)!.toString(16));
  return comp.filter((hex) => hex !== 'fe0f').join('_');
}

function emojiToUnicodeHex(emoji: string): string {
  const comp = Array.from(emoji).map((char) => char.codePointAt(0)!.toString(16));
  return comp.filter((hex) => hex !== 'fe0f').join('-');
}

const emojiPngCache = new Map<string, Buffer | null>();

/**
 * Fetches Google Noto Color Emoji PNG (Browser / Android style) with fallback to Twemoji.
 */
async function fetchEmojiPng(emoji: string): Promise<Buffer | null> {
  const notoHex = emojiToNotoHex(emoji);
  if (!notoHex) return null;
  if (emojiPngCache.has(notoHex)) return emojiPngCache.get(notoHex)!;

  try {
    // 1. Primary: Google Noto Color Emoji (Browser style)
    const googleUrl = `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u${notoHex}.png`;
    let res = await fetch(googleUrl);

    // 2. Fallback: Twemoji CDN
    if (!res.ok) {
      const twemojiHex = emojiToUnicodeHex(emoji);
      const twemojiUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${twemojiHex}.png`;
      res = await fetch(twemojiUrl);
    }

    if (!res.ok) {
      emojiPngCache.set(notoHex, null);
      return null;
    }

    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
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

/**
 * Generates an 800x400 SVG string for a rich recipe notification card.
 */
export function generateBannerSVG(options: BannerOptions): string {
  const normalizedTheme = (options.theme?.toLowerCase() as BannerTheme) || 'emerald';
  const palette = THEME_PALETTES[normalizedTheme] || THEME_PALETTES.emerald;

  const rawTitle = options.title || 'Neues Rezept entdeckt';
  const titleLines = wrapText(rawTitle, 22);

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
  <rect x="48" y="54" width="auto" height="26" rx="6" fill="#FFFFFF" fill-opacity="0.2" />
  <text x="58" y="71" font-size="11" font-weight="800" fill="#FFFFFF" letter-spacing="1.2" font-family="system-ui, -apple-system, sans-serif">
    ${safeCategory}
  </text>

  <!-- Main Recipe Title Text (Left) -->
  <g filter="url(#shadow)">
    ${safeTitleLines.map((line, idx) => `
      <text x="48" y="${145 + idx * 46}" font-size="38" font-weight="900" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" letter-spacing="-0.5">
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
