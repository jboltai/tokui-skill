// TokUI component knowledge base — single source of truth for the generated components.md + dsl-lint.
// Distilled from TokUI v0.2.6 authoritative reference (TokUI/demo/TOKUI_DSL_REFERENCE.md,
// synced through 724d0cd: data-* passthrough + handler "?k=v" inline params + a(clk) event link).
// Keep in sync when @jboltai/tokui is upgraded.

export const FAMILIES = ["text", "state", "think", "ai", "media", "layout", "form", "table", "chart", "flow"];

// f = family, d = precise one-component DSL doc (type · key attrs · semantics · traps)
export const COMPONENTS = {
  // ── text 文本与基础 ──
  h1: { f: "text", d: "自闭合 | 裸内容 | 标题:正文与标签同行 [h1 标题文字],没有 [/h1]——严禁 HTML 式 [h1]文字[/h1](渲染成空标题+散落文字)。变体 left/center/right/ribbon/underline/badge/pill" },
  h2: { f: "text", d: "自闭合 | 同 h1" },
  h3: { f: "text", d: "自闭合 | 同 h1" },
  h4: { f: "text", d: "自闭合 | 同 h1" },
  h5: { f: "text", d: "自闭合 | 同 h1" },
  h6: { f: "text", d: "自闭合 | 同 h1" },
  p: { f: "text", d: "叶子/容器双模 | 裸内容 | 有正文=自闭合(可夹内联子节点,白名单仅 a/tag/b/code/spin/strong/em/mark/sub/sup/kbd——btn/图片等块级会令 p 提前闭合、断裂成兄弟,须改容器模式);无正文=容器[p]…[/p]放块级。变体 left/center/right/muted/bold/sm/lg。⚠正文里的「英文:值」前缀(Q:/A:/step:)会被解析器当属性吞掉——用全角冒号「：」或整段双引号" },
  a: { f: "text", d: "自闭合 | u:链接 tx/裸内容 tt target dis clk | href 协议白名单 http(s)/mailto/tel//#;clk=事件链接:带 clk 点击拦截默认跳转、触发命名 handler(可带内联参数 [a u:# tx:详情 clk:\"onDetail?id=777\"])。变体 muted/danger/success/underline" },
  img: { f: "text", d: "自闭合 | s:图源 alt w h tt | 点击灯箱预览;alt 建议必写(裂图兜底)。⚠s 只用可信稳定图源(用户提供的/站内/无防盗链占位图)——搜索引擎图床热链常被 Referer 拦截,整墙裂图。变体 avatar/rounded/bordered" },
  "preview-group": { f: "text", d: "容器 | id | 子 img 共享灯箱预览会话(缩放/旋转/计数/切换)" },
  hr: { f: "text", d: "自闭合 | 水平分割线" },
  dv: { f: "text", d: "自闭合 | 裸内容/tx v vert align bg th plain | 带文本分割线;v:vert 垂直" },
  md: { f: "text", d: "容器·原始 | Markdown 渲染(表格/列表/任务/引用/代码围栏)。⚠内置运行时未加载 mermaid/katex 插件——md 内 ```mermaid 围栏与 $$公式$$ 只会以源码回退显示,禁用;流程/结构关系改用 chart(t:sankey/gantt)/timeline,公式用普通文本(上下标 sub/sup)" },
  katex: { f: "text", d: "容器·原始/自闭合 | f:公式 | ⚠内置运行时未加载 katex 插件——公式只会显示原始 LaTeX 源码,禁用;公式用普通文本表达(上下标 sub/sup、符号直接写)" },
  mermaid: { f: "text", d: "容器·原始 | ⚠内置运行时未加载 mermaid 插件——图源只会以代码块回退显示,禁用;流程/时序/结构图改用 chart(t:sankey/gantt/treemap)、timeline、tabs+list 组合表达" },
  code: { f: "text", d: "容器·原始 | lang | 高亮代码块+复制+行号;lang: js/ts/py/html/css/sql/json/java/go/rust/bash" },
  tag: { f: "text", d: "自闭合 | tx t s round bordered closable dis bg fc | 标签;颜色 t: default/primary/success/warning/danger/info;s:small/medium/large" },
  kbd: { f: "text", d: "自闭合 | 裸内容/tx | 键帽;变体 sm/lg" },
  b: { f: "text", d: "自闭合 | 裸内容 | 行内加粗(p 内混排)" },
  strong: { f: "text", d: "自闭合 | 裸内容 | 行内加粗" },
  em: { f: "text", d: "自闭合 | 裸内容 | 行内斜体" },
  mark: { f: "text", d: "自闭合 | 裸内容 | 行内高亮" },
  del: { f: "text", d: "自闭合 | 裸内容 | 行内删除线。注意:[del id:x](无内容)是删除指令:删除已渲染组件,delay:毫秒 延迟删(通知/toast 自动退场),目标仍在流式未闭合时自动排队、闭合后执行" },
  sub: { f: "text", d: "自闭合 | 裸内容 | 下标" },
  sup: { f: "text", d: "自闭合 | 裸内容 | 上标" },

  // ── state 状态、反馈与交互 ──
  callout: { f: "state", d: "自闭合(tx:)/容器(子元素) | t tt tx | 警示框,类型用 t:info/success/warning/error/tip(不是 v:!);裸正文/引号文本不自闭合——未闭合会吞掉后续兄弟;单句用 [callout t:warning tx:\"一句\"],多段用容器 [callout t:warning][p …][/callout]" },
  spin: { f: "state", d: "自闭合 | t s tx | 加载指示 t:spinner/dots/pulse" },
  skeleton: { f: "state", d: "自闭合 | t rows w h | 骨架屏 t:text/card/avatar/image" },
  shimmer: { f: "state", d: "自闭合 | t rows | 闪光骨架 t:text/card/avatar" },
  empty: { f: "state", d: "自闭合 | tx icon s | 空状态 icon:default/box/folder/search" },
  result: { f: "state", d: "自闭合 | t tt tx | 结果页 t:success/error/warning/info" },
  barcode: { f: "state", d: "自闭合 | tx l s | Code128 条码 s:sm/md/lg;运单/序列号" },
  qrcode: { f: "state", d: "自闭合 | tx l s ec | QR 码 ec:L/M/Q/H(默认M)" },
  dot: { f: "state", d: "自闭合 | t tx s pulse | 状态点 t:success/warning/error/info/primary" },
  badge: { f: "state", d: "自闭合 | count overflow dot t tx pill | 徽标 count 0-999 溢出默认99;版本号/小数用 tx" },
  "badge-box": { f: "state", d: "容器 | t dot count tx/label | 包裹子元素+角标" },
  toast: { f: "state", d: "自闭合 | id t tx duration pos | 全局 Toast pos:top/bottom duration 默认2000ms" },
  notification: { f: "state", d: "自闭合 | id t tt tx duration pos clk | 全局通知 duration 默认4500ms(0=手动)" },
  progress: { f: "state", d: "自闭合 | v t l s stripe status id | 进度条 v:0-100 t:line/circle/span;表格内联用 t:span" },
  stat: { f: "state", d: "自闭合 | tt v pre suf trend anim dec | 统计数字:标题=tt 值=v(值含空格必须引号:tt:\"客单价 89 元\") 前缀=pre(¥) 后缀=suf(%) trend:up/down anim:1200 dec:小数位。⚠v 值别写千分位逗号——\"1,280\" 会被 parseFloat 截成 1,写 v:1280(小数配 dec)。⚠属性名就是这些短键——写 label:/value:/unit: 会被渲染器忽略、数字卡渲染为空。看板必加 anim" },
  countdown: { f: "state", d: "自闭合 | target/dur fmt tx l s clk | 倒计时;target ms 或 dur 秒;fmt:dhms/hms/ms/s" },
  thumb: { f: "state", d: "自闭合 | t v s clk | 赞/踩 t:up/down" },
  toggle: { f: "state", d: "自闭合 | tx chk clk s dis | 切换按钮" },
  "toggle-group": { f: "state", d: "容器 | multi s clk | 切换组,子项 toggle;默认单选互斥" },
  copy: { f: "state", d: "自闭合 | id tx tt | 复制到剪贴板;id=目标元素" },
  upd: { f: "state", d: "自闭合指令 | id +更新键 | 更新已渲染组件:[upd id:x v:50 status:success];id 支持逗号多目标" },
  tooltip: { f: "state", d: "自闭合 | tt pos tx/裸内容 | 文字提示 pos:top/bottom/left/right" },
  popover: { f: "state", d: "容器 | tx tt pos w trig | 气泡卡片 trig:click/hover;tx 是触发文本(不触发自闭合)" },
  popconfirm: { f: "state", d: "自闭合 | tt tx clk t pos ok-text cancel-text | 确认气泡 t:primary/danger" },
  "hover-card": { f: "state", d: "容器 | pos w delay | 子项须为 hover-trigger + hover-content" },
  "hover-trigger": { f: "state", d: "容器 | hover-card 子结构" },
  "hover-content": { f: "state", d: "容器 | hover-card 子结构" },
  "input-tag": { f: "state", d: "容器 | ph n id max tags clk l | 标签输入;带 tags:\"a,b\" 自闭合" },
  dropdown: { f: "state", d: "容器 | tx/tt v | 下拉菜单,子项 dd-item" },
  "dd-item": { f: "state", d: "自闭合 | tx clk dis v | dropdown 子项" },
  backtop: { f: "state", d: "自闭合 | t v tx s bottom right container | 回顶;t=滚动阈值px" },
  pagination: { f: "state", d: "自闭合 | page total count show-total s clk | 分页,点击 emit {page}" },
  breadcrumb: { f: "state", d: "自闭合 | items sep clk v | 面包屑 items 逗号路径;v:arrow" },
  calendar: { f: "state", d: "自闭合 | month v tt marks sel range ranges | v:card/mini;marks:\"3,15\" 标记;sel 离散选中;range:\"15-21\" 区间" },
  watermark: { f: "state", d: "容器 | tx s font c gap ro | 水印容器;tx 是水印文本(不触发自闭合);ro 角度默认-22" },
  avatar: { f: "state", d: "自闭合 | s tx size bg fc | 头像;无 s 时取前2字文字头像" },
  file: { f: "state", d: "自闭合 | n s t u tt | 文件卡片 t:pdf/word/excel/ppt/image/zip/code" },
  tour: { f: "state", d: "容器 | open mask id on | 漫游引导,子项 tour-step(tgt/tt/tx/pos)" },
  "tour-step": { f: "state", d: "自闭合 | tgt tt tx pos | tour 子项;tgt=目标id" },

  // ── think 思考与计划 ──
  think: { f: "think", d: "容器 | tt open | 思考块(details 折叠)" },
  "think-chain": { f: "think", d: "容器 | tt status open | 推理链 status:running/done;子项 think-step" },
  "think-step": { f: "think", d: "容器 | status tt dur | status:done/running/pending/error" },
  plan: { f: "think", d: "容器 | tt | 执行计划;子项 plan-step" },
  "plan-step": { f: "think", d: "自闭合 | status tt desc id | status:pending/doing/done/error/skipped;带 id 可 [upd id:x status:doing] 逐步推进" },
  agent: { f: "think", d: "自闭合 | name status action duration id | 智能体状态 status:idle/running/paused/done/error" },

  // ── ai AI/对话 ──
  bubble: { f: "ai", d: "容器 | role model time | 对话气泡 role:user/ai/system;chat 场景勿嵌套" },
  toolbar: { f: "ai", d: "容器 | pos align | 工具栏 pos:top/bottom align:left/center/right" },
  "tool-call": { f: "ai", d: "容器 | name status duration id approval collapsed clk | 工具调用卡片 status:pending/running/done/error/denied;approval+pending 渲染批准/拒绝(HITL);upd 支持 status/duration/result/error" },
  typing: { f: "ai", d: "自闭合 | text | 输入中指示(注意是 text 不是 tx)" },
  "chat-input": { f: "ai", d: "容器 | ph clk dis max auto rows streaming mention on id | 对话输入框:Enter 发送/Shift+Enter 换行,发送触发 clk(负载 {value})或统一出口 send;streaming 显停止钮(on:\"stop:h\" 或默认断流);mention:数据源handler 启用 @ 提及;id 落 DOM,[upd id:x dis/streaming] 全通路生效" },
  "msg-actions": { f: "ai", d: "容器 | clk copy regenerate like delete visible | 消息操作栏;布尔属性生成默认图标钮(copy 复制/regenerate 重生成/like 赞+踩/delete 删除),点击发 action 事件负载 {act}。⚠默认钮非前端行为,点击经事件通道外发、静态报告无回路——用默认钮必须带 clk:名" },
  "quick-reply": { f: "ai", d: "容器 | items clk | 快捷回复 items 逗号标签" },
  suggestions: { f: "ai", d: "容器 | cols clk id | 建议卡片网格 cols 1-4;子项 suggestion" },
  suggestion: { f: "ai", d: "自闭合 | tt tx clk icon dis | 建议项" },
  source: { f: "ai", d: "自闭合 | n tt sn u | 引用源;n 序号 sn 片段" },
  diff: { f: "ai", d: "容器·原始 | title lang | 代码差异;+增 -删 其它上下文" },
  "file-tree": { f: "ai", d: "容器 | — | 文件树,子项 ft-folder/ft-file" },
  "ft-folder": { f: "ai", d: "容器 | name open | 文件夹" },
  "ft-file": { f: "ai", d: "自闭合 | name badge | 文件" },
  terminal: { f: "ai", d: "容器·原始 | title status | 终端输出;status 非0 error 样式" },
  sandbox: { f: "ai", d: "容器·原始 | lang title height | 代码预览沙箱;lang:html 用 iframe" },
  "test-result": { f: "ai", d: "容器 | pass fail skip total duration | 测试结果,子项 test-case/case" },
  "test-case": { f: "ai", d: "自闭合 | status name duration error | status:pass/fail/skip" },
  case: { f: "ai", d: "自闭合 | 同 test-case(推荐简写)" },
  commit: { f: "ai", d: "自闭合 | hash msg author branch time additions deletions | Git 提交" },
  quote: { f: "ai", d: "容器 | role tx msgid | 引用消息" },
  latency: { f: "ai", d: "自闭合 | v t | 延迟指标 t:thinking/generating/total" },
  conversations: { f: "ai", d: "容器 | clk act | 会话列表,子项 conv;按 time 分组" },
  conv: { f: "ai", d: "自闭合 | tt time active act | 会话项" },
  welcome: { f: "ai", d: "容器 | tt st bd hd ft | 欢迎页;子项 welcome-feature/feature" },
  "welcome-feature": { f: "ai", d: "容器/自闭合 | tt tx i clk | 特性卡片 i:code/chart/doc/dashboard/print/chat/table/form" },
  feature: { f: "ai", d: "自闭合 | 同 welcome-feature(推荐简写)" },
  attachments: { f: "ai", d: "容器 | clk | 附件列表,子项 attach" },
  attach: { f: "ai", d: "自闭合 | t s u size clk | t:image/pdf/word/excel/ppt/zip/code/video/audio" },
  artifact: { f: "ai", d: "容器 | tt lang pos w | Artifact 侧边预览 pos:left/right;子项 artifact-code + artifact-preview" },
  "artifact-code": { f: "ai", d: "容器·原始 | artifact 代码槽" },
  "artifact-preview": { f: "ai", d: "容器 | artifact 预览槽" },
  command: { f: "ai", d: "容器 | ph clk id hotkey | 命令面板 Cmd/Ctrl+K;子项 command-group;选中 emit {value,text}" },
  "command-group": { f: "ai", d: "容器 | tt | 命令分组,子项 command-item/item" },
  "command-item": { f: "ai", d: "自闭合 | tx v clk shortcut | 命令项(推荐用 item)" },
  canvas: { f: "ai", d: "容器 | tt pos w tx open closable | 画布面板 pos:left/right;子项 canvas-content" },
  "canvas-content": { f: "ai", d: "容器 | canvas 内容槽" },

  // ── media 媒体 ──
  video: { f: "media", d: "自闭合 | s poster ratio w h fit controls | ratio:16:9/4:3/1:1/21:9;fit:cover/contain/fill" },
  audio: { f: "media", d: "自闭合 | s tt duration w | 音频播放器" },
  imgs: { f: "media", d: "容器 | s | 等高图片网格(s 逗号图源或子项 img);点击灯箱。不等高瀑布流用 masonry,多图共享同一灯箱会话(缩放/切换/计数)用 preview-group 包 img" },
  carousel: { f: "media", d: "容器 | id auto thumb w h ratio | 轮播 auto=毫秒;子项 carousel-item/item/img" },
  "carousel-item": { f: "media", d: "自闭合 | s tt tx | 轮播项" },

  // ── layout 布局容器 ──
  card: { f: "layout", d: "容器 | tt v w hc ht | 卡片;标题含空格必须引号(tt:\"今日 GMV\",不引号被截断);hc: 头部颜色——语义名(primary/danger/success/warning/info/dark)必须与 ht: 同写才生效,自定义色值(hex/rgba)可单独用;ht: 头部样式,取值 fill/accent/underline/dot/pill(勿写进 hc)。⚠card 不会像 item 那样被下一个兄弟自动闭合——有子内容必须 [/card],漏写=后续所有卡片嵌套进上一张。⚠裸正文非法:正文必须写 tx:(叶子卡,如 [card tt:\"标题\" tx:\"一句正文\"])或子元素 [p];裸正文不自闭合、会吞掉后续兄弟组件。⚠有子元素禁用 tx(tx=自闭合叶子卡,子内容会漏出);变体 highlight/flat/bordered/center/right" },
  ft: { f: "layout", d: "容器 | tx/裸内容 v | 卡片页脚(card/dialog/drawer 内自动分离);无内容不渲染,严禁空 [ft][/ft]" },
  row: { f: "layout", d: "容器 | v gutter gy | 12 列栅格行;v:inline 转 flex;gutter 间距 gy 行距" },
  col: { f: "layout", d: "容器 | span offset rspan 断点xs/sm/md/lg/xl | 栅格列 span 1-12;2列各span:6,3列各span:4,4列各span:3。响应式断点:xs/sm/md/lg/xl 值=该档 span 1-12 或 \"span/offset\" 组合(如 xs:12 sm:6 lg:3=桌面3列平板2列手机1列);按容器宽递增覆盖(xs 全宽→sm≥576→md≥768→lg≥992→xl≥1200),只覆盖不改默认" },
  grid: { f: "layout", d: "容器 | cols rows areas gap/gx/gy h minh theme v 断点xs/sm/md/lg/xl | 断点值=列数1-12([grid xs:1 sm:2 lg:3] 自适应卡片墙);二维网格:cols N|auto:180px|轨道串;areas:\"nav main|aside .\"(|分行 空格分列);流式+areas 自动按区名骨架占位(先占位,cell 到达替换,skel:false 关);theme:dark/modern;v:dense/flush。⚠rows/h 定死内容超高会溢出,不定高内容省略 rows" },
  cell: { f: "grid 子项 | area c r align justify | c 列跨 N 或 \"1/3\";r 行跨;无需跨区时子组件可直接作 grid 子项" },
  list: { f: "layout", d: "容器 | t plain | 列表 t:ol 有序;子项 item;别名 ol/ul" },
  item: { f: "layout", d: "容器 | tx/裸内容 l span | 按父级变义:list 内=li;desc 内=描述项(l 标签 tx 值);carousel 内=幻灯片;command-group 内=命令项。别名 i。⚠不支持 icon:/i:——写了会被解析器当属性吞掉、丢字;列表项要标记:emoji 直接写正文开头(如 [item ✅ 文字])或用 tag" },
  i: { f: "layout", d: "item 别名" },
  ol: { f: "layout", d: "list 有序别名(= [list t:ol])" },
  ul: { f: "layout", d: "list 无序别名(= [list] 默认)" },
  tabs: { f: "layout", d: "容器 | — | 标签页,子项 tab(tt 为标签名);v 是激活页序号(值语义);upd v:N 切页" },
  tab: { f: "layout", d: "容器 | tt | tabs 子项" },
  accordion: { f: "layout", d: "容器 | — | 手风琴,子项 collapse" },
  collapse: { f: "layout", d: "容器 | tt open id | 折叠面板;upd act:open/close" },
  dialog: { f: "layout", d: "容器 | tt id clk w | 对话框;upd act:open/close;w:弹窗宽px(480~1200 落 max-width,默认480,编辑表单 cols:2/transfer 用 w:720)。⚠静态报告无触发通路:渲染后打不开,常规报告禁用——需要折叠/分层内容用 collapse(用户可点)或 tabs 替代" },
  drawer: { f: "layout", d: "容器 | tt pos w h id | 抽屉 pos:left/right/top/bottom。⚠同 dialog:静态报告打不开,禁用;侧栏内容用 tabs/collapse 替代" },
  timeline: { f: "layout", d: "容器 | v | 时间轴 v:h/horizontal/alt/card;子项 ti(自闭合,正文写标签内,禁 [/ti])" },
  ti: { f: "layout", d: "自闭合 | tm t tt 裸内容 | 时间轴项 t:primary/success/warning/error/info。⚠没有 [/ti]!正文=开标签属性后的裸文本,与标签同一行:[ti tm:\"2024 下半年\" t:info tt:\"v1.x 首发\" 平台基础版发布,确立工程化定位]。tm/tt 含空格必须引号;正文一句流文本,不能含 ](含 [ ] 用引号包该词),不能换行分段;正文别出现 英文:值 词(会被吃成属性)" },
  steps: { f: "layout", d: "容器 | v s vd id | 步骤条 v=当前步(1-based,值语义);vd:v 竖排;子项 step(自闭合,正文写标签内,禁 [/step])" },
  step: { f: "layout", d: "自闭合 | tt status 裸内容 | 步骤项 status:error/danger。⚠没有 [/step]!正文=开标签属性后裸文本(同 ti):[step tt:调研 status:done 输出需求文档]" },
  desc: { f: "layout", d: "容器 | cols stripe bordered v lw | 描述列表(简历/详情页用,不是表格);子项 item(推荐)或 desc-item;v:h lw:120px 横向" },
  "desc-item": { f: "layout", d: "自闭合 | l tx span | 描述项(推荐用 item)" },
  tree: { f: "layout", d: "容器 | id l clk chk dis | 树;chk 可勾选;子项 tn" },
  tn: { f: "layout", d: "容器/自闭合 | v tx open leaf chk dis load | 树节点;leaf 自闭合;可递归嵌套" },
  menu: { f: "layout", d: "容器 | v act bg fc id | v:vertical/horizontal/inline;子项 menu-item" },
  "menu-item": { f: "layout", d: "自闭合 | tx clk i dis act | 菜单项" },
  resizable: { f: "layout", d: "容器 | dir min max default w | 分割面板 dir:h/v;须 2 个子面板" },
  "scroll-area": { f: "layout", d: "容器 | h w minh maxh dir id virtual ih | 通用滚动容器(包任意组件)。h/w 纯数字按 px(亦可 100%/50vh),宽缺省 100%;minh/maxh 弹性高度(少收缩/多封顶);dir:x 仅横向(标签带)/dir:y 仅纵向,缺省双向按需;v:flush 去内边距嵌表格。滚动条默认隐藏,hover/滚动中/键盘聚焦浮现。virtual 虚拟滚动(均匀行高,ih 默认36);触底报 loadmore" },
  sidebar: { f: "layout", d: "容器 | w pos collapsible tt bg fc id | 侧边栏;子项 sidebar-content/sidebar-footer" },
  "sidebar-content": { f: "layout", d: "容器 | sidebar 内容区" },
  "sidebar-footer": { f: "layout", d: "容器 | sidebar 页脚" },
  anchor: { f: "layout", d: "双模式 | opt top on id | 锚点导航 opt:\"目标id:标题;…\" 自闭合;容器子项 lk;scroll-spy 高亮" },
  lk: { f: "layout", d: "自闭合 | h tx d | anchor 子项;h 目标 id" },
  affix: { f: "layout", d: "容器 | top bottom target on | 固钉;滚过偏移即 fixed" },
  masonry: { f: "layout", d: "容器 | cols minw gap | 瀑布流(图集/不等高卡片墙):子项放 img/card 等块级组件,CSS columns 自动分列、子项不截断;cols 固定列 1-6 或 minw:N 子项最小宽自适应(优先,响应式);gap 间距默认 8。⚠子项 card 有子内容必须 [/card] 闭合——card 不会自动闭合,漏写=整墙嵌套成一张卡。⚠图源必须可信稳定(外链图床防盗链=整墙裂图)。等高九宫格用 imgs" },
  "float-button": { f: "layout", d: "容器 | pos offset | 浮动按钮组 pos 四角" },
  "print-area": { f: "layout", d: "容器 | id tt | 打印区,配合 [btn print:ID] 1:1 打印" },

  // ── form 表单 ──
  form: { f: "form", d: "容器 | act mtd sub clk id cols lw gap v:inline | 提交前执行 reportValidity(req/pat 拦截);sub=提交处理器。⚠末尾必带提交+重置两按钮,直接放 form 内(勿用 [ft]):[btn tx:提交 v:primary sub:formSubmit]+[btn tx:重置 reset](前端清空);提交用 sub 不用 clk(clk 绕过校验);字段 l:中文标签 n:英文key 必填 req。M2 布局:cols:1~4 字段网格/lw 标签统一宽(40~320)/gap 间距/v:inline 过滤条(与cols同写cols优先);字段 v:full 跨整行(全字段类型);编辑资料默认 cols:2 lw:84 起步。编辑回填(M2):dialog 常驻→逐字段 upd(input/select/radio v:值;datepicker v:2024-06-01;time·datetimepicker v:\"09:30\";cascader v:\"gd/gz\" 路径校验;transfer v:\"1,2\" 右栏重排;upload act:fill files:\"名,url,大小|…\")" },
  input: { f: "form", d: "自闭合 | l ph id n val ml req dis ro w hint pat err ok live search v pre/app/prebtn/appbtn rule msg sug db t | val 存初值(v 是变体);t:email 才有邮箱格式校验(t:text/缺省只查非空);rule:\"required|email|len:6\" DSL 校验;live 实时校验;search 图标;pre:¥ 前置" },
  pwd: { f: "form", d: "自闭合 | 同 input + toggle | 密码框;toggle 显隐" },
  textarea: { f: "form", d: "容器 | l id n ph rows maxlen maxrows auto tx req | 多行输入。⚠与 input 不同,不自闭合:初始值用 tx: 自闭合([textarea n:note ph:提示 tx:默认值])或容器式写在标签间([textarea n:note]默认值[/textarea]);**空字段也必须 [/textarea] 闭合**,漏闭合会吞掉后续表单控件。auto 自适应高度" },
  select: { f: "form", d: "容器 | l ph multi id n req v opt | 子项 opt 或 opt:\"v:标签;…\" 简写自闭合(须双引号)。⚠同一标签只能写一个 opt:——多个选项用容器子节点,严禁两个 opt: 属性(后者覆盖前者)" },
  radio: { f: "form", d: "容器 | l id n v opt | 子项 opt 或简写;v:inline/vertical 排列(手动标记)。⚠同一标签只能一个 opt:,多选项用容器子节点" },
  checkbox: { f: "form", d: "三态 | l chk id n v opt multi | 无opt无multi=单布尔自闭合;有opt=简写多选(仅一个 opt:);有multi=容器多选(数组)" },
  opt: { f: "form", d: "自闭合 | v tx chk p | 选项(随父变 select/radio/checkbox/picker/cascader/transfer);p 仅 cascader 父值" },
  switch: { f: "form", d: "自闭合 | l chk dis clk id n v | 开关" },
  slider: { f: "form", d: "自闭合 | l min max step v dis clk id n range marks | range 双滑块 v:\"20,60\";marks:\"0:免费,50:标准\" 刻度" },
  rate: { f: "form", d: "自闭合 | l v max tx ro dis clk id n half | 评分 max 默认5;报告/展示类必加 ro(表单收集勿加);严禁用 ★/☆ 字符模拟星级" },
  numinput: { f: "form", d: "自闭合 | l v min max step dis id n | 数字输入" },
  segmented: { f: "form", d: "双模式 | opt v n l dis on id | 分段控制 opt:\"v:label;…\" 自闭合;v 当前值;变体 sm/lg/block/pill/vertical" },
  editable: { f: "form", d: "自闭合 | tx v ph n dis on id | 行内编辑;Enter/失焦提交 Esc 还原" },
  "color-picker": { f: "form", d: "自闭合 | v presets n l dis on id | 颜色选择 v:#rrggbb" },
  btn: { f: "form", d: "自闭合 | tx t sub clk id dis w bg fc radius icon i l/tt form reset print | 变体 v: primary/danger/success/warning/ghost/sm/lg/pill/square/block;t:submit 提交语义;icon: 内置SVG名 l 作 icon-only tooltip;内置动作 print>reset>submit>clk" },
  btngroup: { f: "form", d: "容器 | id v | v:vertical/pill" },
  picker: { f: "form", d: "容器 | l ph multi dis id n v | 选择器(可搜索);子项 opt" },
  cascader: { f: "form", d: "容器 | l ph dis clk v id n | 级联;v 预选路径 / 分隔。⚠层级必须容器子 opt + p:父值([cascader][opt v:tech tx:技术部][opt v:fe tx:前端 p:tech][/cascader]);严禁简写 opt:、严禁多个 opt: 属性" },
  transfer: { f: "form", d: "容器 | l tt tt2 clk id dis n h mh | 穿梭框;子项 opt(chk 进右栏)" },
  upload: { f: "form", d: "自闭合 | l ph accept multi dis clk max id n u mtd | u: 上传地址启用自动传输(进度/重试),无 u 仅前端选择" },
  datepicker: { f: "form", d: "自闭合 | l ph fmt v clk dis id n range | fmt 默认 YYYY-MM-DD;range 范围模式" },
  timepicker: { f: "form", d: "自闭合 | l ph fmt v clk dis id n | fmt 默认 HH:mm" },
  datetimepicker: { f: "form", d: "自闭合 | l ph fmt v clk dis id n | fmt 默认 YYYY-MM-DD HH:mm" },

  // ── table 表格 ──
  table: { f: "table", d: "容器 | stripe cap v id sortable filter pagination ps fixed fc loading empty | v:bordered/compact;sortable 客户端排序 filter 筛选 pagination+ps:N 分页(默认10/页,page 载荷 {page,size,filter,sort});M2:fixed 首列钉左/fc:N 尾N列钉右(横滚固定+分界阴影,配 w: 列宽)/loading 骨架覆盖(upd loading:false 撤)/empty 空态;详见 references/table.md" },
  thead: { f: "table", d: "容器/自闭合 | cols | cols:\"姓名 w:140,年龄\";# 序号列 chk 全选列;; 分多行;列名后 /c /r /l 对齐 /primary 等配色;M2 列宽 `名称 w:180`(24~2000,可与对齐组合 `金额 w:120/r`,th 显式宽传导 body 列,固定列必配);带 cols 自闭合" },
  tbody: { f: "table", d: "容器 | — | 表体" },
  tr: { f: "table", d: "自闭合 | 逗号分隔单元格 v:total id pid clk | ⚠btn:/tag:/progress v:/[xxx] 内联组件格裸写即可(空格子属性已归位到单元格,多钮|分隔、格内勿含英文逗号;行级 id:/pid: 写行首);货币符号金额(¥$€)千分位免引号;cell 尾缀 =cN/=rN 合并;v:total 汇总行;M2:clk:handler 行点击上报 {index,row[]};id+pid:父行id 树形行(子行折叠+缩进+父行展开钮,upd id:父行 act:expand/collapse)。详见 references/table.md" },
  // ── dashboard 大屏组件（M1 + 大屏专业化）──
  panel: { f: "layout", d: "容器 | tt sub extra v(corner/glow/plain/scan) theme | 科技边框容器(大屏面板);sub 英文副标题,extra:'转化率 {9.8%}' 右侧信息({段}高亮);v:corner 四角角标/glow 发光/scan 扫描线(可逗号组合 v:'corner,scan');theme:tech 子树科技风(hover 抬升+标题栏渐变底)" },
  kpi: { f: "layout", d: "容器 | tt v(数值) pre suf unit trend dec icon pct clk t | 指标卡:数值滚动动画,trend:12.4/-1.2 自动↑↓徽章,pct:78 底部完成度光条,t:danger/success/warning 状态色,[upd id: v:/trend:/pct:] 更新走动画;tech 主题大数字 display 字体+辉光" },
  "screen-header": { f: "layout", d: "自闭合 | tt sub lft rgt clock live h theme | 大屏门头:tt 渐变主标题(34px 字距8px 辉光)/sub 英文副题/lft·rgt 左右信息胶囊/clock 右端走动时钟+日期/live LIVE 呼吸灯/h 高度默认92(48-240);底缘主色渐变分隔线;整页大屏以它开头替代裸 h1" },
  "rank-list": { f: "layout", d: "容器 | rows unit top av h speed clk theme | 龙虎榜:rows:'名,区域,值|…'(首列名 末列值 中间列合并副文本)简写自闭合;无 rows 容器收 tr 子节点;top:3 前三名渐变奖牌(金橙/青蓝/紫,默认3);av 首字渐变头像;unit 值后缀;h 视口高内容超高自动无缝上滚(hover暂停);排行榜场景用它勿用 scrollboard 裸表" },
  "flip-num": { f: "layout", d: "自闭合 | v(数字串含逗号/%) dur s(sm/lg) | 逐位3D翻牌;upd v: 各位滚到位" },
  "fit-screen": { f: "layout", d: "容器 | w h mode(scale/width/full) maxh | 大屏缩放容器:1920×1080 设计稿等比适配,scale/full 挂载区需定高;mode:scale 居中留空(默认)/width 等宽贴合内容高,maxh:视口高上限后超高纵滚/full 拉伸;内部容器 h:100% 满幅排版防画布留白" },
  scrollboard: { f: "layout", d: "容器 | h speed gap cols rows clk | 轮播榜单:rows:'a,1,↑2|b,2,↓3' 简写或 tr 子节点;↑↓自动着色;胶囊格 tag:类型:文本(如 tag:success:已签约);hover暂停无缝循环;speed:0 静止" },
  // ── page 应用壳（M2/T2.1）──
  page: { f: "layout", d: "容器 | w(140~480 侧栏宽默认240) theme | 后台应用壳:grid areas 三区(header横贯顶/sidebar+content两列);直系子元素只写三件套 page-header/page-sidebar/page-content(其余落主区属兜底非规范);外层容器有定高自动铺满否则按内容" },
  "page-header": { f: "layout", d: "容器 | tt bc sticky | 页头:bc:'首页,系统,用户' 逗号分级面包屑(末项自动当前页);sticky 吸顶;子节点(btn等)落右侧动作插槽;upd id: tt:/bc: 就地更新" },
  "page-sidebar": { f: "layout", d: "容器 | tt | 侧栏:品牌行+折叠钮(联动 page 列宽 240⇄64)+滚动主体;toggle 上报 {folded};菜单联动:menu change 载荷 {value,item,path},一条 upd id:header bc: 即同步面包屑" },
  "page-content": { f: "layout", d: "容器 | — | 主区薄包装:纵列+自滚动+裁剪防护,列表/表单/详情直接放" },
  "page-tabs": { f: "layout", d: "容器 | act on id | 多页签:act 初始激活key(未命中回落首个可用);点击上报 change {key,title};upd id: act:key 静默切换;键盘←→导航" },
  reveal: { f: "layout", d: "容器 | v:up|left|right|zoom(方向默认up) delay:N(0~4000ms) | 滚动入场(T3.2):IntersectionObserver 一次性进场(播完不重播);直接子元素按序 stagger 递增 80ms(纯CSS前12档);reveal-item 为可选分组包装(不写则子组件直接参与stagger);reduced-motion/无IO 内容直接可见永不见丢失;流式闭合克制定格(已在视口/流式中看过→不重放,折叠区滚动到时一次性入场);长内容渐进披露用,首屏可见区勿包" },
  "reveal-item": { f: "layout", d: "容器 | — | reveal 的分组包装:一个 item=一个 stagger 单元(自带块级间距);仅作 reveal 直接子元素时有意义" },
  "page-tab": { f: "layout", d: "容器 | n tt closeable dis | 单页签:n key(缺省用tt);closeable × 关闭上报 close 并让位邻签;del id: 整签移除(按钮+面板一体);流式跟随激活闭合按 act 归位" },
  tcol: { f: "table", d: "自闭合 | n | 列占位(thead 无 cols 时)" },

  // ── chart 图表 ──
  chart: { f: "chart", d: "容器/自闭合 | t tt d l sn c w h v ... | ⚠属性顺序铁律 t→样式→l/sn→d;多系列(d 带 |)必配 sn:'名1,名2,...'命名系列(进图例/tooltip,缺省回退「系列N」占位名);系列色默认随主题色板自动切换(T0.5,暗色自动提亮,无需手动 c:),仅特殊品牌色才写 c:;grad 布尔=渐变填充(bar/area/donut);enter:'false' 关入场动画;23 种类型 t:bar/line/area/pie/donut/rose/funnel/radar/scatter/bubble/heatmap/histogram/waterfall/boxplot/treemap/sankey/candlestick/wordcloud/progress/gauge/map/combo;map(中国地图:region:'浙江:86|江苏:74' 省级热力 34省含港澳台+d:'lng,lat,val,name:城市' 散点 值TOP12自动涟漪(ripple:off 关);topn:5 左下自动区域TOP榜;label:full|name|off 标注三档;unit 单位;hover多行tooltip+高亮;点击省份 on:'mapClick:handler' 上报;vmin/vmax 锁色阶+自带 visualMap 色阶条/南海诸岛小图);combo(双轴组合图:d 柱左轴+d2 线右轴+n1/n2 系列名(优先)或 sn 缺省名+y2 右轴单位,趋势+增速面板标配);wordcloud(词云:d:'词:权重' 同 treemap 名:值格式,字号∝权重、螺线碰撞布局、确定性渲染,关键词热度/评价标签/技术雷达);无 d 时容器模式收 pt/hrow/flow/task/ms。完整数据格式见 references/chart.md" },
  pt: { f: "chart", d: "自闭合 | v | chart 容器模式点子节点" },
  hrow: { f: "chart", d: "自闭合 | v | heatmap 行子节点 v,v,v" },
  flow: { f: "chart", d: "自闭合 | v | sankey 子节点 源->目标:值" },
  task: { f: "chart", d: "自闭合 | v | gantt 子节点 名,起,止,进度,组" },
  ms: { f: "chart", d: "自闭合 | v | gantt 里程碑 名,时间,组" },

  // ── flow 动态指令 ──
  ins: { f: "flow", d: "容器指令 | after/before/into:目标id | 插入内容;目标须已渲染;结构性容器(tabs/table/chart/select 等)禁 into" },
};

