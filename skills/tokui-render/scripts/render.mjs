#!/usr/bin/env node
// Build a self-contained interactive HTML report from TokUI DSL files.
//
//   node render.mjs report.tokui -o report.html
//   node render.mjs part1.tokui part2.tokui -o dashboard.html --title "Q3 复盘"
//   node render.mjs reply.md -o report.html            # extracts ```tokui fences
//   node render.mjs report.tokui --theme modern-dark
//
// Two page shells. "report" wraps sections in a centered document column with
// a title header. "dashboard" (auto-selected when every section's root tag is
// fit-screen, e.g. 数据大屏) drops the header and mounts each section in a
// full-viewport block so fit-screen scales against the screen, not a 1000px
// column. --shell forces either.
//
// The output inlines the TokUI UMD runtime + CSS (from this skill's assets/,
// falling back to node_modules/@jboltai/tokui/dist, or --runtime-dir), so the
// file opens offline in any browser. Node >= 18, zero dependencies.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const SKILL_ASSETS = join(scriptDir, "..", "assets");
const THEMES = new Set(["default", "dark", "modern", "modern-dark"]);
const SHELLS = new Set(["auto", "dashboard", "report"]);
const FENCE_RE = /```tokui[ \t]*\n([\s\S]*?)```/g;

function parseArgs(argv) {
  const opts = { inputs: [], out: null, title: "TokUI Report", theme: "default", shell: "auto", open: false, runtimeDir: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-o" || a === "--out") opts.out = argv[++i];
    else if (a === "--title") opts.title = argv[++i];
    else if (a === "--theme") opts.theme = argv[++i];
    else if (a === "--shell") opts.shell = argv[++i];
    else if (a === "--open") opts.open = true;
    else if (a === "--runtime-dir") opts.runtimeDir = argv[++i];
    else if (a === "-h" || a === "--help") opts.help = true;
    else opts.inputs.push(a);
  }
  return opts;
}

function usage() {
  console.log(`usage: node render.mjs [options] <file.tokui|file.md> [more.tokui …]

options:
  -o, --out <file.html>   output path (default: first input with .html)
  --title <text>          report title (default "TokUI Report")
  --theme <name>          default | dark | modern | modern-dark (default: default)
  --shell <mode>          auto | dashboard | report (default: auto — dashboard shell
                          when every section's root tag is fit-screen)
  --open                  open the output in the default browser after writing
  --runtime-dir <dir>     directory holding tokui.umd.js + tokui.css
                          (default: skill assets/, then node_modules/@jboltai/tokui/dist)`);
}

function extractUnits(text) {
  const fences = [...text.matchAll(FENCE_RE)].map((m) => m[1].replace(/\n$/, ""));
  if (fences.length > 0) return fences;
  const trimmed = text.trim();
  if (trimmed.includes("[") && trimmed.includes("]")) return [trimmed];
  return null;
}

// fit-screen scales against its mount area; only a root-level fit-screen (first
// tag opens it, last line closes it) means "this section IS a full screen".
// Exactly one screen per unit: a second root fit-screen would be clipped by the
// dashboard shell's overflow:hidden mount (split multi-screen docs into files).
function isDashboardUnit(dsl) {
  const lines = dsl.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return false;
  if (!/^\[fit-screen(?=[\s\]])/.test(lines[0]) || !/\[\/fit-screen\]\s*$/.test(lines[lines.length - 1])) return false;
  return (dsl.match(/\[fit-screen(?=[\s\]])/g) || []).length === 1;
}

function loadRuntime(runtimeDir) {
  const candidates = runtimeDir
    ? [resolve(runtimeDir)]
    : [SKILL_ASSETS, join(process.cwd(), "node_modules", "@jboltai", "tokui", "dist")];
  for (const dir of candidates) {
    const js = join(dir, "tokui.umd.js");
    const css = join(dir, "tokui.css");
    if (existsSync(js) && existsSync(css)) {
      return { js: readFileSync(js, "utf8"), css: readFileSync(css, "utf8"), dir };
    }
  }
  return null;
}

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help || opts.inputs.length === 0) {
  usage();
  process.exit(opts.inputs.length === 0 ? 2 : 0);
}
if (!THEMES.has(opts.theme)) {
  console.error(`✗ unknown theme "${opts.theme}" (default | dark | modern | modern-dark)`);
  process.exit(2);
}
if (!SHELLS.has(opts.shell)) {
  console.error(`✗ unknown shell "${opts.shell}" (auto | dashboard | report)`);
  process.exit(2);
}

