// Kultiva — Control Panel components

const { useState: useStateC, useMemo: useMemoC, useRef: useRefC, useEffect: useEffectC } = React;

const CTRL_ROWS = [
  { id:1, badge:'F1', name:'Enciams + porros',     sub:'2 enciams + porros',  accent:'#4E7A48' },
  { id:2, badge:'F2', name:'Enciams',              sub:'4 enciams',           accent:'#3B7A8C' },
  { id:3, badge:'F3', name:'Tomàquets',            sub:'3 plantes · tutor',   accent:'#C4673D' },
  { id:4, badge:'F4', name:'Pebrots + albergínies',sub:'4 plantes · 2+2',     accent:'#8B6A3E' },
];

const STAGES = [
  { id:'vegetatiu', name:'Vegetatiu', duration:'3–4 setmanes',
    desc:'Creixement ràpid de fulles. Necessita humitat constant i estable.',
    defaults: { threshold:55, duration:60, rest:12 }, comfort:[50,65] },
  { id:'floracio', name:'Floració', duration:'2–3 setmanes',
    desc:'Formació de flors. Evitar estrès hídric però permet lleuger assecat.',
    defaults: { threshold:50, duration:75, rest:16 }, comfort:[45,60] },
  { id:'fructificacio', name:'Fructificació', duration:'3–5 setmanes',
    desc:'Els fruits es formen i engrandeixen. Pic de demanda d\'aigua.',
    defaults: { threshold:50, duration:90, rest:12 }, comfort:[45,60] },
  { id:'maduracio', name:'Maduració', duration:'2–3 setmanes',
    desc:'Els fruits maduren. Menys aigua per concentrar sabors.',
    defaults: { threshold:40, duration:60, rest:24 }, comfort:[35,50] },
];

function StageIcon({ stage }){
  if (stage==='vegetatiu') return (
    <svg viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 32 V 14"/>
      <path d="M19 22 C 12 22 9 18 8 12 C 14 12 18 14 19 22 Z" fill="currentColor" fillOpacity=".15"/>
      <path d="M19 18 C 26 18 29 15 30 10 C 24 10 20 12 19 18 Z" fill="currentColor" fillOpacity=".15"/>
    </svg>
  );
  if (stage==='floracio') return (
    <svg viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="19" cy="18" r="2.5" fill="currentColor" fillOpacity=".3"/>
      <path d="M19 15.5 C 19 11 17 9 14 9 C 12 11 13 14 19 15.5 Z" fill="currentColor" fillOpacity=".12"/>
      <path d="M19 15.5 C 19 11 21 9 24 9 C 26 11 25 14 19 15.5 Z" fill="currentColor" fillOpacity=".12"/>
      <path d="M16.5 18 C 12 18 10 20 10 23 C 12 25 15 24 16.5 18 Z" fill="currentColor" fillOpacity=".12"/>
      <path d="M21.5 18 C 26 18 28 20 28 23 C 26 25 23 24 21.5 18 Z" fill="currentColor" fillOpacity=".12"/>
      <path d="M19 20 V 30"/>
    </svg>
  );
  if (stage==='fructificacio') return (
    <svg viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="17" cy="22" r="6" fill="currentColor" fillOpacity=".15"/>
      <path d="M17 16 C 15 12 12 11 10 11 C 10 13 11 15 17 16 Z" fill="currentColor" fillOpacity=".2"/>
      <path d="M17 16 C 19 12 22 11 24 11 C 24 13 23 15 17 16 Z" fill="currentColor" fillOpacity=".2"/>
      <path d="M17 16 V 18"/>
      <path d="M20 27 Q 22 26 23 24" opacity=".5"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="19" cy="22" r="7" fill="currentColor" fillOpacity=".3"/>
      <path d="M19 15 C 17 11 14 10 12 10 C 12 12 13 14 19 15 Z" fill="currentColor" fillOpacity=".25"/>
      <path d="M19 15 V 17"/>
      <path d="M22 27 Q 24 25 25 23" opacity=".55" stroke="currentColor"/>
      <path d="M14 24 Q 15 26 16 27" opacity=".35" stroke="currentColor"/>
    </svg>
  );
}

function KultivaMarkC(){
  return (
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" fill="#E8EEDA" stroke="#5D7A3B" strokeWidth="1"/>
      <path d="M20 10 C20 10 13 16 13 22 C13 26 16 29 20 29 C24 29 27 26 27 22 C27 16 20 10 20 10Z" fill="#5D7A3B"/>
      <path d="M20 14 C20 14 16 18 16 22 C16 24.5 17.8 26 20 26 C22.2 26 24 24.5 24 22 C24 18 20 14 20 14Z" fill="#8FA65E"/>
      <circle cx="20" cy="23" r="1.2" fill="#FBF9F2"/>
    </svg>
  );
}

