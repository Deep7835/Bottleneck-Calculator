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
// Shrink it ~3x with a 128-colour palette (needs Python + Pillow; skipped if missing).
try {
  execFileSync("python3", ["-c", "import sys;from PIL import Image;p=sys.argv[1];Image.open(p).convert('RGB').quantize(colors=128,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).save(p,optimize=True)", path.join(ROOT, "og-image.png")]);
} catch { console.warn("Pillow not available; og-image.png left uncompressed"); }
console.log("Wrote og-image.png");
