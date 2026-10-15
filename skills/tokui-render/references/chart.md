# chart 完整参考(22 种,纯 SVG 零依赖)

**属性顺序铁律:`t 类型 → 样式/布局 → l 标签 → 数据`**(违反则流式预览翻转)。

## 通用属性

| 属性 | 含义 |
|---|---|
| `t` | 图表类型(恒首):bar line area pie donut rose funnel radar scatter bubble heatmap histogram waterfall boxplot treemap sankey candlestick progress gauge gantt map combo |
| `tt` | 标题 |
| `d` | 数据(格式见下表) |
| `l` | 标签(数量必须 = 数据点/类别数) |
| `c` | 颜色序列(逗号分隔;heatmap 当色阶 stops) |
| `w` `h` | SVG 宽/高(仅内部坐标系比例) |
| `v` | 单值(gauge/progress/donut 中心文字) |
| `vals` | 柱/线显数值(**≥20 点禁用**,会糊成一团,让用户拖缩放看 tooltip) · `area` 填充 · `smooth` 平滑 · `stack` 堆叠 · `orient:h` 横柱 |
| `xl` `yl` `sl` | X/Y/第三维轴名 · `xmin/xmax/ymin/ymax` 锁轴(scatter/bubble) |
| `interval` | X 轴密度:auto(默认)/0 全显/N 步长(保留首末) |
| `zoom` | dataZoom:auto(>30 点自动)/N/on/off;支持 纵向bar/line/area/boxplot/candlestick,横柱 orient:h 与 histogram 不支持 |

## 数据格式 d 速查

| 类型 | d 格式 | 例 |
|---|---|---|
| bar line area radar | 多系列`\|`、点`,` | `d:"10,20,30\|15,25,35"` |
| combo | 柱 `d`、线 `d2`(双轴) | `d:"820,640,980" d2:"12.4,8.6,15.2"` |
| pie donut(单环) rose funnel waterfall histogram | 单系列`,` | `d:"10,20,30"` |
| donut 多环 | 环`\|`、点`,` | `d:"40,30\|35,25"` |
| scatter | 点`;`、坐标`,` | `d:"1,2;3,5"` |
| bubble | 点`;`、x,y,size`,` | `d:"1,2,5;3,4,10"` |
| boxplot | 组`;`、五数`,`(min,Q1,中,Q3,max) | `d:"1,3,5,7,9;2,4,6,8,10"` |
| candlestick | 根`;`、OHLC`,` | `d:"10,12,8,11;11,13,9,10"` |
| heatmap | `rows` 属性:行`\|`、列`,` | `rows:"1,2,3\|4,5,6"` + `cols` 列标签 + `l` 行标签 |
| treemap | `名:值`,` | `d:"A:100,B:60"` |
| sankey | `flows` 属性:`源->目标:值`,` | `flows:"A->B:10,B->C:5"` |
| gauge progress | `v` 单值 | `v:72` |

## 各类型要点

- **bar**:`stack orient:h vals ymax`;横柱高度按类别数自动(约 26px/类,200-1200 封顶),**无需手设 `h`**(显式 `h` 原样优先)。
- **pie/donut/rose**:`l` 各项名;donut `v` 中心文字;数值差异大用 rose。
- **funnel**:数据降序(首层=漏斗口),自动标相对转化率。
- **radar**:多系列 `|` 对比。
- **scatter/bubble**:`xl/yl`(bubble 加 `sl`)+ 四向锁轴防流式跳点。
- **heatmap**:`rows` 矩阵 + `cols` 列标签 + `l` 行标签(须匹配)+ `vmin/vmax` + `c` 色阶。
- **histogram**:`d` 原始值序列(前端分箱);`bins` 箱数须 = `l` 段数;`l` 范围段标签(`40-50,...,90-100` 自动锁);显式 `min`/`max` 锁值域、`ymax` 锁频次轴(流式防已画柱高跳)。
- **waterfall**:`d` 带符号增减;`c` 前 2 个为正/负色。
- **candlestick**:`l` 日期;`c` 阳/阴色(默认红涨绿跌)。
- **treemap/sankey**:`c` 配色;sankey `nodes` 可省(从 flows 提)。
- **map(中国地图)**:不用 `d` 轴系/`l`——见下方专节;地域分布/区域指标首选。

## map 中国地图(地域分布首选)

不用 `d`/`l` 轴系。**两层独立数据面可同图叠加**:

