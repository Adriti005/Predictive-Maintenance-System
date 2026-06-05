'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@/app/page'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts'
import { useGlobalData } from '@/app/context/GlobalDataContext'

type Page = 'dashboard' | 'alerts' | 'history' | 'report' | 'profile'

const DUMMY_ATTENTION = [
  { name: 'Pump Unit C',  type: '💧 Pump',  block: 'Block 2', health: 31, status: 'BROKEN',    days: 6,  isReal: false },
  { name: 'Motor Unit 6', type: '⚡ Motor', block: 'Block 4', health: 28, status: 'HIGH RISK',  days: 9,  isReal: false },
  { name: 'Pump Unit H',  type: '💧 Pump',  block: 'Block 3', health: 22, status: 'BROKEN',    days: 4,  isReal: false },
  { name: 'Motor Unit 2', type: '⚡ Motor', block: 'Block 2', health: 38, status: 'HIGH RISK',  days: 14, isReal: false },
  { name: 'Pump Unit B',  type: '💧 Pump',  block: 'Block 1', health: 45, status: 'RECOVERING', days: 22, isReal: false },
]

const MACHINE_ICON: Record<string, string> = {
  MOTOR: '⚡ Motor', PUMP: '💧 Pump', COMPRESSOR: '🌀 Compressor', TURBINE: '⚙️ Turbine',
}

type GraphPoint = { time: string; value: number; prediction: string }

function MachineGraph({ title, icon, color, dataKey, unit, yMin, yMax, safeMin, safeMax,
  data, currentValue, gridLines, onClick }: any) {

  const isFault = data.length > 0 &&
    ['FAULT','FAULTY','BROKEN','DEGRADED'].includes(data[data.length-1]?.prediction || '')
  const lineColor = isFault ? '#c45e0a' : color

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    const isBad = ['FAULT','FAULTY','BROKEN','DEGRADED'].includes(payload.prediction || '')
    return <circle cx={cx} cy={cy} r={4} fill={isBad ? '#c45e0a' : color} stroke="none" />
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const val = payload[0]?.value
    const pred = payload[0]?.payload?.prediction
    const bad = ['FAULT','FAULTY','BROKEN','DEGRADED'].includes(pred || '')
    return (
      <div style={{ background:'#FFFFFF', border:`1px solid ${bad?'#c45e0a':color}44`, borderRadius:8, padding:'8px 12px', boxShadow:'0 4px 16px rgba(0,0,0,0.10)' }}>
        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11, color:'#8a9ab5', marginBottom:4 }}>{label}</div>
        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, fontWeight:700, color:bad?'#c45e0a':color }}>{val?.toFixed(1)} {unit}</div>
        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, color:bad?'#c45e0a':'#0a7a76', fontWeight:700, marginTop:3 }}>{pred}</div>
      </div>
    )
  }

  const chartData = data.map((d: any) => ({ ...d, [dataKey]: d.value }))

  return (
    <div className="d-card" style={{ padding:'16px 18px', cursor:'pointer' }} onClick={onClick}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
        background:`linear-gradient(90deg,${isFault?'#c45e0a':color},${isFault?'#c45e0a22':color+'22'})`,
        borderRadius:'16px 16px 0 0' }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <div style={{ fontFamily:"'Rajdhani',sans-serif", color:isFault?'#c45e0a':color, fontWeight:700, fontSize:11, letterSpacing:2.5 }}>
            {icon} {title}
          </div>
          <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#8a9ab5', fontSize:9, fontWeight:600, letterSpacing:1, marginTop:2 }}>
            SAFE RANGE: {safeMin}–{safeMax} {unit} · <span style={{color:'#1a3f8f'}}>CLICK FOR PASSPORT</span>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          {currentValue !== null && (
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:22, fontWeight:700, color:isFault?'#c45e0a':color, lineHeight:1 }}>
              {currentValue.toFixed(1)}<span style={{ fontSize:11, color:'#8a9ab5', marginLeft:3 }}>{unit}</span>
            </div>
          )}
          {isFault && <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:9, color:'#c45e0a', fontWeight:700, letterSpacing:1, marginTop:2 }}>⚠ FAULT DETECTED</div>}
        </div>
      </div>
      {data.length === 0 ? (
        <div style={{ height:100, display:'flex', alignItems:'center', justifyContent:'center',
          color:'#8a9ab5', fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:600, letterSpacing:2 }}>
          WAITING FOR DATA...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={110}>
          <LineChart data={chartData} margin={{ top:5, right:8, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <ReferenceArea y1={safeMin} y2={safeMax} fill={color} fillOpacity={0.04} />
            <ReferenceLine y={safeMax} stroke={color} strokeDasharray="4 4" strokeOpacity={0.4} strokeWidth={1} />
            <ReferenceLine y={safeMin} stroke={color} strokeDasharray="4 4" strokeOpacity={0.4} strokeWidth={1} />
            <XAxis dataKey="time" tick={{ fill:'#8a9ab5', fontSize:9, fontFamily:"'Rajdhani',sans-serif", fontWeight:600 }}
              axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={[yMin,yMax]} ticks={gridLines}
              tick={{ fill:'#8a9ab5', fontSize:9, fontFamily:"'Rajdhani',sans-serif", fontWeight:600 }}
              axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey={dataKey} stroke={lineColor} strokeWidth={2}
              dot={<CustomDot />} activeDot={{ r:6, fill:lineColor }}
              isAnimationActive={true} animationDuration={600} />
          </LineChart>
        </ResponsiveContainer>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:9, color:'#8a9ab5', fontWeight:600, letterSpacing:1 }}>TIME →</span>
        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:9, color:'#8a9ab5', fontWeight:600, letterSpacing:1 }}>Y: {unit}</span>
      </div>
    </div>
  )
}

