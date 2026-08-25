import type { Request, Response } from 'express';
import { Readable } from 'node:stream';
import { AppError, sendAppError } from '../errors.js';

export const MAX_PROXY_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Validates whether a target URL is safe for external media fetching (SSRF guard).
 */
export function isSafeMediaUrl(targetUrl: URL): boolean {
  const protocol = targetUrl.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    return false;
  }

  const hostname = targetUrl.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname === 'metadata.google.internal' ||
    hostname === '169.254.169.254'
  ) {
    return false;
  }

  // IPv4 private & link-local ranges
  if (
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^127\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^0\./.test(hostname)
  ) {
    return false;
  }

  // IPv6 unique local and link-local ranges
  if (/^[fF][cCdD]/.test(hostname) || /^[fF][eE][89aAbB]/.test(hostname)) {
    return false;
  }

  return true;
}

/**
 * Streaming proxy handler to allow web clients to fetch external CDN video/media streams
 * while bypassing browser CORS limitations, without persisting files to disk.
 */
export async function handleVideoProxy(req: Request, res: Response): Promise<void> {
  try {
    const rawUrl = req.query.url;

    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new AppError('MISSING_FIELD', { params: { field: 'url' } });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      throw new AppError('INVALID_URL', { message: 'Failed to parse target proxy URL.' });
    }

    if (!isSafeMediaUrl(parsedUrl)) {
      throw new AppError('INVALID_URL', { message: 'Target proxy URL is not allowed.' });
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 35000);

    req.on('close', () => {
      abortController.abort();
    });

    let upstreamResponse: globalThis.Response;
    try {
      upstreamResponse = await fetch(parsedUrl.toString(), {
        signal: abortController.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: '*/*',
        },
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (abortController.signal.aborted) {
        return;
      }
      throw new AppError('SCRAPE_FAILED', {
        message: `Upstream media proxy request failed: ${fetchErr?.message || fetchErr}`,
      });
    }

    clearTimeout(timeoutId);

    if (!upstreamResponse.ok) {
      res.status(upstreamResponse.status).json({
        success: false,
        error: `Upstream CDN returned status ${upstreamResponse.status}`,
      });
      return;
    }

    const contentLengthHeader = upstreamResponse.headers.get('content-length');
    if (contentLengthHeader) {
      const contentLength = parseInt(contentLengthHeader, 10);
      if (!Number.isNaN(contentLength) && contentLength > MAX_PROXY_VIDEO_BYTES) {
        throw new AppError('MEDIA_DOWNLOAD_FAILED', {
          message: `Video size (${(contentLength / (1024 * 1024)).toFixed(1)} MB) exceeds maximum proxy limit.`,
        });
      }
    }

    const upstreamContentType = upstreamResponse.headers.get('content-type') || 'video/mp4';

    res.status(200);
    res.setHeader('Content-Type', upstreamContentType);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    if (contentLengthHeader) {
      res.setHeader('Content-Length', contentLengthHeader);
    }

    if (!upstreamResponse.body) {
      res.end();
      return;
    }

    let bytesStreamed = 0;
    const nodeStream = Readable.fromWeb(upstreamResponse.body as any);

    nodeStream.on('data', (chunk: Buffer) => {
      bytesStreamed += chunk.length;
      if (bytesStreamed > MAX_PROXY_VIDEO_BYTES) {
        nodeStream.destroy(new Error('Exceeded MAX_PROXY_VIDEO_BYTES limit during streaming'));
      }
    });

    nodeStream.on('error', (streamErr: any) => {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: streamErr?.message || 'Streaming failed' });
      } else {
        res.destroy(streamErr);
      }
    });

    nodeStream.pipe(res);
  } catch (error: unknown) {
    if (!(error instanceof AppError)) {
      console.error('Error handling video proxy:', error);
    }
    sendAppError(res, error);
  }
}
