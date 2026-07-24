#!/usr/bin/env node
/**
 * Post-build script: copies static assets into the standalone directory.
 * Run after `next build` in standalone mode.
 */
const fs = require("fs");
const path = require("path");

const webDir = path.join(__dirname, "apps", "web");
const standalone = path.join(webDir, ".next", "standalone");
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

const staticDest = path.join(standalone, ".next", "static");
const publicDest = path.join(standalone, "public");

console.log(`Copying ${srcStatic} -> ${staticDest}`);
copyDir(srcStatic, staticDest);

console.log(`Copying ${srcPublic} -> ${publicDest}`);
copyDir(srcPublic, publicDest);

console.log("Static assets copied successfully.");