function PassportModal({ machine, color, icon, onClose }: any) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch(`http://127.0.0.1:5050/passport/${machine.toLowerCase()}`)
      .then(r => r.json()).then(setData).catch(() => {})
  }, [machine])

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#FFFFFF', border:`1px solid ${color}33`, borderRadius:20,
        padding:28, width:480, maxWidth:'95vw', position:'relative', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
          background:`linear-gradient(90deg,${color},${color}22)`, borderRadius:'20px 20px 0 0' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:"'Rajdhani',sans-serif", color, fontWeight:700, fontSize:16, letterSpacing:2 }}>
            {icon} {machine} — HEALTH PASSPORT
          </div>
          <button onClick={onClose} style={{ background:'none', border:'1px solid rgba(0,0,0,0.10)',
            color:'#4a5568', cursor:'pointer', borderRadius:8, padding:'4px 12px',
            fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>CLOSE</button>
        </div>
        {!data ? (
          <div style={{ textAlign:'center', padding:40, color:'#8a9ab5',
            fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:2 }}>LOADING...</div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              {[
                ['TOTAL PREDICTIONS', data.total, color],
                ['FAULTS DETECTED',   data.faults, '#c45e0a'],
                ['FAULT RATE',        `${data.fault_rate}%`, data.fault_rate > 20 ? '#c45e0a' : '#0a7a76'],
                ['LAST FAULT',        data.last_fault, '#b45309'],
              ].map(([l,v,c]) => (
                <div key={l as string} style={{ background:'#F0F4F8', borderRadius:12,
                  padding:'14px 16px', border:`1px solid ${c}22` }}>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:9, color:'#8a9ab5',
                    fontWeight:700, letterSpacing:1.5, marginBottom:6 }}>{l}</div>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18, fontWeight:700, color:c as string }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, color:'#8a9ab5',
              fontWeight:700, letterSpacing:2, marginBottom:10 }}>30-DAY FAULT TREND</div>
            {data.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={data.trend}>
                  <XAxis dataKey="day" tick={{ fill:'#8a9ab5', fontSize:8 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#8a9ab5', fontSize:8 }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip />
                  <Line type="monotone" dataKey="faults" stroke={color} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign:'center', padding:20, color:'#8a9ab5',
                fontFamily:"'Rajdhani',sans-serif", fontSize:11 }}>NO TREND DATA YET</div>
            )}
            <div style={{ marginTop:16, padding:'12px 16px', borderRadius:10,
              background: data.fault_rate > 20 ? 'rgba(196,94,10,0.06)' : 'rgba(14,165,160,0.06)',
              border: `1px solid ${data.fault_rate > 20 ? 'rgba(196,94,10,0.2)' : 'rgba(14,165,160,0.2)'}` }}>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700,
                color: data.fault_rate > 20 ? '#c45e0a' : '#0a7a76' }}>
                {data.fault_rate > 20 ? '⚠️ NEEDS ATTENTION — High fault rate detected' :
                 data.fault_rate > 10 ? '🟡 MONITOR CLOSELY — Moderate fault rate' :
                 '✅ HEALTHY — Operating within normal parameters'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function HealthBarChart({ data }: { data: { hour: string; health: number }[] }) {
  if (!data.length) return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:70 }}>
      {Array.from({length:24},(_,i) => (
        <div key={i} style={{ flex:1, height:'60%', borderRadius:'2px 2px 0 0', background:'#e2e8f0', opacity:0.6 }} />
      ))}
    </div>
  )
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:70 }}>
      {data.map((b,i) => (
        <div key={i} title={`${b.hour}: ${b.health.toFixed(0)}%`}
          style={{ flex:1, height:`${Math.max(b.health,5)}%`, borderRadius:'2px 2px 0 0',
            background:b.health>70?'#0a7a76':b.health>40?'#b45309':'#c45e0a',
            opacity:0.85, transition:'height 0.6s ease', cursor:'pointer' }} />
      ))}
    </div>
  )
}

