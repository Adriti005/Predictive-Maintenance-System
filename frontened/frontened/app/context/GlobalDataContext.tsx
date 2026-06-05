'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

type GraphPoint = { time: string; value: number; prediction: string }

interface GlobalData {
  motorGraph: GraphPoint[]
  pumpGraph: GraphPoint[]
  compressorGraph: GraphPoint[]
  turbineGraph: GraphPoint[]
  healthBars: { hour: string; health: number }[]
  feedRows: any[]
  lastUpdated: string
  lastSync: string
  criticalRealCount: number
}

const GlobalDataContext = createContext<GlobalData>({
  motorGraph: [], pumpGraph: [], compressorGraph: [], turbineGraph: [],
  healthBars: [], feedRows: [], lastUpdated: '', lastSync: '', criticalRealCount: 0,
})

export function useGlobalData() { return useContext(GlobalDataContext) }

const FAULT_STATUSES = ['FAULT','FAULTY','BROKEN','DEGRADED']

function beepSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.type = 'square'; osc.frequency.value = 780
    g.gain.setValueAtTime(0.15, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(); osc.stop(ctx.currentTime + 0.5)
  } catch {}
}

export function GlobalDataProvider({ children }: { children: React.ReactNode }) {
  const [motorGraph,        setMotorGraph]        = useState<GraphPoint[]>([])
  const [pumpGraph,         setPumpGraph]         = useState<GraphPoint[]>([])
  const [compressorGraph,   setCompressorGraph]   = useState<GraphPoint[]>([])
  const [turbineGraph,      setTurbineGraph]      = useState<GraphPoint[]>([])
  const [healthBars,        setHealthBars]        = useState<any[]>([])
  const [feedRows,          setFeedRows]          = useState<any[]>([])
  const [lastUpdated,       setLastUpdated]       = useState('')
  const [lastSync,          setLastSync]          = useState('')
  const [criticalRealCount, setCriticalRealCount] = useState(0)

  const seenFaultIds = useRef<Set<string>>(new Set())
  const isFirstLoad  = useRef(true)

  useEffect(() => {
    (window as any).__iocl_beep = beepSound
  }, [])

  const fetchGraphs = useCallback(async () => {
    try {
      const safe = async (url: string) => { try { return await fetch(url).then(r => r.json()) } catch { return [] } }
      const [motor, pump, comp, turb, health] = await Promise.all([
        safe('http://127.0.0.1:5050/graph/motor'),
        safe('http://127.0.0.1:5050/graph/pump'),
        safe('http://127.0.0.1:5050/graph/compressor'),
        safe('http://127.0.0.1:5050/graph/turbine'),
        safe('http://127.0.0.1:5050/graph/health-bar'),
      ])
      setMotorGraph(motor.map((d: any) => ({ time: d.time, value: d.rpm,         prediction: d.prediction })))
      setPumpGraph(pump.map((d: any)   => ({ time: d.time, value: d.pressure,    prediction: d.prediction })))
      setCompressorGraph(comp.map((d: any) => ({ time: d.time, value: d.pressure,    prediction: d.prediction })))
      setTurbineGraph(turb.map((d: any)    => ({ time: d.time, value: d.temperature, prediction: d.prediction })))
      setHealthBars(health)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {}
  }, [])

  const fetchLiveFeedAndBeep = useCallback(async () => {
    try {
      const safe = async (url: string) => { try { return await fetch(url).then(r => r.json()) } catch { return [] } }
      const [motor, pump, compressor, turbine] = await Promise.all([
        safe('http://127.0.0.1:5050/motor-history'),
        safe('http://127.0.0.1:5050/pump-history'),
        safe('http://127.0.0.1:5050/compressor-history'),
        safe('http://127.0.0.1:5050/turbine-history'),
      ])

      const all = [
        ...motor.map((r: any) => ({ ...r, machine: 'MOTOR',
          params: {
            'Product Type':    r.product_type,
            'RPM':             r.rpm,
            'Torque (Nm)':     r.torque,
            'Tool Wear (min)': r.tool_wear,
            'Air Temp (K)':    r.air_temp,
            'Process Temp (K)':r.proc_temp,
          }})),
        ...pump.map((r: any) => ({ ...r, machine: 'PUMP',
          params: {
            'Sensor 00': r.sensor00,
            'Sensor 02': r.sensor02,
            'Sensor 03': r.sensor03,
            'Sensor 04': r.sensor04,
            'Sensor 05': r.sensor05,
            'Sensor 06': r.sensor06,
            'Sensor 07': r.sensor07,
            'Sensor 08': r.sensor08,
            'Sensor 09': r.sensor09,
            'Sensor 10': r.sensor10,
            'Sensor 11': r.sensor11,
            'Sensor 12': r.sensor12,
          }})),
        ...compressor.map((r: any) => ({ ...r, machine: 'COMPRESSOR',
          params: {
            'RPM':                   r.rpm,
            'Motor Power (kW)':      r.power,
            'Torque (Nm)':           r.torque,
            'Outlet Pressure (bar)': r.pressure,
            'Air Flow (CFM)':        r.airflow,
            'Noise (dB)':            r.noise,
            'Outlet Temp (°C)':      r.temp,
            'Accel X (G)':           r.gaccx,
            'Accel Y (G)':           r.gaccy,
            'Accel Z (G)':           r.gaccz,
            'H-Accel X':             r.haccx,
            'H-Accel Y':             r.haccy,
            'H-Accel Z':             r.haccz,
            'Bearings':              r.bearings,
          }})),
        ...turbine.map((r: any) => ({ ...r, machine: 'TURBINE',
          params: {
            'RPM':          r.rpm,
            'Temperature':  r.temp,
            'Pressure':     r.pressure,
            'Vibration':    r.vibration,
            'Power Output': r.power,
          }})),
      ]

      const rows = all
        .map(r => ({
          id:         `auto-${r.machine}-${r.id}`,
          machine:    r.machine,
          event:      `${r.machine} prediction: ${r.prediction}`,
          level:      FAULT_STATUSES.includes(r.prediction) ? 'Critical'
                    : ['DEGRADED','RECOVERING'].includes(r.prediction) ? 'Warning' : 'Normal',
          time:       new Date(r.created_at).toLocaleString(),
          value:      `${r.confidence}%`,
          isReal:     true,
          isAuto:     true,
          rawTime:    r.created_at,
          prediction: r.prediction,
          params:     r.params,
        }))
        .sort((a, b) => new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime())

      setFeedRows(rows)
      setLastSync(new Date().toLocaleTimeString())

      const realFaultRows = all.filter(r => FAULT_STATUSES.includes(r.prediction))
      setCriticalRealCount(realFaultRows.length)

      if (isFirstLoad.current) {
        realFaultRows.forEach(r => seenFaultIds.current.add(`auto-${r.machine}-${r.id}`))
        isFirstLoad.current = false
        return
      }

      const newFaults = realFaultRows.filter(r => !seenFaultIds.current.has(`auto-${r.machine}-${r.id}`))
      if (newFaults.length > 0) {
        beepSound()
        newFaults.forEach(r => seenFaultIds.current.add(`auto-${r.machine}-${r.id}`))
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchGraphs()
    fetchLiveFeedAndBeep()
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      fetchGraphs()
      fetchLiveFeedAndBeep()
    }, 120000)
    return () => clearInterval(t)
  }, [fetchGraphs, fetchLiveFeedAndBeep])

  return (
    <GlobalDataContext.Provider value={{
      motorGraph, pumpGraph, compressorGraph, turbineGraph,
      healthBars, feedRows, lastUpdated, lastSync, criticalRealCount,
    }}>
      {children}
    </GlobalDataContext.Provider>
  )
}