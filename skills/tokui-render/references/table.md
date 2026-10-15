# table 完整参考

## 结构

```
[table stripe bordered cap:"标题"]
[thead cols:"#,姓名,金额/r/danger,操作"]
[tbody]
[tr 1,张三,¥2,688.00,btn:详情 clk:fillSubmit data-prompt:详情:1]
[tr "合计 ¥17,129=c4" v:total]
[/tbody]
[/table]
```

- `table`:`stripe` 斑马纹 · `bordered` · `compact` · `cap` 标题 · `sortable` 客户端排序 · `filter` 客户端筛选 · `pagination ps:N` 分页(默认 10/页)。**sortable/filter/pagination 默认不加**:用户未明确要求就纯表格(最多 `stripe bordered`);仅行数多(>20)且确需查找/对比时按需加对应一个,不打包全给。
- `thead cols`:`,` 分列 · `;` 分多行表头 · `#` 序号列 · `chk` 全选列 · 列名后缀 `/c /r /l` 对齐、`/primary /danger /success /warning /info` 配色(按列位传导到表体)· 列名可带 `=cN/=rN` 合并。
- **列名含英文逗号**(如 `金额(元,含税)`):cols 整体双引号 + 该列名内层 `\"` 转义——`[thead cols:"序号,产品,\"金额(元,含税)\""]`,否则列数虚高、与 tr 错位。
- **列数铁律:每行 tr 展开后的格数 = 表头列数**(`#`/`chk` 各占 1 列,`=cN` 算 N 格)。含英文逗号的文本格(如 `安排POC演示,摸清决策链`)必须双引号包——否则被切散成多格、整行错位;全角 `，` 不切、无需包。

## 汇总行(合计)

- `v:total` 整行加粗。两种写法,展开格数同样必须 = 列数:
  - **金额列在末尾(推荐)**:`[tr 汇总=c(列数-1),"¥总额" v:total]` —— `汇总` 格横跨金额前所有列、金额格收尾。5 列表例:`[tr 汇总=c4,"¥17,129" v:total]`。
  - **金额列不在末尾**:整行一格横跨、金额并入文字:`[tr "合计 ¥872,000=c11" v:total]`(N=总列数;货币符号保护千分位逗号不被切格)。
- **禁裸写** `[tr 合计,¥872,000 v:total]` —— 2 格 ≠ 11 列 → 错位;且汇总格要从第 1 列起横跨盖住 `#` 序号列,否则 `#` 会给合计行也编号。

## tr 引号系统

| 列类型 | 引号处理 |
|---|---|
| 纯文本/数字/百分比 | 无需 |
| 货币符号金额(`¥2,688.00`/`$1,234,567`) | **无需**(千分位自动识别) |
| 裸数字千分位(无货币符号)/含逗号文本 | 该格双引号包 |
| `tag:在职 t:success` / `progress v:90 t:span` / `btn:… clk:…`(带空格属性) | **无需**(parser 已把简写格的空格子属性归位到单元格,2026-09 起) |
| `[badge count:5]` / `[dot t:success tx:x]`(方括号内联组件) | **无需**(同上) |
| 多按钮 | 无需,`|` 分隔 |

注意两条:
- **内联组件格(btn:/tag:/progress/[xxx])内勿含英文逗号**——逗号会切格、按钮残缺(data-prompt 的 `动作:ID` 本就无逗号,天然安全)。
- **行级属性(`id:`/`pid:`)须写在行首**,写在简写格之后会被当按钮子属性吞掉(如树形行写 `[tr pid:r1 名称,…,btn:…]`)。
- 整行外层双引号包的旧写法仍兼容(内含逗号格用 `\"` 转义),但已无必要,新代码直接裸写:

```
[tr 01,项目01,42,0.8%,progress v:42 t:span,btn:详情 clk:fillSubmit data-prompt:查看详情:项目01]
```

整行外层引号内还有含逗号格时,该格用 `\"` 转义(parser 自动反转义,内层引号保护逗号):`[tr "1,A,\"x,y\",2"]`。

## 单元格内联渲染

- 进度:`progress v:98 t:span`(≥80 自动绿,或 `status:error`)
- 标签:`tag:VIP t:success`
- 按钮:`btn:详情 clk:fillSubmit data-prompt:动作:该行ID` —— ID 取该行编号/ID 列的真实值(点哪行发哪行 ID),英文冒号无空格。**禁 `clk:edit` 无 ID 空 handler**;icon 钮同样必带 handler+ID:`btn: icon:delete l:删除 v:danger clk:fillSubmit data-prompt:删除:该行ID`。多钮 `|` 分隔;`v:danger` 红色删除钮。
- 任意组件:`[badge count:5]`、`[dot t:success tx:运行中]` 方括号内联
- 序号列表头写 `#`,tr 对应位留空;勾选列 `chk`

