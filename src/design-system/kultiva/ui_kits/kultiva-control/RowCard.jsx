// Kultiva — Control Panel: RowConfigCard + Save bar

const { useState: useStateR, useRef: useRefR, useEffect: useEffectR, useMemo: useMemoR } = React;

function Slider({ label, hint, min, max, value, unit, cap, onChange, comfort, accent, step=1, formatVal }){
  const [pulse, setPulse] = useStateR(false);
  const trackRef = useRefR(null);
  const pct = ((value - min) / (max - min)) * 100;
  const comfortLeft = comfort ? ((comfort[0]-min)/(max-min))*100 : 0;
  const comfortRight = comfort ? ((comfort[1]-min)/(max-min))*100 : 0;
  const drag = (e)=>{
    const rect = trackRef.current.getBoundingClientRect();
    const move = (ev)=>{
      const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const v = Math.round((min + x*(max-min))/step)*step;
      onChange(v);
    };
    const up = ()=>{ window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); setPulse(true); setTimeout(()=>setPulse(false), 420); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    move(e);
  };
  const disp = formatVal ? formatVal(value) : value;
  return (
    <div className="kv-slider">
      <div className="kv-slider-left">
        <span>{label}</span>
        <span className="kv-slider-left-hint">{hint}</span>
      </div>
      <div className={`kv-slider-track-wrap ${pulse?'kv-slider-pulse':''}`} ref={trackRef} onMouseDown={drag}>
        <div className="kv-slider-track">
          {comfort && (
            <div className="kv-slider-comfort" style={{left:comfortLeft+'%', width:(comfortRight-comfortLeft)+'%'}}/>
          )}
          <div className="kv-slider-fill" style={{width: pct+'%'}}/>
          <div className="kv-slider-thumb" style={{left: pct+'%'}}>
            <div className="kv-slider-thumb-tip">{disp}{unit}</div>
          </div>
        </div>
      </div>
      <div className="kv-slider-right">
        <span className="kv-slider-val">{disp}<span className="kv-slider-val-unit">{unit}</span></span>
        <span className="kv-slider-cap">{cap}</span>
      </div>
    </div>
  );
}

function formatRest(h){ if (h<1) return Math.round(h*60)+'m'; if (h===Math.round(h)) return h+'h'; return h.toFixed(1)+'h'; }
function formatDur(m){ if (m<60) return m+''; const h = Math.floor(m/60), r = m%60; return r===0 ? h+'h' : h+'h '+r+'m'; }

