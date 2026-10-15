# tokui-skill

[English](./README.md)

**把数据与分析结果渲染成富交互 UI —— 一个独立的 Agent 技能，可运行在 Claude Code 及任何支持 Agent Skills 标准的智能体平台里。**

`tokui-render` 教会任何有能力的 agent 使用 TokUI DSL：150+ 组件 —— 卡片、21 种图表、表格、表单、KPI 看板、详情页、完整应用壳 —— 以 `[card tt:"Q3" tx:"…"]` 这样的极简标记输出，而不是手写 HTML。

## 工作原理

完全与宿主无关：平台无需做任何集成，只要求 agent 运行的机器上有 Node ≥ 18。agent 把 DSL 写进 `.tokui` 文件、校验，然后生成**自包含的交互式 HTML 报告**（运行时 + CSS 全内联，离线可直接打开，自带亮/暗切换）。

## 安装

把技能装进某个宿主有两种方式：**拷贝**目录，或从本仓库的克隆**作软连接**，让一份源码同时服务所有 agent。

### Claude Code（拷贝）

```bash
# 个人级技能（所有项目可用）
git clone <本仓库> /tmp/tokui-skill
mkdir -p ~/.claude/skills
cp -r /tmp/tokui-skill/skills/tokui-render ~/.claude/skills/

# 或项目级（仅当前仓库）
mkdir -p .claude/skills && cp -r /tmp/tokui-skill/skills/tokui-render .claude/skills/
```

### 软连接安装 —— 一份源码，所有 agent 共用

保留本仓库的一份克隆作为唯一事实源，把 `skills/tokui-render` 软连接进各 agent 的技能目录。Claude Code、ZCode、Workbuddy 都会跟随符号链接，改仓库（或 `git pull`）即可同时更新所有 agent 里的技能，无需逐个重新拷贝。

```bash
git clone <本仓库> ~/src/tokui-skill     # 路径随意，保持稳定即可
SKILL=~/src/tokui-skill/skills/tokui-render

mkdir -p ~/.claude/skills  ~/.zcode/skills  ~/.workbuddy/skills
ln -s "$SKILL" ~/.claude/skills/tokui-render      # Claude Code
ln -s "$SKILL" ~/.zcode/skills/tokui-render       # ZCode
ln -s "$SKILL" ~/.workbuddy/skills/tokui-render   # Workbuddy
```

说明：

- 链接目标请用**绝对路径** —— 各 agent 解析技能时的工作目录不同，相对链接在仓库外会失效。
- 想从某个宿主卸载，删掉对应的链接即可，仓库源码与其他 agent 不受影响。
- Windows 没有 `ln -s`，需在管理员权限（或开发者模式）终端用 `mklink /D`，或退回上面的拷贝方式。

### 任何兼容 Agent Skills 的运行时

可移植单元是 `skills/tokui-render/` —— 标准 `SKILL.md`（frontmatter 含 `name` + `description`）加 `references/`、`scripts/`、`assets/`。把这个目录放到你的运行时查找技能的位置即可。

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

渐进披露，把上下文开销压到最低：

1. `SKILL.md`（约 3k token）—— 组件索引、布局/图表选型决策表、语法铁律。仅在渲染任务触发时加载。
2. `references/components.md` —— 单组件精确文档，按需 grep。
3. `references/chart.md` / `table.md` / `patterns.md` —— 深层数据格式文档，只在写图表/表格/网格时读取。

## 仓库结构

```
skills/tokui-render/        ← 可移植技能（拷贝或软连接这个目录）
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
