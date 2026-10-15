// Self-contained TokUI DSL validator — zero dependencies.
// Catches the documented high-frequency failure modes from TOKUI_DSL_REFERENCE.md §0.
import {
  ALL_NAMES, CONTAINERS, RAW_CONTAINERS, BOOLEAN_ATTRS,
  VARIANTS, MANUAL_VARIANTS, CHART_TYPES,
} from "./component-data.mjs";

const TX_ESCAPE_EXCEPTIONS = new Set(["tn", "popover", "input-tag", "watermark", "badge-box"]);

// cols 触发自闭合的豁免(镜像 parser hasColsTrigger):这些容器里 cols 是布局/数据属性,不触发自闭合
const COLS_EXEMPT = new Set(["desc", "suggestions", "chart", "masonry", "grid", "scrollboard", "form"]); // form cols=T2.2 布局属性(镜像 parser)
// cols 是其合法属性的容器(其余容器带 cols: = 属性臆造 + 意外自闭合)
const COLS_LEGIT = new Set(["thead", "desc", "suggestions", "chart", "masonry", "grid", "scrollboard", "form"]);

// 「裸正文」组件的已知属性键:正文里的「英文:值」前缀会被 parser 当属性吞掉(正文丢句)。
// 仅对这些正文通道组件检查;id/on/clk/sub/data-* 通用放行。
const BARE_TEXT_ATTR_KEYS = (() => {
  const m = new Map();
  for (const h of ["h1", "h2", "h3", "h4", "h5", "h6"]) m.set(h, new Set(["v", "tx", "id", "bg", "fc"]));
  m.set("p", new Set(["v", "tx", "id"]));
  m.set("item", new Set(["v", "tx", "id", "l", "span", "s", "shortcut"]));
  m.set("ti", new Set(["t", "tt", "tm", "id"]));
  m.set("step", new Set(["tt", "status", "id"]));
  for (const t of ["b", "strong", "em", "mark", "sub", "sup"]) m.set(t, new Set(["id"]));
  m.set("kbd", new Set(["v", "tx", "id"]));
  m.set("dv", new Set(["v", "tx", "id", "vert", "align", "bg", "th", "plain"]));
  return m;
})();
const BARE_TEXT_PASS_KEYS = new Set(["on", "clk", "sub", "cls", "style"]);

