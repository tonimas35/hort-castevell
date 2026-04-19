// Kultiva — Device Log (Mobile)

const { useState: useSM, useRef: useRM, useMemo: useMM, useEffect: useEM } = React;

function lmSrcClass(s){ return s.toLowerCase().replace(/_/g,'-'); }

function LmHeader(){
  return (
    <header className="lm-header">
      <div className="lm-header-row1">
        <div className="lm-logo">
          <div className="lm-logo-mark">
            <svg viewBox="0 0 40 40" width="28" height="28" fill="none">
              <circle cx="20" cy="20" r="19" fill="#E8EEDA" stroke="#5D7A3B"/>
              <path d="M20 10 C20 10 13 16 13 22 C13 26 16 29 20 29 C24 29 27 26 27 22 C27 16 20 10 20 10Z" fill="#5D7A3B"/>
              <path d="M20 14 C20 14 16 18 16 22 C16 24.5 17.8 26 20 26 C22.2 26 24 24.5 24 22 C24 18 20 14 20 14Z" fill="#8FA65E"/>
            </svg>
          </div>
          <div>
            <div className="lm-logo-name">Kultiva</div>
            <div className="lm-logo-sub">Masia · Castevell</div>
          </div>
        </div>
        <span className="lm-conn"><span className="lm-conn-dot"/>CONNECTAT</span>
      </div>
      <nav className="lm-tabs">
        {[['dashboard','Dashboard'],['3d','Vista 3D'],['control','Control'],['log','Log']].map(([id,l])=>(
          <a key={id} href="#" className={id==='log'?'active':''}>{l}</a>
        ))}
      </nav>
    </header>
  );
}

