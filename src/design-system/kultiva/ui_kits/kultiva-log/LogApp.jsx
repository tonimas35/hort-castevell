// Kultiva — Device Log (Desktop)

const { useState, useRef, useMemo, useEffect, useCallback } = React;

function lgSrcClass(s){ return s.toLowerCase().replace(/_/g,'-'); }

function LgHeader(){
  return (
    <header className="kv-header">
      <div className="kv-header-inner">
        <a className="kv-logo" href="#">
          <div className="kv-logo-mark">
            <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
              <circle cx="20" cy="20" r="19" fill="#E8EEDA" stroke="#5D7A3B"/>
              <path d="M20 10 C20 10 13 16 13 22 C13 26 16 29 20 29 C24 29 27 26 27 22 C27 16 20 10 20 10Z" fill="#5D7A3B"/>
              <path d="M20 14 C20 14 16 18 16 22 C16 24.5 17.8 26 20 26 C22.2 26 24 24.5 24 22 C24 18 20 14 20 14Z" fill="#8FA65E"/>
            </svg>
          </div>
          <div>
            <div className="kv-logo-name">Kultiva</div>
            <div className="kv-logo-sub">Masia · Castevell</div>
          </div>
        </a>
        <div className="kv-header-right">
          <div className="kv-last-update">
            <span className="kv-last-label">Última lectura</span>
            <span className="kv-last-value">19 abr · 14:23</span>
          </div>
          <span className="kv-conn-badge"><span className="kv-conn-dot"/>Connectat</span>
          <nav className="kv-nav">
            <a href="#">Dashboard</a>
            <a href="#">Vista 3D</a>
            <a href="#">Control</a>
            <a href="#" className="active">Log</a>
          </nav>
        </div>
      </div>
    </header>
  );
}