// cls:/style: 样式定制通道(T0.1)——与渲染器 src/core/style-guard.js 同规则,
// 提前拦截「会被静默丢弃」的写法(渲染不报错,但定制意图落空)。
const CLS_TOKEN_RE = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;
const STYLE_BANNED_PROPS = new Set(["position", "top", "left", "right", "bottom"]);
const STYLE_BANNED_VALUE = /(expression\s*\(|javascript\s*:|vbscript\s*:|-moz-binding|behavior\s*:|@import)/i;
const STYLE_URL_OK = /url\(\s*(['"]?)(https?:\/\/|\/|\.\.?\/)/i;
const TRANSFORM_FN_RE = /^(translate[x-z]?|scale[x-z]?|rotate[x-z]?)$/;

// 断点属性校验(T0.3)：col 的 xs/sm/md/lg/xl 值须 span 1-12(或 span/offset)；grid 的须列数 1-12
// 命名撞车豁免：chart 的 xl/yl/sl 是轴名(appendAxisUnit 渲染轴标题)、avatar 的 sm/md/lg/xl 是
// 尺寸档——这些组件上的同名属性不是断点，校验会产生误报(MES 大屏 xl:"时刻" 教训)。
const BP_ATTR_EXEMPT = new Set(["chart", "avatar"]);
function checkBreakpoints(name, attrs, line, warnings) {
  if (BP_ATTR_EXEMPT.has(name)) return;
  for (const a of attrs) {
    const ci = a.indexOf(":");
    if (ci === -1) continue;
    const key = a.slice(0, ci);
    if (!/^(xs|sm|md|lg|xl)$/.test(key)) continue;
    let val = a.slice(ci + 1);
    if (val.length >= 2 && val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    const parts = val.split("/");
    const span = parseInt(parts[0], 10);
    const isGrid = name === "grid";
    if (isNaN(span) || span < 1 || span > 12) {
      warnings.push({ line, msg: `[${name}] 断点 ${key}:${val} 非法——值须 1-12${isGrid ? "(列数)" : "(span)"},该档会被静默丢弃` });
      continue;
    }
    if (!isGrid && parts.length > 1) {
      const off = parseInt(parts[1], 10);
      if (isNaN(off) || off < 1 || off > 11) {
        warnings.push({ line, msg: `[${name}] 断点 ${key} offset=${parts[1]} 非法——offset 须 1-11,该档 offset 会被静默丢弃` });
      }
    }
  }
}

function checkStyleChannel(name, attrs, line, warnings) {
  for (const a of attrs) {
    const ci = a.indexOf(":");
    if (ci === -1) continue;
    const key = a.slice(0, ci);
    let val = a.slice(ci + 1);
    if (key !== "cls" && key !== "style") continue;
    if (val.length >= 2 && val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (key === "cls") {
      for (const tok of val.split(/\s+/).filter(Boolean)) {
        if (tok.toLowerCase().startsWith("tokui-")) {
          warnings.push({ line, msg: `[${name}] cls:${tok} —— tokui- 前缀是框架保留字,该类名会被渲染器静默丢弃;换业务前缀(如 my-${tok.slice(6)})` });
        } else if (!CLS_TOKEN_RE.test(tok)) {
          warnings.push({ line, msg: `[${name}] cls:${tok} —— 类名须字母开头、仅字母数字_-、≤64 字符,否则被静默丢弃` });
        }
      }
    } else {
      for (const decl of val.split(";")) {
        const d = decl.indexOf(":");
        if (d === -1) continue;
        const prop = decl.slice(0, d).trim().toLowerCase();
        const v = decl.slice(d + 1).trim();
        if (STYLE_BANNED_PROPS.has(prop)) {
          warnings.push({ line, msg: `[${name}] style:${prop} —— 不在白名单(position/top/left/right/bottom 属布局逃逸),该声明会被静默丢弃` });
        } else if (STYLE_BANNED_VALUE.test(v)) {
          warnings.push({ line, msg: `[${name}] style:${prop} 值含注入片段 —— 渲染器静默丢弃该声明(expression()/javascript:/behavior:/@import)` });
        } else if (/\burl\s*\(/i.test(v) && !STYLE_URL_OK.test(v)) {
          warnings.push({ line, msg: `[${name}] style:${prop} 的 url() 源非法 —— 仅放行 http(s) 与站内相对路径(/x、./x、../x),data:/ftp: 被静默丢弃` });
        } else if (prop === "transform") {
          const fns = v.match(/[a-zA-Z]+[-a-zA-Z]*\s*\(/g) || [];
          for (const fn of fns) {
            const fname = fn.replace(/\s*\($/, "").toLowerCase();
            if (!TRANSFORM_FN_RE.test(fname)) {
              warnings.push({ line, msg: `[${name}] style:transform 含 ${fname}() —— 仅放行 translate/scale/rotate 函数族,该声明会被静默丢弃` });
              break;
            }
          }
        }
      }
    }
  }
}

// l 标签数可与 d 数据点数对账的图表类型(逐点/逐项对应)
const CHART_COUNTABLE = new Set(["bar", "line", "area", "pie", "donut", "rose", "funnel", "radar", "waterfall"]);

// —— 事件通道校验(724d0cd:data-* 透传 + clk:/sub:/on: "?k=v" 内联参数) ——
// 镜像 event-bus.parseHandlerRef / renderer.parseOnSpec:'?' 后按 '&' 分段、段内首个 '=' 分
// k/v(值 URL decode,空格写 %20),无 '=' 段=布尔 true;键为空或 __proto__/constructor/
// prototype(解码后)被静默跳过;on: 的参数段禁裸 ','(split 在 decode 前,拆断事件对)与 ':'。
const HANDLER_NAME_RE = /^[\w-]+$/;
const HANDLER_PARAM_KEY_BLACKLIST = new Set(["__proto__", "constructor", "prototype"]);

function warnHandlerParamKeys(name, channel, query, line, warnings) {
  for (const seg of query.split("&")) {
    if (!seg) continue;
    const eq = seg.indexOf("=");
    const rawKey = eq === -1 ? seg : seg.slice(0, eq);
    let key = rawKey;
    try { key = decodeURIComponent(rawKey); } catch { /* 解码失败保留原串,与渲染器一致 */ }
    if (!key || HANDLER_PARAM_KEY_BLACKLIST.has(key)) {
      warnings.push({
        line,
        msg: `[${name}] ${channel}: 内联参数键 "${rawKey}" ${key ? "属原型污染键(__proto__/constructor/prototype)" : "为空"}——渲染器静默跳过该参数,换业务键名`,
      });
    }
  }
}

function checkEventChannels(name, attrs, line, errors, warnings) {
  // data-tokui-*:框架内部印章命名空间(clk/sub/act/tag),渲染器拒透传——防 DSL 伪造印章劫持事件分发
  for (const a of attrs) {
    if (/^data-tokui-/.test(a)) {
      warnings.push({
        line,
        msg: `[${name}] ${a.split(":", 1)[0]} —— data-tokui-* 是框架内部命名空间(clk/sub/act 印章),渲染器拒绝透传、属性白写;业务数据键换前缀(如 data-id),轻量上下文改 clk:"h?k=v" 内联参数`,
      });
    }
  }
  // clk:/sub: 处理器内联参数
  for (const channel of ["clk", "sub"]) {
    const v = attrValue(attrs, channel);
    if (typeof v !== "string" || !v.includes("?")) continue;
    const qi = v.indexOf("?");
    const handler = v.slice(0, qi);
    const query = v.slice(qi + 1);
    if (!HANDLER_NAME_RE.test(handler)) {
      errors.push({
        line,
        msg: `[${name}] ${channel}:"${v}" 的处理器名 "${handler}" 非法——'?' 前必须是处理器名(如 ${channel}:"onDel?id=1"),空名/特殊字符会找不到 handler、点击无响应`,
      });
    }
    if (!query) {
      warnings.push({ line, msg: `[${name}] ${channel}:"${v}" 的 '?' 后为空——要么去掉 '?',要么补参数(如 ?id=1)` });
    } else {
      warnHandlerParamKeys(name, channel, query, line, warnings);
    }
  }
  // on:"事件:处理器,…" 事件对(处理器可带 ?参数)
  const onV = attrValue(attrs, "on");
  if (typeof onV === "string" && onV) {
    const pairs = onV.split(",");
    pairs.forEach((pair, i) => {
      const idx = pair.indexOf(":");
      if (idx <= 0) {
        // 无 ':' 的残段:若前一对的处理器带 '?',是参数值裸逗号拆断的残骸
        const prevHandler = i > 0 ? (pairs[i - 1].split(":").pop() || "") : "";
        if (prevHandler.includes("?")) {
          warnings.push({
            line,
            msg: `[${name}] on: 参数值含裸英文逗号(残段 "${pair.trim()}")——',' 是事件对分隔符,会把参数值拆断、残段被丢弃;值里逗号写 %2C`,
          });
        }
        return;
      }
      const h = pair.slice(idx + 1).trim();
      const qi = h.indexOf("?");
      if (qi === -1) return;
      const handler = h.slice(0, qi);
      const query = h.slice(qi + 1);
      if (!HANDLER_NAME_RE.test(handler)) {
        errors.push({
          line,
          msg: `[${name}] on:"${pair.trim()}" 的处理器名 "${handler}" 非法——'?' 前必须是处理器名(如 change:onKw?src=x)`,
        });
      }
      if (!query) {
        warnings.push({ line, msg: `[${name}] on:"${pair.trim()}" 的 '?' 后为空——要么去掉 '?',要么补参数` });
        return;
      }
      if (/[,:]/.test(query)) {
        warnings.push({
          line,
          msg: `[${name}] on:"${pair.trim()}" 的参数段含裸 ',' 或 ':'——渲染器在 decode 前按 ',' 分事件对、参数段禁 ':',该事件对会被整段静默丢弃;逗号写 %2C、冒号写 %3A`,
        });
      }
      warnHandlerParamKeys(name, "on", query, line, warnings);
    });
  }
}

// p/h1-h6/btn 正文首词若是这些裸变体词 → 渲染成正文乱码(tokui-prompt 铁律:变体必须 v: 前缀)
const BARE_VARIANT_WORDS = new Set(
  "muted primary center bold left right danger success warning info ghost flat highlight sm lg pill block underline".split(" "),
);

/** Scan a tag body starting at dsl[i] === '['. Returns { inner, name, isClose, end } or null. */
function scanTag(dsl, i) {
  let j = i + 1;
  // tr 专用深度感知(镜像 parser findTrCloseBracket):tr 单元格可含 [btn]/[img]/[dot] 等
  // 内联组件(其内层 ] 不能误关 tr);其余标签仍首个未引号 ] 即闭合(与 parser 一致)。
  const isTr = /^tr\b/.test(dsl.slice(j, j + 8));
  let inner = "";
  let inQuote = false;
  let depth = 0;
  while (j < dsl.length) {
    const ch = dsl[j];
    if (ch === '"') { inQuote = !inQuote; inner += ch; j++; continue; }
    if (!inQuote && isTr && ch === "[") { depth++; inner += ch; j++; continue; }
    if (!inQuote && isTr && ch === "]" && depth > 0) { depth--; inner += ch; j++; continue; }
    if (ch === "]" && !inQuote) return { inner, end: j + 1 };
    inner += ch;
    j++;
  }
  return null; // unterminated tag
}

/** 镜像 TokUI parseTag 的 tr 简写格判定:token 的最后一个逗号段以 btn:/tag:/progress 开头
 *  或为 [ 开头的方括号内联组件格即开启(裸 token 仅当为行内容首 token 时才算格开头,格内续词不算);
 *  整段引号包裹的 token 不开启(引号内已是完整内容,后续仍可写行级属性)。 */
function trTokenOpensActionCell(token, isFirstContentToken) {
  const lastSeg = token.slice(token.lastIndexOf(",") + 1);
  const opensCell = /^(btn|tag|progress)\b/.test(lastSeg) || lastSeg.charAt(0) === "[";
  if (token.indexOf(",") !== -1) return opensCell;
  return isFirstContentToken && opensCell;
}

/** Split tag inner into: name + attr tokens + content. Quote-aware. */
function parseInner(inner) {
  const tokens = [];
  let buf = "";
  let inQuote = false;
  for (const ch of inner) {
    if (ch === '"') { inQuote = !inQuote; buf += ch; continue; }
    if (/\s/.test(ch) && !inQuote) { if (buf) { tokens.push(buf); buf = ""; } continue; }
    buf += ch;
  }
  if (buf) tokens.push(buf);
  if (!tokens.length) return { name: "", attrs: [], content: "", rest: [] };
  const name = tokens[0];
  const rest = tokens.slice(1);
  // tr 专属:镜像 parseTag 的简写格归位——btn:/tag:/progress 格开启后,
  // 其空格子属性(icon:/l:/v:/clk:/t:… 及 | 续钮)归单元格内容而非行级属性。
  if (name === "tr") {
    const attrs = [];
    const contentParts = [];
    const swallowedRowAttrs = [];
    let inActionCell = false;
    for (const t of rest) {
      if (inActionCell) {
        if (/^(id|pid):/.test(t)) swallowedRowAttrs.push(t);
        contentParts.push(t);
        continue;
      }
      // btn:/tag:/progress 不是 tr 的行级属性——attr 形态 token 是单列简写格开头,归内容并激活
      if (/^(btn|tag|progress):/.test(t)) {
        contentParts.push(t);
        inActionCell = true;
        continue;
      }
      const isAttr = !t.startsWith('"') && /^[a-zA-Z][a-zA-Z0-9_-]*:/.test(t);
      if (isAttr) { attrs.push(t); continue; }
      contentParts.push(t);
      if (!/^"[^"]*"$/.test(t) && trTokenOpensActionCell(t, contentParts.length === 1)) inActionCell = true;
    }
    return { name, attrs, content: contentParts.join(" "), rest, trSwallowedRowAttrs: swallowedRowAttrs };
  }
  const attrs = rest.filter((t) => !t.startsWith('"') && /^[a-zA-Z][a-zA-Z0-9_-]*:/.test(t));
  const contentish = rest.filter((t) => !attrs.includes(t));
  return { name, attrs, content: contentish.join(" "), rest };
}

function attrValue(attrs, key) {
  const token = attrs.find((a) => a === key || a.startsWith(key + ":"));
  if (!token) return undefined;
  if (token === key) return ""; // boolean attr
  const raw = token.slice(key.length + 1);
  return raw.replace(/^"|"$/g, "");
}

function attrPos(attrs, predicate) {
  return attrs.findIndex(predicate);
}

function lineOf(dsl, index) {
  let line = 1;
  for (let k = 0; k < index && k < dsl.length; k++) if (dsl[k] === "\n") line++;
  return line;
}

// —— 表格列数校验:镜像 TokUI table.js 的 splitCellsDepthAware / parseSpanModifier / thead 解析 ——

const CURRENCY_RE = /[¥￥$€£₩₹]/;

/** 千分位逗号不切格:当前格含货币符号(任意位置)+ 前 1-3 位数字 + 后恰好 3 位数字且第 4 位非数字;
 *  当前格以 =cN/=rN 合并后缀结尾时恒切(与渲染器一致)。 */
function isThousandsComma(s, i, cur) {
  const digit = (c) => c >= "0" && c <= "9";
  const prev = s[i - 1], n1 = s[i + 1], n2 = s[i + 2], n3 = s[i + 3], n4 = s[i + 4];
  const isMergeSuffix = /=([cr]\d+){1,2}$/.test(cur);
  return !isMergeSuffix && CURRENCY_RE.test(cur) && digit(prev)
    && digit(n1) && digit(n2) && digit(n3) && !digit(n4);
}

/** tr 单元格切分(镜像渲染器):parser 层会把 \" 反转义成裸引号,先归一化;
 *  整行外层引号仅当首尾各一个且中间无裸引号时剥离;引号内/[ ]深度内逗号不切。 */
function splitTrCells(content) {
  const ESC = "\u0001";
  let s = content.trim().replace(/\\"/g, ESC);
  if (s.length > 1 && s[0] === '"' && s[s.length - 1] === '"' && s.indexOf('"', 1) === s.length - 1) {
    s = s.slice(1, -1);
  }
  s = s.replace(new RegExp(ESC, "g"), '"');
  const out = [];
  let cur = "";
  let inQ = false;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (inQ) { cur += ch; continue; }
    if (ch === "[") { depth++; cur += ch; continue; }
    if (ch === "]") { depth--; cur += ch; continue; }
    if (ch === "," && depth === 0) {
      if (isThousandsComma(s, i, cur)) { cur += ch; continue; }
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

/** 尾缀 =cN/=rN/=c2r2 的跨列/跨行数(严格尾缀,=v2/=x=2 不误判)。 */
function parseSpan(cell) {
  const m = cell.match(/=([cr]\d+){1,2}$/);
  if (!m) return { colspan: 1, rowspan: 1 };
  const cm = m[0].match(/c(\d+)/);
  const rm = m[0].match(/r(\d+)/);
  return { colspan: cm ? parseInt(cm[1], 10) || 1 : 1, rowspan: rm ? parseInt(rm[1], 10) || 1 : 1 };
}

/** thead cols 值 → 总列数(镜像渲染器:多行 `;` 取第一行、剥至多 2 段 /对齐//配色 尾缀后按 colspan 求和)。 */
function headerColumnCount(colsValue) {
  let first = colsValue.split(";")[0];
  const cells = [];
  let cur = "";
  let inQ = false;
  for (const ch of first) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { cells.push(cur); cur = ""; continue; }
    cur += ch;
  }
  cells.push(cur);
  let total = 0;
  for (let c of cells) {
    c = c.trim();
    for (let k = 0; k < 2; k++) {
      const m = c.match(/\/([A-Za-z]+)$/);
      if (!m) break;
      if (!/^(c|center|r|right|l|left|primary|success|warning|danger|info)$/.test(m[1].toLowerCase())) break;
      c = c.slice(0, m.index);
    }
    total += parseSpan(c).colspan;
  }
  return total;
}

/** tr 列数(含 =c 展开、扣除上方 =r 占列)必须 = thead 列数;短行直接左起填充 → 右侧错位。 */
function checkTrColumns(frame, parsed, line, warnings) {
  if (!frame.tableCols) return;
  const cells = splitTrCells(parsed.content);
  let slots = 0;
  const newSpans = [];
  for (const cell of cells) {
    const sp = parseSpan(cell.trim());
    slots += sp.colspan;
    if (sp.rowspan > 1) newSpans.push(sp.rowspan - 1);
  }
  const occupied = frame.pendingRowspans.filter((n) => n > 0).length;
  const expected = frame.tableCols - occupied;
  if (slots !== expected) {
    const isTotal = parsed.attrs.includes("v:total") || /合计|汇总/.test(parsed.content);
    const fullwidth = parsed.content.includes("，");
    warnings.push({
      line,
      msg: `tr 列数(含 =c 展开 ${slots})≠ 表头列数 ${expected}${occupied ? `(已扣上方 =r 占 ${occupied} 列)` : ""} —— ${fullwidth
        ? "行内有中文逗号「，」——它不切格!分隔必须英文逗号,(把分隔位置的，改成,);格内文字确需逗号才用全角"
        : isTotal
          ? "汇总行补齐:金额列在末尾写 汇总=c(金额列-1)+金额格;金额列不在末尾整行一格 =c总列数(金额并入文字,如 合计 ¥872,000=c11)"
          : "含英文逗号的文本格必须双引号包(全角，不用包);缺格补齐,多格用 =cN 跨列"}`,
    });
  }
  frame.pendingRowspans = [
    ...frame.pendingRowspans.map((n) => n - 1).filter((n) => n > 0),
    ...newSpans,
  ];
}

/** 游离词归属:按原始 token 顺序,找首个游离词及其紧邻的前一个属性——
 *  值含空格未加引号时,游离词紧跟被切开的属性(tt:今日 GMV → 属性 tt:今日 + 游离词 GMV)。 */
function splitValueHint(parsed) {
  for (let i = 0; i < parsed.rest.length; i++) {
    const tok = parsed.rest[i];
    const isAttr = !tok.startsWith('"') && /^[a-zA-Z][a-zA-Z0-9_-]*:/.test(tok);
    if (isAttr) continue;
    const prev = i > 0 ? parsed.rest[i - 1] : null;
    const prevIsAttr = prev && !prev.startsWith('"') && /^[a-zA-Z][a-zA-Z0-9_-]*:/.test(prev);
    return { word: tok.replace(/^"|"$/g, ""), attr: prevIsAttr ? prev : null };
  }
  return { word: "", attr: null };
}

/** 未闭合容器报错;card 特别强调「不会像 item 那样自动闭合」(高频泛化错误)。 */
function unclosedMsg(name, line) {
  if (name === "card") {
    return `容器 [card] 未闭合(第 ${line} 行)——card 不会像 item 那样被下一个兄弟自动闭合,后续卡片会全部嵌套进这一张;必须补 [/card]`;
  }
  if (name === "textarea") {
    return `容器 [textarea] 未闭合(第 ${line} 行)——textarea 与 input 不同,是容器:空字段也必须补 [/textarea](初值用 tx: 自闭合或写在标签之间);未闭合会吞掉后续表单控件`;
  }
  return `容器 [${name}] 未闭合(第 ${line} 行)——必须补 [/${name}]`;
}

/** Does this open container tag escape into self-closing mode? (§5 自闭合逃逸) */
function escapesSelfClosing(name, attrs, content) {
  if (attrValue(attrs, "tx") !== undefined && !TX_ESCAPE_EXCEPTIONS.has(name)) return true;
  if ((name === "radio" || name === "select" || name === "checkbox" || name === "segmented" || name === "anchor") && attrValue(attrs, "opt") !== undefined) return true;
  if (name === "checkbox" && attrValue(attrs, "opt") === undefined && attrValue(attrs, "multi") === undefined) return true;
  // cols 触发自闭合(镜像 parser):thead/desc/suggestions/chart/masonry/grid 之外,任何容器带 cols: 都自闭合
  if (attrValue(attrs, "cols") !== undefined && !COLS_EXEMPT.has(name)) return true;
  if (name === "chart") {
    if (["d", "tasks", "rows", "region", "nodes", "flows"].some((k) => attrValue(attrs, k) !== undefined)) return true; // region=地图省级热力内联载体(0.2.5)
    const t = attrValue(attrs, "t");
    if ((t === "gauge" || t === "progress") && attrValue(attrs, "v") !== undefined) return true;
  }
  // 大屏件叶用法豁免(镜像 parser 容错):kpi 带 v:/tt: 即指标卡叶子;scrollboard/rank-list 带 rows: 即简写数据源
  if (name === "kpi" && (attrValue(attrs, "v") !== undefined || attrValue(attrs, "tt") !== undefined)) return true;
  if (name === "scrollboard" && attrValue(attrs, "rows") !== undefined) return true;
  if (name === "rank-list" && attrValue(attrs, "rows") !== undefined) return true;
  if (name === "tn" && attrs.includes("leaf")) return true;
  if (name === "input-tag" && attrValue(attrs, "tags") !== undefined) return true;
  if ((name === "p" || name === "item") && content) return true; // 有正文 = 叶子(镜像渲染器)
  if (name === "katex" && attrValue(attrs, "f") !== undefined) return true;
  return false;
}

/**
 * @param {string} dsl — TokUI DSL (fences already stripped)
 * @returns {{ errors: {line:number, msg:string}[], warnings: {line:number, msg:string}[], stats: {tags:number, containers:number} }}
 */
export function lintDsl(dsl) {
  const errors = [];
  const warnings = [];
  const stats = { tags: 0, containers: 0 };
  /** @type {{name:string, line:number, attrs:string[], raw:string, id?:string, hasSubmit?:boolean}[]} */
  const stack = [];
  // 已闭合的 form(等待缺提交按钮检查);overlayIds = dialog/drawer 的 id(静态报告打不开 + act:open 检测)
  const closedForms = [];
  const overlayIds = new Set();
  const bareContainerIssues = []; // { name, line }:card/callout 裸正文,定向聚合报告
  let pendingTxCard = null;
  let i = 0;

  // 星级字符模拟(必须用 [rate])
  const starIdx = dsl.search(/[★☆][★☆]/);
  if (starIdx !== -1) {
    warnings.push({ line: lineOf(dsl, starIdx), msg: "出现连续 ★/☆ 字符——星级评分必须用 [rate v:N max:5](展示场景加 ro),严禁字符模拟" });
  }

  while (i < dsl.length) {
    const ch = dsl[i];
    if (ch !== "[") {
      if (pendingTxCard && !/\s/.test(ch)) {
        warnings.push({ line: pendingTxCard.line, msg: "card 带 tx 后又出现正文文字——tx 叶子卡自闭合,后续文字会漏到卡片外渲染;要多段内容请去掉 tx 用子元素 [p]" });
        pendingTxCard = null;
      }
      i++;
      continue;
    }
    const tag = scanTag(dsl, i);
    if (!tag) {
      errors.push({ line: lineOf(dsl, i), msg: "存在未闭合的 `[`(找不到匹配的 `]`)——正文含字面 [ ] 时整段用双引号包" });
      break;
    }
    const parsed = parseInner(tag.inner);
    pendingTxCard = null;
    const isClose = parsed.name.startsWith("/");
    const name = isClose ? parsed.name.slice(1) : parsed.name;
    const line = lineOf(dsl, i);

    if (name && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
      stats.tags++;
      if (!ALL_NAMES.has(name) && !name.includes("_")) {
        errors.push({ line, msg: `未知组件 [${name}] —— 不在 TokUI 组件清单内,禁止臆造。相近组件可查 references/components.md` });
      }

      // 属性语义检查:容器与自闭合统一覆盖
      if (!isClose) {
        checkAttrSemantics(name, parsed, line, errors, warnings);
      }

      // 同名属性重复(后者覆盖前者):一个标签写两个 opt: 是高频翻车点
      if (!isClose) {
        const seenKeys = new Set();
        const dupKeys = new Set();
        for (const a of parsed.attrs) {
          const k = a.split(":", 1)[0];
          if (seenKeys.has(k)) dupKeys.add(k);
          seenKeys.add(k);
        }
        for (const k of dupKeys) {
          errors.push({
            line,
            msg: `属性 ${k}: 出现多次,后者覆盖前者、前面的全部丢失——多个选项必须写容器子节点([select][opt v:1 tx:A][opt v:2 tx:B][/select];cascader 层级用子 [opt p:父值]),严禁一个标签写多个 ${k}:`,
          });
        }
      }

      // 表格列数校验:thead 定列数,tr 对照(含 =c/=r 展开与占位扣减)
      if (!isClose && (name === "thead" || name === "tr")) {
        const tableFrame = [...stack].reverse().find((f) => f.name === "table");
        if (tableFrame) {
          if (name === "thead") {
            const cols = attrValue(parsed.attrs, "cols");
            if (cols && cols.includes("，")) {
              errors.push({
                line,
                msg: 'thead cols 列分隔必须英文逗号——检测到中文逗号「，」(不切列,整行列数坍缩、表格错位)。把分隔位置的，改成,;列名文字里确需逗号才用全角',
              });
            }
            if (cols) tableFrame.tableCols = headerColumnCount(cols);
          } else {
            checkTrColumns(tableFrame, parsed, line, warnings);
          }
        }
      }

      if (isClose) {
        // 闭合标签
        if (!CONTAINERS.has(name) && name !== "p" && name !== "ins") {
          // 自闭合组件的闭合标签:给出改写型错误,不再追加"栈不匹配"噪音
          const example = name === "ti"
            ? `[ti tm:"2024 下半年" t:info tt:"标题" 正文一句](tm/tt 含空格必须引号)`
            : name === "step"
              ? `[step tt:调研 status:done 输出需求文档]`
              : /^h[1-6]$/.test(name)
                ? `[h1 标题文字](标题正文与标签同行,不是 HTML 式 [h1]文字[/h1])`
                : `[${name} 属性… 正文]`;
          errors.push({
            line,
            msg: `[/${name}] 多余:${name} 是自闭合组件,没有闭合标签——正文写在开标签属性之后(与标签同一行),如 ${example};删除 [/${name}] 及其独立正文行,把正文并入开标签`,
          });
        } else {
          const top = stack[stack.length - 1];
          if (!top || top.name !== name) {
            if (stack.length === 0) {
              errors.push({ line, msg: `多余的闭合标签 [/${name}] —— 没有未闭合的 [${name}]` });
            } else {
              // 栈顶不匹配:如果目标在栈内,报出中间未闭合的容器
              const idx = [...stack].reverse().findIndex((f) => f.name === name);
              if (idx === -1) {
                errors.push({ line, msg: `闭合标签 [/${name}] 与栈顶 [${top.name}](第 ${top.line} 行开)不匹配` });
              } else {
                for (let k = stack.length - 1 - idx + 1; k < stack.length; k++) {
                  const f = stack[k];
                  if (f.bareTextReported) continue;
                  errors.push({ line: f.line, msg: unclosedMsg(f.name, f.line) });
                  f.unclosedReported = true;
                }
                const removed = stack.splice(stack.length - idx - 1);
                for (const f of removed) if (f.name === "form") closedForms.push(f);
              }
            }
          } else {
            const popped = stack.pop();
            if (popped.name === "form") closedForms.push(popped);
            // 空 [ft][/ft]:渲染器返回 null 不渲染,只留结构噪音——删除或补内容
            if (popped.name === "ft" && popped.openEnd !== undefined && dsl.slice(popped.openEnd, i).trim() === "") {
              warnings.push({ line: popped.line, msg: "空 [ft][/ft] 不会渲染(渲染器对空页脚返回 null)——删除它,或写内容 [ft tx:\"备注文字\"]" });
            }
            // row 闭合:col span 总和超 12(12 栅格)必换行——大屏 rows px 轨/定高行下溢出内容被下方区域盖住
            if (popped.name === "row" && popped.colSpans) {
              const total = popped.colSpans.reduce((s, c) => s + c.span, 0);
              if (total > 12) {
                warnings.push({
                  line: popped.line,
                  msg: `row 的 col span 总和 ${total} 超 12(12 栅格)→ 必换行成 ${Math.ceil(total / 12)} 行,定高行(大屏 rows px 行轨)下换行溢出会被下方区域盖住显示不全——${popped.colSpans.length} 个并排应各 span:12/个数(如 6 个=span:2、3 个=span:4)`,
                });
              }
            }
          }
        }
      } else if (CONTAINERS.has(name)) {
        // 开标签(容器)
        const selfClosing = escapesSelfClosing(name, parsed.attrs, parsed.content);
        // row 直系 col 的 span 记账(闭合时查总和):12 栅格,超限必换行——定高行下溢出被下方盖住
        if (name === "col" && stack.length > 0 && stack[stack.length - 1].name === "row") {
          const sv = parseInt(attrValue(parsed.attrs, "span"), 10);
          (stack[stack.length - 1].colSpans ??= []).push({ span: Number.isFinite(sv) ? Math.min(12, Math.max(1, sv)) : 1, line });
        }
        if (selfClosing) {
          // tx 叶子卡本身合法;仅当其后紧跟正文文字(会漏到卡外渲染)时才警告
          if (name === "card" && attrValue(parsed.attrs, "tx") !== undefined) {
            pendingTxCard = { line };
          }
          // cols 出现在不消费 cols 的容器上:属性臆造 + 意外触发自闭合(镜像 parser 行为)
          if (attrValue(parsed.attrs, "cols") !== undefined && !COLS_LEGIT.has(name)) {
            warnings.push({
              line,
              msg: `[${name}] cols: 不是该组件的属性,且任何容器带 cols: 都会触发自闭合(thead/desc/suggestions/chart/masonry/grid 除外)——子元素会全部漏成兄弟、[/${name}] 变多余。删掉 cols:(多列布局用 [grid] 或 [row][col span:N])`,
            });
          }
          checkSelfClosingTag(name, parsed, line, errors, warnings);
        } else {
          stats.containers++;
          const frame = {
            name, line, attrs: parsed.attrs, raw: tag.inner,
            id: attrValue(parsed.attrs, "id"),
            openEnd: tag.end,
            ...(name === "table" ? { tableCols: 0, pendingRowspans: [] } : {}),
          };
          // card/callout 游离词:定向错误(聚合降噪),并跳过该帧的通用未闭合报告
          if ((name === "card" || name === "callout") && parsed.content) {
            frame.bareTextReported = true;
            bareContainerIssues.push({ name, line, ...splitValueHint(parsed) });
          }
          // 大屏铁律(0.2.5):fit-screen 直接子级 grid 无显式高 → fr 行按内容解析塌陷;
          // 显式 px 高超出设计稿高 → mode:scale 下底行被画布裁剪。
          // h:100% 或 ≤ 设计稿高的 px 值(如固定行高+gap 的精确总和)均合规——只认字面 100% 会误伤后者。
          if (name === "grid" && stack.length > 0 && stack[stack.length - 1].name === "fit-screen") {
            const hv = String(attrValue(parsed.attrs, "h") || "").trim();
            const dh = parseInt(attrValue(stack[stack.length - 1].attrs, "h"), 10) || 1080;
            if (hv === "") {
              warnings.push({
                line,
                msg: 'fit-screen 内的 grid 缺 h——fr 行会按内容解析塌陷,应 h:100% 挂满画布(或显式 px 高=行高+gap 总和)',
              });
            } else if (/^\d+(\.\d+)?(px)?$/.test(hv) && parseFloat(hv) > dh) {
              warnings.push({
                line,
                msg: `fit-screen 内 grid h:${hv} 超出设计稿高 ${dh}——mode:scale 下底行会被画布裁剪(显示不全),改 h:100% 或收敛行高`,
              });
            }
          }
          // 应用壳规范(M2/T2.1):page 直系子元素应为三件套,游离内容落主区属兜底(多件会互叠)
          if (stack.length > 0 && stack[stack.length - 1].name === "page" &&
              name !== "page-header" && name !== "page-sidebar" && name !== "page-content") {
            warnings.push({
              line,
              msg: `[${name}] 不是 page 的规范子组件——page 直系子元素只写 page-header/page-sidebar/page-content 三件套,内容放进 [page-content](游离子元素 CSS 兜底落主区,多件会互相重叠)`,
            });
          }
          // 容器模式 chart 开标签(t/tasks 在子节点上):t 类型/中文逗号等专项检查同样适用
          if (name === "chart") checkSelfClosingTag(name, parsed, line, errors, warnings);
          // 容器模式开标签同样校验变体白名单(scroll-area v:flush / card v:bordered 等)
          checkVariantWhitelist(name, parsed.attrs, line, warnings);
          stack.push(frame);
          // dialog/drawer:静态报告无触发通路,渲染后永远打不开
          if (name === "dialog" || name === "drawer") {
            // 布尔属性 open 落在 content tokens 里(parseInner 只把 key:value 归入 attrs)
            if (parsed.content.trim().split(/\s+/).includes("open")) {
              warnings.push({ line, msg: `${name} 带 open 会自动弹出(刷新恢复历史时反复弹窗)——删除 open` });
            }
            if (stack[stack.length - 1].id) overlayIds.add(stack[stack.length - 1].id);
            warnings.push({
              line,
              msg: `静态报告打不开 ${name}(无触发通路)——改用 collapse(用户可点开)或 tabs 承载折叠/分层内容`,
            });
          }
        }
        // 原始内容容器:跳过内部内容,停在闭合标签前(由循环正常处理弹栈)
        if (RAW_CONTAINERS.has(name) && !selfClosing) {
          const closeRe = new RegExp(`\\[\\/${name}\\]`);
          const rest = dsl.slice(tag.end);
          const m = rest.match(closeRe);
          if (m) {
            i = tag.end + m.index;
            continue;
          } else {
            errors.push({ line, msg: `原始内容容器 [${name}] 未闭合——必须 [/${name}]` });
            break;
          }
        }
      } else if (name !== "" && ALL_NAMES.has(name)) {
        // 开标签(自闭合组件)的专项检查
        checkSelfClosingTag(name, parsed, line, errors, warnings);

        // form 提交按钮追踪:btn 带 sub:/t:submit 视为该表单已可提交(form 外绑 form:ID 同理)
        if (name === "btn") {
          const hasSubmit = parsed.attrs.some((a) => /^sub:/.test(a) || /^t:submit/.test(a));
          if (hasSubmit) {
            const enclosing = [...stack].reverse().find((f) => f.name === "form");
            if (enclosing) enclosing.hasSubmit = true;
            const bindId = attrValue(parsed.attrs, "form");
            if (bindId) {
              const openF = [...stack].reverse().find((f) => f.name === "form" && f.id === bindId);
              if (openF) openF.hasSubmit = true;
              const closedF = closedForms.find((f) => f.id === bindId);
              if (closedF) closedF.hasSubmit = true;
            }
          }
        }

        // upd act:open 指向 dialog/drawer → 自动弹(刷新复弹)
        if (name === "upd" && attrValue(parsed.attrs, "act") === "open") {
          const ids = (attrValue(parsed.attrs, "id") || "").split(",").map((s) => s.trim());
          if (ids.some((x) => overlayIds.has(x))) {
            warnings.push({ line, msg: "[upd act:open] 自动打开 dialog/drawer——刷新恢复历史时会反复弹窗,删除该 upd" });
          }
        }
      }

      // 裸变体词:p/h1-h6/btn 无 v: 时正文首词命中变体名 → 渲染成正文乱码
      // (p 走容器分支的逃逸路径,h*/btn 走自闭合分支,故放在分支外统一检查)
      if (!isClose && (name === "p" || /^h[1-6]$/.test(name) || name === "btn") && !parsed.attrs.some((a) => /^v:/.test(a))) {
        const first = (parsed.content.split(/\s+/)[0] || "");
        if (!first.startsWith('"') && BARE_VARIANT_WORDS.has(first)) {
          warnings.push({
            line,
            msg: `[${name} ${first} …] 裸变体词 "${first}" 会被当正文渲染成乱码——必须带 v: 前缀(多变体合并 v:"right,muted",绝不写第二个 v:)`,
          });
        }
      }

      if (name === "card" && CONTAINERS.has(name) && attrValue(parsed.attrs, "tx") !== undefined) {
        // card+tx warning 已在上面 selfClosing 分支发;这里防漏
      }
    } else if (name) {
      warnings.push({ line, msg: `可疑标签名 "${name}"(非英文标识符)` });
    }

    i = tag.end;
  }

  if (bareContainerIssues.length) {
    const first = bareContainerIssues[0];
    const cardCount = bareContainerIssues.filter((x) => x.name === "card").length;
    const calloutCount = bareContainerIssues.length - cardCount;
    const parts = [];
    if (cardCount) parts.push(`card ×${cardCount}`);
    if (calloutCount) parts.push(`callout ×${calloutCount}`);
    // 成因①:游离词紧跟属性 → 值含空格未加引号被切开(给出引号合并写法)
    let cause1 = "";
    if (first.attr && first.attr.includes(":")) {
      const [key, ...rest] = first.attr.split(":");
      cause1 = `成因①属性值含空格未加引号:${first.attr} ${first.word} 会被切开(值被截断),应写 ${key}:"${rest.join(":")} ${first.word}";`;
    }
    errors.push({
      line: first.line,
      msg: `出现游离词「${first.word}」(${parts.join("、")},第 ${[...new Set(bareContainerIssues.map((x) => x.line))].join("/")} 行)——${cause1}成因②想写正文:用 tx:"…" 或子元素 [p]。补 [/xx] 无效:游离词被吞、后续兄弟嵌套`,
    });
  }

  for (const f of stack) {
    if (!f.unclosedReported && !f.bareTextReported) {
      errors.push({ line: f.line, msg: unclosedMsg(f.name, f.line) });
    }
  }

  // form 缺提交按钮 = 用户无法提交(硬性错误)
  for (const f of closedForms) {
    if (!f.hasSubmit) {
      errors.push({
        line: f.line,
        msg: `form(第 ${f.line} 行)缺少提交按钮——末尾必带 [btn tx:提交 v:primary sub:formSubmit](表单数据以用户消息回传)与 [btn tx:重置 reset](前端清空),直接放 form 内、勿用 [ft];提交用 sub 不用 clk`,
      });
    }
  }

  return { errors, warnings, stats };
}

const CARD_HT_VALUES = new Set(["fill", "accent", "underline", "dot", "pill"]);
const CALLOUT_T_VALUES = new Set(["info", "success", "warning", "error", "tip"]);
const STAT_GUESSED_KEYS = new Set(["label", "value", "unit", "title", "text"]);

/** 属性语义检查(所有开标签统一执行,容器/自闭合都覆盖)。 */
function checkAttrSemantics(name, parsed, line, errors, warnings) {
  const { attrs } = parsed;

  // 属性值里塞组件标签([item l:表格 tx:[table]…]):值内 [ 会启动子标签解析、
  // 内层 ] 提前闭合本标签 → 属性值丢空、内容串行。字面文本须整个值双引号包;真组件挪出当子节点
  for (const a of attrs) {
    const ci = a.indexOf(":");
    if (ci === -1) continue;
    const val = a.slice(ci + 1);
    if (val.includes("[") && !val.startsWith('"')) {
      errors.push({
        line,
        msg: `[${name}] 属性值里出现 [ ——属性值内严禁塞组件标签(内层 ] 会提前闭合本标签:值丢空、内容错乱)。想原样显示文本:整个值双引号包(${a.slice(0, ci)}:"…");想渲染真组件:挪出属性值当子节点`,
      });
    }
  }

  // 裸正文组件的「英文:值」吞噬:正文里的 Q:/A:/step:1/note: 前缀被 parser 当属性,
  // 该句从正文消失(p/h/item/ti/step 等正文通道组件)
  checkStyleChannel(name, attrs, line, warnings);
  checkBreakpoints(name, attrs, line, warnings);
  checkEventChannels(name, attrs, line, errors, warnings);
  const knownKeys = BARE_TEXT_ATTR_KEYS.get(name);
  if (knownKeys) {
    for (const a of attrs) {
      const k = a.split(":", 1)[0];
      if (knownKeys.has(k) || BARE_TEXT_PASS_KEYS.has(k) || k.startsWith("data-")) continue;
      // icon:/i: 高频误用(铁律 9 列了 61 个图标名,易被当成全局语法套到 item/p):
      // 给出真正支持 icon 的组件与 item 的合法替代,避免模型只把冒号全角化、把图标名渲染成正文。
      const iconHint = (k === "icon" || k === "i")
        ? `。icon:/i: 仅 btn、表格操作列钮、kpi 支持(menu-item 可 i:):${name} 要图标效果,删掉该前缀,emoji 直接写正文开头或改用 [tag]`
        : "";
      warnings.push({
        line,
        msg: `[${name}] 属性 ${k}: 不是 ${name} 的已知属性——正文里的「英文:值」前缀会被解析器当属性吞掉、该句从正文消失(如 ${a})。改法:用全角冒号「${k}：」、去掉冒号、或该句双引号包裹${iconHint}`,
      });
    }
  }

  if (name === "card") {
    const hc = attrValue(attrs, "hc");
    const ht = attrValue(attrs, "ht");
    // hc/ht 属性反写:hc 是头部颜色,fill/accent/underline/dot/pill 属于 ht
    if (hc !== undefined && CARD_HT_VALUES.has(hc)) {
      errors.push({ line, msg: `[card] hc:${hc} 属性写反——hc: 是头部颜色(色值),${hc} 是 ht: 的取值;改成 ht:${hc}` });
    }
    if (ht !== undefined && !CARD_HT_VALUES.has(ht)) {
      errors.push({ line, msg: `[card] ht:${ht} 不是合法头部样式——ht: 只取 fill/accent/underline/dot/pill;颜色写 hc:` });
    }
  }
  // callout:类型写在 v: 上(应为 t:)
  if (name === "callout") {
    const v = attrValue(attrs, "v");
    if (v !== undefined && CALLOUT_T_VALUES.has(v)) {
      errors.push({ line, msg: `[callout] 类型必须写 t:${v}——v:${v} 会被当变体丢弃,警示框退回默认 info` });
    }
  }
  // stat:英文长词属性是臆造(渲染器只认 tt/v/pre/suf/trend/anim/dec,臆造键=数字卡渲染为空)
  if (name === "stat") {
    // stat 正文通道不存在:任何游离词都是"值含空格未加引号"被切开,标题/值被截断
    if (parsed.content) {
      const { word, attr } = splitValueHint(parsed);
      let hint = "";
      if (attr && attr.includes(":")) {
        const [key, ...rest] = attr.split(":");
        hint = `,应写 ${key}:"${rest.join(":")} ${parsed.content}"`;
      }
      errors.push({
        line,
        msg: `[stat] 出现游离词「${word}」——属性值含空格未加引号:${attr ?? "(无前导属性)"} ${word} 被切开、标题/值被截断${hint}`,
      });
    }
    const guessed = attrs.map((a) => a.split(":", 1)[0]).filter((k) => STAT_GUESSED_KEYS.has(k));
    if (guessed.length) {
      errors.push({
        line,
        msg: `[stat] 属性 ${guessed.map((k) => k + ":").join("、")} 是臆造名——渲染器只认 tt(标题)/v(值)/pre/suf/trend/anim/dec,臆造键被忽略、数字卡渲染为空`,
      });
    }
  }
}

// 变体白名单校验:自闭合路径与容器模式开标签共用。
// 容器模式(如 scroll-area v:flush / card v:bordered)此前不经此检查,变体拼写错误静默漏网。
function checkVariantWhitelist(name, attrs, line, warnings) {
  const v = attrValue(attrs, "v");
  if (v !== undefined && VARIANTS[name] !== undefined && v !== "") {
    const whitelist = new Set(VARIANTS[name].split(/\s+/).filter(Boolean));
    const manual = new Set(MANUAL_VARIANTS[name] ?? []);
    for (const part of v.split(",")) {
      const p = part.trim();
      if (!p || /^\d+(\.\d+)?$/.test(p)) continue; // 值语义(steps/tabs/tr v:total 等)
      if (p === "total" || p.includes("/")) continue;
      if (whitelist.size && !whitelist.has(p) && !manual.has(p)) {
        warnings.push({ line, msg: `变体 v:${p} 不在 [${name}] 白名单内,渲染器会静默丢弃。允许:${VARIANTS[name]}` });
      }
    }
  }
}

function checkSelfClosingTag(name, parsed, line, errors, warnings) {
  const { attrs } = parsed;

  // 图源/链接完整性:双协议前缀 = 硬损坏;URL 含 CJK 字符 = 拼接损坏
  // (s: 兼作尺寸(如 backtop s:"↑"),仅在值形如 URL(含 ://)时才检查)
  for (const key of ["s", "u"]) {
    const v = attrValue(attrs, key);
    if (typeof v !== "string" || !v.includes("://")) continue;
    if (/https?:\/\/https?:\/\//.test(v) || /\/\/.+\/\//.test(v.slice(v.indexOf("://") + 3))) {
      errors.push({
        line,
        msg: `[${name}] ${key}: URL 协议前缀重复("${v.slice(0, 40)}…")——生成时漂移损坏;去掉多余的协议段,保留一个 https://`,
      });
    } else if (/[\u3000-\u30ff\u3400-\u9fff\uf900-\ufaff]/.test(v)) {
      warnings.push({
        line,
        msg: `[${name}] ${key}: URL 内出现中文字符——多为拼接损坏(如域名后粘上中文标题);核对原始图源地址`,
      });
    }
  }

  // kpi 状态色误写 v:(0.2.5):v 是数值,写成 warn/danger 等样式词 → 数值被字面量顶掉
  if (name === "kpi") {
    const kv = attrValue(attrs, "v");
    if (kv !== undefined && ["warn", "warning", "danger", "success", "primary", "info"].includes(String(kv).trim().toLowerCase())) {
      errors.push({
        line,
        msg: `kpi 的 v: 是数值(当前 "${kv}" 是样式词)——状态色用 t:(primary/danger/success/warning),数值另写 v:"87.6"。此写法会让大屏直接显示字面量 "${kv}"`,
      });
    }
  }

  // 图表类型 / 属性顺序
  if (name === "chart") {
    const t = attrValue(attrs, "t");
    if (t !== undefined && !CHART_TYPES.has(t)) {
      errors.push({ line, msg: `未知图表类型 t:${t} —— 仅支持 22 种(bar/line/area/pie/donut/rose/funnel/radar/scatter/bubble/heatmap/histogram/waterfall/boxplot/treemap/sankey/candlestick/progress/gauge/gantt/map/combo)` });
    }
    // combo 专项:d2 缺失退化为纯柱(可能非本意);d2 含中文逗号同样坍缩
    if (t === "combo") {
      if (attrValue(attrs, "d2") === undefined) {
        warnings.push({ line, msg: "chart t:combo 缺 d2(折线序列)——当前退化为纯柱图;双轴对比应写 d2:\"增速,…\" + n1/n2 系列名 + y2 右轴单位" });
      }
      const d2v = attrValue(attrs, "d2");
      if (d2v && d2v.includes("，")) {
        errors.push({ line, msg: "chart d2: 的分隔必须英文逗号——检测到中文逗号「，」(数据点坍缩成 1 个)" });
      }
    }
    const dataPos = attrPos(attrs, (a) => /^(d|tasks|rows|flows|nodes):/.test(a));
    const lPos = attrPos(attrs, (a) => /^l:/.test(a));
    const tPos = attrPos(attrs, (a) => /^t:/.test(a));
    if (lPos !== -1 && dataPos !== -1 && lPos > dataPos) {
      warnings.push({ line, msg: "chart 属性顺序违反铁律:t → 样式 → l → 数据。l 必须写在 d/tasks 之前,否则流式预览翻转" });
    }
    if (tPos > 0) {
      warnings.push({ line, msg: "chart 的 t: 类型必须是第一个属性" });
    }
    // 中文逗号在 l:/d: 里不切分 → 标签/数据点数量坍缩,图表必错
    for (const key of ["l", "d"]) {
      const v = attrValue(attrs, key);
      if (v && v.includes("，")) {
        errors.push({
          line,
          msg: `chart ${key}: 的分隔必须英文逗号——检测到中文逗号「，」(不切分,${key === "l" ? "标签数坍缩、与数据点对不上" : "数据点坍缩成 1 个"})。把分隔位置的，改成,`,
        });
      }
    }

    // map 专项(0.2.5):label 三档白名单;region 省名:值 全角冒号不切分 → 整段静默失配
    if (t === "map") {
      const labelV = attrValue(attrs, "label");
      if (labelV !== undefined && !["full", "name", "off"].includes(labelV)) {
        warnings.push({
          line,
          msg: `chart t:map 的 label: 仅支持 full|name|off(当前 "${labelV}" 回退 full)。full=含数据省 名+值 两行/无数据省灰名;name=仅含数据省显名;off=纯色块`,
        });
      }
      const regionV = attrValue(attrs, "region");
      if (regionV && regionV.includes("：")) {
        errors.push({
          line,
          msg: 'chart t:map 的 region: 分隔必须英文冒号——检测到全角冒号「：」(省名:值 不切分,该省静默失配不上色)。把 省：值 改成 省:值',
        });
      }
    }

    // l 标签数 ↔ 数据点数对账(逐点对应类型;少=后段无标签,多=忽略)
    const lv = attrValue(attrs, "l");
    const dv = attrValue(attrs, "d");
    if (lv && dv && CHART_COUNTABLE.has(t)) {
      const lCount = lv.split(",").filter(Boolean).length;
      const series = dv.split("|").map((s) => s.split(",").filter(Boolean).length);
      if (series.some((n) => n !== lCount)) {
        warnings.push({
          line,
          msg: `chart t:${t} 的 l 标签数(${lCount})≠ 数据点数(${series.join("/")})——标签与数据逐点对应,少了后段无标签、多了忽略;每个系列的点数都必须 = l 标签数`,
        });
      }
    }
    // heatmap:cols 列标签数 = 每行值数、l 行标签数 = 行数
    if (t === "heatmap") {
      const rowsV = attrValue(attrs, "rows");
      const colsV = attrValue(attrs, "cols");
      if (rowsV) {
        const rows = rowsV.split("|").map((r) => r.split(",").filter(Boolean).length);
        if (rows.some((n) => n !== rows[0])) {
          warnings.push({ line, msg: "chart heatmap rows 各行列数不一致(行用 | 分、列用 , 分)——矩阵必须每行同宽,否则错位" });
        }
        if (colsV && colsV.split(",").filter(Boolean).length !== rows[0]) {
          warnings.push({ line, msg: `chart heatmap cols 标签数≠ 每行值数(${rows[0]})——列标签与每行格子一一对应` });
        }
        if (lv && lv.split(",").filter(Boolean).length !== rows.length) {
          warnings.push({ line, msg: `chart heatmap l 行标签数≠ rows 行数(${rows.length})——每行一个行标签` });
        }
      }
    }
    // histogram:bins 箱数必须 = l 段数
    if (t === "histogram") {
      const bins = attrValue(attrs, "bins");
      if (bins && lv && Number(bins) !== lv.split(",").filter(Boolean).length) {
        warnings.push({ line, msg: `chart histogram bins(${bins})≠ l 段数(${lv.split(",").filter(Boolean).length})——标签会错位/丢失;推荐只用 l 范围段标签(自动推 bins),不另写 bins` });
      }
    }
    // zoom 仅纵向 bar/line/area/boxplot/candlestick 支持
    if (attrValue(attrs, "zoom") !== undefined && (t === "histogram" || (t === "bar" && attrValue(attrs, "orient") === "h"))) {
      warnings.push({ line, msg: `chart t:${t}${t === "bar" ? " orient:h" : ""} 不支持 zoom(横柱/直方图无 dataZoom)——删掉 zoom,或改纵向柱` });
    }
    // gantt:tasks 字段数 / deps 索引越界 / 组号配 gnames
    if (t === "gantt") {
      const tasksV = attrValue(attrs, "tasks");
      const depsV = attrValue(attrs, "deps");
      const gnames = attrValue(attrs, "gnames");
      let taskCount = 0;
      const groups = new Set();
      let fieldBad = false;
      if (tasksV) {
        const tasks = tasksV.split("|");
        taskCount = tasks.length;
        for (const tk of tasks) {
          const f = tk.split(",");
          if (f.length < 3 || f.length > 5) fieldBad = true;
          if (f[4] !== undefined && f[4].trim() !== "") groups.add(f[4].trim());
        }
        if (fieldBad) {
          warnings.push({ line, msg: "chart gantt tasks 字段数应为 3-5 段(名称,开始,结束[,进度[,组号]])——字段多了/少了该任务被丢弃;task 名严禁含逗号/|(切分符)" });
        }
        if (groups.size > 1 && !gnames) {
          warnings.push({ line, msg: `chart gantt tasks 用了 ${groups.size} 个组号但缺 gnames:——图例显示"组1/组2"占位符;补 gnames:"组名|组名"(按组号映射)` });
        }
      }
      if (depsV && taskCount) {
        for (const dep of depsV.split(",")) {
          const pair = dep.split("->");
          if (pair.length === 2 && (Number(pair[0]) >= taskCount || Number(pair[1]) >= taskCount)) {
            errors.push({ line, msg: `chart gantt deps 索引越界("${dep.trim()}")——索引 0 起、必须 < tasks 总数(${taskCount}),越界依赖被渲染器静默丢弃` });
            break;
          }
        }
      }
    }
  }

  // 变体白名单(自闭合/逃逸路径;容器模式开标签由 lintDsl 主循环另行调用 checkVariantWhitelist)
  checkVariantWhitelist(name, attrs, line, warnings);

  // 布尔属性 :false / :true 陷阱(初始渲染)
  for (const a of attrs) {
    const m = /^([a-zA-Z][a-zA-Z0-9_-]*):(false|true)$/.exec(a);
    if (m && name !== "upd" && BOOLEAN_ATTRS.has(m[1])) {
      warnings.push({ line, msg: `[${name}] ${a}:布尔属性出现即为 true,没有 false 值——初始渲染想关闭请直接省略该属性(仅 upd 指令支持 xxx:false)` });
    }
  }

  // tr 简写格(btn:/tag:/progress)已由 parser 归位到单元格,裸写合法、无需整行外层引号
  // (整行引号 + \" 转义的旧写法仍兼容)。仍盯三类真问题:
  // ① btn: 操作列不在末格——多为按钮子属性值含英文逗号被切格(操作列恒为末格);
  // ② 简写格之后又写行级 id:/pid:——会被当按钮 data-* 子属性吞掉(行级属性须写在行首);
  // ③ 引号奇数。
  if (name === "tr") {
    const rawContent = parsed.content;
    const cells = splitTrCells(rawContent);
    const btnIdx = cells.findIndex((c) => /^btn:/.test(c.trim()));
    if (btnIdx !== -1 && btnIdx !== cells.length - 1) {
      warnings.push({
        line,
        msg: `tr 的 btn: 操作列应恒为末格(第 ${btnIdx + 1} 格之后又有多余格)——多为按钮子属性值含英文逗号被切格。改法:去掉该格内英文逗号,或整行外层双引号包 + \\" 转义`,
      });
    }
    for (const tok of parsed.trSwallowedRowAttrs) {
      warnings.push({
        line,
        msg: `行级属性 ${tok} 写在简写格(btn:/tag:/progress)之后会被当按钮子属性吞掉——树形/行 id 请移到行首(如 [tr ${tok} 单元格,…,btn:…])`,
      });
    }
    if ((rawContent.match(/"/g) ?? []).length % 2 === 1) {
      warnings.push({ line, msg: "tr 引号数量为奇数——引号必须成对(整行外层引号内的含逗号格用 \\\" 内层转义)" });
    }
  }
}

/** 去掉 ```tokui 围栏(如果传入的是整段回复) */
export function stripFences(text) {
  const fence = /```(?:tokui)?\s*\n([\s\S]*?)```/.exec(text);
  return fence ? fence[1] : text;
}

/** 供工具直接输出的人类/模型可读报告 */
export function formatLintResult(dsl, result) {
  if (result.errors.length === 0 && result.warnings.length === 0) {
    return `✅ TokUI DSL 校验通过:${result.stats.tags} 个标签、${result.stats.containers} 个容器,结构完整。`;
  }
  const lines = [];
  if (result.errors.length) {
    lines.push(`❌ ${result.errors.length} 个错误(必须修复):`);
    for (const e of result.errors) lines.push(`  L${e.line}: ${e.msg}`);
  }
  if (result.warnings.length) {
    lines.push(`⚠️ ${result.warnings.length} 个警告(强烈建议修复,否则渲染降级):`);
    for (const w of result.warnings) lines.push(`  L${w.line}: ${w.msg}`);
  }
  return lines.join("\n");
}