// §5 容器清单(verbatim) — 必须闭合,除非命中自闭合逃逸
export const CONTAINERS = new Set((
  "form table thead tbody card ft row col list grid cell select radio checkbox code imgs md " +
  "textarea tabs tab accordion collapse dialog btngroup picker timeline steps drawer " +
  "ol ul i item think think-chain think-step bubble toolbar badge-box dropdown transfer callout " +
  "cascader tree tn desc carousel popover input-tag watermark menu print-area " +
  "chat-input msg-actions tool-call diff quick-reply plan file-tree ft-folder " +
  "terminal sandbox test-result quote toggle-group conversations welcome welcome-feature " +
  "suggestions attachments artifact artifact-code artifact-preview scroll-area " +
  "sidebar sidebar-content sidebar-footer command command-group hover-card hover-trigger hover-content " +
  "resizable canvas canvas-content chart ins katex mermaid p tour affix preview-group segmented anchor float-button masonry " +
  // 大屏四件套 + 缩放容器（T1.2/T1.3）——此前缺席致大屏 DSL 结构校验失明
  "panel kpi rank-list scrollboard fit-screen" +
  // 应用壳六件套（M2/T2.1）
  " page page-header page-sidebar page-content page-tabs page-tab"
  // 滚动入场（T3.2）
  + " reveal reveal-item"
).split(/\s+/));

