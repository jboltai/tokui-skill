---
name: tokui-render
description: Render data & analysis results as rich interactive UI with TokUI DSL — cards, 21 chart types, tables, forms, KPI dashboards, detail pages, app shells. Use for any task involving presenting, visualizing, reporting, dashboards, or data display. Writes .tokui DSL files, lints them, and builds a self-contained interactive HTML report (runtime + CSS inlined, opens offline in any browser) — works in Claude Code and any agent platform supporting Agent Skills. 中文：用 TokUI DSL 把数据/分析结果渲染成富 UI（卡片/图表/表格/表单/仪表盘/详情页/应用壳），写 .tokui 文件、校验、生成离线可开的自包含 HTML 报告；涉及呈现/可视化/报表/看板/数据展示时使用。
---

# TokUI 渐进渲染

把数据、分析结果、界面想法渲染成富 UI：卡片 / 21 种图表 / 表格 / 表单 / KPI 看板 / 详情页 / 应用壳。150+ 组件，DSL 极简（`[card tt:"标题" tx:"一句"]`）。

## 交付流程（写 → 校 → 渲 → 交）

1. 把 DSL 写进 `<主题>.tokui` 文件（多段报告可写多个文件或一个文件多段；文件内不放围栏标记）。也可直接校验 markdown 里已有的 ```tokui 围栏（给 validate.mjs 传 .md 文件）。
2. `node <skill-dir>/scripts/validate.mjs <文件>.tokui` 校验——有错必须修复后重跑，通过才算交付。标题值含空格未加引号类确定性错误可加 `--fix` 直接自动修回文件（引号合并，其余内容逐字不动），修完仍须重跑校验至零错误。
3. `node <skill-dir>/scripts/render.mjs <文件>.tokui -o <主题>.html [--title "标题"] [--theme default|dark|modern|modern-dark] [--shell auto|dashboard|report] [--open]` 生成自包含 HTML（运行时+CSS 全内联，离线可开、亮暗可切）。**各段根节点均为单块 `fit-screen`（数据大屏）时自动切全屏大屏壳**：满视口无边距、无报告头、主题切换钮悬浮角落，大屏按视口等比缩放铺满；多块大屏 = 多个输入文件（每屏一文件，逐屏满页）；`--shell` 可强制壳型。**大屏交付必须加 `--open`：生成后自动调本机默认浏览器直接打开**（macOS open / Linux xdg-open / Windows start，用户即刻看到全屏效果）。
4. 交付：告知用户 HTML 路径与打开方式。回复正文 = 业务小标题 + 结尾业务总结（结论/风险/建议，不提技术）；面向非技术用户，正文不出现组件名/属性/DSL/布局术语，技术词汇与客套填充严禁进正文。同一报告只生成交付一次，严禁重复生成压缩版/重复版。**防御性围栏规则：仅当宿主明确支持聊天正文内联渲染 TokUI 时才可在正文输出 DSL，且必须逐段用 ```tokui 围栏包裹——裸写的 `[组件 …]` 行任何宿主都不会渲染，只会显示为源码文本；默认交付一律走 .tokui 文件 + HTML，正文不放 DSL。**

## 工作流（选型→查档→写→校→渲）
1. 选型：布局/图表用下方决策表；只用组件索引内组件，禁止臆造。
2. 不确定的组件**先查档**：`grep -n "组件名" <skill-dir>/references/components.md`（精确属性/语义/陷阱）。
3. 写 chart/table 前必读 `references/chart.md` / `references/table.md`（数据格式 `d:`/`l:`、表格结构严禁凭经验臆造）；grid/cell 深入用法读 `references/patterns.md`。
4. 写 DSL（进 .tokui 文件）→ 必跑 validate.mjs 校验修复 → 再跑 render.mjs 生成 HTML。
5. 业务总结（结论/风险/建议，不提技术）。