function RowConfigCard({ row, stateData, onStateChange, onChange }){
  const { mode, stage, threshold, duration, rest, currentHumidity, nextIrrigationMin } = stateData;
  const [calculating, setCalculating] = useStateR(false);

  const changeStage = (newStage)=>{
    const defs = STAGES.find(s=>s.id===newStage).defaults;
    onStateChange({ ...stateData, stage:newStage, threshold:defs.threshold, duration:defs.duration, rest:defs.rest });
    onChange();
    setCalculating(true);
    setTimeout(()=>setCalculating(false), 800);
  };
  const currentStage = STAGES.find(s=>s.id===stage);
  const humState = currentHumidity >= currentStage.comfort[0] ? 'ok' : currentHumidity >= currentStage.comfort[0]-10 ? 'warn' : 'critical';
  const nextIrr = !stateData || currentHumidity >= threshold + 5 ? formatRest(nextIrrigationMin/60) + ' aprox.' : currentHumidity < threshold ? 'imminent' : 'en ' + formatRest(nextIrrigationMin/60);

  return (
    <article className="kv-rc" style={{'--row-accent': row.accent}}>
      {/* A — Header */}
      <div className="kv-rc-head">
        <div>
          <div className="kv-rc-title">
            <span className="kv-rc-badge">{row.badge}</span>
            <span className="kv-rc-name">{row.name}</span>
          </div>
          <div className="kv-rc-sub">{row.sub}</div>
        </div>
        <div className="kv-segtoggle">
          <button className={mode==='auto'?'active':''} onClick={()=>{onStateChange({...stateData, mode:'auto'}); onChange();}}>Auto</button>
          <button className={mode==='manual'?'active':''} onClick={()=>{onStateChange({...stateData, mode:'manual'}); onChange();}}>Manual</button>
        </div>
      </div>

      {/* B — Stage selector */}
      <div className="kv-stage">
        <div className="kv-stage-label">Fase de creixement</div>
        <div className="kv-stages">
          {STAGES.map(s=>(
            <div key={s.id} className={`kv-stage-card ${stage===s.id?'active':''}`} onClick={()=>changeStage(s.id)}>
              <div className="kv-stage-check">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l3 3 5-6"/></svg>
              </div>
              <div className="kv-stage-icon"><StageIcon stage={s.id}/></div>
              <div className="kv-stage-name">{s.name}</div>
              <div className="kv-stage-dur">{s.duration}</div>
              <div className="kv-stage-tip">
                <div className="kv-stage-tip-params">
                  <span className="kv-stage-tip-param">💧 {s.defaults.threshold}%</span>
                  <span className="kv-stage-tip-param">⏱ {formatDur(s.defaults.duration)}</span>
                  <span className="kv-stage-tip-param">💤 {formatRest(s.defaults.rest)}</span>
                </div>
                <div className="kv-stage-tip-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* C — Sliders */}
      <div className="kv-sliders">
        <Slider label="Llindar d'humitat" hint="Si baixa d'aquí, es rega"
                min={0} max={100} value={threshold} unit="%" cap="Sota aquest valor, la vàlvula s'obre"
                comfort={currentStage.comfort} accent={row.accent}
                onChange={v=>{onStateChange({...stateData, threshold:v}); onChange(); setCalculating(true); setTimeout(()=>setCalculating(false),500);}}/>
        <Slider label="Durada del reg" hint="Obertura de la vàlvula"
                min={0} max={180} step={5} value={duration} unit=" min" cap="Temps total que la vàlvula roman oberta"
                onChange={v=>{onStateChange({...stateData, duration:v}); onChange(); setCalculating(true); setTimeout(()=>setCalculating(false),500);}}
                formatVal={formatDur}/>
        <Slider label="Descans entre regs" hint="Mínim entre dos regs"
                min={0} max={72} step={1} value={rest} unit="h" cap="Evita sobrereg — no es rega durant aquest temps"
                onChange={v=>{onStateChange({...stateData, rest:v}); onChange(); setCalculating(true); setTimeout(()=>setCalculating(false),500);}}/>
      </div>

      {/* D — Status footer */}
      <div className="kv-rc-foot">
        <div className="kv-rc-foot-group">
          <span className="kv-rc-foot-item">
            <span className={`kv-rc-foot-dot ${humState}`}/>
            Humitat actual <span className="kv-rc-foot-val" style={{marginLeft:4}}>{currentHumidity}%</span>
          </span>
          <span className="kv-rc-foot-item">
            Proper reg{' '}
            {calculating ? (
              <span className="kv-rc-foot-calculating">
                <span className="kv-rc-foot-calculating-dot"/>calculant…
              </span>
            ) : (
              <span className="kv-rc-foot-val" style={{marginLeft:4}}>
                {currentHumidity < threshold ? 'ara mateix' : 'en ' + formatRest(nextIrrigationMin/60)}
              </span>
            )}
          </span>
        </div>
        <a href="#" className="kv-rc-foot-link">Veure historial →</a>
      </div>
    </article>
  );
}

function SaveBar({ count, saving, saved, onSave, onDiscard }){
  const visible = count > 0 || saved;
  return (
    <div className={`kv-savebar ${visible?'visible':''} ${saved?'saved':''}`}>
      <div className="kv-savebar-text">
        <span className="kv-savebar-count">{saved ? 'Desat correctament' : 'Canvis pendents'}</span>
        <span className="kv-savebar-msg">{saved ? 'Desat · fa un instant' : `Tens ${count} ${count===1?'canvi':'canvis'} sense guardar`}</span>
      </div>
      <div className="kv-savebar-actions">
        <button className="kv-savebar-btn ghost" onClick={onDiscard} disabled={saving}>Descartar</button>
        <button className="kv-savebar-btn primary" onClick={onSave} disabled={saving}>
          {saving ? 'Guardant…' : 'Guardar canvis'}
        </button>
      </div>
    </div>
  );
}

function Confetti({ trigger }){
  const [parts, setParts] = useStateR([]);
  useEffectR(()=>{
    if (!trigger) return;
    const colors = ['#4E7A48','#5D7A3B','#8FA65E','#3B7A8C'];
    const arr = [];
    for (let i=0;i<14;i++){
      arr.push({
        id: Math.random().toString(36).slice(2),
        left: 48 + Math.random()*4 + '%',
        top: 'calc(100% - 60px)',
        tx: (Math.random()-0.5)*360 + 'px',
        ty: -(200 + Math.random()*200) + 'px',
        r: (Math.random()*720-360) + 'deg',
        color: colors[Math.floor(Math.random()*colors.length)],
        delay: Math.random()*120,
      });
    }
    setParts(arr);
    const t = setTimeout(()=>setParts([]), 1000);
    return ()=>clearTimeout(t);
  }, [trigger]);
  if (!parts.length) return null;
  return (
    <div className="kv-confetti">
      {parts.map(p=>(
        <span key={p.id} className="kv-confetto"
          style={{ left:p.left, top:p.top, background:p.color,
                   '--tx':p.tx, '--ty':p.ty, '--r':p.r, animationDelay:p.delay+'ms' }}/>
      ))}
    </div>
  );
}

Object.assign(window, { Slider, RowConfigCard, SaveBar, Confetti, formatRest, formatDur });
