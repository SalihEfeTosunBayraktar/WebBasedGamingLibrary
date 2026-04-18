// routes/games.js — Game CRUD + launch + image upload endpoints
const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('../database');
const { launchGame } = require('../launcher');
const { downloadCover } = require('../metadata');

const router = express.Router();
const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const IS_COMPILED = !!process.pkg;
const ROOT_DIR = IS_COMPILED ? path.dirname(process.execPath) : path.join(__dirname, '..');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(ROOT_DIR, 'data', 'covers')),
    filename: (req, file, cb) => cb(null, generateId() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// List all games
router.get('/', (req, res) => {
    res.json(db.getDb().games);
});

// Add game manually
router.post('/', async (req, res) => {
    const { name, path: gamePath, exe, coverUrl } = req.body;
    let localCover = null;
    if (coverUrl) localCover = await downloadCover(coverUrl);

    const newGame = {
        id: generateId(),
        name: name || 'Unknown Game',
        path: gamePath,
        exe,
        cover: localCover,
        addedAt: new Date().toISOString(),
        lastPlayed: null,
    };
    db.getDb().games.push(newGame);
    db.save();
    res.json(newGame);
});

// Update game metadata
router.put('/:id', async (req, res) => {
    const data = db.getDb();
    const game = data.games.find(g => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const { name, coverUrl, heroUrl, groupId, path: reqPath, exe, sgdbQuery } = req.body;
    if (name) game.name = name;
    if (groupId !== undefined) game.groupId = groupId;
    if (reqPath) game.path = reqPath;
    if (exe) game.exe = exe;
    if (sgdbQuery !== undefined) game.sgdbQuery = sgdbQuery;
    if (coverUrl) { const c = await downloadCover(coverUrl); if (c) game.cover = c; }
    if (heroUrl)  { const h = await downloadCover(heroUrl);  if (h) game.hero  = h; }

    db.save();
    res.json(game);
});

// Delete game
router.delete('/:id', (req, res) => {
    const data = db.getDb();
    data.games = data.games.filter(g => g.id !== req.params.id);
    db.save();
    res.json({ success: true });
});

// Launch game
router.post('/:id/launch', (req, res) => {
    const game = db.getDb().games.find(g => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const result = launchGame(game.path, game.exe);
    if (result.ok) {
        game.lastPlayed = new Date().toISOString();
        db.save();
        res.json({ success: true });
    } else if (result.reason === 'drive_not_found') {
        res.status(503).json({ error: 'drive_not_found', drive: result.drive });
    } else {
        res.status(500).json({ error: result.reason || 'launch_failed' });
    }
});

// Upload cover image
router.post('/:id/cover', upload.single('cover'), (req, res) => {
    const game = db.getDb().games.find(g => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    game.cover = req.file.filename;
    db.save();
    res.json({ success: true, cover: game.cover });
});

// Upload hero/background image
router.post('/:id/hero', upload.single('hero'), (req, res) => {
    const game = db.getDb().games.find(g => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    game.hero = req.file.filename;
    db.save();
    res.json({ success: true, hero: game.hero });
});

module.exports = router;