const units = [];
for (const file of opts.inputs) {
  const text = await readFile(file, "utf8");
  const found = extractUnits(text);
  if (!found) {
    console.error(`✗ ${file}: no TokUI DSL found (no \`\`\`tokui fence, no [tags])`);
    process.exit(2);
  }
  units.push(...found);
}

const isDash = opts.shell === "dashboard" || (opts.shell === "auto" && units.every(isDashboardUnit));
// Letterbox filler: reuse the canvas background declared in the DSL (typically
// on the root grid, e.g. style:"background:#0a1428") so the empty bands flanking
// a mode:scale screen on non-16:9 viewports blend into the canvas.
const dashBg = isDash ? (units.join("\n").match(/background\s*:\s*(#[0-9a-fA-F]{6})/) || [])[1] : null;
// tech 大屏氛围(大屏专业化):DSL 命中 theme:tech 时,壳底色与画布氛围联动——
// 深空底 + 顶部光晕,与运行时 .tokui-grid[data-tokui-theme="tech"] 屏幕皮肤观感一致;
// 手写 background:#hex 依旧优先(显式声明意图更强)。
const isTech = isDash && /theme\s*:\s*tech\b/.test(units.join("\n"));
const techBg = dashBg || "#030814";

const runtime = loadRuntime(opts.runtimeDir);
if (!runtime) {
  console.error(`✗ TokUI runtime not found. Looked for tokui.umd.js + tokui.css in:
  ${SKILL_ASSETS}
  ${join(process.cwd(), "node_modules", "@jboltai", "tokui", "dist")}
Fix: restore the skill's assets/, install @jboltai/tokui, or pass --runtime-dir.`);
  process.exit(2);
}

// Inline-safe: a literal "</script" inside an inline script closes it early in
// every HTML parser; escaping the slash is a no-op for JS/CSS semantics.
const safeJs = runtime.js.replace(/<\/script/gi, "<\\/script");
const safeCss = runtime.css.replace(/<\/style/gi, "<\\/style");
const dataIsland = JSON.stringify({ dsls: units, theme: opts.theme }).replace(/</g, "\\u003c");
const outPath = resolve(opts.out ?? opts.inputs[0].replace(/\.(tokui|md|txt)$/i, "") + ".html");
const generatedAt = new Date().toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

const html = `<!doctype html>
<html lang="zh-CN" data-mode="${opts.theme.endsWith("dark") ? "dark" : "light"}" data-family="${opts.theme.startsWith("modern") ? "modern" : "default"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
<style>${safeCss}</style>
<style>
  * { box-sizing: border-box; }
  html[data-mode="light"] { --page-bg:#ffffff; --ink:#1f2328; --ink-2:#57606a; --line:#e5e7eb; }
  html[data-mode="dark"]  { --page-bg:#141414; --ink:#e6e6e6; --ink-2:#9aa4af; --line:#2a2f36; }
  body { margin:0; background:var(--page-bg); color:var(--ink);
         font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
         transition: background .2s, color .2s; }
${isDash
    ? `  body.dash { ${dashBg ? `--page-bg:${dashBg};` : ""} }
  html[data-mode="dark"] body.dash { --page-bg:${dashBg || "#05070d"}; }
${isTech
      ? `  body.dash, html[data-mode="dark"] body.dash { --page-bg:${techBg}; }
  body.dash::before { content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
    background: radial-gradient(1200px 700px at 50% -10%, rgba(13,43,87,${dashBg ? 0.25 : 0.55}) 0%, transparent 60%); }
  body.dash main { position:relative; z-index:1; }`
      : ""}
  body.dash main { max-width:none; margin:0; padding:0; }
  body.dash .tokui-unit { height:100vh; height:100dvh; margin:0; overflow:hidden; }
  .dash-toggle { position:fixed; top:14px; right:14px; z-index:9999; width:34px; height:34px;
                 display:flex; align-items:center; justify-content:center; font-size:15px; cursor:pointer;
                 border:1px solid var(--line); border-radius:999px;
                 background:color-mix(in srgb, var(--page-bg) 60%, transparent); color:var(--ink);
                 backdrop-filter:blur(6px); opacity:.3; transition:opacity .25s; }
  .dash-toggle:hover { opacity:1; }`
    : `  header { max-width:1000px; margin:0 auto; padding:36px 24px 8px; }
  header .kicker { font-size:12px; letter-spacing:.08em; color:var(--ink-2); text-transform:uppercase; }
  header h1 { margin:6px 0 4px; font-size:24px; font-weight:600; }
  header .meta { font-size:12px; color:var(--ink-2); }
  header button { float:right; margin-top:6px; padding:4px 12px; font-size:12px; cursor:pointer;
                  border:1px solid var(--line); border-radius:999px; background:transparent; color:var(--ink); }
  main { max-width:1000px; margin:0 auto; padding:16px 24px 64px; }
  .tokui-unit { margin:0 0 24px; overflow-x:auto; }`}
</style>
</head>
<body${isDash ? ' class="dash"' : ""}>
${isDash
    ? `<button type="button" class="dash-toggle" onclick="toggleMode()" aria-label="toggle light/dark">🌗</button>`
    : `<header>
  <button type="button" onclick="toggleMode()" aria-label="toggle light/dark">🌗</button>
  <div class="kicker">TokUI Report</div>
  <h1>${escapeHtml(opts.title)}</h1>
  <div class="meta">生成于 ${generatedAt} · TokUI ${escapeHtml(opts.theme)}</div>
</header>`}
<main id="report"></main>
<script type="application/json" id="tokui-data">${dataIsland}</script>
<script>${safeJs}</script>
<script>
  var DATA = JSON.parse(document.getElementById("tokui-data").textContent);
  function tokuiThemeFor(mode) {
    var family = document.documentElement.dataset.family;
    return mode === "dark" ? (family === "modern" ? "modern-dark" : "dark") : family;
  }
  function renderAll(mode) {
    var report = document.getElementById("report");
    report.innerHTML = "";
    DATA.dsls.forEach(function (dsl) {
      var host = document.createElement("div");
      host.className = "tokui-unit";
      report.appendChild(host);
      try {
        new TokUI.TokUI({ container: host, theme: tokuiThemeFor(mode) }).render(dsl);
      } catch (error) {
        console.error("TokUI render failed:", error);
        host.textContent = "⚠ render failed: " + (error && error.message ? error.message : error);
      }
    });
  }
  function toggleMode() {
    var el = document.documentElement;
    var mode = el.dataset.mode === "dark" ? "light" : "dark";
    el.dataset.mode = mode;
    renderAll(mode);
  }
  renderAll(document.documentElement.dataset.mode === "dark" ? "dark" : "light");
</script>
</body>
</html>
`;

await writeFile(outPath, html);
console.log(`✅ ${units.length} section${units.length > 1 ? "s" : ""} → ${outPath} (${(html.length / 1024).toFixed(0)} KB, ${isDash ? "dashboard" : "report"} shell, runtime from ${runtime.dir})`);

if (opts.open) {
  // Fire-and-forget launch in the OS default browser; failures must not fail the build.
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const openerArgs = process.platform === "win32" ? ["/c", "start", "", outPath] : [outPath];
  try {
    const child = spawn(opener, openerArgs, { detached: true, stdio: "ignore" });
    child.on("error", () => console.error(`⚠ browser launch failed — open manually: ${outPath}`));
    child.unref();
    console.log(`👀 opening in default browser: ${outPath}`);
  } catch {
    console.error(`⚠ browser launch failed — open manually: ${outPath}`);
  }
}
