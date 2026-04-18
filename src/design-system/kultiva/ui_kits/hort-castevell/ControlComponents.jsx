const { useState: useStateCtrl } = React;

const StageIcon = {
  vegetatiu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V10"/><path d="M12 10C12 6 9 4 6 5c0 3 2 5 6 5Z"/><path d="M12 10c0-3 2-5 5-5 1 3-1 6-5 6Z"/>
    </svg>
  ),
  floracio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 9c0-3-2-5-4-5s-3 2-2 4"/><path d="M15 12c3 0 5-2 5-4s-2-3-4-2"/>
      <path d="M12 15c0 3 2 5 4 5s3-2 2-4"/><path d="M9 12c-3 0-5 2-5 4s2 3 4 2"/>
    </svg>
  ),
  fructificacio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 7c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7Z"/>
      <path d="M12 7V4"/><path d="M10 4h4"/><path d="M9 10c1-1 2-1.5 3-1.5"/>
    </svg>
  ),
  maduracio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="7"/>
      <path d="M12 6V3"/><path d="M10 3h4"/>
      <circle cx="9" cy="12" r=".6" fill="currentColor"/>
      <circle cx="14" cy="15" r=".6" fill="currentColor"/>
    </svg>
  ),
};

const STAGE_PRESETS = {
  vegetatiu:    { label: 'Creixement',    sub: 'Vegetatiu', trigger: 50, duration: 90,  rest: 12, desc: 'Tolera sequera moderada, reg cada 12–24h' },
  floracio:     { label: 'Floració',      sub: 'Flors',     trigger: 55, duration: 120, rest: 8,  desc: 'Sensible! No deixar assecar, reg freqüent' },
  fructificacio:{ label: 'Fructificació', sub: 'Fruit',     trigger: 45, duration: 120, rest: 24, desc: 'Cicle sec-mullat millora el sabor' },
  maduracio:    { label: 'Maduració',     sub: 'Collita',   trigger: 40, duration: 90,  rest: 36, desc: 'Estrès hídric controlat = més dolç' },
};
const STAGES = ['vegetatiu','floracio','fructificacio','maduracio'];

function Toggle({ active, onChange }) {
  return <button className={`toggle ${active?'active':''}`} onClick={()=>onChange(!active)} />;
}

function GrowthStageSelector({ row, value, onChange }) {
  const idx = STAGES.indexOf(value);
  return (
    <div className="gs-wrap">
      <div className="gs-head">
        <span className="gs-label">Fase de creixement</span>
        <span className="gs-current" style={{color: row.accent}}>fase {idx+1} de 4</span>
      </div>
      <div className="gs-row">
        {STAGES.map(st => {
          const p = STAGE_PRESETS[st];
          const on = value === st;
          return (
            <button key={st}
              className={`gs-cell ${on?'active':''}`}
              style={on ? { '--gs-accent': row.accent } : null}
              onClick={()=>onChange(st)}>
              <span className="gs-ic">{StageIcon[st]}</span>
              <span className="gs-tx">{p.label}</span>
              <span className="gs-sub">{p.sub}</span>
            </button>
          );
        })}
      </div>
      <div className="gs-hint" style={{'--gs-accent': row.accent}}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4"/>
          <circle cx="8" cy="8" r="3"/>
        </svg>
        <span>{STAGE_PRESETS[value].desc}</span>
      </div>
    </div>
  );
}

function LabeledSlider({ label, value, min, max, step = 1, color, unit = '', format }) {
  const [v, setV] = useStateCtrl(value);
  const pct = (v - min) / (max - min) * 100;
  return (
    <div className="sl-item">
      <span className="sl-label">{label}</span>
      <span className="sl-value" style={{color}}>{format ? format(v) : `${v}${unit}`}</span>
      <div className="sl-track">
        <div className="sl-rail"/>
        <div className="sl-fill" style={{width: pct+'%', background: color}}/>
        <input type="range" min={min} max={max} step={step} value={v} onChange={e=>setV(+e.target.value)} />
      </div>
    </div>
  );
}

function RowConfigCard({ row, initialStage = 'fructificacio', currentHumidity = 42 }) {
  const [stage, setStage] = useStateCtrl(initialStage);
  const [auto, setAuto]   = useStateCtrl(true);
  const preset = STAGE_PRESETS[stage];
  const needs = currentHumidity < preset.trigger;
  const statusClass = needs ? 'critical' : 'ok';
  const statusText = needs
    ? `${currentHumidity}% — Per sota del llindar, cal regar!`
    : `${currentHumidity}% — Humitat correcta, descansant`;
  return (
    <div className="row-config-card" style={{ '--row-accent': row.accent }}>
      <div className="row-config-header">
        <div className="row-config-title">
          <span className="row-badge">{row.badge}</span>
          <span className="row-name">{row.name}</span>
        </div>
        <div className="toggle-wrap">
          <span style={{fontSize:'0.72rem',color: auto?'var(--olive)':'var(--text-tertiary)'}}>{auto?'Auto':'Manual'}</span>
          <Toggle active={auto} onChange={setAuto}/>
        </div>
      </div>

      <GrowthStageSelector row={row} value={stage} onChange={setStage}/>

      <div className="slider-group">
        <LabeledSlider key={`t-${stage}`} label="💧 Regar quan <" value={preset.trigger}  min={15} max={70} color="#B33A3A" unit="%" />
        <LabeledSlider key={`d-${stage}`} label="⏱ Durada del reg"   value={preset.duration} min={30} max={360} step={15} color="#3B7A8C"
                       format={m => m >= 60 ? (m/60).toFixed(1).replace('.0','') + 'h' : m + ' min'} />
        <LabeledSlider key={`r-${stage}`} label="😴 Descans entre regs" value={preset.rest} min={4} max={72} step={2} color="#8B6A3E" unit="h" />
      </div>

      <div className="row-status">
        <span className={`status-dot ${statusClass}`}/>
        <span>{statusText}</span>
      </div>
    </div>
  );
}

Object.assign(window, { Toggle, GrowthStageSelector, LabeledSlider, RowConfigCard, STAGE_PRESETS });
