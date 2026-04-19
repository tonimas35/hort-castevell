// Kultiva Control — Mobile

const { useState: useS, useRef: useR, useMemo: useM, useEffect: useE } = React;

const MC_ROWS = [
  { id:1, badge:'F1', name:'Enciams + porros',     accent:'#4E7A48' },
  { id:2, badge:'F2', name:'Enciams',              accent:'#3B7A8C' },
  { id:3, badge:'F3', name:'Tomàquets',            accent:'#C4673D' },
  { id:4, badge:'F4', name:'Pebrots + albergínies',accent:'#8B6A3E' },
];
const MC_STAGES = [
  { id:'vegetatiu', name:'Vegetatiu', dur:'3–4 set.', defaults:{threshold:55,duration:60,rest:12}, comfort:[50,65] },
  { id:'floracio', name:'Floració', dur:'2–3 set.', defaults:{threshold:50,duration:75,rest:16}, comfort:[45,60] },
  { id:'fructificacio', name:'Fructificació', dur:'3–5 set.', defaults:{threshold:50,duration:90,rest:12}, comfort:[45,60] },
  { id:'maduracio', name:'Maduració', dur:'2–3 set.', defaults:{threshold:40,duration:60,rest:24}, comfort:[35,50] },
];

function McStageIcon({s}){
  const common = { viewBox:"0 0 22 22", fill:"none", stroke:"currentColor", strokeWidth:1.5, strokeLinecap:"round", strokeLinejoin:"round" };
  if (s==='vegetatiu') return (<svg {...common}><path d="M11 19 V 8"/><path d="M11 13 C 7 13 5 10 4.5 7 C 8 7 10 9 11 13Z" fill="currentColor" fillOpacity=".18"/><path d="M11 11 C 15 11 17 9 17.5 6 C 14 6 12 7 11 11Z" fill="currentColor" fillOpacity=".18"/></svg>);
  if (s==='floracio') return (<svg {...common}><circle cx="11" cy="10" r="1.5" fill="currentColor" fillOpacity=".35"/><path d="M11 8.5 C 11 6 10 5 8 5 C 7 6 7.5 8 11 8.5Z M11 8.5 C 11 6 12 5 14 5 C 15 6 14.5 8 11 8.5Z M9.5 10 C 7 10 6 11 6 13 C 7 14 9 13.5 9.5 10Z M12.5 10 C 15 10 16 11 16 13 C 15 14 13 13.5 12.5 10Z" fill="currentColor" fillOpacity=".15"/><path d="M11 11.5 V 18"/></svg>);
  if (s==='fructificacio') return (<svg {...common}><circle cx="9.5" cy="13" r="3.5" fill="currentColor" fillOpacity=".18"/><path d="M9.5 9 C 8.5 7 7 6.5 5.5 6.5 C 5.5 8 6.5 9 9.5 9Z M9.5 9 C 10.5 7 12 6.5 13.5 6.5 C 13.5 8 12.5 9 9.5 9Z" fill="currentColor" fillOpacity=".22"/><path d="M9.5 9 V 10"/></svg>);
  return (<svg {...common}><circle cx="11" cy="13" r="4" fill="currentColor" fillOpacity=".32"/><path d="M11 9 C 10 7 8.5 6.5 7 6.5 C 7 8 8 9 11 9Z" fill="currentColor" fillOpacity=".25"/><path d="M11 9 V 10"/><path d="M13 16 Q 14.5 15 15 13.5" opacity=".55"/></svg>);
}

function McHeader(){
  return (
    <header className="mc-header">
      <div className="mc-header-row1">
        <div className="mc-logo">
          <div className="mc-logo-mark">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="19" fill="#E8EEDA" stroke="#5D7A3B"/>
              <path d="M20 10 C20 10 13 16 13 22 C13 26 16 29 20 29 C24 29 27 26 27 22 C27 16 20 10 20 10Z" fill="#5D7A3B"/>
              <path d="M20 14 C20 14 16 18 16 22 C16 24.5 17.8 26 20 26 C22.2 26 24 24.5 24 22 C24 18 20 14 20 14Z" fill="#8FA65E"/>
            </svg>
          </div>
          <div>
            <div className="mc-logo-name">Kultiva</div>
            <div className="mc-logo-sub">Masia · Castevell</div>
          </div>
        </div>
        <span className="mc-conn"><span className="mc-conn-dot"/>fa 2m</span>
      </div>
      <nav className="mc-tabs">
        {[['dashboard','Dashboard'],['3d','Vista 3D'],['control','Control'],['log','Log']].map(([id,l])=>(
          <a key={id} href="#" className={id==='control'?'active':''}>{l}</a>
        ))}
      </nav>
    </header>
  );
}

