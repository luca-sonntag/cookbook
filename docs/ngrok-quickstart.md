# ngrok Agent CLI Quickstart

A step-by-step guide to installing ngrok, exposing a local server publicly, and securing it with Google OAuth — tested on Windows.

---

## Prerequisites

- Windows with PowerShell
- Node.js installed
- An ngrok account → [dashboard.ngrok.com](https://dashboard.ngrok.com)
- Your **authtoken** (Settings → Your Authtoken)
- A **reserved domain** (Domains → New Domain, free tier gives one static domain)

---

## 1. Install the ngrok Agent CLI

Use **winget** to install the official binary:

```powershell
winget install ngrok.ngrok --accept-source-agreements --accept-package-agreements
```

> **Windows PATH caveat:** If you previously installed the old npm package (`npm install -g ngrok`), a broken `.ps1` shim at `C:\Users\<you>\AppData\Roaming\npm\ngrok.ps1` will shadow the real binary. Fix it permanently:
>
> ```powershell
> npm uninstall -g ngrok
> Remove-Item "$env:APPDATA\npm\ngrok.ps1" -Force
> Remove-Item "$env:APPDATA\npm\ngrok.cmd" -Force -ErrorAction SilentlyContinue
> Remove-Item "$env:APPDATA\npm\ngrok" -Force -ErrorAction SilentlyContinue
> ngrok version  # should now show the WinGet binary
> ```

### Update to the latest version

The winget package may be outdated. Run the built-in self-updater after installing:

```powershell
& "C:\Users\<you>\AppData\Local\Microsoft\WinGet\Links\ngrok.exe" update
```

This project required updating from **v3.3.1 → v3.39.8** because the free-tier account enforces a minimum agent version of 3.20.0 (`ERR_NGROK_121`).

---

## 2. Connect your ngrok account

```powershell
& "C:\Users\<you>\AppData\Local\Microsoft\WinGet\Links\ngrok.exe" config add-authtoken <YOUR_AUTHTOKEN>
```

The token is saved to:

```
C:\Users\<you>\AppData\Local\ngrok\ngrok.yml
```

---

## 3. Start a minimal HTTP server on port 8080

Because this project uses `"type": "module"` in `package.json`, save the server as **`.cjs`** (CommonJS) to avoid ES module errors:

**`ngrok-quickstart/server.cjs`**

```js
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html>
<html>
  <head><title>ngrok Quickstart</title></head>
  <body>
    <h1>Hello from ngrok! 🚀</h1>
    <p>Request received: <code>${req.method} ${req.url}</code></p>
    <p>Time: ${new Date().toISOString()}</p>
  </body>
</html>`);
});

server.listen(8080, () => {
  console.log('HTTP server running on http://localhost:8080');
});
```

Run it:

```powershell
node .\ngrok-quickstart\server.cjs
```

---

## 4. Expose it publicly (basic tunnel)

```powershell
& "C:\Users\<you>\AppData\Local\Microsoft\WinGet\Links\ngrok.exe" http 8080 --domain=<YOUR_RESERVED_DOMAIN>
```

Your server is now reachable at `https://<YOUR_RESERVED_DOMAIN>`.

---

## 5 & 6. Secure with Google OAuth + named tunnel via ngrok.yml

Edit `C:\Users\<you>\AppData\Local\ngrok\ngrok.yml`:

```yaml
version: "2"
authtoken: <YOUR_AUTHTOKEN>

tunnels:
  cli-quickstart:
    proto: http
    addr: 8080
    domain: <YOUR_RESERVED_DOMAIN>
    oauth:
      provider: google
```

Then start the named tunnel:

```powershell
& "C:\Users\<you>\AppData\Local\Microsoft\WinGet\Links\ngrok.exe" start cli-quickstart
```

Open `https://<YOUR_RESERVED_DOMAIN>` in a browser — you will be redirected to a **Google OAuth consent screen** before reaching your local server.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `CommandNotFoundException` when running `ngrok` | Broken npm shim in PATH | Use full WinGet binary path |
| `unknown version '3'` in ngrok.yml | Malformed config (duplicate authtoken keys) | Rewrite `ngrok.yml` cleanly with `version: "2"` |
| `ERR_NGROK_121` — agent too old | winget ships an outdated version | Run `ngrok update` to self-update |

---

## Config file location

```
C:\Users\<you>\AppData\Local\ngrok\ngrok.yml
```

## ngrok Web Inspector

While a tunnel is active, the local inspector UI is available at:

```
http://127.0.0.1:4040
```
