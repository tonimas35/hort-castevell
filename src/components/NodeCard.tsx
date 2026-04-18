import { useHortStore } from '../lib/store'
import type { RowConfig } from '../lib/types'

function fmtDuration(s: number | undefined) {
  if (s == null) return '—'
  if (s < 60) return 'Ara'
  if (s < 3600) return 'fa ' + Math.floor(s / 60) + ' min'
  if (s < 86400) return 'fa ' + Math.floor(s / 3600) + 'h'
  return 'fa ' + Math.floor(s / 86400) + 'd'
}

function batteryPct(v: number | undefined): number | null {
  if (v == null) return null
  // Li-ion 3.0 (empty) → 4.2 (full)
  return Math.max(0, Math.min(100, Math.round(((v - 3.0) / 1.2) * 100)))
}

interface Props {
  row: RowConfig
  target?: number
}

export default function NodeCard({ row, target = 50 }: Props) {
  const node = useHortStore(s => s.reading?.nodes.find(n => n.id === row.id))
  const irrigating = useHortStore(s => s.irrigating[row.id - 1])

  const pct = node?.humidity_pct
  const hasData = pct != null

  // Oura-ring geometry (128x128 SVG, r=52 stroke 9)
  const R = 52
  const C = 2 * Math.PI * R
  const ringPct = hasData ? pct : 0
  const offset = C - (ringPct / 100) * C

  // Status chip
  let state: 'ok' | 'warn' | 'critical' | 'irrigating' | 'neutral' = 'neutral'
  let chipLabel = 'Sense senyal'
  if (irrigating) {
    state = 'irrigating'
    chipLabel = 'Regant'
  } else if (hasData) {
    if (pct < target - 20) {
      state = 'critical'
      chipLabel = 'Cal regar'
    } else if (pct < target - 5) {
      state = 'warn'
      chipLabel = 'Atenció'
    } else {
      state = 'ok'
      chipLabel = 'Òptim'
    }
  }

  const battPct = batteryPct(node?.battery_v)

  return (
    <article
      className="kv-node"
      style={{ '--node-accent': row.accent } as React.CSSProperties}
    >
      <div className="kv-node-head">
        <div className="kv-node-title">
          <span className="kv-node-badge">{row.badge}</span>
          <span className="kv-node-name">{row.name}</span>
        </div>
        <span className={`kv-node-chip ${state}`}>{chipLabel}</span>
      </div>

      <div className="kv-node-ring">
        <svg viewBox="0 0 128 128" width={128} height={128}>
          <circle className="kv-node-ring-track" cx="64" cy="64" r={R} strokeWidth="9" fill="none" />
          <circle
            className="kv-node-ring-fg"
            cx="64" cy="64" r={R} strokeWidth="9" fill="none"
            stroke={row.accent}
            strokeDasharray={C}
            strokeDashoffset={offset}
            transform="rotate(-90 64 64)"
          />
        </svg>
        <div className="kv-node-pct">
          {hasData ? pct : '—'}
          {hasData && <span className="kv-node-pct-unit">%</span>}
        </div>
      </div>

      <div className="kv-node-target">Objectiu {target}%</div>

      <div className="kv-node-foot">
        <span className="kv-node-meta-item" title="Bateria">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor">
            <rect x="2" y="5" width="11" height="7" rx="1" />
            <path d="M13 7v3" />
          </svg>
          {battPct !== null ? `${battPct}%` : '—'}
        </span>
        <span className="kv-node-meta-item" title="Última lectura">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 4v4l2.5 2.5" />
          </svg>
          {fmtDuration(node?.last_seen_s)}
        </span>
      </div>
    </article>
  )
}
