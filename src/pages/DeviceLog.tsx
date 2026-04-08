import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useLatestReading } from '../hooks/useLatestReading'
import '../styles/dashboard.css'

interface LogEntry {
  id: number
  level: string
  source: string
  message: string
  created_at: string
}

const LEVEL_COLORS: Record<string, string> = {
  info: '#4E7A48',
  warn: '#C4873D',
  error: '#B33A3A',
}

const LEVEL_ICONS: Record<string, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
}

export default function DeviceLog() {
  useLatestReading()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  async function fetchLogs() {
    const { data } = await supabase
      .from('device_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (data) setLogs(data as LogEntry[])
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
    if (!autoRefresh) return
    const interval = setInterval(fetchLogs, 10000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  function fmtTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  function fmtDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit' })
  }

  return (
    <>
      <Header />
      <main style={{
        maxWidth: 960, margin: '0 auto',
        padding: '1.25rem 1rem 4rem',
        fontFamily: "'Outfit', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>
              Device Log
            </h2>
            <span style={{ fontSize: '0.7rem', color: '#8a7e6b' }}>
              Últimes 100 entrades · Auto-eliminació 24h
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', color: '#7A6F5E', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh 10s
            </label>
            <button
              onClick={fetchLogs}
              style={{
                fontFamily: "'Outfit', sans-serif", fontSize: '0.75rem', fontWeight: 500,
                padding: '0.35rem 0.75rem', border: '1px solid #DDD4C0',
                borderRadius: '6px', background: '#FDFAF3', cursor: 'pointer',
                color: '#3A3225',
              }}
            >
              ↻ Refrescar
            </button>
          </div>
        </div>

        {/* Log entries */}
        <div style={{
          background: '#1a1a14', borderRadius: '12px',
          padding: '0.5rem', fontFamily: "'Courier New', monospace",
          fontSize: '0.72rem', lineHeight: 1.6,
          maxHeight: '70vh', overflowY: 'auto',
          border: '1px solid #333',
        }}>
          {loading && (
            <div style={{ color: '#8a7e6b', padding: '1rem', textAlign: 'center' }}>
              Carregant logs...
            </div>
          )}

          {!loading && logs.length === 0 && (
            <div style={{ color: '#8a7e6b', padding: '1rem', textAlign: 'center' }}>
              Cap log disponible
            </div>
          )}

          {logs.map(log => (
            <div key={log.id} style={{
              display: 'flex', gap: '0.5rem',
              padding: '0.25rem 0.5rem',
              borderBottom: '1px solid #222',
              color: LEVEL_COLORS[log.level] || '#8a7e6b',
            }}>
              <span style={{ color: '#555', whiteSpace: 'nowrap', minWidth: '7rem' }}>
                {fmtDate(log.created_at)} {fmtTime(log.created_at)}
              </span>
              <span style={{ minWidth: '1.2rem' }}>
                {LEVEL_ICONS[log.level] || '·'}
              </span>
              <span style={{ color: log.level === 'info' ? '#B0C8A0' : LEVEL_COLORS[log.level] }}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
