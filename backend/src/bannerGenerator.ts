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
}

const THEME_PALETTES: Record<BannerTheme, ThemePalette> = {
  italian: {
    startColor: '#D9381E',
    endColor: '#F39C12',
    glowColor: '#FF7E67',
  },
  fresh: {
    startColor: '#10B981',
    endColor: '#046A38',
    glowColor: '#34D399',
  },
  asian: {
    startColor: '#E11D48',
    endColor: '#D97706',
    glowColor: '#FB7185',
  },
  hearty: {
    startColor: '#B45309',
    endColor: '#581C87',
    glowColor: '#F59E0B',
  },
  sweet: {
    startColor: '#DB2777',
    endColor: '#7C3AED',
    glowColor: '#F472B6',
  },
  breakfast: {
    startColor: '#D97706',
    endColor: '#CA8A04',
    glowColor: '#FBBF24',
  },
  seafood: {
    startColor: '#0284C7',
    endColor: '#0F766E',
    glowColor: '#38BDF8',
  },
  emerald: {
    startColor: '#059669',
    endColor: '#064E3B',
    glowColor: '#6EE7B7',
  },
};

/** Convert emoji string into hex code for Noto Emoji URL */
function emojiToNotoHex(emoji: string): string {
  const codePoints: string[] = [];
  for (const char of emoji) {
    const cp = char.codePointAt(0);
    if (cp !== undefined && cp !== 0xfe0f) {
      codePoints.push(cp.toString(16).toLowerCase());
    }
  }
  return codePoints.join('_');
}

/** In-memory cache for fetched Google Noto Color Emoji PNG buffers */
const emojiPngCache = new Map<string, Buffer | null>();

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

export interface IconOptions {
  theme?: string;
  emoji?: string;
}

/**
 * Generates a 256x256 square PNG image buffer with the theme gradient and centered emoji for push notifications.
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