function LmFilters({filter, setFilter, counts, onSearch, auto, setAuto}){
  return (
    <div className="lm-filters">
      <div className="lm-filter-scroll">
        <button className={`lm-pill all ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>
          <span>Tots</span><span className="lm-pill-count">{counts.all}</span>
        </button>
        <button className={`lm-pill info ${filter==='info'?'active':''}`} onClick={()=>setFilter('info')}>
          <span className="lm-pill-ic"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4"/><circle cx="6" cy="3.5" r=".9" fill="currentColor"/><path d="M6 5.5v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg></span>
          <span>Info</span><span className="lm-pill-count">{counts.info}</span>
        </button>
        <button className={`lm-pill warn ${filter==='warn'?'active':''}`} onClick={()=>setFilter('warn')}>
          <span className="lm-pill-ic"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1l5.2 9H.8L6 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 4.5v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="6" cy="8.4" r=".7" fill="currentColor"/></svg></span>
          <span>Warning</span><span className="lm-pill-count">{counts.warn}</span>
        </button>
        <button className={`lm-pill err ${filter==='err'?'active':''}`} onClick={()=>setFilter('err')}>
          <span className="lm-pill-ic"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 4l4 4M8 4l-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></span>
          <span>Error</span><span className="lm-pill-count">{counts.err}</span>
        </button>
      </div>
      <div className="lm-filter-row2">
        <button className="lm-search-btn" onClick={onSearch}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9.2 9.2l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <span>Cercar logs…</span>
        </button>
        <button className={`lm-ar-btn ${auto?'on':''}`} onClick={()=>setAuto(!auto)}>
          <span className={`lm-ar-spin ${auto?'':'off'}`}/>
          <span>Auto</span>
        </button>
      </div>
    </div>
  );
}

function lmHighlight(text, q){
  if (!q) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'ig'));
  return parts.map((p,i)=> p.toLowerCase()===q.toLowerCase() ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>);
}

function LmRow({log, onOpen, fresh, query}){
  const short = log.tsStr.slice(11,23); // HH:MM:SS.mmm
  return (
    <div className={`lm-row ${log.level} ${fresh?'fresh':''}`} onClick={onOpen}>
      <div className="lm-row-sev"/>
      <div className="lm-row-body">
        <div className="lm-row-meta">
          <span className="lm-row-ts">{short}</span>
          <span className={`lm-src-inline ${lmSrcClass(log.source)}`}>{log.source}</span>
          <span className="lm-row-lvl">{log.level==='info'?'INF':log.level==='warn'?'WRN':'ERR'}</span>
        </div>
        <div className="lm-row-msg">{lmHighlight(log.message, query)}</div>
      </div>
      <div className="lm-row-chev">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
    </div>
  );
}

function LmJson({data}){
  const html = useMM(()=>{
    const s = JSON.stringify(data, null, 2);
    return s
      .replace(/("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")\s*:/g, '<span class="k">$1</span>:')
      .replace(/:\s*("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")/g, ': <span class="s">$1</span>')
      .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="n">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="b">$1</span>');
  },[data]);
  return <pre className="lm-json" dangerouslySetInnerHTML={{__html: html}}/>;
}

function LmPayloadSheet({log, open, onClose}){
  return (
    <div className={`lm-payload-sheet ${open?'open':''}`}>
      {log && (
        <>
          <div className="lm-payload-head">
            <div className="lm-payload-meta">
              <div className="lm-payload-meta-top">
                <span className={`lm-src-inline ${lmSrcClass(log.source)}`}>{log.source}</span>
                <span>{log.level==='info'?'INF':log.level==='warn'?'WRN':'ERR'}</span>
                <span>{log.tsStr}</span>
              </div>
              <div className="lm-payload-meta-msg">{log.message}</div>
            </div>
            <button className="lm-payload-close" onClick={onClose}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l10 10M16 6l-10 10"/></svg>
            </button>
          </div>
          <div className="lm-payload-body">
            <div className="lm-payload-body-title">
              <span>Payload · #{log.id}</span>
              <button className="lm-payload-copy" onClick={()=>navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(log.payload,null,2))}>Copiar JSON</button>
            </div>
            <LmJson data={log.payload}/>
          </div>
        </>
      )}
    </div>
  );
}

function LmSearchModal({open, onClose, query, setQuery}){
  const ref = useRM(null);
  useEM(()=>{ if (open) setTimeout(()=>ref.current?.focus(), 280); },[open]);
  return (
    <div className={`lm-search-modal ${open?'open':''}`}>
      <div className="lm-search-modal-head">
        <div className="lm-search-modal-input">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="#8A8579" strokeWidth="1.4"/><path d="M9.2 9.2l3 3" stroke="#8A8579" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <input ref={ref} placeholder="Missatge, node o source…" value={query} onChange={e=>setQuery(e.target.value)}/>
          {query && <button onClick={()=>setQuery('')} style={{color:'#8A8579'}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M5 5l4 4M9 5l-4 4"/></svg>
          </button>}
        </div>
        <button className="lm-search-modal-cancel" onClick={onClose}>OK</button>
      </div>
      <div className="lm-search-hint">
        <div>Escriu una paraula clau: <strong>"timeout"</strong>, <strong>"F3"</strong>, <strong>"bateria"</strong>…</div>
        <div style={{marginTop:12, color:'#8A8579'}}>La cerca mira missatge, node i source simultàniament.</div>
      </div>
    </div>
  );
}

/* Stats drawer */
function LmChart24({logs}){
  const buckets = useMM(()=>{
    const end = new Date('2026-04-19T15:00:00');
    const arr = Array.from({length:24}, ()=>({info:0,warn:0,err:0}));
    logs.forEach(l=>{
      const diffH = Math.floor((end - l.ts)/(60*60*1000));
      const idx = 23 - diffH;
      if (idx>=0 && idx<24) arr[idx][l.level]++;
    });
    return arr;
  },[logs]);
  const max = Math.max(1, ...buckets.map(b=>b.info+b.warn+b.err));
  return (
    <div className="lm-card">
      <div className="lm-card-title">Últimes 24h<span className="lm-card-title-sub">{logs.length} esdeveniments</span></div>
      <div className="lm-chart24">
        {buckets.map((b,i)=>(
          <div key={i} className="lm-chart24-col">
            {b.err>0 && <div className="lm-chart24-seg err" style={{height:`${(b.err/max)*100}%`}}/>}
            {b.warn>0 && <div className="lm-chart24-seg warn" style={{height:`${(b.warn/max)*100}%`}}/>}
            {b.info>0 && <div className="lm-chart24-seg info" style={{height:`${(b.info/max)*100}%`}}/>}
          </div>
        ))}
      </div>
      <div className="lm-chart24-labels"><span>15h ahir</span><span>00h</span><span>07h</span><span>14h</span></div>
    </div>
  );
}

function LmSevBars({logs}){
  const c = { info: logs.filter(l=>l.level==='info').length, warn: logs.filter(l=>l.level==='warn').length, err: logs.filter(l=>l.level==='err').length };
  const t = c.info+c.warn+c.err || 1;
  const rows = [
    {k:'info',label:'Info',count:c.info,pct:c.info/t*100,delta:'−8 vs ahir',dir:'down'},
    {k:'warn',label:'Warning',count:c.warn,pct:c.warn/t*100,delta:'−12 vs ahir',dir:'down'},
    {k:'err',label:'Error',count:c.err,pct:c.err/t*100,delta:'+3 vs ahir',dir:'up'},
  ];
  return (
    <div className="lm-card">
      <div className="lm-card-title">Per severity<span className="lm-card-title-sub">24h</span></div>
      <div className="lm-sev-list">
        {rows.map(r=>(
          <div key={r.k} className="lm-sev-row">
            <div className="lm-sev-head">
              <span className="lm-sev-head-left"><span className={`lm-sev-head-dot ${r.k}`}/>{r.label}</span>
              <span className="lm-sev-head-num">{r.count} <span style={{color:'var(--ink-3)',fontWeight:400}}>· {r.pct.toFixed(0)}%</span></span>
            </div>
            <div className="lm-sev-bar-wrap"><div className={`lm-sev-bar ${r.k}`} style={{width:`${r.pct}%`}}/></div>
            <span className={`lm-sev-delta ${r.dir}`}>{r.delta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LmSources({logs}){
  const srcs = useMM(()=>{
    const map = new Map();
    logs.forEach(l=>{ if (!map.has(l.source)) map.set(l.source,0); map.set(l.source, map.get(l.source)+1); });
    return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);
  },[logs]);
  return (
    <div className="lm-card">
      <div className="lm-card-title">Per source<span className="lm-card-title-sub">top 5</span></div>
      <div className="lm-src-list">
        {srcs.map(([src,count])=>(
          <div key={src} className="lm-src-row">
            <span className={`lm-src-inline ${lmSrcClass(src)}`}>{src}</span>
            <div/>
            <span className="lm-src-row-num">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LmStatsDrawer({open, onClose, logs}){
  return (
    <>
      <div className={`lm-backdrop ${open?'open':''}`} onClick={onClose}/>
      <div className={`lm-drawer ${open?'open':''}`}>
        <div className="lm-drawer-handle"/>
        <div className="lm-drawer-title">
          <span>Estadístiques</span>
          <span className="lm-drawer-title-sub">24h</span>
        </div>
        <LmChart24 logs={logs}/>
        <LmSevBars logs={logs}/>
        <LmSources logs={logs}/>
        <button className="lm-dl">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2v8M4 7l3 3 3-3"/><path d="M2.5 12h9"/></svg>
          <span>Descarregar logs</span>
        </button>
      </div>
    </>
  );
}

function LmApp(){
  const [allLogs, setAllLogs] = useSM(window.LG_MOCK);
  const [filter, setFilter] = useSM('all');
  const [query, setQuery] = useSM('');
  const [auto, setAuto] = useSM(true);
  const [searchOpen, setSearchOpen] = useSM(false);
  const [statsOpen, setStatsOpen] = useSM(false);
  const [payload, setPayload] = useSM(null);
  const [freshIds, setFreshIds] = useSM(new Set());

  const counts = useMM(()=>({
    all: allLogs.length,
    info: allLogs.filter(l=>l.level==='info').length,
    warn: allLogs.filter(l=>l.level==='warn').length,
    err:  allLogs.filter(l=>l.level==='err').length,
  }),[allLogs]);

  const filtered = useMM(()=>{
    return allLogs.filter(l=>{
      if (filter!=='all' && l.level!==filter) return false;
      if (query){
        const q = query.toLowerCase();
        if (!l.message.toLowerCase().includes(q) && !l.source.toLowerCase().includes(q) && !l.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  },[allLogs, filter, query]);

  useEM(()=>{
    if (!auto) return;
    const iv = setInterval(()=>{
      const tpls = [
        {level:'info', src:'CENTRAL', msg:'Heartbeat: tots els nodes responen (4/4)', pl:{nodes:{F1:'ok',F2:'ok',F3:'ok',F4:'ok'}}},
        {level:'info', src:'ESP32-F2', msg:`Lectura periòdica: humitat=${50+Math.floor(Math.random()*12)}%, temp=21°C, bateria=78%`, pl:{humidity:55,temp:21,battery:78}},
        {level:'warn', src:'ESP32-F3', msg:'Latència alta: 185ms (esperat <100ms)', pl:{latency_ms:185,threshold:100}},
      ];
      const tpl = tpls[Math.floor(Math.random()*tpls.length)];
      const now = new Date();
      const pad = (n,l=2)=>String(n).padStart(l,'0');
      const tsStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(),3)}`;
      const id = `log_${Math.floor(Math.random()*9000+2000)}`;
      setAllLogs(prev=>[{id,ts:now,tsStr,level:tpl.level,source:tpl.src,message:tpl.msg,payload:tpl.pl},...prev]);
      setFreshIds(prev=>{ const n=new Set(prev); n.add(id); return n; });
      setTimeout(()=>setFreshIds(prev=>{ const n=new Set(prev); n.delete(id); return n; }), 800);
    }, 10000);
    return ()=>clearInterval(iv);
  },[auto]);

  return (
    <>
      <LmHeader/>
      <div className="lm-page">
        <h1 className="lm-page-title">Device Log</h1>
        <span className="lm-page-sub">{filtered.length}/{allLogs.length}</span>
      </div>
      <LmFilters filter={filter} setFilter={setFilter} counts={counts} onSearch={()=>setSearchOpen(true)} auto={auto} setAuto={setAuto}/>
      <div className="lm-console">
        <div className="lm-console-head">
          <span className="lm-console-title">device.log</span>
          <span>{filtered.length} entrades</span>
        </div>
        <div className="lm-console-body">
          {filtered.length === 0 ? (
            <div className="lm-empty">
              <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
                <circle cx="34" cy="34" r="22" stroke="#B8B19C" strokeWidth="2"/>
                <path d="M50 50 L64 64" stroke="#B8B19C" strokeWidth="2" strokeLinecap="round"/>
                <path d="M34 28 C34 28 28 34 28 40 C28 43 30.5 45 34 45 C37.5 45 40 43 40 40 C40 34 34 28 34 28Z" fill="#A8BE6C" opacity=".55"/>
              </svg>
              <div className="lm-empty-text">Cap log coincideix</div>
              <div className="lm-empty-sub">Prova a netejar els filtres</div>
              <button className="lm-empty-btn" onClick={()=>{setFilter('all');setQuery('');}}>Netejar filtres</button>
            </div>
          ) : filtered.map(l=>(
            <LmRow key={l.id} log={l} onOpen={()=>setPayload(l)} fresh={freshIds.has(l.id)} query={query}/>
          ))}
        </div>
      </div>

      <button className="lm-stats-fab" onClick={()=>setStatsOpen(true)}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 12h10M3.5 9v3M6.5 5v7M9.5 7v5M12 2v10"/></svg>
        <span>Estadístiques</span>
        <span className="lm-stats-fab-badge">{counts.err}</span>
      </button>

      <LmSearchModal open={searchOpen} onClose={()=>setSearchOpen(false)} query={query} setQuery={setQuery}/>
      <LmStatsDrawer open={statsOpen} onClose={()=>setStatsOpen(false)} logs={allLogs}/>
      <LmPayloadSheet log={payload} open={!!payload} onClose={()=>setPayload(null)}/>
    </>
  );
}

Object.assign(window, { LmApp });
