// routes/scan.js — Folder scan + rescan + scan-folder management endpoints
const express = require('express');
const fs = require('fs');
const db = require('../database');
const { scanFolderForGames } = require('../scanner');
const { generateId, normPath, isDuplicate, cleanGame } = require('../scanUtils');

const router = express.Router();


// ── POST /api/scan — Scan a new folder ───────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { folderPath } = req.body;
        if (!folderPath || typeof folderPath !== 'string') {
            return res.status(400).json({ error: 'Geçersiz klasör yolu' });
        }
        if (!fs.existsSync(folderPath)) {
            return res.status(400).json({ error: 'Klasör bulunamadı' });
        }

        const data = db.getDb();
        if (!data.scanFolders) data.scanFolders = [];
        if (!data.scanFolders.map(normPath).includes(normPath(folderPath))) {
            data.scanFolders.push(folderPath);
        }

        const foundGames = scanFolderForGames(folderPath);
        let addedCount = 0;
        for (const g of foundGames) {
            if (!isDuplicate(data.games, g)) {
                data.games.push({
                    id: generateId(),
                    ...cleanGame(g),
                    addedAt: new Date().toISOString(),
                    lastPlayed: null,
                });
                addedCount++;
            }
        }
        db.save();
        res.json({ success: true, added: addedCount });
    } catch (err) {
        console.error('Scan error:', err);
        res.status(500).json({ error: 'Tarama sırasında hata oluştu' });
    }
});

// ── POST /api/scan/rescan-all — Rescan all saved folders ─────────────────────
router.post('/rescan-all', async (req, res) => {
    try {
        const data = db.getDb();
        if (!data.scanFolders || data.scanFolders.length === 0) {
            return res.json({ success: true, added: 0 });
        }

        let totalAdded = 0;
        for (const folder of data.scanFolders) {
            if (!fs.existsSync(folder)) continue;
            const foundGames = scanFolderForGames(folder);
            for (const g of foundGames) {
                if (!isDuplicate(data.games, g)) {
                    data.games.push({
                        id: generateId(),
                        ...cleanGame(g),
                        addedAt: new Date().toISOString(),
                        lastPlayed: null,
                    });
                    totalAdded++;
                }
            }
        }
        db.save();
        res.json({ success: true, added: totalAdded });
    } catch (err) {
        console.error('Rescan error:', err);
        res.status(500).json({ error: 'Yeniden tarama sırasında hata oluştu' });
    }
});

// ── GET /api/scan/folders — List saved scan folders ───────────────────────────
router.get('/folders', (req, res) => {
    res.json(db.getDb().scanFolders || []);
});

// ── DELETE /api/scan/folders — Remove a saved scan folder ────────────────────
router.delete('/folders', (req, res) => {
    const { folderPath } = req.body;
    const data = db.getDb();
    if (data.scanFolders) {
        const norm = normPath(folderPath);
        data.scanFolders = data.scanFolders.filter(f => normPath(f) !== norm);
        db.save();
    }
    res.json({ success: true, folders: data.scanFolders || [] });
});

module.exports = router;
