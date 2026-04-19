// Kultiva — Dashboard Mobile components

const { useState: useStateM, useRef: useRefM, useEffect: useEffectM, useMemo: useMemoM } = React;

function MKultivaMark(){
  return (
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" fill="#E8EEDA" stroke="#5D7A3B" strokeWidth="1"/>
      <path d="M20 10 C20 10 13 16 13 22 C13 26 16 29 20 29 C24 29 27 26 27 22 C27 16 20 10 20 10Z" fill="#5D7A3B"/>
      <path d="M20 14 C20 14 16 18 16 22 C16 24.5 17.8 26 20 26 C22.2 26 24 24.5 24 22 C24 18 20 14 20 14Z" fill="#8FA65E"/>
      <circle cx="20" cy="23" r="1.2" fill="#FBF9F2"/>
    </svg>
  );
}

function MHeader(){
  return (
    <header className="m-header">
      <div className="m-header-row1">
        <div className="m-logo">
          <div className="m-logo-mark"><MKultivaMark/></div>
          <div>
            <div className="m-logo-name">Kultiva</div>
            <div className="m-logo-sub">Masia · Castevell</div>
          </div>
        </div>
        <span className="m-conn"><span className="m-conn-dot"/>fa 2m</span>
      </div>
      <nav className="m-tabs">
        {[['dashboard','Dashboard'],['3d','Vista 3D'],['control','Control'],['log','Log']].map(([id,l])=>(
          <a key={id} href="#" className={id==='dashboard'?'active':''}>{l}</a>
        ))}
      </nav>
    </header>
  );
}

const M_ROWS = [
  { id:1, badge:'F1', name:'Enciams + porros',     accent:'#4E7A48', target:50, ideal:[45,55] },
  { id:2, badge:'F2', name:'Enciams',              accent:'#3B7A8C', target:50, ideal:[45,55] },
  { id:3, badge:'F3', name:'Tomàquets',            accent:'#C4673D', target:40, ideal:[35,50] },
  { id:4, badge:'F4', name:'Pebrots + albergínies',accent:'#8B6A3E', target:55, ideal:[50,65] },
];

function mFmtDuration(s){ if(s==null) return '—'; if(s<60) return 'ara'; if(s<3600) return 'fa '+Math.floor(s/60)+'m'; if(s<86400) return 'fa '+Math.floor(s/3600)+'h'; return 'fa '+Math.floor(s/86400)+'d';}

function MRing({ pct, color, size=64, r=26, sw=6 }){
  const C = 2*Math.PI*r;
  const off = C - (pct/100)*C;
  return (
    <svg viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(43,43,34,.08)" strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
              strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off}
              transform={`rotate(-90 ${size/2} ${size/2})`}/>
    </svg>
  );
}

