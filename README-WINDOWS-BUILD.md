## 🖥️ Building on Windows (Manual)

To build the Windows installer (`.msi`) manually on Windows, follow these steps.

### ⚙️ Prerequisites

Install **once**, in order:

1. **[Git for Windows](https://git-scm.com/download/win)**
2. **[Node.js LTS (v18 or v20)](https://nodejs.org/)** — check "Add to PATH" during install
3. **[Rust](https://rustup.rs/)** — select `x86_64-pc-windows-msvc`
4. **[Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)** — during install, select:
   - ✅ **C++ build tools**
   - ✅ **Windows 10/11 SDK**
   - ✅ **CMake tools for Visual Studio**

> 💡 **PowerShell note**: If you see `npm.ps1 cannot be loaded`, run this **as Administrator** first:
> ```powershell
> Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

### ▶️ Build Steps (copy/paste into PowerShell)

Open **PowerShell** (no need for Admin unless setting execution policy), then run:

```powershell
# Clone your repo (skip if already cloned)
git clone https://github.com/YOUR-USERNAME/ef-checkins.git
cd ef-checkins

# Install dependencies
npm ci

# Build frontend (Vite → ./dist/)
npm run build

# Build Tauri app + Windows MSI
cd src-tauri
npx tauri build --target windows-msvc
```

✅ Your installer is now at:
```
src-tauri\target\release\bundle\msi\ef-checkins_1.0.1_x64.msi
```

### 🔍 Verify before building

Run these *before* `npx tauri build` to confirm setup:

```powershell
dir .\dist\          # Should list index.html, notification.html, assets/
npm --version          # e.g., v10.8.2
cargo --version        # e.g., rustc 1.98.1
rustup target list --installed | findstr "x86_64-pc-windows-msvc"
```

> ✅ All must succeed. If any fails, reply with the error — I’ll help fix it instantly.

### 📦 Distributing

The `.msi` file is ready to install on any Windows 10/11 machine. For zero SmartScreen warnings, [sign it with `signtool`](https://learn.microsoft.com/en-us/windows-hardware/drivers/dashboard/get-a-code-signing-certificate).