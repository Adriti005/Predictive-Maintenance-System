'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DUMMY_TURBINE_DATA = [
  { id: "TRB-001", rpm: 3200, temp: 520, pressure: 28.5, vibration: 2.1, power: 85, risk: 85, status: "FAULT",  isReal: false },
  { id: "TRB-002", rpm: 3050, temp: 495, pressure: 27.2, vibration: 1.8, power: 80, risk: 58, status: "FAULT",  isReal: false },
  { id: "TRB-003", rpm: 3400, temp: 540, pressure: 29.8, vibration: 2.5, power: 90, risk: 12, status: "NORMAL", isReal: false },
  { id: "TRB-004", rpm: 3100, temp: 505, pressure: 27.8, vibration: 1.5, power: 82, risk: 7,  status: "NORMAL", isReal: false },
  { id: "TRB-005", rpm: 3300, temp: 528, pressure: 29.1, vibration: 2.8, power: 88, risk: 72, status: "FAULT",  isReal: false },
  { id: "TRB-006", rpm: 3150, temp: 510, pressure: 28.0, vibration: 1.6, power: 84, risk: 9,  status: "NORMAL", isReal: false },
  { id: "TRB-007", rpm: 3250, temp: 515, pressure: 28.3, vibration: 1.9, power: 86, risk: 61, status: "FAULT",  isReal: false },
  { id: "TRB-008", rpm: 3000, temp: 488, pressure: 26.8, vibration: 1.4, power: 79, risk: 6,  status: "NORMAL", isReal: false },
];

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  FAULT:  { color: "#6025c0", bg: "rgba(124,58,237,0.10)", border: "rgba(124,58,237,0.25)", label: "FAULT"  },
  NORMAL: { color: "#0a7a76", bg: "rgba(14,165,160,0.10)", border: "rgba(14,165,160,0.25)", label: "NORMAL" },
};

