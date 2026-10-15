# tokui-skill

[中文文档](./README.zh-CN.md)

**Render data & analysis as rich interactive UI — a standalone Agent Skill that runs in Claude Code and any agent platform supporting the Agent Skills standard.**

`tokui-render` teaches any capable agent the TokUI DSL: 150+ components — cards, 21 chart types, tables, forms, KPI dashboards, detail pages, full app shells — emitted as compact `[card tt:"Q3" tx:"…"]` markup instead of hand-written HTML.

## How it works

Fully host-agnostic: the platform needs no integration, just Node ≥ 18 on the machine the agent runs on. The agent writes DSL to a `.tokui` file, lints it, then builds a **self-contained interactive HTML report** (runtime + CSS fully inlined — opens offline in any browser, light/dark toggle built in).

## Install

Two ways to get the skill onto a host: **copy** the folder, or **symlink** it from a clone of this repo so one source copy serves every agent at once.

### Claude Code (copy)

```bash
# personal skill (all projects)
git clone <this-repo> /tmp/tokui-skill
mkdir -p ~/.claude/skills
cp -r /tmp/tokui-skill/skills/tokui-render ~/.claude/skills/

# or project-level (this repo only)
mkdir -p .claude/skills && cp -r /tmp/tokui-skill/skills/tokui-render .claude/skills/
```

### Symlink install — one source, every agent

Keep a single clone of this repo as the source of truth and link `skills/tokui-render` into each agent's skill directory. Claude Code, ZCode, and Workbuddy all follow symlinks, so editing the repo (or `git pull`) updates the skill in every agent at once — no re-copying per host.

```bash
git clone <this-repo> ~/src/tokui-skill     # any stable path works
SKILL=~/src/tokui-skill/skills/tokui-render

mkdir -p ~/.claude/skills  ~/.zcode/skills  ~/.workbuddy/skills
ln -s "$SKILL" ~/.claude/skills/tokui-render      # Claude Code
ln -s "$SKILL" ~/.zcode/skills/tokui-render       # ZCode
ln -s "$SKILL" ~/.workbuddy/skills/tokui-render   # Workbuddy
```

Notes:

- Point the link at an **absolute** path — agents resolve skills from different working directories, so a relative link breaks outside the repo.
- To uninstall from one host, just remove that link; the repo copy and the other agents are untouched.
- Windows has no `ln -s`; use `mklink /D` from an elevated shell (or Developer Mode), or fall back to the copy method above.

### Any Agent-Skills-compatible runtime

The portable unit is `skills/tokui-render/` — a standard `SKILL.md` (frontmatter `name` + `description`) with `references/`, `scripts/`, and `assets/`. Place that folder wherever your runtime looks for skills.

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

Progressive disclosure keeps the context cost low:

1. `SKILL.md` (~3k tokens) — component index, layout/chart decision tables, syntax iron rules. Loaded only on rendering tasks.
2. `references/components.md` — precise per-component docs, grepped on demand.
3. `references/chart.md` / `table.md` / `patterns.md` — deep data-format docs, read only when writing charts/tables/grids.

## Repository layout

```
skills/tokui-render/        ← the portable skill (copy or symlink this folder)
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
