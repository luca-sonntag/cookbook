# Social Video Downloader — Apify actor spec

First-party Apify actor that powers the app's social scraping. Its source is maintained
in a **separate sibling repository** (`../apify-actor`, next to this project) — not in
this repo. This file is the input/output contract the app-side provider
([src/apify/providers/socialVideoDownloader.ts](../src/apify/providers/socialVideoDownloader.ts))
relies on.

It wraps **yt-dlp** behind Apify **residential proxies** to download a video from
**Instagram, TikTok, YouTube (Shorts) or Facebook**, merges video+audio into one MP4,
stores it in the Apify **key-value store**, and returns a public download URL plus the
post **caption**, **thumbnail** and **author**.

Actor id: `<your-apify-username>/social-video-downloader` (set via `APIFY_SOCIAL_ACTOR_ID`
after `apify push`).

## Input

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `url` | string (required) | — | One IG / TikTok / YouTube / Facebook video URL |
| `quality` | enum `360`/`480`/`720`/`1080` | `720` | Max resolution — lower is smaller/cheaper |
| `proxyConfiguration` | proxy | `{ useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] }` | Cookie-free reliability lever |
| `cookies` | object | — | Optional/advanced escape hatch; unused in normal operation |

The app sends: `{ url, quality: '720', proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] } }`.

## Output — one dataset item

```json
{
  "url": "https://www.instagram.com/reel/…/",
  "platform": "instagram | tiktok | youtube | facebook",
  "caption": "<post description>",
  "videoUrl": "https://api.apify.com/v2/key-value-stores/<storeId>/records/<key>.mp4",
  "audioUrl": "<same as videoUrl — the merged MP4 carries both streams>",
  "imageUrl": "<thumbnail URL>",
  "authorHandle": "@uploader",
  "duration": 42,
  "fileSize": 1839321,
  "kvStoreKey": "<key>.mp4",
  "status": "success",
  "error": null
}
```

On failure the actor pushes `{ "status": "error", "error": "<reason>", … }` (empty media
fields) so the app's parser throws and the provider chain falls through — ultimately to
the local yt-dlp fallback in [src/scrapers/social.ts](../src/scrapers/social.ts).

The `videoUrl` points at the run's default key-value store, which serves records publicly
via the unguessable store id — the app fetches it with a plain HTTP GET (no token/headers),
matching the download path in [src/queue.ts](../src/queue.ts).

## Field mapping (actor → app `ApifySocialScrapeResult`)

| Actor field | App field |
|-------------|-----------|
| `caption` | `caption` |
| `videoUrl` | `videoUrl` |
| `audioUrl` (= `videoUrl`) | `audioUrl` |
| `imageUrl` | `imageUrl` |
| `authorHandle` | `authorHandle` |

## Authentication (cookie-free)

Reliability comes from Apify **residential proxies** with per-attempt session rotation
(up to 5 attempts on 403/429/empty-response) — **not** manual cookies. Public TikTok /
YouTube / Facebook and most public Instagram reels resolve this way. Instagram is the
strictest; if it proves unreliable, escalate (still no manual cookies): sticky residential
sessions → headless-browser guest fetch → an automated session actor. The `cookies` input
exists only as a last-resort escape hatch. See the README in the separate `apify-actor` repo.
