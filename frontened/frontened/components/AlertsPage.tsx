'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useGlobalData } from '@/app/context/GlobalDataContext'

const DUMMY_ALERTS = [
  { id: 'PH', name: 'Pump Unit H',   type: '💧 Pump',  block: 'Block 3', health: 22, status: 'BROKEN',      days: 4,  critical: true,  isReal: false },
  { id: 'MF', name: 'Motor Unit 6',  type: '⚡ Motor', block: 'Block 4', health: 28, status: 'HIGH RISK',   days: 9,  critical: true,  isReal: false },
  { id: 'PC', name: 'Pump Unit C',   type: '💧 Pump',  block: 'Block 2', health: 31, status: 'BROKEN',      days: 6,  critical: true,  isReal: false },
  { id: 'MB', name: 'Motor Unit 2',  type: '⚡ Motor', block: 'Block 2', health: 38, status: 'HIGH RISK',   days: 14, critical: true,  isReal: false },
  { id: 'MJ', name: 'Motor Unit 10', type: '⚡ Motor', block: 'Block 3', health: 42, status: 'HIGH RISK',   days: 21, critical: true,  isReal: false },
  { id: 'PB', name: 'Pump Unit B',   type: '💧 Pump',  block: 'Block 1', health: 45, status: 'RECOVERING',  days: 22, critical: false, isReal: false },
  { id: 'PF', name: 'Pump Unit F',   type: '💧 Pump',  block: 'Block 4', health: 48, status: 'RECOVERING',  days: 25, critical: false, isReal: false },
  { id: 'MC', name: 'Motor Unit 3',  type: '⚡ Motor', block: 'Block 3', health: 52, status: 'MEDIUM RISK', days: 28, critical: false, isReal: false },
]

const MACHINE_ICON: Record<string, string> = {
  MOTOR: '⚡ Motor', PUMP: '💧 Pump', COMPRESSOR: '🌀 Compressor', TURBINE: '⚙️ Turbine',
}

function mapStatus(prediction: string, risk_level: string) {
  if (['FAULT','FAULTY','BROKEN'].includes(prediction)) return 'BROKEN'
  if (prediction === 'DEGRADED')   return 'MEDIUM RISK'
  if (prediction === 'RECOVERING') return 'RECOVERING'
  if (risk_level === 'High')       return 'HIGH RISK'
  return 'MEDIUM RISK'
}

function HealthRing({ value, size = 52 }: { value: number; size?: number }) {
  const r = 18, cx = size/2, cy = size/2, circ = 2 * Math.PI * r
  const color = value > 70 ? '#0a7a76' : value > 40 ? '#b45309' : '#c45e0a'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={4} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${(value/100)*circ} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy+4} textAnchor="middle" fill={color} fontSize={10}
        fontWeight="700" fontFamily="'Rajdhani', sans-serif">{value}</text>
    </svg>
  )
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string,[string,string]> = {
    BROKEN:        ['rgba(196,94,10,0.10)',  '#c45e0a'],
    'HIGH RISK':   ['rgba(244,121,32,0.10)', '#c45e0a'],
    RECOVERING:    ['rgba(180,83,9,0.10)',   '#b45309'],
    'MEDIUM RISK': ['rgba(180,83,9,0.10)',   '#b45309'],
    FAULT:         ['rgba(196,94,10,0.10)',  '#c45e0a'],
    FAULTY:        ['rgba(196,94,10,0.10)',  '#c45e0a'],
    DEGRADED:      ['rgba(180,83,9,0.10)',   '#b45309'],
  }
  const [bg,cl] = map[s] || ['rgba(26,63,143,0.10)','#1a3f8f']
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:bg, color:cl,
      border:`1px solid ${cl}44`, borderRadius:6, padding:'3px 10px', fontSize:11,
      fontWeight:700, fontFamily:"'Rajdhani', sans-serif", letterSpacing:'0.08em' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:cl }} />
      {s}
    </span>
  )
}

