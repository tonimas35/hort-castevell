import { useHortStore } from '../lib/store'
import { THRESHOLD_LOW, THRESHOLD_MED } from '../lib/constants'
import type { RowConfig } from '../lib/types'

function fmtDuration(s: number) {
  if (s < 60) return 'Ara'
  if (s < 3600) return Math.floor(s / 60) + ' min'
  if (s < 86400) return Math.floor(s / 3600) + 'h'
  return Math.floor(s / 86400) + 'd'
}

interface Props {
  row: RowConfig
  index: number
}

export default function NodeCard({ row, index }: Props) {
  const node = useHortStore(s => s.reading?.nodes.find(n => n.id === row.id))
  const pct = node?.humidity_pct ?? -1
  const hasData = pct >= 0

  // Water level Y: 130 (empty) → 10 (full)
  const waterY = hasData ? 130 - (pct / 100) * 120 : 130

  // Status
  const statusClass = !hasData ? '' : pct < THRESHOLD_LOW ? 'critical' : pct < THRESHOLD_MED ? 'warn' : 'ok'
  const isAlert = hasData && pct < THRESHOLD_LOW

  return (
    <article
      className={`node-card ${isAlert ? 'alert' : ''}`}
      style={{ '--card-accent': row.accent, '--card-accent-light': row.accentLight, '--delay': index } as React.CSSProperties}
    >
      <div className="node-top">
        <span className="node-badge">{row.badge}</span>
        <span className={`node-status ${statusClass}`} />
      </div>
      <h2 className="node-name">{row.name}</h2>
      <div className="gauge-wrap">
        <svg className="gauge" viewBox="0 0 120 140" aria-hidden="true">
          <defs>
            <clipPath id={`drop-clip-${row.id}`}>
              <path d="M60 10 C60 10 20 55 20 85 C20 107 38 125 60 125 C82 125 100 107 100 85 C100 55 60 10 60 10Z"/>
            </clipPath>
            <linearGradient id={`water-grad-${row.id}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={row.accent} stopOpacity="0.85"/>
              <stop offset="100%" stopColor={row.accent} stopOpacity="0.45"/>
            </linearGradient>
          </defs>
          <path className="drop-outline" d="M60 10 C60 10 20 55 20 85 C20 107 38 125 60 125 C82 125 100 107 100 85 C100 55 60 10 60 10Z"/>
          <g clipPath={`url(#drop-clip-${row.id})`}>
            <rect
              className="water-level"
              x="15" y={waterY} width="90" height="120"
              fill={`url(#water-grad-${row.id})`}
            />
            <path
              className="water-wave"
              d="M15 0 Q30 -6 45 0 T75 0 T105 0 V120 H15 Z"
              fill={row.accent}
              opacity="0.18"
              transform={`translate(0, ${waterY - 4})`}
            />
          </g>
        </svg>
        <span className="gauge-value">{hasData ? `${pct}%` : '—'}</span>
      </div>
      <div className="node-meta">
        <div className="meta-item">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="2" y="5" width="12" height="9" rx="1"/>
            <path d="M5 5V3a3 3 0 0 1 6 0v2"/>
            <line x1="8" y1="9" x2="8" y2="11"/>
          </svg>
          <span>{node?.battery_v != null ? node.battery_v.toFixed(1) + 'V' : '—'}</span>
        </div>
        <div className="meta-item">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="8" cy="8" r="6"/>
            <path d="M8 4v4l2.5 2.5"/>
          </svg>
          <span>{node?.last_seen_s != null ? fmtDuration(node.last_seen_s) : '—'}</span>
        </div>
      </div>
    </article>
  )
}
