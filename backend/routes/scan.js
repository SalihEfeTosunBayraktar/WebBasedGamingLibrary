// routes/scan.js — Folder scan + rescan + scan-folder management endpoints
const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../database');
const { scanFolderForGames } = require('../scanner');

const router = express.Router();
const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

/**
 * Normalize a Windows path for case-insensitive, consistent comparison.
 * Trims trailing slashes, lowercases and normalizes separators.
 */
function normPath(p) {
    if (!p) return '';
    return path.normalize(p).replace(/[/\\]+$/, '').toLowerCase();
}

/**
 * Check if a scanned game already exists in the library.
 * Compares by normalized exe path (path+exe joined) OR just exe name within
 * the same top-level folder — catches both exact and subdirectory-shifted matches.
 */
function isDuplicate(existing, scanned) {
    const scannedFull = normPath(path.join(scanned.path, scanned.exe));

    for (const ex of existing) {
        // 1. Exact normalized match (path + exe)
        const exFull = normPath(path.join(ex.path || '', ex.exe || ''));
        if (exFull && exFull === scannedFull) return true;

        // 2. Same exe filename, paths share common ancestor (manual add vs scanner)
        const sameExe = (ex.exe || '').toLowerCase() === (scanned.exe || '').toLowerCase();
        if (sameExe) {
            const exNorm     = normPath(ex.path || '');
            const scannedNorm = normPath(scanned.path || '');
            // One is a prefix of the other → same game tree
            if (exNorm.startsWith(scannedNorm) || scannedNorm.startsWith(exNorm)) return true;
        }
    }
    return false;
}

/** Strip internal debug/scanner fields before persisting to DB */
function cleanGame(g) {
    const { _candidates, rawFolderName, ...clean } = g;
    return clean;
}

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
