'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '../page'
import Dashboard from '@/components/Dashboard'
import AlertsPage from '@/components/AlertsPage'
import HistoryPage from '@/components/HistoryPage'
import ReportPage from '@/components/ReportPage'
import ProfilePage from '@/components/ProfilePage'
import RefineryPulsePage from '@/components/RefineryPulsePage'

type Page = 'dashboard' | 'alerts' | 'history' | 'report' | 'profile' | 'refinery'

const NAV: { id: Page; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard'      },
  { id: 'alerts',    icon: '🔔', label: 'Alerts'         },
  { id: 'history',   icon: '📋', label: 'History'        },
  { id: 'report',    icon: '📄', label: 'Reports'        },
  { id: 'profile',   icon: '👤', label: 'Profile'        },
  { id: 'refinery',  icon: '🛢️', label: 'Refinery Pulse' },
]

export default function DashboardLayout() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const criticalCount = 5

  useEffect(() => {
    try {
      const s = sessionStorage.getItem('iocl_session')
      if (!s) { router.push('/'); return }
      setUser(JSON.parse(s))
    } catch { router.push('/') }
  }, [])

  function handleLogout() {
    sessionStorage.removeItem('iocl_session')
    router.push('/')
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#6b7a99', fontSize: 13, letterSpacing: 3, fontWeight: 700 }}>LOADING...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F4F8', fontFamily: "'DM Sans', sans-serif", color: '#1a2744', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #e2e8f0; }
        ::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 3px; }

        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 16px; cursor: pointer;
          font-size: 13px; font-family: 'Rajdhani', sans-serif;
          font-weight: 700; letter-spacing: 0.4px;
          color: #1e293b;
          border-radius: 0; margin: 0;
          border-left: 3px solid transparent;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          transition: all 0.15s;
          background: transparent;
        }
        .nav-item:hover {
          color: #0d1b2e;
          background: rgba(0,48,135,0.06);
          border-left-color: rgba(0,48,135,0.30);
        }
        .nav-item.active {
          background: rgba(244,121,32,0.11);
          color: #c45e0a;
          border-left: 3px solid #F47920;
          font-weight: 700;
        }
        .nav-item.active-refinery {
          background: rgba(14,165,160,0.10);
          color: #0a7a76;
          border-left: 3px solid #0ea5a0;
          font-weight: 700;
        }
        .logout-btn { width: 100%; padding: 7px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.13); background: transparent; color: #334155; cursor: pointer; font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 1px; transition: all 0.2s; }
        .logout-btn:hover { border-color: rgba(244,121,32,0.35); color: #c45e0a; background: rgba(244,121,32,0.05); }
        .machine-suite-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 16px; cursor: pointer;
          font-size: 13px; font-family: 'Rajdhani', sans-serif;
          font-weight: 700; letter-spacing: 0.4px;
          background: rgba(14,165,160,0.09);
          color: #0a7a76;
          border-left: 3px solid #0ea5a0;
          border-top: 1px solid rgba(14,165,160,0.18);
          border-right: none; border-bottom: 1px solid rgba(0,0,0,0.06);
          transition: all 0.15s; width: 100%;
        }
        .machine-suite-btn:hover { background: rgba(14,165,160,0.16); color: #0ea5a0; }
        .section-label {
          padding: 7px 16px 4px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 9px; font-weight: 700;
          color: #94a3b8; letter-spacing: 2.5px;
        }
      `}</style>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 70% 55% at 15% 25%, rgba(244,121,32,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 75%, rgba(0,48,135,0.10) 0%, transparent 60%), repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(0,0,0,0.03) 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(0,0,0,0.03) 80px)' }} />

      {/* Sidebar */}
      <div style={{ width: 220, background: '#f1f5f9', borderRight: '1px solid rgba(0,0,0,0.11)', minHeight: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative', zIndex: 2, boxShadow: '2px 0 16px rgba(0,0,0,0.08)' }}>

        {/* Logo */}
        <div style={{ padding: '14px 16px 12px', borderBottom: '2px solid rgba(0,0,0,0.09)', background: '#e8edf5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <img
             src="/iocl-logo.png"
             alt="IOCL"
             style={{ width: 50, height: 50, objectFit: 'contain', flexShrink: 0 }}
              />
            <div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 17, fontWeight: 700, color: '#F47920', letterSpacing: 2 }}>IndianOil</div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 7, color: '#64748b', letterSpacing: 2, fontWeight: 600 }}>PREDICTIVE MAINTENANCE</div>
            </div>
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 9, color: '#94a3b8', marginTop: 5, letterSpacing: 1.5, fontWeight: 600 }}>Guwahati Refinery</div>
        </div>

        {/* Nav */}
        <div className="section-label">NAVIGATION</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {NAV.map(n => (
            <div key={n.id}
              className={`nav-item${page === n.id ? (n.id === 'refinery' ? ' active-refinery' : ' active') : ''}`}
              onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.id === 'alerts' && criticalCount > 0 && (
                <span style={{ background: '#F47920', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>{criticalCount}</span>
              )}
              {n.id === 'refinery' && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0ea5a0', display: 'inline-block', flexShrink: 0 }} />
              )}
            </div>
          ))}

          {/* Tools — directly below nav */}
          <div style={{ borderTop: '2px solid rgba(0,0,0,0.09)', marginTop: 2 }}>
            <div className="section-label" style={{ paddingTop: 8 }}>TOOLS</div>
            <button className="machine-suite-btn" onClick={() => router.push('/')}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>⚙️</span>
              <span style={{ flex: 1 }}>Machine Suite</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>↗</span>
            </button>
          </div>

          {/* User footer — directly below Machine Suite */}
          <div style={{ padding: '12px 14px', borderTop: '2px solid rgba(0,0,0,0.09)', background: '#e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #F47920, #c47a10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 14, fontFamily: "'Rajdhani', sans-serif", flexShrink: 0 }}>
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0d1b2e', fontFamily: "'Rajdhani', sans-serif", letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 9, color: '#64748b', letterSpacing: 1.5, fontWeight: 600 }}>FIELD ENGINEER</div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>🚪 LOGOUT</button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>

        {/* Top bar */}
        <div style={{ background: 'rgba(240,244,248,0.95)', borderBottom: '1px solid rgba(0,0,0,0.09)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)' }}>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: page === 'refinery' ? '#0a7a76' : '#1a3f8f', fontWeight: 700, letterSpacing: 3 }}>
            {NAV.find(n => n.id === page)?.icon} {NAV.find(n => n.id === page)?.label?.toUpperCase()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {criticalCount > 0 && (
              <div onClick={() => setPage('alerts')} style={{ background: 'rgba(244,121,32,0.08)', border: '1px solid rgba(244,121,32,0.25)', borderRadius: 8, padding: '4px 12px', fontSize: 12, color: '#c45e0a', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: 1 }}>
                🚨 {criticalCount} Critical
              </div>
            )}
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: '#334155', fontWeight: 700, letterSpacing: 1 }}>{user.name.toUpperCase()}</div>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #F47920, #c47a10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 12, fontFamily: "'Rajdhani', sans-serif" }}>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        {page === 'dashboard' && <Dashboard setPage={setPage} user={user} />}
        {page === 'alerts'    && <AlertsPage />}
        {page === 'history'   && <HistoryPage />}
        {page === 'report'    && <ReportPage />}
        {page === 'profile'   && <ProfilePage user={user} onLogout={handleLogout} />}
        {page === 'refinery'  && <RefineryPulsePage />}
      </div>
    </div>
  )
}