function McGlobalSettings({autoIrr,setAutoIrr,interval,setInterval,bestHour,setBestHour,onChange}){
  const [open,setOpen] = useS(true);
  const presets = [15,30,60];
  const ref = useR(null);
  const pct = ((interval-5)/(60-5))*100;
  const drag = e=>{
    const rect = ref.current.getBoundingClientRect();
    const move = ev=>{
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const x = Math.max(0, Math.min(1, (cx - rect.left)/rect.width));
      setInterval(Math.round(5 + x*55)); onChange();
    };
    const up = ()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('touchmove',move); window.removeEventListener('mouseup',up); window.removeEventListener('touchend',up); };
    window.addEventListener('mousemove',move); window.addEventListener('touchmove',move);
    window.addEventListener('mouseup',up); window.addEventListener('touchend',up);
    move(e.touches ? {touches:e.touches} : e);
  };
  return (
    <div className={`mc-gs ${open?'open':''}`}>
      <div className="mc-gs-header" onClick={()=>setOpen(!open)}>
        <div className="mc-gs-header-left">
          <span className="mc-gs-header-title">Configuració general</span>
          <span className="mc-gs-header-chip">{autoIrr?'Auto':'Manual'} · {interval}min · {bestHour}</span>
        </div>
        <svg className="mc-gs-chev" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 5l4 4 4-4"/></svg>
      </div>
      <div className="mc-gs-body">
        <div className="mc-gs-body-inner">
          <div className="mc-gs-item">
            <div className="mc-gs-item-head">
              <span className="mc-gs-item-label">Reg automàtic</span>
              <div className={`mc-bigtoggle ${autoIrr?'on':''}`} onClick={()=>{setAutoIrr(!autoIrr); onChange();}}>
                <div className="mc-bigtoggle-thumb">
                  <svg className="on-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l3 3 5-6"/></svg>
                  <svg className="off-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round"><path d="M4 4l6 6M10 4l-6 6"/></svg>
                </div>
              </div>
            </div>
            <span className="mc-gs-item-hint">El sistema rega sol quan el sòl està sec.</span>
          </div>
          <div className="mc-gs-item">
            <span className="mc-gs-item-label">Interval de lectura</span>
            <div className="mc-interval">
              <span className="mc-interval-val">{interval}<span className="mc-interval-val-unit">min</span></span>
              <div className="mc-hslider" ref={ref} onMouseDown={drag} onTouchStart={drag}>
                <div className="mc-hslider-rail">
                  <div className="mc-hslider-fill" style={{width:pct+'%'}}/>
                  <div className="mc-hslider-thumb" style={{left:pct+'%'}}/>
                </div>
              </div>
            </div>
            <div className="mc-presets">
              {presets.map(p=>(
                <button key={p} className={`mc-preset ${interval===p?'active':''}`} onClick={()=>{setInterval(p); onChange();}}>{p} min</button>
              ))}
            </div>
          </div>
          <div className="mc-gs-item">
            <div className="mc-gs-item-head">
              <span className="mc-gs-item-label">Millor hora de reg</span>
              <input className="mc-clock-input" type="time" value={bestHour} onChange={e=>{setBestHour(e.target.value); onChange();}}/>
            </div>
            <span className="mc-gs-item-hint">Matí o capvespre. Evita el migdia.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function McSlider({label,hint,min,max,value,unit,onChange,comfort,accent,step=1,formatVal}){
  const ref = useR(null);
  const pct = ((value-min)/(max-min))*100;
  const cL = comfort ? ((comfort[0]-min)/(max-min))*100 : 0;
  const cR = comfort ? ((comfort[1]-min)/(max-min))*100 : 0;
  const drag = e=>{
    const rect = ref.current.getBoundingClientRect();
    const move = ev=>{
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const x = Math.max(0, Math.min(1, (cx - rect.left)/rect.width));
      onChange(Math.round((min + x*(max-min))/step)*step);
    };
    const up = ()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('touchmove',move); window.removeEventListener('mouseup',up); window.removeEventListener('touchend',up); };
    window.addEventListener('mousemove',move); window.addEventListener('touchmove',move);
    window.addEventListener('mouseup',up); window.addEventListener('touchend',up);
    move(e.touches ? {touches:e.touches} : e);
  };
  const disp = formatVal ? formatVal(value) : value;
  return (
    <div className="mc-slider">
      <div className="mc-slider-head">
        <span className="mc-slider-label">{label}</span>
        <span className="mc-slider-hint">{hint}</span>
      </div>
      <div className="mc-slider-row">
        <div className="mc-slider-track-wrap" ref={ref} onMouseDown={drag} onTouchStart={drag}>
          <div className="mc-slider-track">
            {comfort && <div className="mc-slider-comfort" style={{left:cL+'%', width:(cR-cL)+'%'}}/>}
            <div className="mc-slider-fill" style={{width:pct+'%'}}/>
            <div className="mc-slider-thumb" style={{left:pct+'%'}}/>
          </div>
        </div>
        <span className="mc-slider-num">{disp}<span className="mc-slider-num-unit">{unit}</span></span>
      </div>
    </div>
  );
}

