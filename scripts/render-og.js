#!/usr/bin/env node
// Renders scripts/og-image.html to og-image.png (1200×630) with headless Chrome.
const { execFileSync } = require("child_process");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
execFileSync(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
  "--window-size=1200,630", "--virtual-time-budget=4000",
  `--screenshot=${path.join(ROOT, "og-image.png")}`,
  "file://" + path.join(__dirname, "og-image.html"),
], { stdio: "inherit" });
console.log("Wrote og-image.png");
