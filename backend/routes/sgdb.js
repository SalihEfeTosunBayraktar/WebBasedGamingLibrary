// routes/sgdb.js — SteamGridDB proxy endpoints
const express = require('express');
const db = require('../database');
const { downloadCover, searchSteamGridDB, getSteamGridImages } = require('../metadata');

const router = express.Router();

const getApiKey = () => db.getDb().uiConfig?.steamGridApiKey;

router.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);
    const apiKey = getApiKey();
    if (!apiKey) return res.status(401).json({ error: 'API Anahtarı eksik!' });

    try {
        const results = await searchSteamGridDB(query, apiKey);
        res.json(results);
    } catch (err) {
        console.error('SGDB search error:', err);
        res.status(500).json({ error: 'Arama hatası' });
    }
});

router.get('/game/:id', async (req, res) => {
    const apiKey = getApiKey();
    if (!apiKey) return res.status(401).json({ error: 'API Anahtarı eksik!' });

    try {
        const results = await getSteamGridImages(req.params.id, apiKey);
        res.json(results);
    } catch (err) {
        console.error('SGDB game images error:', err);
        res.status(500).json({ error: 'Görsel alınamadı' });
    }
});

router.post('/apply', async (req, res) => {
    const { gameId, type, url } = req.body;
    const data = db.getDb();
    const game = data.games.find(g => g.id === gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    try {
        const localFile = await downloadCover(url);
        if (localFile) {
            if (type === 'cover') game.cover = localFile;
            else if (type === 'hero') game.hero = localFile;
            db.save();
        }
        res.json(game);
    } catch (err) {
        console.error('SGDB apply error:', err);
        res.status(500).json({ error: 'Görsel uygulanamadı' });
    }
});

module.exports = router;
