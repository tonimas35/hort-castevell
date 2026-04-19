import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface LogEntry {
  id: number
  level: string
  source: string | null
  message: string
  created_at: string
}

type IconKind = 'irrigation' | 'battery' | 'success' | 'warning'

function pickIcon(entry: LogEntry): IconKind {
  const msg = entry.message.toLowerCase()
  if (entry.level === 'error' || entry.level === 'err') return 'warning'
  if (msg.includes('reg') || msg.includes('vàlvula') || msg.includes('valve')) return 'irrigation'
  if (msg.includes('bateria') || msg.includes('battery')) return 'battery'
  return 'success'
}

function IconFor({ kind }: { kind: IconKind }) {
  if (kind === 'irrigation')
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2 C 8 2 4 6.5 4 9.5 C 4 12 5.8 14 8 14 C 10.2 14 12 12 12 9.5 C 12 6.5 8 2 8 2 Z" />
      </svg>
    )
  if (kind === 'battery')
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="11" height="7" rx="1" />
        <path d="M13 7v3" />
      </svg>
    )
  if (kind === 'warning')
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2l6.5 11h-13z" />
        <path d="M8 7v3" />
        <circle cx="8" cy="12" r="0.6" fill="currentColor" />
      </svg>
    )
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l3.5 3.5L13 5" />
    </svg>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'ara'
  const m = Math.floor(s / 60)
  if (m < 60) return `fa ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `fa ${h}h`
  const d = Math.floor(h / 24)
  return `fa ${d}d`
}

export default function IrrigationLog() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('device_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8)
        if (data) setEntries(data as LogEntry[])
      } catch {
        /* empty */
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <section className="kv-activity" aria-label="Activitat recent">
      <div className="kv-activity-head">
        <h2 className="kv-activity-title">Activitat recent</h2>
        <span className="kv-activity-count">24h</span>
      </div>

      {loading ? (
        <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
          Carregant…
        </div>
      ) : entries.length === 0 ? (
        <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
          Encara sense events
        </div>
      ) : (
        <div className="kv-timeline">
          {entries.map(e => {
            const kind = pickIcon(e)
            return (
              <div key={e.id} className="kv-tl-item">
                <div className={`kv-tl-icon ${kind}`}>
                  <IconFor kind={kind} />
                </div>
                <div className="kv-tl-body">
                  <div className="kv-tl-text">{e.message}</div>
                  <div className="kv-tl-meta">
                    {timeAgo(e.created_at)}
                    {e.source ? ` · ${e.source}` : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
