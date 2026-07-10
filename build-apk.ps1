$ErrorActionPreference = "Stop"

Write-Host "Building frontend..."
cd frontend
npm run build

Write-Host "Syncing Capacitor..."
npx cap sync android

Write-Host "Building Android APK..."
cd android
.\gradlew assembleDebug

Write-Host "Copying APK to apk-host..."
Copy-Item -Path "app\build\outputs\apk\debug\app-debug.apk" -Destination "..\..\apk-host\snagbite-debug.apk" -Force

Write-Host "Done! APK is available in apk-host/snagbite-debug.apk"
cd ..\..
