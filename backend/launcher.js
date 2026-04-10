const { exec } = require('child_process');
const path = require('path');

function launchGame(gamePath, exeName) {
    const fullPath = path.join(gamePath, exeName);
    
    try {
        // Use 'start' command on Windows to cleanly detach and handle GUI properly (e.g. UAC)
        exec(`start "" "${fullPath}"`, { cwd: gamePath }, (err) => {
            if (err) console.error("Launch error:", err);
        });
        return true;
    } catch (e) {
        console.error("Failed to launch game:", e);
        return false;
    }
}

module.exports = { launchGame };
