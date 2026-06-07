/* ============================================================
   「今晚早点」 主应用 — App 组件 + 路由 + 状态管理
   ============================================================ */
var { useState, useEffect, useRef } = React;
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildTypeDistributionGradient(items) {
  var offset = 0;
  return "conic-gradient(" + items.map(function(item) {
    var start = offset;
    offset += item.value;
    return item.color + " " + start + "% " + offset + "%";
  }).join(", ") + ")";
}

/* ============ 测评结果方案卡片 ============ */
function SolutionView({ type }) {
  var sol = personaSolutions[type];
  var cfg = typeConfig[type];
  var Section = function({ title, icon, children, bg, border: borderColor }) {
    return (
      <div style={{ background: bg || C.card, borderRadius: 18, padding: "16px 18px", border: "1px solid " + (borderColor || C.border), marginBottom: 12 }}>
        <p style={{ color: cfg.color, fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><span>{icon}</span> <span>{title}</span></p>
        {children}
      </div>
    );
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", textAlign: "left", width: "100%" }}>
      <div style={{ background: "linear-gradient(135deg, " + cfg.soft + ", " + C.card + ")", borderRadius: 22, padding: "22px 20px", border: "1px solid " + C.border, marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 8, animation: "floaty 3s ease-in-out infinite" }}>{cfg.emoji}</div>
        <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 4 }}>你的主导熬夜人格是</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: cfg.color, fontFamily: "'Baloo 2', cursive", marginBottom: 10 }}>{cfg.label}</p>
        <p style={{ color: C.text, fontSize: 14, lineHeight: 1.7, fontWeight: 600 }}>{sol.insight}</p>
      </div>
      <Section title="为什么会这样" icon="🔍"><p style={{ color: C.text, fontSize: 13, lineHeight: 1.85 }}>{sol.why}</p></Section>
      <Section title="给你的核心方法" icon="💡" bg={"linear-gradient(135deg, " + cfg.soft + ", " + C.accentSoft + ")"}>
        <p style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{sol.coreMethod.name}</p>
        <p style={{ color: C.text, fontSize: 13, lineHeight: 1.8 }}>{sol.coreMethod.desc}</p>
      </Section>
      <Section title="今晚就可以试" icon="🌙">
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {sol.tonight.map(function(item, i) { return <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span><p style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>{item.t}</p></div>; })}
        </div>
      </Section>
      <Section title="慢慢来 — 长期建议" icon="🌱" bg={C.greenSoft} border={C.green + "55"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {sol.longTerm.map(function(item, i) { return <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span><p style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>{item.t}</p></div>; })}
        </div>
      </Section>
      <Section title="尽量避免" icon="⚠️" bg={C.warnSoft} border={C.warn + "55"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {sol.avoid.map(function(item, i) { return <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><span style={{ color: C.warn, fontSize: 13, flexShrink: 0 }}>•</span><p style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>{item}</p></div>; })}
        </div>
      </Section>
      <div style={{ background: C.cardSoft, borderRadius: 14, padding: "12px 14px", marginBottom: 14, borderLeft: "3px solid " + cfg.color }}>
        <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, marginBottom: 5 }}>📚 研究依据</p>
        <p style={{ color: C.text, fontSize: 12, lineHeight: 1.7 }}>{sol.evidence}</p>
      </div>
      <div style={{ background: C.accentSoft, borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
        <p style={{ color: C.text, fontSize: 12.5, lineHeight: 1.7 }}>🌗 觉得不太准？没关系，你随时可以自己选择今晚的状态——你最懂你自己。</p>
      </div>
    </div>
  );
}

