/* ============================================================
   「今晚早点」 UI 组件 — 呼吸引导、聊天气泡、早餐选择器
   ============================================================ */
var { useState, useEffect } = React;

/* ============ 呼吸引导 ============ */
function BreathingExercise({ onDone }) {
  var [phase, setPhase] = useState("ready");
  var [breathCount, setBreathCount] = useState(0);
  var [breathPhase, setBreathPhase] = useState("inhale");
  var [seconds, setSeconds] = useState(4);
  var totalBreaths = 5;

  useEffect(function() {
    if (phase !== "breathing") return;
    var timer = setInterval(function() {
      setSeconds(function(s) {
        if (s <= 1) {
          if (breathPhase === "inhale") { setBreathPhase("hold"); return 4; }
          else if (breathPhase === "hold") { setBreathPhase("exhale"); return 6; }
          else {
            var next = breathCount + 1;
            if (next >= totalBreaths) { setPhase("done"); return 0; }
            setBreathCount(next); setBreathPhase("inhale"); return 4;
          }
        }
        return s - 1;
      });
    }, 1000);
    return function() { clearInterval(timer); };
  }, [phase, breathPhase, breathCount]);

  var phaseLabel = { inhale: "吸气", hold: "屏住", exhale: "呼气" };
  var scale = breathPhase === "exhale" ? 0.85 : 1.35;

  if (phase === "done") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 20, animation: "floaty 3s ease-in-out infinite" }}>🦊</div>
        <p style={{ fontSize: 24, color: C.text, fontWeight: 700, marginBottom: 14, fontFamily: "'Baloo 2', cursive" }}>晚安 💛</p>
        <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 20, lineHeight: 1.9 }}>今天的你已经够好了<br />剩下的，交给明天的你</p>
        <div style={{ background: C.accentSoft, borderRadius: 18, padding: "12px 18px", marginBottom: 10 }}>
          <p style={{ color: C.accentDeep, fontSize: 13, fontWeight: 600 }}>🦊 一只小狐狸来你的梦境小窝安家了</p>
        </div>
        <div style={{ background: C.greenSoft, borderRadius: 14, padding: "10px 16px", marginBottom: 16 }}>
          <p style={{ color: C.text, fontSize: 12, fontWeight: 500 }}>🐟 获得 2 条小鱼干，可以喂养小动物</p>
        </div>
        <div style={{ background: "linear-gradient(135deg, " + C.pinkSoft + ", " + C.accentSoft + ")", borderRadius: 16, padding: "14px 18px", marginBottom: 18, border: "1px solid " + C.border }}>
          <p style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>📵 接下来这一步最重要：</p>
          <p style={{ color: C.text, fontSize: 12.5, lineHeight: 1.7 }}>把手机翻过来扣在桌上 / 放到卧室外。<br /><span style={{ color: C.textMuted }}>我们的工作到此为止，剩下的交给你的身体。</span></p>
        </div>
        <button onClick={onDone} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 22, padding: "12px 36px", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 6px 18px " + C.accent + "55" }}>好，我去睡了</button>
      </div>
    );
  }

  if (phase === "ready") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: 40, textAlign: "center" }}>
        <p style={{ fontSize: 19, color: C.text, marginBottom: 10, fontFamily: "'Baloo 2', cursive", fontWeight: 600 }}>睡前呼吸 🌙</p>
        <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 30, lineHeight: 1.7 }}>5 次深呼吸，帮身体切换到休息模式<br />找个舒服的姿势，准备好就开始</p>
        <button onClick={function() { setPhase("breathing"); }} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 22, padding: "12px 38px", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 6px 18px " + C.accent + "55" }}>开始呼吸</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: 40 }}>
      <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 36 }}>第 {breathCount + 1} / {totalBreaths} 次</p>
      <div style={{
        width: 170, height: 170, borderRadius: "50%",
        background: "radial-gradient(circle, " + C.pink + "55 0%, " + C.accent + "22 60%, transparent 75%)",
        border: "2px solid " + C.accent + "66",
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: "scale(" + scale + ")",
        transition: breathPhase === "hold" ? "none" : breathPhase === "inhale" ? "transform 4s ease-in-out" : "transform 6s ease-in-out",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: C.accentDeep, fontSize: 22, fontWeight: 700, fontFamily: "'Baloo 2', cursive" }}>{phaseLabel[breathPhase]}</p>
          <p style={{ color: C.textMuted, fontSize: 30, fontWeight: 300, marginTop: 2 }}>{seconds}</p>
        </div>
      </div>
    </div>
  );
}

