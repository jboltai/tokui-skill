#!/usr/bin/env node
// Regenerates skills/tokui-render/references/components.md from
// scripts/lib/component-data.mjs (the single source of truth, kept in sync
// with @jboltai/tokui). Run after editing component-data:
//   node tools/build-references.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COMPONENTS, FAMILIES, GLOBAL_ATTRS, EVENT_CHANNELS, VARIANTS, CHART_TYPES } from "../skills/tokui-render/scripts/lib/component-data.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "skills", "tokui-render", "references");
mkdirSync(outDir, { recursive: true });

const FAMILY_TITLES = {
  text: "text 文本与基础",
  state: "state 状态、反馈与交互",
  think: "think 思考与计划",
  ai: "ai AI/对话",
  media: "media 媒体",
  layout: "layout 布局容器",
  form: "form 表单",
  table: "table 表格",
  chart: "chart 图表",
  flow: "flow 动态指令",
};

const lines = [];
lines.push("# TokUI 组件精确文档（按需查阅）");
lines.push("");
lines.push("写 DSL 前对不确定的组件**先查本文件**：`grep -n \"组件名\" components.md` 或读对应家族小节。");
lines.push("格式：`组件名 — 模式 | 关键属性 | 语义与陷阱`。深读 chart/table/grid 前另读 chart.md / table.md / patterns.md。");
lines.push("");
lines.push("## 目录（按家族）");
lines.push("");
for (const family of FAMILIES) {
  const names = Object.entries(COMPONENTS).filter(([, v]) => v.f === family).map(([k]) => k);
  lines.push(`- [${FAMILY_TITLES[family] ?? family}](#${family}): ${names.join(" ")}`);
}
lines.push("");
lines.push(`图表类型全集（t:）：${[...CHART_TYPES].join(" / ")}。`);
lines.push("");

for (const family of FAMILIES) {
  lines.push(`## ${FAMILY_TITLES[family] ?? family}`);
  lines.push("");
  for (const [name, info] of Object.entries(COMPONENTS)) {
    if (info.f !== family) continue;
    lines.push(`- **${name}** — ${info.d}`);
  }
  lines.push("");
}

lines.push("## 全局属性（全部组件可用，落组件根元素）");
lines.push("");
for (const [k, v] of Object.entries(GLOBAL_ATTRS)) lines.push(`- **${k}** — ${v}`);
lines.push("");
lines.push("## 事件通道（clk / sub / on）");
lines.push("");
lines.push("静态交付：生成的 HTML 报告里 clk/sub 点击不上报，按钮仅作视觉示意。");
lines.push("");
for (const [k, v] of Object.entries(EVENT_CHANNELS)) lines.push(`- **${k}:** — ${v}`);
lines.push("");
lines.push("## 变体白名单（v:，未知变体被渲染器静默丢弃）");
lines.push("");
for (const [k, v] of Object.entries(VARIANTS)) lines.push(`- **${k}**: ${v}`);
lines.push("");

writeFileSync(join(outDir, "components.md"), lines.join("\n") + "\n");
console.log(`✅ wrote ${join("skills", "tokui-render", "references", "components.md")} — ${Object.keys(COMPONENTS).length} components, ${Object.keys(VARIANTS).length} variant sets`);
