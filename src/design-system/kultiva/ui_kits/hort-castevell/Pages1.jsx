function DashboardPage({ online, lastUpdate, onNavigate, nodes, ambient }) {
  return (
    <>
      <Header activePage="dashboard" online={online} lastUpdate={lastUpdate} onNavigate={onNavigate}/>
      <main className="dashboard-main">
        <AmbientStrip {...ambient}/>
        <SectionDivider label="Nodes de la finca"/>
        <NodesGrid nodes={nodes}/>
        <HumidityChart/>
        <IrrigationLog entries={[]}/>
      </main>
      <Footer/>
    </>
  );
}

function ControlPage({ online, lastUpdate, onNavigate, nodes }) {
  const [autoIrr, setAutoIrr] = React.useState(true);
  const [interval, setInterval] = React.useState(15);
  const [bestHour, setBestHour] = React.useState(7);
  const [changed, setChanged] = React.useState(false);
  const [saving, setSaving]   = React.useState(false);
  const stages = ['vegetatiu','floracio','fructificacio','maduracio'];
  return (
    <>
      <Header activePage="control" online={online} lastUpdate={lastUpdate} onNavigate={onNavigate}/>
      <main className="control-main">
        <div className="global-panel">
          <div className="global-header">
            <span className="global-title">Configuració general</span>
            <div className="toggle-wrap">
              <span style={{fontSize:'0.78rem', color: autoIrr?'var(--olive)':'var(--critical)', fontWeight:600}}>
                {autoIrr? '✓ Reg automàtic activat' : '✗ Reg automàtic desactivat'}
              </span>
              <Toggle active={autoIrr} onChange={v=>{setAutoIrr(v); setChanged(true);}}/>
            </div>
          </div>
          <div className="global-settings">
            <div className="setting-item">
              <span className="setting-label">Interval de lectura</span>
              <div className="setting-value">
                <input type="number" min={5} max={120} value={interval} onChange={e=>{setInterval(+e.target.value); setChanged(true);}}/>
                <span className="setting-unit">minuts</span>
              </div>
            </div>
            <div className="setting-item">
              <span className="setting-label">Millor hora per regar</span>
              <div className="setting-value">
                <input type="number" min={0} max={23} value={bestHour} onChange={e=>{setBestHour(+e.target.value); setChanged(true);}}/>
                <span className="setting-unit">h (matí recomanat)</span>
              </div>
            </div>
          </div>
        </div>

        <SectionDivider label="Llindars per fila"/>

        <div className="rows-grid">
          {ROWS.map((row, i) => (
            <RowConfigCard key={row.id} row={row}
                           initialStage={stages[i % stages.length]}
                           currentHumidity={(nodes[i]||{}).humidity_pct ?? 42}/>
          ))}
        </div>

        {changed && (
          <div className="save-bar">
            <span className="save-bar-text">Tens canvis sense guardar</span>
            <button className="save-btn" disabled={saving}
              onClick={()=>{ setSaving(true); setTimeout(()=>{setSaving(false); setChanged(false);}, 700); }}>
              {saving ? 'Guardant…' : '💾 Guardar configuració'}
            </button>
          </div>
        )}
      </main>
      <Footer/>
    </>
  );
}

Object.assign(window, { DashboardPage, ControlPage });
