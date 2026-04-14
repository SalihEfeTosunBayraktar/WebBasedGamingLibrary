import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionPath = path.join(__dirname, '../src/version.json');
const v = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

const args = process.argv.slice(2);
if (args.includes('--major')) { v.major++; v.minor=0; v.patch=0; v.build=0; }
else if (args.includes('--minor')) { v.minor++; v.patch=0; v.build=0; }
else if (args.includes('--patch')) { v.patch++; v.build=0; }
else { v.build++; }

fs.writeFileSync(versionPath, JSON.stringify(v, null, 2));
const newVersionStr = `${v.major}.${v.minor}.${v.patch}.${v.build}`;
console.log(`\n[\x1b[32mVERSION\x1b[0m] Bumping WBGL Version to \x1b[36mv${newVersionStr}\x1b[0m\n`);

// Auto-update start.bat
try {
    const batPath = path.join(__dirname, '../../start.bat');
    let batContent = fs.readFileSync(batPath, 'utf8');
    batContent = batContent.replace(/WEB-BASED GAMING LIBRARY\s+v[0-9.]+/g, `WEB-BASED GAMING LIBRARY  v${newVersionStr}`);
    fs.writeFileSync(batPath, batContent);
} catch (err) {
    console.error("Failed to update start.bat version:", err.message);
}
