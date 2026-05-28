'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";

const motorData = [
  { id: "MTR-001", type: "M", rpm: 1487, torque: 42.1, toolWear: 198, risk: 88, status: "CRITICAL" },
  { id: "MTR-002", type: "H", rpm: 1612, torque: 38.4, toolWear: 145, risk: 62, status: "FAULTY" },
  { id: "MTR-003", type: "L", rpm: 1390, torque: 55.2, toolWear: 211, risk: 71, status: "FAULTY" },
  { id: "MTR-004", type: "M", rpm: 1530, torque: 40.0, toolWear: 87,  risk: 14, status: "HEALTHY" },
  { id: "MTR-005", type: "H", rpm: 1710, torque: 29.7, toolWear: 32,  risk: 8,  status: "HEALTHY" },
  { id: "MTR-006", type: "M", rpm: 1465, torque: 47.8, toolWear: 167, risk: 55, status: "FAULTY" },
  { id: "MTR-007", type: "L", rpm: 1350, torque: 51.0, toolWear: 93,  risk: 11, status: "HEALTHY" },
  { id: "MTR-008", type: "H", rpm: 1580, torque: 36.3, toolWear: 42,  risk: 6,  status: "HEALTHY" },
  { id: "MTR-009", type: "M", rpm: 1498, torque: 43.6, toolWear: 119, risk: 19, status: "HEALTHY" },
  { id: "MTR-010", type: "L", rpm: 1420, torque: 49.1, toolWear: 76,  risk: 16, status: "HEALTHY" },
];

type Status = "CRITICAL" | "FAULTY" | "HEALTHY";

const statusConfig: Record<Status, { color: string; bg: string; label: string }> = {
  CRITICAL: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "CRITICAL" },
  FAULTY:   { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "FAULTY" },
  HEALTHY:  { color: "#22c55e", bg: "rgba(34,197,94,0.12)",  label: "HEALTHY" },
};

function RiskBar({ value, status }: { value: number; status: Status }) {
  const color = status === "CRITICAL" ? "#ef4444" : status === "FAULTY" ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 100, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color, minWidth: 34 }}>{value}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
      border: `1px solid ${cfg.color}33`
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color?: string }) {
  return (
    <div style={{
      flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10,
      padding: "16px 20px", border: "1px solid rgba(255,255,255,0.07)"
    }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 6, letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: color || "#fff", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#666", marginTop: 5 }}>{sub}</div>
    </div>
  );
}

function ActionCard({ icon, title, desc, cta, onClick }: {
  icon: string; title: string; desc: string; cta: string; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1, background: hovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
        borderRadius: 12, padding: 24, border: "1px solid rgba(255,255,255,0.08)",
        cursor: "pointer", transition: "all 0.2s ease"
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: title === "New prediction" ? "rgba(99,102,241,0.25)" : "rgba(180,130,30,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, marginBottom: 14
      }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 16 }}>{desc}</div>
      <div style={{ fontSize: 13, color: "#818cf8", display: "flex", alignItems: "center", gap: 4 }}>
        <span>→</span> <span>{cta}</span> <span style={{ fontSize: 11 }}>↗</span>
      </div>
    </div>
  );
}

type Props = { onBack?: () => void }