## 单元格合并(表头表体通用)

尾缀 `=cN` 横跨 N 列(无需占位)、`=rN` 纵跨 N 行(被占列下行省略)、`=c2r2` 组合;严格尾缀,`公式=x=2` 不误判。

```
[thead cols:"大区=r2/c,订单=c2/c,数量/c/primary,金额/r/danger;订单号,客户"]
[tr "华北区=r4,ORD-1,字节,5,¥1280"]
[tr "ORD-2,星辰,8,¥336"]
[tr "ORD-3,云图,17,¥8041"]
[tr "ORD-4,九州,3,¥960"]
[tr 汇总=c4,"¥17,129" v:total]
```

## 列宽 / 固定列 / 表态 / 树形行(M2/T2.3)

- **列宽**:thead cols 内 `名称 w:180`(24~2000px,可与对齐配色组合 `金额 w:120/r`);th 显式宽传导 body 列。
- **固定列**:`[table fixed fc:1]`——fixed 首列钉左 / fc:N 尾 N 列钉右;横向滚动时固定 + 分界渐隐阴影;偏移按列宽实测累计,流式行后到/容器宽变自动重算。**宽表(≥6 列或长文本列)必配**:关键列定宽 + fixed + fc:1(操作列)。
- **loading/empty**:服务端先推 `[table loading]` 占位(骨架覆盖)再逐行推;`[upd id:tbl loading:false]` 撤除;无数据 `[table empty]` 空态占位(行到达自动隐藏)。
- **行点击**:`[tr 数据… clk:onRowClick]` → 上报 `{index, row:[整行文本]}`(整行数据载荷,不经泛化 clk 通道)。
- **树形行**:`[tr 华东大区,128 id:r1][tr 技术研发,64 pid:r1 id:r2][tr 前端组,24 pid:r2]`——子行默认折叠、按 pid 链缩进(深度自适应),父行首格 CSS 三角展开钮;`[upd id:r1 act:expand]` 程序化展开。孙行随其父行状态(展开父不等于展开孙)。
- **分页 payload**:`page` 事件 `{page,size,filter,sort}`(value 兼容)——动态重渲范式:`onPage` handler 里 del 旧行 + ins 新行(upd/del/ins 动态指令见 SKILL.md 动态与交互)。

```
[table fixed fc:1 stripe][thead cols:"物料 w:170,规格 w:210,库存 w:100/r,操作 w:160/r"][tbody]
[tr "精密轴承 6204",内径20mm,2860,btn:编辑 clk:fillSubmit data-prompt:编辑:BEAR-01|btn:删除 v:danger clk:fillSubmit data-prompt:删除:BEAR-01]
[/tbody][/table]
[table stripe compact][thead cols:"部门,人数,负责人"][tbody]
[tr 华东大区,128,张伟 id:r1]
[tr 技术研发,64,李娜 pid:r1 id:r2]
[tr 前端组,24,孙磊 pid:r2]
[/tbody][/table]
```

## 编辑回填闭环(M2/T2.4)

「编辑」标准范式:dialog 常驻 DOM(不带 open)→ 逐字段 `[upd id:]` 回填 → 用户点 `btn:编辑 clk:openDialog data-dialog-id:…` 打开即见回填值 → 改完提交。

| 控件 | 回填 | 说明 |
|---|---|---|
| input/pwd/textarea/numinput | `[upd id:x v:值]` | 直写 |
| select / radio / checkbox | `[upd id:x v:key]`(多选 `v:"a,c"` 覆盖) | 选中项 |
| datepicker(range) | `v:2024-06-01` / `"起 ~ 止"` | 写入+面板重定位 |
| time/datetimepicker | `v:"09:30"` / `"2024-06-01 09:30"` | 写入+状态重解析 |
| cascader | `v:"gd/gz"` | 路径合法才写(非法静默) |
| transfer | `v:"1,2"` | 右栏按序重排+清勾选 |
| upload | `act:fill files:"名,url,大小\|…"` | 回显可删 |
| 通用 | `dis:true/false` | radio 整组/transfer 钮/picker 同步 |

reset 按钮对 cascader/日历时件/transfer/upload 全部按初始值复原(tokuireset 契约)。
