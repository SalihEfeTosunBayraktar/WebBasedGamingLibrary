const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Initial structure
let data = {
    games: [],
    groups: [],
    scanFolders: [],
    uiConfig: {
        bgDark: '#0f1118',
        bgCard: 'rgba(25, 28, 38, 0.6)',
        bgCardHover: 'rgba(35, 38, 50, 0.8)',
        textMain: '#f5f5f7',
        textMuted: '#a1a3af',
        accent: '#6b4cff',
        accentHover: '#8266ff',
        fontFamily: 'Inter',
        danger: '#ff4757',
        playBtnColor: '#6b4cff',
        playBtnOpacity: 0.7
    }
};

// Load existing DB
if (fs.existsSync(dbPath)) {
    try {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        const loaded = JSON.parse(raw);
        // Merge loaded data with default structure to ensure new fields are added
        data = {
            ...data,
            ...loaded,
            uiConfig: {
                ...data.uiConfig,
                ...(loaded.uiConfig || {})
            }
        };
    } catch (e) {
        console.error("Error reading db.json, starting fresh.");
    }
} else {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// ── Startup migration: strip debug/scanner-internal fields from game records ──
let migrated = false;
(data.games || []).forEach(g => {
    if ('_candidates' in g)    { delete g._candidates;   migrated = true; }
    if ('rawFolderName' in g)  { delete g.rawFolderName; migrated = true; }
});
if (migrated) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}


function save() {
    const tmpPath = dbPath + '.tmp';
    try {
        fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
        fs.renameSync(tmpPath, dbPath);
    } catch (err) {
        console.error("Atomic save failed:", err);
    }
}

module.exports = {
    getDb: () => data,
    save: save
};