function fmtDurMC(m){ if (m<60) return m+''; const h=Math.floor(m/60), r=m%60; return r===0?h+'h':h+'h '+r+'m'; }
function fmtRestMC(h){ if (h<1) return Math.round(h*60)+'m'; return h+'h'; }

function McRowCard({row, state, onState, onChange}){
  const {mode,stage,threshold,duration,rest,currentHumidity,nextIrrigationMin} = state;
  const cur = MC_STAGES.find(s=>s.id===stage);
  const humState = currentHumidity >= cur.comfort[0] ? 'ok' : currentHumidity >= cur.comfort[0]-10 ? 'warn' : 'critical';
  const changeStage = id=>{
    const d = MC_STAGES.find(s=>s.id===id).defaults;
    onState({...state, stage:id, ...d}); onChange();
  };
  return (
    <article className="mc-rc" style={{'--row-accent':row.accent}}>
      <div className="mc-rc-head">
        <div className="mc-rc-title">
          <span className="mc-rc-badge">{row.badge}</span>
          <span className="mc-rc-name">{row.name}</span>
        </div>
        <div className="mc-segtoggle">
          <button className={mode==='auto'?'active':''} onClick={()=>{onState({...state,mode:'auto'}); onChange();}}>Auto</button>
          <button className={mode==='manual'?'active':''} onClick={()=>{onState({...state,mode:'manual'}); onChange();}}>Manual</button>
        </div>
      </div>
      <div className="mc-stage">
        <div className="mc-stage-label">Fase de creixement</div>
        <div className="mc-stages">
          {MC_STAGES.map(s=>(
            <div key={s.id} className={`mc-stage-pill ${stage===s.id?'active':''}`} onClick={()=>changeStage(s.id)}>
              <div className="mc-stage-pill-ic"><McStageIcon s={s.id}/></div>
              <div>
                <div className="mc-stage-pill-name">{s.name}</div>
                <div className="mc-stage-pill-dur">{s.dur}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mc-sliders">
        <McSlider label="Llindar d'humitat" hint="si baixa d'aquí, rega" min={0} max={100} value={threshold} unit="%" comfort={cur.comfort} accent={row.accent} onChange={v=>{onState({...state,threshold:v}); onChange();}}/>
        <McSlider label="Durada del reg" hint="obertura de la vàlvula" min={0} max={180} step={5} value={duration} unit="" accent={row.accent} onChange={v=>{onState({...state,duration:v}); onChange();}} formatVal={fmtDurMC}/>
        <McSlider label="Descans entre regs" hint="mínim entre regs" min={0} max={72} value={rest} unit="h" accent={row.accent} onChange={v=>{onState({...state,rest:v}); onChange();}}/>
      </div>
      <div className="mc-rc-foot">
        <span><span className={`mc-rc-foot-dot ${humState}`}/>Humitat <span className="mc-rc-foot-val">{currentHumidity}%</span></span>
        <span>Proper reg <span className="mc-rc-foot-val">{currentHumidity < threshold ? 'ara' : fmtRestMC(Math.round(nextIrrigationMin/60))}</span></span>
      </div>
    </article>
  );
}

function McSaveBar({count, saving, saved, onSave, onDiscard}){
  const vis = count>0 || saved;
  return (
    <div className={`mc-savebar ${vis?'visible':''} ${saved?'saved':''}`}>
      <div className="mc-savebar-text">
        <div className="mc-savebar-count">{saved?'Desat':'Pendents'}</div>
        <div className="mc-savebar-msg">{saved?'Desat · ara':`${count} ${count===1?'canvi':'canvis'}`}</div>
      </div>
      <div className="mc-savebar-actions">
        <button className="mc-savebar-btn ghost" onClick={onDiscard} disabled={saving}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>
        </button>
        <button className="mc-savebar-btn primary" onClick={onSave} disabled={saving}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-6"/></svg>
          {saving?'Guardant…':'Guardar'}
        </button>
      </div>
    </div>
  );
}

const MC_INITIAL = [
  {mode:'auto',stage:'vegetatiu',threshold:55,duration:60,rest:12,currentHumidity:52,nextIrrigationMin:4*60+32},
  {mode:'auto',stage:'vegetatiu',threshold:55,duration:60,rest:12,currentHumidity:48,nextIrrigationMin:6*60+15},
  {mode:'auto',stage:'fructificacio',threshold:50,duration:90,rest:12,currentHumidity:42,nextIrrigationMin:0},
  {mode:'auto',stage:'floracio',threshold:50,duration:75,rest:16,currentHumidity:58,nextIrrigationMin:9*60+48},
];

function McApp(){
  const [autoIrr,setAutoIrr] = useS(true);
  const [interval,setInt] = useS(30);
  const [bestHour,setBH] = useS('08:00');
  const [rows,setRows] = useS(MC_INITIAL);
  const [baseline,setBaseline] = useS({autoIrr:true,interval:30,bestHour:'08:00',rows:JSON.parse(JSON.stringify(MC_INITIAL))});
  const [saving,setSaving] = useS(false);
  const [saved,setSaved] = useS(false);
  const count = useM(()=>{
    let n=0;
    if (autoIrr!==baseline.autoIrr) n++;
    if (interval!==baseline.interval) n++;
    if (bestHour!==baseline.bestHour) n++;
    rows.forEach((r,i)=>['mode','stage','threshold','duration','rest'].forEach(k=>{if(r[k]!==baseline.rows[i][k]) n++;}));
    return n;
  },[autoIrr,interval,bestHour,rows,baseline]);
  const onSave = ()=>{
    setSaving(true);
    setTimeout(()=>{
      setSaving(false); setSaved(true);
      setBaseline({autoIrr,interval,bestHour,rows:JSON.parse(JSON.stringify(rows))});
      setTimeout(()=>setSaved(false),1800);
    },600);
  };
  const onDiscard = ()=>{
    setAutoIrr(baseline.autoIrr); setInt(baseline.interval); setBH(baseline.bestHour);
    setRows(JSON.parse(JSON.stringify(baseline.rows)));
  };
  return (
    <>
      <McHeader/>
      <main className="mc-main">
        <h1 className="mc-page-title">Configuració del reg</h1>
        <McGlobalSettings autoIrr={autoIrr} setAutoIrr={setAutoIrr} interval={interval} setInterval={setInt} bestHour={bestHour} setBestHour={setBH} onChange={()=>{}}/>
        {MC_ROWS.map((r,i)=>(
          <McRowCard key={r.id} row={r} state={rows[i]} onState={s=>setRows(prev=>prev.map((x,j)=>j===i?s:x))} onChange={()=>{}}/>
        ))}
      </main>
      <McSaveBar count={count} saving={saving} saved={saved} onSave={onSave} onDiscard={onDiscard}/>
    </>
  );
}

Object.assign(window, { McApp });
