import { Link, useLocation } from 'react-router-dom'
import { useLatestReading } from '../hooks/useLatestReading'
import { useHortStore } from '../lib/store'
import { ROWS, THRESHOLD_LOW, THRESHOLD_MED } from '../lib/constants'
import GardenCanvas from '../scene/GardenCanvas'
import '../styles/scene3d.css'

function fmtDuration(s: number) {
  if (s < 60) return 'Ara'
  if (s < 3600) return Math.floor(s / 60) + ' min'
  if (s < 86400) return Math.floor(s / 3600) + 'h'
  return Math.floor(s / 86400) + 'd'
}

function fmtLux(lux: number) {
  return lux >= 10000 ? (lux / 1000).toFixed(0) + 'k lux' : Math.round(lux) + ' lux'
}

export default function Scene3D() {
  useLatestReading()
  const reading = useHortStore(s => s.reading)
  const isConnected = useHortStore(s => s.isConnected)
  const selectedRow = useHortStore(s => s.selectedRow)
  const selectRow = useHortStore(s => s.selectRow)
  const location = useLocation()

  const ambient = reading?.ambient

  return (
    <div className="scene3d-page">
      {/* 3D Canvas */}
      <GardenCanvas />

      {/* Top bar */}
      <div className="scene-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1>Hort Castevell</h1>
          <span className={`scene-topbar-badge ${isConnected ? '' : 'offline'}`}>
            {isConnected ? 'Connectat' : 'Desconnectat'}
          </span>
        </div>
        <nav className="scene-nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link>
          <Link to="/3d" className={location.pathname === '/3d' ? 'active' : ''}>3D</Link>
        </nav>
      </div>

      {/* Info panel (right) */}
      <div className="scene-info-panel">
        {ROWS.map((row, i) => {
          const node = reading?.nodes.find(n => n.id === row.id)
          const pct = node?.humidity_pct ?? -1
          const hasData = pct >= 0
          const dotClass = !hasData ? '' : pct < THRESHOLD_LOW ? 'critical' : pct < THRESHOLD_MED ? 'warn' : 'ok'

          return (
            <div
              key={row.id}
              className={`scene-info-card ${selectedRow === i ? 'active' : ''}`}
              data-row={i}
              onClick={() => selectRow(i)}
            >
              <div className="scene-card-header">
                <span className="scene-card-label">{row.badge} — {row.name}</span>
                <span className={`scene-card-dot ${dotClass}`} />
              </div>
              <div className="scene-card-humidity">{hasData ? `${pct}%` : '—'}</div>
              <div className="scene-card-meta">
                <span>{node?.battery_v != null ? node.battery_v.toFixed(1) + 'V' : '—'}</span>
                <span>{node?.last_seen_s != null ? fmtDuration(node.last_seen_s) : '—'}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom bar */}
      <div className="scene-bottombar">
        <div className="scene-ambient-strip">
          <div className="scene-ambient-item">
            <span className="scene-ambient-value">{ambient?.temperature != null ? ambient.temperature + '°C' : '—'}</span>
            <span className="scene-ambient-label">Temperatura</span>
          </div>
          <div className="scene-ambient-item">
            <span className="scene-ambient-value">{ambient?.humidity != null ? ambient.humidity + '%' : '—'}</span>
            <span className="scene-ambient-label">Humitat aire</span>
          </div>
          <div className="scene-ambient-item">
            <span className="scene-ambient-value">{ambient?.lux != null ? fmtLux(ambient.lux) : '—'}</span>
            <span className="scene-ambient-label">Llum solar</span>
          </div>
        </div>
        <div className="scene-controls">
          <button className="scene-ctrl-btn" onClick={() => { selectRow(-1); (window as any).__cameraReset?.() }}>Reset vista</button>
          <button className="scene-ctrl-btn" onClick={() => (window as any).__cameraTop?.()}>Vista zenital</button>
        </div>
      </div>
    </div>
  )
}
