$ErrorActionPreference = "Stop"

Write-Host "Building frontend..."
cd frontend
npm run build

Write-Host "Syncing Capacitor..."
npx cap sync android

Write-Host "Building Android APK..."
cd android

# Check for active live-reload server configuration
$configFile = "app\src\main\assets\capacitor.config.json"
if (Test-Path $configFile) {
    $configJson = Get-Content $configFile -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($configJson -and $configJson.server -and $configJson.server.url) {
        throw "Error: A live-reload server URL ($($configJson.server.url)) is configured in capacitor.config.json. Please stop the 'npm run cap:live' process and run 'npx cap sync android' to restore standard configuration before building the APK."
    }
}

# Clean intermediate build cache to ensure stale configurations are not packaged
Write-Host "Cleaning Gradle build cache..."
.\gradlew clean

.\gradlew assembleDebug

Write-Host "Copying APK to project root..."
Copy-Item -Path "app\build\outputs\apk\debug\app-debug.apk" -Destination "..\..\snagbite-debug.apk" -Force

Write-Host "Done! APK is available in project root: snagbite-debug.apk"
cd ..\..
