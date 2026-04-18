import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useLatestReading } from '../hooks/useLatestReading'
import '../styles/log.css'

interface DbLogEntry {
  id: number
  level: string
  source: string | null
  message: string
  created_at: string
}

interface LogEntry {
  id: string
  ts: Date
  tsStr: string
  level: 'info' | 'warn' | 'err'
  source: string
  message: string
  payload: Record<string, unknown> | null
}

/* ==================== HELPERS ==================== */

function pad(n: number, l = 2): string {
  return String(n).padStart(l, '0')
}

function formatTs(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

function normalizeLevel(raw: string): 'info' | 'warn' | 'err' {
  const l = raw.toLowerCase()
  if (l.startsWith('err') || l === 'critical' || l === 'error') return 'err'
  if (l.startsWith('warn')) return 'warn'
  return 'info'
}

function adaptEntry(row: DbLogEntry): LogEntry {
  const d = new Date(row.created_at)
  return {
    id: String(row.id),
    ts: d,
    tsStr: formatTs(d),
    level: normalizeLevel(row.level),
    source: (row.source || 'UNKNOWN').toUpperCase(),
    message: row.message,
    payload: null,
  }
}

function srcClass(s: string): string {
  return s.toLowerCase().replace(/_/g, '-')
}

function highlightMatches(text: string, q: string) {
  if (!q) return text
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'))
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase() ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>
  )
}

/* ==================== SUBCOMPONENTS ==================== */

