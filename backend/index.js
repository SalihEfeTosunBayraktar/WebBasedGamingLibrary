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

// Serve uploaded cover art
const coversDir = path.join(__dirname, 'data', 'covers');
if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });
app.use('/covers', express.static(coversDir));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/games',     require('./routes/games'));
app.use('/api/scan',      require('./routes/scan'));
app.use('/api/groups',    require('./routes/groups'));
app.use('/api/config',    require('./routes/config'));
app.use('/api/steamgrid', require('./routes/sgdb'));
app.use('/api',           require('./routes/files'));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);

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
