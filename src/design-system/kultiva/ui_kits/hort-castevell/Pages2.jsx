function Scene3DPage({ online, onNavigate, nodes, ambient }) {
  const [sel, setSel] = React.useState(0);
  return (
    <div className="scene3d-page">
      {/* Isometric garden — matches the real R3F scene: raised wooden bancal, 4 rows with plants, drip lines, sensors, central unit */}
      <svg className="scene-bg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky3d" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8FB5C9"/>
            <stop offset="55%" stopColor="#B8CFD8"/>
            <stop offset="100%" stopColor="#E0D4B8"/>
          </linearGradient>
          <radialGradient id="sun3d" cx="78%" cy="18%" r="32%">
            <stop offset="0%" stopColor="#F4D88A" stopOpacity=".55"/>
            <stop offset="60%" stopColor="#F4D88A" stopOpacity=".15"/>
            <stop offset="100%" stopColor="#F4D88A" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="ground3d" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8A9A5B"/>
            <stop offset="100%" stopColor="#5C6B3A"/>
          </linearGradient>
          <linearGradient id="wood-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A98662"/>
            <stop offset="100%" stopColor="#8B6B4A"/>
          </linearGradient>
          <linearGradient id="wood-side" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7A5A3E"/>
            <stop offset="100%" stopColor="#5C4028"/>
          </linearGradient>
          <linearGradient id="soil3d" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A3424"/>
            <stop offset="100%" stopColor="#2E2014"/>
          </linearGradient>
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
            <feOffset dx="0" dy="4" result="offsetblur"/>
            <feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width="1200" height="360" fill="url(#sky3d)"/>
        <rect x="0" y="0" width="1200" height="360" fill="url(#sun3d)"/>
        {/* Distant hills silhouette */}
        <path d="M0 360 L140 330 L260 348 L420 315 L580 338 L720 320 L880 335 L1040 318 L1200 332 L1200 365 L0 365 Z" fill="#7A8868" opacity=".55"/>
        <path d="M0 365 L180 348 L340 360 L520 340 L700 358 L880 345 L1060 355 L1200 348 L1200 375 L0 375 Z" fill="#5C6B4A" opacity=".7"/>

        {/* Ground */}
        <rect x="0" y="360" width="1200" height="340" fill="url(#ground3d)"/>
        {/* Ground texture hatching */}
        <g opacity=".15" stroke="#3A4A28" strokeWidth=".6">
          {Array.from({length:30}).map((_,i)=>(
            <line key={i} x1={i*40-40} y1={400+i*3} x2={i*40+80} y2={410+i*3}/>
          ))}
        </g>

        {/* === BANCAL (isometric raised bed) ===
            Projection: iso angle ~30°. Top face is a parallelogram.
            Rows run horizontally inside.
        */}
        {(() => {
          // bed corners in iso
          const cx = 600, cy = 440;            // center of top face
          const halfW = 380, halfD = 150;      // half-width (horiz), half-depth (vert in 2D)
          const wallH = 34;
          const topTL = [cx - halfW, cy - halfD];
          const topTR = [cx + halfW, cy - halfD];
          const topBR = [cx + halfW, cy + halfD];
          const topBL = [cx - halfW, cy + halfD];
          const ptStr = pts => pts.map(p=>p.join(',')).join(' ');

          // front wall
          const frontWall = [
            topBL, topBR,
            [topBR[0], topBR[1]+wallH],
            [topBL[0], topBL[1]+wallH]
          ];
          // right wall
          const rightWall = [
            topTR, topBR,
            [topBR[0], topBR[1]+wallH],
            [topTR[0], topTR[1]+wallH]
          ];
          const topFace = [topTL, topTR, topBR, topBL];

          return (
            <g filter="url(#soft-shadow)">
              {/* Right wall */}
              <polygon points={ptStr(rightWall)} fill="url(#wood-side)"/>
              {/* Front wall (lighter) */}
              <polygon points={ptStr(frontWall)} fill="url(#wood-top)"/>
              {/* wood plank lines on front */}
              {[10,22].map(o=>(
                <line key={o}
                      x1={topBL[0]} y1={topBL[1]+o}
                      x2={topBR[0]} y2={topBR[1]+o}
                      stroke="#5C4028" strokeOpacity=".5" strokeWidth="1"/>
              ))}
              {/* Top soil face */}
              <polygon points={ptStr(topFace)} fill="url(#soil3d)"/>
              {/* Top-rim highlight (thin wooden frame edge) */}
              <polygon points={ptStr(topFace)} fill="none" stroke="#A98662" strokeWidth="2" opacity=".75"/>

              {/* === 4 ROWS inside bed ===
                  Each row: drip line + plants + sensor peg
              */}
              {[0,1,2,3].map(i => {
                const accents = ['#4E7A48','#3B7A8C','#C4673D','#8B6A3E'];
                const accent = accents[i];
                const pct = (nodes[i]||{}).humidity_pct;
                const rowDepth = (halfD*2 - 20)/4;                // vertical space per row in 2D
                const rowY = topTL[1] + 10 + i*rowDepth + rowDepth/2;
                const rowX0 = topTL[0] + 24;
                const rowX1 = topTR[0] - 24;
                const isSel = sel === i;

                // Plant style per row
                const plantCount = 9;
                return (
                  <g key={i} style={{cursor:'pointer'}} onClick={()=>setSel(i)}>
                    {/* drip line (thin grey tube) */}
                    <line x1={rowX0} y1={rowY} x2={rowX1} y2={rowY}
                          stroke="#6B7280" strokeWidth="2" opacity=".7"/>
                    {/* drip emitters */}
                    {Array.from({length:plantCount}).map((_,k)=>{
                      const t = k/(plantCount-1);
                      const x = rowX0 + t*(rowX1-rowX0);
                      return <circle key={k} cx={x} cy={rowY} r="1.8" fill="#4B5563"/>;
                    })}
                    {/* plants */}
                    {Array.from({length:plantCount}).map((_,k)=>{
                      const t = k/(plantCount-1);
                      const x = rowX0 + t*(rowX1-rowX0);
                      const y = rowY;
                      if (i === 0) {
                        // F1: lettuce heads (round rosettes) + occasional leek (tall thin)
                        if (k % 3 === 2) {
                          // leek
                          return (
                            <g key={k}>
                              <rect x={x-1.5} y={y-22} width="3" height="22" fill="#8FBF6E"/>
                              <path d={`M${x} ${y-28} q-6 -4 -3 -10 M${x} ${y-28} q6 -4 3 -10 M${x} ${y-30} q0 -6 0 -10`}
                                    stroke="#A8D37E" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                            </g>
                          );
                        }
                        // lettuce
                        return (
                          <g key={k}>
                            <ellipse cx={x} cy={y-2} rx="9" ry="3" fill="#3D6B3A" opacity=".5"/>
                            <circle cx={x} cy={y-6} r="8" fill="#6FAA5C"/>
                            <circle cx={x-2} cy={y-8} r="5" fill="#8FC47A"/>
                            <circle cx={x+2} cy={y-7} r="4.5" fill="#A8D37E"/>
                          </g>
                        );
                      }
                      if (i === 1) {
                        // F2: all lettuce
                        return (
                          <g key={k}>
                            <ellipse cx={x} cy={y-2} rx="9" ry="3" fill="#3D6B3A" opacity=".5"/>
                            <circle cx={x} cy={y-6} r="8" fill="#6FAA5C"/>
                            <circle cx={x-2} cy={y-8} r="5" fill="#8FC47A"/>
                          </g>
                        );
                      }
                      if (i === 2) {
                        // F3: tomato plants with cane pyramids
                        return (
                          <g key={k}>
                            {/* cane pyramid (2 diagonal lines) */}
                            <line x1={x-5} y1={y-2} x2={x} y2={y-30} stroke="#8B6B4A" strokeWidth="1.2"/>
                            <line x1={x+5} y1={y-2} x2={x} y2={y-30} stroke="#8B6B4A" strokeWidth="1.2"/>
                            {/* foliage */}
                            <circle cx={x} cy={y-18} r="9" fill="#4E7A48"/>
                            <circle cx={x-3} cy={y-22} r="5" fill="#6B9C5E"/>
                            <circle cx={x+3} cy={y-14} r="5" fill="#6B9C5E"/>
                            {/* tomatoes */}
                            <circle cx={x-2} cy={y-16} r="2.2" fill="#C4673D"/>
                            <circle cx={x+3} cy={y-20} r="2.2" fill="#D47850"/>
                          </g>
                        );
                      }
                      // F4: bushy peppers / aubergines / tomatoes mix
                      const subtype = k % 3;
                      if (subtype === 0) {
                        // pepper bush
                        return (
                          <g key={k}>
                            <circle cx={x} cy={y-10} r="10" fill="#3D6B3A"/>
                            <circle cx={x-2} cy={y-14} r="5" fill="#5C8A4F"/>
                            <ellipse cx={x-3} cy={y-8} rx="1.5" ry="3" fill="#C94A3A"/>
                            <ellipse cx={x+3} cy={y-11} rx="1.5" ry="3" fill="#D9C94A"/>
                          </g>
                        );
                      }
                      if (subtype === 1) {
                        // aubergine
                        return (
                          <g key={k}>
                            <circle cx={x} cy={y-12} r="9" fill="#4E7A48"/>
                            <ellipse cx={x-1} cy={y-8} rx="2" ry="4.5" fill="#4B2B6A"/>
                            <ellipse cx={x+3} cy={y-10} rx="1.8" ry="4" fill="#3A1F55"/>
                          </g>
                        );
                      }
                      // small tomato
                      return (
                        <g key={k}>
                          <circle cx={x} cy={y-8} r="8" fill="#5C8A4F"/>
                          <circle cx={x-1} cy={y-10} r="1.8" fill="#C4673D"/>
                        </g>
                      );
                    })}

                    {/* row selection highlight */}
                    {isSel && (
                      <rect x={rowX0-10} y={rowY-rowDepth/2+4} width={rowX1-rowX0+20} height={rowDepth-4}
                            fill="none" stroke={accent} strokeWidth="2" strokeDasharray="5 4" rx="4"
                            opacity=".9"/>
                    )}

                    {/* Sensor peg at right end */}
                    <g transform={`translate(${rowX1+4}, ${rowY})`}>
                      <rect x="-2" y="-30" width="4" height="30" fill="#CFC3A6"/>
                      <rect x="-6" y="-36" width="12" height="8" rx="1.5" fill="#2A2A20" stroke="#5A5A4A" strokeWidth=".6"/>
                      <circle cx="0" cy="-32" r="2" fill={accent}
                              opacity={pct!=null && pct<25 ? 1 : .85}>
                        {pct!=null && pct<25 && <animate attributeName="opacity" values="1;.3;1" dur="1s" repeatCount="indefinite"/>}
                      </circle>
                    </g>
                  </g>
                );
              })}

              {/* Central unit — small device on ground next to bed */}
              <g transform={`translate(${topBL[0]-60}, ${topBL[1]+10})`}>
                {/* base */}
                <polygon points="0,0 40,0 46,6 46,40 40,46 0,46 -6,40 -6,6"
                         fill="#EDE4CE" stroke="#3A3225" strokeWidth=".8"/>
                {/* front face */}
                <polygon points="0,46 40,46 40,70 0,70" fill="#D4C9AB" stroke="#3A3225" strokeWidth=".8"/>
                <polygon points="40,46 46,40 46,64 40,70" fill="#B8AD8F" stroke="#3A3225" strokeWidth=".8"/>
                {/* LED + ports */}
                <circle cx="8" cy="54" r="2.4" fill={online?'#5ab35a':'#C94A3A'}>
                  {online && <animate attributeName="opacity" values="1;.4;1" dur="2s" repeatCount="indefinite"/>}
                </circle>
                <rect x="16" y="52" width="18" height="2" fill="#3A3225" opacity=".45"/>
                <rect x="16" y="58" width="18" height="2" fill="#3A3225" opacity=".45"/>
                <rect x="16" y="64" width="10" height="2" fill="#3A3225" opacity=".45"/>
              </g>
            </g>
          );
        })()}

        {/* Atmosphere: floating dust / pollen particles */}
        <g opacity=".5" fill="#F4E8C8">
          {Array.from({length:18}).map((_,i)=>{
            const x = (i*71 + 40) % 1200;
            const y = (i*41 + 60) % 320;
            return <circle key={i} cx={x} cy={y} r={1.2}/>;
          })}
        </g>
      </svg>

      {/* Top bar */}
      <div className="scene-topbar">
        <div style={{display:'flex',alignItems:'center',gap:'.75rem'}}>
          <h1>Kultiva</h1>
          <div className="scene-topbar-meta">
            <span className="scene-topbar-ago">Última lectura · fa 2 min</span>
            <span className={`scene-topbar-badge ${online?'':'offline'}`}>{online?'Connectat':'Desconnectat'}</span>
          </div>
        </div>
        <nav className="scene-nav">
          {[{id:'dashboard',l:'Dashboard'},{id:'3d',l:'3D'},{id:'control',l:'Control'},{id:'log',l:'Log'}].map(p=>(
            <a key={p.id} className={p.id==='3d'?'active':''} href="#"
               onClick={e=>{e.preventDefault(); onNavigate(p.id);}}>{p.l}</a>
          ))}
        </nav>
      </div>

      {/* Info panel right */}
      <div className="scene-info-panel">
        {ROWS.map((row, i) => {
          const n = nodes[i] || {};
          const pct = n.humidity_pct;
          const has = pct != null;
          const dot = !has ? 'neutral' : pct < 25 ? 'critical' : pct < 45 ? 'warn' : 'ok';
          const dotLabel = {ok:'OK', warn:'LLINDAR', critical:'BAIX', neutral:'SENSE'}[dot];
          const irr = n.irrigating;
          const irrPct = irr ? Math.min(100, Math.round((n.irrigation_elapsed_min/n.irrigation_total_min)*100)) : 0;
          return (
            <div key={row.id}
                 className={`scene-info-card ${sel===i?'active':''}`}
                 data-row={i}
                 onClick={()=>setSel(i)}>
              <div className="scene-card-header">
                <span className="scene-card-label">{row.badge} — {row.name}</span>
                <span className={`scene-card-dot ${dot}`} title={dotLabel}/>
              </div>
              <div className="scene-card-humidity">{has ? `${pct}%` : '—'}</div>
              {irr && (
                <div className="scene-card-irrigating">
                  <div className="scene-card-progress">
                    <div className="scene-card-progress-bar" style={{width:`${irrPct}%`, background: row.accent}}/>
                  </div>
                  <div className="scene-card-irr-text">Regant {n.irrigation_elapsed_min}/{n.irrigation_total_min} min</div>
                </div>
              )}
              <div className="scene-card-meta">
                <span>{n.battery_v != null ? n.battery_v.toFixed(2)+'V' : '—'}</span>
                <span>{fmtDuration(n.last_seen_s)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className="scene-bottombar">
        <div className="scene-ambient-strip">
          <AmbientMetric value={`${ambient.temperature}°C`} label="Temperatura" spark={[18,19,20,21,22,22.5,23,23.5,23.8,23.5,23.2,23.5]} stroke="#F59E0B"/>
          <AmbientMetric value={`${ambient.humidity}%`}       label="Humitat aire" spark={[72,70,68,65,62,60,58,56,55,57,58,58]} stroke="#3B7A8C"/>
          <AmbientMetric value={fmtLux(ambient.lux)}           label="Llum solar"   spark={[0,0,2000,8000,18000,30000,42000,48000,47000,45200,40000,35000]} stroke="#84CC16"/>
        </div>
        <div className="scene-controls">
          <button className="scene-ctrl-btn" onClick={()=>setSel(-1)}>Reset vista</button>
          <button className="scene-ctrl-btn">Vista zenital</button>
          <button className="scene-ctrl-btn">Mode cinema</button>
        </div>
      </div>
    </div>
  );
}

function DeviceLogPage({ online, lastUpdate, onNavigate }) {
  const logs = [
    { t:'04/18 17:43:22', l:'info',  src:'[sys]', m:'valve F1 OPEN · duration 90min' },
    { t:'04/18 17:43:01', l:'error', src:'[F2]',  m:'timeout after 3 retries' },
    { t:'04/18 17:42:08', l:'warn',  src:'[F3]',  m:'battery 3.32V — low threshold' },
    { t:'04/18 17:42:03', l:'info',  src:'[F1]',  m:'humidity 42% — OK' },
    { t:'04/18 17:41:55', l:'info',  src:'[F4]',  m:'humidity 85% — OK' },
    { t:'04/18 17:30:02', l:'info',  src:'[sys]', m:'reading cycle — 4/4 nodes reported' },
    { t:'04/18 17:29:48', l:'info',  src:'[F1]',  m:'ESP-NOW frame received · RSSI −62dBm' },
    { t:'04/18 17:15:00', l:'info',  src:'[sys]', m:'valve F1 CLOSE · volume ~4.5L' },
    { t:'04/18 17:12:12', l:'warn',  src:'[F2]',  m:'retry 1/3 — no ACK from central' },
    { t:'04/18 17:00:00', l:'info',  src:'[sys]', m:'reading cycle — 4/4 nodes reported' },
    { t:'04/18 16:45:22', l:'info',  src:'[F3]',  m:'humidity 22% — below trigger, scheduled irrigation' },
    { t:'04/18 16:30:00', l:'info',  src:'[sys]', m:'heartbeat · uptime 14d 07h' },
  ];
  const [filter, setFilter] = React.useState('all');
  const [auto, setAuto] = React.useState(true);
  const filtered = filter==='all' ? logs : logs.filter(x => x.l === filter);
  return (
    <>
      <Header activePage="log" online={online} lastUpdate={lastUpdate} onNavigate={onNavigate}/>
      <main className="log-main">
        <div className="log-head">
          <div>
            <h2>Device Log</h2>
            <span className="log-sub">Últimes 100 entrades · Auto-eliminació 24h</span>
          </div>
          <div className="log-head-right">
            <div className="filter-pills">
              {['all','info','warn','error'].map(k => (
                <button key={k} className={`fp ${filter===k?'active':''} ${k}`} onClick={()=>setFilter(k)}>
                  {k==='all'?'Tots':k}
                </button>
              ))}
            </div>
            <label className="auto-label">
              <input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)}/> Auto-refresh 10s
            </label>
            <button className="refresh-btn">↻ Refrescar</button>
          </div>
        </div>
        <div className="log-console">
          {filtered.map((x, i) => (
            <div key={i} className="log-row">
              <span className="log-ts">{x.t}</span>
              <span className={`log-chip ${x.l}`}>{x.l}</span>
              <span className="log-src">{x.src}</span>
              <span className={`log-msg ${x.l}`}>{x.m}</span>
            </div>
          ))}
        </div>
      </main>
      <Footer/>
    </>
  );
}

function AmbientMetric({ value, label, spark, stroke }) {
  // 12h sparkline, 14px tall, 80px wide
  const W = 80, H = 14;
  const min = Math.min(...spark), max = Math.max(...spark);
  const range = max - min || 1;
  const pts = spark.map((v,i)=>{
    const x = (i/(spark.length-1))*W;
    const y = H - ((v-min)/range)*(H-2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  // build area fill
  const area = `0,${H} ${pts} ${W},${H}`;
  return (
    <div className="scene-ambient-item">
      <span className="scene-ambient-value">{value}</span>
      <svg className="scene-ambient-spark" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <polygon points={area} fill={stroke} opacity=".14"/>
        <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={W} cy={H - ((spark[spark.length-1]-min)/range)*(H-2) - 1} r="1.8" fill={stroke}/>
      </svg>
      <span className="scene-ambient-label">{label}</span>
    </div>
  );
}

Object.assign(window, { Scene3DPage, DeviceLogPage, AmbientMetric });