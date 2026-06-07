/* ============================================================
   「今晚早点」 对话引擎 — LLM 调用、危机检测、槽位提取、回复生成
   ============================================================ */

/* ============ LLM Service (AIPing → Claude fallback → 关键词引擎) ============ */
const LLM_CONFIG = {
  // AIPing 平台 — OpenAI 兼容接口 (GitHub Pages 部署时使用)
  endpoint: window.__CHAT_API_URL__ || "",
};

// 方式 1: 调 AIPing API (OpenAI 兼容)
async function callAIPing(systemPrompt, allMessages) {
  if (!LLM_CONFIG.endpoint) {
    throw new Error("Chat API endpoint not configured");
  }
  var response = await fetch(LLM_CONFIG.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system: systemPrompt,
      messages: allMessages,
    }),
  });
  if (!response.ok) {
    var errBody = "";
    try { errBody = await response.text(); } catch(e2) {}
    throw new Error("Chat API " + response.status + ": " + errBody.substring(0, 200));
  }
  var data = await response.json();
  if (typeof data.reply === "string") {
    return data.reply.trim();
  }
  return null;
}

// 方式 2: 调内置 Claude API (在 Claude 预览环境中可用)
async function callClaudeFallback(systemPrompt, allMessages) {
  if (typeof window === "undefined" || !window.claude || !window.claude.complete) {
    throw new Error("window.claude not available");
  }
  // window.claude.complete 用 Anthropic 格式: system 单独传
  var systemMsg = allMessages[0].role === "system" ? allMessages[0].content : "";
  var chatMsgs = allMessages.filter(function(m) { return m.role !== "system"; });
  var text = await window.claude.complete({
    system: systemMsg,
    messages: chatMsgs,
  });
  return (text || "").trim();
}

// 主入口: AIPing → Claude fallback → 返回 null (走关键词引擎)
async function callLLM(persona, messageHistory, userText) {
  var systemPrompt = personaSystemPrompts[persona] || personaSystemPrompts.mixed;
  var recentHistory = messageHistory.slice(-12).map(function(m) {
    return { role: m.role === "ai" ? "assistant" : "user", content: m.text };
  });
  var allMessages = [{ role: "system", content: systemPrompt }]
    .concat(recentHistory)
    .concat([{ role: "user", content: userText }]);

  // 尝试 AIPing API
  try {
    var result = await callAIPing(systemPrompt, allMessages);
    if (result) { console.log("[LLM] AIPing 响应成功"); return result; }
  } catch (e) {
    console.warn("[LLM] AIPing 失败:", e.message);
  }

  // 尝试内置 Claude API (demo 环境)
  try {
    var result2 = await callClaudeFallback(systemPrompt, allMessages);
    if (result2) { console.log("[LLM] Claude fallback 响应成功"); return result2; }
  } catch (e2) {
    console.warn("[LLM] Claude fallback 失败:", e2.message);
  }

  // 都失败 → 返回 null, 由关键词引擎兜底
  console.warn("[LLM] 所有 LLM 调用失败, 使用关键词引擎");
  return null;
}

/* ============ 危机识别 ============ */
function detectCrisis(text) {
  var lower = text.toLowerCase();
  return crisisKeywords.some(function(kw) { return lower.includes(kw.toLowerCase()); });
}

/* ============ 槽位提取 ============ */
function extractSlots(text) {
  var slots = {};
  var t = text.trim();
  var timeMatch = t.match(/(?:凌晨|早上|晚上|中午|下午|上午)?\s*(\d{1,2})\s*[点:：.时]\s*(半|\d{1,2})?/);
  if (timeMatch) {
    var h = parseInt(timeMatch[1]);
    var min = 0;
    if (timeMatch[2]) min = timeMatch[2] === "半" ? 30 : parseInt(timeMatch[2]);
    if (/下午|晚上/.test(t) && h < 12) h += 12;
    if (h >= 0 && h <= 24 && min >= 0 && min < 60) { slots.hour = h; slots.minute = min; }
  }
  for (var activity in activityKeywords) {
    if (activityKeywords[activity].some(function(kw) { return t.includes(kw); })) {
      slots.activity = activity; break;
    }
  }
  var lower = t.toLowerCase();
  if (refusalSignals.some(function(r) { return lower === r || lower.startsWith(r + " ") || lower === r + "。" || lower === r + "？"; })) {
    slots.refused = true;
  }
  return slots;
}

