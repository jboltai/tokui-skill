# tokui-skill

[中文文档](./README.zh-CN.md)

**Render data & analysis as rich interactive UI — an Agent Skill that runs in Claude Code, TokUI-Agent, and any agent supporting the Agent Skills standard.**

`tokui-render` teaches any capable agent the TokUI DSL: 150+ components — cards, 21 chart types, tables, forms, KPI dashboards, detail pages, full app shells — emitted as compact `[card tt:"Q3" tx:"…"]` markup instead of hand-written HTML.

## Two delivery modes

The skill detects its host and adapts:

| Mode | Host | What happens |
|---|---|---|
| **A · Live** | TokUI-Agent and other TokUI-aware hosts | The agent streams ```tokui fences; the host renders them into real, interactive UI while the answer is still being generated. Buttons bridge back into the conversation. |
| **B · Standalone** | Claude Code and any standard-skills agent | The agent writes DSL to a `.tokui` file, lints it, then builds a **self-contained interactive HTML report** (runtime + CSS fully inlined — opens offline in any browser, light/dark toggle built in). |

Mode B is what makes the skill portable: no host integration required, just Node ≥ 18 on the machine the agent runs on.

## Install

### Claude Code

```bash
# personal skill (all projects)
git clone <this-repo> /tmp/tokui-skill
mkdir -p ~/.claude/skills
cp -r /tmp/tokui-skill/skills/tokui-render ~/.claude/skills/

# or project-level (this repo only)
mkdir -p .claude/skills && cp -r /tmp/tokui-skill/skills/tokui-render .claude/skills/
```

A symlink (`ln -s …/skills/tokui-render ~/.claude/skills/tokui-render`) works too and stays up to date with `git pull`.

### Any Agent-Skills-compatible runtime

The portable unit is `skills/tokui-render/` — a standard `SKILL.md` (frontmatter `name` + `description`) with `references/`, `scripts/`, and `assets/`. Place that folder wherever your runtime looks for skills.

### TokUI-Agent / pi

Already built in — TokUI-Agent ships a pi-native variant of this skill with `tokui_docs` / `tokui_validate` model tools and live fence rendering. You don't need this repo there.

## Try it

With the skill installed, ask your agent:

> Profile the CSVs in this directory and give me a quality dashboard — render it with tokui.

The agent will pick components from the index, check precise attribute docs on demand, write the DSL, lint it, and hand you `report.html` to open.

## Scripts (used by the agent, zero dependencies)

| Script | Purpose |
|---|---|
| `scripts/validate.mjs <file.tokui\|file.md\|->` | Lint DSL (unclosed containers, unknown components, variant whitelists, quoting traps, chart attribute order…). Extracts every ```tokui fence from markdown. Exit 1 on errors. `--json` for machine output. |
| `scripts/render.mjs <files…> -o out.html` | Build a self-contained HTML report. `--title`, `--theme default\|dark\|modern\|modern-dark`, `--runtime-dir` to point at a custom TokUI dist. |

## Why it's cheap on context

Progressive disclosure, same philosophy as the pi-native original:

1. `SKILL.md` (~3k tokens) — component index, layout/chart decision tables, syntax iron rules. Loaded only on rendering tasks.
2. `references/components.md` — precise per-component docs, grepped on demand (replaces the pi extension's `tokui_docs` tool).
3. `references/chart.md` / `table.md` / `patterns.md` — deep data-format docs, read only when writing charts/tables/grids.

## Repository layout

```
skills/tokui-render/        ← the portable skill (copy this folder)
  SKILL.md                  standard frontmatter + workflow + rules + index
  references/               components.md (generated) · chart.md · table.md · patterns.md
  scripts/validate.mjs      standalone DSL linter (CLI)
  scripts/render.mjs        standalone HTML report builder (CLI)
  scripts/lib/              component-data.mjs (source of truth) · dsl-lint.mjs
  assets/                   tokui.umd.js + tokui.css (bundled runtime, byte-identical to npm @jboltai/tokui 0.2.7)
tools/build-references.mjs  regenerates components.md from component-data.mjs
test/                       smoke tests for the CLIs + SKILL.md contract
```

## Development

```bash
npm test                    # node --test over test/
npm run build:references    # regenerate references/components.md
```

**Syncing with @jboltai/tokui**: `skills/tokui-render/scripts/lib/component-data.mjs` is the single source of truth for component knowledge; when a new tokui ships, update it, refresh `assets/` from the package's `dist/`, re-run `build:references`, and bump the version to match the runtime (this repo: 0.2.7 ↔ @jboltai/tokui 0.2.7).

## License

MIT
