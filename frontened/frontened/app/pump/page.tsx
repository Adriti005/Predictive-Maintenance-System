'use client'

import { useState } from 'react'
import { Send, Minus, ArrowLeft, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'

const PUMP_API_URL  = process.env.NEXT_PUBLIC_PUMP_API_URL  ?? 'http://127.0.0.1:5050/predict/pump'
const PUMP_SAVE_URL = process.env.NEXT_PUBLIC_PUMP_SAVE_URL ?? 'http://127.0.0.1/nextjsbackend/save_pump_prediction.php'

type PumpResult = {
  status: 'NORMAL' | 'BROKEN' | 'RECOVERING'
  confidence: number
  risk_level: 'Low' | 'Medium' | 'High'
  recommendation: string
}

export default function PumpPage() {
  const router = useRouter()
  const [sensors, setSensors] = useState<Record<string, string>>({})
  const [result, setResult]   = useState<PumpResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [saved, setSaved]     = useState<string | null>(null)

  const sensorFields = [
    { key: 'sensor_00', label: 'Sensor 00', placeholder: 'e.g. 2.45' },
    { key: 'sensor_02', label: 'Sensor 02', placeholder: 'e.g. 47.3' },
    { key: 'sensor_03', label: 'Sensor 03', placeholder: 'e.g. 0.82' },
    { key: 'sensor_04', label: 'Sensor 04', placeholder: 'e.g. 1.15' },
    { key: 'sensor_05', label: 'Sensor 05', placeholder: 'e.g. 0.64' },
    { key: 'sensor_06', label: 'Sensor 06', placeholder: 'e.g. 3.72' },
    { key: 'sensor_07', label: 'Sensor 07', placeholder: 'e.g. 0.91' },
    { key: 'sensor_08', label: 'Sensor 08', placeholder: 'e.g. 2.18' },
    { key: 'sensor_09', label: 'Sensor 09', placeholder: 'e.g. 0.55' },
    { key: 'sensor_10', label: 'Sensor 10', placeholder: 'e.g. 1.37' },
    { key: 'sensor_11', label: 'Sensor 11', placeholder: 'e.g. 0.79' },
    { key: 'sensor_12', label: 'Sensor 12', placeholder: 'e.g. 4.01' },
  ]

  const handleChange = (key: string, val: string) =>
    setSensors(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null); setSaved(null)

    try {
      const res = await fetch(PUMP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sensors, user_email: localStorage.getItem('user_email') ?? '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `API error ${res.status}`)
      setResult(data)

      setSaved('Result saved to database.')

    } catch (err: any) {
      setError(err.message ?? 'Could not reach the pump prediction API.')
    } finally { setLoading(false) }
  }

  // Status colors — keep semantic meaning (green=normal, amber=recovering, red=broken)
  const statusColor =
    result?.status === 'NORMAL'     ? '#1d9e75' :
    result?.status === 'RECOVERING' ? '#f47920' : '#ef4444'

  const statusBg =
    result?.status === 'NORMAL'     ? 'rgba(29,158,117,0.08)' :
    result?.status === 'RECOVERING' ? 'rgba(244,121,32,0.08)' : 'rgba(239,68,68,0.08)'

  return (
    <main className="page-root">
      <div className="page-bg" />
      <div className="noise" />
      <div className="page-container">

        <div className="page-header">
          <button onClick={() => router.push('/pump/diagnostics')} className="back-btn">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="page-header-text">
            <div className="page-badge pump-badge">
              <Activity size={12} /> PUMP DIAGNOSTICS
            </div>
            <h1 className="page-title">Pump Fault Predictor</h1>
            <p className="page-sub">Enter key sensor readings to predict pump status</p>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <h2 className="section-title">Sensor Readings</h2>
            <p className="section-sub">Enter values for the key sensors below (others default to median)</p>

            <div className="sensors-grid">
              {sensorFields.map(({ key, label, placeholder }) => (
                <div key={key} className="field">
                  <label className="field-label">{label}</label>
                  <input
                    type="number"
                    step="any"
                    placeholder={placeholder}
                    value={sensors[key] ?? ''}
                    onChange={e => handleChange(key, e.target.value)}
                    className="field-input pump-input"
                  />
                </div>
              ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {saved  && <div className="alert alert-info">{saved}</div>}

            <button type="submit" disabled={loading} className="submit-btn pump-btn">
              {loading
                ? <><span className="spin"><Minus size={18}/></span> Analyzing Pump...</>
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
      <style>{pageStyles('pump')}</style>
    </main>
  )
}

export function pageStyles(type: 'pump' | 'motor' | 'turbine') {
  // Accent ramps matching the home page brand colors:
  //   pump    → IOCL blue  (#003087 / #2c5db3)
  //   motor   → IOCL orange (#F47920)
  //   turbine → IOCL purple (#7c3aed)
  const accent = {
    pump:    { main: '#2c5db3', dark: '#003087', rgb: '44,93,179',   grad: '#003087, #2c5db3' },
    motor:   { main: '#f47920', dark: '#c45e0a', rgb: '244,121,32',  grad: '#c45e0a, #f47920' },
    turbine: { main: '#7c3aed', dark: '#6d28d9', rgb: '124,58,237',  grad: '#6d28d9, #7c3aed' },
  }[type]

  return `
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── BACKGROUND — light, matching home page ── */
    .page-root {
      min-height: 100vh;
      background: #F0F4F8;
      font-family: 'Space Grotesk', sans-serif;
      position: relative;
      overflow-x: hidden;
    }
    .page-bg {
      position: fixed; inset: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 60% 50% at 15% 20%, rgba(${accent.rgb},0.10) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 85% 80%, rgba(0,48,135,0.08) 0%, transparent 55%),
        repeating-linear-gradient(0deg,  transparent, transparent 79px, rgba(0,0,0,0.03) 80px),
        repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(0,0,0,0.03) 80px);
    }
    .noise {
      position: fixed; inset: 0; pointer-events: none; opacity: 0.02;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 200px;
    }

    .page-container {
      position: relative; max-width: 860px; margin: 0 auto;
      padding: 40px 20px 80px; display: flex; flex-direction: column; gap: 28px;
    }

    /* ── HEADER ── */
    .page-header { display: flex; align-items: flex-start; gap: 20px; }
    .back-btn {
      display: flex; align-items: center; gap: 6px;
      background: #fff; border: 1px solid rgba(0,0,0,0.10);
      color: #4a5568; padding: 10px 16px; border-radius: 10px;
      cursor: pointer; font-family: 'Space Grotesk', sans-serif;
      font-size: 0.85rem; font-weight: 600;
      transition: all 0.2s; white-space: nowrap; flex-shrink: 0; margin-top: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .back-btn:hover { background: rgba(${accent.rgb},0.06); color: ${accent.dark}; border-color: rgba(${accent.rgb},0.25); }

    .page-header-text { flex: 1; }

    /* Badge — matches card label style from home page */
    .page-badge {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: 'Rajdhani', sans-serif; font-size: 0.6rem; font-weight: 700;
      letter-spacing: 2.5px; padding: 4px 12px; border-radius: 6px; margin-bottom: 12px;
    }
    .pump-badge    { color: #1a3f8f; background: rgba(0,48,135,0.08);  border: 1px solid rgba(0,48,135,0.20); }
    .motor-badge   { color: #c45e0a; background: rgba(244,121,32,0.10); border: 1px solid rgba(244,121,32,0.25); }
    .turbine-badge { color: #6025c0; background: rgba(124,58,237,0.10); border: 1px solid rgba(124,58,237,0.25); }

    .page-title {
      font-family: 'Rajdhani', sans-serif;
      font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 700;
      color: #0d1b2e; letter-spacing: -0.5px; margin-bottom: 6px;
    }
    .page-sub { font-size: 0.9rem; color: #4a5568; }

    /* ── CARD — white with subtle shadow ── */
    .card {
      background: #fff;
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 20px; padding: 32px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .result-card { transition: border-color 0.3s; }

    .section-title { font-family: 'Rajdhani', sans-serif; font-size: 1.15rem; font-weight: 700; color: #1a2744; margin-bottom: 6px; letter-spacing: -0.2px; }
    .section-sub   { font-size: 0.85rem; color: #4a5568; margin-bottom: 24px; }

    /* ── SENSOR GRID ── */
    .sensors-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px; margin-bottom: 24px;
    }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-label {
      font-family: 'JetBrains Mono', monospace; font-size: 11px;
      font-weight: 600; letter-spacing: 1px; color: #6b7a99;
    }
    .field-input {
      background: #F7F9FC;
      border: 1px solid rgba(0,0,0,0.10);
      border-radius: 10px; padding: 10px 14px;
      color: #1a2744;
      font-family: 'JetBrains Mono', monospace; font-size: 0.9rem;
      width: 100%; transition: border-color 0.2s;
    }
    .field-input::placeholder { color: #b0bdd4; }
    .field-input:focus { outline: none; }
    .pump-input:focus    { border-color: rgba(${accent.rgb},0.5); background: rgba(${accent.rgb},0.03); }
    .motor-input:focus   { border-color: rgba(244,121,32,0.5);   background: rgba(244,121,32,0.03); }
    .turbine-input:focus { border-color: rgba(124,58,237,0.5);   background: rgba(124,58,237,0.03); }

    /* ── ALERTS ── */
    .alert { border-radius: 10px; padding: 12px 16px; font-size: 0.85rem; margin-bottom: 20px; }
    .alert-error { background: rgba(239,68,68,0.06);  border: 1px solid rgba(239,68,68,0.20);  color: #991b1b; }
    .alert-info  { background: rgba(${accent.rgb},0.06); border: 1px solid rgba(${accent.rgb},0.20); color: ${accent.dark}; }

    /* ── SUBMIT BUTTON — gradient matching home page card footer accent ── */
    .submit-btn {
      width: 100%; padding: 14px; border: none; border-radius: 12px;
      font-family: 'Rajdhani', sans-serif; font-size: 1rem; font-weight: 700;
      letter-spacing: 0.5px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: all 0.2s; color: #fff;
    }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .pump-btn    { background: linear-gradient(135deg, ${accent.grad}); }
    .motor-btn   { background: linear-gradient(135deg, #c45e0a, #f47920); }
    .turbine-btn { background: linear-gradient(135deg, #6d28d9, #7c3aed); }
    .pump-btn:hover:not(:disabled)    { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(${accent.rgb},0.25); }
    .motor-btn:hover:not(:disabled)   { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(244,121,32,0.25); }
    .turbine-btn:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124,58,237,0.25); }

    .spin { display: inline-block; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── RESULT CARD ── */
    .result-status-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; }
    .status-badge {
      font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; font-weight: 700;
      padding: 10px 24px; border-radius: 10px; border: 1px solid; letter-spacing: 2px;
    }
    .status-meta    { display: flex; flex-direction: column; gap: 2px; }
    .meta-label     { font-size: 0.75rem; color: #6b7a99; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
    .meta-value     { font-size: 1.2rem; font-weight: 700; color: #1a2744; }

    .confidence-bar-wrap { height: 6px; background: rgba(0,0,0,0.07); border-radius: 100px; overflow: hidden; margin-bottom: 24px; }
    .confidence-bar      { height: 100%; border-radius: 100px; transition: width 0.8s ease; }

    .recommendation-box { border: 1px solid; border-radius: 12px; padding: 16px 20px; }
    .rec-label { font-size: 0.75rem; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #6b7a99; margin-bottom: 6px; font-family: 'Rajdhani', sans-serif; }
    .rec-text  { font-size: 0.95rem; color: #2d3748; line-height: 1.6; }
  `
}
