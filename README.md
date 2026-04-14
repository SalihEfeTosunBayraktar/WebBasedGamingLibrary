<div align="center">
  <br />
  <img src="frontend/public/gamepad-icon.png" alt="Gamepad" width="80" height="auto" />
  <h1>Web-Based Gaming Library (WBGL)</h1>
  <p><strong>v2.0.x</strong> | A highly dynamic, self-hosted, fully gamepad-accessible library manager.</p>
</div>

---

## 🌟 Overview / Proje Özeti
Web-Based Gaming Library is an elegant, entirely local, Node.js + React.js powered game launcher. It creates a console-like interface (similar to PlayStation or Playnite) right your browser. 

No more messy desktop shortcuts! Map your folders, fetch stunning covers via the **SteamGridDB API**, and launch your games directly from your sofa using your **Gamepad** or Keyboard.

## ✨ Key Features / Temel Özellikler
* **🎮 Seamless Gamepad Control:** Full navigation via Xbox/PS controllers. Supports holding `A` to quick-launch, `LB/RB` for sorting/tabbing, and uses smart axis dead-zones. 
* **📺 Smart Background Pausing:** Browsers usually continue listening to Gamepad inputs even when minimized. WBGL uses a custom `document.hasFocus()` architecture that **completely deafens** UI inputs the second you launch a game to prevent ghost navigations in the background!
* **🛡️ Data Loss Prevention (Atomic Saving):** During game indexing, your `db.json` database is written using tmp-atomic-saving. Even if your PC loses power during a save state, your entire game library will NOT be corrupted.
* **🌐 SteamGridDB Integration:** A built-in image cropper and metadata downloader that automatically cleans up broken streams if your internet drops.
* **🤖 Intelligent Automated Batch Scripts:** Built with `%~dp0` portability, run this anywhere on any PC without configuration nightmares!

## ⚙️ Installation & Usage / Kurulum ve Kullanım

### 1. `start.bat` (Main Launcher)
Simply double-click `start.bat`. 
- **Auto-Dependency Check:** If it notices missing `node_modules`, it will automatically prompt you to install them.
- **Bi-Lingual Memory:** On the very first launch, it will ask for your language preference (EN/TR) and save it to a hidden `.lang_pref` file. It will never ask you again unless you delete that file!

### 2. `update.bat` (Auto-Updater)
Pulls the latest code from GitHub safely without overriding your game covers or `db.json` file.
- Checks if `Git` is installed. If not, it automatically downloads and installs Git via **Microsoft Winget** natively in the command line!
- Automatically increments semantic versioning UI elements upon build.

### 3. `autostart_setup.bat` (Start with Windows)
Click to automatically run the library when your computer turns on.
- Deploys a programmatic VBScript that writes an exact-path `.lnk` directly into Windows Startup.
- Enforces `WindowStyle = 7`, meaning the server console boots up magically **minimized** to the taskbar instead of popping a black screen in your face at startup.

---

## 🕹️ Control Scheme / Kontrol Şeması

| Action | Gamepad (Controller) | Keyboard |
| :--- | :--- | :--- |
| **Navigate** | Left Stick / D-Pad | Arrows |
| **Open Details** | `A` Button (Short press) | `Enter` |
| **Quick Play / Launch** | `A` Button (Hold 600ms) | Hold `Enter` |
| **Back / Close Modal** | `B` Button | `Escape` |
| **Search / Context Menu** | `X` Button | - |
| **Options Modal** | `Y` Button | - |
| **Toggle Sidebar**| `LB` (Left Bumper) | `Q` |
| **Change Sorting / Tabs** | `RB` (Right Bumper) | `E` |

*(UI buttons dynamically format themselves. If you turn off your controller, the UI bottom-bar will instantly swap out the Gamepad button names for their Keyboard counterparts!)*

---

## 🛠️ Tech Stack / Altyapı
* **Frontend:** React (Vite), Lucide-React
* **Backend:** Node.js, Express, Axios (API requests), Child Process (Spawning exe)
* **Scripts:** ES Modules, Advanced Delayed-Expansion Windows Batch scripting.
* **Version Handling:** Automatic 4-digit build bumping logic built deeply into `npm run build`.

---
<div align="center">
  <sub>Created by <strong>Legendnoobe</strong> | Fully portable, plug-and-play architecture.</sub>
</div>
