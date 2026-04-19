// Shared small components used across pages.
// Exposed globally on window (multi-script Babel pattern).

const { useState } = React;

const ROWS = [
  { id: 1, badge: 'F1', name: 'Enciams + porros',      accent: '#4E7A48', accentLight: '#E8F2E5' },
  { id: 2, badge: 'F2', name: 'Enciams',                accent: '#3B7A8C', accentLight: '#E0F0F4' },
  { id: 3, badge: 'F3', name: 'Tomàquets',              accent: '#C4673D', accentLight: '#FAE8DE' },
  { id: 4, badge: 'F4', name: 'Pebrots + albergínies',  accent: '#8B6A3E', accentLight: '#F3EBDD' },
];

function fmtDuration(s) {
  if (s == null) return '—';
  if (s < 60) return 'Ara';
  if (s < 3600) return Math.floor(s / 60) + ' min';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}

function fmtLux(lux) {
  if (lux == null) return '—';
  return lux >= 10000 ? (lux / 1000).toFixed(0) + 'k lux' : Math.round(lux) + ' lux';
}

function ConnectionBadge({ online = true }) {
  return (
    <div className={`conn-badge ${online ? 'online' : 'offline'}`}>
      <span className="conn-dot" />
      <span>{online ? 'Connectat' : 'Desconnectat'}</span>
    </div>
  );
}

function Header({ activePage, onNavigate, online = true, lastUpdate = '17:42', lastReadingAgo = 'fa 2 min' }) {
  const pages = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: '3d',        label: 'Vista 3D' },
    { id: 'control',   label: 'Control' },
    { id: 'log',       label: 'Log' },
  ];
  return (
    <header className="hc-header">
      <div className="header-inner">
        <div className="header-left">
          <div className="header-icon">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" fill="#3D5A3A" opacity="0.15"/>
              <path d="M20 8 C20 8 10 16 10 24 C10 30 14.5 34 20 34 C25.5 34 30 30 30 24 C30 16 20 8 20 8Z" fill="#3D5A3A" opacity="0.3"/>
              <path d="M20 12 C20 12 13 18 13 24 C13 28.5 16 31 20 31 C24 31 27 28.5 27 24 C27 18 20 12 20 12Z" fill="#7CB97A"/>
              <path d="M18 20 Q20 17 22 20 Q24 23 20 28 Q16 23 18 20Z" fill="#F2EBD9" opacity="0.8"/>
            </svg>
          </div>
          <div>
            <h1>Kultiva</h1>
            <p className="header-sub">Masia de Castevell, Tarragona</p>
          </div>
        </div>
        <div className="header-right">
          <nav className="header-nav">
            {pages.map(p => (
              <a key={p.id}
                 className={activePage === p.id ? 'active' : ''}
                 onClick={e => { e.preventDefault(); onNavigate(p.id); }}
                 href="#">
                {p.label}
              </a>
            ))}
          </nav>
          <div className="conn-stack">
            <span className="conn-last-reading">Última lectura · {lastReadingAgo}</span>
            <ConnectionBadge online={online} />
          </div>
        </div>
      </div>
    </header>
  );
}

function SectionDivider({ label }) {
  return (
    <div className="section-divider">
      <span className="divider-line" />
      <span className="divider-label">{label}</span>
      <span className="divider-line" />
    </div>
  );
}

function Footer() {
  return (
    <footer className="hc-footer">
      <div className="footer-inner">
        <span className="footer-brand">Kultiva</span>
        <span className="footer-sep">·</span>
        <span>ESP32 · Supabase · React Three Fiber</span>
        <span className="footer-sep">·</span>
        <span>v0.3.0</span>
      </div>
    </footer>
  );
}

Object.assign(window, { ROWS, fmtDuration, fmtLux, ConnectionBadge, Header, SectionDivider, Footer });