// §5.1 全局属性(T0.1 样式定制通道 + T0.6 数据属性通道) — 对全部组件生效,落组件根元素;详情见 components.md 全局属性节
export const GLOBAL_ATTRS = {
  cls: "全局属性 | 自定义类名,空格分多个(含空格整个值双引号包) | 每个类名须 ^[a-zA-Z][\\w-]{0,63}$、拒 tokui- 前缀、上限 8 个去重;非法词静默丢弃。用于自定义 CSS 钩子(动画/精修)。例:[card tt:品牌卡 cls:\"pricing fade-in\"]",
  style: "全局属性 | 白名单内联样式,落组件根元素 | 放行 background(-image/-color)/color/border(含圆角)/padding/margin/box-shadow/opacity/font-*/text-align/letter-spacing/line-height/max-min宽高/gap/flex族/align-justify/transform(仅translate/scale/rotate族)/backdrop-filter/aspect-ratio/object-fit/transition/z-index;url() 仅 http(s)/站内相对。**拒绝**(静默丢弃):position/top/left/right/bottom、expression()、javascript:、behavior:、@import、url(data:)/url(ftp:)、transform:matrix。例:[card style:\"background:linear-gradient(135deg,var(--tokui-primary-1),var(--tokui-bg));border-radius:16px\"]。违规声明静默丢弃,合法声明照常生效",
  "data-*": "全局属性 | data- 开头属性原样透传到组件根元素(全组件),clk:/sub: handler 第三参 element 经 getAttribute/dataset 读取,事件携带自定义数据 | 例:[btn tx:删除 t:danger data-id:1024 data-scene:order-list clk:onDel]→el.dataset.id='1024'/el.dataset.scene='order-list'。**拒 data-tokui-***(框架内部印章:clk/sub/act/tag,防 DSL 伪造印章劫持事件分发,写了不透传);组件已手动落的同名属性不覆盖;值含空格整个值双引号包;表格行另有简写 tr d:\"k:v k2:v2\"(自动加 data- 前缀落行元素)。轻量上下文优先 clk:\"h?k=v\" 内联参数(详查 components.md 事件通道 clk)",
};

