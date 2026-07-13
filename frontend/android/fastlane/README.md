# Fastlane — Google Play internal-track upload

Uploads Snagbite's signed `.aab` to the **internal testing track** on Google Play,
without installing Ruby locally: Fastlane runs inside a small Docker image and the
`.aab` (built by `release.ps1`) is mounted in.

```
frontend/android/fastlane/
├── Fastfile        # `internal` lane — upload only
├── Appfile         # package name + key path (reads SUPPLY_JSON_KEY_FILE)
├── Dockerfile      # ruby:3.3-slim + fastlane
├── .dockerignore
└── play-store-key.json   # ← YOU add this, gitignored, NEVER commit
```

## Usage (from `frontend/`)

```powershell
npm run deploy:internal            # build (versionCode++) + upload
npm run deploy:internal:patch      # bump versionName patch, build + upload
npm run deploy:internal:upload     # upload newest existing .aab (no rebuild)
```

Or call the script directly for more control:

```powershell
scripts\deploy-internal.ps1 -Bump minor
scripts\deploy-internal.ps1 -SkipBuild -Status draft
scripts\deploy-internal.ps1 -KeyFile C:\secrets\snagbite-play.json
```

`-Status completed` (default) makes the build available to internal testers
immediately; `draft` creates an unreleased draft you finish in the console.

**Prerequisites:** Docker Desktop running, and the service-account key below.

---

## One-time setup (do this once)

### 1. Create a Google Cloud service account + key
1. In the [Google Cloud Console](https://console.cloud.google.com/), pick (or create)
   a project and enable the **Google Play Android Developer API**
   (APIs & Services → Library).
2. IAM & Admin → **Service Accounts** → Create service account (e.g.
   `play-publisher`). No project roles are required here.
3. Open the service account → **Keys** → Add key → **Create new key** → **JSON**.
   A `.json` file downloads.
4. Save it as **`frontend/android/fastlane/play-store-key.json`**
   (this exact name is gitignored). Treat it like a password — never commit or share it.

### 2. Grant it access in Play Console
1. In the [Play Console](https://play.google.com/console): **Users & permissions**
   → **Invite new user** → paste the service account's email
   (`...@...iam.gserviceaccount.com`).
2. Give it at least **Release to testing tracks** for the Snagbite app
   (Admin works too but is broader than needed).
3. It can take a few minutes for permissions to propagate.

### 3. First release must be manual
Google requires the **very first** `.aab` of a new app to be uploaded through the
Play Console UI. Once the app exists with one manual release, the API (this
Fastlane lane) can upload every subsequent build. You already have signed `.aab`
files in `frontend/releases/` — upload one manually first if you haven't yet.

### 4. Verify
```powershell
npm run deploy:internal:upload
```
This uploads the newest existing `.aab` without rebuilding — a quick way to confirm
credentials and permissions before wiring it into your normal flow.

---

## How it works
`deploy-internal.ps1` runs `release.ps1` (frontend build → `cap sync` → Gradle
`bundleRelease` → copy to `frontend/releases/`), then builds/reuses the
`snagbite-fastlane` Docker image and runs `fastlane internal`, mounting the newest
`.aab` and your key read-only. The lane calls Fastlane's `upload_to_play_store`
(`supply`) targeting `track: internal`, uploading only the bundle (no store
listing/metadata changes).

Bump the version with `-Bump patch|minor|major`; `versionCode` always
auto-increments and must be higher than any build already on Play.
