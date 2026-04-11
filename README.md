# 🎮 Web-Based Gaming Library (WBGL)

A self-hosted, beautiful game library manager that runs in your browser. Organize, launch, and discover your PC games with full gamepad support.

![WBGL Screenshot](docs/screenshot.png)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎨 **12 Themes** | 9 dark + 3 light, fully customizable with live preview |
| 🕹️ **Gamepad Support** | Full D-Pad / stick navigation — use your controller like a console |
| 📂 **Auto Scanner** | Scans folders, scores EXEs with trigram similarity + file size heuristics |
| 🖼️ **SteamGridDB** | Fetch cover art and hero backgrounds directly from the internet |
| 🌐 **i18n** | Turkish & English UI, one-click toggle |
| 🗂️ **Categories** | Create groups, sort by name / last played / date added / random |
| 📐 **3 Layouts** | Grid, List, Console (PS-style horizontal scroll) |
| 🎭 **Custom Themes** | Build your own color scheme and export/import as JSON |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) **v18 or later**
- Windows (for game launching via `.exe`)

### 1 — Clone
```bash
git clone https://github.com/YOUR_USERNAME/WebBasedGamingLibrary.git
cd WebBasedGamingLibrary
```

### 2 — Install all dependencies
```bash
npm run install:all
```
This installs both backend and frontend packages in one step.

### 3 — Run
```bash
npm run dev
```
Or just double-click **`start.bat`**.

Then open **http://localhost:5173** in your browser.

> **Backend API** runs on port **3001**.  
> **Frontend dev server** runs on port **5173**.

---

## 📁 Project Structure

```
WebBasedGamingLibrary/
├── backend/
│   ├── index.js          # Express API server
│   ├── scanner.js        # Smart EXE detection (trigram scoring)
│   ├── database.js       # Simple JSON-based persistence
│   ├── launcher.js       # Windows game launcher
│   ├── metadata.js       # SteamGridDB integration
│   └── data/             # ⚠️ gitignored — created at runtime
│       ├── db.json
│       └── covers/
├── frontend/
│   └── src/
│       ├── App.jsx               # Root orchestrator
│       ├── i18n/                 # TR/EN translation system
│       ├── hooks/useGamepad.js   # Gamepad polling hook
│       └── components/
│           ├── layout/           # TopBar, Sidebar
│           ├── game/             # GameCard, GameGrid, GameModal
│           ├── settings/         # SettingsModal, theme system
│           ├── pickers/          # FolderPicker
│           └── sgdb/             # SteamGridDB modal
├── package.json          # Root scripts (install + run)
├── start.bat             # Windows one-click launcher
└── .gitignore
```

---

## 🎮 Gamepad Controls

| Button | Action |
|---|---|
| **Left Stick / D-Pad** | Navigate games |
| **A (Cross)** | Play focused game |
| **Y (Triangle)** | Open game details |
| **LB** | Open categories sidebar |
| **RB** | Cycle sort order |
| **START** | Open settings |
| **SELECT** | Toggle search |

---

## 🎨 Theme System

- Choose from 12 presets (dark & light)
- **Custom Theme Builder**: pick any color, previews live
- **Export** your theme as `.json`
- **Import** a theme file shared by others

---

## ⚙️ Configuration

All settings are persisted via the backend API in `backend/data/db.json`.

| Setting | Description |
|---|---|
| Scan Folders | Folders auto-scanned for games |
| Ignored EXEs | Keywords to skip during scan (e.g. `unins, setup, redist`) |
| SteamGridDB API Key | Get yours free at [steamgriddb.com](https://www.steamgriddb.com/profile/preferences/api) |
| Theme & Font | Fully customizable via Settings → Appearance |

---

## 🛠️ Development

```bash
# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend

# Production build
npm run build
```

---

## 📄 License

MIT — do whatever you want with it.
