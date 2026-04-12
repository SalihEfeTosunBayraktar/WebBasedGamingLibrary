require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const db = require('./database');
const { scanFolderForGames } = require('./scanner');
const { launchGame } = require('./launcher');
const { downloadCover, searchSteamGridDB, getSteamGridImages } = require('./metadata');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve covers statically
app.use('/covers', express.static(path.join(__dirname, 'data', 'covers')));

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const coversDir = path.join(__dirname, 'data', 'covers');
if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'data', 'covers'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, generateId() + ext);
    }
});
const upload = multer({ storage });

app.get('/api/games', (req, res) => {
    res.json(db.getDb().games);
});

app.post('/api/games/:id/launch', (req, res) => {
    const game = db.getDb().games.find(g => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    
    const success = launchGame(game.path, game.exe);
    if (success) {
        game.lastPlayed = new Date().toISOString();
        db.save();
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Failed to launch' });
    }
});

app.delete('/api/games/:id', (req, res) => {
    const data = db.getDb();
    data.games = data.games.filter(g => g.id !== req.params.id);
    db.save();
    res.json({ success: true });
});

app.put('/api/games/:id', async (req, res) => {
    const data = db.getDb();
    const game = data.games.find(g => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const { name, coverUrl, heroUrl, groupId, path: reqPath, exe, sgdbQuery } = req.body;
    if (name) game.name = name;
    if (groupId !== undefined) game.groupId = groupId;
    if (reqPath) game.path = reqPath;
    if (exe) game.exe = exe;
    if (sgdbQuery !== undefined) game.sgdbQuery = sgdbQuery;
    if (coverUrl) {
        const localCover = await downloadCover(coverUrl);
        if (localCover) game.cover = localCover;
    }
    if (heroUrl) {
        const localHero = await downloadCover(heroUrl);
        if (localHero) game.hero = localHero;
    }
    db.save();
    res.json(game);
});

app.post('/api/games', async (req, res) => {
    const { name, path: gamePath, exe, coverUrl } = req.body;
    let localCover = null;
    if (coverUrl) {
        localCover = await downloadCover(coverUrl);
    }
    
    const newGame = {
        id: generateId(),
        name: name || 'Unknown Game',
        path: gamePath,
        exe: exe,
        cover: localCover,
        addedAt: new Date().toISOString(),
        lastPlayed: null
    };
    
    db.getDb().games.push(newGame);
    db.save();
    res.json(newGame);
});

// Scan folder endpoint
app.post('/api/scan', async (req, res) => {
    try {
        const { folderPath } = req.body;
        if (!folderPath || typeof folderPath !== 'string') {
            return res.status(400).json({ error: 'Ge\u00e7ersiz klas\u00f6r yolu' });
        }
        if (!fs.existsSync(folderPath)) {
            return res.status(400).json({ error: 'Klas\u00f6r bulunamad\u0131' });
        }

        const data = db.getDb();
        if (!data.scanFolders) data.scanFolders = [];
        if (!data.scanFolders.includes(folderPath)) {
            data.scanFolders.push(folderPath);
        }

        const foundGames = scanFolderForGames(folderPath);
        let addedCount = 0;
        for (const g of foundGames) {
            const alreadyExists = data.games.some(
                ex => ex.path === g.path && ex.exe === g.exe
            );
            if (!alreadyExists) {
                data.games.push({ id: generateId(), ...g, addedAt: new Date().toISOString(), lastPlayed: null });
                addedCount++;
            }
        }
        db.save();
        res.json({ success: true, added: addedCount });
    } catch (err) {
        console.error('Scan error:', err);
        res.status(500).json({ error: 'Tarama s\u0131ras\u0131nda hata olu\u015ftu' });
    }
});

app.post('/api/rescan-all', async (req, res) => {
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
                const alreadyExists = data.games.some(
                    ex => ex.path === g.path && ex.exe === g.exe
                );
                if (!alreadyExists) {
                    data.games.push({ id: generateId(), ...g, addedAt: new Date().toISOString(), lastPlayed: null });
                    totalAdded++;
                }
            }
        }
        db.save();
        res.json({ success: true, added: totalAdded });
    } catch (err) {
        console.error('Rescan error:', err);
        res.status(500).json({ error: 'Yeniden tarama s\u0131ras\u0131nda hata olu\u015ftu' });
    }
});

// Manage scan folders
app.get('/api/scan-folders', (req, res) => {
    let data = db.getDb();
    res.json(data.scanFolders || []);
});

app.delete('/api/scan-folders', (req, res) => {
    const { folderPath } = req.body;
    let data = db.getDb();
    if (data.scanFolders) {
        data.scanFolders = data.scanFolders.filter(f => f !== folderPath);
        db.save();
    }
    res.json({ success: true, folders: data.scanFolders });
});


