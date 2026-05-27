'use client'

import { useState } from 'react'
import MotorPage from './motor/page'
import PumpPage from './pump/page'

type MachineType = 'motor' | 'pump' | null

export default function HomePage() {
  const [selected, setSelected] = useState<MachineType>(null)

  if (selected === 'motor') return <MotorPage onBack={() => setSelected(null)} />
  if (selected === 'pump')  return <PumpPage  onBack={() => setSelected(null)} />

  return (
    <main className="selector-root">
      <div className="selector-bg" />
      <div className="noise" />

      <div className="selector-container">
        <div className="selector-header">
          <div className="iocl-logo-row">
            <div className="iocl-emblem">
              <div className="emblem-ring outer-ring" />
              <div className="emblem-ring inner-ring" />
              <div className="emblem-core" />
            </div>
            <div className="iocl-wordmark">
              <span className="iocl-name">IndianOil</span>
              <span className="iocl-tagline">PREDICTIVE MAINTENANCE</span>
            </div>
          </div>

          <h1 className="header-title">Fault Detection System</h1>
          <p className="header-sub">
            ML-powered industrial diagnostics for motors &amp; pumps
          </p>
        </div>

        <div className="cards-row">
          {/* Motor Card */}
          <button className="machine-card motor-card" onClick={() => setSelected('motor')}>
            <div className="card-streak motor-streak" />
            <div className="card-top">
              <div className="card-icon-wrap motor-icon-bg">
                <svg viewBox="0 0 64 64" className="card-icon" fill="none">
                  <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="3"/>
                  <circle cx="32" cy="32" r="8"  fill="currentColor" opacity="0.25"/>
                  <circle cx="32" cy="32" r="3"  fill="currentColor"/>
                  <line x1="32" y1="4"  x2="32" y2="14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="32" y1="50" x2="32" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="4"  y1="32" x2="14" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="50" y1="32" x2="60" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="11.5" y1="11.5" x2="18.5" y2="18.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="45.5" y1="45.5" x2="52.5" y2="52.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="52.5" y1="11.5" x2="45.5" y2="18.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="18.5" y1="45.5" x2="11.5" y2="52.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="card-label motor-label">MOTOR</div>
            </div>
            <div className="card-content">
              <h2 className="card-title">Motor Analysis</h2>
              <p className="card-desc">
                Vibration &amp; current sensor analysis. Detect bearing faults,
                winding failures, and rotor imbalance in real time.
              </p>
              <div className="card-features">
                <span className="feature-tag motor-tag">Vibration Sensors</span>
                <span className="feature-tag motor-tag">Current Analysis</span>
                <span className="feature-tag motor-tag">Bearing Fault</span>
              </div>
            </div>
            <div className="card-footer motor-footer">
              <span>Run Diagnostics</span>
              <span className="arrow">→</span>
            </div>
          </button>

          {/* Divider */}
          <div className="cards-divider"><span>OR</span></div>

          {/* Pump Card */}
          <button className="machine-card pump-card" onClick={() => setSelected('pump')}>
            <div className="card-streak pump-streak" />
            <div className="card-top">
              <div className="card-icon-wrap pump-icon-bg">
                <svg viewBox="0 0 64 64" className="card-icon" fill="none">
                  <rect x="8"  y="22" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="3"/>
                  <rect x="36" y="18" width="20" height="28" rx="4" stroke="currentColor" strokeWidth="3"/>
                  <line x1="28" y1="32" x2="36" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M18 22 C18 14 26 10 32 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <path d="M46 18 C46 10 54 10 56 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <circle cx="18" cy="32" r="3" fill="currentColor" opacity="0.4"/>
                  <circle cx="46" cy="32" r="4" fill="currentColor" opacity="0.3"/>
                </svg>
              </div>
              <div className="card-label pump-label">PUMP</div>
            </div>
            <div className="card-content">
              <h2 className="card-title">Pump Analysis</h2>
              <p className="card-desc">
                52-sensor time-series analysis. Classify Normal, Broken, and
                Recovering pump states using SMOTE-balanced ML models.
              </p>
              <div className="card-features">
                <span className="feature-tag pump-tag">52 Sensors</span>
                <span className="feature-tag pump-tag">SMOTE Balanced</span>
                <span className="feature-tag pump-tag">3-Class State</span>
              </div>
            </div>
            <div className="card-footer pump-footer">
              <span>Run Diagnostics</span>
              <span className="arrow">→</span>
            </div>
          </button>
        </div>

        <p className="selector-footer">
          Models trained on real industrial sensor datasets &nbsp;·&nbsp; Binary &amp; multi-class classification
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --iocl-orange: #F47920;
          --iocl-blue:   #003087;
          --iocl-orange-light: rgba(244,121,32,0.12);
          --iocl-orange-mid:   rgba(244,121,32,0.25);
          --iocl-blue-light:   rgba(0,48,135,0.12);
          --iocl-blue-mid:     rgba(0,48,135,0.25);
        }

        .selector-root {
          min-height: 100vh;
          background: #04091a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .selector-bg {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 70% 55% at 15% 25%, rgba(244,121,32,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 85% 75%, rgba(0,48,135,0.1) 0%, transparent 60%),
            repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.015) 80px),
            repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.015) 80px);
        }

        .noise {
          position: absolute; inset: 0; pointer-events: none; opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        .selector-container {
          position: relative;
          max-width: 980px;
          width: 100%;
          padding: 56px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 52px;
        }

        /* ── Header ── */
        .selector-header { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 24px; }

        .iocl-logo-row {
          display: flex; align-items: center; gap: 16px;
        }

        .iocl-emblem {
          position: relative; width: 52px; height: 52px;
          display: flex; align-items: center; justify-content: center;
        }
        .emblem-ring {
          position: absolute; border-radius: 50%;
          border: 3px solid transparent;
        }
        .outer-ring {
          inset: 0;
          border-color: var(--iocl-orange);
          box-shadow: 0 0 12px rgba(244,121,32,0.4);
        }
        .inner-ring {
          inset: 8px;
          border-color: var(--iocl-blue);
          box-shadow: 0 0 8px rgba(0,48,135,0.5);
        }
        .emblem-core {
          width: 12px; height: 12px; border-radius: 50%;
          background: var(--iocl-orange);
          box-shadow: 0 0 8px var(--iocl-orange);
        }

        .iocl-wordmark { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
        .iocl-name {
          font-family: 'Rajdhani', sans-serif;
          font-size: 1.6rem; font-weight: 700;
          color: #f0f4ff;
          letter-spacing: -0.5px;
        }
        .iocl-tagline {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.62rem; font-weight: 600;
          letter-spacing: 3px;
          color: var(--iocl-orange);
        }

        .header-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(2.2rem, 5vw, 3.4rem);
          font-weight: 700;
          color: #eef2ff;
          letter-spacing: -1px;
          line-height: 1.05;
        }

        .header-sub {
          font-size: 0.95rem;
          color: #5a6a88;
          max-width: 420px;
          line-height: 1.65;
        }

        /* ── Cards ── */
        .cards-row {
          display: flex; align-items: stretch; gap: 0; width: 100%;
        }

        .machine-card {
          position: relative; flex: 1;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 0;
          cursor: pointer; text-align: left;
          display: flex; flex-direction: column;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .card-streak {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          border-radius: 20px 20px 0 0;
        }
        .motor-streak { background: linear-gradient(90deg, var(--iocl-orange), rgba(244,121,32,0.2)); }
        .pump-streak  { background: linear-gradient(90deg, var(--iocl-blue), rgba(0,48,135,0.2)); }

        .motor-card:hover {
          transform: translateY(-5px);
          border-color: rgba(244,121,32,0.35);
          background: rgba(244,121,32,0.04);
          box-shadow: 0 20px 60px rgba(244,121,32,0.1);
        }
        .pump-card:hover {
          transform: translateY(-5px);
          border-color: rgba(0,48,135,0.5);
          background: rgba(0,48,135,0.05);
          box-shadow: 0 20px 60px rgba(0,48,135,0.15);
        }

        .card-top {
          padding: 28px 28px 0;
          display: flex; align-items: center; gap: 14px;
        }

        .card-icon-wrap {
          width: 58px; height: 58px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .motor-icon-bg { background: rgba(244,121,32,0.12); color: var(--iocl-orange); }
        .pump-icon-bg  { background: rgba(0,48,135,0.15);   color: #5b8af0; }

        .card-icon { width: 36px; height: 36px; }

        .card-label {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.65rem; font-weight: 700; letter-spacing: 3px;
          padding: 4px 10px; border-radius: 6px;
        }
        .motor-label { background: rgba(244,121,32,0.12); color: var(--iocl-orange); border: 1px solid rgba(244,121,32,0.2); }
        .pump-label  { background: rgba(0,48,135,0.15);   color: #5b8af0;            border: 1px solid rgba(0,48,135,0.25); }

        .card-content { flex: 1; padding: 20px 28px; }

        .card-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 1.55rem; font-weight: 700;
          color: #e8eeff; margin-bottom: 10px; letter-spacing: -0.3px;
        }

        .card-desc {
          font-size: 0.875rem; color: #5a6a88;
          line-height: 1.65; margin-bottom: 18px;
        }

        .card-features { display: flex; flex-wrap: wrap; gap: 7px; }

        .feature-tag {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.7rem; font-weight: 600; letter-spacing: 0.8px;
          padding: 4px 10px; border-radius: 6px;
        }
        .motor-tag { background: rgba(244,121,32,0.08); border: 1px solid rgba(244,121,32,0.15); color: rgba(244,121,32,0.7); }
        .pump-tag  { background: rgba(0,48,135,0.1);    border: 1px solid rgba(0,48,135,0.2);    color: #5b8af0; }

        .motor-card:hover .motor-tag { border-color: rgba(244,121,32,0.35); color: var(--iocl-orange); }
        .pump-card:hover  .pump-tag  { border-color: rgba(0,48,135,0.45);   color: #7aa3f7; }

        .card-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 28px;
          border-top: 1px solid rgba(255,255,255,0.05);
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.85rem; font-weight: 600; letter-spacing: 0.5px;
          transition: all 0.3s ease;
        }
        .motor-footer { color: rgba(244,121,32,0.6); }
        .pump-footer  { color: rgba(91,138,240,0.6); }

        .motor-card:hover .motor-footer { color: var(--iocl-orange); }
        .pump-card:hover  .pump-footer  { color: #7aa3f7; }

        .arrow { transition: transform 0.3s ease; font-size: 1.1rem; }
        .machine-card:hover .arrow { transform: translateX(5px); }

        /* ── Divider ── */
        .cards-divider {
          display: flex; align-items: center; justify-content: center;
          padding: 0 20px; flex-shrink: 0;
        }
        .cards-divider span {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.65rem; font-weight: 700; letter-spacing: 2.5px;
          color: #2a3450;
          background: #04091a;
          padding: 8px 10px;
          border: 1px solid #141e35;
          border-radius: 8px;
        }

        /* ── Footer ── */
        .selector-footer {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.7rem; font-weight: 500;
          color: #2a3450; letter-spacing: 1px;
        }

        @media (max-width: 640px) {
          .cards-row { flex-direction: column; }
          .cards-divider { padding: 12px 0; }
        }
      `}</style>
    </main>
  )
}
