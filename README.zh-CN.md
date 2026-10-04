# tokui-skill

[English](./README.md)

**把数据与分析结果渲染成富交互 UI —— 一个可运行在 Claude Code、TokUI-Agent 及任何支持 Agent Skills 标准的智能体里的技能。**

`tokui-render` 教会任何有能力的 agent 使用 TokUI DSL：150+ 组件 —— 卡片、21 种图表、表格、表单、KPI 看板、详情页、完整应用壳 —— 以 `[card tt:"Q3" tx:"…"]` 这样的极简标记输出，而不是手写 HTML。

## 双交付模式

技能会根据宿主环境自适应：

| 模式 | 宿主 | 发生什么 |
|---|---|---|
| **A · 实时** | TokUI-Agent 等 TokUI 感知宿主 | agent 流式输出 ```tokui 围栏，宿主在回答还在生成时就渲染成真实可交互的 UI；界面按钮会桥接回对话。 |
| **B · 独立** | Claude Code 及任何标准技能 agent | agent 把 DSL 写进 `.tokui` 文件、校验、然后生成**自包含的交互式 HTML 报告**（运行时 + CSS 全内联，离线可直接打开，自带亮/暗切换）。 |

模式 B 是可移植性的关键：无需宿主做任何集成，只要求 agent 运行的机器上有 Node ≥ 18。

## 安装

### Claude Code

```bash
# 个人级技能（所有项目可用）
git clone <本仓库> /tmp/tokui-skill
mkdir -p ~/.claude/skills
cp -r /tmp/tokui-skill/skills/tokui-render ~/.claude/skills/

# 或项目级（仅当前仓库）
mkdir -p .claude/skills && cp -r /tmp/tokui-skill/skills/tokui-render .claude/skills/
```

符号链接也可以（`ln -s …/skills/tokui-render ~/.claude/skills/tokui-render`），`git pull` 即自动更新。

### 任何兼容 Agent Skills 的运行时

可移植单元是 `skills/tokui-render/` —— 标准 `SKILL.md`（frontmatter 含 `name` + `description`）加 `references/`、`scripts/`、`assets/`。把这个目录放到你的运行时查找技能的位置即可。

### TokUI-Agent / pi

已内置 —— TokUI-Agent 发行了本技能的 pi 原生版本，带 `tokui_docs` / `tokui_validate` 模型工具与围栏实时渲染，无需再装本仓库。

## 试一试

装好技能后，对你的 agent 说：

> 摸一遍这个目录里的 CSV，给我一份数据质量看板，用 tokui 渲染。

agent 会从组件索引选型、按需查阅精确属性文档、写 DSL、校验，最后交付可打开的 `report.html`。

## 脚本（由 agent 调用，零依赖）

| 脚本 | 用途 |
|---|---|
| `scripts/validate.mjs <文件.tokui\|文件.md\|->` | 校验 DSL（未闭合容器、未知组件、变体白名单、引号陷阱、图表属性顺序……）。可从 markdown 提取全部 ```tokui 围栏；有错误退出码 1；`--json` 输出机器可读结果。 |
| `scripts/render.mjs <文件…> -o out.html` | 生成自包含 HTML 报告。`--title` 标题、`--theme default\|dark\|modern\|modern-dark` 主题、`--runtime-dir` 指定自定义 TokUI dist。 |

## 为什么省上下文

渐进披露，与 pi 原生版同一哲学：

1. `SKILL.md`（约 3k token）—— 组件索引、布局/图表选型决策表、语法铁律。仅在渲染任务触发时加载。
2. `references/components.md` —— 单组件精确文档，按需 grep（替代 pi 扩展的 `tokui_docs` 工具）。
3. `references/chart.md` / `table.md` / `patterns.md` —— 深层数据格式文档，只在写图表/表格/网格时读取。

## 仓库结构

```
skills/tokui-render/        ← 可移植技能（拷贝这个目录）
  SKILL.md                  标准 frontmatter + 工作流 + 铁律 + 索引
  references/               components.md（生成物）· chart.md · table.md · patterns.md
  scripts/validate.mjs      独立 DSL 校验 CLI
  scripts/render.mjs        独立 HTML 报告生成 CLI
  scripts/lib/              component-data.mjs（唯一事实源）· dsl-lint.mjs
  assets/                   tokui.umd.js + tokui.css（内置运行时，与 npm @jboltai/tokui 0.2.7 逐字节一致）
tools/build-references.mjs  从 component-data.mjs 重新生成 components.md
test/                       CLI 与 SKILL.md 契约的冒烟测试
```

## 开发

```bash
npm test                    # node --test 跑 test/
npm run build:references    # 重新生成 references/components.md
```

**与 @jboltai/tokui 同步**：`skills/tokui-render/scripts/lib/component-data.mjs` 是组件知识的唯一事实源；新版本 tokui 发布后更新它、用包内 `dist/` 刷新 `assets/`、重跑 `build:references`，并把版本号对齐运行时（本仓库 0.2.7 ↔ @jboltai/tokui 0.2.7）。

## 许可

MIT
