# BUILD-WINDOWS.ps1
# Build EF Checkins Windows installer (.msi) — fully automated & verified
# Run from repo root: .\BUILD-WINDOWS.ps1

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host "🔧 EF Checkins — Windows Build Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# --- Prerequisite checks ---
Write-Host "`n✅ Checking prerequisites..." -ForegroundColor Cyan

# Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "❌ Node.js not found. Install from https://nodejs.org/ (LTS version)."
  exit 1
}
Write-Host "  ✓ Node.js $(node --version)"

# npm
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "❌ npm not found. Ensure Node.js was installed with 'Add to PATH'."
  exit 1
}
Write-Host "  ✓ npm $(npm --version)"

# Git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "❌ Git not found. Install from https://git-scm.com/download/win"
  exit 1
}
Write-Host "  ✓ Git $(git --version)"

# Rust + cargo
if (!(Get-Command cargo -ErrorAction SilentlyContinue)) {
  Write-Error "❌ cargo not found. Install Rust from https://rustup.rs/ (select x86_64-pc-windows-msvc)"
  exit 1
}
Write-Host "  ✓ cargo $(cargo --version)"

# Windows target
if (!(rustup target list --installed | Select-String "x86_64-pc-windows-msvc")) {
  Write-Error "❌ Rust Windows target missing. Run:`n  rustup target add x86_64-pc-windows-msvc"
  exit 1
}
Write-Host "  ✓ x86_64-pc-windows-msvc target installed"

# Visual Studio Build Tools (check via cl.exe — standard MSVC compiler)
if (!(Get-Command cl -ErrorAction SilentlyContinue)) {
  Write-Warning "⚠️  'cl.exe' (MSVC compiler) not found — Visual Studio Build Tools may be missing.`n   Install from: https://visualstudio.microsoft.com/visual-cpp-build-tools/`n   During install, select 'C++ build tools', 'Windows SDK', and 'CMake tools'."
  # Don't exit — let tauri fail with helpful message instead
} else {
  Write-Host "  ✓ MSVC compiler (cl.exe) detected"
}

# --- Repo setup ---
$repoRoot = Get-Location
$srcTauri = Join-Path $repoRoot "src-tauri"
$dist = Join-Path $repoRoot "dist"

Write-Host "`n📁 Setting up repository..." -ForegroundColor Cyan

# Clone if needed
if (!(Test-Path $srcTauri)) {
  Write-Host "  ⚠️  src-tauri/ not found — cloning fresh repo..."
  if (Test-Path ".git") {
    Write-Error "❌ Unexpected: .git exists but src-tauri/ missing. Please run 'git restore .' or re-clone."
    exit 1
  }
  Write-Host "  → Cloning ef-checkins from GitHub..."
  git clone https://github.com/YOUR-USERNAME/ef-checkins.git .
  if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Failed to clone repo."
    exit 1
  }
  Write-Host "  ✓ Cloned successfully"
} else {
  Write-Host "  ✓ src-tauri/ found — using existing repo"
}

# --- Build ---
Write-Host "`n⚙️  Building..." -ForegroundColor Cyan

# Install deps
Write-Host "  → Installing dependencies (npm ci)..."
npm ci
if ($LASTEXITCODE -ne 0) { Write-Error "❌ npm ci failed."; exit 1 }
Write-Host "  ✓ Dependencies installed"

# Build frontend
Write-Host "  → Building frontend (npm run build)..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "❌ npm run build failed."; exit 1 }
if (!(Test-Path $dist)) {
  Write-Error "❌ Frontend build succeeded but ./dist/ is missing — check vite.config.js"
  exit 1
}
Write-Host "  ✓ Frontend built to ./dist/"

# Build Tauri MSI
Write-Host "  → Building Windows installer (npx tauri build)..."
Set-Location $srcTauri
npx tauri build --target windows-msvc
if ($LASTEXITCODE -ne 0) {
  Write-Error "❌ Tauri build failed. Common fixes:`n  • Ensure Visual Studio Build Tools are installed (see warning above)`n  • Run PowerShell as Admin and run:`n      Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`n  • Then re-run this script."
  exit 1
}
Write-Host "  ✓ Tauri build completed"

# --- Success ---
$msiPath = Join-Path $srcTauri "target\release\bundle\msi\ef-checkins_1.0.1_x64.msi"
if (Test-Path $msiPath) {
  Write-Host "`n🎉 SUCCESS! Your Windows installer is ready:" -ForegroundColor Green
  Write-Host "   $msiPath" -ForegroundColor White
  Write-Host "`n💡 To install:`n   • Double-click the file, or`n   • Run: msiexec /i `"$msiPath`"`n" -ForegroundColor White
  Invoke-Item (Split-Path $msiPath)
} else {
  Write-Warning "⚠️  Installer file not found at expected path.`n   Please check src-tauri\\target\\release\\bundle\\msi\\"
}