## 语法铁律
1. 属性间空格分隔（CJK 全角字符后同）。
2. 容器必须 `[/type]` 闭合；自闭合组件禁闭合标签。标题 `h1-h6` 正文与标签同行：`[h1 标题文字]`——**严禁 HTML 式 `[h1]文字[/h1]`**。**仅 `item` 与带正文 `p` 会被兄弟标签自动闭合**——`card`/`callout`/`list` 等不会：漏写 `[/card]` 时下一张卡会嵌套进上一张，必须显式闭合。**`ti`/`step` 正文写在开标签属性后（同标签一行）**：`[ti tm:"2024 下半年" t:info tt:"标题" 正文一句]`——严禁 `[/ti]` 与独立正文行；tm/tt 含空格必须引号。
3. 变体必须 `v:` 前缀，多值 `v:"primary,sm"`；裸写变体名会变正文乱码。
4. 值含空格/逗号/竖线双引号包（中英混排标题最易漏：`tt:今日 GMV` 必须写 `tt:"今日 GMV"`，不引号会被空格切开、标题截断＋尾词变游离词报错；**数字与中文之间的空格同样切值**：`tt:大模型平台市场份额(2025E 估算)` 必须写 `tt:"大模型平台市场份额(2025E 估算)"`）——引号只包单个值、成对关闭，严禁跨属性；正文含字面 `[` `]` 整段双引号；属性值里严禁塞组件标签；正文别写 `英文:值`（Q:/A:/step: 会被解析器当属性吞掉——用全角 `：` 或引号）；`input/pwd` 初值用 `val`（`v` 是变体）。
5. `card` 有子元素禁 `tx`；**`card` 裸正文非法**——正文写 `tx:`（叶子卡）或子元素 `[p]`。`p`/`item` 有正文=自闭合、无正文=容器。
6. `tr` 单元格分隔必须**英文**逗号（中文逗号不切格、整行错位），**每行展开格数（含 `=cN`）必须 = thead 列数**：含英文逗号文本格双引号包（全角）；汇总行 `汇总=cN` 或整行 `=c总列数`；含 `btn:`/`tag:`/`progress v:`/`[xxx]` 内联组件格裸写即可（多钮 `|` 分隔、格内勿含英文逗号；行级 `id:`/`pid:` 写行首）；货币符号千分位免引号；操作列 `btn:动作 clk:fillSubmit data-prompt:动作:该行ID`；thead 列名含英文逗号 → cols 外层引号 + `\"` 转义。
7. 布尔属性只写 key，无 false 值（想关就省略；仅 `upd` 支持 `xxx:false`）。
8. 颜色语义名或 6 位 hex 不带 `#`。数据大屏整页深色科技风：根容器或 grid/card 用 `theme:tech`。
9. 图标 `icon:`（内置 61 名）仅 **btn、表格操作列钮、kpi** 支持详见 components.md；**item/p/li 等正文组件无 icon**——列表项要视觉标记：emoji 直接写正文开头或用 `[tag]`。
10. 组件名必须在索引内。
11. 表单控件自闭合差异：`input/pwd/numinput` 自闭合；**`textarea` 是容器，空字段也必须 `[/textarea]` 闭合**（初值 `tx:` 自闭合）。`form` 末尾必带 `[btn tx:提交 v:primary sub:formSubmit]` + `[btn tx:重置 reset]`，直接放 form 内；提交用 `sub` 不用 `clk`。同一标签严禁两个 `opt:`（多选项写容器子节点；cascader 层级用子 `opt p:父值`）。
12. `dialog`/`drawer` 在静态 HTML 报告里无触发通路、渲染后打不开——**常规交付禁用**；折叠/分层内容用 `collapse` 或 `tabs`。星级只用 `[rate v:N max:5]`（展示加 `ro`），严禁 ★/☆ 字符。
13. 图片只用**可信稳定图源**（用户提供的 URL/站内/无防盗链占位图）；搜索引擎/图床热链常被 Referer 拦截，整墙裂图。`img` 建议带 `alt`；等高图集 `imgs`、不等高瀑布 `masonry`、多图共享灯箱 `preview-group` 包 `img`。
14. **TokUI 运行时未内置 mermaid/katex 插件**——`[mermaid]`、`[katex]`、md 内 `$$公式$$`/```mermaid 只会以源码回退显示，**禁用**。流程/结构/依赖用 `chart`（t:sankey 流转/gantt 排期/treemap 层级）、`timeline`、`steps` 或嵌套 `list`；公式用普通文本（上下标 `sub`/`sup`）。
15. 样式定制走全局属性 `cls:`/`style:`（白名单与拒收项详查 components.md 全局属性节）；视觉档位优先引用主题令牌（`var(--tokui-radius-lg)` 等）。数据属性 `data-*` 全组件根级透传——**禁 `data-tokui-*` 前缀**（框架内部印章）。

## 布局选型
- 多指标必须 `[row][col span:N]` 并排（2→span:6，3→span:4，4→span:3，6→span:2，N 个→span:12/N），严禁堆叠；超出另起 row。**span 总和严禁超 12（12 栅格，超出即换行）**——定高行（大屏 rows px 行轨）下换行溢出会被下方区域盖住显示不全。
- 一维等分 row/col；二维不对称/命名区域/固定+弹性/跨行跨列/整页骨架 → grid/cell（`areas:"nav main|aside ."`）。grid 不定高内容省略 rows；薄轨（<100px）不放 card。
- **管理后台/CRUD 整页 → `page` 应用壳**（结构语义化+自带折叠/滚动/联动）：`[page][page-header tt:标题 bc:"首页,系统,用户"][btn t:primary 新增][/page-header][page-sidebar tt:品牌][menu act:键]…[/menu][/page-sidebar][page-content]…[/page-content][/page]`；主区多页签 `[page-tabs act:key][page-tab n:key tt:标题 closeable]…[/page-tab][/page-tabs]`。
- **长内容渐进披露 → `reveal` 滚动入场**：`[reveal v:up delay:120][reveal-item][card tt:一]…[/card][/reveal-item][card tt:二]…[/card][/reveal]`；`v:up|left|right|zoom`；首屏可见区勿包。
- 视觉强调四变体：`btn v:gradient` / `h1~h6 v:gradient` / `card v:glass` / `card v:gradient-border`。
- 详情/简历 → `desc`（cols:N，子项 `item l:tx:`）；对比 → 两 col 各一 card；单图单表直接输出。
- **编辑资料/多字段表单 → `[form cols:2 lw:84]` 起步**；长备注用字段 `v:full`；过滤条 `[form v:inline]`。
- **宽表（≥6 列）→ 列宽 + 固定列**：thead `名称 w:170` + `[table fixed fc:1]`；层级数据 → `[tr id pid]` 树形行。
- 标题旁徽标：`[row v:inline][h3 标题][badge tx:v2.4 pill][/row]`（必须 `v:inline`）；右上角角标 `[badge-box]`。版本号/小数必须 `tx`。
- `stat` 必加 `anim:1200`；货币 `pre:¥`、百分比 `suf:%`、小数 `dec:N`、趋势 `trend:up/down`。
- 关键结论放 card 的 tt 或 `callout`；空 `[ft][/ft]` 严禁。
- 长列表/聊天记录/日志面板 → `scroll-area h:N`；横向标签带 → `scroll-area dir:x`。

## 图表选型（意图→类型）
趋势 line（可 area/smooth/vals）· 累计构成 area stack · **量+率双轴对比 combo（d 柱+d2 线+n1/n2+y2，勿拆两图）** · 占比 pie/donut（v:中心%）· 差异大占比 rose · 单值KPI/完成率 gauge v:N · 轻量进度 progress · 多维对比 radar（多系列|）· 分布相关 scatter · 三维含规模 bubble · 矩阵/时段密度 heatmap · 频次 histogram · 分布对比 boxplot · 增减累计 waterfall · 层级占比 treemap · 流转 sankey · K线 candlestick · 排期/依赖 gantt · 转化漏斗 funnel · **地域分布 map（region 省级热力+d 城市散点 TOP12 涟漪+topn:N 区域榜）** · 明细 table
点数>30 加 `zoom:auto`；图表入 `[panel tt:]`（大屏）或 `[card tt:]`；`l` 数量=数据点数。**多系列（`d` 带 `|`）一律配 `sn:"名1,名2,..."` 命名系列**（进图例/tooltip，缺省显示「系列1/系列2」占位名——生成正式报告时严禁留占位名）。
**整页大屏（选型门槛：仅当用户明确要求「大屏／驾驶舱／指挥中心／监控墙／全屏呈现」时选用；默认一律报告流——「可视化／图表／数据分析」等普通措辞不是大屏需求，严禁切大屏）**：`[fit-screen]` > `[grid h:100% areas theme:tech]` > `[screen-header]` 开头（渐变标题+时钟+LIVE）+ KPI 带（kpi pct:光条）+ panel×N（v:corner/scan，sub 英文副题，extra:"{高亮}"）+ rank-list 龙虎榜 + scrollboard 明细（胶囊格 tag:类型:文本）；氛围（光晕/网格/暗角/辉光）由 theme:tech 自动提供勿手写背景；完整范式见 references/patterns.md 模式五。

## 组件索引（精确属性查 references/components.md）
**text**：h1-h6 · p · a · img · imgs · preview-group · hr/dv · md · code · tag · kbd · b/strong/em/mark/del/sub/sup
**state**：callout · spin/skeleton/shimmer · empty · result · stat · progress · countdown · dot · badge/badge-box · toast/notification · barcode/qrcode · avatar · file · tooltip/popover/popconfirm/hover-card · dropdown · pagination · breadcrumb · calendar · watermark · toggle/toggle-group · thumb · copy · backtop · input-tag · tour
**think**：think · think-chain/think-step · plan/plan-step · agent
**ai**：bubble · tool-call · typing · quick-reply · suggestions/suggestion · source · diff · terminal · sandbox · file-tree · test-result/test-case · commit · quote · latency · conversations/conv · welcome/feature · attachments/attach · artifact · command · canvas · toolbar · chat-input · msg-actions
**media**：video · audio · carousel
**layout**：card · ft · row/col · grid/cell · list/item · tabs/tab · accordion/collapse · timeline/ti · steps/step · desc · tree/tn · menu/menu-item · resizable · scroll-area · sidebar · anchor · affix · masonry · float-button · print-area · page/page-header/page-sidebar/page-content/page-tabs/page-tab · reveal/reveal-item · panel/kpi/screen-header/rank-list/fit-screen/scrollboard（大屏）
**form**：form · input/pwd/textarea · select/radio/checkbox/opt · switch/slider/rate/numinput · segmented · editable · color-picker · btn/btngroup · picker/cascader/transfer · upload · datepicker/timepicker/datetimepicker
**table**：table/thead/tbody/tr/tcol
**chart**：chart 22 种（数据格式见 references/chart.md；容器模式 pt/hrow/flow/task/ms）

## 动态与交互
- 可更新组件加 `id`：`[upd id:x v:50]` 更新 · `[del id:x]` 删除（`delay:3000` 延迟）· `[ins after:x]…[/ins]` 插入；计划推进 `[upd id:step1 status:doing]`。
- 交互 `clk:名` / `on:"change:名"`（必须双引号）：**静态 HTML 报告为静态交付，clk 点击不上报**——按钮仅作视觉示意；交互闭环场景（审批、下钻追问）应在对话正文中引导用户继续对话，不要依赖报告内按钮。处理器引用可带内联参数 `clk:"onDel?id=1024&scene=order-list"`（详查 components.md 事件通道节）。
- 数据属性 `data-*` 原样落组件根元素，handler 第三参 element 经 `dataset` 读取；**禁 `data-tokui-*`**。
- 通用键：id · tt 标题 · tx 文本 · l 标签 · t 类型 · v 值/变体 · pre/suf 前后缀 · s 源/尺寸 · u 链接/单位 · n 字段名 · w/h 宽高 · dis/ro/req/chk/multi 布尔 · data-* 业务数据。