/* ============ 智能回复生成 ============ */
function generateReply(type, text, state) {
  var newSlots = extractSlots(text);
  var slots = Object.assign({}, state.slots, newSlots);
  var trimmed = text.trim();
  var isShort = trimmed.length <= 4;
  var wasInClose = state.closeTriggered;

  // 收尾后用户拒绝 → 回到对话
  if (wasInClose && newSlots.refused) {
    var recoverReplies = {
      revenge: "好，那就再陪你一会儿 💛 \n\n说说现在心里最想的是什么？哪怕只是一句话也行。",
      anxiety: "好，我陪你慢慢来 💛 \n\n脑子里还在转什么？说出来，我帮你接着。",
      inertia: "OK，那就不勉强 😌 \n\n但答应我一件事——别只是无意识地刷，做点你真正想做的。",
      work: "好，那继续 💛 \n\n告诉我你卡在哪儿？我帮你判断是真的非熬不可，还是「感觉非熬不可」。",
      owl: "好，那我们不急着收尾 💛 \n\n继续陪着你——还想聊点什么？",
      mixed: "好，慢慢来 💛 \n\n继续告诉我你现在的感觉。",
    };
    return { reply: recoverReplies[type] || recoverReplies.mixed, slots: slots, closeTriggered: false, closeAttempted: true };
  }

  var wrap = function(r) { return wasInClose ? Object.assign({}, r, { closeTriggered: false, closeAttempted: true }) : r; };

  // 短词承接
  if (isShort && shortAcks[trimmed]) return wrap({ reply: shortAcks[trimmed], slots: slots });

  // owl: 已给计划
  if (type === "owl" && state.planGiven) {
    var followUps = ["嗯，计划还在那儿 💛 你还想聊什么？我陪着你。", "我在 💛 计划已经定好了，你随时可以去开始。还有想说的吗？", "嗯嗯，听你说 💛"];
    var idx = (state.planFollowUpIdx || 0) % followUps.length;
    return wrap({ reply: followUps[idx], slots: slots, planFollowUpIdx: (state.planFollowUpIdx || 0) + 1 });
  }

  // owl: 收集活动 + 起床时间
  if (type === "owl" && !state.planGiven) {
    var activity = slots.activity, hour = slots.hour, minute = slots.minute;
    if (activity && typeof hour === "number") {
      var wakeStr = hour + ":" + (minute || 0).toString().padStart(2, "0");
      var deadlineHour = hour - 7.5;
      if (deadlineHour < 0) deadlineHour += 24;
      var dH = Math.floor(deadlineHour), dM = Math.round((deadlineHour - dH) * 60);
      var deadlineStr = dH + ":" + dM.toString().padStart(2, "0");
      var remindHour = deadlineHour - 10 / 60;
      if (remindHour < 0) remindHour += 24;
      var rH = Math.floor(remindHour), rM = Math.round((remindHour - rH) * 60);
      var remindStr = rH + ":" + rM.toString().padStart(2, "0");
      return wrap({ reply: "好，我帮你算了一下：\n\n你明天 " + wakeStr + " 起，要睡满 7.5 小时的话，今晚 " + deadlineStr + " 之前入睡最理想。\n\n那咱们这样安排：\n📚 现在到 " + remindStr + " → 你的" + activity + "时间\n🌙 " + remindStr + " → 我来提醒你做睡前收尾\n\n安心去" + activity + "吧，时间到了我会喊你。", slots: slots, planGiven: true });
    }
    if (activity && typeof hour !== "number") {
      return wrap({ reply: activity + "是个好选择 👍 把夜间的好状态用在有价值的事上。\n\n那明天你几点要起？告诉我具体时间，我帮你算一个不影响白天的软 deadline。", slots: slots, askedWakeUp: (state.askedWakeUp || 0) + 1 });
    }
    if (!activity && typeof hour === "number") {
      var ws = hour + ":" + (minute || 0).toString().padStart(2, "0");
      return wrap({ reply: "好，" + ws + " 起——我记住了 💛 \n\n那从现在到入睡，你打算做什么？看书、工作、还是别的？告诉我之后我帮你定 deadline。", slots: slots });
    }
  }

  // 关键词意图匹配
  var intents = intentMap[type] || [];
  var lower = text.toLowerCase();
  for (var i = 0; i < intents.length; i++) {
    for (var j = 0; j < intents[i].kw.length; j++) {
      if (lower.includes(intents[i].kw[j].toLowerCase())) return wrap({ reply: intents[i].reply, slots: slots });
    }
  }

  // fallback 池
  var pool = fallbackPool[type] || fallbackPool.mixed;
  var used = state.usedFallbacks || [];
  var available = pool.filter(function(p) { return !used.includes(p); });
  var next = available.length > 0 ? available[0] : pool[used.length % pool.length];
  return wrap({ reply: next, slots: slots, usedFallbacks: [].concat(used, [next]).slice(-pool.length) });
}

var formatTime = function(t) {
  var h = Math.floor(t);
  var m = Math.round((t - h) * 60);
  return (h > 24 ? h - 24 : h) + ":" + m.toString().padStart(2, "0");
};