function LgFilters({
  filter, setFilter, counts, query, setQuery, auto, setAuto, searchRef,
}: {
  filter: string
  setFilter: (f: string) => void
  counts: { all: number; info: number; warn: number; err: number }
  query: string
  setQuery: (q: string) => void
  auto: boolean
  setAuto: (a: boolean) => void
  searchRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="lg-filters">
      <div className="lg-filter-pills">
        <button className={`lg-pill all ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          <span>Tots</span>
          <span className="lg-pill-count">{counts.all}</span>
        </button>
        <button className={`lg-pill info ${filter === 'info' ? 'active' : ''}`} onClick={() => setFilter('info')}>
          <span className="lg-pill-ic">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="6" cy="3.5" r=".9" fill="currentColor" />
              <path d="M6 5.5v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <span>Info</span>
          <span className="lg-pill-count">{counts.info}</span>
        </button>
        <button className={`lg-pill warn ${filter === 'warn' ? 'active' : ''}`} onClick={() => setFilter('warn')}>
          <span className="lg-pill-ic">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1l5.2 9H.8L6 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M6 4.5v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="6" cy="8.4" r=".7" fill="currentColor" />
            </svg>
          </span>
          <span>Warning</span>
          <span className="lg-pill-count">{counts.warn}</span>
        </button>
        <button className={`lg-pill err ${filter === 'err' ? 'active' : ''}`} onClick={() => setFilter('err')}>
          <span className="lg-pill-ic">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M4 4l4 4M8 4l-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </span>
          <span>Error</span>
          <span className="lg-pill-count">{counts.err}</span>
        </button>
      </div>

      <div className="lg-search">
        <svg className="lg-search-ic" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M9.2 9.2l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          ref={searchRef}
          placeholder="Filtrar per missatge, node o source…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <span className="lg-search-kbd">/</span>
      </div>

      <div className="lg-auto-refresh">
        <div className={`lg-ar-spinner ${auto ? '' : 'off'}`} />
        <span className="lg-ar-label">Actualitza cada 10s</span>
        <button
          type="button"
          className={`lg-switch ${auto ? 'on' : ''}`}
          onClick={() => setAuto(!auto)}
          aria-label="Auto-refresh"
        />
      </div>
    </div>
  )
}

function LgRow({ log, expanded, onToggle, query }: {
  log: LogEntry
  expanded: boolean
  onToggle: () => void
  query: string
}) {
  return (
    <div
      className={`lg-row ${log.level} ${expanded ? 'expanded' : ''}`}
      onClick={onToggle}
      data-log-id={log.id}
      tabIndex={0}
    >
      <div className="lg-row-severity" />
      <span className="lg-row-ts">{log.tsStr}</span>
      <span className={`lg-src ${srcClass(log.source)}`}>{log.source}</span>
      <span className={`lg-lvl ${log.level}`}>
        {log.level === 'info' ? 'INF' : log.level === 'warn' ? 'WRN' : 'ERR'}
      </span>
      <span className="lg-msg">{highlightMatches(log.message, query)}</span>
      <div className="lg-row-actions">
        <span className="lg-row-anchor">#{log.id}</span>
        <span className="lg-row-expand">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      {expanded && (
        <div className="lg-payload">
          <div className="lg-payload-head">
            <span>Payload</span>
          </div>
          <pre className="lg-json">{JSON.stringify({
            id: log.id,
            level: log.level,
            source: log.source,
            timestamp: log.ts.toISOString(),
            message: log.message,
          }, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

function LgChart24({ logs }: { logs: LogEntry[] }) {
  const { buckets, max } = useMemo(() => {
    const end = new Date()
    const arr = Array.from({ length: 24 }, () => ({ info: 0, warn: 0, err: 0 }))
    logs.forEach(l => {
      const diffH = Math.floor((end.getTime() - l.ts.getTime()) / (60 * 60 * 1000))
      const idx = 23 - diffH
      if (idx >= 0 && idx < 24) arr[idx][l.level]++
    })
    const m = Math.max(1, ...arr.map(b => b.info + b.warn + b.err))
    return { buckets: arr, max: m }
  }, [logs])

  return (
    <div className="lg-card">
      <div className="lg-card-title">
        Últimes 24h<span className="lg-card-title-sub">{logs.length} esdeveniments</span>
      </div>
      <div className="lg-chart24">
        {buckets.map((b, i) => {
          const total = b.info + b.warn + b.err
          return (
            <div key={i} className="lg-chart24-col" title={`${i}:00 — ${total}`}>
              {b.err > 0 && <div className="lg-chart24-seg err" style={{ height: `${(b.err / max) * 100}%` }} />}
              {b.warn > 0 && <div className="lg-chart24-seg warn" style={{ height: `${(b.warn / max) * 100}%` }} />}
              {b.info > 0 && <div className="lg-chart24-seg info" style={{ height: `${(b.info / max) * 100}%` }} />}
            </div>
          )
        })}
      </div>
      <div className="lg-chart24-labels">
        <span>−24h</span>
        <span>−18h</span>
        <span>−12h</span>
        <span>ara</span>
      </div>
      <div className="lg-chart24-total">
        <span className="lg-chart24-total-num">{logs.length}</span>
        <span className="lg-chart24-total-lbl">esdeveniments · 24h</span>
      </div>
    </div>
  )
}

function LgSevBars({ logs }: { logs: LogEntry[] }) {
  const counts = {
    info: logs.filter(l => l.level === 'info').length,
    warn: logs.filter(l => l.level === 'warn').length,
    err:  logs.filter(l => l.level === 'err').length,
  }
  const total = counts.info + counts.warn + counts.err || 1
  const rows = [
    { k: 'info', label: 'Info',    count: counts.info, pct: counts.info / total * 100 },
    { k: 'warn', label: 'Warning', count: counts.warn, pct: counts.warn / total * 100 },
    { k: 'err',  label: 'Error',   count: counts.err,  pct: counts.err  / total * 100 },
  ]

  return (
    <div className="lg-card">
      <div className="lg-card-title">
        Per severity<span className="lg-card-title-sub">total</span>
      </div>
      <div className="lg-sev-list">
        {rows.map(r => (
          <div key={r.k} className="lg-sev-row">
            <div className="lg-sev-head">
              <span className="lg-sev-head-left">
                <span className={`lg-sev-head-dot ${r.k}`} />
                {r.label}
              </span>
              <span className="lg-sev-head-num">
                {r.count} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>· {r.pct.toFixed(0)}%</span>
              </span>
            </div>
            <div className="lg-sev-bar-wrap">
              <div className={`lg-sev-bar ${r.k}`} style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LgSparkline({ values, color }: { values: number[]; color: string }) {
  const w = 80, h = 18
  const max = Math.max(1, ...values)
  if (values.length < 2) return null
  const pts = values.map((v, i) => [i * (w / (values.length - 1)), h - (v / max) * h * 0.9 - 1])
  const d = 'M' + pts.map(p => p.map(x => x.toFixed(1)).join(',')).join(' L')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LgSources({ logs }: { logs: LogEntry[] }) {
  const srcs = useMemo(() => {
    const map = new Map<string, LogEntry[]>()
    logs.forEach(l => {
      if (!map.has(l.source)) map.set(l.source, [])
      map.get(l.source)!.push(l)
    })
    const end = new Date()
    const arr = [...map.entries()].map(([src, ls]) => {
      const buckets = Array(8).fill(0) as number[]
      ls.forEach(l => {
        const diffH = (end.getTime() - l.ts.getTime()) / (60 * 60 * 1000)
        const idx = 7 - Math.floor(diffH / 3)
        if (idx >= 0 && idx < 8) buckets[idx]++
      })
      return { src, count: ls.length, spark: buckets }
    })
    arr.sort((a, b) => b.count - a.count)
    return arr.slice(0, 5)
  }, [logs])

  return (
    <div className="lg-card">
      <div className="lg-card-title">
        Per source<span className="lg-card-title-sub">top 5</span>
      </div>
      <div className="lg-src-list">
        {srcs.map(s => (
          <div key={s.src} className="lg-src-row">
            <span className={`lg-src ${srcClass(s.src)}`}>{s.src}</span>
            <div className="lg-src-row-spark">
              <LgSparkline values={s.spark} color="#5D7A3B" />
            </div>
            <span className="lg-src-row-num">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LgEmpty({ onReset }: { onReset: () => void }) {
  return (
    <div className="lg-empty">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="34" cy="34" r="22" stroke="#B8B19C" strokeWidth="2" />
        <path d="M50 50 L64 64" stroke="#B8B19C" strokeWidth="2" strokeLinecap="round" />
        <path d="M34 28 C34 28 28 34 28 40 C28 43 30.5 45 34 45 C37.5 45 40 43 40 40 C40 34 34 28 34 28Z" fill="#A8BE6C" opacity=".55" />
      </svg>
      <div className="lg-empty-text">Cap log coincideix amb els filtres</div>
      <div className="lg-empty-sub">Prova a netejar els filtres o ampliar la cerca.</div>
      <button className="lg-empty-btn" onClick={onReset}>Netejar filtres</button>
    </div>
  )
}

/* ==================== PAGE ==================== */

export default function DeviceLog() {
  useLatestReading()

  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [auto, setAuto] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  async function fetchLogs() {
    const { data } = await supabase
      .from('device_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (data) {
      setLogs((data as DbLogEntry[]).map(adaptEntry))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
    if (!auto) return
    const iv = setInterval(fetchLogs, 10000)
    return () => clearInterval(iv)
  }, [auto])

  // Keyboard shortcuts: / focus search, Esc clear
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === 'Escape') {
        if ((document.activeElement as HTMLElement | null)?.tagName === 'INPUT') {
          (document.activeElement as HTMLElement).blur()
        }
        setQuery('')
        setFilter('all')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const counts = useMemo(() => ({
    all: logs.length,
    info: logs.filter(l => l.level === 'info').length,
    warn: logs.filter(l => l.level === 'warn').length,
    err:  logs.filter(l => l.level === 'err').length,
  }), [logs])

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (filter !== 'all' && l.level !== filter) return false
      if (query) {
        const q = query.toLowerCase()
        if (
          !l.message.toLowerCase().includes(q) &&
          !l.source.toLowerCase().includes(q) &&
          !l.id.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [logs, filter, query])

  function toggle(id: string) {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  return (
    <>
      <Header />
      <main className="lg-main">
        <div className="lg-page-head">
          <h1 className="lg-page-title">Device Log</h1>
          <span className="lg-page-sub">
            {loading ? 'Carregant…' : `Mostrant ${filtered.length} de ${logs.length}`}
          </span>
        </div>

        <LgFilters
          filter={filter} setFilter={setFilter}
          counts={counts}
          query={query} setQuery={setQuery}
          auto={auto} setAuto={setAuto}
          searchRef={searchRef}
        />

        <div className="lg-layout">
          <div className="lg-console">
            <div className="lg-console-head">
              <div className="lg-console-head-left">
                <div className="lg-console-dots"><span /><span /><span /></div>
                <span className="lg-console-title">device.log</span>
              </div>
              <span className="lg-console-counts">
                {filtered.length} entrades · ordenat per temps ↓
              </span>
            </div>
            <div className="lg-console-body">
              {!loading && filtered.length === 0 ? (
                <LgEmpty onReset={() => { setFilter('all'); setQuery('') }} />
              ) : (
                filtered.map(l => (
                  <LgRow
                    key={l.id}
                    log={l}
                    expanded={expanded.has(l.id)}
                    onToggle={() => toggle(l.id)}
                    query={query}
                  />
                ))
              )}
            </div>
          </div>

          <aside className="lg-sidebar">
            <LgChart24 logs={logs} />
            <LgSevBars logs={logs} />
            <LgSources logs={logs} />
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