/* ==================== FILTERS BAR ==================== */
function LgFilters({filter,setFilter,counts,query,setQuery,auto,setAuto,searchRef}){
  return (
    <div className="lg-filters">
      <div className="lg-filter-pills">
        <button className={`lg-pill all ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>
          <span>Tots</span>
          <span className="lg-pill-count">{counts.all}</span>
        </button>
        <button className={`lg-pill info ${filter==='info'?'active':''}`} onClick={()=>setFilter('info')}>
          <span className="lg-pill-ic">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4"/><circle cx="6" cy="3.5" r=".9" fill="currentColor"/><path d="M6 5.5v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </span>
          <span>Info</span>
          <span className="lg-pill-count">{counts.info}</span>
        </button>
        <button className={`lg-pill warn ${filter==='warn'?'active':''}`} onClick={()=>setFilter('warn')}>
          <span className="lg-pill-ic">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l5.2 9H.8L6 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 4.5v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="6" cy="8.4" r=".7" fill="currentColor"/></svg>
          </span>
          <span>Warning</span>
          <span className="lg-pill-count">{counts.warn}</span>
        </button>
        <button className={`lg-pill err ${filter==='err'?'active':''}`} onClick={()=>setFilter('err')}>
          <span className="lg-pill-ic">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 4l4 4M8 4l-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </span>
          <span>Error</span>
          <span className="lg-pill-count">{counts.err}</span>
        </button>
      </div>
      <div className="lg-search">
        <svg className="lg-search-ic" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9.2 9.2l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
        <input ref={searchRef} placeholder="Filtrar per missatge, node o source…" value={query} onChange={e=>setQuery(e.target.value)}/>
        <span className="lg-search-kbd">/</span>
      </div>
      <div className="lg-auto-refresh">
        <div className={`lg-ar-spinner ${auto?'':'off'}`}/>
        <span className="lg-ar-label">Actualitza cada 10s</span>
        <div className={`lg-switch ${auto?'on':''}`} onClick={()=>setAuto(!auto)}/>
      </div>
    </div>
  );
}

/* ==================== LOG ROW ==================== */
function LgJson({data}){
  const pretty = useMemo(()=>{
    const s = JSON.stringify(data, null, 2);
    // Syntax highlight keys, strings, numbers, booleans
    return s
      .replace(/("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")\s*:/g, '<span class="k">$1</span>:')
      .replace(/:\s*("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")/g, ': <span class="s">$1</span>')
      .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="n">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="b">$1</span>');
  },[data]);
  return <pre className="lg-json" dangerouslySetInnerHTML={{__html: pretty}}/>;
}

function highlightMatches(text, q){
  if (!q) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'ig'));
  return parts.map((p,i)=> p.toLowerCase()===q.toLowerCase() ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>);
}

function LgRow({log, expanded, onToggle, fresh, query, rowRef}){
  return (
    <div
      ref={rowRef}
      className={`lg-row ${log.level} ${expanded?'expanded':''} ${fresh?'fresh':''}`}
      onClick={onToggle}
      data-log-id={log.id}
      tabIndex={0}
    >
      <div className="lg-row-severity"/>
      <span className="lg-row-ts">{log.tsStr}</span>
      <span className={`lg-src ${lgSrcClass(log.source)}`}>{log.source}</span>
      <span className={`lg-lvl ${log.level}`}>{log.level==='info'?'INF':log.level==='warn'?'WRN':'ERR'}</span>
      <span className="lg-msg">{highlightMatches(log.message, query)}</span>
      <div className="lg-row-actions">
        <span className="lg-row-anchor">#{log.id}</span>
        <span className="lg-row-expand">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </div>
      {expanded && (
        <div className="lg-payload">
          <div className="lg-payload-head">
            <span>Payload</span>
            <button className="lg-payload-copy" onClick={e=>{e.stopPropagation(); navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(log.payload,null,2));}}>Copiar JSON</button>
          </div>
          <LgJson data={log.payload}/>
        </div>
      )}
    </div>
  );
}

/* ==================== SIDEBAR ==================== */
function LgChart24({logs}){
  // Bucket logs into 24 hourly bins relative to last log
  const buckets = useMemo(()=>{
    const end = new Date('2026-04-19T15:00:00');
    const arr = Array.from({length:24}, (_,i)=>({info:0,warn:0,err:0}));
    logs.forEach(l=>{
      const diffH = Math.floor((end - l.ts)/(60*60*1000));
      const idx = 23 - diffH;
      if (idx>=0 && idx<24) arr[idx][l.level]++;
    });
    return arr;
  },[logs]);
  const max = Math.max(1, ...buckets.map(b=>b.info+b.warn+b.err));
  return (
    <div className="lg-card">
      <div className="lg-card-title">Últimes 24h<span className="lg-card-title-sub">{logs.length} esdeveniments</span></div>
      <div className="lg-chart24">
        {buckets.map((b,i)=>{
          const total = b.info+b.warn+b.err;
          return (
            <div key={i} className="lg-chart24-col" title={`${i}:00 — ${total} (${b.info}i/${b.warn}w/${b.err}e)`}>
              {b.err>0 && <div className="lg-chart24-seg err" style={{height:`${(b.err/max)*100}%`}}/>}
              {b.warn>0 && <div className="lg-chart24-seg warn" style={{height:`${(b.warn/max)*100}%`}}/>}
              {b.info>0 && <div className="lg-chart24-seg info" style={{height:`${(b.info/max)*100}%`}}/>}
            </div>
          );
        })}
      </div>
      <div className="lg-chart24-labels">
        <span>15h ahir</span><span>00h</span><span>07h</span><span>14h</span>
      </div>
      <div className="lg-chart24-total">
        <span className="lg-chart24-total-num">{logs.length}</span>
        <span className="lg-chart24-total-lbl">esdeveniments · 24h</span>
      </div>
    </div>
  );
}

function LgSevBars({logs}){
  const counts = { info: logs.filter(l=>l.level==='info').length,
                   warn: logs.filter(l=>l.level==='warn').length,
                   err:  logs.filter(l=>l.level==='err').length };
  const total = counts.info + counts.warn + counts.err || 1;
  const rows = [
    { k:'info', label:'Info',    count: counts.info, pct: counts.info/total*100, delta:'−8 vs ahir', dir:'down'},
    { k:'warn', label:'Warning', count: counts.warn, pct: counts.warn/total*100, delta:'−12 vs ahir', dir:'down'},
    { k:'err',  label:'Error',   count: counts.err,  pct: counts.err/total*100,  delta:'+3 vs ahir', dir:'up'},
  ];
  return (
    <div className="lg-card">
      <div className="lg-card-title">Per severity<span className="lg-card-title-sub">24h</span></div>
      <div className="lg-sev-list">
        {rows.map(r=>(
          <div key={r.k} className="lg-sev-row">
            <div className="lg-sev-head">
              <span className="lg-sev-head-left"><span className={`lg-sev-head-dot ${r.k}`}/>{r.label}</span>
              <span className="lg-sev-head-num">{r.count} <span style={{color:'var(--ink-3)',fontWeight:400}}>· {r.pct.toFixed(0)}%</span></span>
            </div>
            <div className="lg-sev-bar-wrap">
              <div className={`lg-sev-bar ${r.k}`} style={{width:`${r.pct}%`}}/>
            </div>
            <span className={`lg-sev-delta ${r.dir}`}>{r.delta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LgSparkline({values, color}){
  const w = 80, h = 18;
  const max = Math.max(1, ...values);
  const pts = values.map((v,i)=>[i*(w/(values.length-1)), h - (v/max)*h*0.9 - 1]);
  const d = 'M' + pts.map(p=>p.map(x=>x.toFixed(1)).join(',')).join(' L');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function LgSources({logs}){
  const srcs = useMemo(()=>{
    const map = new Map();
    logs.forEach(l=>{
      if (!map.has(l.source)) map.set(l.source, []);
      map.get(l.source).push(l);
    });
    const arr = [...map.entries()].map(([src, ls])=>{
      // build 8-bucket sparkline
      const end = new Date('2026-04-19T15:00:00');
      const buckets = Array(8).fill(0);
      ls.forEach(l=>{
        const diffH = (end - l.ts)/(60*60*1000);
        const idx = 7 - Math.floor(diffH/3);
        if (idx>=0 && idx<8) buckets[idx]++;
      });
      return { src, count: ls.length, spark: buckets };
    });
    arr.sort((a,b)=>b.count-a.count);
    return arr.slice(0,5);
  },[logs]);
  return (
    <div className="lg-card">
      <div className="lg-card-title">Per source<span className="lg-card-title-sub">top 5</span></div>
      <div className="lg-src-list">
        {srcs.map(s=>(
          <div key={s.src} className="lg-src-row">
            <span className={`lg-src ${lgSrcClass(s.src)}`}>{s.src}</span>
            <div className="lg-src-row-spark"><LgSparkline values={s.spark} color="#5D7A3B"/></div>
            <span className="lg-src-row-num">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LgDownload(){
  const [open,setOpen] = useState(false);
  return (
    <div className={`lg-dl ${open?'open':''}`} onClick={()=>setOpen(!open)}>
      <span>Descarregar logs</span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 2v8M4 7l3 3 3-3"/><path d="M2.5 12h9"/>
      </svg>
      <div className="lg-dl-menu" onClick={e=>e.stopPropagation()}>
        <button className="lg-dl-item" onClick={()=>setOpen(false)}>Exportar com a CSV</button>
        <button className="lg-dl-item" onClick={()=>setOpen(false)}>Exportar com a JSON</button>
        <button className="lg-dl-item" onClick={()=>setOpen(false)}>Exportar com a TXT</button>
      </div>
    </div>
  );
}

/* ==================== EMPTY ==================== */
function LgEmpty({onReset}){
  return (
    <div className="lg-empty">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="34" cy="34" r="22" stroke="#B8B19C" strokeWidth="2"/>
        <path d="M50 50 L64 64" stroke="#B8B19C" strokeWidth="2" strokeLinecap="round"/>
        <path d="M34 28 C34 28 28 34 28 40 C28 43 30.5 45 34 45 C37.5 45 40 43 40 40 C40 34 34 28 34 28Z" fill="#A8BE6C" opacity=".55"/>
      </svg>
      <div className="lg-empty-text">Cap log coincideix amb els filtres</div>
      <div className="lg-empty-sub">Prova a netejar els filtres o ampliar la cerca.</div>
      <button className="lg-empty-btn" onClick={onReset}>Netejar filtres</button>
    </div>
  );
}

/* ==================== APP ==================== */
function LgApp(){
  const [allLogs, setAllLogs] = useState(window.LG_MOCK);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [auto, setAuto] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [freshIds, setFreshIds] = useState(new Set());
  const searchRef = useRef(null);

  const counts = useMemo(()=>({
    all: allLogs.length,
    info: allLogs.filter(l=>l.level==='info').length,
    warn: allLogs.filter(l=>l.level==='warn').length,
    err:  allLogs.filter(l=>l.level==='err').length,
  }),[allLogs]);

  const filtered = useMemo(()=>{
    return allLogs.filter(l=>{
      if (filter!=='all' && l.level!==filter) return false;
      if (query){
        const q = query.toLowerCase();
        if (!l.message.toLowerCase().includes(q) &&
            !l.source.toLowerCase().includes(q) &&
            !l.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  },[allLogs, filter, query]);

  // Keyboard shortcuts
  useEffect(()=>{
    const onKey = e=>{
      if (e.key==='/' && document.activeElement?.tagName!=='INPUT'){
        e.preventDefault(); searchRef.current?.focus();
      } else if (e.key==='Escape'){
        if (document.activeElement?.tagName==='INPUT') document.activeElement.blur();
        setQuery(''); setFilter('all');
      }
    };
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  },[]);

  // Auto-refresh: every 10s push a new log
  useEffect(()=>{
    if (!auto) return;
    const iv = setInterval(()=>{
      const tpl = [
        {level:'info', src:'CENTRAL', msg:'Heartbeat: tots els nodes responen (4/4)', pl:{nodes:{F1:'ok',F2:'ok',F3:'ok',F4:'ok'},latency_ms:[12,18,45,22]}},
        {level:'info', src:'ESP32-F1', msg:`Lectura periòdica: humitat=${50+Math.floor(Math.random()*15)}%, temp=22°C, bateria=84%`, pl:{humidity:55,temp:22,battery:84}},
        {level:'info', src:'SUPABASE', msg:'Batch upload: 4 lectures sincronitzades', pl:{rows:4,status:200}},
        {level:'warn', src:'ESP32-F3', msg:'Latència alta: 180ms (esperat <100ms)', pl:{latency_ms:180,threshold:100}},
      ][Math.floor(Math.random()*4)];
      const now = new Date();
      const pad = (n,l=2)=>String(n).padStart(l,'0');
      const tsStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(),3)}`;
      const id = `log_${Math.floor(Math.random()*9000+2000)}`;
      const newLog = { id, ts: now, tsStr, level: tpl.level, source: tpl.src, message: tpl.msg, payload: tpl.pl };
      setAllLogs(prev=>[newLog, ...prev]);
      setFreshIds(prev=>{ const n = new Set(prev); n.add(id); return n; });
      setTimeout(()=>{ setFreshIds(prev=>{ const n = new Set(prev); n.delete(id); return n; }); }, 800);
    }, 10000);
    return ()=>clearInterval(iv);
  },[auto]);

  const toggle = id=>{
    setExpanded(prev=>{
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <>
      <LgHeader/>
      <main className="lg-main">
        <div className="lg-page-head">
          <h1 className="lg-page-title">Device Log</h1>
          <span className="lg-page-sub">Mostrant {filtered.length} de {allLogs.length}</span>
        </div>
        <LgFilters filter={filter} setFilter={setFilter} counts={counts} query={query} setQuery={setQuery} auto={auto} setAuto={setAuto} searchRef={searchRef}/>
        <div className="lg-layout">
          <div className="lg-console">
            <div className="lg-console-head">
              <div className="lg-console-head-left">
                <div className="lg-console-dots"><span/><span/><span/></div>
                <span className="lg-console-title">device.log</span>
              </div>
              <span className="lg-console-counts">{filtered.length} entrades · ordenat per temps ↓</span>
            </div>
            <div className="lg-console-body">
              {filtered.length === 0 ? (
                <LgEmpty onReset={()=>{setFilter('all'); setQuery('');}}/>
              ) : filtered.map(l=>(
                <LgRow key={l.id} log={l} expanded={expanded.has(l.id)} onToggle={()=>toggle(l.id)} fresh={freshIds.has(l.id)} query={query}/>
              ))}
            </div>
          </div>
          <aside className="lg-sidebar">
            <LgChart24 logs={allLogs}/>
            <LgSevBars logs={allLogs}/>
            <LgSources logs={allLogs}/>
            <LgDownload/>
          </aside>
        </div>
        <footer className="kv-footer">
          <span>Kultiva v0.3 · Masia Castevell</span>
          <span>4 nodes · 1 central · Supabase</span>
        </footer>
      </main>
    </>
  );
}

Object.assign(window, { LgApp });
