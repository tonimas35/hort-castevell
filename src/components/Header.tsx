import { Link, useLocation } from 'react-router-dom'
import { useHortStore } from '../lib/store'
import '../styles/header.css'

function fmtDate(ts: number) {
  const d = new Date(ts * 1000)
  const day = d.getDate()
  const months = ['gen', 'feb', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'des']
  const month = months[d.getMonth()]
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month} · ${hh}:${mm}`
}

export default function Header() {
  const reading = useHortStore(s => s.reading)
  const isConnected = useHortStore(s => s.isConnected)
  const location = useLocation()

  const pathNav = (p: string) =>
    location.pathname === p ? 'active' : ''

  return (
    <header className="kv-header">
      <div className="kv-header-inner">
        <Link to="/" className="kv-logo">
          <div className="kv-logo-mark">
            <svg viewBox="0 0 40 40" width="34" height="34" fill="none" aria-label="Kultiva">
              <circle cx="20" cy="20" r="19" fill="#E8F0E4" stroke="#3D5A3A" strokeWidth="1" />
              <path
                d="M20 10 C20 10 13 16 13 22 C13 26 16 29 20 29 C24 29 27 26 27 22 C27 16 20 10 20 10Z"
                fill="#3D5A3A"
              />
              <path
                d="M20 14 C20 14 16 18 16 22 C16 24.5 17.8 26 20 26 C22.2 26 24 24.5 24 22 C24 18 20 14 20 14Z"
                fill="#5B7A56"
              />
            </svg>
          </div>
          <div>
            <div className="kv-logo-name">Kultiva</div>
            <div className="kv-logo-sub">Masia · Castevell</div>
          </div>
        </Link>

        <div className="kv-header-right">
          <div className="kv-last-update">
            <span className="kv-last-label">Última lectura</span>
            <span className="kv-last-value">{reading ? fmtDate(reading.timestamp) : '—'}</span>
          </div>

          <span className={`kv-conn-badge ${isConnected ? '' : 'offline'}`}>
            <span className="kv-conn-dot" />
            {isConnected ? 'Connectat' : 'Desconnectat'}
          </span>

          <nav className="kv-nav">
            <Link to="/" className={pathNav('/')}>Dashboard</Link>
            <Link to="/3d" className={pathNav('/3d')}>Vista 3D</Link>
            <Link to="/control" className={pathNav('/control')}>Control</Link>
            <Link to="/log" className={pathNav('/log')}>Log</Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