export default function MotorDiagnostics({ onBack }: Props) {
  const [view, setView] = useState<"dashboard" | "fleet">("dashboard");
  const [filter, setFilter] = useState("All");
  const router = useRouter();

  const healthy  = motorData.filter(m => m.status === "HEALTHY").length;
  const atRisk   = motorData.filter(m => m.status === "FAULTY").length;
  const critical = motorData.filter(m => m.status === "CRITICAL").length;

  const filtered = motorData.filter(m =>
    filter === "All" ? true :
    filter === "Critical" ? m.status === "CRITICAL" :
    filter === "At risk" ? m.status === "FAULTY" : true
  );

  const tabs = ["All", "Critical", "At risk"];

  // Navigate to prediction form — goes to /motor (the MotorPage)
  const goToPrediction = () => {
    router.push("/motor");
  };

  // Go back to homepage
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0f1117",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      color: "#e2e8f0", padding: "0"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0f1117; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        table { border-collapse: collapse; width: 100%; }
        tr:hover td { background: rgba(255,255,255,0.025) !important; }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Back button to homepage */}
            <button
              onClick={handleBack}
              style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#aaa", borderRadius: 6, padding: "5px 12px", cursor: "pointer",
                fontSize: 12, fontFamily: "inherit", marginRight: 4
              }}
            >← Back</button>
            <div style={{
              width: 44, height: 44, background: "rgba(99,102,241,0.2)", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              border: "1px solid rgba(99,102,241,0.3)"
            }}>⚙️</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Motor Diagnostics</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>IndianOil Predictive Maintenance — Fleet overview & fault detection</div>
            </div>
          </div>
          <div style={{ color: "#555", cursor: "pointer", fontSize: 18, padding: 4 }}>⋯</div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          <StatCard label="Total motors" value={motorData.length} sub="Across 3 facilities" />
          <StatCard label="Healthy" value={healthy} sub="Operating normally" color="#22c55e" />
          <StatCard label="At risk" value={atRisk} sub="Monitoring required" color="#f59e0b" />
          <StatCard label="Critical" value={critical} sub="Immediate action" color="#ef4444" />
        </div>

        {view === "dashboard" && (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 14, letterSpacing: "0.02em" }}>
              Motor analysis
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <ActionCard
                icon="+"
                title="New prediction"
                desc="Enter sensor readings for a single motor — air temp, RPM, torque, tool wear — and get an instant fault classification."
                cta="Run single motor analysis"
                onClick={goToPrediction}   // ← navigates to /motor
              />
              <ActionCard
                icon="📈"
                title="Fleet risk forecast"
                desc="View all 10 motors ranked by failure probability. See trend sparklines, fault types, and recommended maintenance windows."
                cta="View fleet risk overview"
                onClick={() => setView("fleet")}
              />
            </div>
          </>
        )}

        {view === "fleet" && (
          <>
            {/* Back + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <button
                onClick={() => setView("dashboard")}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#aaa", borderRadius: 6, padding: "5px 12px", cursor: "pointer",
                  fontSize: 12, fontFamily: "inherit"
                }}
              >← Back</button>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Fleet status</span>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {tabs.map(t => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  style={{
                    padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                    background: filter === t ? "#fff" : "transparent",
                    color: filter === t ? "#0f1117" : "#888",
                    border: `1px solid ${filter === t ? "#fff" : "rgba(255,255,255,0.15)"}`
                  }}
                >{t}</button>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
              <table>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Motor ID", "Type", "RPM", "Torque (Nm)", "Tool wear", "Failure risk", "Status"].map(h => (
                      <th key={h} style={{
                        padding: "11px 16px", textAlign: "left", fontSize: 12,
                        color: "#555", fontWeight: 600, letterSpacing: "0.04em",
                        background: "rgba(255,255,255,0.02)"
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{m.id}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{
                          display: "inline-block", width: 24, height: 24, borderRadius: 5,
                          background: "rgba(255,255,255,0.08)", textAlign: "center",
                          lineHeight: "24px", fontSize: 12, fontWeight: 700, color: "#aaa"
                        }}>{m.type}</span>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: "#ccc" }}>{m.rpm.toLocaleString()}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: "#ccc" }}>{m.torque}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: "#ccc" }}>{m.toolWear} min</td>
                      <td style={{ padding: "13px 16px" }}><RiskBar value={m.risk} status={m.status as Status} /></td>
                      <td style={{ padding: "13px 16px" }}><StatusBadge status={m.status as Status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: 12, color: "#444", marginTop: 14, textAlign: "right" }}>
              Showing {filtered.length} of {motorData.length} motors
            </div>
          </>
        )}
      </div>
    </div>
  );
}
