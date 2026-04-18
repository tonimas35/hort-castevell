// Kultiva — Dashboard components

const { useState, useMemo, useRef, useEffect } = React;

const ROWS = [
  { id:1, badge:'F1', name:'Enciams + porros',     accent:'#4E7A48', target:50, ideal:[45,55] },
  { id:2, badge:'F2', name:'Enciams',              accent:'#3B7A8C', target:50, ideal:[45,55] },
  { id:3, badge:'F3', name:'Tomàquets',            accent:'#C4673D', target:40, ideal:[35,50] },
  { id:4, badge:'F4', name:'Pebrots + albergínies',accent:'#8B6A3E', target:55, ideal:[50,65] },
];

function fmtDuration(s){ if(s==null) return '—'; if(s<60) return 'Ara'; if(s<3600) return 'fa '+Math.floor(s/60)+' min'; if(s<86400) return 'fa '+Math.floor(s/3600)+'h'; return 'fa '+Math.floor(s/86400)+'d';}
function fmtLux(l){ if(l==null) return '—'; return l>=1000?(l/1000).toFixed(0)+'k':Math.round(l); }

function KultivaMark(){
  return (
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" fill="#E8EEDA" stroke="#5D7A3B" strokeWidth="1"/>
      <path d="M20 10 C20 10 13 16 13 22 C13 26 16 29 20 29 C24 29 27 26 27 22 C27 16 20 10 20 10Z" fill="#5D7A3B"/>
      <path d="M20 14 C20 14 16 18 16 22 C16 24.5 17.8 26 20 26 C22.2 26 24 24.5 24 22 C24 18 20 14 20 14Z" fill="#8FA65E"/>
      <circle cx="20" cy="23" r="1.2" fill="#FBF9F2"/>
    </svg>
  );
}

function Header({ active='dashboard' }){
  return (
    <header className="kv-header">
      <div className="kv-header-inner">
        <div className="kv-logo">
          <div className="kv-logo-mark"><KultivaMark/></div>
          <div>
            <div className="kv-logo-name">Kultiva</div>
            <div className="kv-logo-sub">Masia · Castevell</div>
          </div>
        </div>
        <div className="kv-header-right">
          <nav className="kv-nav">
            {['Dashboard','Vista 3D','Control','Log'].map((l,i)=>{
              const id = ['dashboard','3d','control','log'][i];
              return <a key={id} href="#" className={active===id?'active':''}>{l}</a>;
            })}
          </nav>
          <div className="kv-last-update">
            <span className="kv-last-label">Última lectura</span>
            <span className="kv-last-label" style={{color:'var(--ink)',fontSize:'11.5px',fontWeight:600}}>fa 2 min · 17:42</span>
          </div>
          <span className="kv-conn-badge"><span className="kv-conn-dot"/>Connectat</span>
        </div>
      </div>
    </header>
  );
}