// §8 事件通道(724d0cd 增强) — clk:/sub:/on: 处理器引用;详情见 components.md 事件通道节
export const EVENT_CHANNELS = {
  clk: "事件通道 | 点击处理器名,需运行时 registerHandler 注册——静态 HTML 报告无 handler,点击不上报(按钮仅视觉示意) | 处理器引用可带查询串内联参数:clk:\"onDel?id=1024&scene=order-list\"——'?' 后按 '&' 分段,段内首个 '=' 分 k/v,值一律字符串(URL decode,空格写 %20),无 '=' 的段=布尔 true;参数直接进 handler 第一参(无需从 DOM 读);与表单数据共存时合并进同一对象、同名键内联参数优先;参数键 __proto__/constructor/prototype 被拒;无 '?' 时行为与旧版一致。也可配 data-* 属性把数据落根元素、handler 第三参 element 读取",
  sub: "事件通道 | 表单提交处理器名(提交前走原生校验 req/pat;提交必须用 sub 不用 clk) | 同 clk 支持内联参数:sub:\"onLogin?src=header\"——表单收集数据与参数合并进同一对象,同名键内联参数优先(DSL 显式声明意图更强)",
  on: "事件通道 | 交互事件上报声明 on:\"事件:处理器\"(必须双引号,英文逗号分多对) | 处理器可带内联参数:on:\"change:onKw?src=header&draft\"(无 '=' 段=布尔 true);⚠参数值不能含英文逗号(',' 是事件对分隔符,在 decode 前拆断、残段被丢——写 %2C)也不能含裸 ':'(写 %3A);事件如 tabs/menu/switch/pagination change、dialog close、scroll-area loadmore、chart t:map 的 mapClick",
};

