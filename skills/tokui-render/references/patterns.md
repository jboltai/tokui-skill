# 布局模式与 grid/cell 完整参考

## grid/cell(二维不对称布局;一维等分用 row/col,不要混用)

**grid 属性**(值白名单校验,非法整体不输出):
- `cols`:N(1-24 等分)· `auto:180px`(自适应卡片墙)· 轨道串 `"200px 1fr 1fr"`
- `rows`:行轨道,可省(省略 = 自动行,**不定高内容必须省略**)
- `areas`:`"nav main main|nav aside aside"`(`|` 分行、空格分列、`.` 空位)
- `gap/gx/gy` 间距 · `h/minh` 高 · `theme:dark/modern/modern-dark`(子树级主题,stat/chart/btn 全跟随)· `v:dense/flush`

**cell 属性**:`area` 区域名 · `c` 列跨 N 或 `"1/3"` · `r` 行跨 · `align/justify` start/center/end/stretch。无需跨区时子组件直接作 grid 子项。

**陷阱**:rows/h 定死后内容超高溢出盖相邻区(chart 的 h 只是 viewBox 高,宽 cell 内实际更高);薄轨(<100px)不放 card。

```
[grid cols:"200px 1fr 1fr" rows:"64px 1fr" gap:12 h:480 areas:"nav main main|nav aside aside"]
[cell area:nav][card tt:导航][list][item 仪表盘][item 订单][/list][/card][/cell]
[cell area:main][card tt:主内容][p 两列宽主区域][/card][/cell]
[cell area:aside][card tt:侧栏][p 辅助信息][/card][/cell]
[/grid]
```

## 模式一:数据看板(多指标 + 趋势 + 明细)

```tokui
[card tt:"运营总览"]
[row]
[col span:6][stat tt:"GMV(万元)" v:1280.5 pre:¥ trend:up anim:1200 dec:1][/col]
[col span:6][stat tt:"订单量" v:8542 trend:up anim:1200][/col]
[/row]
[row]
[col span:8][chart t:line tt:"近 6 日 GMV" smooth vals l:"周一,周二,周三,周四,周五,周六" d:"820,932,901,1290,1130,1420"][/col]
[col span:4][chart t:donut tt:"渠道占比" v:总额 l:"线上,线下,团购" d:"620,310,180"][/col]
[/row]
[ft tx:"数据来源:订单系统,每日更新"]
[/card]
```

## 模式二:详情页(desc 描述列表 + 时间轴)

```tokui
[card tt:"候选人档案"]
[desc cols:2]
[item l:姓名 tx:张三]
[item l:工作年限 tx:8 年]
[item l:"期望薪资" tx:"¥35,000/月"]
[item l:状态 tx:面试中]
[/desc]
[timeline]
[ti tm:"2026-08-01" t:success tt:"简历初筛通过" 岗位匹配度高,进入技术评估]
[ti tm:"2026-08-10" t:primary tt:"一面 · 技术面" 算法与工程实现双过关,评价积极]
[/timeline]
[/card]
```

> ti 是自闭合组件:正文写在开标签属性后(同标签一行),严禁 `[/ti]` 和独立正文行;tm/tt 含空格必须双引号。长正文(多段/含列表)不适合 ti——改用 timeline 只放节点标题,详细内容用下方 `[card]`/`[list]` 展开。

## 模式三:表单 + DSL 校验

```tokui
[card tt:"创建账号"]
[form id:reg sub:formSubmit]
[input n:email l:"邮箱" ph:"name@example.com" rule:"required|email"]
[input n:code l:"验证码" rule:"required|len:6" msg:"请输入 6 位验证码"]
[select n:city l:城市 rule:required opt:"bj:北京;sh:上海"]
[checkbox l:同意服务协议 n:agree req]
[btn tx:提交 v:primary sub:formSubmit]
[btn tx:重置 reset]
[/form]
[/card]
```

> 提交/重置按钮直接放 form 内(勿用 `[ft]`,它是 card 页脚);提交必须 `sub:`(走原生校验,表单数据以用户消息回传),重置用裸 `reset`(前端清空,不发消息);同一标签严禁两个 `opt:`。

## 模式四:明细表(操作列 + 汇总)

```tokui
[card tt:"订单明细"]
[table stripe bordered]
[thead cols:"#,订单号,客户,金额/r/danger,状态,操作"]
[tbody]
[tr ,ORD-001,星辰,¥2,688.00,tag:已发货 t:success,btn:查看 v:primary clk:fillSubmit data-prompt:查看:ORD-001|btn:删除 v:danger clk:fillSubmit data-prompt:删除:ORD-001]
[tr ,ORD-002,字节,¥1,280.00,tag:待付款 t:warning,btn:查看 v:primary clk:fillSubmit data-prompt:查看:ORD-002]
[tr "合计 ¥3,968.00=c6" v:total]
[/tbody]
[/table]
[/card]
```

## 模式五:数据大屏(fit-screen + screen-header + grid areas)

铁律(违反即底行被裁/内容叠压,均由真实 bug 沉淀):

