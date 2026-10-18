#!/usr/bin/env node
// Standalone TokUI DSL validator — zero dependencies, Node >= 18.
//
//   node validate.mjs report.tokui        # a raw DSL file
//   node validate.mjs reply.md            # extracts every ```tokui fence
//   cat report.tokui | node validate.mjs -  # stdin
//   node validate.mjs --json report.tokui   # machine-readable output
//   node validate.mjs --fix report.tokui    # rewrite deterministic errors in place
//
// Exit code 0 = no errors (warnings still exit 0 — they degrade rendering,
// they don't break it). Each fence / file is linted as its own unit, mirroring
// how a TokUI host instantiates one renderer per fence.
//
// --fix applies autofixDsl (unquoted spaced titles split into attr + stray
// word → quoted merge) and writes the fixed text back to the file; the report
// and exit code reflect the post-fix state. Stdin ("-") never writes.
import { readFile, writeFile } from "node:fs/promises";
import { lintDsl, autofixDsl, formatLintResult } from "./lib/dsl-lint.mjs";

const FENCE_RE = /```tokui[ \t]*\n([\s\S]*?)```/g;

function extractUnits(text, filename) {
  const fences = [...text.matchAll(FENCE_RE)].map((m) => m[1].replace(/\n$/, ""));
  if (fences.length > 0) {
    return fences.map((dsl, i) => ({ label: fences.length > 1 ? `${filename} · fence ${i + 1}` : filename, dsl }));
  }
  if (text.includes("[") && text.includes("]")) {
    return [{ label: filename, dsl: text.trim() }];
  }
  return null;
}

function usage() {
  console.log(`usage: node validate.mjs [--json] [--fix] <file.tokui|file.md|->`);
}

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const doFix = args.includes("--fix");
const files = args.filter((a) => a !== "--json" && a !== "--fix");
if (files.length !== 1) {
  usage();
  process.exit(2);
}

const input = files[0] === "-" ? await new Promise((resolve) => {
  let data = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => (data += c));
  process.stdin.on("end", () => resolve(data));
}) : await readFile(files[0], "utf8");

const units = extractUnits(input, files[0]);
if (!units) {
  console.error(`✗ ${files[0]} contains no TokUI DSL (no \`\`\`tokui fence, no [tags]).`);
  process.exit(2);
}

// --fix rewrite: replace each fence body (or the whole file when fence-free)
// with its autofixed form; untouched content stays byte-identical.
function fixedInput() {
  if ([...input.matchAll(FENCE_RE)].length > 0) {
    return {
      out: input.replace(FENCE_RE, (m, body) => {
        const trailing = body.endsWith("\n") ? "\n" : "";
        const f = autofixDsl(trailing ? body.slice(0, -1) : body);
        return f.count ? m.replace(body, f.dsl + trailing) : m;
      }),
    };
  }
  return { out: autofixDsl(input).dsl };
}

let errors = 0;
let fixedCount = 0;
const canFix = doFix && files[0] !== "-";
const jsonOut = { units: [] };
for (const unit of units) {
  let dsl = unit.dsl;
  let result = lintDsl(dsl);
  if (canFix && result.errors.length > 0) {
    const fix = autofixDsl(dsl);
    if (fix.count > 0) {
      dsl = fix.dsl;
      fixedCount += fix.count;
      result = lintDsl(dsl); // 报告与退出码按修正后状态
    }
  }
  errors += result.errors.length;
  if (asJson) {
    jsonOut.units.push({ label: unit.label, ...result, ...(dsl !== unit.dsl ? { fixedDsl: dsl } : {}) });
    continue;
  }
  console.log(`── ${unit.label} ──`);
  console.log(formatLintResult(dsl, result));
  console.log();
}
if (canFix && fixedCount > 0) {
  const { out } = fixedInput();
  await writeFile(files[0], out, "utf8");
  if (!asJson) console.log(`🔧 --fix 已自动修正 ${fixedCount} 处(值含空格未加引号→引号合并)并写回 ${files[0]};仍剩错误按上方提示手工修复。`);
}
if (asJson) console.log(JSON.stringify(jsonOut, null, 2));
process.exit(errors > 0 ? 1 : 0);
