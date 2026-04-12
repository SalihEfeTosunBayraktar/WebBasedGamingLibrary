/**
 * scanUtils.js — Shared helpers for duplicate detection and game record cleaning.
 * Used by routes/scan.js and the startup auto-scan in index.js.
 */
const path = require('path');

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

/** Normalize a Windows path for case-insensitive comparison */
function normPath(p) {
    if (!p) return '';
    return path.normalize(p).replace(/[/\\]+$/, '').toLowerCase();
}

/**
 * Check if a scanned game already exists in the library.
 * Compares by normalized exe full path OR same exe name within same game tree.
 */
function isDuplicate(existing, scanned) {
    const scannedFull = normPath(path.join(scanned.path, scanned.exe));
    for (const ex of existing) {
        const exFull = normPath(path.join(ex.path || '', ex.exe || ''));
        if (exFull && exFull === scannedFull) return true;
        const sameExe = (ex.exe || '').toLowerCase() === (scanned.exe || '').toLowerCase();
        if (sameExe) {
            const exNorm      = normPath(ex.path || '');
            const scannedNorm = normPath(scanned.path || '');
            if (exNorm.startsWith(scannedNorm) || scannedNorm.startsWith(exNorm)) return true;
        }
    }
    return false;
}

/** Strip internal scanner fields before persisting to DB */
function cleanGame(g) {
    const { _candidates, rawFolderName, ...clean } = g;
    return clean;
}

module.exports = { generateId, normPath, isDuplicate, cleanGame };
