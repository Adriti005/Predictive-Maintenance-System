'use client'

import { useState, useEffect } from 'react'

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, [string, string]> = {
    BROKEN:      ['rgba(196,94,10,0.10)',  '#c45e0a'],
    'HIGH RISK': ['rgba(244,121,32,0.10)', '#c45e0a'],
    RECOVERING:  ['rgba(180,83,9,0.10)',   '#b45309'],
    NORMAL:      ['rgba(10,122,118,0.10)', '#0a7a76'],
    FAULT:       ['rgba(196,94,10,0.10)',  '#c45e0a'],
    FAULTY:      ['rgba(196,94,10,0.10)',  '#c45e0a'],
    DEGRADED:    ['rgba(180,83,9,0.10)',   '#b45309'],
  }
  const [bg, cl] = map[s] || ['rgba(26,63,143,0.10)', '#1a3f8f']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color: cl, border: `1px solid ${cl}44`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cl }} />
      {s}
    </span>
  )
}

const DUMMY_REPORT_DATA = {
  daily: {
    title: 'Daily Health Report',
    subtitle: "TODAY'S MACHINE HEALTH SUMMARY",
    color: '#1a3f8f',
    urgent: [
      { name: 'Pump Unit H',  block: 'Block 3', type: '💧', days: 4,  status: 'BROKEN',    isReal: false },
      { name: 'Motor Unit 6', block: 'Block 4', type: '⚡', days: 9,  status: 'HIGH RISK',  isReal: false },
      { name: 'Pump Unit C',  block: 'Block 2', type: '💧', days: 6,  status: 'BROKEN',    isReal: false },
    ],
    baseStats: { pumps: 10, motors: 10, critical: 3, warnings: 4, normal: 13 },
    recommendations: [
      'Pump Unit H requires immediate inspection — failure within 4 days',
      'Motor Unit 6 showing high vibration — schedule lubrication check',
      'Pump Unit C bearing temperature elevated — monitor closely',
      'Review daily sensor logs for Block 3 and Block 4',
      'Raise SAP PM work orders for all BROKEN units today',
    ]
  },
  weekly: {
    title: 'Weekly Trend Report',
    subtitle: '7-DAY TREND AND ALERT ANALYSIS',
    color: '#c45e0a',
    urgent: [
      { name: 'Pump Unit H',  block: 'Block 3', type: '💧', days: 4,  status: 'BROKEN',    isReal: false },
      { name: 'Motor Unit 6', block: 'Block 4', type: '⚡', days: 9,  status: 'HIGH RISK',  isReal: false },
      { name: 'Pump Unit C',  block: 'Block 2', type: '💧', days: 6,  status: 'BROKEN',    isReal: false },
      { name: 'Motor Unit 2', block: 'Block 2', type: '⚡', days: 14, status: 'HIGH RISK',  isReal: false },
      { name: 'Pump Unit B',  block: 'Block 1', type: '💧', days: 22, status: 'RECOVERING', isReal: false },
    ],
    baseStats: { pumps: 10, motors: 10, critical: 5, warnings: 7, normal: 8 },
    recommendations: [
      'Weekly trend shows 2 new units entered BROKEN state vs last week',
      'Motor Unit 2 degrading — schedule preventive maintenance this week',
      'Pump Unit B recovering well — continue monitoring for 2 more weeks',
      'Block 2 has highest concentration of at-risk machines this week',
      'Review weekly KPIs — average health score dropped from 78% to 71%',
    ]
  },
  failure: {
    title: 'Failure Forecast Report',
    subtitle: 'PREDICTED FAILURES — NEXT 30 DAYS',
    color: '#c45e0a',
    urgent: [
      { name: 'Pump Unit H',    block: 'Block 3', type: '💧',  days: 4,  status: 'BROKEN',    isReal: false },
      { name: 'Pump Unit C',    block: 'Block 2', type: '💧',  days: 6,  status: 'BROKEN',    isReal: false },
      { name: 'Motor Unit 6',   block: 'Block 4', type: '⚡',  days: 9,  status: 'HIGH RISK',  isReal: false },
      { name: 'Motor Unit 2',   block: 'Block 2', type: '⚡',  days: 14, status: 'HIGH RISK',  isReal: false },
      { name: 'Compressor 3',   block: 'Block 5', type: '🌀',  days: 18, status: 'DEGRADED',   isReal: false },
      { name: 'Turbine Unit 1', block: 'Block 1', type: '⚙️', days: 21, status: 'FAULT',      isReal: false },
      { name: 'Pump Unit B',    block: 'Block 1', type: '💧',  days: 22, status: 'RECOVERING', isReal: false },
    ],
    baseStats: { pumps: 10, motors: 10, critical: 7, warnings: 5, normal: 6 },
    recommendations: [
      'CRITICAL — 2 pumps predicted to fail within 7 days, stop operation immediately',
      'Schedule emergency maintenance for Motor Unit 6 before day 9',
      'Compressor 3 showing pressure drop — inspect seals and valves by day 15',
      'Turbine Unit 1 blade erosion detected — plan shutdown window before day 21',
      'Total 7 failures predicted this month — allocate maintenance budget accordingly',
    ]
  }
}

