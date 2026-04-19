const { useState: useStateAmb } = React;

function AmbientStrip({ temperature = 23.5, humidity = 58, lux = 45000 }) {
  return (
    <section className="ambient-strip">
      <div className="ambient-card ambient-temp">
        <div className="ambient-card-inner">
          <svg className="ambient-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z"/>
            <circle cx="11.5" cy="17.5" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
          <div className="ambient-data">
            <span className="ambient-val">{temperature}°C</span>
            <span className="ambient-lbl">Temperatura</span>
          </div>
        </div>
      </div>
      <div className="ambient-card ambient-hum">
        <div className="ambient-card-inner">
          <svg className="ambient-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
          <div className="ambient-data">
            <span className="ambient-val">{humidity}%</span>
            <span className="ambient-lbl">Humitat aire</span>
          </div>
        </div>
      </div>
      <div className="ambient-card ambient-lux">
        <div className="ambient-card-inner">
          <svg className="ambient-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
          <div className="ambient-data">
            <span className="ambient-val">{fmtLux(lux)}</span>
            <span className="ambient-lbl">Llum solar</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function NodeCard({ row, humidity, battery, lastSeen, index = 0 }) {
  const hasData = humidity != null && humidity >= 0;
  const pct = hasData ? humidity : 0;
  const waterY = hasData ? 130 - (pct / 100) * 120 : 130;
  const statusClass = !hasData ? '' : pct < 25 ? 'critical' : pct < 45 ? 'warn' : 'ok';
  const isAlert = hasData && pct < 25;
  const cid = `drop-${row.id}`;
  return (
    <article
      className={`node-card ${isAlert ? 'alert' : ''}`}
      style={{ '--card-accent': row.accent, '--card-accent-light': row.accentLight, '--delay': index }}
    >
      <div className="node-top">
        <span className="node-badge">{row.badge}</span>
        <span className={`node-status ${statusClass}`} />
      </div>
      <h2 className="node-name">{row.name}</h2>
      <div className="gauge-wrap">
        <svg className="gauge" viewBox="0 0 120 140" aria-hidden="true">
          <defs>
            <clipPath id={cid}>
              <path d="M60 10 C60 10 20 55 20 85 C20 107 38 125 60 125 C82 125 100 107 100 85 C100 55 60 10 60 10Z"/>
            </clipPath>
            <linearGradient id={`g-${row.id}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={row.accent} stopOpacity="0.85"/>
              <stop offset="100%" stopColor={row.accent} stopOpacity="0.45"/>
            </linearGradient>
          </defs>
          <path className="drop-outline" d="M60 10 C60 10 20 55 20 85 C20 107 38 125 60 125 C82 125 100 107 100 85 C100 55 60 10 60 10Z"/>
          <g clipPath={`url(#${cid})`}>
            <rect className="water-level" x="15" y={waterY} width="90" height="120" fill={`url(#g-${row.id})`} />
            <path className="water-wave"
                  d="M15 0 Q30 -6 45 0 T75 0 T105 0 V120 H15 Z"
                  fill={row.accent} opacity="0.18"
                  transform={`translate(0, ${waterY - 4})`} />
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
          <span>{battery != null ? battery.toFixed(2) + 'V' : '—'}</span>
        </div>
        <div className="meta-item">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="8" cy="8" r="6"/>
            <path d="M8 4v4l2.5 2.5"/>
          </svg>
          <span>{fmtDuration(lastSeen)}</span>
        </div>
      </div>
    </article>
  );
}

function NodesGrid({ nodes }) {
  return (
    <section className="nodes-grid">
      {ROWS.map((row, i) => {
        const data = nodes[i] || {};
        return <NodeCard key={row.id} row={row} index={i}
                         humidity={data.humidity_pct}
                         battery={data.battery_v}
                         lastSeen={data.last_seen_s} />;
      })}
    </section>
  );
}

Object.assign(window, { AmbientStrip, NodeCard, NodesGrid });
