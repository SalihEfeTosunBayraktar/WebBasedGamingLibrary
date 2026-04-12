// routes/files.js — Drive listing and directory browsing endpoints
const express = require('express');
const fs = require('fs');

const router = express.Router();

// List accessible Windows drives
router.get('/drives', (req, res) => {
    const drives = [];
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')) {
        const drive = letter + ':\\';
        try {
            fs.accessSync(drive, fs.constants.R_OK);
            drives.push(drive);
        } catch { /* not mounted */ }
    }
    if (drives.length === 0) drives.push('C:\\');
    res.json(drives);
});

// Browse directory contents
router.get('/directory', (req, res) => {
    const targetPath = req.query.path || 'C:\\';
    const includeFiles = req.query.files === 'true';
    try {
        const items = fs.readdirSync(targetPath, { withFileTypes: true });

        const folders = items
            .filter(i => i.isDirectory())
            .map(i => i.name)
            .filter(n => !n.startsWith('$') && n !== 'System Volume Information')
            .sort((a, b) => a.localeCompare(b));

        const files = includeFiles
            ? items
                .filter(i => i.isFile() && i.name.toLowerCase().endsWith('.exe'))
                .map(i => i.name)
                .sort((a, b) => a.localeCompare(b))
            : [];

        res.json({ path: targetPath, folders, files });
    } catch (err) {
        res.status(500).json({ error: 'Klasöre erişim yok', folders: [], files: [] });
    }
});

module.exports = router;
