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
  const irrigating = useHortStore(s => s.irrigating)
  const toggleIrrigation = useHortStore(s => s.toggleIrrigation)
  const expandedPanel = useHortStore(s => s.expandedPanel)
  const setExpandedPanel = useHortStore(s => s.setExpandedPanel)
  const location = useLocation()

  const ambient = reading?.ambient

  return (
    <div className="scene3d-page">
      {/* 3D Canvas */}
      <GardenCanvas />

      {/* Top bar */}
      <div className="scene-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <svg viewBox="0 0 40 40" width="28" height="28" fill="none" aria-label="Kultiva" style={{ flexShrink: 0 }}>
            <circle cx="20" cy="20" r="19" fill="#E8F0E4" stroke="#3D5A3A" strokeWidth="1" />
            <path d="M20 10 C20 10 13 16 13 22 C13 26 16 29 20 29 C24 29 27 26 27 22 C27 16 20 10 20 10Z" fill="#3D5A3A" />
            <path d="M20 14 C20 14 16 18 16 22 C16 24.5 17.8 26 20 26 C22.2 26 24 24.5 24 22 C24 18 20 14 20 14Z" fill="#5B7A56" />
          </svg>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Kultiva</h1>
          <span className={`scene-topbar-badge ${isConnected ? '' : 'offline'}`}>
            {isConnected ? 'Connectat' : 'Desconnectat'}
          </span>
        </div>
        <nav className="scene-nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link>
          <Link to="/3d" className={location.pathname === '/3d' ? 'active' : ''}>Vista 3D</Link>
          <Link to="/control" className={location.pathname === '/control' ? 'active' : ''}>Control</Link>
          <Link to="/log" className={location.pathname === '/log' ? 'active' : ''}>Log</Link>
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
              onClick={() => { selectRow(i); (window as any).__cameraToRow?.(i) }}
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

      {/* Irrigation status indicators */}
      {irrigating.some(Boolean) && (
        <div style={{
          position: 'fixed', top: '4rem', left: '1.25rem', zIndex: 100,
          display: 'flex', flexDirection: 'column', gap: '0.35rem',
          animation: 'sceneSlideIn 0.4s ease forwards',
        }}>
          {irrigating.map((active, i) => active ? (
            <div key={i} style={{
              background: 'rgba(34, 119, 187, 0.2)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(68, 153, 221, 0.3)',
              borderRadius: '8px',
              padding: '0.4rem 0.7rem',
              color: '#4499DD',
              fontSize: '0.7rem',
              fontWeight: 600,
              fontFamily: "'Outfit', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4499DD', boxShadow: '0 0 6px rgba(68,153,221,0.6)', animation: 'pulse 1s ease infinite' }} />
              💧 {ROWS[i].badge} regant...
            </div>
          ) : null)}
        </div>
      )}

      {/* Expanded panel popup — DOM overlay */}
      {expandedPanel && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10, 10, 8, 0.8)',
          backdropFilter: 'blur(8px)',
        }} onClick={() => setExpandedPanel(null)}>
          <div style={{
            background: 'rgba(20, 20, 16, 0.96)',
            backdropFilter: 'blur(24px)',
            border: '2px solid rgba(100, 200, 100, 0.3)',
            borderRadius: '20px',
            padding: '32px 36px',
            color: '#F2EBD9',
            fontFamily: "'Outfit', sans-serif",
            width: '80vw',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
          }} onClick={e => e.stopPropagation()}>
            {/* Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => setExpandedPanel(null)} style={{
                background: 'rgba(253,250,243,0.1)', border: 'none',
                color: '#8a7e6b', fontSize: '1.4rem',
                cursor: 'pointer', padding: '6px 12px',
                borderRadius: '8px', lineHeight: 1,
              }}>×</button>
            </div>

            {/* Central panel content */}
            {expandedPanel === 'central' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(253,250,243,0.1)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: isConnected ? '#44DD44' : '#DD4444', boxShadow: isConnected ? '0 0 10px rgba(68,221,68,0.6)' : 'none' }} />
                  <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>Unitat Central</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, padding: '3px 8px', borderRadius: '5px', background: isConnected ? 'rgba(68,221,68,0.15)' : 'rgba(221,68,68,0.15)', color: isConnected ? '#44DD44' : '#DD4444', marginLeft: 'auto' }}>{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a7e6b', marginBottom: '10px' }}>Sensors ambientals</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#E8A050' }}>{ambient?.temperature ?? '23.5'}°</div><div style={{ fontSize: '0.7rem', color: '#8a7e6b' }}>TEMP</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#50A0D0' }}>{ambient?.humidity ?? '58'}%</div><div style={{ fontSize: '0.7rem', color: '#8a7e6b' }}>HUMITAT</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#D0C050' }}>{ambient?.lux != null ? (ambient.lux >= 1000 ? (ambient.lux/1000).toFixed(0)+'k' : ambient.lux) : '45k'}</div><div style={{ fontSize: '0.7rem', color: '#8a7e6b' }}>LUX</div></div>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a7e6b', marginBottom: '10px' }}>Nodes ({reading?.nodes.length ?? 0}/4 actius)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                  {ROWS.map((row, i) => {
                    const node = reading?.nodes.find(n => n.id === row.id)
                    return (
                      <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '6px 10px', borderRadius: '8px', background: irrigating[i] ? 'rgba(68,153,221,0.1)' : 'rgba(253,250,243,0.03)' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: row.accent, color: '#fff', padding: '2px 7px', borderRadius: '4px' }}>{row.badge}</span>
                        <span style={{ flex: 1, color: '#aaa' }}>{row.name}</span>
                        {node ? <span style={{ fontWeight: 700, color: '#F2EBD9', fontSize: '1rem' }}>{node.humidity_pct}%</span> : <span style={{ color: '#555' }}>—</span>}
                        {node?.last_seen_s != null && <span style={{ color: '#666', fontSize: '0.7rem' }}>{fmtDuration(node.last_seen_s)}</span>}
                        {irrigating[i] && <span style={{ color: '#4499DD' }}>💧</span>}
                      </div>
                    )
                  })}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a7e6b', marginBottom: '10px' }}>Sistema</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.85rem', color: '#8a7e6b' }}>
                  <div><span style={{ color: '#F2EBD9', fontWeight: 600 }}>ESP32-WROOM-32</span><div>Microcontrolador</div></div>
                  <div><span style={{ color: '#F2EBD9', fontWeight: 600 }}>WiFi + ESP-NOW</span><div>Comunicació</div></div>
                  <div><span style={{ color: '#F2EBD9', fontWeight: 600 }}>{irrigating.filter(Boolean).length > 0 ? `${irrigating.filter(Boolean).length} files regant` : 'Tot aturat'}</span><div>Reg</div></div>
                  <div><span style={{ color: '#F2EBD9', fontWeight: 600 }}>Supabase</span><div>Base de dades</div></div>
                </div>
              </div>
            )}

            {/* Valve panel content */}
            {expandedPanel?.startsWith('valve-') && (() => {
              const idx = parseInt(expandedPanel.split('-')[1])
              const row = ROWS[idx]
              const isIrr = irrigating[idx]
              return (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a7e6b', marginBottom: '8px' }}>{row.badge} — {row.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem', marginBottom: '16px', color: isIrr ? '#4499DD' : '#8a7e6b' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: isIrr ? '#4499DD' : '#555', boxShadow: isIrr ? '0 0 10px rgba(68,153,221,0.6)' : 'none' }} />
                    {isIrr ? 'Regant...' : 'Vàlvula tancada'}
                  </div>
                  <button onClick={() => toggleIrrigation(idx)} style={{
                    width: '100%', padding: '14px 20px', border: 'none', borderRadius: '12px',
                    fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 600,
                    cursor: 'pointer', color: '#fff',
                    background: isIrr ? 'linear-gradient(135deg, #AA3333, #DD4444)' : 'linear-gradient(135deg, #2277BB, #33AAEE)',
                    boxShadow: isIrr ? '0 4px 15px rgba(170,51,51,0.4)' : '0 4px 15px rgba(34,119,187,0.4)',
                  }}>
                    {isIrr ? '⏹ Parar reg' : '💧 Regar'}
                  </button>
                </div>
              )
            })()}

            {/* Sensor panel content */}
            {expandedPanel?.startsWith('sensor-') && (() => {
              const idx = parseInt(expandedPanel.split('-')[1])
              const row = ROWS[idx]
              const node = reading?.nodes.find(n => n.id === row.id) ?? { humidity_pct: [42, 55, 31, 68][idx], humidity_raw: [2245, 1932, 2410, 1578][idx], battery_v: [3.85, 3.92, 3.71, 4.01][idx], last_seen_s: [900, 1200, 600, 450][idx] }
              const pct = node.humidity_pct
              const statusColor = pct < 25 ? '#DD4444' : pct < 45 ? '#DDAA33' : '#44CC55'
              const statusText = pct < 25 ? 'Sec — Cal regar!' : pct < 45 ? 'Vigilar' : 'Bé'
              return (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a7e6b', marginBottom: '10px' }}>{row.badge} — Sensor humitat</div>
                  <div style={{ fontSize: '3rem', fontWeight: 800, color: statusColor, lineHeight: 1, marginBottom: '6px' }}>{pct}%</div>
                  <div style={{ fontSize: '0.9rem', color: statusColor, fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                    {statusText}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', fontSize: '0.85rem', color: '#8a7e6b' }}>
                    <div><div style={{ color: '#F2EBD9', fontWeight: 600, fontSize: '1.1rem' }}>{'humidity_raw' in node ? (node as any).humidity_raw : '—'}</div><div>Raw ADC</div></div>
                    <div><div style={{ color: '#F2EBD9', fontWeight: 600, fontSize: '1.1rem' }}>{'battery_v' in node ? (node as any).battery_v.toFixed(2) + 'V' : '—'}</div><div>Bateria</div></div>
                    <div><div style={{ color: '#F2EBD9', fontWeight: 600, fontSize: '1.1rem' }}>{'last_seen_s' in node ? fmtDuration((node as any).last_seen_s) : '—'}</div><div>Última lectura</div></div>
                    <div><div style={{ color: '#F2EBD9', fontWeight: 600, fontSize: '1.1rem' }}>{row.name}</div><div>Fila</div></div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