| 属性 | 含义 |
|---|---|
| `region` | 省级 choropleth 热力:`region:"浙江:86|江苏:74"`(34 省级行政区含港澳台;省名简称 `浙江`/全名 `浙江省` 均可;值经 蓝→青→绿→黄→红 色阶) |
| `d` | 城市散点层:`d:"120.15,30.28,88,name:杭州"`(经度,纬度,值,名称;值对数映射半径,越界自动钳制;**值 TOP12 自动涟漪扩散**,`ripple:off` 关闭) |
| `vmin` `vmax` | 锁定色阶域(缺省用数据 min/max) |
| `topn` | `topn:5` 左下自动生成区域 TOP-N 迷你榜(省名+比例条+数值,与色阶同源;0/不写=关) |
| `label` | 标注三档:`full`(默认,含数据省 名+值 两行/无数据省灰名/碰撞自动避让) · `name`(仅含数据省显名) · `off`(纯色块,大屏窄卡) |
| `unit` | 单位(≤8 字符):tooltip/色阶刻度/半径图例共用,如 `unit:"%"` |
| `on` | `on:"mapClick:handler"` 点击含数据省份上报 `{province,value}`(大屏下钻) |

交互默认开:hover 省份/散点多行 tooltip(省名/值+单位+占比)+ 高亮描边压暗其余;图内自带 左下 visualMap 色阶条(仅散点时换半径图例)+ 右下南海诸岛小图(九段线+四大群岛)。与 `region` 同图可再叠 `d` 散点。

```
[chart t:map tt:"区域稼动率(%)" region:"浙江:86|江苏:74|广东:92" d:"116.4,39.9,120,name:北京|121.47,31.23,110,name:上海" unit:"%" vmin:0 vmax:100 topn:5]
[chart t:map region:"北京:78|上海:88" label:off w:360]   ← label:off 大屏窄卡
```

## combo 双轴组合图(柱+线,趋势面板标配)

`d` 柱序列(左轴,渐变填充)· `d2` 折线序列(右轴,适合百分比/增速)· `n1`/`n2` 系列名(进图例/tooltip)· `y2` 右轴单位 · `smooth` 平滑 · `vals` 数值标签。缺 `d2` 退化为纯柱不炸。**金额+增速/量+率双轴对比必用 combo,勿拆两张图**。

```
[chart t:combo tt:"业绩趋势与回款" l:"1月,2月,3月,4月,5月,6月" d:"820,640,1080,1260,1150,1420" d2:"12.4,8.6,15.2,9.1,4.2,10.8" n1:新签金额 n2:环比增速 y2:% smooth]
```

## gauge 仪表盘

`v`(必填)· `max/min`(100/0)· `u` 单位(0-100 自动 %)· `dec` 小数位 · `range` 180/270/360 · `status` success/warning/danger/info 染弧 · `zones:"60,85"` 阈值分段 + `zc` 段色 · `ticks` 刻度(6)· `l` 指标名 · `sub` 副标题 · `anim` 动画。

```
[chart t:gauge tt:CPU使用率 status:warning sub:"数据来源:监控" l:8核均值 v:72]
[chart t:gauge tt:达标率 zones:"60,85" anim:1200 sub:"红线85%" l:Q2目标 v:92]
```

## gantt 甘特图(不用 d/l)

- `tasks:"名称,开始,结束[,进度[,组号]]"` 多条 `|` 分隔;组号必须配 `gnames:"组名|组名"`。
- `deps:"0->1,1->2"`(finish→start,索引 0 起);`ms:"里程碑,时间[,组]"` 菱形。
- `mode:days`(数字天数,默认)/`dates`(`2026-06-15`,自动画今天线)。
- task 名严禁含空格/逗号/`|`。

```
[chart t:gantt tt:V2.0排期 w:720 tasks:"需求,1,3,100,0|设计,3,5,100,0|开发,5,14,60,1|测试,14,18,0,2" ms:"评审,5,0|上线,18,2" gnames:"设计|开发|测试" deps:"0->1,1->2,2->3"]
```

## 容器模式(流式逐点喂入,无 d/tasks/rows/flows/v 时)

子节点:`pt v:x`(点图)· `hrow v:"1,2,3"`(heatmap 行)· `flow v:"A->B:10"` · `task v:"名,起,止,进度,组"` · `ms v:"名,时间,组"`。

```
[chart t:bar tt:日产量 vals l:"Mon,Tue,Wed,Thu,Fri"]
[pt v:10][pt v:24][pt v:18][pt v:30][pt v:22]
[/chart]
```

自闭合(`d:`)与容器模式都支持;点少用自闭合,点多/gantt 复杂用容器。
