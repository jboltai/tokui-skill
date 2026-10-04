#!/usr/bin/env node
// Standalone TokUI DSL validator — zero dependencies, Node >= 18.
//
//   node validate.mjs report.tokui        # a raw DSL file
//   node validate.mjs reply.md            # extracts every ```tokui fence
//   cat report.tokui | node validate.mjs -  # stdin
//   node validate.mjs --json report.tokui   # machine-readable output
//
// Exit code 0 = no errors (warnings still exit 0 — they degrade rendering,
// they don't break it). Each fence / file is linted as its own unit, mirroring
// how a TokUI host instantiates one renderer per fence.
import { readFile } from "node:fs/promises";
import { lintDsl, formatLintResult } from "./lib/dsl-lint.mjs";

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
  console.log(`usage: node validate.mjs [--json] <file.tokui|file.md|->`);
}

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const files = args.filter((a) => a !== "--json");
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

let errors = 0;
const jsonOut = { units: [] };
for (const unit of units) {
  const result = lintDsl(unit.dsl);
  errors += result.errors.length;
  if (asJson) {
    jsonOut.units.push({ label: unit.label, ...result });
    continue;
  }
  console.log(`── ${unit.label} ──`);
  console.log(formatLintResult(unit.dsl, result));
  console.log();
}
if (asJson) console.log(JSON.stringify(jsonOut, null, 2));
process.exit(errors > 0 ? 1 : 0);
