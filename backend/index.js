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
});