function HeroMetric({ score, rows, nodes }){
  const [hover, setHover] = useState(null);
  const heroRef = useRef(null);
  const label = score>70? 'Òptim' : score>40? 'Atenció' : 'Crític';
  const labelCls = score>70? '' : score>40? 'warn' : 'critical';

  // 4 concentric rings, radii descending
  const radii = [78, 64, 50, 36]; // outermost = F1
  const compliance = rows.map((r,i)=>{
    const h = nodes[i]?.humidity_pct ?? 0;
    const [lo,hi] = r.ideal;
    if (h>=lo && h<=hi) return 100;
    const dist = h<lo ? lo-h : h-hi;
    return Math.max(0, Math.round(100 - dist*3));
  });

  return (
    <section className="kv-hero" ref={heroRef}>
      <div className="kv-hero-left">
        <div className="kv-hero-score">{score}</div>
        <div className={`kv-hero-label ${labelCls}`}>
          <span className="kv-hero-label-text">Salut del hort</span>
          <span className="kv-hero-label-status">· {label}</span>
        </div>
        <div className="kv-hero-sub">Actualitzat fa 2 minuts · 4 nodes · 12h de dades</div>
      </div>
      <div className="kv-hero-rings">
        <svg viewBox="0 0 180 180">
          {rows.map((r,i)=>{
            const R = radii[i];
            const circ = 2*Math.PI*R;
            const pct = compliance[i];
            const offset = circ - (pct/100)*circ;
            return (
              <g key={r.id} className="kv-ring-group"
                 onMouseEnter={e=>{
                   const rect = heroRef.current.getBoundingClientRect();
                   const cx = e.clientX - rect.left;
                   const cy = e.clientY - rect.top;
                   setHover({i, x:cx, y:cy, pct});
                 }}
                 onMouseLeave={()=>setHover(null)}>
                <circle className="kv-ring-bg" cx="90" cy="90" r={R} strokeWidth="9"/>
                <circle className="kv-ring-fg" cx="90" cy="90" r={R} strokeWidth="9"
                  stroke={r.accent}
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  transform="rotate(-90 90 90)"/>
              </g>
            );
          })}
        </svg>
        {hover && (
          <div className="kv-ring-tooltip visible" style={{left:hover.x, top:hover.y}}>
            <div className="kv-ring-tooltip-badge">{rows[hover.i].badge}</div>
            <div className="kv-ring-tooltip-name">{rows[hover.i].name}</div>
            <div className="kv-ring-tooltip-pct" style={{color:rows[hover.i].accent}}>
              {hover.pct}% <span style={{opacity:.6,fontWeight:400}}>· En rang òptim</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Sparkline({ data, color, height=32 }){
  const W = 200, H = height;
  const min = Math.min(...data), max = Math.max(...data), r = max-min || 1;
  const pts = data.map((v,i)=>{
    const x = (i/(data.length-1))*W;
    const y = H - ((v-min)/r)*(H-4) - 2;
    return [x,y];
  });
  const poly = pts.map(p=>p.join(',')).join(' ');
  const area = `0,${H} ${poly} ${W},${H}`;
  return (
    <svg className="kv-amb-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polygon points={area} fill={color} opacity=".12"/>
      <polyline points={poly} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.5" fill={color}/>
    </svg>
  );
}

function AmbientCard({ icon, iconCls, label, value, unit, delta, deltaDir, deltaLabel, spark, sparkColor, min, max, weekAvg }){
  return (
    <div className="kv-amb-card">
      <div className="kv-amb-top">
        <div className="kv-amb-icon-wrap">{icon}</div>
        <span className="kv-amb-label">{label}</span>
      </div>
      <div>
        <div className="kv-amb-mid">
          <span className="kv-amb-val">{value}<span style={{fontSize:'20px',color:'var(--ink-3)',fontWeight:400,marginLeft:'3px'}}>{unit}</span></span>
          <div style={{display:'flex',flexDirection:'column',gap:'1px'}}>
            <span className={`kv-amb-delta ${deltaDir}`}>{deltaDir==='up'?'↑':'↓'} {delta}</span>
            <span className="kv-amb-delta-label">{deltaLabel}</span>
          </div>
        </div>
        <Sparkline data={spark} color={sparkColor}/>
      </div>
      <div className="kv-amb-expanded">
        <div className="kv-amb-expanded-inner">
          <div className="kv-amb-exp-item"><span className="kv-amb-exp-label">Mín avui</span><span className="kv-amb-exp-val">{min}</span></div>
          <div className="kv-amb-exp-item"><span className="kv-amb-exp-label">Màx avui</span><span className="kv-amb-exp-val">{max}</span></div>
          <div className="kv-amb-exp-item"><span className="kv-amb-exp-label">Mitjana 7d</span><span className="kv-amb-exp-val">{weekAvg}</span></div>
        </div>
      </div>
    </div>
  );
}

function AmbientStrip(){
  const tempSpark = [21.8,21.2,20.8,20.4,20.2,20.5,21.2,22.1,22.8,23.2,23.4,23.5];
  const humSpark =  [72,70,68,65,62,60,58,56,55,57,58,58];
  const luxSpark =  [0,0,2000,8000,18000,30000,42000,48000,47000,45200,40000,35000];
  return (
    <section className="kv-ambient">
      <AmbientCard
        icon={<svg className="kv-amb-icon temp" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z"/><circle cx="11.5" cy="17.5" r="1.5" fill="currentColor"/></svg>}
        label="Temperatura" value="23.5" unit="°C" delta="+1.2°C" deltaDir="up" deltaLabel="vs ahir"
        spark={tempSpark} sparkColor="#D9A341" min="19.8°C" max="24.1°C" weekAvg="22.3°C"/>
      <AmbientCard
        icon={<svg className="kv-amb-icon hum" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>}
        label="Humitat aire" value="58" unit="%" delta="−4%" deltaDir="down" deltaLabel="vs ahir"
        spark={humSpark} sparkColor="#3B7A8C" min="55%" max="74%" weekAvg="63%"/>
      <AmbientCard
        icon={<svg className="kv-amb-icon lux" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>}
        label="Llum solar" value="45" unit="k lux" delta="+8%" deltaDir="up" deltaLabel="vs ahir"
        spark={luxSpark} sparkColor="#5D7A3B" min="0 lux" max="48k lux" weekAvg="32k lux"/>
    </section>
  );
}

function NodeRing({ pct, color, size=128 }){
  const R = 52, C = 2*Math.PI*R;
  const off = C - (pct/100)*C;
  return (
    <svg viewBox="0 0 128 128" width={size} height={size}>
      <circle className="kv-node-ring-track" cx="64" cy="64" r={R} strokeWidth="9"/>
      <circle className="kv-node-ring-fg" cx="64" cy="64" r={R} strokeWidth="9" stroke={color}
              strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 64 64)"/>
    </svg>
  );
}

function Node({ row, node }){
  const pct = node.humidity_pct;
  const has = pct!=null;
  const [lo,hi] = row.ideal;
  const state = node.irrigating ? 'irrigating' : !has ? 'neutral' : pct<lo-10 ? 'critical' : pct<lo ? 'warn' : 'ok';
  const chipLabel = {ok:'Òptim', warn:'Atenció', critical:'Cal regar', irrigating:'Regant', neutral:'Sense senyal'}[state];
  const irrPct = node.irrigating ? Math.round((node.irrigation_elapsed_min/node.irrigation_total_min)*100) : 0;
  return (
    <article className="kv-node" style={{'--node-accent':row.accent}}>
      <div className="kv-node-head">
        <div className="kv-node-title">
          <span className="kv-node-badge">{row.badge}</span>
          <span className="kv-node-name">{row.name}</span>
        </div>
        <span className={`kv-node-chip ${state}`}>{chipLabel}</span>
      </div>
      <div className="kv-node-ring">
        <NodeRing pct={has?pct:0} color={row.accent}/>
        <div className="kv-node-pct">{has?pct:'—'}<span className="kv-node-pct-unit">{has?'%':''}</span></div>
      </div>
      <div className="kv-node-target">Objectiu {row.target}%</div>
      {node.irrigating && (
        <div className="kv-node-irr">
          <div className="kv-node-irr-bar"><div className="kv-node-irr-fill" style={{width:irrPct+'%'}}/></div>
          <div className="kv-node-irr-text">Regant {node.irrigation_elapsed_min}/{node.irrigation_total_min} min</div>
        </div>
      )}
      <div className="kv-node-foot">
        <span className="kv-node-meta-item">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><rect x="2" y="5" width="11" height="7" rx="1"/><path d="M13 7v3"/><rect x="3.5" y="6.5" width="6" height="4" fill="currentColor" stroke="none"/></svg>
          {node.battery_pct}%
        </span>
        <span className="kv-node-meta-item">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2.5 2.5"/></svg>
          {fmtDuration(node.last_seen_s)}
        </span>
        <span className="kv-node-meta-item">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M9 10V3.5a1.5 1.5 0 0 0-3 0V10a3 3 0 1 0 3 0Z"/></svg>
          {node.soil_temp}°C
        </span>
      </div>
      <button className="kv-node-detail-btn">Veure detalls →</button>
    </article>
  );
}

function NodesGrid({ nodes }){
  return (
    <section>
      <div className="kv-section-head">
        <h2 className="kv-section-title">Nodes del hort</h2>
        <span className="kv-section-sub">4 de 4 actius · ESP-NOW</span>
      </div>
      <div className="kv-nodes" style={{marginTop:12}}>
        {ROWS.map((r,i)=> <Node key={r.id} row={r} node={nodes[i]}/>)}
      </div>
    </section>
  );
}

Object.assign(window, { ROWS, fmtDuration, fmtLux, Header, HeroMetric, AmbientStrip, NodesGrid, Sparkline });
