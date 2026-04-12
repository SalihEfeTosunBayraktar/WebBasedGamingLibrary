// routes/groups.js — Category/group management endpoints
const express = require('express');
const db = require('../database');

const router = express.Router();
const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

// List all groups
router.get('/', (req, res) => {
    res.json(db.getDb().groups || []);
});

// Create group
router.post('/', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const data = db.getDb();
    if (!data.groups) data.groups = [];
    const newGroup = { id: generateId(), name };
    data.groups.push(newGroup);
    db.save();
    res.json(newGroup);
});

// Rename group
router.put('/:id', (req, res) => {
    const { name } = req.body;
    const data = db.getDb();
    const group = (data.groups || []).find(g => g.id === req.params.id);
    if (group && name) { group.name = name; db.save(); }
    res.json(group || {});
});

// Delete group (games become uncategorized)
router.delete('/:id', (req, res) => {
    const data = db.getDb();
    const groupId = req.params.id;
    if (data.groups) data.groups = data.groups.filter(g => g.id !== groupId);
    if (data.games) data.games.forEach(g => { if (g.groupId === groupId) g.groupId = null; });
    db.save();
    res.json({ success: true });
});

module.exports = router;
