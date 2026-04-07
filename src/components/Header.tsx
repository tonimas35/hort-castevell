import { Link, useLocation } from 'react-router-dom'
import { useHortStore } from '../lib/store'
import ConnectionBadge from './ConnectionBadge'

function fmtTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
}

export default function Header() {
  const reading = useHortStore(s => s.reading)
  const location = useLocation()

  return (
    <header>
      <div className="header-inner">
        <div className="header-left">
          <div className="header-icon">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" fill="#3D5A3A" opacity="0.15"/>
              <path d="M20 8 C20 8 10 16 10 24 C10 30 14.5 34 20 34 C25.5 34 30 30 30 24 C30 16 20 8 20 8Z" fill="#3D5A3A" opacity="0.3"/>
              <path d="M20 12 C20 12 13 18 13 24 C13 28.5 16 31 20 31 C24 31 27 28.5 27 24 C27 18 20 12 20 12Z" fill="#4E7A48"/>
              <path d="M18 20 Q20 17 22 20 Q24 23 20 28 Q16 23 18 20Z" fill="#7CB97A" opacity="0.6"/>
            </svg>
          </div>
          <div>
            <h1>Hort Castevell</h1>
            <p className="header-sub">Masia de Castevell, Tarragona</p>
          </div>
        </div>
        <div className="header-right">
          <nav className="header-nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link>
            <Link to="/3d" className={location.pathname === '/3d' ? 'active' : ''}>Vista 3D</Link>
            <Link to="/control" className={location.pathname === '/control' ? 'active' : ''}>Control</Link>
          </nav>
          <ConnectionBadge />
          <div className="last-update">
            <span className="update-label">Última lectura</span>
            <span className="update-time">{reading ? fmtTime(reading.timestamp) : '—'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
