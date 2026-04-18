// Kultiva — Mobile variant (390x844). Reuses ROWS, fmtDuration, fmtLux from Shared.jsx.
const { useState } = React;

// ---------- Mobile 3D scene ----------
function MobileScene({ nodes, ambient, sel, setSel }) {
  const [ambOpen, setAmbOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // Simplified 3D-ish isometric bed SVG for phone
  const W = 390, H = 706;
  const cx = W/2, cy = 360;
  const halfW = 155, halfD = 95, wallH = 24;
  const topTL=[cx-halfW,cy-halfD], topTR=[cx+halfW,cy-halfD], topBR=[cx+halfW,cy+halfD], topBL=[cx-halfW,cy+halfD];

  return (
    <div className="m-scene">
      <svg className="m-scene-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky-m" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B8D4E8"/>
            <stop offset="60%" stopColor="#E8DFC8"/>
            <stop offset="100%" stopColor="#D4C89E"/>
          </linearGradient>
          <linearGradient id="soil-m" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5A3F2A"/>
            <stop offset="100%" stopColor="#3D2A1C"/>
          </linearGradient>
          <linearGradient id="wood-m" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6B4A30"/>
            <stop offset="100%" stopColor="#8B6A4A"/>
          </linearGradient>
        </defs>
        {/* Sky */}
        <rect x="0" y="0" width={W} height="500" fill="url(#sky-m)"/>
        {/* Sun */}
        <circle cx="310" cy="120" r="28" fill="#F9E6A8" opacity=".8"/>
        <circle cx="310" cy="120" r="16" fill="#FFF3C0"/>
        {/* Hills */}
        <path d={`M0 430 Q100 390 200 410 T ${W} 405 L${W} 500 L0 500 Z`} fill="#6B8A5C" opacity=".55"/>
        <path d={`M0 460 Q120 430 240 450 T ${W} 445 L${W} 500 L0 500 Z`} fill="#4E7A48" opacity=".7"/>
        {/* Ground */}
        <rect x="0" y="470" width={W} height="236" fill="#7A9A5C"/>

        {/* Bed — iso */}
        <g>
          <polygon points={`${topBL[0]},${topBL[1]} ${topBR[0]},${topBR[1]} ${topBR[0]},${topBR[1]+wallH} ${topBL[0]},${topBL[1]+wallH}`} fill="url(#wood-m)"/>
          <polygon points={`${topTL[0]},${topTL[1]} ${topTR[0]},${topTR[1]} ${topBR[0]},${topBR[1]} ${topBL[0]},${topBL[1]}`} fill="url(#soil-m)"/>
          <polygon points={`${topTL[0]},${topTL[1]} ${topTR[0]},${topTR[1]} ${topBR[0]},${topBR[1]} ${topBL[0]},${topBL[1]}`} fill="none" stroke="#A98662" strokeWidth="1.5" opacity=".7"/>

          {/* 4 rows */}
          {[0,1,2,3].map(i=>{
            const accents=['#4E7A48','#3B7A8C','#C4673D','#8B6A3E'];
            const rowDepth=(halfD*2-10)/4;
            const rowY=topTL[1]+6+i*rowDepth+rowDepth/2;
            const x0=topTL[0]+14, x1=topTR[0]-14;
            const pct=(nodes[i]||{}).humidity_pct;
            const plantCount=7;
            const isSel=sel===i;
            return (
              <g key={i} onClick={()=>setSel(i)} style={{cursor:'pointer'}}>
                <line x1={x0} y1={rowY} x2={x1} y2={rowY} stroke="#6B7280" strokeWidth="1.2" opacity=".7"/>
                {Array.from({length:plantCount}).map((_,k)=>{
                  const x=x0+(k/(plantCount-1))*(x1-x0), y=rowY;
                  if(i===0||i===1) return (
                    <g key={k}>
                      <circle cx={x} cy={y-4} r="6" fill="#6FAA5C"/>
                      <circle cx={x-1} cy={y-6} r="3.5" fill="#8FC47A"/>
                    </g>
                  );
                  if(i===2) return (
                    <g key={k}>
                      <circle cx={x} cy={y-10} r="6" fill="#4E7A48"/>
                      <circle cx={x-1} cy={y-8} r="1.5" fill="#C4673D"/>
                    </g>
                  );
                  return <circle key={k} cx={x} cy={y-6} r="6.5" fill="#3D6B3A"/>;
                })}
                {isSel && (
                  <rect x={x0-6} y={rowY-rowDepth/2+2} width={x1-x0+12} height={rowDepth-3}
                        fill="none" stroke={accents[i]} strokeWidth="1.5" strokeDasharray="4 3" rx="3" opacity=".9"/>
                )}
                {/* Sensor peg */}
                <g transform={`translate(${x1+2},${rowY})`}>
                  <rect x="-1.5" y="-22" width="3" height="22" fill="#CFC3A6"/>
                  <rect x="-4" y="-26" width="8" height="6" rx="1" fill="#2A2A20"/>
                  <circle cx="0" cy="-23" r="1.6" fill={accents[i]}>
                    {pct!=null && pct<25 && <animate attributeName="opacity" values="1;.3;1" dur="1s" repeatCount="indefinite"/>}
                  </circle>
                </g>
              </g>
            );
          })}
        </g>

        {/* Particles */}
        <g opacity=".45" fill="#F4E8C8">
          {Array.from({length:12}).map((_,i)=>(
            <circle key={i} cx={(i*57+30)%W} cy={(i*31+40)%400} r=".8"/>
          ))}
        </g>
      </svg>

      {/* Ambient pill top-left */}
      <div className={`m-ambient ${ambOpen?'expanded':'collapsed'}`} onClick={()=>!ambOpen && setAmbOpen(true)}>
        {!ambOpen ? (
          <>
            <svg className="m-ambient-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
            <span className="m-ambient-pill-text">{ambient.temperature}°C</span>
            <span className="m-ambient-pill-chevron">▸</span>
          </>
        ) : (
          <>
            <div className="m-ambient-expanded-head">
              <h4>Ambient · Ara</h4>
              <button className="m-ambient-close" onClick={e=>{e.stopPropagation(); setAmbOpen(false);}}>×</button>
            </div>
            <div className="m-ambient-row">
              <span className="m-ambient-row-label">Temperatura</span>
              <span className="m-ambient-row-val">{ambient.temperature}°C</span>
            </div>
            <div className="m-ambient-row">
              <span className="m-ambient-row-label">Humitat</span>
              <span className="m-ambient-row-val">{ambient.humidity}%</span>
            </div>
            <div className="m-ambient-row">
              <span className="m-ambient-row-label">Llum</span>
              <span className="m-ambient-row-val">{fmtLux(ambient.lux)}</span>
            </div>
          </>
        )}
      </div>

      {/* Status top-right */}
      <div className="m-scene-status">
        <span className="m-scene-ago">fa 2 min</span>
        <span className="m-scene-badge">Connectat</span>
      </div>

      {/* FAB menu */}
      <div className={`m-fab-menu ${fabOpen?'open':''}`}>
        <button className="m-fab-menu-btn" onClick={()=>{setFabOpen(false); setSel(-1);}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M12 3v18"/></svg>
          Reset vista
        </button>
        <button className="m-fab-menu-btn" onClick={()=>setFabOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          Vista zenital
        </button>
        <button className="m-fab-menu-btn" onClick={()=>setFabOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>
          Mode cinema
        </button>
      </div>

      {/* FAB */}
      <button className="m-fab" onClick={()=>setFabOpen(!fabOpen)} aria-label="Càmera">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
        </svg>
      </button>

      {/* Row cards — horizontal scroll bottom */}
      <div className="m-row-cards">
        {ROWS.map((row,i)=>{
          const n=nodes[i]||{};
          const pct=n.humidity_pct, has=pct!=null;
          const dot=!has?'neutral':pct<25?'critical':pct<45?'warn':'ok';
          const irr=n.irrigating;
          const irrPct=irr?Math.min(100,Math.round((n.irrigation_elapsed_min/n.irrigation_total_min)*100)):0;
          return (
            <div key={row.id} className={`m-row-card ${sel===i?'active':''}`} onClick={()=>setSel(i)}>
              <div className="m-row-card-head">
                <span className="m-row-card-badge">{row.badge}</span>
                <span className={`m-row-card-dot ${dot}`}/>
              </div>
              <div className="m-row-card-name">{row.name}</div>
              <div className="m-row-card-pct">{has?`${pct}%`:'—'}</div>
              {irr && (
                <>
                  <div className="m-row-card-prog"><div className="m-row-card-prog-bar" style={{width:`${irrPct}%`,background:row.accent}}/></div>
                  <div className="m-row-card-irr">Regant {n.irrigation_elapsed_min}/{n.irrigation_total_min} min</div>
                </>
              )}
              <div className="m-row-card-meta">
                <span>{n.battery_v!=null?n.battery_v.toFixed(2)+'V':'—'}</span>
                <span>{fmtDuration(n.last_seen_s)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Mobile Dashboard ----------
function MobileDash({ nodes, ambient }) {
  return (
    <div className="m-dash">
      <div className="m-dash-sub">Masia de Castevell</div>
      <div className="m-dash-title">Kultiva</div>
      <div className="m-dash-ago"><span className="dot"/>Última lectura · fa 2 min · 4/4 nodes actius</div>

      <div className="m-dash-section">Ambient</div>
      <div className="m-dash-ambient">
        <div className="m-dash-amb-card"><div className="m-dash-amb-val">{ambient.temperature}°C</div><div className="m-dash-amb-label">Temp</div></div>
        <div className="m-dash-amb-card"><div className="m-dash-amb-val">{ambient.humidity}%</div><div className="m-dash-amb-label">Humitat</div></div>
        <div className="m-dash-amb-card"><div className="m-dash-amb-val">{fmtLux(ambient.lux)}</div><div className="m-dash-amb-label">Llum</div></div>
      </div>

      <div className="m-dash-section">Files</div>
      <div className="m-dash-rows">
        {ROWS.map((row,i)=>{
          const n=nodes[i]||{};
          const pct=n.humidity_pct, has=pct!=null;
          const dot=!has?'neutral':pct<25?'critical':pct<45?'warn':'ok';
          return (
            <div key={row.id} className="m-dash-row" style={{'--row-accent':row.accent}}>
              <div className="m-dash-row-info">
                <div className="m-dash-row-badge">{row.badge}</div>
                <div className="m-dash-row-name">{row.name}</div>
                <div className="m-dash-row-meta">
                  <span>{n.battery_v!=null?n.battery_v.toFixed(2)+'V':'—'}</span>
                  <span>·</span>
                  <span>{fmtDuration(n.last_seen_s)}</span>
                </div>
              </div>
              <div className="m-dash-row-pct">{has?`${pct}%`:'—'}</div>
              <div className={`m-dash-row-status ${dot}`}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Mobile Control ----------
function MobileControl({ nodes }) {
  return (
    <div className="m-ctrl">
      <div className="m-dash-sub">Control manual</div>
      <div className="m-dash-title">Vàlvules</div>
      <div className="m-dash-ago"><span className="dot"/>Commands ESP-NOW · ACK &lt; 500ms</div>
      <div style={{marginTop:18}}>
        {ROWS.map((row,i)=>{
          const n=nodes[i]||{};
          return (
            <div key={row.id} className="m-ctrl-card" style={{'--row-accent':row.accent}}>
              <div className="m-ctrl-head">
                <div>
                  <div className="m-ctrl-badge">{row.badge} · {fmtDuration(n.last_seen_s)}</div>
                  <div className="m-ctrl-name">{row.name}</div>
                </div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:'1.1rem',fontWeight:700}}>{n.humidity_pct!=null?n.humidity_pct+'%':'—'}</div>
              </div>
              <div className="m-ctrl-btns">
                <button className="m-ctrl-btn">Tancar</button>
                <button className="m-ctrl-btn primary">{n.irrigating?'Regant...':'Regar 10 min'}</button>
                <button className="m-ctrl-btn">+ Temps</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Mobile Log ----------
function MobileLog() {
  const logs = [
    { t:'17:43:22', l:'info',  m:'[sys] valve F1 OPEN · 90min' },
    { t:'17:43:01', l:'error', m:'[F2] timeout after 3 retries' },
    { t:'17:42:08', l:'warn',  m:'[F3] battery 3.32V — low' },
    { t:'17:42:03', l:'info',  m:'[F1] humidity 42% — OK' },
    { t:'17:41:55', l:'info',  m:'[F4] humidity 85% — OK' },
    { t:'17:30:02', l:'info',  m:'[sys] cycle — 4/4 reported' },
    { t:'17:29:48', l:'info',  m:'[F1] ESP-NOW RSSI −62dBm' },
    { t:'17:15:00', l:'info',  m:'[sys] valve F1 CLOSE · 4.5L' },
  ];
  return (
    <div className="m-log">
      <div className="m-dash-sub">Últimes 100 entrades</div>
      <div className="m-dash-title" style={{fontFamily:'var(--font-body)'}}>Device Log</div>
      <div style={{marginTop:16}}>
        {logs.map((x,i)=>(
          <div key={i} className="m-log-row">
            <span className="m-log-ts">{x.t}</span>
            <span className={`m-log-chip ${x.l}`}>{x.l}</span>
            <span className="m-log-msg">{x.m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Tab bar ----------
function TabBar({ active, onChange }) {
  const tabs = [
    { id:'dashboard', l:'Dashboard', icon: <path d="M3 12l9-9 9 9v9a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2z"/> },
    { id:'3d',        l:'3D',        icon: <g><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5M3 17l9 5 9-5"/></g> },
    { id:'control',   l:'Control',   icon: <g><circle cx="8" cy="7" r="3"/><path d="M8 10v11M3 16h10"/><circle cx="16" cy="17" r="3"/><path d="M16 3v11M11 8h10"/></g> },
    { id:'log',       l:'Log',       icon: <g><path d="M4 6h16M4 12h16M4 18h10"/></g> },
  ];
  return (
    <nav className="mobile-tabbar">
      {tabs.map(t=>(
        <button key={t.id} className={`mobile-tab ${active===t.id?'active':''}`} onClick={()=>onChange(t.id)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">{t.icon}</svg>
          <span>{t.l}</span>
        </button>
      ))}
    </nav>
  );
}

// ---------- App ----------
function MobileApp() {
  const NODES = [
    { humidity_pct: 62, battery_v: 3.85, last_seen_s: 720, irrigating: false },
    { humidity_pct: 40, battery_v: 3.92, last_seen_s: 1200, irrigating: false },
    { humidity_pct: 21, battery_v: 3.71, last_seen_s: 600,  irrigating: true, irrigation_elapsed_min: 4, irrigation_total_min: 20 },
    { humidity_pct: 85, battery_v: 4.01, last_seen_s: 45,   irrigating: false },
  ];
  const AMBIENT = { temperature: 23.5, humidity: 58, lux: 45200 };

  const [page, setPage] = useState(()=>localStorage.getItem('kv-m-page')||'3d');
  const [sel, setSel] = useState(-1);
  React.useEffect(()=>localStorage.setItem('kv-m-page', page),[page]);

  let view;
  if (page==='dashboard') view = <MobileDash nodes={NODES} ambient={AMBIENT}/>;
  else if (page==='3d')   view = <MobileScene nodes={NODES} ambient={AMBIENT} sel={sel} setSel={setSel}/>;
  else if (page==='control') view = <MobileControl nodes={NODES}/>;
  else view = <MobileLog/>;

  return (
    <div className="mobile-frame">
      <div className="mobile-notch"/>
      <div className="mobile-statusbar">
        <span>9:41</span>
        <div className="mobile-statusbar-icons">
          <span>●●●●</span>
          <span>5G</span>
          <span>▮▮▮</span>
        </div>
      </div>
      <div className="mobile-screen">{view}</div>
      <TabBar active={page} onChange={setPage}/>
    </div>
  );
}

Object.assign(window, { MobileApp });
