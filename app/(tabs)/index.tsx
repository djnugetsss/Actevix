import { useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const MUSCLE_GROUPS = [
  "Quads", "Hamstrings", "Calves", "Shoulders",
  "Back", "Chest", "Arms", "Knees", "Ankles"
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScoreColor(score) {
  if (score === 0) return "#2a2d3a";
  if (score < 3) return "#4ade80";
  if (score < 5) return "#facc15";
  if (score < 7.5) return "#fb923c";
  return "#ef4444";
}

function getScoreLabel(score) {
  if (score === 0) return "Normal";
  if (score < 3) return "Light";
  if (score < 5) return "Moderate";
  if (score < 7.5) return "High Stress";
  return "Injury Risk";
}

function getRiskLabel(score) {
  if (score < 3) return { label: "Low", color: "#4ade80" };
  if (score < 5.5) return { label: "Moderate", color: "#facc15" };
  if (score < 7.5) return { label: "High", color: "#fb923c" };
  return { label: "Critical", color: "#ef4444" };
}

function computeScores(log) {
  const scores = {};
  MUSCLE_GROUPS.forEach(m => { scores[m] = 0; });
  if (!log) return scores;
  const intensityFactor = log.intensity / 10;
  const durationFactor = Math.min(log.duration / 90, 1);
  const amp = 0.6 + intensityFactor * 0.8 + durationFactor * 0.6;
  log.muscles.forEach(m => { scores[m] = Math.min((scores[m] || 0) + 3 * amp, 10); });
  log.painAreas.forEach(m => { scores[m] = Math.min((scores[m] || 0) + log.painLevel * 0.8 * amp, 10); });
  return scores;
}

// ─── Body Heatmap SVG ─────────────────────────────────────────────────────────

function BodyHeatmap({ scores, view }) {
  const c = (muscle) => getScoreColor(scores[muscle] || 0);

  if (view === "front") return (
    <svg viewBox="0 0 200 420" style={{ width: "100%", maxWidth: 200, margin: "0 auto", display: "block" }}>
      <ellipse cx="100" cy="38" rx="28" ry="34" fill="#1e2130" stroke="#3a3f55" strokeWidth="1.5" />
      <rect x="88" y="68" width="24" height="18" rx="4" fill="#1e2130" stroke="#3a3f55" strokeWidth="1.5" />
      <rect x="62" y="84" width="76" height="90" rx="10" fill="#1e2130" stroke="#3a3f55" strokeWidth="1.5" />
      <ellipse cx="85" cy="105" rx="18" ry="16" fill={c("Chest")} opacity="0.85" />
      <ellipse cx="115" cy="105" rx="18" ry="16" fill={c("Chest")} opacity="0.85" />
      <ellipse cx="52" cy="98" rx="18" ry="14" fill={c("Shoulders")} opacity="0.9" />
      <ellipse cx="148" cy="98" rx="18" ry="14" fill={c("Shoulders")} opacity="0.9" />
      <rect x="28" y="106" width="20" height="70" rx="10" fill={c("Arms")} opacity="0.9" />
      <rect x="152" y="106" width="20" height="70" rx="10" fill={c("Arms")} opacity="0.9" />
      <ellipse cx="100" cy="148" rx="22" ry="18" fill={c("Back")} opacity="0.6" />
      <rect x="66" y="178" width="30" height="80" rx="14" fill={c("Quads")} opacity="0.9" />
      <rect x="104" y="178" width="30" height="80" rx="14" fill={c("Quads")} opacity="0.9" />
      <ellipse cx="81" cy="268" rx="17" ry="13" fill={c("Knees")} opacity="0.95" />
      <ellipse cx="119" cy="268" rx="17" ry="13" fill={c("Knees")} opacity="0.95" />
      <rect x="67" y="282" width="27" height="75" rx="12" fill={c("Calves")} opacity="0.9" />
      <rect x="106" y="282" width="27" height="75" rx="12" fill={c("Calves")} opacity="0.9" />
      <ellipse cx="80" cy="366" rx="16" ry="10" fill={c("Ankles")} opacity="0.95" />
      <ellipse cx="120" cy="366" rx="16" ry="10" fill={c("Ankles")} opacity="0.95" />
      <ellipse cx="80" cy="378" rx="18" ry="8" fill="#1e2130" stroke="#3a3f55" strokeWidth="1" />
      <ellipse cx="120" cy="378" rx="18" ry="8" fill="#1e2130" stroke="#3a3f55" strokeWidth="1" />
    </svg>
  );

  return (
    <svg viewBox="0 0 200 420" style={{ width: "100%", maxWidth: 200, margin: "0 auto", display: "block" }}>
      <ellipse cx="100" cy="38" rx="28" ry="34" fill="#1e2130" stroke="#3a3f55" strokeWidth="1.5" />
      <rect x="88" y="68" width="24" height="18" rx="4" fill="#1e2130" stroke="#3a3f55" strokeWidth="1.5" />
      <rect x="62" y="84" width="76" height="90" rx="10" fill="#1e2130" stroke="#3a3f55" strokeWidth="1.5" />
      <rect x="66" y="88" width="68" height="82" rx="8" fill={c("Back")} opacity="0.85" />
      <ellipse cx="52" cy="98" rx="18" ry="14" fill={c("Shoulders")} opacity="0.9" />
      <ellipse cx="148" cy="98" rx="18" ry="14" fill={c("Shoulders")} opacity="0.9" />
      <rect x="28" y="106" width="20" height="70" rx="10" fill={c("Arms")} opacity="0.9" />
      <rect x="152" y="106" width="20" height="70" rx="10" fill={c("Arms")} opacity="0.9" />
      <rect x="66" y="178" width="30" height="80" rx="14" fill={c("Hamstrings")} opacity="0.9" />
      <rect x="104" y="178" width="30" height="80" rx="14" fill={c("Hamstrings")} opacity="0.9" />
      <ellipse cx="81" cy="268" rx="17" ry="13" fill={c("Knees")} opacity="0.95" />
      <ellipse cx="119" cy="268" rx="17" ry="13" fill={c("Knees")} opacity="0.95" />
      <rect x="67" y="282" width="27" height="75" rx="12" fill={c("Calves")} opacity="0.9" />
      <rect x="106" y="282" width="27" height="75" rx="12" fill={c("Calves")} opacity="0.9" />
      <ellipse cx="80" cy="366" rx="16" ry="10" fill={c("Ankles")} opacity="0.95" />
      <ellipse cx="120" cy="366" rx="16" ry="10" fill={c("Ankles")} opacity="0.95" />
      <ellipse cx="80" cy="378" rx="18" ry="8" fill="#1e2130" stroke="#3a3f55" strokeWidth="1" />
      <ellipse cx="120" cy="378" rx="18" ry="8" fill="#1e2130" stroke="#3a3f55" strokeWidth="1" />
    </svg>
  );
}

// ─── Recovery tips ────────────────────────────────────────────────────────────

const RECOVERY_TIPS = {
  Knees: ["Low-impact only (swim, bike)", "Quad & hamstring stretches", "Ice 15 min post-activity"],
  Quads: ["Foam roll quads daily", "Hip flexor stretches", "Avoid heavy squats 48hrs"],
  Hamstrings: ["Seated hamstring stretch", "Light RDLs", "Massage gun posterior chain"],
  Calves: ["Calf raises slow eccentric", "Downward dog", "Elevate legs when resting"],
  Shoulders: ["Shoulder CARs", "Avoid overhead press", "Band pull-aparts"],
  Back: ["Cat-cow stretches", "Child's pose", "Avoid loaded spinal flexion"],
  Chest: ["Doorway chest stretch", "Light band flys", "Upper body rest day"],
  Arms: ["Forearm stretches", "Light curls only", "Ice for elbow tenderness"],
  Ankles: ["Ankle circles", "Single-leg balance", "Tape or brace for activity"],
};

const SUGGESTED_PROMPTS = [
  "How is my body recovering?",
  "Am I at risk of injury?",
  "What should I avoid today?",
  "Should I train or rest?",
];

function generateRuleBasedResponse(query, scores, logs) {
  const overall = MUSCLE_GROUPS.reduce((a, m) => a + scores[m], 0) / MUSCLE_GROUPS.length;
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0);
  const risk = getRiskLabel(overall);
  const q = query.toLowerCase();
  const hasData = top.length > 0;

  if (!hasData) {
    return "No session data logged yet. Head to the Log tab to record your first workout — once you do, I can give you personalized insights on your recovery, fatigue, and injury risk.";
  }

  if (q.includes("recover") || q.includes("how is my body")) {
    if (overall < 3) return `Your body is in great shape right now. Fatigue is low across all muscle groups${top[0] ? `, with minimal stress on your ${top[0][0].toLowerCase()}` : ""}. You're well-recovered and ready to train at full intensity.`;
    if (overall < 6) return `Recovery is moderate. Your ${top[0]?.[0]} and ${top[1]?.[0] || "surrounding areas"} are showing some fatigue. Give those areas light treatment today — stretching, foam rolling, and good hydration will help clear the soreness.`;
    return `Your body is under significant stress. ${top[0]?.[0]} is your most fatigued area at ${top[0]?.[1].toFixed(1)}/10. Prioritize sleep tonight and avoid loading those muscles further until they recover.`;
  }

  if (q.includes("risk") || q.includes("injury")) {
    if (risk.label === "Low") return `Injury risk is currently low. Your training load is balanced and no single muscle group is under excessive strain. Keep your current routine but stay consistent with warm-ups and cool-downs.`;
    if (risk.label === "Moderate") return `There's a moderate injury risk, primarily in your ${top[0]?.[0].toLowerCase()}. Repeated stress without recovery can lead to overuse injuries. Consider reducing intensity for your next session.`;
    return `Injury risk is ${risk.label.toLowerCase()}. Your ${top[0]?.[0]} is at a concerning level (${top[0]?.[1].toFixed(1)}/10). Strongly recommend a rest day or active recovery only. Pushing through could lead to a serious setback.`;
  }

  if (q.includes("avoid") || q.includes("today")) {
    const stressed = top.filter(([, v]) => v >= 5);
    if (!stressed.length) return "No major restrictions today — your load is manageable. Focus on quality movement and stay hydrated.";
    return `Avoid heavy loading on your ${stressed.map(([m]) => m.toLowerCase()).join(", ")} today. These areas are showing elevated stress. Stick to light movement, mobility work, or train in areas away from the affected zones.`;
  }

  if (q.includes("train") || q.includes("rest")) {
    if (overall < 3) return "You're good to train at full intensity today. Your fatigue levels are low and recovery looks solid.";
    if (overall < 5.5) return `You can train, but keep it moderate. Scale back intensity by about 20–30% and avoid direct loading on your ${top[0]?.[0].toLowerCase()}. A skill or technique session would be ideal.`;
    return `Rest day recommended. Your overall fatigue score is ${overall.toFixed(1)}/10 — your body needs time to rebuild. If you must move, keep it to light walking, stretching, or pool work only.`;
  }

  return `Based on your latest session, overall fatigue is ${overall.toFixed(1)}/10 (${risk.label} risk). ${top[0] ? `Your ${top[0][0].toLowerCase()} is the most stressed area at ${top[0][1].toFixed(1)}/10. ` : ""}${overall >= 5 ? "Consider a lighter day to allow recovery." : "You're in good shape to continue training."}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  wrap: { fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", color: "#e8eaf0", paddingBottom: 40 },
  greeting: { padding: "22px 18px 10px" },
  greetingDate: { fontSize: 12, color: "#4b5563", marginBottom: 4, letterSpacing: "0.04em", textTransform: "uppercase" },
  greetingTitle: { fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", color: "#fff" },
  greetingSub: { fontSize: 13, color: "#6b7280", marginTop: 3 },
  sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4b5563", padding: "18px 18px 8px" },
  card: { background: "#13151f", borderRadius: 16, padding: "16px", marginBottom: 10, border: "1px solid #1e2130", marginLeft: 12, marginRight: 12 },
  cardTitle: { fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4b5563", marginBottom: 10 },
  aiCard: { background: "linear-gradient(135deg, #0f1f0f 0%, #111827 60%, #0d0f1a 100%)", borderRadius: 20, padding: "20px", marginBottom: 10, border: "1px solid #1a3320", marginLeft: 12, marginRight: 12 },
  aiHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 },
  aiDot: { width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" },
  aiLabel: { fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4ade80" },
  aiBadge: { marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)", letterSpacing: "0.06em" },
  promptRow: { display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 },
  promptChip: { padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid #1a3320", background: "rgba(74,222,128,0.06)", color: "#6b7280" },
  aiInput: { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid #1a3320", borderRadius: 12, color: "#e8eaf0", padding: "12px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", resize: "none", lineHeight: 1.5, fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", minHeight: 76 },
  aiBtn: (disabled) => ({ marginTop: 10, width: "100%", padding: "12px", borderRadius: 12, background: "#4ade80", color: "#0d0f1a", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", opacity: disabled ? 0.5 : 1 }),
  aiResponse: { marginTop: 14, padding: "14px", background: "rgba(74,222,128,0.06)", borderRadius: 12, border: "1px solid rgba(74,222,128,0.12)" },
  aiResponseLabel: { fontSize: 10, color: "#4ade80", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" },
  aiResponseText: { fontSize: 14, lineHeight: 1.7, color: "#d1d5db" },
  statRow: { display: "flex", gap: 10, marginBottom: 14 },
  statBox: (color) => ({ flex: 1, background: "#0d0f1a", borderRadius: 12, padding: "12px 10px", textAlign: "center", border: `1px solid ${color}22` }),
  statVal: (color, size = 20) => ({ fontSize: size, fontWeight: 700, color, letterSpacing: "-0.5px" }),
  statLbl: { fontSize: 10, color: "#4b5563", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" },
  scoreRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  scoreBar: { flex: 1, height: 7, background: "#1e2130", borderRadius: 4, overflow: "hidden" },
  scoreBarFill: (score) => ({ height: "100%", width: `${Math.min(score * 10, 100)}%`, background: getScoreColor(score), borderRadius: 4, transition: "width 0.5s ease" }),
  recoveryTip: { fontSize: 13, color: "#9ca3af", marginBottom: 5, paddingLeft: 12, borderLeft: "2px solid #1e2130", lineHeight: 1.5 },
  viewToggle: { display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 },
  viewBtn: (active) => ({ padding: "7px 20px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${active ? "#4ade80" : "#1e2130"}`, background: active ? "rgba(74,222,128,0.12)" : "#0d0f1a", color: active ? "#4ade80" : "#6b7280" }),
  legendRow: { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 14 },
  legendItem: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280" },
  legendDot: (color) => ({ width: 9, height: 9, borderRadius: "50%", background: color }),
  noData: { textAlign: "center", padding: "16px 0 6px", fontSize: 13, color: "#4b5563" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardTab() {
  const [bodyView, setBodyView] = useState("front");
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const logs = (() => {
    try { return JSON.parse(localStorage.getItem("actevix_logs") || "[]"); } catch { return []; }
  })();

  const latestLog = logs[0] || null;
  const scores = computeScores(latestLog);
  const overall = MUSCLE_GROUPS.reduce((a, m) => a + scores[m], 0) / MUSCLE_GROUPS.length;
  const risk = getRiskLabel(overall);
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0);
  const recoveryMuscles = top.filter(([, v]) => v >= 5).map(([m]) => m);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const handleAiSend = (query) => {
    const q = query || aiInput;
    if (!q.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    setTimeout(() => {
      setAiResponse(generateRuleBasedResponse(q, scores, logs));
      setAiLoading(false);
    }, 700);
    setAiInput("");
  };

  return (
    <div style={S.wrap}>

      {/* Greeting */}
      <div style={S.greeting}>
        <div style={S.greetingDate}>{dateStr}</div>
        <div style={S.greetingTitle}>{greeting} 👋</div>
        <div style={S.greetingSub}>
          {latestLog ? `Last logged: ${latestLog.date} · ${latestLog.sport}` : "No sessions logged yet — start in the Log tab"}
        </div>
      </div>

      {/* ── 1. AI INSIGHT ─────────────────────────────────────────────────── */}
      <div style={S.sectionLabel}>AI Insight</div>
      <div style={S.aiCard}>
        <div style={S.aiHeader}>
          <div style={S.aiDot} />
          <div style={S.aiLabel}>Actevix AI</div>
          <div style={S.aiBadge}>API READY</div>
        </div>

        <div style={S.promptRow}>
          {SUGGESTED_PROMPTS.map(p => (
            <button key={p} style={S.promptChip} onClick={() => handleAiSend(p)}>{p}</button>
          ))}
        </div>

        <textarea
          style={S.aiInput}
          placeholder="Ask about your recovery, risk, or training readiness..."
          value={aiInput}
          onChange={e => setAiInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiSend(); } }}
          rows={3}
        />
        <button style={S.aiBtn(!aiInput.trim() && !aiLoading)} onClick={() => handleAiSend()} disabled={aiLoading}>
          {aiLoading ? "Thinking..." : "Ask AI →"}
        </button>

        {aiResponse && (
          <div style={S.aiResponse}>
            <div style={S.aiResponseLabel}>Response</div>
            <div style={S.aiResponseText}>{aiResponse}</div>
          </div>
        )}
      </div>

      {/* ── 2. DAILY SUMMARY ──────────────────────────────────────────────── */}
      <div style={S.sectionLabel}>Daily Summary</div>
      <div style={S.card}>
        <div style={S.statRow}>
          <div style={S.statBox(getScoreColor(overall))}>
            <div style={S.statVal(getScoreColor(overall))}>{overall > 0 ? overall.toFixed(1) : "—"}</div>
            <div style={S.statLbl}>Fatigue</div>
          </div>
          <div style={S.statBox(risk.color)}>
            <div style={S.statVal(risk.color)}>{overall > 0 ? risk.label : "—"}</div>
            <div style={S.statLbl}>Risk Level</div>
          </div>
          <div style={S.statBox(top[0] ? getScoreColor(top[0][1]) : "#4b5563")}>
            <div style={S.statVal(top[0] ? getScoreColor(top[0][1]) : "#4b5563", 14)}>
              {top[0] ? top[0][0] : "—"}
            </div>
            <div style={S.statLbl}>Most Stressed</div>
          </div>
        </div>

        {top.length > 0 ? top.map(([m, v]) => (
          <div key={m} style={S.scoreRow}>
            <div style={{ width: 88, fontSize: 12, color: "#9ca3af" }}>{m}</div>
            <div style={S.scoreBar}><div style={S.scoreBarFill(v)} /></div>
            <div style={{ width: 70, fontSize: 11, color: getScoreColor(v), textAlign: "right" }}>{getScoreLabel(v)}</div>
          </div>
        )) : (
          <div style={S.noData}>Log a session to see your fatigue breakdown →</div>
        )}
      </div>

      {/* Recovery */}
      {recoveryMuscles.length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>💊 Recovery Suggestions</div>
          {recoveryMuscles.map(m => (
            <div key={m} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: getScoreColor(scores[m]), marginBottom: 6 }}>
                {m} <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 400 }}>· {getScoreLabel(scores[m])}</span>
              </div>
              {(RECOVERY_TIPS[m] || ["Rest and monitor", "Stay hydrated"]).map((tip, i) => (
                <div key={i} style={S.recoveryTip}>{tip}</div>
              ))}
            </div>
          ))}
          <div style={{ marginTop: 10, padding: "10px 12px", background: "#0d0f1a", borderRadius: 10, fontSize: 12, color: "#6b7280" }}>
            💧 Hydrate · 😴 8hrs sleep · 🧘 10min mobility daily
          </div>
        </div>
      )}

      {/* ── 3. HEATMAP ────────────────────────────────────────────────────── */}
      <div style={S.sectionLabel}>Heatmap</div>
      <div style={S.card}>
        <div style={S.viewToggle}>
          <button style={S.viewBtn(bodyView === "front")} onClick={() => setBodyView("front")}>Front</button>
          <button style={S.viewBtn(bodyView === "back")} onClick={() => setBodyView("back")}>Back</button>
        </div>
        <BodyHeatmap scores={scores} view={bodyView} />
        <div style={S.legendRow}>
          {[["#2a2d3a", "Normal"], ["#4ade80", "Light"], ["#facc15", "Moderate"], ["#fb923c", "High"], ["#ef4444", "Risk"]].map(([color, label]) => (
            <div key={label} style={S.legendItem}>
              <div style={S.legendDot(color)} />{label}
            </div>
          ))}
        </div>
        {!latestLog && <div style={{ ...S.noData, marginTop: 10 }}>Log a session to see heatmap colors</div>}
      </div>

    </div>
  );
}