/*
 * FPS calculator page (/fps-calculator/): pre-renders the game picker, the
 * game profile table, the popular-build FPS table and the FAQ schema from
 * games.js + engine.js. Called from build.js; returns the page URL for the sitemap.
 */
const fs = require("fs");
const path = require("path");

// Common builds, each at the resolution it's usually bought for.
const BUILDS = [
  ["ryzen-5-5600", "rtx-4060", "1080p"],
  ["ryzen-5-7600", "rtx-5070", "1440p"],
  ["ryzen-7-7800x3d", "rx-9070-xt", "1440p"],
  ["ryzen-7-9800x3d", "rtx-5080", "4k"],
];

module.exports = function buildFpsPage({ ROOT, SITE_URL, HW, Engine, inject, faqSchema }) {
  require(path.join(ROOT, "assets/js/games.js"));
  const { Games } = global.window;
  const short = Engine.shortName;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const find = (list, id) => list.find((x) => x.id === id) || (() => { throw new Error(`Unknown part id: ${id}`); })();
  const BASE = { res: "1440p", quality: "high", upscale: "off", ram: 32, hz: 144, streaming: false };

  const options = () =>
    `<optgroup label="Popular games">${Games.list.map((g) => `<option value="${g.id}">${esc(g.name)}</option>`).join("")}</optgroup>` +
    `<optgroup label="Game types">${Object.entries(Engine.WORKLOAD).map(([k, w]) => `<option value="${k}">${esc(w.label)}</option>`).join("")}</optgroup>`;

  function profiles() {
    const rows = Games.list.map((g) =>
      `<tr><td><strong>${esc(g.name)}</strong><br><small>${esc(g.note)}</small></td><td>${Engine.WORKLOAD[g.base].short}</td><td class="r num">${g.cap ? g.cap : "–"}</td></tr>`);
    return `<div class="table-scroll"><table><thead><tr><th>Game</th><th>Engine type</th><th class="r">FPS cap</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  }

  function buildsTable() {
    const builds = BUILDS.map(([c, g, res]) => ({ cpu: find(HW.cpus, c), gpu: find(HW.gpus, g), res }));
    const head = builds.map((b) => `<th class="r">${short(b.cpu.name)} + ${short(b.gpu.name)}<br><small>${Engine.RES[b.res].label}</small></th>`).join("");
    const rows = Games.list.map((game) => {
      const cells = builds.map((b) => {
        const r = Games.evaluate(b.cpu, b.gpu, game.id, { ...BASE, res: b.res });
        const href = `?cpu=${b.cpu.id}&amp;gpu=${b.gpu.id}&amp;game=${game.id}${b.res !== BASE.res ? `&amp;res=${b.res}` : ""}#calculator`;
        return `<td class="r"><a class="load-build" href="${href}">${fmt(r.fps)}${r.capped ? " <small>cap</small>" : ""}</a></td>`;
      }).join("");
      return `<tr><td><strong>${esc(game.name)}</strong></td>${cells}</tr>`;
    });
    return `<div class="table-scroll"><table class="builds-table"><thead><tr><th>Game</th>${head}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  }

  const file = path.join(ROOT, "fps-calculator/index.html");
  let html = fs.readFileSync(file, "utf8");
  html = inject(html, "GAMEOPTIONS", options());
  html = inject(html, "GAMEPROFILES", profiles());
  html = inject(html, "GAMEBUILDS", buildsTable());
  html = inject(html, "FAQSCHEMA", faqSchema(html));
  html = html.replace(/https:\/\/www\.example\.com\//g, SITE_URL);
  fs.writeFileSync(file, html);
  return "fps-calculator/";
};
