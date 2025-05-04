#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Display banner
console.log("╔════════════════════════════════════════╗");
console.log("║  MrGuru.dev Portfolio - Next.js Mode   ║");
console.log("╚════════════════════════════════════════╝");
console.log("");

// Run Next.js
console.log("🚀 Starting Next.js server on port 3001...");
console.log("Access your site at: https://workspace.mytech7.repl.co/");
console.log("--------------------------------------------");

// Run the Next.js development server on port 3001
const nextProcess = spawn("npx", ["next", "dev", "-p", "3001"], {
  stdio: "inherit"
});

nextProcess.on("error", (error) => {
  console.error(`Failed to start Next.js server: ${error.message}`);
  process.exit(1);
});

process.on("SIGINT", () => {
  nextProcess.kill("SIGINT");
  process.exit(0);
});