export default function AlertsPage() {
  const [allAlerts,  setAllAlerts]  = useState(DUMMY_ALERTS as any[])
  const [muted,      setMuted]      = useState(false)
  const [acked,      setAcked]      = useState<string[]>([])
  const [notes,      setNotes]      = useState<Record<string,string>>({})
  const [noteInput,  setNoteInput]  = useState<Record<string,string>>({})
  const { lastSync } = useGlobalData()
  const prevAlertIds = useRef<Set<string>>(new Set())
  const isFirstLoad  = useRef(true)

  const fetchAlerts = useCallback(async () => {
    const safe = async (url: string) => { try { return await fetch(url).then(r => r.json()) } catch { return [] } }
    const email = (() => {
      try { const s = sessionStorage.getItem('iocl_session'); if(s) return JSON.parse(s).email } catch{} return ''
    })()

    const [motor, pump, compressor, turbine, autoAlerts] = await Promise.all([
      safe(`http://127.0.0.1:5050/motor-history?email=${encodeURIComponent(email)}`),
      safe(`http://127.0.0.1:5050/pump-history?email=${encodeURIComponent(email)}`),
      safe(`http://127.0.0.1:5050/compressor-history?email=${encodeURIComponent(email)}`),
      safe(`http://127.0.0.1:5050/turbine-history?email=${encodeURIComponent(email)}`),
      safe('http://127.0.0.1:5050/alerts/auto'),
    ])

    const all = [
      ...motor.map((r:any)=>({...r,machine:'MOTOR'})),
      ...pump.map((r:any)=>({...r,machine:'PUMP'})),
      ...compressor.map((r:any)=>({...r,machine:'COMPRESSOR'})),
      ...turbine.map((r:any)=>({...r,machine:'TURBINE'})),
    ]

    const userAlerts = all
      .filter(r => ['FAULT','FAULTY','BROKEN','DEGRADED','RECOVERING'].includes(r.prediction))
      .sort((a,b) => new Date(b.created_at).getTime()-new Date(a.created_at).getTime())
      .slice(0,10)
      .map(r => ({
        id: `user-${r.machine}-${r.id}`,
        name: `${MACHINE_ICON[r.machine]||r.machine}`,
        type: MACHINE_ICON[r.machine]||r.machine,
        block: 'Your Test Log',
        health: Math.round(100-r.confidence),
        status: mapStatus(r.prediction, r.risk_level),
        days: r.risk_level==='High'?3:14,
        critical: r.risk_level==='High',
        isReal: true, isAuto: false,
        time: new Date(r.created_at).toLocaleString(),
        section: 'user',
      }))

    const refineryAlerts = (Array.isArray(autoAlerts) ? autoAlerts : []).slice(0,10).map((r:any) => ({
      id: `refinery-${r.machine}-${r.id}`,
      name: `${MACHINE_ICON[r.machine]||r.machine}`,
      type: MACHINE_ICON[r.machine]||r.machine,
      block: 'Refinery Auto',
      health: Math.round(100-r.confidence),
      status: mapStatus(r.prediction, r.risk_level),
      days: r.risk_level==='High'?3:14,
      critical: r.risk_level==='High',
      isReal: true, isAuto: true,
      time: new Date(r.created_at).toLocaleString(),
      section: 'refinery',
    }))

    const allReal = [...userAlerts, ...refineryAlerts]

    if (isFirstLoad.current) {
      allReal.forEach((a:any) => prevAlertIds.current.add(a.id))
      isFirstLoad.current = false
    } else {
      const brandNew = allReal.filter((a:any) => !prevAlertIds.current.has(a.id) && a.critical)
      if (brandNew.length > 0 && !muted) (window as any).__iocl_beep?.()
      allReal.forEach((a:any) => prevAlertIds.current.add(a.id))
    }

    setAllAlerts([...userAlerts, ...refineryAlerts, ...DUMMY_ALERTS])
  }, [muted])

  useEffect(() => { fetchAlerts() }, [])
  useEffect(() => {
    const t = setInterval(fetchAlerts, 120000)
    return () => clearInterval(t)
  }, [fetchAlerts])

  useEffect(() => {
    const dummyUnacked = DUMMY_ALERTS.filter(a => a.critical && !acked.includes(a.id)).length
    if (!muted && dummyUnacked > 0) (window as any).__iocl_beep?.()
  }, [muted])

  useEffect(() => {
    const dummyUnacked = DUMMY_ALERTS.filter(a => a.critical && !acked.includes(a.id)).length
    if (muted || dummyUnacked === 0) return
    const t = setInterval(() => (window as any).__iocl_beep?.(), 6000)
    return () => clearInterval(t)
  }, [muted, acked])

  const criticalUnacked = allAlerts.filter(a => a.critical && !acked.includes(a.id)).length

  const renderAlert = (a: any) => {
    const isAcked = acked.includes(a.id)
    const streakColor = a.critical ? '#c45e0a' : '#b45309'
    const borderColor = a.isAuto
      ? 'rgba(10,122,118,0.25)'
      : a.isReal
        ? 'rgba(244,121,32,0.28)'
        : a.critical ? 'rgba(196,94,10,0.18)' : 'rgba(180,83,9,0.15)'

    return (
      <div key={a.id} className="alert-card"
        style={{ border:`1px solid ${borderColor}`, opacity:isAcked?0.45:1 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
          background:`linear-gradient(90deg,${streakColor},${streakColor}33)`,
          borderRadius:'16px 16px 0 0' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <HealthRing value={a.health} />
            <div>
              <div style={{ fontWeight:700, color:'#0d1b2e', fontSize:15,
                fontFamily:"'Rajdhani',sans-serif", letterSpacing:0.3 }}>
                {a.name}
                {a.isAuto && <span style={{ marginLeft:8, fontSize:9, color:'#0a7a76', fontWeight:700, letterSpacing:1 }}>●AUTO</span>}
                {a.isReal && !a.isAuto && <span style={{ marginLeft:8, fontSize:9, color:'#c45e0a', fontWeight:700, letterSpacing:1 }}>●LIVE</span>}
              </div>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11, color:'#6b7a99', marginTop:3, fontWeight:600, letterSpacing:1 }}>{a.type} · {a.block}</div>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11, color:'#6b7a99', marginTop:3, fontWeight:600, letterSpacing:1 }}>
                {a.isReal
                  ? <span style={{ color:'#1a3f8f' }}>{a.time}</span>
                  : <span>FORECAST: <span style={{ color:a.days<=14?'#c45e0a':'#b45309', fontWeight:700 }}>~{a.days} DAYS</span></span>}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
            <StatusBadge s={a.status} />
            {!isAcked && a.critical && (
              <button className="ack-btn" onClick={() => setAcked(p=>[...p,a.id])}>✓ ACKNOWLEDGE</button>
            )}
            {isAcked && <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11, color:'#0a7a76', fontWeight:700, letterSpacing:1 }}>✓ ACKNOWLEDGED</span>}
          </div>
        </div>
        {!isAcked && (
          <div style={{ marginTop:14, borderTop:'1px solid rgba(0,0,0,0.07)', paddingTop:12 }}>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, color:'#6b7a99', fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>MAINTENANCE NOTE</div>
            <div style={{ display:'flex', gap:8 }}>
              <input className="note-input"
                placeholder="e.g. Scheduled inspection for tomorrow 9AM..."
                value={noteInput[a.id]||''}
                onChange={e => setNoteInput(p=>({...p,[a.id]:e.target.value}))} />
              <button className="save-btn" onClick={() => setNotes(p=>({...p,[a.id]:noteInput[a.id]||''}))}>SAVE</button>
            </div>
            {notes[a.id] && <div style={{ fontSize:12, color:'#b45309', marginTop:8, fontFamily:"'Rajdhani',sans-serif", fontWeight:600 }}>📝 {notes[a.id]}</div>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding:28, fontFamily:"'DM Sans', sans-serif",
      minHeight:'100vh', background:'#F0F4F8', position:'relative' }}>

      {/* Background — matches home page */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background:'radial-gradient(ellipse 70% 55% at 15% 25%, rgba(244,121,32,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 75%, rgba(0,48,135,0.10) 0%, transparent 60%), repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(0,0,0,0.03) 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(0,0,0,0.03) 80px)' }} />

      <div style={{ position:'relative', zIndex:1, maxWidth:860 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.15} }
          .alert-card { background: #FFFFFF; border-radius: 16px; padding: 20px 24px;
            transition: all 0.2s; position: relative; overflow: hidden;
            box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
          .ack-btn { padding: 7px 16px; border-radius: 8px; border: 1px solid rgba(10,122,118,0.28);
            background: rgba(14,165,160,0.08); color: #0a7a76; cursor: pointer; font-size: 12px;
            font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 1px; transition: all 0.2s; }
          .ack-btn:hover { background: rgba(14,165,160,0.15); border-color: rgba(10,122,118,0.45); }
          .mute-btn { padding: 8px 20px; border-radius: 10px; border: 1px solid; cursor: pointer;
            font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 1.5px;
            background: #fff; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
          .note-input { flex: 1; padding: 9px 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.10);
            background: #F0F4F8; color: #1a2744; font-family: 'DM Sans', sans-serif;
            font-size: 12px; outline: none; }
          .note-input:focus { border-color: rgba(244,121,32,0.40); }
          .note-input::placeholder { color: #b0bdd4; }
          .save-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.10);
            background: rgba(0,48,135,0.06); color: #1a3f8f; cursor: pointer; font-size: 12px;
            font-family: 'Rajdhani', sans-serif; font-weight: 700; transition: all 0.2s; }
          .save-btn:hover { border-color: rgba(0,48,135,0.28); background: rgba(0,48,135,0.10); }
        `}</style>

        {/* Page Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:11, fontWeight:700,
                letterSpacing:3, padding:'3px 10px', borderRadius:6,
                background:'rgba(244,121,32,0.10)', color:'#c45e0a',
                border:'1px solid rgba(244,121,32,0.25)' }}>ALERTS</span>
              {lastSync && (
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:9, color:'#0a7a76',
                  fontWeight:700, letterSpacing:1 }}>● SYNCED {lastSync}</span>
              )}
            </div>
            <h2 style={{ fontFamily:"'Rajdhani', sans-serif", color:'#0d1b2e', fontWeight:700,
              fontSize:28, margin:0, letterSpacing:'-0.5px' }}>Active Alerts</h2>
            <div style={{ fontFamily:"'Rajdhani', sans-serif", color:'#6b7a99', fontSize:11,
              marginTop:4, fontWeight:600, letterSpacing:2 }}>
              {criticalUnacked} UNACKNOWLEDGED CRITICAL · AUTO-REFRESHES EVERY 2 MIN
            </div>
          </div>
          <button className="mute-btn" onClick={() => setMuted(m => !m)}
            style={{ borderColor: muted ? 'rgba(0,0,0,0.10)' : 'rgba(196,94,10,0.35)',
              color: muted ? '#6b7a99' : '#c45e0a' }}>
            {muted ? '🔇 UNMUTE' : '🔊 MUTE ALARM'}
          </button>
        </div>

        {/* Critical banner */}
        {!muted && criticalUnacked > 0 && (
          <div style={{ background:'rgba(196,94,10,0.06)', border:'1px solid rgba(196,94,10,0.18)',
            borderRadius:14, padding:'14px 20px', marginBottom:22,
            display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize:26, animation:'blink 1s infinite' }}>🚨</span>
            <div>
              <div style={{ fontFamily:"'Rajdhani', sans-serif", color:'#c45e0a', fontWeight:700,
                fontSize:15, letterSpacing:1 }}>CRITICAL ALARM ACTIVE</div>
              <div style={{ color:'#b45309', fontSize:13, marginTop:2 }}>
                {criticalUnacked} machine(s) require immediate intervention
              </div>
            </div>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {allAlerts.filter(a => a.section==='user').length > 0 && (
            <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#c45e0a', fontWeight:700,
              fontSize:11, letterSpacing:2.5, padding:'8px 0',
              borderBottom:'1px solid rgba(244,121,32,0.18)' }}>
              🔴 YOUR FAULT DETECTIONS
            </div>
          )}
          {allAlerts.filter(a => a.section==='user').map(a => renderAlert(a))}

          {allAlerts.filter(a => a.section==='refinery').length > 0 && (
            <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#0a7a76', fontWeight:700,
              fontSize:11, letterSpacing:2.5, padding:'8px 0', marginTop:8,
              borderBottom:'1px solid rgba(14,165,160,0.18)' }}>
              🏭 REFINERY AUTO ALERTS
            </div>
          )}
          {allAlerts.filter(a => a.section==='refinery').map(a => renderAlert(a))}

          <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#6b7a99', fontWeight:700,
            fontSize:11, letterSpacing:2.5, padding:'8px 0', marginTop:8,
            borderBottom:'1px solid rgba(0,0,0,0.08)' }}>
            📋 FLEET BACKGROUND ALERTS
          </div>
          {allAlerts.filter(a => !a.section).map(a => renderAlert(a))}
        </div>
      </div>
    </div>
  )
}