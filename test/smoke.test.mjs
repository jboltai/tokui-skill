// Smoke tests for the standalone skill's public CLIs + SKILL.md contract.
// Run: npm test (node --test test/)
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const skillDir = join(repoRoot, "skills", "tokui-render");
const validate = join(skillDir, "scripts", "validate.mjs");
const render = join(skillDir, "scripts", "render.mjs");
const tmp = mkdtempSync(join(tmpdir(), "tokui-skill-"));

const GOOD_DSL = `[card tt:"Q3 概览"]
[stat tt:"GMV" v:1280 pre:¥ trend:up anim:1200]
[chart t:line l:"7月,8月,9月" d:"120,180,240"]
[/card]`;

const BAD_DSL = `[card tt:"坏例"]
[stat tt:"GMV" v:100]`;

function run(script, args, { expectFail = false } = {}) {
  try {
    const stdout = execFileSync(process.execPath, [script, ...args], { encoding: "utf8" });
    if (expectFail) assert.fail(`expected non-zero exit, got stdout: ${stdout.slice(0, 200)}`);
    return stdout;
  } catch (error) {
    if (!expectFail) throw error;
    return `${error.stdout ?? ""}${error.stderr ?? ""}`;
  }
}

test("validate: clean DSL exits 0 with a pass report", () => {
  const file = join(tmp, "good.tokui");
  writeFileSync(file, GOOD_DSL);
  const out = run(validate, [file]);
  assert.match(out, /校验通过/);
});

test("validate: unclosed container exits 1 with a line-numbered error", () => {
  const file = join(tmp, "bad.tokui");
  writeFileSync(file, BAD_DSL);
  const out = run(validate, [file], { expectFail: true });
  assert.match(out, /错误/);
  assert.match(out, /card/);
});

test("validate: markdown fences are extracted per-unit", () => {
  const file = join(tmp, "reply.md");
  writeFileSync(file, `# 报告\n\n第一段：\n\n\`\`\`tokui\n${GOOD_DSL}\n\`\`\`\n\n第二段：\n\n\`\`\`tokui\n${BAD_DSL}\n\`\`\`\n`);
  const out = run(validate, [file], { expectFail: true });
  assert.match(out, /fence 1/);
  assert.match(out, /fence 2/);
});

test("validate: --json emits machine-readable results", () => {
  const file = join(tmp, "good2.tokui");
  writeFileSync(file, GOOD_DSL);
  const out = run(validate, ["--json", file]);
  const parsed = JSON.parse(out);
  assert.equal(parsed.units.length, 1);
  assert.equal(parsed.units[0].errors.length, 0);
});

test("validate: no DSL content exits 2", () => {
  const file = join(tmp, "empty.md");
  writeFileSync(file, "just plain text, nothing to render\n");
  const out = run(validate, [file], { expectFail: true });
  assert.match(out, /no TokUI DSL/i);
});

test("render: builds a self-contained HTML with the runtime inlined", () => {
  const input = join(tmp, "good.tokui");
  const out = join(tmp, "good.html");
  const stdout = run(render, [input, "-o", out, "--title", "Q3 复盘"]);
  assert.match(stdout, /→ .*good\.html/);
  const html = readFileSync(out, "utf8");
  assert.match(html, /TokUI Report/);
  assert.match(html, /Q3 复盘/);
  assert.match(html, /new TokUI\.TokUI\(/); // renderer bootstrap present
  assert.ok(html.length > 500_000, "runtime + css must be inlined");
  assert.match(html, /"dsls":\[/);
});

test("render: multiple inputs become multiple sections in one report", () => {
  const a = join(tmp, "a.tokui");
  const b = join(tmp, "b.tokui");
  writeFileSync(a, GOOD_DSL);
  writeFileSync(b, `[h3 v:center 第二节]\n[table][thead cols:"名称,数量"][tbody][tr 苹果,3][tr 香蕉,5][/tbody][/table]`);
  const out = join(tmp, "multi.html");
  run(render, [a, b, "-o", out]);
  const html = readFileSync(out, "utf8");
  assert.match(html, /Q3 概览/);
  assert.match(html, /第二节/);
});

test("render: --runtime-dir override resolves the runtime", () => {
  const input = join(tmp, "good.tokui");
  const out = join(tmp, "override.html");
  const stdout = run(render, [input, "-o", out, "--runtime-dir", join(skillDir, "assets")]);
  assert.match(stdout, /runtime from/);
  assert.ok(readFileSync(out, "utf8").length > 500_000);
});

test("render: input without DSL exits 2", () => {
  const file = join(tmp, "empty.md");
  writeFileSync(file, "plain notes\n");
  const out = run(render, [file, "-o", join(tmp, "x.html")], { expectFail: true });
  assert.match(out, /no TokUI DSL/i);
});

test("SKILL.md: standard frontmatter contract", () => {
  const raw = readFileSync(join(skillDir, "SKILL.md"), "utf8");
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(raw);
  assert.ok(fm, "frontmatter block present");
  const name = /^name:\s*(.+)$/m.exec(fm[1])?.[1]?.trim();
  const description = /^description:\s*([\s\S]+)$/m.exec(fm[1])?.[1]?.trim();
  assert.equal(name, "tokui-render");
  assert.ok(description && description.length > 30 && description.length <= 1024);
  assert.match(description, /TokUI/);
});

test("references: the four deep docs exist and are non-trivial", () => {
  for (const f of ["chart.md", "table.md", "patterns.md", "components.md"]) {
    const stat = readFileSync(join(skillDir, "references", f), "utf8");
    assert.ok(stat.length > 1000, `${f} too small`);
  }
});

after(() => {
  rmSync(tmp, { recursive: true, force: true });
});
