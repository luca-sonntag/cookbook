# Ultra-Fast Social Media Downloader – 21+ Platforms! (`rover-omniscraper/media-downloader-actor`) Actor

Download videos, audio, and photos from 21+ social media platforms including YouTube, TikTok, Instagram, Twitter/X, Reddit, Facebook, Snapchat, Pinterest & more. Supports 144p to 4K quality, MP4/MP3/WebM formats, and up to 50 concurrent downloads for blazing-fast bulk media scraping.

- **URL**: https://apify.com/rover-omniscraper/media-downloader-actor.md
- **Developed by:** [Rover Omniscraper](https://apify.com/rover-omniscraper) (community)
- **Categories:** Automation, Social media
- **Stats:** 46 total users, 13 monthly users, 100.0% runs succeeded, 0 bookmarks
- **User rating**: No ratings yet

## Pricing

from $4.00 / 1,000 results

This Actor is paid per event and usage. You are charged both the fixed price for specific events and for Apify platform usage.

Learn more: https://docs.apify.com/platform/actors/running/actors-in-store#pay-per-event

## What's an Apify Actor?

Actors are a software tools running on the Apify platform, for all kinds of web data extraction and automation use cases.
In Batch mode, an Actor accepts a well-defined JSON input, performs an action which can take anything from a few seconds to a few hours,
and optionally produces a well-defined JSON output, datasets with results, or files in key-value store.
In Standby mode, an Actor provides a web server which can be used as a website, API, or an MCP server.
Actors are written with capital "A".

## How to integrate an Actor?

If asked about integration, you help developers integrate Actors into their projects.
You adapt to their stack and deliver integrations that are safe, well-documented, and production-ready.
The best way to integrate Actors is as follows.

In JavaScript/TypeScript projects, use official [JavaScript/TypeScript client](https://docs.apify.com/api/client/js.md):

```bash
npm install apify-client
```

In Python projects, use official [Python client library](https://docs.apify.com/api/client/python.md):

```bash
pip install apify-client
```

In shell scripts, use [Apify CLI](https://docs.apify.com/cli/docs.md):

````bash
# MacOS / Linux
curl -fsSL https://apify.com/install-cli.sh | bash
# Windows
irm https://apify.com/install-cli.ps1 | iex
```bash

In AI frameworks, you might use the [Apify MCP server](https://docs.apify.com/platform/integrations/mcp.md).

If your project is in a different language, use the [REST API](https://docs.apify.com/api/v2.md).

For usage examples, see the [API](#api) section below.

For more details, see Apify documentation as [Markdown index](https://docs.apify.com/llms.txt) and [Markdown full-text](https://docs.apify.com/llms-full.txt).


# README

## Social Media Video Downloader - Apify Actor

> Download videos from 21+ social media platforms with configurable quality, format, and concurrent processing.

### 🚀 Quick Start

#### Local Testing

```bash
## Install dependencies (already done if you see node_modules/)
npm install

## Test with Instagram URLs (creates ./downloads/)
node test-runner.js

## Or test with custom URLs
echo '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","quality":"720"}' > test.json
## Edit src/main.js to read test.json instead of Apify input
node src/main.js
````

#### Run with Apify CLI

```bash
## Install Apify CLI globally
npm install -g apify-cli

## Run locally with Apify storage
npx apify run

## Configure input in: apify_storage/key_value_stores/default/INPUT.json
```

### 📋 Features

- **21 Platforms**: YouTube, TikTok, Instagram, Twitter/X, Reddit, Facebook, Bilibili, Vimeo, Twitch, Pinterest, SoundCloud, Snapchat, VK, OK.ru, Rutube, Tumblr, DailyMotion, Bluesky, Streamable, Loom, Newgrounds
- **Concurrent Downloads**: 1-50 parallel downloads (default: 10)
- **Quality Options**: 144p to 4K (2160p)
- **Format Support**: MP4, WebM, MKV, MP3, OGG, WAV, Opus, GIF
- **FFmpeg Processing**: Video+audio merging, remuxing, audio extraction, GIF conversion
- **Retry Logic**: 3 attempts with exponential backoff
- **No External APIs**: Embedded Cobalt server on localhost

### 🎯 Input Parameters

```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "urls": ["https://...", "https://..."],
  "quality": "1080",
  "downloadMode": "auto",
  "audioFormat": "mp3",
  "audioBitrate": "128",
  "videoCodec": "h264",
  "filenameStyle": "basic",
  "concurrency": 10,
  "tiktokFullAudio": true,
  "tiktokH265": false,
  "twitterGif": true,
  "youtubeHLS": false,
  "youtubeDubLang": "en",
  "disableMetadata": false,
  "cookies": {},
  "proxyConfiguration": {}
}
```

**Single or Multiple URLs**: Use either `url` (string) or `urls` (array), not both.

#### Quality Options

- `144`, `240`, `360`, `480`, `720`, `1080`, `1440`, `2160`

#### Download Modes

- `auto` - Video + audio (default)
- `audio` - Audio only
- `mute` - Video without audio

#### Audio Formats

- `best`, `mp3`, `ogg`, `wav`, `opus`

#### Video Codecs (mainly YouTube)

- `h264` - Best compatibility (default)
- `av1` - Best quality
- `vp9` - Good balance

#### Filename Styles

- `classic` - `service_id_res.ext`
- `basic` - `Title (res, service).ext` (default)
- `pretty` - `Title (res, service).ext`
- `nerdy` - `Title (res, service, id).ext`

### 📦 Output

#### Apify Run

- **Files**: Stored in Apify Key-Value Store
- **Metadata**: Pushed to Apify Dataset with:
  - Direct download URLs to Apify storage (not social media links)
  - File metadata (title, author, album, copyright, date, etc.)
  - File size, content type, status
  - Download timestamp

#### Local Run (test-runner.js)

- **Files**: Saved to `./downloads/`
- **Metadata**: Appended to `./downloads/metadata.jsonl`

#### Metadata Format

```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "service": "youtube",
  "filename": "Rick Astley - Never Gonna Give You Up.mp4",
  "fileSize": 11839321,
  "contentType": "video/mp4",
  "kvStoreKey": "Rick_Astley_Never_Gonna_Give_You_Up.mp4",
  "downloadUrl": "https://api.apify.com/v2/key-value-stores/abc123/records/Rick_Astley_Never_Gonna_Give_You_Up.mp4",
  "status": "success",
  "error": null,
  "downloadedAt": "2026-04-08T18:12:27.743Z",
  "metadata": {
    "title": "Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)",
    "artist": "Rick Astley",
    "album": "Whenever You Need Somebody",
    "copyright": "© 1987 PWL",
    "date": "2009-10-25",
    "sublanguage": "en"
  }
}
```

**Note:** The `downloadUrl` field provides a direct link to download the file from Apify storage, making it easy for users to access their downloaded content without navigating through the platform.

### 🧪 Test Results

#### Instagram (2026-04-08)

✅ **3/3 downloads succeeded in 5.0 seconds**

| URL | Type | Size | Status |
|-----|------|------|--------|
| reel/DWyB-FxAY1p | Video | 2.59 MB | ✅ Success |
| p/DWmtt6SkVAL | Photo | 0.06 MB | ✅ Success |
| reel/DTdLffwjkN- | Video | 0.43 MB | ✅ Success |

#### YouTube (2026-04-08)

✅ **Download verified** - 5.25 MB MP4 at 144p

### 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│ Apify Actor                                         │
│  ┌────────────────────────────────────────────┐    │
│  │ src/main.js (Actor Entry)                  │    │
│  │  • Initialize Apify                         │    │
│  │  • Parse & validate input                   │    │
│  │  • Configure proxy                          │    │
│  │  • Start Cobalt server (localhost)          │    │
│  └────────────┬───────────────────────────────┘    │
│               │                                      │
│  ┌────────────▼────────────────────────────────┐   │
│  │ Cobalt API Server (Embedded on 127.0.0.1)   │   │
│  │  • Express server on random port            │   │
│  │  • 21 service handlers                      │   │
│  │  • FFmpeg processing                        │   │
│  │  • Stream encryption & tunneling            │   │
│  └────────────┬────────────────────────────────┘   │
│               │                                      │
│  ┌────────────▼────────────────────────────────┐   │
│  │ Orchestrator (p-limit concurrency)          │   │
│  │  • Queue URLs                               │   │
│  │  • Parallel downloads                       │   │
│  │  • Progress tracking                        │   │
│  └────────────┬────────────────────────────────┘   │
│               │                                      │
│  ┌────────────▼────────────────────────────────┐   │
│  │ Downloader (per URL)                        │   │
│  │  • POST to Cobalt API                       │   │
│  │  • Handle tunnel/redirect/picker            │   │
│  │  • Retry with backoff (3 attempts)          │   │
│  └────────────┬────────────────────────────────┘   │
│               │                                      │
│  ┌────────────▼────────────────────────────────┐   │
│  │ Storage                                      │   │
│  │  • Save file to KV Store (Buffer)           │   │
│  │  • Push metadata to Dataset                 │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 🔧 Development

#### Project Structure

```
/
├── src/
│   ├── main.js              # Actor entry point
│   ├── cobalt-server.js     # Embedded Cobalt launcher
│   ├── downloader.js        # Single URL download
│   ├── orchestrator.js      # Parallel execution
│   └── storage.js           # Apify KV Store + Dataset
├── cobalt-api/              # Embedded Cobalt source
│   └── src/
│       ├── processing/services/  # 21 platform handlers
│       └── stream/               # FFmpeg, HLS, proxy
├── packages/
│   └── version-info/        # Version utilities (patched)
├── .actor/
│   ├── actor.json           # Apify manifest
│   └── INPUT_SCHEMA.json    # Input schema
├── Dockerfile               # Node 20 + FFmpeg
├── package.json
├── test-runner.js           # Local testing (no Apify)
├── test-instagram.json      # Sample input
├── context.md               # Full documentation
└── README.md                # This file
```

#### Local Development Workflow

1. **Modify source files** in `src/`
2. **Test locally**: `node test-runner.js`
3. **Update context.md** with changes
4. **Run with Apify**: `npx apify run`
5. **Deploy**: `npx apify push`

#### Adding New Features

1. Read `context.md` to understand architecture
2. Make changes in appropriate module
3. Test with `test-runner.js` first
4. Verify with full `npx apify run`
5. Update `context.md` with what you changed

### 📝 Configuration

#### Cookies for Authentication

Some platforms require cookies for private/restricted content:

```json
{
  "cookies": {
    "youtube": [
      {"name": "CONSENT", "value": "YES+..."},
      {"name": "VISITOR_INFO1_LIVE", "value": "..."}
    ],
    "instagram": [
      {"name": "sessionid", "value": "..."}
    ],
    "tiktok": [
      {"name": "sessionid", "value": "..."}
    ]
  }
}
```

#### Proxy Configuration

Use Apify's built-in proxy:

```json
{
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

# Actor input Schema

## `url` (type: `string`):

A single URL to download. Use either this or 'urls', not both.

## `urls` (type: `array`):

Array of URLs to download concurrently. Use either this or 'url', not both.

## `quality` (type: `string`):

Maximum video quality to download.

## `downloadMode` (type: `string`):

'auto' downloads video+audio, 'audio' extracts audio only, 'mute' downloads video without audio.

## `audioFormat` (type: `string`):

Output audio format when downloading audio.

## `audioBitrate` (type: `string`):

Audio bitrate for conversion.

## `videoCodec` (type: `string`):

Preferred video codec (mainly affects YouTube).

## `filenameStyle` (type: `string`):

How output files are named.

## `tiktokFullAudio` (type: `boolean`):

Download original sound from TikTok without the video's changes.

## `tiktokH265` (type: `boolean`):

Use H.265 for TikTok downloads (better quality, less compatible).

## `twitterGif` (type: `boolean`):

Convert Twitter GIF-style videos to actual GIF format.

## `youtubeHLS` (type: `boolean`):

Use HLS for YouTube downloads (experimental, may bypass some restrictions).

## `youtubeDubLang` (type: `string`):

Language code for dubbed YouTube audio (e.g., 'en', 'es', 'ja').

## `disableMetadata` (type: `boolean`):

Don't embed metadata (title, artist, etc.) in downloaded files.

## `concurrency` (type: `integer`):

Number of URLs to download simultaneously. Higher = faster but uses more memory.

## `cookies` (type: `object`):

Cookies for authenticated downloads, keyed by service name. Format: { "youtube": \[{"name": "...", "value": "..."}], "instagram": \[...] }

## `proxyConfiguration` (type: `object`):

Apify proxy configuration for routing requests through proxies.

## Actor input object example

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "urls": [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.tiktok.com/@user/video/1234567890"
  ],
  "quality": "1080",
  "downloadMode": "auto",
  "audioFormat": "mp3",
  "audioBitrate": "128",
  "videoCodec": "h264",
  "filenameStyle": "basic",
  "tiktokFullAudio": true,
  "tiktokH265": false,
  "twitterGif": true,
  "youtubeHLS": false,
  "disableMetadata": false,
  "concurrency": 10
}
```

# API

You can run this Actor programmatically using our API. Below are code examples in JavaScript, Python, and CLI, as well as the OpenAPI specification and MCP server setup.

## JavaScript example

```javascript
import { ApifyClient } from 'apify-client';

// Initialize the ApifyClient with your Apify API token
// Replace the '<YOUR_API_TOKEN>' with your token
const client = new ApifyClient({
    token: '<YOUR_API_TOKEN>',
});

// Prepare Actor input
const input = {};

// Run the Actor and wait for it to finish
const run = await client.actor("rover-omniscraper/media-downloader-actor").call(input);

// Fetch and print Actor results from the run's dataset (if any)
console.log('Results from dataset');
console.log(`💾 Check your data here: https://console.apify.com/storage/datasets/${run.defaultDatasetId}`);
const { items } = await client.dataset(run.defaultDatasetId).listItems();
items.forEach((item) => {
    console.dir(item);
});

// 📚 Want to learn more 📖? Go to → https://docs.apify.com/api/client/js/docs

```

## Python example

```python
from apify_client import ApifyClient

# Initialize the ApifyClient with your Apify API token
# Replace '<YOUR_API_TOKEN>' with your token.
client = ApifyClient("<YOUR_API_TOKEN>")

# Prepare the Actor input
run_input = {}

# Run the Actor and wait for it to finish
run = client.actor("rover-omniscraper/media-downloader-actor").call(run_input=run_input)

# Fetch and print Actor results from the run's dataset (if there are any)
print("💾 Check your data here: https://console.apify.com/storage/datasets/" + run["defaultDatasetId"])
for item in client.dataset(run["defaultDatasetId"]).iterate_items():
    print(item)

# 📚 Want to learn more 📖? Go to → https://docs.apify.com/api/client/python/docs/quick-start

```

## CLI example

```bash
echo '{}' |
apify call rover-omniscraper/media-downloader-actor --silent --output-dataset

```

## MCP server setup

```json
{
    "mcpServers": {
        "apify": {
            "command": "npx",
            "args": [
                "mcp-remote",
                "https://mcp.apify.com/?tools=rover-omniscraper/media-downloader-actor",
                "--header",
                "Authorization: Bearer <YOUR_API_TOKEN>"
            ]
        }
    }
}

```

## OpenAPI specification

```json
{
    "openapi": "3.0.1",
    "info": {
        "title": "Ultra-Fast Social Media Downloader – 21+ Platforms!",
        "description": "Download videos, audio, and photos from 21+ social media platforms including YouTube, TikTok, Instagram, Twitter/X, Reddit, Facebook, Snapchat, Pinterest & more. Supports 144p to 4K quality, MP4/MP3/WebM formats, and up to 50 concurrent downloads for blazing-fast bulk media scraping.",
        "version": "0.0",
        "x-build-id": "2Wet0RfHay3rr4dDc"
    },
    "servers": [
        {
            "url": "https://api.apify.com/v2"
        }
    ],
    "paths": {
        "/acts/rover-omniscraper~media-downloader-actor/run-sync-get-dataset-items": {
            "post": {
                "operationId": "run-sync-get-dataset-items-rover-omniscraper-media-downloader-actor",
                "x-openai-isConsequential": false,
                "summary": "Executes an Actor, waits for its completion, and returns Actor's dataset items in response.",
                "tags": [
                    "Run Actor"
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/inputSchema"
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "name": "token",
                        "in": "query",
                        "required": true,
                        "schema": {
                            "type": "string"
                        },
                        "description": "Enter your Apify token here"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK"
                    }
                }
            }
        },
        "/acts/rover-omniscraper~media-downloader-actor/runs": {
            "post": {
                "operationId": "runs-sync-rover-omniscraper-media-downloader-actor",
                "x-openai-isConsequential": false,
                "summary": "Executes an Actor and returns information about the initiated run in response.",
                "tags": [
                    "Run Actor"
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/inputSchema"
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "name": "token",
                        "in": "query",
                        "required": true,
                        "schema": {
                            "type": "string"
                        },
                        "description": "Enter your Apify token here"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/runsResponseSchema"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/acts/rover-omniscraper~media-downloader-actor/run-sync": {
            "post": {
                "operationId": "run-sync-rover-omniscraper-media-downloader-actor",
                "x-openai-isConsequential": false,
                "summary": "Executes an Actor, waits for completion, and returns the OUTPUT from Key-value store in response.",
                "tags": [
                    "Run Actor"
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/inputSchema"
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "name": "token",
                        "in": "query",
                        "required": true,
                        "schema": {
                            "type": "string"
                        },
                        "description": "Enter your Apify token here"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK"
                    }
                }
            }
        }
    },
    "components": {
        "schemas": {
            "inputSchema": {
                "type": "object",
                "properties": {
                    "url": {
                        "title": "Single URL",
                        "type": "string",
                        "description": "A single URL to download. Use either this or 'urls', not both."
                    },
                    "urls": {
                        "title": "URLs Array",
                        "type": "array",
                        "description": "Array of URLs to download concurrently. Use either this or 'url', not both.",
                        "items": {
                            "type": "string"
                        }
                    },
                    "quality": {
                        "title": "Video Quality",
                        "enum": [
                            "144",
                            "240",
                            "360",
                            "480",
                            "720",
                            "1080",
                            "1440",
                            "2160"
                        ],
                        "type": "string",
                        "description": "Maximum video quality to download.",
                        "default": "1080"
                    },
                    "downloadMode": {
                        "title": "Download Mode",
                        "enum": [
                            "auto",
                            "audio",
                            "mute"
                        ],
                        "type": "string",
                        "description": "'auto' downloads video+audio, 'audio' extracts audio only, 'mute' downloads video without audio.",
                        "default": "auto"
                    },
                    "audioFormat": {
                        "title": "Audio Format",
                        "enum": [
                            "best",
                            "mp3",
                            "ogg",
                            "wav",
                            "opus"
                        ],
                        "type": "string",
                        "description": "Output audio format when downloading audio.",
                        "default": "mp3"
                    },
                    "audioBitrate": {
                        "title": "Audio Bitrate",
                        "enum": [
                            "320",
                            "256",
                            "128",
                            "96",
                            "64"
                        ],
                        "type": "string",
                        "description": "Audio bitrate for conversion.",
                        "default": "128"
                    },
                    "videoCodec": {
                        "title": "Video Codec",
                        "enum": [
                            "h264",
                            "av1",
                            "vp9"
                        ],
                        "type": "string",
                        "description": "Preferred video codec (mainly affects YouTube).",
                        "default": "h264"
                    },
                    "filenameStyle": {
                        "title": "Filename Style",
                        "enum": [
                            "classic",
                            "basic",
                            "pretty",
                            "nerdy"
                        ],
                        "type": "string",
                        "description": "How output files are named.",
                        "default": "basic"
                    },
                    "tiktokFullAudio": {
                        "title": "TikTok: Full Audio",
                        "type": "boolean",
                        "description": "Download original sound from TikTok without the video's changes.",
                        "default": true
                    },
                    "tiktokH265": {
                        "title": "TikTok: H.265 Codec",
                        "type": "boolean",
                        "description": "Use H.265 for TikTok downloads (better quality, less compatible).",
                        "default": false
                    },
                    "twitterGif": {
                        "title": "Twitter: Convert GIFs",
                        "type": "boolean",
                        "description": "Convert Twitter GIF-style videos to actual GIF format.",
                        "default": true
                    },
                    "youtubeHLS": {
                        "title": "YouTube: Use HLS",
                        "type": "boolean",
                        "description": "Use HLS for YouTube downloads (experimental, may bypass some restrictions).",
                        "default": false
                    },
                    "youtubeDubLang": {
                        "title": "YouTube: Dubbed Language",
                        "type": "string",
                        "description": "Language code for dubbed YouTube audio (e.g., 'en', 'es', 'ja')."
                    },
                    "disableMetadata": {
                        "title": "Disable Metadata",
                        "type": "boolean",
                        "description": "Don't embed metadata (title, artist, etc.) in downloaded files.",
                        "default": false
                    },
                    "concurrency": {
                        "title": "Concurrent Downloads",
                        "minimum": 1,
                        "maximum": 50,
                        "type": "integer",
                        "description": "Number of URLs to download simultaneously. Higher = faster but uses more memory.",
                        "default": 10
                    },
                    "cookies": {
                        "title": "Service Cookies",
                        "type": "object",
                        "description": "Cookies for authenticated downloads, keyed by service name. Format: { \"youtube\": [{\"name\": \"...\", \"value\": \"...\"}], \"instagram\": [...] }"
                    },
                    "proxyConfiguration": {
                        "title": "Proxy Configuration",
                        "type": "object",
                        "description": "Apify proxy configuration for routing requests through proxies."
                    }
                }
            },
            "runsResponseSchema": {
                "type": "object",
                "properties": {
                    "data": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string"
                            },
                            "actId": {
                                "type": "string"
                            },
                            "userId": {
                                "type": "string"
                            },
                            "startedAt": {
                                "type": "string",
                                "format": "date-time",
                                "example": "2025-01-08T00:00:00.000Z"
                            },
                            "finishedAt": {
                                "type": "string",
                                "format": "date-time",
                                "example": "2025-01-08T00:00:00.000Z"
                            },
                            "status": {
                                "type": "string",
                                "example": "READY"
                            },
                            "meta": {
                                "type": "object",
                                "properties": {
                                    "origin": {
                                        "type": "string",
                                        "example": "API"
                                    },
                                    "userAgent": {
                                        "type": "string"
                                    }
                                }
                            },
                            "stats": {
                                "type": "object",
                                "properties": {
                                    "inputBodyLen": {
                                        "type": "integer",
                                        "example": 2000
                                    },
                                    "rebootCount": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "restartCount": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "resurrectCount": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "computeUnits": {
                                        "type": "integer",
                                        "example": 0
                                    }
                                }
                            },
                            "options": {
                                "type": "object",
                                "properties": {
                                    "build": {
                                        "type": "string",
                                        "example": "latest"
                                    },
                                    "timeoutSecs": {
                                        "type": "integer",
                                        "example": 300
                                    },
                                    "memoryMbytes": {
                                        "type": "integer",
                                        "example": 1024
                                    },
                                    "diskMbytes": {
                                        "type": "integer",
                                        "example": 2048
                                    }
                                }
                            },
                            "buildId": {
                                "type": "string"
                            },
                            "defaultKeyValueStoreId": {
                                "type": "string"
                            },
                            "defaultDatasetId": {
                                "type": "string"
                            },
                            "defaultRequestQueueId": {
                                "type": "string"
                            },
                            "buildNumber": {
                                "type": "string",
                                "example": "1.0.0"
                            },
                            "containerUrl": {
                                "type": "string"
                            },
                            "usage": {
                                "type": "object",
                                "properties": {
                                    "ACTOR_COMPUTE_UNITS": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "DATASET_READS": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "DATASET_WRITES": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "KEY_VALUE_STORE_READS": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "KEY_VALUE_STORE_WRITES": {
                                        "type": "integer",
                                        "example": 1
                                    },
                                    "KEY_VALUE_STORE_LISTS": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "REQUEST_QUEUE_READS": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "REQUEST_QUEUE_WRITES": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "DATA_TRANSFER_INTERNAL_GBYTES": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "DATA_TRANSFER_EXTERNAL_GBYTES": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "PROXY_RESIDENTIAL_TRANSFER_GBYTES": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "PROXY_SERPS": {
                                        "type": "integer",
                                        "example": 0
                                    }
                                }
                            },
                            "usageTotalUsd": {
                                "type": "number",
                                "example": 0.00005
                            },
                            "usageUsd": {
                                "type": "object",
                                "properties": {
                                    "ACTOR_COMPUTE_UNITS": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "DATASET_READS": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "DATASET_WRITES": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "KEY_VALUE_STORE_READS": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "KEY_VALUE_STORE_WRITES": {
                                        "type": "number",
                                        "example": 0.00005
                                    },
                                    "KEY_VALUE_STORE_LISTS": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "REQUEST_QUEUE_READS": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "REQUEST_QUEUE_WRITES": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "DATA_TRANSFER_INTERNAL_GBYTES": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "DATA_TRANSFER_EXTERNAL_GBYTES": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "PROXY_RESIDENTIAL_TRANSFER_GBYTES": {
                                        "type": "integer",
                                        "example": 0
                                    },
                                    "PROXY_SERPS": {
                                        "type": "integer",
                                        "example": 0
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```
