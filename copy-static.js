#!/usr/bin/env node
/**
 * Post-build script: copies static assets into the standalone directory.
 * Run after `next build` in standalone mode.
 */
const fs = require("fs");
const path = require("path");

const webDir = path.join(__dirname, "apps", "web");
const standaloneApp = path.join(webDir, ".next", "standalone", "apps", "web");
const srcStatic = path.join(webDir, ".next", "static");
const srcPublic = path.join(webDir, "public");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

const staticDest = path.join(standaloneApp, ".next", "static");
const publicDest = path.join(standaloneApp, "public");

console.log(`Copying ${srcStatic} -> ${staticDest}`);
copyDir(srcStatic, staticDest);

console.log(`Copying ${srcPublic} -> ${publicDest}`);
copyDir(srcPublic, publicDest);

// Copy cars-snapshot.json (read by aggregator at runtime)
const snapshotSrc = path.join(webDir, "src", "data", "cars-snapshot.json");
const snapshotDest = path.join(standaloneApp, "src", "data", "cars-snapshot.json");
if (fs.existsSync(snapshotSrc)) {
  fs.mkdirSync(path.dirname(snapshotDest), { recursive: true });
  console.log(`Copying ${snapshotSrc} -> ${snapshotDest}`);
  fs.copyFileSync(snapshotSrc, snapshotDest);
} else {
  console.warn("cars-snapshot.json not found, skipping");
}

console.log("Static assets copied successfully.");
