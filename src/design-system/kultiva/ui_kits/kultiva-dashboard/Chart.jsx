// Kultiva — Dashboard: Chart + Activity Feed

const { useState: useStateCh, useMemo: useMemoCh, useRef: useRefCh } = React;

function HumidityChart({ rows }){
  const [period, setPeriod] = useStateCh('24h');
  const [hidden, setHidden] = useStateCh(new Set());
  const [hover, setHover] = useStateCh(null);
  const svgRef = useRefCh(null);

  const series = useMemoCh(()=>{
    // 48 points for 24h (every 30min), 72 for 3d, 168 for 7d
    const N = period==='24h'? 48 : period==='3d'? 72 : 168;
    return rows.map((r,idx)=>{
      const base = [48, 52, 38, 58][idx];
      const amp  = [6, 5, 8, 4][idx];
      const arr = [];
      for (let i=0;i<N;i++){
        const t = i/N;
        let v = base + Math.sin(t*Math.PI*4 + idx)*amp
                     + Math.sin(t*Math.PI*9 + idx*2)*amp*0.4
                     - t*(period==='24h'?4:2);
        // Add irrigation jumps for F3 (idx 2)
        if (idx===2 && period==='24h' && (i===18 || i===38)) v += 12;
        if (idx===0 && period==='24h' && i===10) v += 8;
        v = Math.max(15, Math.min(80, v));
        arr.push(+v.toFixed(1));
      }
      return arr;
    });
  }, [period]);

  const irrigationEvents = useMemoCh(()=>{
    if (period!=='24h') return [{i:18, row:2},{i:38, row:2},{i:10, row:0}];
    return [{i:10, row:0},{i:18, row:2},{i:38, row:2},{i:44, row:0}];
  }, [period]);

  const W = 900, H = 220, PAD = {t:20,r:20,b:32,l:40};
  const plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b;
  const N = series[0].length;
  const ymin = 15, ymax = 80;
  const xScale = i => PAD.l + (i/(N-1))*plotW;
  const yScale = v => PAD.t + (1-(v-ymin)/(ymax-ymin))*plotH;

  // Smooth path using catmull-rom-ish
  const pathFor = (data)=>{
    let d = `M ${xScale(0)} ${yScale(data[0])}`;
    for (let i=1;i<data.length;i++){
      const x0 = xScale(i-1), y0 = yScale(data[i-1]);
      const x1 = xScale(i),   y1 = yScale(data[i]);
      const cx = (x0+x1)/2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  };

  const xLabels = period==='24h'
    ? ['00:00','06:00','12:00','18:00','ara']
    : period==='3d' ? ['dm','dc','dj','ara'] : ['dl','dc','dv','dg','dm','ara'];

  const handleMove = (e)=>{
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W/rect.width);
    if (x < PAD.l || x > W-PAD.r) { setHover(null); return; }
    const i = Math.round(((x-PAD.l)/plotW)*(N-1));
    setHover({i, clientX: e.clientX - rect.left, clientY: e.clientY - rect.top});
  };

  const toggle = (i)=>{
    const s = new Set(hidden);
    if (s.has(i)) s.delete(i); else s.add(i);
    setHidden(s);
  };

  const fmtHover = (i)=>{
    if (period==='24h'){ const h = Math.floor(i/2), m = (i%2)*30; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }
    if (period==='3d') return `dia ${Math.floor(i/24)+1} · ${String(i%24).padStart(2,'0')}:00`;
    return `dia ${Math.floor(i/24)+1} · ${String(i%24).padStart(2,'0')}:00`;
  };

  return (
    <div className="kv-chart-panel">
      <div className="kv-chart-head">
        <div>
          <h2 className="kv-chart-title">Evolució humitat del sòl</h2>
          <div className="kv-chart-legend">
            {rows.map((r,i)=>(
              <span key={r.id} className={`kv-chart-legend-item ${hidden.has(i)?'hidden':''}`} onClick={()=>toggle(i)}>
                <span className="kv-chart-legend-dot" style={{background:r.accent}}/>
                {r.badge} · {r.name}
              </span>
            ))}
            <span className="kv-chart-legend-item" style={{cursor:'default'}}>
              <span className="kv-chart-legend-dot" style={{background:'rgba(93,122,59,.22)',border:'1px dashed rgba(93,122,59,.5)'}}/>
              Zona de confort (40–60%)
            </span>
            <span className="kv-chart-legend-item" style={{cursor:'default'}}>
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 1 C5 1 2 4.5 2 6.5 C2 8.2 3.4 9.5 5 9.5 C6.6 9.5 8 8.2 8 6.5 C8 4.5 5 1 5 1Z" fill="#3B7A8C"/></svg>
              Reg
            </span>
          </div>
        </div>
        <div className="kv-chart-period">
          {['24h','3d','7d'].map(p=>(
            <button key={p} className={period===p?'active':''} onClick={()=>setPeriod(p)}>{p}</button>
          ))}
        </div>
      </div>
      <div className="kv-chart-canvas">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
             onMouseMove={handleMove} onMouseLeave={()=>setHover(null)}>
          {/* Comfort band */}
          <rect x={PAD.l} y={yScale(60)} width={plotW} height={yScale(40)-yScale(60)}
                fill="#5D7A3B" opacity="0.06"/>
          <line x1={PAD.l} y1={yScale(60)} x2={W-PAD.r} y2={yScale(60)} stroke="#5D7A3B" strokeDasharray="2 4" strokeOpacity=".25"/>
          <line x1={PAD.l} y1={yScale(40)} x2={W-PAD.r} y2={yScale(40)} stroke="#5D7A3B" strokeDasharray="2 4" strokeOpacity=".25"/>

          {/* Y axis ticks */}
          {[20,40,60,80].map(v=>(
            <g key={v}>
              <line x1={PAD.l} y1={yScale(v)} x2={W-PAD.r} y2={yScale(v)} stroke="#E7E2D3" strokeWidth="1" opacity={v===40||v===60?0:0.6}/>
              <text x={PAD.l-8} y={yScale(v)+3} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="#8A8579">{v}%</text>
            </g>
          ))}

          {/* X axis labels */}
          {xLabels.map((l,i)=>{
            const x = PAD.l + (i/(xLabels.length-1))*plotW;
            return <text key={l+i} x={x} y={H-10} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="#8A8579">{l}</text>;
          })}

          {/* Series */}
          {rows.map((r,i)=>{
            if (hidden.has(i)) return null;
            return (
              <path key={r.id} d={pathFor(series[i])}
                    fill="none" stroke={r.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
            );
          })}

          {/* Irrigation markers */}
          {irrigationEvents.map((ev,k)=>{
            if (hidden.has(ev.row)) return null;
            const x = xScale(ev.i), y = yScale(series[ev.row][ev.i])-12;
            return (
              <g key={k}>
                <path d={`M ${x} ${y-8} C ${x} ${y-8} ${x-4} ${y-3} ${x-4} ${y+1} C ${x-4} ${y+4} ${x-2} ${y+6} ${x} ${y+6} C ${x+2} ${y+6} ${x+4} ${y+4} ${x+4} ${y+1} C ${x+4} ${y-3} ${x} ${y-8} ${x} ${y-8}Z`}
                      fill="#3B7A8C" opacity=".85"/>
              </g>
            );
          })}

          {/* Hover marker */}
          {hover && (
            <g>
              <line x1={xScale(hover.i)} y1={PAD.t} x2={xScale(hover.i)} y2={H-PAD.b}
                    stroke="#2B2B22" strokeWidth="1" opacity=".15"/>
              {rows.map((r,i)=> hidden.has(i)? null :
                <circle key={r.id} cx={xScale(hover.i)} cy={yScale(series[i][hover.i])} r="4" fill="#FFFEFB" stroke={r.accent} strokeWidth="2"/>
              )}
            </g>
          )}
        </svg>
        {hover && (
          <div className="kv-chart-tooltip visible" style={{left:hover.clientX, top:hover.clientY-20}}>
            <div className="kv-chart-tt-time">{fmtHover(hover.i)}</div>
            {rows.map((r,i)=> hidden.has(i)? null :
              <div key={r.id} className="kv-chart-tt-row">
                <div className="kv-chart-tt-row-left">
                  <span className="kv-chart-tt-dot" style={{background:r.accent}}/>
                  <span>{r.badge}</span>
                </div>
                <span className="kv-chart-tt-val">{series[i][hover.i]}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityFeed(){
  const items = [
    { type:'irrigation', text:<><strong>F3 regada manualment</strong> · 12 min</>, meta:'fa 2h · 15:42' },
    { type:'battery', text:<><strong>Bateria F3 baixa</strong> · 3.71V</>, meta:'fa 5h · 12:30' },
    { type:'success', text:<><strong>F1 reg programat</strong> completat · 8 min</>, meta:'fa 8h · 09:15' },
    { type:'warning', text:<><strong>Sensor F2</strong> sense senyal 3 min · recuperat</>, meta:'fa 12h · 05:28' },
    { type:'success', text:<><strong>F4 reg programat</strong> completat · 6 min</>, meta:'ahir · 19:00' },
    { type:'irrigation', text:<><strong>F1 reg programat</strong> completat · 10 min</>, meta:'ahir · 07:00' },
    { type:'success', text:<><strong>Tots els sensors</strong> reportant normalment</>, meta:'ahir · 06:45' },
  ];
  const icons = {
    irrigation: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2 C8 2 4 6 4 9.5 C4 12 5.8 13.8 8 13.8 C10.2 13.8 12 12 12 9.5 C12 6 8 2 8 2Z"/></svg>,
    battery: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="11" height="7" rx="1"/><path d="M13 7v3"/><rect x="3.5" y="6.5" width="3" height="4" fill="currentColor" stroke="none"/></svg>,
    success: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l3 3 6-6"/></svg>,
    warning: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2 L14 13 L2 13 Z"/><path d="M8 7v3M8 11.5v.5"/></svg>,
  };
  return (
    <div className="kv-activity">
      <div className="kv-activity-head">
        <h2 className="kv-activity-title">Activitat recent</h2>
        <span className="kv-activity-count">24h</span>
      </div>
      <div className="kv-timeline">
        {items.map((it,i)=>(
          <div key={i} className="kv-tl-item">
            <div className={`kv-tl-icon ${it.type}`}>{icons[it.type]}</div>
            <div className="kv-tl-body">
              <div className="kv-tl-text">{it.text}</div>
              <div className="kv-tl-meta">{it.meta}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="kv-activity-foot">
        <button className="kv-activity-more">Veure historial complet →</button>
      </div>
    </div>
  );
}

function BottomSection({ rows }){
  return (
    <section className="kv-bottom">
      <HumidityChart rows={rows}/>
      <ActivityFeed/>
    </section>
  );
}

Object.assign(window, { HumidityChart, ActivityFeed, BottomSection });
