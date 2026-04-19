import { useMemo } from 'react'
import { useHortStore } from '../lib/store'
import { useHistory } from '../hooks/useHistory'

function fmtLux(lux: number | null | undefined): string {
  if (lux == null) return '—'
  return lux >= 1000 ? (lux / 1000).toFixed(0) + 'k' : Math.round(lux).toString()
}

function Sparkline({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null
  const W = 200
  const H = height
  const min = Math.min(...data)
  const max = Math.max(...data)
  const r = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / r) * (H - 4) - 2
    return [x, y] as const
  })
  const poly = pts.map(p => p.join(',')).join(' ')
  const area = `0,${H} ${poly} ${W},${H}`
  const last = pts[pts.length - 1]
  return (
    <svg className="kv-amb-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polygon points={area} fill={color} opacity="0.12" />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  )
}

export default function AmbientStrip() {
  const ambient = useHortStore(s => s.reading?.ambient)
  const history = useHistory(12)

  const { tempSpark, humSpark, luxSpark } = useMemo(() => {
    const temp: number[] = []
    const hum: number[] = []
    const lux: number[] = []
    history.forEach(r => {
      if (r.ambient?.temperature != null) temp.push(r.ambient.temperature)
      if (r.ambient?.humidity != null) hum.push(r.ambient.humidity)
      if (r.ambient?.lux != null) lux.push(r.ambient.lux)
    })
    return { tempSpark: temp, humSpark: hum, luxSpark: lux }
  }, [history])

  return (
    <section className="kv-ambient" aria-label="Sensors ambientals">
      {/* Temperature */}
      <div className="kv-amb-card">
        <div className="kv-amb-top">
          <div className="kv-amb-icon-wrap">
            <svg className="kv-amb-icon temp" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z" />
              <circle cx="11.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <span className="kv-amb-label">Temperatura</span>
        </div>
        <div className="kv-amb-mid">
          <span className="kv-amb-val">
            {ambient?.temperature != null ? ambient.temperature.toFixed(1) : '—'}
            <span className="kv-amb-val-unit">°C</span>
          </span>
        </div>
        {tempSpark.length > 1 && <Sparkline data={tempSpark} color="var(--amber)" />}
      </div>

      {/* Air humidity */}
      <div className="kv-amb-card">
        <div className="kv-amb-top">
          <div className="kv-amb-icon-wrap">
            <svg className="kv-amb-icon hum" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <span className="kv-amb-label">Humitat aire</span>
        </div>
        <div className="kv-amb-mid">
          <span className="kv-amb-val">
            {ambient?.humidity != null ? Math.round(ambient.humidity) : '—'}
            <span className="kv-amb-val-unit">%</span>
          </span>
        </div>
        {humSpark.length > 1 && <Sparkline data={humSpark} color="var(--sky)" />}
      </div>

      {/* Lux */}
      <div className="kv-amb-card">
        <div className="kv-amb-top">
          <div className="kv-amb-icon-wrap">
            <svg className="kv-amb-icon lux" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          </div>
          <span className="kv-amb-label">Llum solar</span>
        </div>
        <div className="kv-amb-mid">
          <span className="kv-amb-val">
            {fmtLux(ambient?.lux)}
            {ambient?.lux != null && (
              <span className="kv-amb-val-unit">{ambient.lux >= 1000 ? 'k lux' : 'lux'}</span>
            )}
          </span>
        </div>
        {luxSpark.length > 1 && <Sparkline data={luxSpark} color="var(--olive)" />}
      </div>
    </section>
  )
}
