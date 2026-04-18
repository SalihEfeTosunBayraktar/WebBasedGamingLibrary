// index.js — App entry point and middleware setup
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

const IS_COMPILED = !!process.pkg;
const ROOT_DIR = IS_COMPILED ? path.dirname(process.execPath) : __dirname;

// Serve uploaded cover art
const coversDir = path.join(ROOT_DIR, 'data', 'covers');
if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });
app.use('/covers', express.static(coversDir));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/games',     require('./routes/games'));
app.use('/api/scan',      require('./routes/scan'));
app.use('/api/groups',    require('./routes/groups'));
app.use('/api/config',    require('./routes/config'));
app.use('/api/steamgrid', require('./routes/sgdb'));
app.use('/api',           require('./routes/files'));

// ── Serve Frontend ────────────────────────────────────────────────────────────
// In standalone mode, dist is bundled in the executable's virtual filesystem
const frontendPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    // Fallback for SPA routing using regex for Express 5+ compatibility instead of '*'
    app.get(/^.*$/, (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);

    if (IS_COMPILED) {
        console.log(`İlk açılış: Chrome App olarak http://localhost:${PORT} başlatılıyor...`);
        const { exec } = require('child_process');
        exec(`start chrome --app=http://localhost:${PORT}`, (err) => {
            if (err) {
                console.warn('Chrome uygulaması başlatılamadı, varsayılan tarayıcı deneniyor...');
                exec(`start http://localhost:${PORT}`);
            }
        });
    }

    // Auto-scan saved folders in background (non-blocking)
    setImmediate(async () => {
        try {
            const db  = require('./database');
            const { scanFolderForGames } = require('./scanner');
            const { generateId, isDuplicate, cleanGame } = require('./scanUtils');
            const fs2 = require('fs');

            const data = db.getDb();
            if (!data.scanFolders || data.scanFolders.length === 0) return;

            let added = 0;
            for (const folder of data.scanFolders) {
                if (!fs2.existsSync(folder)) continue;
                const found = scanFolderForGames(folder);
                for (const g of found) {
                    if (!isDuplicate(data.games, g)) {
                        data.games.push({
                            id: generateId(),
                            ...cleanGame(g),
                            addedAt: new Date().toISOString(),
                            lastPlayed: null,
                        });
                        added++;
                    }
                }
            }
            if (added > 0) {
                db.save();
                console.log(`Auto-scan: ${added} new game(s) added.`);
            }
        } catch (err) {
            console.error('Auto-scan error:', err);
        }
    });
});