function HeaderC({ active='control' }){
  return (
    <header className="kv-header">
      <div className="kv-header-inner">
        <div className="kv-logo">
          <div className="kv-logo-mark"><KultivaMarkC/></div>
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

/* ============ GLOBAL SETTINGS ============ */
function GlobalSettings({ autoIrr, setAutoIrr, interval, setInterval, bestHour, setBestHour, onChange }){
  const [pulse, setPulse] = useStateC(false);
  const triggerPulse = ()=>{ setPulse(true); setTimeout(()=>setPulse(false), 420); };
  const presets = [15, 30, 60];
  const minV = 5, maxV = 60;
  const pct = ((interval - minV) / (maxV - minV)) * 100;
  const sliderRef = useRefC(null);
  const drag = (e)=>{
    const rect = sliderRef.current.getBoundingClientRect();
    const move = (ev)=>{
      const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const v = Math.round(minV + x*(maxV - minV));
      setInterval(v); onChange();
    };
    const up = ()=>{ window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); triggerPulse(); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    move(e);
  };

  const hourH = parseInt(bestHour.split(':')[0]);
  const hourM = parseInt(bestHour.split(':')[1]);
  const angle = (hourH % 12) * 30 + hourM * 0.5;

  return (
    <div className="kv-gs">
      <div className="kv-gs-col">
        <div className="kv-gs-label">Reg automàtic</div>
        <div className="kv-gs-title">
          <div className="kv-bigtoggle" style={{}} onClick={()=>{setAutoIrr(!autoIrr); onChange();}} className={`kv-bigtoggle ${autoIrr?'on':''}`}>
            <div className="kv-bigtoggle-thumb">
              <svg className="on-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l3 3 5-6"/></svg>
              <svg className="off-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round"><path d="M4 4l6 6M10 4l-6 6"/></svg>
            </div>
          </div>
          <span className={`kv-bigtoggle-state ${autoIrr?'on':'off'}`}>{autoIrr?'Activat':'Desactivat'}</span>
        </div>
        <div className="kv-gs-help">El sistema rega automàticament quan detecta sòl sec segons els llindars configurats a cada fila.</div>
      </div>

      <div className="kv-gs-col">
        <div className="kv-gs-label">Interval de lectura</div>
        <div className="kv-interval-row">
          <span className="kv-interval-val">{interval}<span className="kv-interval-val-unit">min</span></span>
          <div className={`kv-hslider ${pulse?'kv-hslider-pulse':''}`} ref={sliderRef} onMouseDown={drag}>
            <div className="kv-hslider-rail">
              <div className="kv-hslider-fill" style={{width: pct+'%'}}/>
              <div className="kv-hslider-thumb" style={{left: pct+'%'}}/>
            </div>
          </div>
        </div>
        <div className="kv-presets">
          {presets.map(p=>(
            <button key={p} className={`kv-preset ${interval===p?'active':''}`} onClick={()=>{setInterval(p); onChange(); triggerPulse();}}>{p} min</button>
          ))}
        </div>
        <div className="kv-gs-help">Cada quant els sensors envien lectures al servidor. Més freqüent = més dades, més bateria consumida.</div>
      </div>

      <div className="kv-gs-col">
        <div className="kv-gs-label">Millor hora per regar</div>
        <div className="kv-clock">
          <input className="kv-clock-input" type="time" value={bestHour} onChange={e=>{setBestHour(e.target.value); onChange();}}/>
          <div className="kv-clock-face">
            <svg viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="var(--border)" strokeWidth="1.5"/>
              {[0,3,6,9].map(i=>{
                const a = i*30 * Math.PI/180;
                const x1 = 28 + Math.sin(a)*22, y1 = 28 - Math.cos(a)*22;
                const x2 = 28 + Math.sin(a)*19, y2 = 28 - Math.cos(a)*19;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink-3)" strokeWidth="1.3" strokeLinecap="round"/>;
              })}
              <line x1="28" y1="28"
                    x2={28 + Math.sin(angle*Math.PI/180)*16}
                    y2={28 - Math.cos(angle*Math.PI/180)*16}
                    stroke="var(--olive)" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="28" cy="28" r="2" fill="var(--olive)"/>
            </svg>
          </div>
        </div>
        <div className="kv-gs-help">Les plantes absorbeixen millor a primera hora del matí i al capvespre. Evita el migdia.</div>
      </div>
    </div>
  );
}

Object.assign(window, { CTRL_ROWS, STAGES, StageIcon, HeaderC, GlobalSettings });