/* ============ 打字效果 Hook ============ */
function useTypingEffect(text, enabled, speed) {
  var [displayed, setDisplayed] = useState("");
  var [done, setDone] = useState(false);
  
  useEffect(function() {
    if (!enabled) { setDisplayed(text); setDone(true); return; }
    setDisplayed(""); setDone(false);
    var i = 0;
    var timer = setInterval(function() {
      i++;
      if (i >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(timer);
      } else {
        setDisplayed(text.substring(0, i));
      }
    }, speed || 25);
    return function() { clearInterval(timer); };
  }, [text, enabled]);
  
  return { displayed: displayed, done: done };
}

/* ============ 聊天气泡 (AI 消息带打字效果) ============ */
function ChatMessage({ msg, isLast }) {
  var isAi = msg.role === "ai";
  var typing = useTypingEffect(msg.text, isAi && isLast, 22);
  var showText = (isAi && isLast) ? typing.displayed : msg.text;
  var showCursor = isAi && isLast && !typing.done;
  
  return (
    <div style={{ display: "flex", justifyContent: isAi ? "flex-start" : "flex-end", marginBottom: 14, animation: isLast ? "fadeSlideUp 0.35s ease" : "none", alignItems: "flex-end", gap: 8 }}>
      {isAi && <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, " + C.accent + ", " + C.pink + ")", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🌙</div>}
      <div style={{
        maxWidth: "78%", padding: "11px 15px",
        borderRadius: isAi ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
        background: isAi ? C.card : "linear-gradient(135deg, " + C.accent + ", " + C.accentDeep + ")",
        border: isAi ? "1px solid " + C.border : "none",
        color: isAi ? C.text : "#fff",
        fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap",
        boxShadow: isAi ? "0 2px 8px rgba(180,150,120,0.08)" : "0 4px 12px " + C.accent + "44",
      }}>{showText}{showCursor && <span style={{ display: "inline-block", width: 2, height: 14, background: C.accent, marginLeft: 2, verticalAlign: "text-bottom", animation: "pulse 0.8s ease-in-out infinite" }}></span>}</div>
    </div>
  );
}

