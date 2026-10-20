/*
 * Approximate US street prices, October 2026, shared by the build guides and the
 * Mac comparison so their totals always agree. Ranges [low, high] in USD: graphics
 * card and memory prices move week to week. Not a guide (not listed in guides.js).
 */
const BUDGET = {
  "ryzen-5-5600": [95, 120], "i5-12400f": [100, 125], "ryzen-5-7500f": [120, 150],
  am4: [80, 110], lga1700: [90, 120], am5: [90, 130],
  ddr4: [70, 130], ddr5: [80, 150],
  "arc-b580": [250, 300], "rtx-5060": [320, 420], "rx-9060-xt-8gb": [320, 420], "rx-9060-xt-16gb": [380, 470],
  ssd: [65, 90], psu: [55, 75], case: [50, 75],
};
const MID = {
  "ryzen-5-7600": [170, 210], "ryzen-5-9600x": [190, 240], "ryzen-5-7600x3d": [280, 330],
  "rtx-5070": [580, 700], "rx-9070": [560, 680], "rx-9070-xt": [680, 820],
  cooler: [25, 45], board: [120, 170], ram32: [150, 300], ram16: [80, 150],
  ssd: [65, 90], psu: [85, 115], case: [70, 100],
};
const r10 = (n) => Math.round(n / 10) * 10;
// Sum a list of parts from one table, rounded to $10.
function sum(table, keys) {
  return keys.map((k) => table[k] || (() => { throw new Error(`prices: no price for ${k}`); })())
    .reduce((s, p) => [s[0] + p[0], s[1] + p[1]], [0, 0]).map(r10);
}
// Budget build: CPU, GPU, board, memory + shared parts. 1440p build: CPU, GPU + platform with 32 (or 16) GB.
const budgetTotal = (c, g, board, mem) => sum(BUDGET, [c, g, board, mem, "ssd", "psu", "case"]);
const midTotal = (c, g, ram = "ram32") => sum(MID, [c, g, "cooler", "board", ram, "ssd", "psu", "case"]);
const usd = ([a, b]) => `$${a.toLocaleString("en-US")}–${b.toLocaleString("en-US")}`;

module.exports = { BUDGET, MID, sum, budgetTotal, midTotal, usd };