type ReportType = 'daily' | 'weekly' | 'failure'

type RealStats = {
  motor: number
  pump: number
  compressor: number
  turbine: number
  faults: number
  degraded: number
  normal: number
  recentFaults: { machine: string; prediction: string; confidence: number; created_at: string }[]
}

export default function ReportPage() {
  const [activeReport, setActiveReport] = useState<ReportType | null>(null)
  const [loading, setLoading] = useState<ReportType | null>(null)
  const [realStats, setRealStats] = useState<RealStats | null>(null)
  const [lastSync, setLastSync] = useState('')

  useEffect(() => {
    fetchReal()
    const t = setInterval(() => {
      fetchReal()
      setLastSync(new Date().toLocaleTimeString())
    }, 120000)
    return () => clearInterval(t)
  }, [])

  async function fetchReal() {
    try {
      const [motor, pump, compressor, turbine] = await Promise.all([
        fetch('http://127.0.0.1:5050/motor-history').then(r => r.json()),
        fetch('http://127.0.0.1:5050/pump-history').then(r => r.json()),
        fetch('http://127.0.0.1:5050/compressor-history').then(r => r.json()),
        fetch('http://127.0.0.1:5050/turbine-history').then(r => r.json()),
      ])
      const all = [
        ...motor.map((r: any) => ({ ...r, machine: 'MOTOR' })),
        ...pump.map((r: any) => ({ ...r, machine: 'PUMP' })),
        ...compressor.map((r: any) => ({ ...r, machine: 'COMPRESSOR' })),
        ...turbine.map((r: any) => ({ ...r, machine: 'TURBINE' })),
      ]
      const faultStatuses = ['FAULT', 'FAULTY', 'BROKEN']
      setRealStats({
        motor: motor.length,
        pump: pump.length,
        compressor: compressor.length,
        turbine: turbine.length,
        faults: all.filter(r => faultStatuses.includes(r.prediction)).length,
        degraded: all.filter(r => ['DEGRADED', 'RECOVERING'].includes(r.prediction)).length,
        normal: all.filter(r => ['NORMAL', 'HEALTHY'].includes(r.prediction)).length,
        recentFaults: all
          .filter(r => faultStatuses.includes(r.prediction) || r.prediction === 'DEGRADED')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5),
      })
    } catch { }
  }

  function generate(type: ReportType) {
    setActiveReport(null)
    setLoading(type)
    fetchReal().then(() => {
      setTimeout(() => {
        setLoading(null)
        setActiveReport(type)
      }, 1200)
    })
  }

  async function generateShiftHandover() {
    const email = (() => {
      try { const s = sessionStorage.getItem('iocl_session'); if(s) return JSON.parse(s) } catch{} return null
    })()

    const now = new Date()
    const shiftStart = new Date(now); shiftStart.setHours(now.getHours()-8)

    let userTests = 0, userFaults = 0, userHealthy = 0
    let refineryFaults = 0, refineryWarnings = 0
    const faultMachines: string[] = []

    try {
      const [motor, pump, comp, turb] = await Promise.all([
        fetch(`http://127.0.0.1:5050/motor-history?email=${encodeURIComponent(email?.email||'')}`).then(r=>r.json()),
        fetch(`http://127.0.0.1:5050/pump-history?email=${encodeURIComponent(email?.email||'')}`).then(r=>r.json()),
        fetch(`http://127.0.0.1:5050/compressor-history?email=${encodeURIComponent(email?.email||'')}`).then(r=>r.json()),
        fetch(`http://127.0.0.1:5050/turbine-history?email=${encodeURIComponent(email?.email||'')}`).then(r=>r.json()),
      ])
      const all = [...motor, ...pump, ...comp, ...turb]
      userTests = all.length
      userFaults = all.filter((r:any) => ['FAULT','FAULTY','BROKEN'].includes(r.prediction)).length
      userHealthy = all.filter((r:any) => ['NORMAL','HEALTHY'].includes(r.prediction)).length
      all.filter((r:any) => ['FAULT','FAULTY','BROKEN'].includes(r.prediction))
         .slice(0,3).forEach((r:any) => faultMachines.push(r.machine||'UNKNOWN'))
      const auto = await fetch('http://127.0.0.1:5050/alerts/auto').then(r=>r.json())
      refineryFaults = auto.filter((r:any) => r.risk_level==='High').length
      refineryWarnings = auto.filter((r:any) => r.risk_level==='Medium').length
    } catch {}

    const content = `IOCL GUWAHATI REFINERY
SHIFT HANDOVER REPORT
${'='.repeat(40)}

Engineer:    ${email?.name || 'N/A'}
Department:  ${email?.dept || 'N/A'}
Shift Date:  ${now.toLocaleDateString()}
Shift Time:  ${shiftStart.toLocaleTimeString()} — ${now.toLocaleTimeString()}
Generated:   ${now.toLocaleString()}

${'='.repeat(40)}
MANUAL TEST LOGS THIS SHIFT
${'='.repeat(40)}
Total predictions run:  ${userTests}
  Healthy / Normal:     ${userHealthy}
  Fault / Broken:       ${userFaults}
  Warnings:             ${userTests - userHealthy - userFaults}

${'='.repeat(40)}
REFINERY AUTO ALERTS THIS SHIFT
${'='.repeat(40)}
Critical alerts:  ${refineryFaults}
Warning alerts:   ${refineryWarnings}

${'='.repeat(40)}
MACHINES NEEDING ATTENTION
${'='.repeat(40)}
${faultMachines.length > 0
  ? faultMachines.map(m => `  → ${m} — FAULT DETECTED — inspect immediately`).join('\n')
  : '  No manual faults detected this shift'}

${'='.repeat(40)}
RECOMMENDATION
${'='.repeat(40)}
${userFaults > 0
  ? `${userFaults} machine(s) require attention before next shift handover.\nEnsure maintenance team is notified.`
  : 'All manually tested machines operating normally.\nContinue standard monitoring procedures.'}

${'='.repeat(40)}
IOCL Predictive Maintenance System
Guwahati Refinery · Auto-generated
`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shift_handover_${now.toISOString().slice(0,10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const dummyReport = activeReport ? DUMMY_REPORT_DATA[activeReport] : null

  return (
    <div style={{ padding: 28, maxWidth: 860, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        .rep-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; position: relative; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .rep-type-card { border-radius: 16px; padding: 28px 24px; text-align: left; background: #FFFFFF; border: 1px solid rgba(0,0,0,0.08); transition: all 0.3s; cursor: pointer; position: relative; overflow: hidden; width: 100%; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .rep-type-card:hover { border-color: rgba(244,121,32,0.30); background: #fff8f4; transform: translateY(-3px); box-shadow: 0 12px 40px rgba(244,121,32,0.10); }
        .gen-btn { padding: 9px 22px; border-radius: 10px; border: 1px solid rgba(244,121,32,0.30); background: rgba(244,121,32,0.08); color: #c45e0a; cursor: pointer; font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 1px; width: 100%; margin-top: 16px; transition: all 0.2s; }
        .gen-btn:hover { background: rgba(244,121,32,0.14); border-color: rgba(244,121,32,0.45); }
        .gen-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 3, padding: '3px 10px', borderRadius: 6, background: 'rgba(96,37,192,0.10)', color: '#6025c0', border: '1px solid rgba(124,58,237,0.20)' }}>REPORTS</span>
        </div>
        <h2 style={{ fontFamily: "'Rajdhani', sans-serif", color: '#0d1b2e', fontWeight: 700, fontSize: 28, margin: 0, letterSpacing: '-0.5px' }}>Reports</h2>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#8a9ab5', fontSize: 11, marginTop: 4, fontWeight: 600, letterSpacing: 2 }}>MAINTENANCE REPORTS · FORECASTS · RECOMMENDATIONS</div>
      </div>

      {/* Shift Handover Button */}
      <button
        onClick={generateShiftHandover}
        style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 24px',
          borderRadius:12, border:'1px solid rgba(10,122,118,0.30)',
          background:'rgba(14,165,160,0.08)', color:'#0a7a76', cursor:'pointer',
          fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13,
          letterSpacing:1.5, marginBottom:24, transition:'all 0.2s' }}
        onMouseOver={e=>(e.currentTarget.style.background='rgba(14,165,160,0.14)')}
        onMouseOut={e=>(e.currentTarget.style.background='rgba(14,165,160,0.08)')}>
        📋 GENERATE SHIFT HANDOVER REPORT
        <span style={{ fontSize:10, color:'#8a9ab5', fontWeight:600 }}>→ Downloads as .txt</span>
      </button>

      {/* Report Type Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
        {([
          { key: 'daily',   title: 'Daily Report',   desc: "Today's machine health summary", icon: '📅', color: '#1a3f8f' },
          { key: 'weekly',  title: 'Weekly Report',  desc: '7-day trend and alert analysis', icon: '📆', color: '#c45e0a' },
          { key: 'failure', title: 'Failure Report', desc: 'Upcoming failures by forecast',  icon: '🚨', color: '#c45e0a' },
        ] as const).map(r => (
          <div key={r.key} className="rep-type-card">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${r.color}, ${r.color}33)` }} />
            <div style={{ fontSize: 32, marginBottom: 14 }}>{r.icon}</div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#1a2744', fontSize: 16, marginBottom: 8 }}>{r.title}</div>
            <div style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.5 }}>{r.desc}</div>
            {activeReport === r.key && <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, color: r.color, fontWeight: 700, letterSpacing: 1, marginTop: 10 }}>✓ ACTIVE</div>}
            <button className="gen-btn" disabled={loading === r.key} onClick={() => generate(r.key)}>
              {loading === r.key ? '⏳ Generating...' : activeReport === r.key ? 'Regenerate →' : 'Generate →'}
            </button>
          </div>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#8a9ab5', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: 2, fontSize: 13 }}>
          ⏳ GENERATING REPORT...
        </div>
      )}

      {dummyReport && !loading && (
        <div className="rep-card" style={{ padding: 28 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${dummyReport.color}, ${dummyReport.color}33)` }} />

          {/* Report header */}
          <div style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', paddingBottom: 18, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#0d1b2e', fontWeight: 700, fontSize: 18 }}>IOCL Guwahati Refinery — {dummyReport.title}</div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#8a9ab5', fontSize: 11, marginTop: 4, letterSpacing: 2, fontWeight: 600 }}>GENERATED: {new Date().toLocaleString().toUpperCase()}</div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", color: dummyReport.color, fontSize: 10, marginTop: 4, letterSpacing: 2, fontWeight: 700 }}>{dummyReport.subtitle}</div>
          </div>

          {/* Real Stats */}
          {realStats && realStats.faults + realStats.normal + realStats.degraded > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#c45e0a', fontWeight: 700, fontSize: 11, letterSpacing: 2.5, marginBottom: 12 }}>
                ●LIVE — REAL PREDICTION DATA
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  ['MOTOR',      realStats.motor,                                                                    '#c45e0a'],
                  ['PUMP',       realStats.pump,                                                                     '#1a3f8f'],
                  ['COMPRESSOR', realStats.compressor,                                                               '#0a7a76'],
                  ['TURBINE',    realStats.turbine,                                                                  '#6025c0'],
                  ['FAULTS',     realStats.faults,                                                                   '#c45e0a'],
                  ['DEGRADED',   realStats.degraded,                                                                 '#b45309'],
                  ['NORMAL',     realStats.normal,                                                                   '#0a7a76'],
                  ['TOTAL',      realStats.motor + realStats.pump + realStats.compressor + realStats.turbine,        '#1a2744'],
                ].map(([l, v, c]) => (
                  <div key={l as string} style={{ background: '#F0F4F8', borderRadius: 12, padding: '14px 10px', textAlign: 'center', border: `1px solid ${c as string}22`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c as string }} />
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 26, fontWeight: 700, color: c as string }}>{v}</div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 9, color: '#4a5568', marginTop: 4, letterSpacing: 1.5, fontWeight: 700 }}>{l}</div>
                  </div>
                ))}
              </div>
              {realStats.recentFaults.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#c45e0a', fontWeight: 700, fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>🚨 LIVE FAULTS</div>
                  {realStats.recentFaults.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'rgba(244,121,32,0.04)', borderRadius: 10, marginBottom: 6, border: '1px solid rgba(244,121,32,0.18)' }}>
                      <div>
                        <span style={{ color: '#c45e0a', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", fontSize: 13 }}>●LIVE {m.machine}</span>
                        <span style={{ color: '#8a9ab5', fontSize: 11, marginLeft: 10, fontFamily: "'Rajdhani', sans-serif" }}>{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ color: '#b45309', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>{m.confidence}%</span>
                        <StatusBadge s={m.prediction} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', marginBottom: 20 }} />
            </div>
          )}

          {/* Dummy Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              ['PUMPS',    dummyReport.baseStats.pumps,    '#1a3f8f'],
              ['MOTORS',   dummyReport.baseStats.motors,   '#c45e0a'],
              ['CRITICAL', dummyReport.baseStats.critical, '#c45e0a'],
              ['WARNINGS', dummyReport.baseStats.warnings, '#b45309'],
              ['NORMAL',   dummyReport.baseStats.normal,   '#0a7a76'],
            ].map(([l, v, c]) => (
              <div key={l as string} style={{ background: '#F0F4F8', borderRadius: 12, padding: '14px 10px', textAlign: 'center', border: `1px solid ${c as string}22`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c as string }} />
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 26, fontWeight: 700, color: c as string }}>{v}</div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 9, color: '#4a5568', marginTop: 4, letterSpacing: 1.5, fontWeight: 700 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Urgent Machines */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", color: dummyReport.color, fontWeight: 700, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>🚨 {dummyReport.subtitle}</div>
            {dummyReport.urgent.map(m => (
              <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F0F4F8', borderRadius: 10, marginBottom: 8, border: `1px solid ${m.days <= 14 ? 'rgba(196,94,10,0.18)' : 'rgba(180,83,9,0.15)'}` }}>
                <div>
                  <span style={{ color: '#1a2744', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", fontSize: 14 }}>{m.name}</span>
                  <span style={{ color: '#8a9ab5', fontSize: 11, marginLeft: 10, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{m.type} · {m.block}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", color: m.days <= 14 ? '#c45e0a' : '#b45309', fontWeight: 700, fontSize: 15 }}>~{m.days}d</span>
                  <StatusBadge s={m.status} />
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div style={{ background: 'rgba(10,122,118,0.05)', border: '1px solid rgba(14,165,160,0.18)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#0a7a76', fontWeight: 700, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>RECOMMENDATIONS</div>
            {dummyReport.recommendations.map(r => (
              <div key={r} style={{ fontSize: 13, color: '#4a5568', marginBottom: 10, display: 'flex', gap: 12, lineHeight: 1.6 }}>
                <span style={{ color: '#0a7a76', flexShrink: 0, fontWeight: 700 }}>▸</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}