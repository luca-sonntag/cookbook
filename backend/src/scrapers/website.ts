import * as cheerio from 'cheerio';
import type { ScrapingResult } from './index.js';
import { AppError, isAppError } from '../errors.js';

export async function scrapeWebsite(url: string): Promise<ScrapingResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      throw new AppError('SCRAPE_FAILED', { message: `HTTP error! status: ${response.status}` });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unnecessary elements to reduce payload size for Gemini
    $('script, style, noscript, iframe, img, svg, video, audio, nav, footer, header').remove();

    // Try to extract title
    const title = $('title').text() || $('h1').first().text() || '';

    // Extract main content text
    let content = $('article').text() || $('main').text() || $('body').text();
    
    // Clean up excessive whitespace
    content = content.replace(/\s+/g, ' ').trim();

    return {
      caption: title, // We use caption as the title
      htmlContent: content, // The raw text to feed into Gemini
      authorHandle: new URL(url).hostname, // Use hostname as author
      media: { kind: 'none' }, // websites have no downloadable media
    };
  } catch (error: any) {
    if (isAppError(error)) throw error;
    throw new AppError('SCRAPE_FAILED', { message: `Failed to scrape website: ${error.message}` });
  }
}
