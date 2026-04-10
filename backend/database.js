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
        danger: '#ff4757'
    }
};

// Load existing DB
if (fs.existsSync(dbPath)) {
    try {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        data = JSON.parse(raw);
    } catch (e) {
        console.error("Error reading db.json, starting fresh.");
    }
} else {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function save() {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    getDb: () => data,
    save: save
};