function RiskBar({ value, status }: { value: number; status: string }) {
  const color = status === "FAULT" ? "#7c3aed" : "#0ea5a0";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 90, height: 5, background: "rgba(0,0,0,0.08)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color, minWidth: 34 }}>{value}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { color: "#6025c0", bg: "rgba(124,58,237,0.10)", border: "rgba(124,58,237,0.25)", label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 6, background: cfg.bg, color: cfg.color, fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.08em", border: `1px solid ${cfg.border}` }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color?: string }) {
  return (
    <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: "20px 22px", border: "1px solid rgba(0,0,0,0.08)", position: "relative", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      {color && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}44)`, borderRadius: "16px 16px 0 0" }} />}
      <div style={{ fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: "#6b7a99", marginBottom: 8, letterSpacing: "0.08em" }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 30, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: color || "#0d1b2e", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: "#4a5568", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

type ActionCardProps = { icon: React.ReactNode; title: string; desc: string; cta: string; streak: string; accentColor: string; accentBg: string; tags: string[]; onClick: () => void; };

function ActionCard({ icon, title, desc, cta, streak, accentColor, accentBg, tags, onClick }: ActionCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ flex: 1, background: hovered ? `rgba(${accentBg}, 0.04)` : "#fff", borderRadius: 20, padding: 0, border: `1px solid ${hovered ? `rgba(${accentBg}, 0.30)` : "rgba(0,0,0,0.08)"}`, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", transition: "all 0.3s ease", overflow: "hidden", boxShadow: hovered ? `0 20px 48px rgba(${accentBg}, 0.12)` : "0 2px 8px rgba(0,0,0,0.05)", transform: hovered ? "translateY(-4px)" : "translateY(0)" }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${streak}, ${streak}44)`, borderRadius: "20px 20px 0 0" }} />
      <div style={{ padding: "24px 28px 0", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, background: `rgba(${accentBg}, 0.10)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: accentColor, border: `1px solid rgba(${accentBg}, 0.18)` }}>{icon}</div>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "3px", padding: "4px 10px", borderRadius: 6, background: `rgba(${accentBg}, 0.10)`, color: accentColor, border: `1px solid rgba(${accentBg}, 0.18)` }}>ANALYSIS</span>
      </div>
      <div style={{ flex: 1, padding: "18px 28px" }}>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "1.45rem", fontWeight: 700, color: "#0d1b2e", marginBottom: 10 }}>{title}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: "#4a5568", lineHeight: 1.65, marginBottom: 18 }}>{desc}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {tags.map(tag => (
            <span key={tag} style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.8px", padding: "4px 10px", borderRadius: 6, background: `rgba(${accentBg}, 0.07)`, border: `1px solid rgba(${accentBg}, ${hovered ? "0.30" : "0.15"})`, color: hovered ? accentColor : "#6b7a99", transition: "all 0.3s" }}>{tag}</span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderTop: "1px solid rgba(0,0,0,0.06)", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: hovered ? accentColor : "#6b7a99", transition: "all 0.3s" }}>
        <span>{cta}</span>
        <span style={{ transition: "transform 0.3s ease", transform: hovered ? "translateX(5px)" : "translateX(0)", fontSize: "1.1rem" }}>→</span>
      </div>
    </button>
  );
}

export default function TurbineDiagnostics() {
  const [view, setView] = useState<"dashboard" | "fleet">("dashboard");
  const [filter, setFilter] = useState("All");
  const [allData, setAllData] = useState(DUMMY_TURBINE_DATA as any[]);
  const [realFaults, setRealFaults] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch(`http://127.0.0.1:5050/turbine-history?email=${localStorage.getItem('user_email') || ''}`)
      .then(r => r.json())
      .then((real: any[]) => {
        const realRows = real.slice(0, 5).map((r, i) => ({
          id: `LIVE-${i + 1}`,
          rpm: r.rpm || "-",
          temp: r.temp || "-",
          pressure: r.pressure || "-",
          vibration: r.vibration || "-",
          power: r.power || "-",
          risk: Math.round(r.confidence),
          status: r.prediction === "NORMAL" ? "NORMAL" : "FAULT",
          isReal: true,
          time: new Date(r.created_at).toLocaleTimeString(),
        }));
        setRealFaults(real.filter((r: any) => r.prediction === "FAULT").length);
        setAllData([...realRows, ...DUMMY_TURBINE_DATA]);
      })
      .catch(() => setAllData(DUMMY_TURBINE_DATA));
  }, []);

  const normal = DUMMY_TURBINE_DATA.filter(m => m.status === "NORMAL").length;
  const fault  = DUMMY_TURBINE_DATA.filter(m => m.status === "FAULT").length + realFaults;

  const filtered = allData.filter(m =>
    filter === "All" ? true :
    filter === "Fault" ? m.status === "FAULT" : true
  );

  const tabs = ["All", "Fault"];
  const goToPrediction = () => router.push("/turbine");
  const handleBack = () => router.push("/");

  return (
    <main style={{ minHeight: "100vh", background: "#F0F4F8", fontFamily: "'DM Sans', sans-serif", color: "#1a2744", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        table { border-collapse: collapse; width: 100%; }
        tr:hover td { background: rgba(124,58,237,0.03) !important; }
        .diag-back-btn { background: #fff; border: 1px solid rgba(0,0,0,0.10); color: #4a5568; border-radius: 8px; padding: 6px 14px; cursor: pointer; font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 600; transition: all 0.2s ease; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .diag-back-btn:hover { color: #6025c0; border-color: rgba(124,58,237,0.30); background: rgba(124,58,237,0.05); }
        .filter-tab { padding: 6px 18px; border-radius: 8px; font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 700; cursor: pointer; transition: all 0.15s; border: 1px solid rgba(0,0,0,0.10); background: #fff; color: #6b7a99; }
        .filter-tab.active { background: rgba(124,58,237,0.10); color: #6025c0; border-color: rgba(124,58,237,0.28); }
        .filter-tab:not(.active):hover { color: #0d1b2e; border-color: rgba(0,0,0,0.20); }
      `}</style>

      {/* Background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 55% at 15% 25%, rgba(124,58,237,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 75%, rgba(244,121,32,0.06) 0%, transparent 60%), repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(0,0,0,0.025) 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(0,0,0,0.025) 80px)" }} />

      <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
          <button className="diag-back-btn" onClick={handleBack}>← Back</button>
          <div style={{ position: "relative", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2.5px solid #7c3aed" }} />
            <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: "2.5px solid #F47920" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#7c3aed" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "#0d1b2e" }}>Turbine Diagnostics</span>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "3px", padding: "3px 8px", borderRadius: 5, background: "rgba(124,58,237,0.10)", color: "#6025c0", border: "1px solid rgba(124,58,237,0.22)" }}>TURBINE</span>
            </div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", fontWeight: 600, color: "#6b7a99", letterSpacing: "2px" }}>INDIANOIL PREDICTIVE MAINTENANCE — FLEET OVERVIEW &amp; FAULT DETECTION</div>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 40 }}>
          <StatCard label="Total Turbines" value={DUMMY_TURBINE_DATA.length} sub="Across 2 facilities" />
          <StatCard label="Normal"    value={normal}                   sub="Operating normally"  color="#0ea5a0" />
          <StatCard label="Fault"     value={fault}                    sub="Immediate action"    color="#7c3aed" />
          <StatCard label="Monitored" value={DUMMY_TURBINE_DATA.length} sub="Under surveillance" color="#f47920" />
        </div>

        {view === "dashboard" && (
          <>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#6025c0", letterSpacing: "3px", marginBottom: 20 }}>TURBINE ANALYSIS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <ActionCard
                icon={<svg viewBox="0 0 64 64" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><circle cx="32" cy="32" r="20"/><path d="M32 12 C40 20 40 44 32 52"/><path d="M32 12 C24 20 24 44 32 52"/><circle cx="32" cy="32" r="4" fill="currentColor" opacity="0.4" stroke="none"/></svg>}
                title="New Prediction" desc="Enter turbine sensor readings — RPM, temperature, pressure, vibration, power output — and get an instant NORMAL / FAULT classification." cta="Run single turbine analysis" streak="#7c3aed" accentColor="#6025c0" accentBg="124,58,237" tags={["5 Sensors", "Fault Detection", "RPM Analysis"]} onClick={goToPrediction} />
              <ActionCard
                icon={<svg viewBox="0 0 64 64" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="8,48 22,30 32,38 44,20 56,10"/><polyline points="44,10 56,10 56,22"/><line x1="8" y1="56" x2="56" y2="56"/><line x1="8" y1="56" x2="8" y2="10"/></svg>}
                title="Fleet Risk Forecast" desc="View all 8 turbines ranked by failure probability. See sensor trend data, fault states, and recommended maintenance windows." cta="View fleet risk overview" streak="#F47920" accentColor="#c45e0a" accentBg="244,121,32" tags={["8 Turbines", "Risk Ranking", "Maintenance Windows"]} onClick={() => setView("fleet")} />
            </div>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.68rem", color: "#6b7a99", letterSpacing: "1px", textAlign: "center", marginTop: 40 }}>Models trained on real industrial sensor datasets · Binary classification</p>
          </>
        )}

        {view === "fleet" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <button className="diag-back-btn" onClick={() => setView("dashboard")}>← Back</button>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#6025c0", letterSpacing: "3px" }}>FLEET STATUS</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {tabs.map(t => <button key={t} className={`filter-tab${filter === t ? " active" : ""}`} onClick={() => setFilter(t)}>{t}</button>)}
            </div>
            <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <table>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                    {["Turbine ID", "RPM", "Temp (°C)", "Pressure (bar)", "Vibration", "Power (MW)", "Failure Risk", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: "#6b7a99", fontWeight: 700, letterSpacing: "0.08em", background: "#F7F9FC" }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", borderLeft: t.isReal ? "3px solid #7c3aed" : "none" }}>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700, color: "#6025c0" }}>
                          {t.id} {t.isReal && <span style={{ fontSize: 9, color: "#7c3aed", fontWeight: 700 }}>●LIVE</span>}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#4a5568" }}>{t.isReal ? t.time : t.rpm}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#4a5568" }}>{t.temp}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#4a5568" }}>{t.pressure}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#4a5568" }}>{t.vibration}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#4a5568" }}>{t.power}</td>
                      <td style={{ padding: "14px 18px" }}><RiskBar value={t.risk} status={t.status} /></td>
                      <td style={{ padding: "14px 18px" }}><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600, color: "#6b7a99", letterSpacing: "1px", marginTop: 14, textAlign: "right" }}>SHOWING {filtered.length} OF {allData.length} TURBINES</div>
          </>
        )}
      </div>
    </main>
  );
}