// 原始内容模式容器:内部 [ 视为字面文本,直到闭合
export const RAW_CONTAINERS = new Set(["code", "md", "katex", "mermaid", "diff", "terminal", "sandbox", "artifact-code"]);

// §3 布尔属性 — 只写 key 即 true;没有 false 值(与 parser BOOLEAN_ATTRS 全量同步)
export const BOOLEAN_ATTRS = new Set((
  "stripe dis ro req chk multi disabled readonly required checked multiple striped " +
  "auto plain round closable bordered open pill dot leaf inline rounded container " +
  "copy regenerate like dislike visible delete controls active collapsible collapsed toggle " +
  "search thumb reset print show-total live approval streaming range half sortable filter " +
  "virtual lazy pagination mask clock av smooth vals"
).split(/\s+/));

// §4 变体白名单(渲染器校验,未知变体静默丢弃)
export const VARIANTS = {
  reveal: "up left right zoom",
  btn: "primary danger success warning ghost sm lg pill square block gradient",
  btngroup: "vertical pill",
  card: "highlight flat bordered center right glass gradient-border",
  table: "bordered compact",
  h1: "left center right ribbon underline badge pill gradient",
  h2: "left center right ribbon underline badge pill gradient",
  h3: "left center right ribbon underline badge pill gradient",
  h4: "left center right ribbon underline badge pill gradient",
  h5: "left center right ribbon underline badge pill gradient",
  h6: "left center right ribbon underline badge pill gradient",
  p: "left center right muted bold sm lg",
  a: "muted danger success underline",
  ft: "left center right",
  row: "left center right inline",
  grid: "dense flush",
  dv: "dashed dotted sm md lg vert plain",
  img: "avatar rounded bordered",
  dot: "sm lg",
  avatar: "sm md lg xl",
  tooltip: "top bottom left right", drawer: "top bottom left right",
  pagination: "sm lg", switch: "sm lg", slider: "sm lg", rate: "sm lg", transfer: "sm lg", upload: "sm lg", tree: "sm lg",
  input: "error success sm lg underline pill", pwd: "error success sm lg underline pill",
  select: "error success", picker: "error success", cascader: "error success",
  breadcrumb: "arrow",
  menu: "horizontal inline",
  segmented: "sm lg block pill vertical",
  anchor: "horizontal",
  "scroll-area": "flush",
  kbd: "sm lg",
  panel: "corner glow plain scan",
};
// 手动标记变体(不在渲染器白名单,组件自身解析)
export const MANUAL_VARIANTS = {
  radio: ["inline", "vertical"],
  checkbox: ["inline", "vertical"],
  input: ["inline"],
  pwd: ["inline"],
  timeline: ["h", "horizontal", "alt", "alternate", "card"],
  steps: ["vd:v", "vertical"],
};

export const CHART_TYPES = new Set("bar line area pie donut rose funnel radar scatter bubble heatmap histogram waterfall boxplot treemap sankey candlestick wordcloud progress gauge gantt map combo".split(" "));

export const ICONS = new Set("view edit delete add copy download upload refresh check close search setting warn info lock unlock more save export filter sort star link menu".split(" "));

export const ALL_NAMES = new Set([
  ...Object.keys(COMPONENTS),
  ...CONTAINERS,
  "grid", "ins", "ol", "ul", "preview-group",
]);

// 组件家族(用于 components.md 按家族分组与 lint 提示)
export const FAMILY_OF = new Map(Object.entries(COMPONENTS).map(([k, v]) => [k, v.f]));
