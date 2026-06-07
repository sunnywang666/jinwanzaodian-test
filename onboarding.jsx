/* ============================================================
   「今晚早点」 新手引导 — 首次访问时显示的 3 屏欢迎流程
   ============================================================ */
var { useState, useEffect, useRef } = React;

function OnboardingFlow({ onComplete }) {
  var [step, setStep] = useState(0);
  var [visible, setVisible] = useState(true);
  var totalSteps = 3;

  var goNext = function() {
    if (step >= totalSteps - 1) {
      onComplete();
      return;
    }
    setVisible(false);
    setTimeout(function() {
      setStep(function(s) { return s + 1; });
      setVisible(true);
    }, 280);
  };

  var goBack = function() {
    if (step <= 0) return;
    setVisible(false);
    setTimeout(function() {
      setStep(function(s) { return s - 1; });
      setVisible(true);
    }, 280);
  };

  /* --- 浮动装饰元素 --- */
  var Deco = function() {
    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "8%", right: "15%", fontSize: 14, opacity: 0.5, animation: "obTwinkle 3s ease-in-out infinite" }}>✨</div>
        <div style={{ position: "absolute", top: "18%", left: "12%", fontSize: 10, opacity: 0.4, animation: "obTwinkle 2.5s ease-in-out 0.8s infinite" }}>⭐</div>
        <div style={{ position: "absolute", bottom: "22%", right: "10%", fontSize: 11, opacity: 0.35, animation: "obTwinkle 3.2s ease-in-out 1.5s infinite" }}>⭐</div>
        <div style={{ position: "absolute", top: "35%", left: "8%", fontSize: 8, opacity: 0.3, animation: "obTwinkle 2.8s ease-in-out 0.3s infinite" }}>✨</div>
        <div style={{ position: "absolute", bottom: "35%", left: "18%", fontSize: 12, opacity: 0.3, animation: "obTwinkle 3.5s ease-in-out 2s infinite" }}>✨</div>
      </div>
    );
  };

  /* --- 进度点 --- */
  var Dots = function() {
    return (
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }}>
        {[0, 1, 2].map(function(i) {
          return <div key={i} style={{
            width: step === i ? 24 : 8, height: 8, borderRadius: 4,
            background: step === i ? C.accent : C.border,
            transition: "all 0.3s ease",
          }}></div>;
        })}
      </div>
    );
  };

  /* ======= Screen 1: 欢迎 ======= */
  var Screen1 = function() {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "0 36px", textAlign: "center" }}>
        {/* 月亮动画 */}
        <div style={{ position: "relative", marginBottom: 32, width: 120, height: 120 }}>
          <div style={{
            width: 100, height: 100, borderRadius: "50%",
            background: "linear-gradient(135deg, #f0a868, #f4b8c1)",
            boxShadow: "0 0 60px rgba(240, 168, 104, 0.35), 0 0 120px rgba(240, 168, 104, 0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 52, animation: "obFloat 4s ease-in-out infinite",
            position: "absolute", top: 10, left: 10,
          }}>🌙</div>
        </div>

        <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 6, letterSpacing: 1 }}>嘿，欢迎来到</p>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive", marginBottom: 8, letterSpacing: 1 }}>今晚早点</h1>
        <p style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.8, maxWidth: 260 }}>
          一个陪你好好睡觉的小伙伴
        </p>

        {/* 小动物们 */}
        <div style={{ display: "flex", gap: 12, marginTop: 36, fontSize: 28 }}>
          {["🦊", "🐰", "🦝", "🐻", "🦉", "🐱"].map(function(e, i) {
            return <span key={i} style={{
              animation: "obFloat " + (3 + i * 0.3) + "s ease-in-out " + (i * 0.2) + "s infinite",
              display: "inline-block",
            }}>{e}</span>;
          })}
        </div>
      </div>
    );
  };

  /* ======= Screen 2: 使用方式 ======= */
  var Screen2 = function() {
    var steps = [
      { icon: "🗣️", title: "聊几句", desc: "告诉我今晚为什么还没睡" },
      { icon: "🧘", title: "放松一下", desc: "跟我做几次深呼吸" },
      { icon: "😴", title: "好好睡", desc: "带着平静入睡，收获小动物" },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "0 32px", textAlign: "center" }}>
        <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 6, letterSpacing: 1 }}>每一个夜晚</p>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive", marginBottom: 36 }}>三步，温柔入睡</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 280 }}>
          {steps.map(function(s, i) {
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 16,
                background: C.card, borderRadius: 18, padding: "16px 18px",
                border: "1px solid " + C.border,
                boxShadow: "0 2px 12px rgba(180,150,120,0.06)",
                /* no CSS animation — React transition handles fade */
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: i === 0 ? C.accentSoft : i === 1 ? C.pinkSoft : C.greenSoft,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                }}>{s.icon}</div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>{s.title}</p>
                  <p style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ position: "absolute", left: "56px", marginTop: 60, width: 2, height: 12, background: C.border }}></div>
                )}
              </div>
            );
          })}
        </div>

        {/* 连接线 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 24 }}>
          <div style={{ width: 2, height: 0 }}></div>
        </div>
      </div>
    );
  };

  /* ======= Screen 3: 数据说明 + 开始 ======= */
  var Screen3 = function() {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "0 32px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 24, animation: "obFloat 3s ease-in-out infinite" }}>💛</div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "'Baloo 2', cursive", marginBottom: 20 }}>在你开始之前</h2>

        <div style={{
          background: C.card, borderRadius: 20, padding: "20px 22px",
          border: "1px solid " + C.border, marginBottom: 24,
          boxShadow: "0 4px 20px rgba(180,150,120,0.08)",
          textAlign: "left", width: "100%", maxWidth: 300,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>📊</span>
            <p style={{ color: C.text, fontSize: 13, lineHeight: 1.75 }}>
              我们<strong style={{ color: C.accentDeep }}>预设了一些演示数据</strong>，让你能看到完整的体验效果
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>✨</span>
            <p style={{ color: C.text, fontSize: 13, lineHeight: 1.75 }}>
              当你<strong style={{ color: C.accentDeep }}>开始互动后</strong>，这些数据会真实更新
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>🦊</span>
            <p style={{ color: C.text, fontSize: 13, lineHeight: 1.75 }}>
              每完成一次对话，你的小窝里就会多一只<strong style={{ color: C.accentDeep }}>小动物</strong>
            </p>
          </div>
        </div>

        <p style={{ color: C.textMuted, fontSize: 12.5, lineHeight: 1.7, marginBottom: 8 }}>
          准备好了吗？
        </p>
      </div>
    );
  };

  var screens = [Screen1, Screen2, Screen3];
  var CurrentScreen = screens[step];

  return (
    <div style={{
      width: "100%", maxWidth: 390, margin: "0 auto",
      height: "100vh", minHeight: 600,
      background: "linear-gradient(180deg, " + C.bgGradTop + " 0%, " + C.bg + " 50%, #fef3e8 100%)",
      color: C.text, display: "flex", flexDirection: "column",
      fontFamily: "'Noto Sans SC', sans-serif", position: "relative", overflow: "hidden",
      borderRadius: 24, border: "1px solid " + C.border,
      boxShadow: "0 20px 60px rgba(200,160,120,0.18)",
    }}>
      <Deco />

      {/* 跳过按钮 */}
      {step < totalSteps - 1 && (
        <div style={{ position: "absolute", top: 20, right: 24, zIndex: 10 }}>
          <button onClick={onComplete} style={{
            background: "transparent", border: "none",
            color: C.textMuted, fontSize: 13, cursor: "pointer",
            padding: "6px 12px", borderRadius: 20,
          }}>跳过</button>
        </div>
      )}

      {/* 内容区域 */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        paddingTop: 60, paddingBottom: 20,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}>
        <CurrentScreen />
      </div>

      {/* 底部区域：进度点 + 按钮 */}
      <div style={{ padding: "0 36px 40px", flexShrink: 0 }}>
        <Dots />

        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && (
            <button onClick={goBack} style={{
              flex: "0 0 auto", padding: "14px 20px", borderRadius: 22,
              background: C.cardSoft, border: "1px solid " + C.border,
              color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>←</button>
          )}
          <button onClick={goNext} style={{
            flex: 1, padding: "14px 28px", borderRadius: 22,
            background: step === totalSteps - 1
              ? "linear-gradient(135deg, " + C.accent + ", " + C.accentDeep + ")"
              : C.accent,
            border: "none", color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Baloo 2', cursive",
            boxShadow: "0 8px 24px " + C.accent + "44",
            letterSpacing: step === totalSteps - 1 ? 1 : 0,
          }}>
            {step === totalSteps - 1 ? "开始今晚的旅程 🌙" : "下一步"}
          </button>
        </div>
      </div>
    </div>
  );
}

window.OnboardingFlow = OnboardingFlow;
