const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

function launchGame(gamePath, exeName) {
    const fullPath = path.join(gamePath, exeName);

    // Check if drive/root is accessible (e.g. D:\ might not be mounted)
    const driveRoot = path.parse(gamePath).root; // e.g. "D:\\"
    const driveLetter = driveRoot.replace(/[\\/]/g, ''); // e.g. "D:"
    if (driveRoot && !fs.existsSync(driveRoot)) {
        console.error(`Drive not accessible: ${driveRoot}`);
        return { ok: false, reason: 'drive_not_found', drive: driveLetter };
    }

    // Safety check: ensure the exe file exists
    if (!fs.existsSync(fullPath)) {
        console.error('Launch candidate not found at:', fullPath);
        return { ok: false, reason: 'file_not_found' };
    }

    try {
        // Use 'start' command on Windows to cleanly detach and handle GUI properly (e.g. UAC)
        // Wrapped in double quotes for path safety
        exec(`start "" "${fullPath}"`, { cwd: gamePath }, (err) => {
            if (err) console.error('Launch error:', err);
        });
        return { ok: true };
    } catch (e) {
        console.error('Failed to launch game:', e);
        return { ok: false, reason: 'launch_error' };
    }
}

module.exports = { launchGame };
