const { spawn } = require('child_process');
const path = require('path');

console.log("🚀 Memulai Al-Quran Web + GhostDB...");

const isWin = process.platform === "win32";
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

// Jalankan GhostDB Backend
const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'GhostDB'),
  stdio: 'inherit'
});

// Jalankan Frontend Vite
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'quran-web'),
  stdio: 'inherit'
});

// Handle kill process
process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});