1. **整页大屏以 `[screen-header]` 开头**(自闭合,渐变标题+时钟+LIVE),替代裸 `h1 v:gradient`;首行高度=header 的 h(默认 92px)。
2. **fit-screen 内的 grid 必带 `h:100%`**——缺省时 fr 行按内容解析,总高超设计稿后底行被画布裁剪。
3. **rows「px 定头尾 + 1fr 弹性中段」**,行高按内容预算:裸 kpi 单排 110~130px;panel 包 kpi(标题头 40px)单排 ≥150px、2×2 ≥310px;**panel tt 与 kpi tt 勿重复**(双标题白耗 40px)。
4. **定高格内禁用 `[row][col span]` 页面栅格**——用嵌套 `[grid cols:N]`;定高行内容一律包 `[panel]` 或嵌套 grid(自带裁剪;超高内容会被裁在本格,不叠压邻区)。
5. **定高格内 chart 可省 w/h**——库自动按格位纵横比重绘铺满(显式 w/h 纵横比不符时也自适应;map 画布固定除外)。
6. **kpi 状态色走 `t:primary/danger/success/warning`**——`v:` 只放数值(写 `v:warn` 会把字面量当数值显示);`pct:N` 加底部完成度光条。
7. 窄容器(对话流)用 `mode:width`,全屏画布才 `mode:scale`;theme 只挂 grid 一处子树继承——**theme:tech 自动获得屏幕级氛围(光晕/网格/暗角/辉光),勿再手写 style 深色背景**。
8. **选型**:排行榜用 `[rank-list]`(奖牌位),滚动明细用 `[scrollboard]`(胶囊格 `tag:类型:文本`);趋势对比用 `[chart t:combo]`(柱 d+线 d2 双轴)勿拆两图;地图 `topn:5` 自动区域 TOP 榜。

```
[fit-screen w:1920 h:1080 mode:scale]
[grid cols:"480px 1fr 400px" rows:"92px 156px 1fr 300px" gap:12 h:100% areas:"head head head|kpi kpi kpi|map rank rank|trend trend trend" theme:tech]
[cell area:head][screen-header tt:"生产运营指挥中心" sub:"OPERATIONS · REAL-TIME" lft:"数据源 MES" clock live][/cell]
[cell area:kpi][grid cols:4 h:100%]
[cell][panel v:corner][kpi tt:总产量 v:12846 unit:件 trend:12.4 pct:78 icon:trending-up][/panel][/cell]
[cell][panel v:corner][kpi tt:告警 v:7 unit:件 trend:-3 t:danger icon:bell][/panel][/cell]
[/grid][/cell]
[cell area:map][panel tt:区域分布 v:"corner,scan" sub:GEO][chart t:map region:"浙江:86|江苏:74" unit:% topn:5][/panel][/cell]
[cell area:rank][panel tt:产线龙虎榜 v:glow sub:RANKING][rank-list rows:"陈亦然,一班,486|林思远,二班,432|赵沐阳,三班,398|周清和,一班,361" unit:件 top:3 av][/panel][/cell]
[cell area:trend][panel tt:"产量与环比" v:glow][chart t:combo l:"1月,2月,3月,4月,5月,6月" d:"820,640,1080,1260,1150,1420" d2:"12.4,8.6,15.2,9.1,4.2,10.8" n1:产量 n2:环比 y2:% smooth][/panel][/cell]
[/grid]
[/fit-screen]
```

## 模式六:后台应用壳(page 三件套 + 多页签)

管理后台/CRUD 整页优先 page 壳而非手拼 grid——结构语义化,自带侧栏折叠(240⇄64)、主区自滚动裁剪、面包屑联动。铁律:

1. **page 直系子元素只写三件套** page-header / page-sidebar / page-content——游离子元素 CSS 兜底落主区,多件会互相重叠。
2. header 的 `bc:"首页,系统,用户"` 是逗号分级面包屑(末项自动当前页);右侧动作(btn 等)直接作 header 子节点,无需额外容器。
3. sidebar 主体放 `[menu act:键]`,菜单项 `id:` 即 key;`change` 载荷 `{value,item,path}`(path 标题路径数组),一条 `[upd id:headerId bc:新路径]` 即同步面包屑。
4. 主区多页签 `[page-tabs act:key]`:子项 `[page-tab n:key tt:标题 closeable]`;点击上报 change、× 上报 close、`[upd id:tabsId act:key]` 静默切换、`[del id:tabId]` 整签移除;`dis` 页签不参与激活回落。
5. 外层容器有确定高度时 page 自动铺满;对话流内嵌按内容自然高,主区超高自滚动。

```
[page w:240]
[page-header tt:用户管理 bc:"首页,系统,用户" sticky id:ph][btn t:primary 新增用户 clk:add][/page-header]
[page-sidebar tt:运营后台]
[menu act:users][menu-item tx:用户管理 i:👥 id:users][menu-item tx:角色权限 i:🔐 id:roles][/menu]
[/page-sidebar]
[page-content]
[page-tabs act:list id:tabs]
[page-tab n:list tt:用户列表][table stripe][thead cols:"姓名,部门,状态"][tr 张三,技术部,在职][tr 李四,市场部,在职][/table][/page-tab]
[page-tab n:stat tt:统计概览 closeable][kpi tt:总用户 v:1286 unit:人 icon:user][/page-tab]
[/page-tabs]
[/page-content]
[/page]
```