function HealthRing({ value, size=52 }: { value:number; size?:number }) {
  const r=18, cx=size/2, cy=size/2, circ=2*Math.PI*r
  const color=value>70?'#0a7a76':value>40?'#b45309':'#c45e0a'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={4} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${(value/100)*circ} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy+4} textAnchor="middle" fill={color} fontSize={10}
        fontWeight="700" fontFamily="'Rajdhani',sans-serif">{value}</text>
    </svg>
  )
}

function StatusBadge({ s }: { s:string }) {
  const map: Record<string,[string,string]> = {
    BROKEN:       ['rgba(196,94,10,0.10)',  '#c45e0a'],
    FAULT:        ['rgba(196,94,10,0.10)',  '#c45e0a'],
    FAULTY:       ['rgba(196,94,10,0.10)',  '#c45e0a'],
    'HIGH RISK':  ['rgba(244,121,32,0.10)', '#c45e0a'],
    RECOVERING:   ['rgba(180,83,9,0.10)',   '#b45309'],
    DEGRADED:     ['rgba(180,83,9,0.10)',   '#b45309'],
    HEALTHY:      ['rgba(10,122,118,0.10)', '#0a7a76'],
    NORMAL:       ['rgba(10,122,118,0.10)', '#0a7a76'],
  }
  const [bg,cl]=map[s]||['rgba(26,63,143,0.10)','#1a3f8f']
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:bg, color:cl,
      border:`1px solid ${cl}44`, borderRadius:6, padding:'3px 10px', fontSize:11,
      fontWeight:700, fontFamily:"'Rajdhani',sans-serif", letterSpacing:'0.08em' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:cl, display:'inline-block' }} />
      {s}
    </span>
  )
}

