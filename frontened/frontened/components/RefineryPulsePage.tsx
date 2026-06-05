'use client'

import { useState } from 'react'
import { useGlobalData } from '@/app/context/GlobalDataContext'

function StatusBadge({ s }: { s: string }) {
  const map: Record<string,[string,string]> = {
    Normal:   ['rgba(10,122,118,0.10)',  '#0a7a76'],
    Warning:  ['rgba(180,83,9,0.10)',    '#b45309'],
    Critical: ['rgba(196,94,10,0.10)',   '#c45e0a'],
  }
  const [bg,cl] = map[s] || ['rgba(26,63,143,0.10)','#1a3f8f']
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:bg, color:cl,
      border:`1px solid ${cl}44`, borderRadius:6, padding:'3px 10px', fontSize:11,
      fontWeight:700, fontFamily:"'Rajdhani',sans-serif", letterSpacing:'0.08em' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:cl }} />
      {s}
    </span>
  )
}

function ParamModal({ row, onClose }: { row: any; onClose: () => void }) {
  const accentColor = row.level === 'Critical' ? '#c45e0a' : row.level === 'Warning' ? '#b45309' : '#0a7a76'
  const params = row.params || {}
  const entries = Object.entries(params).filter(([,v]) => v != null && v !== undefined && v !== '')

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={onClose}>
      <div style={{ background:'#FFFFFF', border:`1px solid ${accentColor}33`,
        borderRadius:20, padding:28, width:'100%', maxWidth:440, position:'relative',
        boxShadow:`0 20px 60px rgba(0,0,0,0.15)` }}
        onClick={e => e.stopPropagation()}>

        <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
          background:`linear-gradient(90deg,${accentColor},transparent)`,
          borderRadius:'20px 20px 0 0' }} />

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, color:'#8a9ab5',
              fontWeight:700, letterSpacing:2.5, marginBottom:6 }}>🔍 SENSOR PARAMETERS AT PREDICTION TIME</div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:20, fontWeight:700,
              color:'#0d1b2e', letterSpacing:0.5 }}>{row.machine}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
              <StatusBadge s={row.level} />
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, color:'#8a9ab5',
                fontWeight:600, letterSpacing:1 }}>{row.prediction}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(0,0,0,0.04)',
            border:'1px solid rgba(0,0,0,0.10)', borderRadius:8, width:32, height:32,
            color:'#4a5568', cursor:'pointer', fontSize:16, display:'flex',
            alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, color:'#8a9ab5',
          fontWeight:600, letterSpacing:1.5, marginBottom:16 }}>
          🕐 {row.time}
        </div>

        {entries.length > 0 ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {entries.map(([label, val]) => {
              const numVal = parseFloat(val as string)
              return (
                <div key={label} style={{ background:'#F0F4F8',
                  border:'1px solid rgba(0,0,0,0.07)', borderRadius:12,
                  padding:'12px 14px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, bottom:0, width:3,
                    background:accentColor, borderRadius:'12px 0 0 12px', opacity:0.7 }} />
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:9, color:'#8a9ab5',
                    fontWeight:700, letterSpacing:1.5, marginBottom:4 }}>{label.toUpperCase()}</div>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:20, fontWeight:700,
                    color: row.level === 'Critical' ? accentColor : '#1a2744', lineHeight:1 }}>
                    {isNaN(numVal) ? String(val) : numVal % 1 === 0 ? numVal : numVal.toFixed(2)}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'24px 0', color:'#8a9ab5',
            fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:600, letterSpacing:2 }}>
            PARAMETER DATA NOT AVAILABLE
          </div>
        )}

        <div style={{ marginTop:16, background:`${accentColor}0d`, border:`1px solid ${accentColor}33`,
          borderRadius:10, padding:'10px 14px', display:'flex', justifyContent:'space-between',
          alignItems:'center' }}>
          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, color:'#8a9ab5',
            fontWeight:700, letterSpacing:1.5 }}>MODEL CONFIDENCE</span>
          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18, fontWeight:700,
            color:accentColor }}>{row.value}</span>
        </div>
      </div>
    </div>
  )
}