// Group Endpoints
app.get('/api/groups', (req, res) => {
    res.json(db.getDb().groups || []);
});

app.post('/api/groups', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const data = db.getDb();
    if (!data.groups) data.groups = [];
    const newGroup = { id: generateId(), name };
    data.groups.push(newGroup);
    db.save();
    res.json(newGroup);
});

app.put('/api/groups/:id', (req, res) => {
    const { name } = req.body;
    const data = db.getDb();
    const group = (data.groups || []).find(g => g.id === req.params.id);
    if (group && name) {
        group.name = name;
        db.save();
    }
    res.json(group || {});
});

app.delete('/api/groups/:id', (req, res) => {
    const data = db.getDb();
    const groupId = req.params.id;
    if (data.groups) {
        data.groups = data.groups.filter(g => g.id !== groupId);
    }
    if (data.games) {
        data.games.forEach(g => {
            if (g.groupId === groupId) g.groupId = null;
        });
    }
    db.save();
    res.json({ success: true });
});

// SteamGridDB Proxy Endpoints
app.get('/api/steamgrid/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);
    const apiKey = db.getDb().uiConfig?.steamGridApiKey;
    if (!apiKey) return res.status(401).json({ error: "API Anahtarı eksik!" });
    const results = await searchSteamGridDB(query, apiKey);
    res.json(results);
});

app.get('/api/steamgrid/game/:id', async (req, res) => {
    const apiKey = db.getDb().uiConfig?.steamGridApiKey;
    if (!apiKey) return res.status(401).json({ error: "API Anahtarı eksik!" });
    const results = await getSteamGridImages(req.params.id, apiKey);
    res.json(results);
});

app.post('/api/steamgrid/apply', async (req, res) => {
    const { gameId, type, url } = req.body;
    const data = db.getDb();
    const game = data.games.find(g => g.id === gameId);
    if (!game) return res.status(404).json({ error: "Game not found" });

    const localFile = await downloadCover(url);
    if (localFile) {
        if (type === 'cover') game.cover = localFile;
        else if (type === 'hero') game.hero = localFile;
        db.save();
    }
    res.json(game);
});

app.get('/api/drives', (req, res) => {
    const fs = require('fs');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const drives = [];
    for (const letter of letters) {
        const drive = letter + ':\\';
        try {
            fs.accessSync(drive, fs.constants.R_OK);
            drives.push(drive);
        } catch (e) {
            // Ignore unmounted or unreadable drives
        }
    }
    if (drives.length === 0) drives.push('C:\\'); // Absolute fallback
    res.json(drives);
});

app.get('/api/directory', (req, res) => {
    const targetPath = req.query.path || 'C:\\';
    const includeFiles = req.query.files === 'true';
    try {
        const items = fs.readdirSync(targetPath, { withFileTypes: true });
        const folders = items
             .filter(item => item.isDirectory())
             .map(item => item.name)
             .filter(name => !name.startsWith('$') && name !== 'System Volume Information');
             
        const files = includeFiles 
            ? items.filter(item => item.isFile() && item.name.toLowerCase().endsWith('.exe')).map(item => item.name)
            : [];
             
        res.json({
            path: targetPath,
            folders: folders.sort((a,b) => a.localeCompare(b)),
            files: files.sort((a,b) => a.localeCompare(b))
        });
    } catch(err) {
        res.status(500).json({ error: 'Klasöre erişim yok', folders: [], files: [] });
    }
});

// Handle custom cover upload
app.post('/api/games/:id/cover', upload.single('cover'), (req, res) => {
    const game = db.getDb().games.find(g => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    
    if (req.file) {
        game.cover = req.file.filename;
        db.save();
        res.json({ success: true, cover: game.cover });
    } else {
        res.status(400).json({ error: 'No file uploaded' });
    }
});

// Handle custom hero/background upload
app.post('/api/games/:id/hero', upload.single('hero'), (req, res) => {
    const game = db.getDb().games.find(g => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    
    if (req.file) {
        game.hero = req.file.filename;
        db.save();
        res.json({ success: true, hero: game.hero });
    } else {
        res.status(400).json({ error: 'No file uploaded' });
    }
});

app.get('/api/config', (req, res) => {
    const data = db.getDb();
    if (!data.uiConfig) {
        data.uiConfig = {
            bgDark: '#0f1118', bgCard: 'rgba(25, 28, 38, 0.6)', bgCardHover: 'rgba(35, 38, 50, 0.8)',
            textMain: '#f5f5f7', textMuted: '#a1a3af', accent: '#6b4cff', accentHover: '#8266ff',
            fontFamily: 'Inter', danger: '#ff4757'
        };
        db.save();
    }
    res.json(data.uiConfig);
});

app.put('/api/config', (req, res) => {
    const data = db.getDb();
    data.uiConfig = { ...data.uiConfig, ...req.body };
    db.save();
    res.json(data.uiConfig);
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
