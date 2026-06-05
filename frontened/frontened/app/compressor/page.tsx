'use client'

import { useState } from 'react'
import { Send, Minus, ArrowLeft, Wind } from 'lucide-react'
import { useRouter } from 'next/navigation'

const COMPRESSOR_API_URL  = process.env.NEXT_PUBLIC_COMPRESSOR_API_URL  ?? 'http://127.0.0.1:5050/predict/compressor'
const COMPRESSOR_SAVE_URL = process.env.NEXT_PUBLIC_COMPRESSOR_SAVE_URL ?? 'http://127.0.0.1/nextjsbackend/save_compressor_prediction.php'

type CompressorResult = {
  status: 'NORMAL' | 'FAULT' | 'DEGRADED'
  confidence: number
  risk_level: 'Low' | 'Medium' | 'High'
  recommendation: string
}

export default function CompressorPage() {
  const router = useRouter()
  const [inputs, setInputs]   = useState<Record<string, string>>({})
  const [result, setResult]   = useState<CompressorResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [saved, setSaved]     = useState<string | null>(null)

  const fields = [
    { key: 'rpm',                 label: 'RPM',                   placeholder: 'e.g. 2950' },
    { key: 'motor_power',         label: 'Motor Power (kW)',       placeholder: 'e.g. 15.4' },
    { key: 'torque',              label: 'Torque (Nm)',            placeholder: 'e.g. 48.2' },
    { key: 'outlet_pressure_bar', label: 'Outlet Pressure (bar)', placeholder: 'e.g. 7.5'  },
    { key: 'air_flow',            label: 'Air Flow (CFM)',         placeholder: 'e.g. 320'  },
    { key: 'noise_db',            label: 'Noise (dB)',             placeholder: 'e.g. 72'   },
    { key: 'outlet_temp',         label: 'Outlet Temp (°C)',       placeholder: 'e.g. 85'   },
    { key: 'gaccx',               label: 'Accel X (G)',            placeholder: 'e.g. 0.12' },
    { key: 'gaccy',               label: 'Accel Y (G)',            placeholder: 'e.g. 0.09' },
    { key: 'gaccz',               label: 'Accel Z (G)',            placeholder: 'e.g. 0.15' },
    { key: 'haccx',               label: 'H-Accel X',              placeholder: 'e.g. 0.04' },
    { key: 'haccy',               label: 'H-Accel Y',              placeholder: 'e.g. 0.06' },
    { key: 'haccz',               label: 'H-Accel Z',              placeholder: 'e.g. 0.03' },
    { key: 'bearings',            label: 'Bearings',               placeholder: 'e.g. 0.21' },
  ]

  const handleChange = (key: string, val: string) =>
    setInputs(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null); setSaved(null)
    try {
      const res = await fetch(COMPRESSOR_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inputs, user_email: localStorage.getItem('user_email') ?? '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `API error ${res.status}`)
      setResult(data)
      setSaved('Result saved to database.')
    } catch (err: any) {
      setError(err.message ?? 'Could not reach the compressor prediction API.')
    } finally { setLoading(false) }
  }

  const statusColor =
    result?.status === 'NORMAL'   ? '#1d9e75' :
    result?.status === 'DEGRADED' ? '#f47920' : '#ef4444'

  const statusBg =
    result?.status === 'NORMAL'   ? 'rgba(29,158,117,0.08)' :
    result?.status === 'DEGRADED' ? 'rgba(244,121,32,0.08)' : 'rgba(239,68,68,0.08)'

  return (
    <main className="page-root">
      <div className="page-bg" />
      <div className="noise" />
      <div className="page-container">

        <div className="page-header">
          <button onClick={() => router.push('/compressor/diagnostics')} className="back-btn">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="page-header-text">
            <div className="page-badge compressor-badge">
              <Wind size={12} /> COMPRESSOR DIAGNOSTICS
            </div>
            <h1 className="page-title">Compressor Fault Predictor</h1>
            <p className="page-sub">Enter sensor readings to predict compressor health</p>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <h2 className="section-title">Sensor Readings</h2>
            <p className="section-sub">Enter values for the key sensors below (others default to median)</p>
            <div className="sensors-grid">
              {fields.map(({ key, label, placeholder }) => (
                <div key={key} className="field">
                  <label className="field-label">{label}</label>
                  <input
                    type="number" step="any" placeholder={placeholder}
                    value={inputs[key] ?? ''}
                    onChange={e => handleChange(key, e.target.value)}
                    className="field-input compressor-input"
                  />
                </div>
              ))}
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            {saved  && <div className="alert alert-info">{saved}</div>}
            <button type="submit" disabled={loading} className="submit-btn compressor-btn">
              {loading
                ? <><span className="spin"><Minus size={18}/></span> Analyzing Compressor...</>
                : <><Send size={18}/> Run Fault Detection</>}
            </button>
          </form>
        </div>

        {result && (
          <div className="card result-card" style={{ borderColor: statusColor + '44' }}>
            <h2 className="section-title">Prediction Result</h2>
            <div className="result-status-row">
              <div className="status-badge" style={{ background: statusBg, color: statusColor, borderColor: statusColor + '55' }}>
                {result.status}
              </div>
              <div className="status-meta">
                <span className="meta-label">Confidence</span>
                <span className="meta-value" style={{ color: statusColor }}>{result.confidence}%</span>
              </div>
              <div className="status-meta">
                <span className="meta-label">Risk Level</span>
                <span className="meta-value">{result.risk_level}</span>
              </div>
            </div>
            <div className="confidence-bar-wrap">
              <div className="confidence-bar" style={{ width: `${result.confidence}%`, background: statusColor }} />
            </div>
            <div className="recommendation-box" style={{ borderColor: statusColor + '33', background: statusBg }}>
              <p className="rec-label">Recommendation</p>
              <p className="rec-text">{result.recommendation}</p>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .page-root { min-height: 100vh; background: #F0F4F8; font-family: 'Space Grotesk', sans-serif; position: relative; overflow-x: hidden; }
        .page-bg { position: fixed; inset: 0; pointer-events: none; background: radial-gradient(ellipse 60% 50% at 15% 20%, rgba(44,93,179,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 85% 80%, rgba(0,48,135,0.08) 0%, transparent 55%), repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(0,0,0,0.03) 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(0,0,0,0.03) 80px); }
        .noise { position: fixed; inset: 0; pointer-events: none; opacity: 0.02; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 200px; }
        .page-container { position: relative; max-width: 860px; margin: 0 auto; padding: 40px 20px 80px; display: flex; flex-direction: column; gap: 28px; }
        .page-header { display: flex; align-items: flex-start; gap: 20px; }
        .back-btn { display: flex; align-items: center; gap: 6px; background: #fff; border: 1px solid rgba(0,0,0,0.10); color: #4a5568; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-family: 'Space Grotesk', sans-serif; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; margin-top: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .back-btn:hover { background: rgba(244,121,32,0.06); color: #c45e0a; border-color: rgba(244,121,32,0.25); }
        .page-header-text { flex: 1; }
        .page-badge { display: inline-flex; align-items: center; gap: 6px; font-family: 'Rajdhani', sans-serif; font-size: 0.6rem; font-weight: 700; letter-spacing: 2.5px; padding: 4px 12px; border-radius: 6px; margin-bottom: 12px; }
        .compressor-badge { color: #c45e0a; background: rgba(244,121,32,0.10); border: 1px solid rgba(244,121,32,0.25); }
        .page-title { font-family: 'Rajdhani', sans-serif; font-size: clamp(1.6rem,4vw,2.4rem); font-weight: 700; color: #0d1b2e; letter-spacing: -0.5px; margin-bottom: 6px; }
        .page-sub { font-size: 0.9rem; color: #4a5568; }
        .card { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 20px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .result-card { transition: border-color 0.3s; }
        .section-title { font-family: 'Rajdhani', sans-serif; font-size: 1.15rem; font-weight: 700; color: #1a2744; margin-bottom: 6px; letter-spacing: -0.2px; }
        .section-sub { font-size: 0.85rem; color: #4a5568; margin-bottom: 24px; }
        .sensors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 16px; margin-bottom: 24px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: 1px; color: #6b7a99; }
        .field-input { background: #F7F9FC; border: 1px solid rgba(0,0,0,0.10); border-radius: 10px; padding: 10px 14px; color: #1a2744; font-family: 'JetBrains Mono', monospace; font-size: 0.9rem; width: 100%; transition: border-color 0.2s; }
        .field-input::placeholder { color: #b0bdd4; }
        .field-input:focus { outline: none; }
        .compressor-input:focus { border-color: rgba(244,121,32,0.5); background: rgba(244,121,32,0.03); }
        .alert { border-radius: 10px; padding: 12px 16px; font-size: 0.85rem; margin-bottom: 20px; }
        .alert-error { background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.20); color: #991b1b; }
        .alert-info  { background: rgba(244,121,32,0.06); border: 1px solid rgba(244,121,32,0.20); color: #c45e0a; }
        .submit-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; font-family: 'Rajdhani', sans-serif; font-size: 1rem; font-weight: 700; letter-spacing: 0.5px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; color: #fff; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .compressor-btn { background: linear-gradient(135deg, #c45e0a, #f47920); }
        .compressor-btn:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(244,121,32,0.25); }
        .spin { display: inline-block; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .result-status-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; }
        .status-badge { font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; font-weight: 700; padding: 10px 24px; border-radius: 10px; border: 1px solid; letter-spacing: 2px; }
        .status-meta { display: flex; flex-direction: column; gap: 2px; }
        .meta-label { font-size: 0.75rem; color: #6b7a99; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
        .meta-value { font-size: 1.2rem; font-weight: 700; color: #1a2744; }
        .confidence-bar-wrap { height: 6px; background: rgba(0,0,0,0.07); border-radius: 100px; overflow: hidden; margin-bottom: 24px; }
        .confidence-bar { height: 100%; border-radius: 100px; transition: width 0.8s ease; }
        .recommendation-box { border: 1px solid; border-radius: 12px; padding: 16px 20px; }
        .rec-label { font-size: 0.75rem; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #6b7a99; margin-bottom: 6px; font-family: 'Rajdhani', sans-serif; }
        .rec-text { font-size: 0.95rem; color: #2d3748; line-height: 1.6; }
      `}</style>
    </main>
  )
}