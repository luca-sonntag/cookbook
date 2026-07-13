import { Capacitor } from '@capacitor/core';
import type { User } from '@supabase/supabase-js';
import { isNative } from '../native';
import { APP_VERSION, APP_BUILD } from '../version';
import { getRecentLogs, type LogEntry } from './consoleBuffer';

export interface FeedbackContext {
  appVersion: string;
  appBuild: string;
  platform: string;
  isNative: boolean;
  userAgent: string;
  language: string;
  route: string;
  viewport: string;
  userId?: string;
  email?: string;
  tier?: string;
  logs: LogEntry[];
}

/** Gather diagnostic context to attach to a bug report / feedback submission. */
export function collectFeedbackContext(user: User | null, language: string): FeedbackContext {
  return {
    appVersion: APP_VERSION,
    appBuild: APP_BUILD,
    platform: Capacitor.getPlatform(),
    isNative: isNative(),
    userAgent: navigator.userAgent,
    language,
    route: window.location.hash || '/',
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    userId: user?.id,
    email: user?.email,
    tier: (user?.app_metadata?.tier as string | undefined) ?? 'free',
    logs: getRecentLogs(),
  };
}

/**
 * Compress an image File into a JPEG data-URL, mirroring the canvas approach in
 * useCachedImage (max 800px longest edge, 75% quality). Keeps screenshot
 * payloads small enough to fit under the backend's 1mb JSON body cap.
 */
export function compressScreenshot(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
