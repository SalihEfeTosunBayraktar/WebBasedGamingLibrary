// routes/config.js — UI configuration endpoints
const express = require('express');
const db = require('../database');

const router = express.Router();

const DEFAULT_CONFIG = {
    bgDark: '#0f1118',
    bgCard: 'rgba(25, 28, 38, 0.6)',
    bgCardHover: 'rgba(35, 38, 50, 0.8)',
    textMain: '#f5f5f7',
    textMuted: '#a1a3af',
    accent: '#6b4cff',
    accentHover: '#8266ff',
    fontFamily: 'Inter',
    danger: '#ff4757',
};

router.get('/', (req, res) => {
    const data = db.getDb();
    if (!data.uiConfig) {
        data.uiConfig = { ...DEFAULT_CONFIG };
        db.save();
    }
    res.json(data.uiConfig);
});

router.put('/', (req, res) => {
    const data = db.getDb();
    data.uiConfig = { ...data.uiConfig, ...req.body };
    db.save();
    res.json(data.uiConfig);
});

module.exports = router;
