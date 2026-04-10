const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

async function downloadCover(url) {
    if (!url) return null;
    const hash = crypto.createHash('md5').update(url).digest('hex');
    
    // Attempt to guess extension from URL
    let ext = '.jpg';
    try {
        const parsedUrl = new URL(url);
        const urlExt = path.extname(parsedUrl.pathname);
        if (urlExt) ext = urlExt;
    } catch (e) {}

    const filename = `${hash}${ext}`;
    const coverDir = path.join(__dirname, 'data', 'covers');
    const dest = path.join(coverDir, filename);

    if (!fs.existsSync(coverDir)) {
        fs.mkdirSync(coverDir, { recursive: true });
    }

    // Return if already downloaded
    if (fs.existsSync(dest)) {
        return filename;
    }

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        
        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(dest);
            response.data.pipe(writer);
            writer.on('finish', () => resolve(filename));
            writer.on('error', reject);
        });
    } catch (e) {
        console.error(`Failed to download cover from ${url}:`, e.message);
        return null;
    }
}

// Search SteamGridDB for Game ID
async function searchSteamGridDB(gameName, apiKey) {
    if (!apiKey) return [];
    try {
        const res = await axios.get(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(gameName)}`, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        if (res.data && res.data.success) {
            return res.data.data; // Array of games matching
        }
    } catch (err) {
        console.error("SteamGridDB Search Error:", err.message);
    }
    return [];
}

// Fetch Images from SteamGridDB safely
async function getSteamGridImages(gameId, apiKey) {
    if (!apiKey) return { grids: [], heroes: [] };
    const result = { grids: [], heroes: [] };
    try {
        const [gridsRes, heroesRes] = await Promise.all([
            axios.get(`https://www.steamgriddb.com/api/v2/grids/game/${gameId}`, { headers: { Authorization: `Bearer ${apiKey}` } }).catch(() => null),
            axios.get(`https://www.steamgriddb.com/api/v2/heroes/game/${gameId}`, { headers: { Authorization: `Bearer ${apiKey}` } }).catch(() => null)
        ]);

        if (gridsRes && gridsRes.data && gridsRes.data.success) {
            result.grids = gridsRes.data.data;
        }

        if (heroesRes && heroesRes.data && heroesRes.data.success) {
            result.heroes = heroesRes.data.data;
        }

    } catch (err) {
        console.error("SteamGridDB Images Error:", err.message);
    }
    return result;
}

module.exports = { downloadCover, searchSteamGridDB, getSteamGridImages };