/* ============ 早餐选择器 (支持自定义 + emoji 匹配) ============ */
function BreakfastPicker({ onConfirm, customBreakfasts }) {
  var [picked, setPicked] = useState([]);
  var [customMode, setCustomMode] = useState(false);
  var [customText, setCustomText] = useState("");
  var [previewEmoji, setPreviewEmoji] = useState(null);

  // 合并: 预设 + 用户历史自定义
  var allItems = [].concat(breakfastCatalog);
  if (customBreakfasts) {
    customBreakfasts.forEach(function(cb) {
      if (!allItems.some(function(a) { return a.emoji === cb.emoji && a.name === cb.name; })) {
        allItems.push(cb);
      }
    });
  }

  var toggle = function(id) {
    setPicked(function(p) { return p.includes(id) ? p.filter(function(x) { return x !== id; }) : [].concat(p, [id]); });
  };

  var handleCustomInput = function(val) {
    setCustomText(val);
    if (val.trim()) {
      setPreviewEmoji(matchFoodEmoji(val));
    } else {
      setPreviewEmoji(null);
    }
  };

  var addCustom = function() {
    var name = customText.trim();
    if (!name) return;
    var emoji = matchFoodEmoji(name);
    // 去掉用户输入中可能已有的 emoji
    var cleanName = name.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim() || name;
    var id = emoji + ":" + cleanName;
    setPicked(function(p) { return [].concat(p, [id]); });
    setCustomText("");
    setPreviewEmoji(null);
    setCustomMode(false);
    // 通知父组件有新的自定义早餐
    if (onConfirm._addCustom) onConfirm._addCustom({ emoji: emoji, name: cleanName });
  };

  // 从 id 解析 emoji (预设用 emoji, 自定义用 "emoji:name" 格式)
  var getDisplay = function(id) {
    if (id.includes(":")) {
      var parts = id.split(":");
      return { emoji: parts[0], name: parts.slice(1).join(":") };
    }
    var item = allItems.find(function(a) { return a.emoji === id; });
    return item || { emoji: id, name: id };
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {allItems.map(function(b, idx) {
          var on = picked.includes(b.emoji);
          var isCustom = idx >= breakfastCatalog.length;
          return (
            <button key={b.emoji + b.name} onClick={function() { toggle(b.emoji); }} style={{
              background: on ? C.accentSoft : C.cardSoft, border: "1.5px solid " + (on ? C.accent : C.border),
              borderRadius: 14, padding: "10px 6px", cursor: "pointer", textAlign: "center",
              transition: "all 0.15s", transform: on ? "scale(1.04)" : "scale(1)",
              position: "relative",
            }}>
              {isCustom && <div style={{ position: "absolute", top: 4, right: 4, fontSize: 8, background: C.accent, color: "#fff", borderRadius: 6, padding: "1px 4px", fontWeight: 700 }}>新</div>}
              <div style={{ fontSize: 24, marginBottom: 3 }}>{b.emoji}</div>
              <div style={{ color: C.text, fontSize: 10.5, fontWeight: on ? 700 : 500 }}>{b.name}</div>
            </button>
          );
        })}
      </div>
      {customMode ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input type="text" value={customText} onChange={function(e) { handleCustomInput(e.target.value); }}
                onKeyDown={function(e) { if (e.key === "Enter") addCustom(); }}
                placeholder="输入早餐名称，如 饭团、蛋炒饭"
                style={{ width: "100%", padding: "9px 12px", paddingLeft: previewEmoji ? 36 : 12, borderRadius: 12, border: "1.5px solid " + C.border, fontSize: 13, color: C.text, background: C.cardSoft, boxSizing: "border-box" }} />
              {previewEmoji && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 20 }}>{previewEmoji}</span>}
            </div>
            <button onClick={addCustom} style={{ padding: "0 14px", border: "none", background: C.accent, color: "#fff", borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>加上</button>
          </div>
          {previewEmoji && customText.trim() && (
            <p style={{ color: C.textMuted, fontSize: 11, marginTop: 6, paddingLeft: 4 }}>
              将以 {previewEmoji} 加入你的早餐图鉴
            </p>
          )}
        </div>
      ) : (
        <button onClick={function() { setCustomMode(true); }} style={{ width: "100%", background: "transparent", border: "1.5px dashed " + C.border, borderRadius: 12, padding: "9px", cursor: "pointer", marginBottom: 12, color: C.textMuted, fontSize: 12, fontWeight: 500 }}>+ 没有我吃的？自己写一个</button>
      )}
      {picked.length > 0 && (
        <div style={{ background: C.greenSoft, borderRadius: 12, padding: "8px 12px", marginBottom: 10 }}>
          <p style={{ color: C.text, fontSize: 12, fontWeight: 500 }}>
            今早: <span style={{ fontSize: 16 }}>{picked.map(function(id) { return getDisplay(id).emoji; }).join(" ")}</span>
          </p>
        </div>
      )}
      <button onClick={function() { if (picked.length > 0) onConfirm(picked.map(function(id) { return getDisplay(id); })); }} disabled={picked.length === 0} style={{
        width: "100%", background: picked.length > 0 ? C.accent : C.cardSoft, color: picked.length > 0 ? "#fff" : C.textMuted,
        border: "none", borderRadius: 16, padding: "12px", fontSize: 14, fontWeight: 700,
        cursor: picked.length > 0 ? "pointer" : "default",
        boxShadow: picked.length > 0 ? "0 4px 12px " + C.accent + "44" : "none",
      }}>
        {picked.length > 0 ? "记下今早 (" + picked.length + ")" : "选一个或几个"}
      </button>
    </div>
  );
}

window.BreathingExercise = BreathingExercise;
window.ChatMessage = ChatMessage;
window.BreakfastPicker = BreakfastPicker;