function MHero({ score, nodes }){
  const label = score>70 ? 'Òptim' : score>40 ? 'Atenció' : 'Crític';
  const cls = score>70 ? '' : score>40 ? 'warn' : 'critical';
  const compliance = M_ROWS.map((r,i)=>{
    const h = nodes[i].humidity_pct; const [lo,hi] = r.ideal;
    if (h>=lo && h<=hi) return 100;
    const dist = h<lo ? lo-h : h-hi;
    return Math.max(0, Math.round(100 - dist*3));
  });
  return (
    <section className="m-hero">
      <div className="m-hero-top">
        <div className="m-hero-score">{score}</div>
        <div className={`m-hero-label ${cls}`}>
          Salut del hort <span className="m-hero-label-status">· {label}</span>
        </div>
        <div className="m-hero-sub">Actualitzat fa 2 minuts</div>
      </div>
      <div className="m-hero-rings">
        {M_ROWS.map((r,i)=>(
          <div key={r.id} className="m-hero-ring">
            <div className="m-hero-ring-svg">
              <MRing pct={compliance[i]} color={r.accent}/>
              <div className="m-hero-ring-pct">{compliance[i]}</div>
            </div>
            <div className="m-hero-ring-badge" style={{color:r.accent}}>{r.badge}</div>
            <div className="m-hero-ring-name">{r.name.split(' + ')[0]}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MSpark({ data, color }){
  const W = 140, H = 22;
  const min = Math.min(...data), max = Math.max(...data), r = max-min || 1;
  const pts = data.map((v,i)=>[ (i/(data.length-1))*W, H - ((v-min)/r)*(H-3) - 1.5 ]);
  const poly = pts.map(p=>p.join(',')).join(' ');
  const area = `0,${H} ${poly} ${W},${H}`;
  return (
    <svg className="m-amb-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polygon points={area} fill={color} opacity=".12"/>
      <polyline points={poly} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MAmbientStrip(){
  const cards = [
    { iconCls:'temp', label:'Temperatura', val:'23.5', unit:'°C', delta:'↑ +1.2°C', dir:'up',
      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z"/><circle cx="11.5" cy="17.5" r="1.5" fill="currentColor"/></svg>,
      spark:[21.8,21.2,20.8,20.4,20.2,20.5,21.2,22.1,22.8,23.2,23.4,23.5], sparkColor:'#D9A341' },
    { iconCls:'hum', label:'Humitat aire', val:'58', unit:'%', delta:'↓ −4%', dir:'down',
      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
      spark:[72,70,68,65,62,60,58,56,55,57,58,58], sparkColor:'#3B7A8C' },
    { iconCls:'lux', label:'Llum solar', val:'45', unit:'k lux', delta:'↑ +8%', dir:'up',
      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>,
      spark:[0,0,2000,8000,18000,30000,42000,48000,47000,45200,40000,35000], sparkColor:'#5D7A3B' },
  ];
  return (
    <section className="m-ambient">
      {cards.map((c,i)=>(
        <div key={i} className="m-amb">
          <div className="m-amb-top">
            <div className={`m-amb-icon ${c.iconCls}`}>{c.icon}</div>
            <span className="m-amb-label">{c.label}</span>
          </div>
          <div>
            <span className="m-amb-val">{c.val}<span className="m-amb-val-unit">{c.unit}</span></span>
          </div>
          <span className={`m-amb-delta ${c.dir}`}>{c.delta}</span>
          <MSpark data={c.spark} color={c.sparkColor}/>
        </div>
      ))}
    </section>
  );
}

function MNode({ row, node }){
  const pct = node.humidity_pct;
  const [lo,hi] = row.ideal;
  const state = node.irrigating ? 'irrigating' : pct<lo-10 ? 'critical' : pct<lo ? 'warn' : 'ok';
  const chipLabel = {ok:'Òptim', warn:'Atenció', critical:'Cal regar', irrigating:'Regant'}[state];
  const irrPct = node.irrigating ? Math.round((node.irrigation_elapsed_min/node.irrigation_total_min)*100) : 0;
  return (
    <article className="m-node" style={{'--node-accent':row.accent}}>
      <div className="m-node-ring">
        <MRing pct={pct} color={row.accent} size={80} r={33} sw={7}/>
        <div className="m-node-ring-pct">{pct}<span className="m-node-ring-pct-unit">%</span></div>
      </div>
      <div className="m-node-body">
        <div className="m-node-head">
          <div className="m-node-title">
            <span className="m-node-badge">{row.badge}</span>
            <span className="m-node-name">{row.name}</span>
          </div>
          <span className={`m-node-chip ${state}`}>{chipLabel}</span>
        </div>
        <div className="m-node-target">Objectiu {row.target}%</div>
        <div className="m-node-meta">
          <span className="m-node-meta-item">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><rect x="2" y="5" width="11" height="7" rx="1"/><path d="M13 7v3"/></svg>
            {node.battery_pct}%
          </span>
          <span className="m-node-meta-item">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2.5 2.5"/></svg>
            {mFmtDuration(node.last_seen_s)}
          </span>
          <span className="m-node-meta-item">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M9 10V3.5a1.5 1.5 0 0 0-3 0V10a3 3 0 1 0 3 0Z"/></svg>
            {node.soil_temp}°C
          </span>
        </div>
        {node.irrigating && (
          <div className="m-node-irr">
            <div className="m-node-irr-bar"><div className="m-node-irr-fill" style={{width:irrPct+'%'}}/></div>
            <div className="m-node-irr-text">Regant {node.irrigation_elapsed_min}/{node.irrigation_total_min} min</div>
          </div>
        )}
      </div>
    </article>
  );
}

function MChart({ rows, period, setPeriod, hidden, toggle }){
  const series = useMemoM(()=>{
    const N = period==='24h' ? 48 : period==='3d' ? 72 : 168;
    return rows.map((r,idx)=>{
      const base = [48,52,38,58][idx];
      const amp  = [6,5,8,4][idx];
      const arr = [];
      for (let i=0;i<N;i++){
        const t = i/N;
        let v = base + Math.sin(t*Math.PI*4 + idx)*amp
                     + Math.sin(t*Math.PI*9 + idx*2)*amp*.4
                     - t*(period==='24h'?4:2);
        if (idx===2 && period==='24h' && (i===18||i===38)) v += 12;
        if (idx===0 && period==='24h' && i===10) v += 8;
        arr.push(Math.max(15, Math.min(80, +v.toFixed(1))));
      }
      return arr;
    });
  }, [period]);

  const W=340, H=180, PAD={t:16,r:14,b:22,l:30};
  const plotW=W-PAD.l-PAD.r, plotH=H-PAD.t-PAD.b;
  const N = series[0].length;
  const ymin=15, ymax=80;
  const xScale=i=> PAD.l + (i/(N-1))*plotW;
  const yScale=v=> PAD.t + (1-(v-ymin)/(ymax-ymin))*plotH;
  const pathFor=(d)=>{
    let p=`M ${xScale(0)} ${yScale(d[0])}`;
    for(let i=1;i<d.length;i++){
      const x0=xScale(i-1),y0=yScale(d[i-1]),x1=xScale(i),y1=yScale(d[i]);
      const cx=(x0+x1)/2;
      p += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    return p;
  };
  const xL = period==='24h' ? ['00','06','12','18','ara'] : period==='3d' ? ['dm','dc','dj','ara'] : ['dl','dc','dv','dg','ara'];
  const irr = period==='24h' ? [{i:10,row:0},{i:18,row:2},{i:38,row:2}] : [];

  return (
    <div className="m-chart">
      <div className="m-chart-head">
        <h2 className="m-chart-title">Humitat del sòl</h2>
        <div className="m-chart-period">
          {['24h','3d','7d'].map(p=>(
            <button key={p} className={period===p?'active':''} onClick={()=>setPeriod(p)}>{p}</button>
          ))}
        </div>
      </div>
      <div className="m-chart-legend">
        {rows.map((r,i)=>(
          <span key={r.id} className={`m-chart-legend-item ${hidden.has(i)?'hidden':''}`} onClick={()=>toggle(i)}>
            <span className="m-chart-legend-dot" style={{background:r.accent}}/>
            {r.badge}
          </span>
        ))}
      </div>
      <div className="m-chart-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{width:'100%',height:'100%',display:'block'}}>
          <rect x={PAD.l} y={yScale(60)} width={plotW} height={yScale(40)-yScale(60)} fill="#5D7A3B" opacity=".06"/>
          {[20,40,60,80].map(v=>(
            <g key={v}>
              <line x1={PAD.l} y1={yScale(v)} x2={W-PAD.r} y2={yScale(v)} stroke="#E7E2D3" opacity={v===40||v===60?0:.5}/>
              <text x={PAD.l-6} y={yScale(v)+3} textAnchor="end" fontSize="9" fontFamily="monospace" fill="#8A8579">{v}%</text>
            </g>
          ))}
          {xL.map((l,i)=>{
            const x = PAD.l + (i/(xL.length-1))*plotW;
            return <text key={l+i} x={x} y={H-6} textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#8A8579">{l}</text>;
          })}
          {rows.map((r,i)=> hidden.has(i) ? null : (
            <path key={r.id} d={pathFor(series[i])} fill="none" stroke={r.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity=".9"/>
          ))}
          {irr.map((e,k)=> hidden.has(e.row) ? null : (() => {
            const x = xScale(e.i), y = yScale(series[e.row][e.i]) - 9;
            return <path key={k} d={`M ${x} ${y-5} C ${x} ${y-5} ${x-3} ${y-1} ${x-3} ${y+1.5} C ${x-3} ${y+3.5} ${x-1.5} ${y+5} ${x} ${y+5} C ${x+1.5} ${y+5} ${x+3} ${y+3.5} ${x+3} ${y+1.5} C ${x+3} ${y-1} ${x} ${y-5} ${x} ${y-5}Z`} fill="#3B7A8C" opacity=".85"/>;
          })())}
        </svg>
      </div>
    </div>
  );
}

function MActivityDrawer({ open, onClose }){
  const items = [
    { type:'irrigation', text:<><strong>F3 regada manualment</strong> · 12 min</>, meta:'fa 2h · 15:42' },
    { type:'battery',    text:<><strong>Bateria F3 baixa</strong> · 3.71V</>, meta:'fa 5h · 12:30' },
    { type:'success',    text:<><strong>F1 reg programat</strong> completat</>, meta:'fa 8h · 09:15' },
    { type:'warning',    text:<><strong>Sensor F2</strong> sense senyal · recuperat</>, meta:'fa 12h · 05:28' },
    { type:'success',    text:<><strong>F4 reg programat</strong> completat</>, meta:'ahir · 19:00' },
    { type:'irrigation', text:<><strong>F1 reg programat</strong> completat</>, meta:'ahir · 07:00' },
    { type:'success',    text:<><strong>Tots els sensors</strong> OK</>, meta:'ahir · 06:45' },
  ];
  const icons = {
    irrigation: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2 C8 2 4 6 4 9.5 C4 12 5.8 13.8 8 13.8 C10.2 13.8 12 12 12 9.5 C12 6 8 2 8 2Z"/></svg>,
    battery: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="11" height="7" rx="1"/><path d="M13 7v3"/><rect x="3.5" y="6.5" width="3" height="4" fill="currentColor" stroke="none"/></svg>,
    success: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l3 3 6-6"/></svg>,
    warning: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2 L14 13 L2 13 Z"/><path d="M8 7v3M8 11.5v.5"/></svg>,
  };
  return (
    <>
      <div className={`m-drawer-bg ${open?'open':''}`} onClick={onClose}/>
      <div className={`m-drawer ${open?'open':''}`}>
        <div className="m-drawer-grab"/>
        <div className="m-drawer-head">
          <h2 className="m-drawer-title">Activitat recent</h2>
          <button className="m-drawer-close" onClick={onClose} aria-label="Tancar">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>
          </button>
        </div>
        <div className="m-drawer-body">
          {items.map((it,i)=>(
            <div key={i} className="m-tl-item">
              <div className={`m-tl-icon ${it.type}`}>{icons[it.type]}</div>
              <div>
                <div className="m-tl-text">{it.text}</div>
                <div className="m-tl-meta">{it.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function MApp(){
  const nodesData = [
    { humidity_pct:52, battery_pct:92, last_seen_s:120, soil_temp:21.4, irrigating:false },
    { humidity_pct:48, battery_pct:88, last_seen_s:180, soil_temp:21.8, irrigating:false },
    { humidity_pct:42, battery_pct:64, last_seen_s:60,  soil_temp:23.1, irrigating:true, irrigation_elapsed_min:4, irrigation_total_min:12 },
    { humidity_pct:58, battery_pct:81, last_seen_s:240, soil_temp:22.0, irrigating:false },
  ];
  const score = useMemoM(()=>{
    const s = M_ROWS.map((r,i)=>{
      const h = nodesData[i].humidity_pct; const [lo,hi]=r.ideal;
      if (h>=lo && h<=hi) return 100;
      const d = h<lo?lo-h:h-hi;
      return Math.max(0, 100 - d*3);
    });
    return Math.round(s.reduce((a,b)=>a+b,0)/s.length);
  },[]);
  const [period, setPeriod] = useStateM('24h');
  const [hidden, setHidden] = useStateM(new Set());
  const [drawer, setDrawer] = useStateM(false);
  const toggle = (i)=>{ const s = new Set(hidden); s.has(i)?s.delete(i):s.add(i); setHidden(s); };

  return (
    <>
      <MHeader/>
      <main className="m-main">
        <MHero score={score} nodes={nodesData}/>
        <MAmbientStrip/>
        <h2 className="m-section-title">Nodes del hort</h2>
        <div className="m-nodes">
          {M_ROWS.map((r,i)=> <MNode key={r.id} row={r} node={nodesData[i]}/>)}
        </div>
        <MChart rows={M_ROWS} period={period} setPeriod={setPeriod} hidden={hidden} toggle={toggle}/>
      </main>
      <button className="m-act-trigger" onClick={()=>setDrawer(true)}>
        <span className="m-act-trigger-left">
          <span className="m-act-trigger-count">4</span>
          Activitat recent
        </span>
        <svg className="m-act-trigger-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 3l4 4-4 4"/></svg>
      </button>
      <MActivityDrawer open={drawer} onClose={()=>setDrawer(false)}/>
    </>
  );
}

Object.assign(window, { MApp });
