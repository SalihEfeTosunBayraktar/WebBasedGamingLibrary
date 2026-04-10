const fs = require('fs');
const path = require('path');

// Clean up release release names like [FitGirl Repack] etc.
function cleanGameName(folderName) {
    let name = folderName.replace(/\[.*?\]/g, '');
    name = name.replace(/\(.*?\)/g, '');
    name = name.replace(/[-_.]/g, ' ');
    
    const ignoreWords = ['fitgirl', 'repack', 'dodi', 'skidrow', 'codex', 'cpy', 'rxg', 'kaos', 'xatab', 'gog', 'v1', 'v2', 'v3', 'patch', 'update', 'edition', 'multi'];
    
    const parts = name.split(' ');
    const cleaned = parts.filter(p => !ignoreWords.includes(p.toLowerCase().trim()));
    
    // remove redundant spaces
    return cleaned.join(' ').replace(/\s+/g, ' ').trim();
}

function findExeRecursive(dirPath, depth = 0) {
    if (depth > 3) return []; // limit to 3 sub-levels deep
    let exes = [];
    try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            if (item.isDirectory()) {
                exes = exes.concat(findExeRecursive(fullPath, depth + 1));
            } else if (item.isFile() && item.name.toLowerCase().endsWith('.exe')) {
                const low = item.name.toLowerCase();
                if (!low.includes('unins') && !low.includes('crash') && !low.includes('redist') && !low.includes('setup') && !low.includes('dxwebsetup')) {
                    exes.push({ dir: dirPath, file: item.name });
                }
            }
        }
    } catch(e) {}
    return exes;
}

function scanFolderForGames(folderPath) {
    if (!fs.existsSync(folderPath)) return [];
    
    let foundExeFiles = [];

    try {
        const rootItems = fs.readdirSync(folderPath, { withFileTypes: true });
        
        for (const item of rootItems) {
            const itemPath = path.join(folderPath, item.name);
            
            if (item.isDirectory()) {
                const gameName = cleanGameName(item.name);
                const allExes = findExeRecursive(itemPath);
                
                if (allExes.length > 0) {
                    // Try to avoid launchers if possible, otherwise use the first one
                    const bestExe = allExes.find(e => !e.file.toLowerCase().includes('launcher')) || allExes[0];
                    foundExeFiles.push({
                        name: gameName,
                        rawFolderName: item.name,
                        path: bestExe.dir,
                        exe: bestExe.file
                    });
                }
            } else if (item.isFile() && item.name.toLowerCase().endsWith('.exe')) {
                 const valid = !item.name.toLowerCase().includes('unins');
                 if (valid) {
                     foundExeFiles.push({
                        name: cleanGameName(path.basename(item.name, '.exe')),
                        rawFolderName: '',
                        path: folderPath,
                        exe: item.name
                     });
                 }
            }
        }
    } catch(err) {
        console.error("Error scanning folder:", err);
    }
    
    return foundExeFiles;
}

module.exports = { scanFolderForGames, cleanGameName };
