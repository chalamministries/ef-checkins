# EF Checkins Kiosk App

A real-time attendance display powered by Faye WebSocket notifications.

## ✅ Features
- Automatic Faye subscription to `/notifications`
- Color-coded toast notifications (red/yellow/green)
- Member photo, name, membership, alerts, balance
- Sound feedback per alert color
- Kiosk-optimized UI (fullscreen, no decorations, always-on-top)
- Cross-platform builds (Windows MSI, macOS DMG, Linux AppImage)

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+), [Rust](https://www.rust-lang.org/tools/install) (stable)
- On Windows: [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) or VS 2022

### Install & Run
```bash
cd ef-checkins
npm install
npm run dev
```

### Build for Windows (MSI)
```bash
npm run build:msi
```
→ Output: `target/release/bundle/msi/EF Checkins_1.0.0_x64.msi`

## 🎨 Customization
- **Faye endpoint**: Edit `src/index.js`, `FAYE_ENDPOINT` constant
- **Icons**: Replace `assets/icons/*.png`
- **Sounds**: Drop `red.wav`, `yellow.wav`, `green.wav` into `assets/sounds/` and update `src/index.js` sound loading logic
- **UI colors**: Edit `src/index.css`

## 🛡️ Security
- All network requests are client-side only — no backend proxy needed
- No secrets stored in source — configure via environment or CLI args in production

## 🏗️ Architecture

This app uses a **Rust WebSocket client** (via `tungstenite`) to connect directly to `wss://faye.chalamministries.com:8999`, subscribe to `/notifications`, and parse payloads — *not* the JS-based Faye client. This provides:
- ✅ Automatic reconnects & ping/pong heartbeat
- ✅ Full payload parsing in Rust (no JS bridge overhead)
- ✅ Reliable alert handling (red/yellow/green), balance, membership, and image loading
- ✅ Better error resilience than browser-based WebSocket

The frontend (`src/index.js`) listens for `checkin-data` Tauri events — no manual Faye setup needed.

---
Built with ❤️ using [Tauri](https://tauri.app)