/* ============ 主组件 ============ */
function App() {
  var [page, setPage] = useState("home");
  var [pageTransition, setPageTransition] = useState(true);
  
  // 带过渡的页面切换
  var navigateTo = function(target) {
    if (target === page) return;
    setPageTransition(false);
    setTimeout(function() {
      setPage(target);
      setPageTransition(true);
    }, 150);
  };
  var [selectedType, setSelectedType] = useState(null);
  var [messages, setMessages] = useState([]);
  var [flowIndex, setFlowIndex] = useState(0);
  var [showTypeSelect, setShowTypeSelect] = useState(false);
  var [showQuickReplies, setShowQuickReplies] = useState(null);
  var [isTyping, setIsTyping] = useState(false);
  var [quizStep, setQuizStep] = useState(0);
  var [quizAnswers, setQuizAnswers] = useState([]);
  var [inputValue, setInputValue] = useState("");
  var [targetTime, setTargetTime] = useState(function() {
    return localStorage.getItem("jwzd_targetTime") || "23:00";
  });
  var [chatStartedAt, setChatStartedAt] = useState(null);
  var [chatElapsed, setChatElapsed] = useState(0);
  var [collectedBreakfasts, setCollectedBreakfasts] = useState(function() {
    var saved = localStorage.getItem("jwzd_breakfasts");
    return saved ? JSON.parse(saved) : { "🥐": 3, "🥚": 5, "🥣": 2, "☕": 8, "🥛": 4, "🥟": 1 };
  });
  // 用户自定义的早餐 (不在预设目录中的)
  var [customBreakfastList, setCustomBreakfastList] = useState(function() {
    var saved = localStorage.getItem("jwzd_customBreakfasts");
    return saved ? JSON.parse(saved) : [];
  });
  var [todayBreakfast, setTodayBreakfast] = useState(null);
  var [nestTab, setNestTab] = useState("animals");
  // 新发现提示
  var [newDiscovery, setNewDiscovery] = useState(null);
  var chatStateRef = useRef({ slots: {}, usedFallbacks: [], turnCount: 0, closeTriggered: false, closeAttempted: false, planGiven: false, askedWakeUp: 0, planFollowUpIdx: 0 });
  var chatRef = useRef(null);
  var [currentTime, setCurrentTime] = useState("23:17");
  // 对话完成记录 (用于更新首页数据)
  var [sessionLog, setSessionLog] = useState(function() {
    var saved = localStorage.getItem("jwzd_sessions");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(function() {
    var now = new Date();
    setCurrentTime(now.getHours() + ":" + now.getMinutes().toString().padStart(2, "0"));
    var t = setInterval(function() {
      var n = new Date();
      setCurrentTime(n.getHours() + ":" + n.getMinutes().toString().padStart(2, "0"));
    }, 30000);
    return function() { clearInterval(t); };
  }, []);

  // 持久化 targetTime
  useEffect(function() { localStorage.setItem("jwzd_targetTime", targetTime); }, [targetTime]);
  // 持久化早餐
  useEffect(function() { localStorage.setItem("jwzd_breakfasts", JSON.stringify(collectedBreakfasts)); }, [collectedBreakfasts]);
  // 持久化自定义早餐列表
  useEffect(function() { localStorage.setItem("jwzd_customBreakfasts", JSON.stringify(customBreakfastList)); }, [customBreakfastList]);
  // 持久化 sessions
  useEffect(function() { localStorage.setItem("jwzd_sessions", JSON.stringify(sessionLog)); }, [sessionLog]);

  // 自动清除新发现提示
  useEffect(function() {
    if (!newDiscovery) return;
    var t = setTimeout(function() { setNewDiscovery(null); }, 3000);
    return function() { clearTimeout(t); };
  }, [newDiscovery]);

  useEffect(function() {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, showQuickReplies, isTyping, showTypeSelect]);

  // 计算展示数据 (合并预设+真实)
  var lastSession = sessionLog.length > 0 ? sessionLog[sessionLog.length - 1] : null;
  var displaySleepTime = lastSession ? lastSession.sleepTime : "23:42";
  var displayStreak = function() {
    var base = 3;
    var recent = sessionLog.filter(function(s) { return Date.now() - s.timestamp < 7 * 86400000; });
    return base + recent.length;
  }();

  // 动态计算小动物收集 (预设 + 真实 session)
  var dynamicAnimals = function() {
    // 基础预设
    var base = [
      { emoji: "🦊", name: "小狐狸", desc: "报复型夜晚的陪伴", level: 2, accessory: "🎀", rare: false, count: 5, type: "revenge" },
      { emoji: "🐰", name: "小兔子", desc: "焦虑夜晚的安慰", level: 2, accessory: "🧣", rare: false, count: 3, type: "anxiety" },
      { emoji: "🦝", name: "小浣熊", desc: "放下手机的奖励", level: 1, accessory: null, rare: false, count: 2, type: "inertia" },
      { emoji: "🐻", name: "小熊", desc: "准时收工的勋章", level: 1, accessory: null, rare: false, count: 1, type: "work" },
      { emoji: "🦉", name: "猫头鹰", desc: "夜间精神好的伙伴", level: 0, accessory: null, rare: false, count: 0, type: "owl" },
      { emoji: "🐱", name: "小猫", desc: "说不清的夜晚", level: 0, accessory: null, rare: false, count: 0, type: "mixed" },
    ];
    // 从真实 session 更新计数
    sessionLog.forEach(function(s) {
      var animal = base.find(function(a) { return a.type === s.type; });
      if (animal) {
        animal.count += 1;
        if (animal.count >= 3 && animal.level < 1) animal.level = 1;
        if (animal.count >= 6 && animal.level < 2) { animal.level = 2; if (!animal.accessory) animal.accessory = "✨"; }
      }
    });
    // 特殊动物
    var totalSessions = sessionLog.length + 12; // 12 预设
    base.push({ emoji: "🦔", name: "小刺猬", desc: "连续 3 天达标解锁", level: 1, accessory: "✨", rare: true, count: displayStreak >= 3 ? 1 : 0, locked: displayStreak < 3 });
    base.push({ emoji: "🦄", name: "独角兽", desc: "连续 7 天达标 · 稀有", level: 0, accessory: null, rare: true, count: 0, locked: displayStreak < 7 });
    return base;
  }();

  var startChat = function() {
    setPage("chat"); setMessages([]); setSelectedType(null);
    setFlowIndex(0); setShowQuickReplies(null); setShowTypeSelect(false);
    setInputValue("");
    setChatStartedAt(Date.now()); setChatElapsed(0);
    chatStateRef.current = { slots: {}, usedFallbacks: [], turnCount: 0, closeTriggered: false, closeAttempted: false, planGiven: false, askedWakeUp: 0, planFollowUpIdx: 0 };
    setIsTyping(true);
    setTimeout(function() {
      setIsTyping(false);
      setMessages([{ role: "ai", text: "嘿，已经这个点啦——\n今晚怎么还没睡呀？跟我说说 👇" }]);
      setShowTypeSelect(true);
    }, 1100);
  };

  useEffect(function() {
    if (page !== "chat" || !chatStartedAt) return;
    var update = function() { setChatElapsed(Math.floor((Date.now() - chatStartedAt) / 60000)); };
    update();
    var t = setInterval(update, 30000);
    return function() { clearInterval(t); };
  }, [page, chatStartedAt]);

  var selectType = function(type) {
    setSelectedType(type); setShowTypeSelect(false);
    var userMsg = { role: "user", text: typeConfig[type].emoji + " " + typeConfig[type].sublabel };
    var base = [].concat(messages, [userMsg]);
    setMessages(base);
    playFrom(type, 0, base);
  };

  var playFrom = function(type, idx, current) {
    var flow = chatFlows[type];
    if (idx >= flow.length) return;
    var msg = flow[idx];
    if (msg.role === "ai") {
      setIsTyping(true);
      setTimeout(function() {
        setIsTyping(false);
        var next = [].concat(current, [{ role: "ai", text: msg.text }]);
        setMessages(next);
        if (msg.quickReplies) { setShowQuickReplies(msg.quickReplies); setFlowIndex(idx); }
        else playFrom(type, idx + 1, next);
      }, 900 + Math.random() * 600);
    } else {
      var next = [].concat(current, [{ role: "user", text: msg.text }]);
      setMessages(next);
      setTimeout(function() { playFrom(type, idx + 1, next); }, 700);
    }
  };

  // 完成对话 → 记录 session + 庆祝反馈
  var recordSession = function(type) {
    var now = new Date();
    var sleepTime = now.getHours() + ":" + now.getMinutes().toString().padStart(2, "0");
    var entry = { date: now.toISOString().slice(0, 10), sleepTime: sleepTime, type: type || "mixed", timestamp: Date.now() };
    setSessionLog(function(prev) { return [].concat(prev, [entry]); });
    // 设置新发现提示 (显示获得了哪只小动物)
    var cfg = typeConfig[type || "mixed"];
    if (cfg) {
      setNewDiscovery({ emoji: cfg.emoji, name: cfg.animal + "来你的小窝安家了" });
    }
  };

  var runOneTurn = async function(text) {
    setShowQuickReplies(null); setShowTypeSelect(false);
    if (detectCrisis(text)) {
      setMessages(function(p) { return [].concat(p, [{ role: "user", text: text }]); });
      setIsTyping(true);
      setTimeout(function() { setIsTyping(false); setPage("crisis"); }, 800);
      return;
    }
    var baseMsgs = messages;
    var nextMsgs = [].concat(baseMsgs, [{ role: "user", text: text }]);
    setMessages(nextMsgs);
    var state = Object.assign({}, chatStateRef.current);
    state.turnCount = (state.turnCount || 0) + 1;
    setIsTyping(true);
    var llmReply = null;
    try { llmReply = await callLLM(selectedType, baseMsgs, text); } catch (e) {}
    var slotResult = generateReply(selectedType, text, state);
    setIsTyping(false);
    var reply = llmReply || slotResult.reply;
    var newState = Object.assign({}, state, {
      slots: slotResult.slots || state.slots,
      usedFallbacks: slotResult.usedFallbacks !== undefined ? slotResult.usedFallbacks : state.usedFallbacks,
      askedWakeUp: slotResult.askedWakeUp !== undefined ? slotResult.askedWakeUp : state.askedWakeUp,
      planGiven: slotResult.planGiven !== undefined ? slotResult.planGiven : state.planGiven,
      planFollowUpIdx: slotResult.planFollowUpIdx !== undefined ? slotResult.planFollowUpIdx : state.planFollowUpIdx,
      closeAttempted: slotResult.closeAttempted !== undefined ? slotResult.closeAttempted : state.closeAttempted,
      closeTriggered: slotResult.closeTriggered === false ? false : state.closeTriggered,
    });
    chatStateRef.current = newState;
    setMessages([].concat(nextMsgs, [{ role: "ai", text: reply }]));
    var shouldClose = !newState.closeTriggered && !newState.closeAttempted && (newState.planGiven || newState.turnCount >= 5);
    if (shouldClose) {
      setTimeout(function() {
        setIsTyping(true);
        setTimeout(function() {
          setIsTyping(false);
          var closingMsg = newState.planGiven
            ? "好啦，今晚的计划定好了 ✨\n\n要不要先做几次呼吸，把身体切到「夜间状态」？然后就放心去做你想做的事。"
            : "我们聊了一会儿了 💛 你的状态我大概懂了。\n\n准备好让今晚画个温柔的句号了吗？";
          setMessages(function(p) { return [].concat(p, [{ role: "ai", text: closingMsg }]); });
          setTimeout(function() {
            chatStateRef.current = Object.assign({}, chatStateRef.current, { closeTriggered: true });
            setShowQuickReplies(["准备好了 😌", "再让我刷一会儿…"]);
          }, 600);
        }, 1000);
      }, 1200);
    }
  };

  var handleQuickReply = function(reply) {
    setShowQuickReplies(null);
    if (["准备好了 😌", "开始呼吸 🌙", "手机放下了 ✓", "看完了，挺充实的", "好，开始呼吸 🌙"].includes(reply)) {
      setMessages(function(p) { return [].concat(p, [{ role: "user", text: reply }]); });
      setIsTyping(true);
      setTimeout(function() { setIsTyping(false); setPage("breathing"); }, 900);
      return;
    }
    if (reply === "再让我刷一会儿…") {
      var next = [].concat(messages, [{ role: "user", text: reply }]);
      setMessages(next);
      setIsTyping(true);
      setTimeout(function() {
        setIsTyping(false);
        setMessages([].concat(next, [{ role: "ai", text: "好，我尊重你的选择 😌 \n\n那我们把今晚的入睡目标往后调一点——你想推到几点？\n\n（现在目标是 " + targetTime + "）" }]));
        setTimeout(function() { setShowQuickReplies(["晚 30 分钟", "晚 1 小时", "再晚 1.5 小时"]); }, 600);
      }, 1000);
      return;
    }
    if (["晚 30 分钟", "晚 1 小时", "再晚 1.5 小时"].includes(reply)) {
      var minutesMap = { "晚 30 分钟": 30, "晚 1 小时": 60, "再晚 1.5 小时": 90 };
      var mins = minutesMap[reply];
      var parts = targetTime.split(":").map(Number);
      var totalMins = parts[0] * 60 + parts[1] + mins;
      if (totalMins >= 24 * 60) totalMins -= 24 * 60;
      var newTarget = Math.floor(totalMins / 60).toString().padStart(2, "0") + ":" + (totalMins % 60).toString().padStart(2, "0");
      setTargetTime(newTarget);
      var next2 = [].concat(messages, [{ role: "user", text: reply }]);
      setMessages(next2);
      setIsTyping(true);
      setTimeout(function() {
        setIsTyping(false);
        setMessages([].concat(next2, [{ role: "ai", text: "好，今晚的入睡目标更新为 " + newTarget + " 啦 💛 \n\n首页的目标也同步更新了。我们继续聊，你准备好的时候随时告诉我。" }]));
        chatStateRef.current = Object.assign({}, chatStateRef.current, { closeAttempted: false, closeTriggered: false });
      }, 1000);
      return;
    }
    if (softLandingReplies[reply]) {
      var next3 = [].concat(messages, [{ role: "user", text: reply }]);
      setMessages(next3);
      setIsTyping(true);
      setTimeout(function() {
        setIsTyping(false);
        setMessages([].concat(next3, [{ role: "ai", text: softLandingReplies[reply] }]));
        setTimeout(function() { setShowQuickReplies(["好，那我试试 😌", "谢谢你陪我"]); }, 600);
      }, 1000);
      return;
    }
    if (reply === "好，那我试试 😌" || reply === "谢谢你陪我") {
      var next4 = [].concat(messages, [{ role: "user", text: reply }]);
      setMessages(next4);
      setIsTyping(true);
      setTimeout(function() {
        setIsTyping(false);
        setMessages([].concat(next4, [{ role: "ai", text: "💛 这就很好了。\n\n来，我们一起做几次呼吸，慢慢放松下来。" }]));
        setTimeout(function() { setShowQuickReplies(["开始呼吸 🌙"]); }, 600);
      }, 1000);
      return;
    }
    var flow = chatFlows[selectedType] || [];
    if (flowIndex + 1 >= flow.length) { runOneTurn(reply); return; }
    var next5 = [].concat(messages, [{ role: "user", text: reply }]);
    setMessages(next5);
    playFrom(selectedType, flowIndex + 1, next5);
  };

  var handleFreeChat = function() {
    var text = inputValue.trim();
    if (!text || !selectedType) return;
    setInputValue(""); runOneTurn(text);
  };

  var answerQuiz = function(type) {
    var newAnswers = [].concat(quizAnswers, [type]);
    setQuizAnswers(newAnswers);
    if (quizStep < quizQuestions.length - 1) setQuizStep(quizStep + 1);
    else setQuizStep(quizQuestions.length);
  };

  var quizResult = function() {
    var counts = {};
    quizAnswers.forEach(function(t) { counts[t] = (counts[t] || 0) + 1; });
    var sorted = Object.entries(counts).sort(function(a, b) { return b[1] - a[1]; });
    return sorted[0] ? sorted[0][0] : "mixed";
  };

  var scrollableMain = { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", minHeight: 0 };
  var showBottomNav = ["home", "collection", "dashboard"].includes(page);

  var tab = function(active, label, target) {
    return (
      <button onClick={function() { navigateTo(target); }} style={{ flex: 1, padding: "12px 0 14px", textAlign: "center", fontSize: 12.5, color: active ? C.accentDeep : C.textDim, cursor: "pointer", background: "transparent", border: "none", fontWeight: active ? 700 : 500, position: "relative" }}>
        {active && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 3, background: C.accent, borderRadius: 3 }}></div>}
        {label}
      </button>
    );
  };

  return (
    <div style={{ width: "100%", maxWidth: 390, minWidth: 320, margin: "0 auto", height: "100dvh", minHeight: 600, background: "linear-gradient(180deg, " + C.bgGradTop + " 0%, " + C.bg + " 35%)", color: C.text, display: "flex", flexDirection: "column", fontFamily: "'Noto Sans SC', sans-serif", position: "relative", overflow: "hidden", borderRadius: 24, border: "1px solid " + C.border, boxShadow: "0 20px 60px rgba(200,160,120,0.18)" }}>

      {/* ===== 危机响应页 ===== */}
      {page === "crisis" && (
        <div style={Object.assign({}, scrollableMain, { opacity: pageTransition ? 1 : 0, transition: "opacity 0.15s ease" })}>
          <div style={{ padding: "16px 20px" }}><button onClick={function() { navigateTo("home"); }} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer" }}>← 返回首页</button></div>
          <div style={{ padding: "10px 28px 30px", textAlign: "left" }}>
            <div style={{ fontSize: 40, marginBottom: 12, textAlign: "center" }}>💛</div>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: C.text, marginBottom: 12, textAlign: "center", fontFamily: "'Baloo 2', cursive" }}>我听到你说的话了</h2>
            <p style={{ color: C.text, fontSize: 14, lineHeight: 1.85, marginBottom: 16 }}>你说的这些不是小事。<br />我能陪你聊「今晚为什么没睡」这件事，但你现在感受到的，比这要深得多——这种时候你需要真人，那才能真的接住你。</p>
            <p style={{ color: C.text, fontSize: 14, lineHeight: 1.85, marginBottom: 20 }}>下面这些电话 24 小时都有人在等你：</p>
            <div style={{ background: C.card, borderRadius: 16, padding: "16px 18px", border: "1px solid " + C.border, marginBottom: 12 }}>
              <p style={{ color: C.accentDeep, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📞 24h 心理援助热线</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div><p style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>北京心理危机研究与干预中心</p><p style={{ color: C.accentDeep, fontSize: 16, fontWeight: 700, fontFamily: "'Baloo 2', cursive" }}>010-82951332</p></div>
                <div><p style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>全国心理援助热线</p><p style={{ color: C.accentDeep, fontSize: 16, fontWeight: 700, fontFamily: "'Baloo 2', cursive" }}>400-161-9995</p></div>
                <div><p style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>希望 24 热线</p><p style={{ color: C.accentDeep, fontSize: 16, fontWeight: 700, fontFamily: "'Baloo 2', cursive" }}>400-161-9995</p></div>
              </div>
            </div>
            <div style={{ background: C.greenSoft, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
              <p style={{ color: C.text, fontSize: 12.5, lineHeight: 1.75 }}>🌿 你不需要"问题严重到一定程度"才能打——任何让你难以承受的感受都值得被听到。</p>
            </div>
            <p style={{ color: C.textMuted, fontSize: 12, lineHeight: 1.7, marginBottom: 20, textAlign: "center" }}>如果你身边有信任的家人或朋友，也可以现在告诉 TA。<br />你不必一个人扛。</p>
            <button onClick={function() { setPage("home"); }} style={{ width: "100%", background: C.accent, color: "#fff", border: "none", borderRadius: 22, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 6px 18px " + C.accent + "55" }}>好，我先回去 💛</button>
          </div>
        </div>
      )}

      {/* ===== 呼吸页 ===== */}
      {page === "breathing" && (
        <div style={Object.assign({}, scrollableMain, { opacity: pageTransition ? 1 : 0, transition: "opacity 0.15s ease" })}>
          <div style={{ padding: "16px 20px", position: "sticky", top: 0, background: C.bg, zIndex: 5 }}>
            <button onClick={function() { setPage("home"); }} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer" }}>← 返回</button>
          </div>
          <div style={{ minHeight: "calc(100% - 50px)" }}>
            <BreathingExercise onDone={function() { recordSession(selectedType); setPage("home"); }} />
          </div>
        </div>
      )}

      {/* ===== 首页 ===== */}
      {page === "home" && (
        <div style={Object.assign({}, scrollableMain, { opacity: pageTransition ? 1 : 0, transition: "opacity 0.15s ease" })}>
          {/* 新发现庆祝 toast */}
          {newDiscovery && (
            <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 50, animation: "fadeSlideUp 0.4s ease", pointerEvents: "none" }}>
              <div style={{ background: C.card, borderRadius: 20, padding: "10px 20px", boxShadow: "0 8px 32px rgba(200,150,100,0.2)", border: "1px solid " + C.accent + "44", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 22 }}>{newDiscovery.emoji}</span>
                <span style={{ color: C.accentDeep, fontSize: 13, fontWeight: 600 }}>{newDiscovery.name}</span>
              </div>
            </div>
          )}
          <div style={{ position: "absolute", top: 30, right: 40, fontSize: 14, animation: "twinkle 3s infinite", pointerEvents: "none" }}>✨</div>
          <div style={{ position: "absolute", top: 90, left: 30, fontSize: 11, animation: "twinkle 2.4s infinite 0.5s", pointerEvents: "none" }}>⭐</div>
          <div style={{ padding: "38px 28px 16px", textAlign: "center" }}>
            <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 6 }}>现在是</p>
            <p style={{ fontSize: 58, fontWeight: 600, color: C.text, letterSpacing: -1, fontFamily: "'Baloo 2', cursive" }}>{currentTime}</p>
          </div>
          <div style={{ padding: "0 28px", textAlign: "center", marginBottom: 26 }}>
            <div style={{ display: "inline-block", background: C.card, borderRadius: 20, padding: "7px 18px", border: "1px solid " + C.border }}>
              <span style={{ color: C.accentDeep, fontSize: 13, fontWeight: 600 }}>🎯 今晚目标 {targetTime} 入睡</span>
            </div>
          </div>
          <div style={{ padding: "0 28px", marginBottom: 16 }}>
            <button onClick={startChat} style={{ width: "100%", padding: "17px", borderRadius: 20, background: "linear-gradient(135deg, " + C.accent + ", " + C.accentDeep + ")", border: "none", color: "#fff", fontSize: 17, fontWeight: 700, cursor: "pointer", fontFamily: "'Baloo 2', cursive", letterSpacing: 0.5, boxShadow: "0 10px 28px " + C.accent + "55" }}>开始今晚的入睡 🌙</button>
            <p style={{ textAlign: "center", color: C.textMuted, fontSize: 12, marginTop: 11, lineHeight: 1.6 }}>我会先听你说说今晚的状态<br />再陪你用最适合你的方式入睡</p>
          </div>
          <div style={{ padding: "0 28px 16px" }}>
            <button onClick={function() { navigateTo("morning"); }} style={{ width: "100%", padding: "13px 16px", borderRadius: 18, background: "linear-gradient(135deg, #ffd4b8, " + C.pinkSoft + ")", border: "1px solid " + C.border, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
              <span style={{ fontSize: 28 }}>☀️</span>
              <div style={{ flex: 1 }}><p style={{ color: C.text, fontSize: 13.5, fontWeight: 700 }}>明早早点 · 看看昨晚 + 记录今早</p><p style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>早起就能吃上一份早餐 🥐</p></div>
              <span style={{ color: C.accentDeep, fontSize: 16, fontWeight: 700 }}>›</span>
            </button>
          </div>
          <div style={{ padding: "0 28px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 11 }}>
              <div style={{ background: C.card, borderRadius: 18, padding: "15px", border: "1px solid " + C.border }}>
                <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 5 }}>昨晚入睡</p>
                <p style={{ fontSize: 23, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive" }}>{displaySleepTime}</p>
                <p style={{ color: C.green, fontSize: 11, marginTop: 3, fontWeight: 600 }}>↑ 比上周早18分钟</p>
              </div>
              <div style={{ background: C.card, borderRadius: 18, padding: "15px", border: "1px solid " + C.border }}>
                <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 5 }}>连续达标</p>
                <p style={{ fontSize: 23, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive" }}>{displayStreak} <span style={{ fontSize: 13 }}>天</span></p>
                <p style={{ color: C.accent, fontSize: 11, marginTop: 3, fontWeight: 600 }}>🔥 继续保持</p>
              </div>
            </div>
            <button onClick={function() { navigateTo("quiz"); setQuizStep(0); setQuizAnswers([]); }} style={{ width: "100%", background: "linear-gradient(135deg, " + C.pinkSoft + ", " + C.accentSoft + ")", borderRadius: 18, padding: "15px 16px", border: "1px solid " + C.border, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12, marginBottom: 11 }}>
              <span style={{ fontSize: 26 }}>🔮</span>
              <div style={{ flex: 1 }}><p style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>测测你的熬夜人格</p><p style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>3 题测出主导人格 + 专属干预方案</p></div>
              <span style={{ color: C.textDim, fontSize: 18 }}>›</span>
            </button>
            <div style={{ background: C.card, borderRadius: 18, padding: "15px", border: "1px solid " + C.border }}>
              <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 9 }}>最近的熬夜小动物</p>
              <div style={{ display: "flex", gap: 8 }}>
                {["revenge", "anxiety", "revenge", "inertia", "work"].map(function(t, i) {
                  return <div key={i} style={{ width: 38, height: 38, borderRadius: 12, background: typeConfig[t].soft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>{typeConfig[t].emoji}</div>;
                })}
              </div>
            </div>
            <div style={{ marginTop: 16, padding: "13px 16px", background: C.greenSoft, borderRadius: 14 }}>
              <p style={{ color: C.text, fontSize: 12, lineHeight: 1.85 }}>🌿 我能陪你的，是「今晚为什么没睡」这件小事。<br />长期睡不着、心里一直很难受、有伤害自己的念头——那些更深的事我帮不了你。<br />那时候你需要的是真人，不是 AI 💛</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== 晨间页 ===== */}
      {page === "morning" && (
        <div style={Object.assign({}, scrollableMain, { opacity: pageTransition ? 1 : 0, transition: "opacity 0.15s ease" })}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={function() { navigateTo("home"); }} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer" }}>← </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>明早早点 ☀️</span>
          </div>
          <div style={{ padding: "10px 28px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 38, marginBottom: 6 }}>☀️</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive", marginBottom: 4 }}>早上好</p>
            <p style={{ color: C.textMuted, fontSize: 12.5 }}>现在是 07:23 · 你比昨天早醒 18 分钟 💛</p>
          </div>
          <div style={{ padding: "0 24px 30px" }}>
            <div style={{ background: "linear-gradient(135deg, " + C.accentSoft + ", " + C.pinkSoft + ")", borderRadius: 20, padding: "18px 20px", border: "1px solid " + C.border, marginBottom: 14 }}>
              <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>昨晚的睡眠</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <div><p style={{ color: C.text, fontSize: 24, fontWeight: 700, fontFamily: "'Baloo 2', cursive" }}>{displaySleepTime} 入睡</p><p style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>睡了 7 小时 41 分</p></div>
                <div style={{ textAlign: "right" }}><p style={{ color: C.accentDeep, fontSize: 12.5, fontWeight: 600 }}>比上周早 28 分钟</p></div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: 12, padding: "10px 14px", marginTop: 10 }}>
                <p style={{ color: C.text, fontSize: 12.5, lineHeight: 1.7 }}>💛 比目标晚了一点点没关系——比上周已经进步了。<br /><span style={{ color: C.accentDeep, fontWeight: 600 }}>🦊 一只新的小狐狸来你的小窝安家了。</span></p>
              </div>
            </div>
            <div style={{ background: C.card, borderRadius: 20, padding: "18px 20px", border: "1px solid " + C.border, marginBottom: 14 }}>
              {!todayBreakfast ? (
                <div>
                  <p style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 4, fontFamily: "'Baloo 2', cursive" }}>🥐 今早吃了什么呀?</p>
                  <p style={{ color: C.textMuted, fontSize: 11.5, marginBottom: 14, lineHeight: 1.6 }}>选一个或几个 · 随意,没有对错</p>
                  <BreakfastPicker customBreakfasts={customBreakfastList} onConfirm={Object.assign(function(pickedItems) {
                    // pickedItems 现在是 [{emoji, name}, ...] 数组
                    setTodayBreakfast(pickedItems);
                    // 更新收集计数
                    setCollectedBreakfasts(function(prev) {
                      var next = Object.assign({}, prev);
                      pickedItems.forEach(function(item) {
                        next[item.emoji] = (next[item.emoji] || 0) + 1;
                      });
                      return next;
                    });
                    // 检查是否有新发现
                    var newOnes = pickedItems.filter(function(item) {
                      return !collectedBreakfasts[item.emoji];
                    });
                    if (newOnes.length > 0) {
                      setNewDiscovery(newOnes[0]);
                    }
                  }, {
                    _addCustom: function(item) {
                      // 添加到自定义早餐列表 (去重)
                      setCustomBreakfastList(function(prev) {
                        if (prev.some(function(p) { return p.emoji === item.emoji && p.name === item.name; })) return prev;
                        return [].concat(prev, [item]);
                      });
                    }
                  })} />
                </div>
              ) : (
                <div>
                  <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 6 }}>今早的早餐</p>
                  <p style={{ fontSize: 32, marginBottom: 6 }}>{todayBreakfast.map(function(b) { return b.emoji; }).join(" ")}</p>
                  <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 4 }}>{todayBreakfast.map(function(b) { return b.name; }).join("、")}</p>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>记下啦 ✨ 已加进你的早餐图鉴</p>
                  {newDiscovery && (
                    <div style={{ background: C.accentSoft, borderRadius: 14, padding: "10px 14px", marginBottom: 12, animation: "fadeSlideUp 0.4s ease" }}>
                      <p style={{ color: C.accentDeep, fontSize: 13, fontWeight: 600 }}>🎉 新发现！「{newDiscovery.emoji} {newDiscovery.name}」首次加入图鉴</p>
                    </div>
                  )}
                  <button onClick={function() { setNestTab("breakfasts"); navigateTo("collection"); }} style={{ width: "100%", background: C.accent, color: "#fff", border: "none", borderRadius: 16, padding: "11px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px " + C.accent + "44" }}>查看完整图鉴 →</button>
                </div>
              )}
            </div>
            <div style={{ padding: "12px 16px", background: C.greenSoft, borderRadius: 14, marginBottom: 16 }}>
              <p style={{ color: C.text, fontSize: 11.5, lineHeight: 1.85, textAlign: "center" }}>🌿 早睡 → 早起 → 吃上一份早餐<br /><span style={{ color: C.textMuted }}>这就是为什么昨晚那一觉值得 💛</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ===== 测评页 ===== */}
      {page === "quiz" && (
        <div style={Object.assign({}, scrollableMain, { opacity: pageTransition ? 1 : 0, transition: "opacity 0.15s ease" })}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, background: C.bgGradTop, zIndex: 5 }}>
            <button onClick={function() { navigateTo("home"); }} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer" }}>← </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>熬夜人格测评</span>
          </div>
          {quizStep < quizQuestions.length ? (
            <div style={{ padding: "10px 28px 28px" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 30 }}>
                {quizQuestions.map(function(_, i) { return <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= quizStep ? C.accent : C.border }}></div>; })}
              </div>
              <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 8 }}>第 {quizStep + 1} / {quizQuestions.length} 题</p>
              <p style={{ fontSize: 20, color: C.text, fontWeight: 700, marginBottom: 28, lineHeight: 1.5, fontFamily: "'Baloo 2', cursive" }}>{quizQuestions[quizStep].q}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {quizQuestions[quizStep].opts.map(function(opt, i) {
                  return <button key={i} onClick={function() { answerQuiz(opt.type); }} style={{ background: C.card, border: "1.5px solid " + C.border, borderRadius: 16, padding: "16px 18px", cursor: "pointer", textAlign: "left", color: C.text, fontSize: 14, lineHeight: 1.5, transition: "all 0.15s" }} onMouseOver={function(e) { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentSoft; }} onMouseOut={function(e) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}>{opt.t}</button>;
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: "10px 22px 28px" }}>
              <SolutionView type={quizResult()} />
              <button onClick={function() { navigateTo("home"); }} style={{ width: "100%", background: C.accent, color: "#fff", border: "none", borderRadius: 22, padding: "14px 40px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 18px " + C.accent + "55", fontFamily: "'Baloo 2', cursive" }}>好的，记住啦 💛</button>
            </div>
          )}
        </div>
      )}

      {/* ===== 对话页 ===== */}
      {page === "chat" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, opacity: pageTransition ? 1 : 0, transition: "opacity 0.15s ease" }}>
          <div style={{ padding: "13px 18px", display: "flex", alignItems: "center", borderBottom: "1px solid " + C.border, background: C.card, flexShrink: 0 }}>
            <button onClick={function() { setPage("home"); }} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 14, cursor: "pointer", marginRight: 10 }}>←</button>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, " + C.accent + ", " + C.pink + ")", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginRight: 10 }}>🌙</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>今晚早点</p>
              <p style={{ fontSize: 11, color: C.accent }}>{selectedType ? typeConfig[selectedType].emoji + " 陪你的" + typeConfig[selectedType].label + "夜晚" : "正在陪你入睡…"}</p>
            </div>
            {chatStartedAt && chatElapsed > 0 && (
              <div style={{ textAlign: "right", padding: "4px 10px", borderRadius: 10, background: chatElapsed >= 15 ? C.pinkSoft : "transparent" }}>
                <p style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.2 }}>已对话</p>
                <p style={{ fontSize: 12, color: chatElapsed >= 15 ? C.accentDeep : C.text, fontWeight: 700, lineHeight: 1.2 }}>{chatElapsed} 分钟</p>
              </div>
            )}
          </div>
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "18px 16px", minHeight: 0 }}>
            {messages.map(function(msg, i) { return <ChatMessage key={i} msg={msg} isLast={i === messages.length - 1} />; })}
            {isTyping && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 14, alignItems: "flex-end", gap: 8, animation: "fadeSlideUp 0.3s ease" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, " + C.accent + ", " + C.pink + ")", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌙</div>
                <div style={{ padding: "13px 18px", borderRadius: "4px 18px 18px 18px", background: C.card, border: "1px solid " + C.border, display: "flex", alignItems: "center", gap: 6 }}>
                  {[0, 1, 2].map(function(i) { return <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, opacity: 0.7, animation: "typingBounce 1.4s ease-in-out " + (i * 0.16) + "s infinite" }}></div>; })}
                </div>
              </div>
            )}
            {showTypeSelect && (
              <div style={{ animation: "fadeSlideUp 0.4s ease", marginTop: 6 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(typeConfig).map(function(entry) {
                    var key = entry[0], cfg = entry[1];
                    return (
                      <button key={key} onClick={function() { selectType(key); }} style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, border: "1.5px solid " + C.border, borderRadius: 16, padding: "11px 14px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }} onMouseOver={function(e) { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.background = cfg.soft; }} onMouseOut={function(e) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.soft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21 }}>{cfg.emoji}</div>
                        <div><p style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{cfg.sublabel}</p><p style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{cfg.desc}</p></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {showQuickReplies && (
              <div style={{ animation: "fadeSlideUp 0.4s ease", display: "flex", flexDirection: "column", gap: 8, marginTop: 10, alignItems: "flex-end" }}>
                {showQuickReplies.map(function(reply, i) {
                  return <button key={i} onClick={function() { handleQuickReply(reply); }} style={{ background: C.card, border: "1.5px solid " + C.accent + "55", borderRadius: 20, padding: "10px 18px", color: C.accentDeep, fontSize: 13.5, cursor: "pointer", fontWeight: 500, transition: "all 0.15s", maxWidth: "85%", textAlign: "right" }} onMouseOver={function(e) { e.currentTarget.style.background = C.accentSoft; }} onMouseOut={function(e) { e.currentTarget.style.background = C.card; }}>{reply}</button>;
                })}
              </div>
            )}
          </div>
          {selectedType && !showTypeSelect && (
            <div style={{ borderTop: "1px solid " + C.border, background: C.card, padding: "10px 14px", flexShrink: 0, display: "flex", gap: 8, alignItems: "center" }}>
              <input type="text" value={inputValue} onChange={function(e) { setInputValue(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") handleFreeChat(); }} placeholder="想说什么都可以，我在听…" style={{ flex: 1, background: C.cardSoft, border: "1px solid " + C.border, borderRadius: 22, padding: "11px 16px", fontSize: 13.5, color: C.text, fontFamily: "'Noto Sans SC', sans-serif" }} />
              <button onClick={handleFreeChat} disabled={!inputValue.trim()} style={{ background: inputValue.trim() ? "linear-gradient(135deg, " + C.accent + ", " + C.accentDeep + ")" : C.border, border: "none", borderRadius: "50%", width: 38, height: 38, cursor: inputValue.trim() ? "pointer" : "default", color: "#fff", fontSize: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>↑</button>
            </div>
          )}
        </div>
      )}

      {/* ===== 小窝页 ===== */}
      {page === "collection" && (
        <div style={Object.assign({}, scrollableMain, { opacity: pageTransition ? 1 : 0, transition: "opacity 0.15s ease" })}>
          <div style={{ padding: "20px 24px 8px" }}>
            <h2 style={{ fontSize: 21, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive" }}>我的小窝 🏠</h2>
            <p style={{ color: C.textMuted, fontSize: 12, marginTop: 3 }}>{nestTab === "animals" ? "每次好好睡觉，就有小动物来安家" : "每次早起吃上的早餐，都记一笔"}</p>
          </div>
          <div style={{ padding: "8px 24px 0", display: "flex", gap: 8 }}>
            <button onClick={function() { setNestTab("animals"); }} style={{ flex: 1, padding: "10px", borderRadius: 14, background: nestTab === "animals" ? C.accent : C.cardSoft, color: nestTab === "animals" ? "#fff" : C.text, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>🦊 入睡小动物</button>
            <button onClick={function() { setNestTab("breakfasts"); }} style={{ flex: 1, padding: "10px", borderRadius: 14, background: nestTab === "breakfasts" ? C.accent : C.cardSoft, color: nestTab === "breakfasts" ? "#fff" : C.text, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>🥐 早餐图鉴</button>
          </div>
          {nestTab === "animals" && (
            <div style={{ padding: "12px 24px 28px" }}>
              <div style={{ background: "linear-gradient(135deg, " + C.accentSoft + ", " + C.pinkSoft + ")", borderRadius: 20, padding: "18px", border: "1px solid " + C.border, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>已收集 {dynamicAnimals.filter(function(a){return !a.locked && a.count > 0;}).length} / {dynamicAnimals.length} 只</span>
                  <span style={{ color: C.accentDeep, fontSize: 11.5, fontWeight: 600 }}>{displayStreak >= 7 ? "🌌 星空小窝已解锁！" : "再连续 " + (7 - displayStreak) + " 天解锁星空小窝 🌌"}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "#fff", overflow: "hidden" }}><div style={{ width: (dynamicAnimals.filter(function(a){return !a.locked && a.count > 0;}).length / dynamicAnimals.length * 100) + "%", height: "100%", background: "linear-gradient(90deg, " + C.accent + ", " + C.pink + ")", borderRadius: 4 }}></div></div>
              </div>
              <div style={{ background: C.card, borderRadius: 20, padding: "16px 18px", border: "1px solid " + C.border, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <p style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>🐟 今晚的小鱼干</p>
                  <p style={{ color: C.textMuted, fontSize: 11 }}>用来喂养小动物</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {todayTreats.map(function(t, i) {
                    return <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: t.earned ? C.accentSoft : C.cardSoft, border: "1px dashed " + (t.earned ? C.accent + "55" : C.border) }}>
                      <span style={{ fontSize: 22, opacity: t.earned ? 1 : 0.4 }}>{t.icon}</span>
                      <div style={{ flex: 1 }}><p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{t.label}</p><p style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{t.desc}</p></div>
                      {t.earned ? <span style={{ color: C.accent, fontSize: 18 }}>✓</span> : <span style={{ color: C.textDim, fontSize: 12 }}>待领取</span>}
                    </div>;
                  })}
                </div>
                <div style={{ marginTop: 12, padding: "10px 14px", background: C.pinkSoft, borderRadius: 12 }}>
                  <p style={{ color: C.text, fontSize: 11.5, lineHeight: 1.75 }}>🌿 这些小动物不是用来打卡的——它们只在你真的好好睡了一晚之后，才悄悄来到你的小窝。<br /><span style={{ color: C.textMuted }}>每一只都是一个被你温柔对待的夜晚。</span></p>
                </div>
              </div>
              <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 10, marginTop: 4, fontWeight: 600 }}>我的小动物 · 喂养它们会升级 ↓</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {dynamicAnimals.map(function(a, i) {
                  return <div key={i} style={{ background: a.locked ? C.cardSoft : C.card, borderRadius: 18, padding: "18px 14px", border: "1px solid " + (a.rare && !a.locked ? C.accent + "66" : C.border), textAlign: "center", position: "relative", opacity: a.locked ? 0.55 : 1 }}>
                    {a.rare && !a.locked && <div style={{ position: "absolute", top: 8, right: 8, fontSize: 11 }}>✨</div>}
                    {!a.locked && a.level >= 2 && <div style={{ position: "absolute", top: 6, left: 8, fontSize: 10, background: C.accent, color: "#fff", borderRadius: 8, padding: "1px 6px", fontWeight: 700 }}>Lv.{a.level}</div>}
                    <div style={{ fontSize: 40, marginBottom: 8, filter: a.locked ? "grayscale(1)" : "none", position: "relative" }}>{a.locked ? "❓" : a.emoji}{a.accessory && !a.locked && <span style={{ position: "absolute", top: -4, right: "30%", fontSize: 16 }}>{a.accessory}</span>}</div>
                    <p style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{a.locked ? "未解锁" : a.name}</p>
                    <p style={{ color: C.textMuted, fontSize: 10.5, marginTop: 3, lineHeight: 1.4 }}>{a.desc}</p>
                    {!a.locked && a.count > 0 && <div style={{ display: "inline-block", marginTop: 8, background: a.rare ? C.accentSoft : C.cardSoft, borderRadius: 10, padding: "2px 10px", fontSize: 11, color: C.accentDeep, fontWeight: 600 }}>×{a.count}</div>}
                  </div>;
                })}
              </div>
              <div style={{ background: C.greenSoft, borderRadius: 16, padding: "14px 16px", marginTop: 18 }}>
                <p style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>🌿 关于偶尔的熬夜</p>
                <p style={{ color: C.text, fontSize: 12.5, lineHeight: 1.75 }}>熬夜了不会清零 — 小动物只是去旅行了，明天还会回到你的小窝。<br />我们不追求完美，只陪你慢慢变好。这是经过研究验证的 — 自我关怀比自我批评更能帮你改变。</p>
              </div>
            </div>
          )}
          {nestTab === "breakfasts" && (
            <div style={{ padding: "12px 24px 28px" }}>
              {(function() {
                var allItems = [].concat(breakfastCatalog, customBreakfastList);
                var total = allItems.length;
                var collected = allItems.filter(function(b) { return collectedBreakfasts[b.emoji] > 0; }).length;
                var totalCount = Object.values(collectedBreakfasts).reduce(function(s, n) { return s + n; }, 0);
                return (
                  <div style={{ background: "linear-gradient(135deg, " + C.pinkSoft + ", " + C.greenSoft + ")", borderRadius: 20, padding: "18px", border: "1px solid " + C.border, marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                      <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>已收集 {collected} / {total} 种</span>
                      <span style={{ color: C.accentDeep, fontSize: 11.5, fontWeight: 600 }}>累计 {totalCount} 份早餐 ✨</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "#fff", overflow: "hidden" }}><div style={{ width: (collected / total * 100) + "%", height: "100%", background: "linear-gradient(90deg, " + C.accent + ", " + C.pink + ")", borderRadius: 4 }}></div></div>
                  </div>
                );
              })()}
              <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 10, marginTop: 4, fontWeight: 600 }}>常见早餐 ↓</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
                {breakfastCatalog.map(function(b, i) {
                  var count = collectedBreakfasts[b.emoji] || 0;
                  var coll = count > 0;
                  return <div key={i} style={{ background: coll ? C.card : C.cardSoft, borderRadius: 14, padding: "12px 6px", border: "1px solid " + C.border, textAlign: "center", opacity: coll ? 1 : 0.45, position: "relative" }}>
                    <div style={{ fontSize: 28, marginBottom: 4, filter: coll ? "none" : "grayscale(1)" }}>{coll ? b.emoji : "❓"}</div>
                    <p style={{ color: C.text, fontSize: 10.5, fontWeight: coll ? 600 : 500 }}>{coll ? b.name : "未收集"}</p>
                    {coll && count > 0 && <div style={{ marginTop: 4, fontSize: 10, color: C.accentDeep, fontWeight: 700 }}>×{count}</div>}
                  </div>;
                })}
              </div>
              {/* 用户自定义发现的早餐 */}
              {customBreakfastList.length > 0 && (
                <div>
                  <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 10, marginTop: 4, fontWeight: 600 }}>🔍 我的发现 ↓</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
                    {customBreakfastList.map(function(b, i) {
                      var count = collectedBreakfasts[b.emoji] || 0;
                      var coll = count > 0;
                      return <div key={"custom-"+i} style={{ background: coll ? C.card : C.cardSoft, borderRadius: 14, padding: "12px 6px", border: "1px solid " + (coll ? C.accent + "44" : C.border), textAlign: "center", position: "relative" }}>
                        {coll && <div style={{ position: "absolute", top: 4, right: 4, fontSize: 8, background: C.accent, color: "#fff", borderRadius: 6, padding: "1px 4px", fontWeight: 700 }}>新</div>}
                        <div style={{ fontSize: 28, marginBottom: 4 }}>{b.emoji}</div>
                        <p style={{ color: C.text, fontSize: 10.5, fontWeight: 600 }}>{b.name}</p>
                        {coll && count > 0 && <div style={{ marginTop: 4, fontSize: 10, color: C.accentDeep, fontWeight: 700 }}>×{count}</div>}
                      </div>;
                    })}
                  </div>
                </div>
              )}
              <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 10, marginTop: 4, fontWeight: 600 }}>限定 / 联名 ↓</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
                {limitedBreakfasts.map(function(b, i) {
                  return <div key={i} style={{ background: C.cardSoft, borderRadius: 14, padding: "12px 6px", border: "1px dashed " + C.border, textAlign: "center", opacity: 0.55 }}>
                    <div style={{ fontSize: 26, marginBottom: 4, filter: "grayscale(0.5)" }}>{b.emoji}</div>
                    <p style={{ color: C.text, fontSize: 10.5, fontWeight: 600 }}>{b.name}</p>
                    <p style={{ color: C.textMuted, fontSize: 9, marginTop: 3, lineHeight: 1.3 }}>{b.unlock}</p>
                  </div>;
                })}
              </div>
              <div style={{ background: C.greenSoft, borderRadius: 16, padding: "14px 16px" }}>
                <p style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>🌿 关于早餐图鉴</p>
                <p style={{ color: C.text, fontSize: 12.5, lineHeight: 1.75 }}>不论今早吃的是什么，都值得被记一笔 💛<br />这里不分对错——不分有没有营养——只是记录。每一份都是你那一早对自己温柔的方式。</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== 画像页 ===== */}
      {page === "dashboard" && (
        <div style={Object.assign({}, scrollableMain, { opacity: pageTransition ? 1 : 0, transition: "opacity 0.15s ease" })}>
          <div style={{ padding: "20px 24px 6px" }}>
            <h2 style={{ fontSize: 21, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive" }}>我的熬夜画像 📊</h2>
            <p style={{ color: C.textMuted, fontSize: 12, marginTop: 3 }}>了解自己，是温柔改变的第一步</p>
          </div>
          <div style={{ padding: "14px 24px 28px" }}>
            <div style={{ background: "linear-gradient(135deg, " + C.accentSoft + ", " + C.card + ")", borderRadius: 20, padding: "18px", border: "1px solid " + C.border, marginBottom: 14 }}>
              <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 4 }}>本周平均入睡时间</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 34, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive" }}>23:38</span>
                <span style={{ color: C.green, fontSize: 13, fontWeight: 600 }}>↑ 比上周早 22 分钟</span>
              </div>
              <p style={{ color: C.textMuted, fontSize: 11, marginTop: 6 }}>睡眠效率 87% · 已达到健康区间 ✓</p>
            </div>
            <div style={{ background: C.card, borderRadius: 20, padding: "18px", border: "1px solid " + C.border, marginBottom: 14 }}>
              <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 14 }}>本周入睡时间</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 160 }}>
                {weeklyData.map(function(entry, i) {
                  var barHeight = 28 + clamp((entry.time - 22) / 3.5, 0, 1) * 92;
                  var barColor = typeConfig[entry.type] ? typeConfig[entry.type].color : C.accent;
                  return <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ color: C.textMuted, fontSize: 10, lineHeight: 1 }}>{formatTime(entry.time)}</div>
                    <div style={{ width: "100%", height: 120, display: "flex", alignItems: "flex-end" }}>
                      <div style={{ width: "100%", height: barHeight, borderRadius: "12px 12px 4px 4px", background: "linear-gradient(180deg, " + barColor + ", " + barColor + "cc)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)" }}></div>
                    </div>
                    <div style={{ color: C.textMuted, fontSize: 11, fontWeight: 600 }}>{entry.day}</div>
                  </div>;
                })}
              </div>
              <p style={{ color: C.textDim, fontSize: 11, textAlign: "center", marginTop: 10 }}>Color = animal type</p>
            </div>
            <div style={{ background: C.card, borderRadius: 20, padding: "18px", border: "1px solid " + C.border, marginBottom: 14 }}>
              <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 12 }}>熬夜类型分布（近 30 天）</p>
              <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                <div style={{ width: 120, height: 120, borderRadius: "50%", background: buildTypeDistributionGradient(typeDistribution), display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <div style={{ width: 68, height: 68, borderRadius: "50%", background: C.card, border: "1px solid " + C.border, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(90,74,63,0.06)" }}>
                    <span style={{ color: C.text, fontSize: 14, fontWeight: 700, fontFamily: "'Baloo 2', cursive", lineHeight: 1 }}>30</span>
                    <span style={{ color: C.textMuted, fontSize: 10, lineHeight: 1.2, marginTop: 3 }}>Days</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, minWidth: 120 }}>
                  {typeDistribution.map(function(item, i) {
                    return <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: item.color, flexShrink: 0 }}></div>
                      <span style={{ color: C.textMuted, fontSize: 12, flex: 1 }}>{item.name}</span>
                      <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{item.value}%</span>
                    </div>;
                  })}
                </div>
              </div>
            </div>
            <div style={{ background: "linear-gradient(135deg, " + C.pinkSoft + ", " + C.accentSoft + ")", borderRadius: 20, padding: "18px", border: "1px solid " + C.border }}>
              <p style={{ color: C.accentDeep, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>💡 AI 给你的观察</p>
              <p style={{ color: C.text, fontSize: 13, lineHeight: 1.85 }}>你的熬夜以「报复型」为主，多出现在工作日。周日晚上偶尔会转向「焦虑型」——可能和周一的压力有关。</p>
              <p style={{ color: C.text, fontSize: 13, lineHeight: 1.85, marginTop: 8 }}>好消息是: 这周你比上周平均早睡了 22 分钟 💛 「浓缩快乐」的方式对你最有效，继续保持就好，不用急。</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== 底部导航 ===== */}
      {showBottomNav && (
        <div style={{ display: "flex", borderTop: "1px solid " + C.border, background: C.card, paddingBottom: 4, flexShrink: 0 }}>
          {tab(page === "home", "🌙 今晚", "home")}
          {tab(page === "collection", "🦊 小窝", "collection")}
          {tab(page === "dashboard", "📊 画像", "dashboard")}
        </div>
      )}
    </div>
  );
}

/* ============ 入口: 包裹 Onboarding ============ */
function AppWrapper() {
  var [showOnboarding, setShowOnboarding] = useState(function() {
    return !localStorage.getItem("jwzd_onboarded");
  });

  var handleOnboardingComplete = function() {
    localStorage.setItem("jwzd_onboarded", "true");
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppWrapper />);
