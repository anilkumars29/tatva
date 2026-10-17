// dev.js — Launches backend and frontend concurrently in one terminal
const { spawn } = require("child_process");
const path = require("path");

console.log("\x1b[36m%s\x1b[0m", "============================================================");
console.log("\x1b[36m%s\x1b[0m", "  Starting Tatva Knowledge Studio (Backend + Frontend)");
console.log("\x1b[36m%s\x1b[0m", "============================================================");

// 1. Start FastAPI backend
const backend = spawn("python", ["-m", "uvicorn", "main:app", "--port", "8000", "--reload"], {
  cwd: path.join(__dirname, "backend"),
  stdio: "inherit",
  shell: true,
});

// 2. Start Vite frontend
const frontend = spawn("npm", ["run", "dev"], {
  cwd: path.join(__dirname, "frontend"),
  stdio: "inherit",
  shell: true,
});

// Handle termination
function cleanup() {
  console.log("\nStopping all services...");
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