export default function RefineryPulsePage() {
  const { feedRows, lastSync } = useGlobalData()
  const [filter,      setFilter]      = useState('All')
  const [search,      setSearch]      = useState('')
  const [selectedRow, setSelectedRow] = useState<any | null>(null)

  const rows = feedRows.filter(r =>
    (filter === 'All' || r.level === filter) &&
    (r.machine.toLowerCase().includes(search.toLowerCase()) ||
     r.event.toLowerCase().includes(search.toLowerCase()))
  )

  const criticalCount = feedRows.filter(r => r.level === 'Critical').length
  const warningCount  = feedRows.filter(r => r.level === 'Warning').length
  const normalCount   = feedRows.filter(r => r.level === 'Normal').length

  return (
    <div style={{ padding:28, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        .rp-input { padding:9px 14px; border-radius:10px; border:1px solid rgba(0,0,0,0.10); background:#FFFFFF; color:#1a2744; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; width:240px; transition:border-color 0.2s; box-shadow:0 1px 4px rgba(0,0,0,0.05); }
        .rp-input:focus { border-color:rgba(14,165,160,0.4); }
        .rp-filter { padding:6px 18px; border-radius:8px; font-size:12px; font-family:'Rajdhani',sans-serif; font-weight:700; letter-spacing:0.08em; cursor:pointer; transition:all 0.15s; border:1px solid rgba(0,0,0,0.10); background:transparent; color:#4a5568; }
        .rp-filter.active { background:rgba(10,122,118,0.10); color:#0a7a76; border-color:rgba(14,165,160,0.30); }
        .rp-filter:not(.active):hover { color:#1a2744; border-color:rgba(0,0,0,0.20); }
        .h-th { padding:10px 16px; text-align:left; font-family:'Rajdhani',sans-serif; font-size:11px; color:#4a5568; font-weight:700; letter-spacing:0.08em; background:rgba(0,0,0,0.02); }
        .h-td { padding:12px 16px; font-size:13px; border-bottom:1px solid rgba(0,0,0,0.05); }
        tr:hover td { background:rgba(14,165,160,0.02) !important; }
        .auto-row { border-left:3px solid #0a7a76; }
        .view-btn { background:rgba(26,63,143,0.08); border:1px solid rgba(26,63,143,0.25); border-radius:6px; padding:4px 12px; color:#1a3f8f; cursor:pointer; font-size:11px; font-family:'Rajdhani',sans-serif; font-weight:700; letter-spacing:1px; transition:all 0.15s; }
        .view-btn:hover { background:rgba(26,63,143,0.15); border-color:rgba(26,63,143,0.45); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:700, letterSpacing:3,
            padding:'3px 10px', borderRadius:6, background:'rgba(10,122,118,0.10)', color:'#0a7a76',
            border:'1px solid rgba(14,165,160,0.25)' }}>🛢️ REFINERY PULSE</span>
          {lastSync && <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:9, color:'#0a7a76', fontWeight:700, letterSpacing:1 }}>● SYNCED {lastSync}</span>}
          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:9, color:'#0a7a76', fontWeight:700, letterSpacing:1 }}>🟢 LIVE — Updates every 2 min</span>
        </div>
        <h2 style={{ fontFamily:"'Rajdhani',sans-serif", color:'#0d1b2e', fontWeight:700, fontSize:28, margin:0, letterSpacing:'-0.5px' }}>Refinery Pulse</h2>
        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, color:'#8a9ab5', marginTop:4, fontWeight:600, letterSpacing:1.5 }}>
          AUTO-GENERATED SENSOR DATA · GUWAHATI REFINERY · system.auto@iocl.co.in
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'CRITICAL', val:criticalCount, color:'#c45e0a', icon:'🚨' },
          { label:'WARNING',  val:warningCount,  color:'#b45309', icon:'⚠️' },
          { label:'NORMAL',   val:normalCount,   color:'#0a7a76', icon:'✅' },
        ].map(c => (
          <div key={c.label} style={{ background:'#FFFFFF', border:`1px solid ${c.color}22`,
            borderRadius:16, padding:'16px 18px', position:'relative', overflow:'hidden',
            boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
              background:`linear-gradient(90deg,${c.color},${c.color}33)`, borderRadius:'16px 16px 0 0' }} />
            <div style={{ fontSize:20, marginBottom:8 }}>{c.icon}</div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:28, fontWeight:700, color:c.color, lineHeight:1 }}>{c.val}</div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, color:'#4a5568', marginTop:5, fontWeight:700, letterSpacing:'0.1em' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <input className="rp-input" placeholder="Search machine or event..."
          value={search} onChange={e => setSearch(e.target.value)} />
        {['All','Normal','Warning','Critical'].map(f => (
          <button key={f} className={`rp-filter${filter===f?' active':''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11, color:'#8a9ab5',
          marginLeft:'auto', fontWeight:600, letterSpacing:1.5 }}>{rows.length} RECORDS</span>
      </div>

      {/* Table */}
      <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.08)', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['#','Machine','Event','Level','Confidence','Timestamp','Parameters'].map(h => (
              <th key={h} className="h-th">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={r.id} className="auto-row"
                style={{ background:i%2===0?'transparent':'rgba(0,0,0,0.015)' }}>
                <td className="h-td" style={{ color:'#8a9ab5', fontSize:11, fontFamily:"'Rajdhani',sans-serif", fontWeight:600 }}>{i+1}</td>
                <td className="h-td" style={{ color:'#0a7a76', fontWeight:700, fontFamily:"'Rajdhani',sans-serif", fontSize:14, letterSpacing:0.5 }}>
                  {r.machine}
                  <span style={{ fontSize:9, color:'#0a7a76', fontWeight:700, letterSpacing:1, marginLeft:4 }}>●AUTO</span>
                </td>
                <td className="h-td" style={{ color:'#1a2744' }}>{r.event}</td>
                <td className="h-td"><StatusBadge s={r.level} /></td>
                <td className="h-td" style={{ color:'#4a5568', fontFamily:"'Rajdhani',sans-serif", fontWeight:600, fontSize:12 }}>{r.value}</td>
                <td className="h-td" style={{ color:'#8a9ab5', fontSize:11, fontFamily:"'Rajdhani',sans-serif", fontWeight:600 }}>{r.time}</td>
                <td className="h-td">
                  <button className="view-btn" onClick={() => setSelectedRow(r)}>🔍 VIEW</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ textAlign:'center', padding:40, color:'#8a9ab5',
            fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:600, letterSpacing:2 }}>
            NO AUTO DATA YET — SIMULATOR RUNS EVERY 2 MIN
          </div>
        )}
      </div>

      {selectedRow && <ParamModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
    </div>
  )
}