function FaultStreakWidget({ data }: { data: any }) {
  const machines = [
    { key:'motor',      icon:'⚡', label:'MOTOR',      color:'#c45e0a' },
    { key:'pump',       icon:'💧', label:'PUMP',       color:'#1a3f8f' },
    { key:'compressor', icon:'🌀', label:'COMPRESSOR', color:'#0a7a76' },
    { key:'turbine',    icon:'⚙️', label:'TURBINE',    color:'#6025c0' },
  ]
  return (
    <div className="d-card">
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
        background:'linear-gradient(90deg,#c45e0a,rgba(196,94,10,0.2))', borderRadius:'16px 16px 0 0' }} />
      <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#c45e0a', fontWeight:700,
        fontSize:11, letterSpacing:2.5, marginBottom:16 }}>🔥 FAULT STREAK MONITOR</div>
      {machines.map(m => {
        const d = data?.[m.key]
        const daysClean = d?.days_clean ?? 0
        const faultsWeek = d?.faults_week ?? 0
        const isGood = daysClean >= 7
        const isBad  = faultsWeek >= 5
        return (
          <div key={m.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'10px 14px', background:'#F0F4F8', borderRadius:10, marginBottom:8,
            border:`1px solid ${isBad?'rgba(196,94,10,0.2)':isGood?'rgba(14,165,160,0.15)':'rgba(180,83,9,0.15)'}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:16 }}>{m.icon}</span>
              <span style={{ fontFamily:"'Rajdhani',sans-serif", color:m.color, fontWeight:700,
                fontSize:12, letterSpacing:1 }}>{m.label}</span>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700,
                color: isBad?'#c45e0a':isGood?'#0a7a76':'#b45309' }}>
                {isBad ? `🔴 ${faultsWeek} faults this week` :
                 isGood ? `🟢 ${daysClean} days fault free` :
                 `🟡 ${faultsWeek} fault${faultsWeek!==1?'s':''} this week`}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MaintenanceWidget({ data }: { data: any }) {
  const machines = [
    { key:'motor',      icon:'⚡', label:'MOTOR',      color:'#c45e0a' },
    { key:'pump',       icon:'💧', label:'PUMP',       color:'#1a3f8f' },
    { key:'compressor', icon:'🌀', label:'COMPRESSOR', color:'#0a7a76' },
    { key:'turbine',    icon:'⚙️', label:'TURBINE',    color:'#6025c0' },
  ]
  return (
    <div className="d-card">
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
        background:'linear-gradient(90deg,#1a3f8f,rgba(26,63,143,0.2))', borderRadius:'16px 16px 0 0' }} />
      <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#1a3f8f', fontWeight:700,
        fontSize:11, letterSpacing:2.5, marginBottom:16 }}>⏱️ MAINTENANCE COUNTDOWN</div>
      {machines.map(m => {
        const d = data?.[m.key]
        const days = d?.days_until ?? '—'
        const risk = d?.risk ?? 'Low'
        const riskColor = risk==='High'?'#c45e0a':risk==='Medium'?'#b45309':'#0a7a76'
        return (
          <div key={m.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'10px 14px', background:'#F0F4F8', borderRadius:10, marginBottom:8,
            border:`1px solid ${riskColor}22` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:16 }}>{m.icon}</span>
              <div>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", color:m.color, fontWeight:700,
                  fontSize:12, letterSpacing:1 }}>{m.label}</div>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#8a9ab5', fontSize:9,
                  fontWeight:600, letterSpacing:1 }}>Next maintenance: {days} days</div>
              </div>
            </div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:700,
              color:riskColor, textAlign:'right' }}>
              {risk==='High'?'🔴 HIGH RISK':risk==='Medium'?'🟡 MEDIUM':'🟢 LOW RISK'}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard({ setPage, user }: { setPage:(p:Page)=>void; user:User }) {

  const { motorGraph, pumpGraph, compressorGraph, turbineGraph,
          healthBars, lastUpdated } = useGlobalData()

  const [attention,   setAttention]   = useState(DUMMY_ATTENTION as any[])
  const [realFaults,  setRealFaults]  = useState(0)
  const [realNormal,  setRealNormal]  = useState(0)
  const [motorCount,  setMotorCount]  = useState(0)
  const [pumpCount,   setPumpCount]   = useState(0)
  const [compCount,   setCompCount]   = useState(0)
  const [turbCount,   setTurbCount]   = useState(0)
  const [streakData,  setStreakData]  = useState<any>(null)
  const [maintData,   setMaintData]   = useState<any>(null)
  const [passport,    setPassport]    = useState<{machine:string;color:string;icon:string}|null>(null)

  const fetchStats = useCallback(async () => {
    const safe = async (url: string) => { try { return await fetch(url).then(r => r.json()) } catch { return [] } }
    const safeObj = async (url: string) => { try { return await fetch(url).then(r => r.json()) } catch { return null } }

    const [motor, pump, compressor, turbine, streak, maint] = await Promise.all([
      safe('http://127.0.0.1:5050/motor-history'),
      safe('http://127.0.0.1:5050/pump-history'),
      safe('http://127.0.0.1:5050/compressor-history'),
      safe('http://127.0.0.1:5050/turbine-history'),
      safeObj('http://127.0.0.1:5050/streak'),
      safeObj('http://127.0.0.1:5050/maintenance-risk'),
    ])

    const all = [
      ...motor.map((r:any)=>({...r,machine:'MOTOR'})),
      ...pump.map((r:any)=>({...r,machine:'PUMP'})),
      ...compressor.map((r:any)=>({...r,machine:'COMPRESSOR'})),
      ...turbine.map((r:any)=>({...r,machine:'TURBINE'})),
    ]
    const faultStatuses = ['FAULT','FAULTY','BROKEN','DEGRADED']

    const userFaultRows = all
      .filter(r => faultStatuses.includes(r.prediction))
      .sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime())
      .slice(0,5)
      .map(r=>({
        name: MACHINE_ICON[r.machine]||r.machine,
        type: MACHINE_ICON[r.machine]||r.machine,
        block: 'Test Log',
        health: Math.round(100-r.confidence),
        status: r.prediction,
        days: r.risk_level==='High'?3:14,
        isReal: true,
      }))

    setRealFaults(all.filter(r=>faultStatuses.includes(r.prediction)).length)
    setRealNormal(all.filter(r=>['NORMAL','HEALTHY'].includes(r.prediction)).length)
    setMotorCount(motor.length)
    setPumpCount(pump.length)
    setCompCount(compressor.length)
    setTurbCount(turbine.length)
    setStreakData(streak)

    if (maint) {
      setMaintData(maint)
    } else {
      const autoAlerts = await safe('http://127.0.0.1:5050/alerts/auto')
      const latest: Record<string,any> = {}
      for (const r of (Array.isArray(autoAlerts) ? autoAlerts : [])) {
        if (!latest[r.machine]) latest[r.machine] = r
      }
      const derive = (key: string) => {
        const r = latest[key.toUpperCase()]
        if (!r) return { days_until: 21, risk: 'Low' }
        return {
          days_until: r.risk_level==='High' ? 2 : r.risk_level==='Medium' ? 7 : 21,
          risk: r.risk_level==='High' ? 'High' : r.risk_level==='Medium' ? 'Medium' : 'Low',
        }
      }
      setMaintData({ motor: derive('motor'), pump: derive('pump'), compressor: derive('compressor'), turbine: derive('turbine') })
    }

    setAttention([...userFaultRows, ...DUMMY_ATTENTION])
  }, [user.email])

  useEffect(() => { fetchStats() }, [])
  useEffect(() => {
    const t = setInterval(() => { fetchStats() }, 120000)
    return () => clearInterval(t)
  }, [fetchStats])

  const STATS = [
    { label:'CRITICAL',   val:realFaults,  color:'#c45e0a', icon:'🚨' },
    { label:'NORMAL',     val:realNormal,  color:'#0a7a76', icon:'✅' },
    { label:'MOTOR LOGS', val:motorCount,  color:'#c45e0a', icon:'⚡' },
    { label:'PUMP LOGS',  val:pumpCount,   color:'#1a3f8f', icon:'💧' },
    { label:'COMP LOGS',  val:compCount,   color:'#0a7a76', icon:'🌀' },
    { label:'TURB LOGS',  val:turbCount,   color:'#6025c0', icon:'⚙️' },
  ]

  const motorCurrent   = motorGraph.length>0      ? motorGraph[motorGraph.length-1].value           : null
  const pumpCurrent    = pumpGraph.length>0        ? pumpGraph[pumpGraph.length-1].value             : null
  const compCurrent    = compressorGraph.length>0  ? compressorGraph[compressorGraph.length-1].value : null
  const turbineCurrent = turbineGraph.length>0     ? turbineGraph[turbineGraph.length-1].value       : null

  return (
    <div style={{ padding:28, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        .d-card { background:#FFFFFF; border:1px solid rgba(0,0,0,0.08); border-radius:16px; padding:20px; position:relative; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06); }
        .d-th { padding:10px 16px; text-align:left; font-family:'Rajdhani',sans-serif; font-size:11px; color:#4a5568; font-weight:700; letter-spacing:0.08em; background:rgba(0,0,0,0.02); }
        .d-td { padding:12px 16px; font-size:13px; border-bottom:1px solid rgba(0,0,0,0.05); }
        .d-nav-btn { padding:6px 16px; border-radius:8px; border:1px solid rgba(0,0,0,0.10); cursor:pointer; font-weight:700; font-size:12px; font-family:'Rajdhani',sans-serif; background:rgba(0,48,135,0.06); color:#1a3f8f; letter-spacing:1px; transition:all 0.15s; }
        .d-nav-btn:hover { border-color:rgba(244,121,32,0.35); color:#c45e0a; background:rgba(244,121,32,0.06); }
        tr:hover td { background:rgba(244,121,32,0.02) !important; }
      `}</style>

      {passport && (
        <PassportModal
          machine={passport.machine}
          color={passport.color}
          icon={passport.icon}
          onClose={() => setPassport(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <div style={{ position:'relative', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid #F47920' }} />
            <div style={{ position:'absolute', inset:6, borderRadius:'50%', border:'2px solid #003087' }} />
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#F47920' }} />
          </div>
          <div>
            <h2 style={{ fontFamily:"'Rajdhani',sans-serif", color:'#0d1b2e', fontWeight:700, fontSize:28, margin:0, letterSpacing:'-0.5px' }}>System Dashboard</h2>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#8a9ab5', fontSize:11, marginTop:2, fontWeight:600, letterSpacing:2 }}>
              IOCL GUWAHATI REFINERY · {user.name.toUpperCase()} · {new Date().toLocaleString()}
              {lastUpdated && <span style={{ color:'#0a7a76', marginLeft:12 }}>● UPDATED {lastUpdated}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:14, marginBottom:24 }}>
        {STATS.map(c => (
          <div key={c.label} className="d-card" style={{ padding:'16px 18px' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
              background:`linear-gradient(90deg,${c.color},${c.color}33)`, borderRadius:'16px 16px 0 0' }} />
            <div style={{ fontSize:20, marginBottom:8 }}>{c.icon}</div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:28, fontWeight:700, color:c.color, lineHeight:1 }}>{c.val}</div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, color:'#4a5568', marginTop:5, fontWeight:700, letterSpacing:'0.1em' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* 4 Machine Graphs */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <MachineGraph title="MOTOR — ROTATIONAL SPEED" icon="⚡" color="#c45e0a"
          dataKey="rpm" unit="RPM" yMin={1000} yMax={3000} safeMin={1200} safeMax={2500}
          gridLines={[1000,1500,2000,2500,3000]} data={motorGraph} currentValue={motorCurrent}
          onClick={() => setPassport({machine:'motor',color:'#c45e0a',icon:'⚡'})} />
        <MachineGraph title="PUMP — FLOW PRESSURE" icon="💧" color="#1a3f8f"
          dataKey="pressure" unit="Pa" yMin={0} yMax={5} safeMin={1.5} safeMax={3.5}
          gridLines={[0,1,2,3,4,5]} data={pumpGraph} currentValue={pumpCurrent}
          onClick={() => setPassport({machine:'pump',color:'#1a3f8f',icon:'💧'})} />
        <MachineGraph title="COMPRESSOR — OUTLET PRESSURE" icon="🌀" color="#0a7a76"
          dataKey="pressure" unit="bar" yMin={4} yMax={10} safeMin={6.0} safeMax={9.0}
          gridLines={[4,5,6,7,8,9,10]} data={compressorGraph} currentValue={compCurrent}
          onClick={() => setPassport({machine:'compressor',color:'#0a7a76',icon:'🌀'})} />
        <MachineGraph title="TURBINE — EXHAUST TEMPERATURE" icon="⚙️" color="#6025c0"
          dataKey="temperature" unit="K" yMin={300} yMax={700} safeMin={400} safeMax={560}
          gridLines={[300,400,500,600,700]} data={turbineGraph} currentValue={turbineCurrent}
          onClick={() => setPassport({machine:'turbine',color:'#6025c0',icon:'⚙️'})} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:16, marginBottom:16 }}>
        <MaintenanceWidget data={maintData} />
      </div>

      {/* 24hr health + fleet status */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        <div className="d-card">
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
            background:'linear-gradient(90deg,#6025c0,rgba(96,37,192,0.2))', borderRadius:'16px 16px 0 0' }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#1a3f8f', fontWeight:700, fontSize:11, letterSpacing:2.5 }}>24-HOUR SYSTEM HEALTH</div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#8a9ab5', fontSize:9, fontWeight:600, letterSpacing:1 }}>Y: HEALTH % | X: HOUR OF DAY</div>
          </div>
          <HealthBarChart data={healthBars} />
          <div style={{ display:'flex', justifyContent:'space-between', fontFamily:"'Rajdhani',sans-serif", fontSize:10, color:'#8a9ab5', marginTop:8, fontWeight:600, letterSpacing:1 }}>
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>NOW</span>
          </div>
        </div>
        <div className="d-card">
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
            background:'linear-gradient(90deg,#F47920,rgba(244,121,32,0.2))', borderRadius:'16px 16px 0 0' }} />
          <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#1a3f8f', fontWeight:700, fontSize:11, letterSpacing:2.5, marginBottom:16 }}>FLEET STATUS</div>
          {[['Critical',realFaults,'#c45e0a'],['Warning',7,'#b45309'],['Normal',realNormal,'#0a7a76']].map(([s,n,c]) => (
            <div key={s as string} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontFamily:"'Rajdhani',sans-serif", fontSize:11, marginBottom:5, fontWeight:700 }}>
                <span style={{ color:c as string }}>{s}</span>
                <span style={{ color:'#8a9ab5' }}>{n as number}/20</span>
              </div>
              <div style={{ background:'rgba(0,0,0,0.07)', borderRadius:4, height:5 }}>
                <div style={{ width:`${Math.min(((n as number)/20)*100,100)}%`, height:5, background:c as string, borderRadius:4 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop:16, background:'#F0F4F8', borderRadius:10, padding:12, textAlign:'center', border:'1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, color:'#8a9ab5', fontWeight:600, letterSpacing:1.5 }}>OVERALL HEALTH</div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:30, fontWeight:700, color:'#b45309' }}>71%</div>
          </div>
        </div>
      </div>

      {/* Fleet Risk table */}
      <div className="d-card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 20px 14px' }}>
          <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#1a3f8f', fontWeight:700, fontSize:11, letterSpacing:2.5 }}>⚠ MACHINES NEEDING ATTENTION</div>
          <button className="d-nav-btn" onClick={() => setPage('alerts')}>Alerts →</button>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Machine','Type','Block','Health','Status','Forecast'].map(h => (
              <th key={h} className="d-th">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {attention.map((m,i) => (
              <tr key={i} style={{ background:i%2===0?'transparent':'rgba(0,0,0,0.015)' }}>
                <td className="d-td" style={{ color:m.isReal?'#c45e0a':'#1a2744', fontWeight:600, fontFamily:"'Rajdhani',sans-serif" }}>
                  {m.name} {m.isReal && <span style={{ fontSize:9, color:'#c45e0a', fontWeight:700 }}>●LIVE</span>}
                </td>
                <td className="d-td" style={{ color:'#4a5568', fontSize:12, fontFamily:"'Rajdhani',sans-serif", fontWeight:600 }}>{m.type}</td>
                <td className="d-td" style={{ color:'#4a5568', fontSize:12, fontFamily:"'Rajdhani',sans-serif", fontWeight:600 }}>{m.block}</td>
                <td className="d-td"><HealthRing value={m.health} /></td>
                <td className="d-td"><StatusBadge s={m.status} /></td>
                <td className="d-td" style={{ color:m.days<=14?'#c45e0a':m.days<=30?'#b45309':'#0a7a76', fontWeight:700, fontFamily:"'Rajdhani',sans-serif", fontSize:14 }}>~{m.days}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}