import { useMemo, useState, useRef } from 'react'
import { useHortStore } from '../lib/store'
import { ROWS } from '../lib/constants'

// Ideal humidity ranges per row (used to compute compliance score)
const IDEAL_RANGES: Record<number, [number, number]> = {
  1: [45, 60],   // enciams + porros
  2: [45, 60],   // enciams
  3: [40, 55],   // tomàquets
  4: [50, 65],   // pebrots + albergínies
}

export default function HeroMetric() {
  const reading = useHortStore(s => s.reading)
  const [hover, setHover] = useState<{ i: number; x: number; y: number; pct: number } | null>(null)
  const heroRef = useRef<HTMLElement>(null)

  // Compute per-row compliance and global score
  const { compliance, score } = useMemo(() => {
    if (!reading) return { compliance: [0, 0, 0, 0], score: 0 }
    const c = ROWS.map(r => {
      const node = reading.nodes.find(n => n.id === r.id)
      if (!node) return 0
      const [lo, hi] = IDEAL_RANGES[r.id] || [45, 55]
      if (node.humidity_pct >= lo && node.humidity_pct <= hi) return 100
      const dist = node.humidity_pct < lo ? lo - node.humidity_pct : node.humidity_pct - hi
      return Math.max(0, Math.round(100 - dist * 3))
    })
    const avg = Math.round(c.reduce((a, b) => a + b, 0) / c.length)
    return { compliance: c, score: avg }
  }, [reading])

  const label = score > 70 ? 'Òptim' : score > 40 ? 'Atenció' : 'Crític'
  const labelCls = score > 70 ? '' : score > 40 ? 'warn' : 'critical'

  // Concentric rings: outermost → innermost = F1..F4
  const radii = [78, 64, 50, 36]

  return (
    <section className="kv-hero" ref={heroRef}>
      <div className="kv-hero-left">
        <div className="kv-hero-score">{reading ? score : '—'}</div>
        <div className={`kv-hero-label ${labelCls}`}>
          <span className="kv-hero-label-text">Salut del hort</span>
          <span className="kv-hero-label-status">· {reading ? label : 'Sense dades'}</span>
        </div>
        <div className="kv-hero-sub">
          {reading
            ? `Actualitzat · ${reading.nodes.length} de 4 nodes reportant`
            : 'Connectant amb els nodes…'}
        </div>
      </div>

      <div className="kv-hero-rings">
        <svg viewBox="0 0 180 180">
          {ROWS.map((r, i) => {
            const R = radii[i]
            const circ = 2 * Math.PI * R
            const pct = compliance[i]
            const offset = circ - (pct / 100) * circ
            return (
              <g
                key={r.id}
                className="kv-ring-group"
                onMouseMove={e => {
                  if (!heroRef.current) return
                  const rect = heroRef.current.getBoundingClientRect()
                  setHover({
                    i,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    pct,
                  })
                }}
                onMouseLeave={() => setHover(null)}
              >
                <circle className="kv-ring-bg" cx="90" cy="90" r={R} strokeWidth="9" />
                <circle
                  className="kv-ring-fg"
                  cx="90" cy="90" r={R} strokeWidth="9"
                  stroke={r.accent}
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  transform="rotate(-90 90 90)"
                />
              </g>
            )
          })}
        </svg>

        {hover && (
          <div
            className="kv-ring-tooltip visible"
            style={{
              position: 'absolute',
              left: hover.x,
              top: hover.y,
              transform: 'translate(-50%, -100%) translateY(-8px)',
              background: 'var(--text)',
              color: 'var(--surface)',
              padding: '8px 12px',
              borderRadius: 'var(--radius)',
              fontSize: 12,
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow-lg)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {ROWS[hover.i].badge}
            </div>
            <div style={{ fontWeight: 500, margin: '2px 0' }}>
              {ROWS[hover.i].name}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: ROWS[hover.i].accent }}>
              {hover.pct}% <span style={{ opacity: 0.6, fontWeight: 400 }}>· En rang</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
