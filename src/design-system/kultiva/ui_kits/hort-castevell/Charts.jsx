const { useState: useStateChart } = React;

// Fake 24h history — one point every 60 min per row. F1 recovery, F3 crash.
const HISTORY = {
  labels: ['18:00','19','20','21','22','23','00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17'],
  rows: [
    { id: 1, acc: '#4E7A48', pts: [58,56,55,54,52,51,50,49,49,49,50,52,55,59,63,66,68,69,68,66,64,62,60,62] },
    { id: 2, acc: '#3B7A8C', pts: [62,61,60,58,56,54,52,50,49,48,47,47,47,46,45,44,43,42,42,41,41,40,40,40] },
    { id: 3, acc: '#C4673D', pts: [48,45,42,39,37,35,33,31,30,29,29,28,28,27,26,25,24,23,22,22,22,22,21,21] },
    { id: 4, acc: '#8B6A3E', pts: [72,72,71,70,70,70,69,69,68,68,67,67,67,70,75,80,84,86,87,87,86,85,84,85] },
  ],
};

function HumidityChart() {
  const [hours, setHours] = useStateChart(24);
  const W = 880, H = 250, PAD = 28;
  const labels = HISTORY.labels;
  const xs = labels.map((_, i) => PAD + (i / (labels.length - 1)) * (W - PAD * 2));
  const yFor = v => H - PAD - (v / 100) * (H - PAD * 2);

  return (
    <section className="chart-panel">
      <div className="panel-header">
        <h2 className="panel-title">Historial d'humitat</h2>
        <div className="period-tabs">
          {[{l:'24h',v:24},{l:'3d',v:72},{l:'7d',v:168}].map(p => (
            <button key={p.v} className={`btn-period ${hours===p.v?'active':''}`} onClick={()=>setHours(p.v)}>{p.l}</button>
          ))}
        </div>
      </div>
      <div className="chart-container">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none">
          {/* horizontal grid */}
          {[0,25,50,75,100].map(y => (
            <g key={y}>
              <line x1={PAD} y1={yFor(y)} x2={W-PAD} y2={yFor(y)} stroke="rgba(0,0,0,0.04)"/>
              <text x={PAD-6} y={yFor(y)+3} fill="#A69C89" fontSize="10" fontFamily="Outfit" textAnchor="end">{y}%</text>
            </g>
          ))}
          {/* x labels — every 4h */}
          {labels.map((l, i) => i % 4 === 0 && (
            <text key={i} x={xs[i]} y={H-10} fill="#A69C89" fontSize="10" fontFamily="Outfit" textAnchor="middle">{l}</text>
          ))}
          {/* F1 fill area */}
          {(() => {
            const r = HISTORY.rows[0];
            const d = r.pts.map((v,i) => `${i===0?'M':'L'}${xs[i]} ${yFor(v)}`).join(' ');
            const closed = `${d} L${xs[xs.length-1]} ${H-PAD} L${xs[0]} ${H-PAD} Z`;
            return <path d={closed} fill="rgba(78,122,72,0.10)" />;
          })()}
          {/* lines */}
          {HISTORY.rows.map(r => {
            const d = r.pts.map((v,i) => `${i===0?'M':'L'}${xs[i]} ${yFor(v)}`).join(' ');
            return <path key={r.id} d={d} stroke={r.acc} strokeWidth="2" fill="none"
                         strokeLinecap="round" strokeLinejoin="round"/>;
          })}
          {/* threshold line — critical 25% */}
          <line x1={PAD} y1={yFor(25)} x2={W-PAD} y2={yFor(25)}
                stroke="#B33A3A" strokeWidth="1" strokeDasharray="3 4" opacity=".4"/>
          <text x={W-PAD-4} y={yFor(25)-4} fill="#B33A3A" fontSize="9"
                fontFamily="Outfit" textAnchor="end" opacity=".7">llindar crític</text>
        </svg>
      </div>
      <div className="chart-legend">
        {HISTORY.rows.map((r, i) => (
          <span key={r.id} className="legend-item">
            <span className="legend-dot" style={{background: r.acc}} />
            {ROWS[i].badge} {ROWS[i].name}
          </span>
        ))}
      </div>
    </section>
  );
}

function IrrigationLog({ entries = [] }) {
  return (
    <section className="log-panel">
      <div className="panel-header">
        <h2 className="panel-title">Registre de reg</h2>
      </div>
      <div className="log-body">
        {entries.length === 0 ? (
          <div className="log-empty-state">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <path d="M24 6 C24 6 10 20 10 30 C10 38 16 44 24 44 C32 44 38 38 38 30 C38 20 24 6 24 6Z" opacity="0.3"/>
              <path d="M18 28 Q24 22 30 28"/>
              <circle cx="19" cy="34" r="1.5" fill="currentColor" stroke="none" opacity="0.4"/>
            </svg>
            <p>Encara sense registres de reg</p>
            <span>Els regs apareixeran aquí quan s'activin les vàlvules</span>
          </div>
        ) : (
          <ul className="irr-list">
            {entries.map((e, i) => (
              <li key={i} className="irr-row">
                <span className="irr-badge" style={{background: e.accent}}>{e.badge}</span>
                <span className="irr-msg">{e.msg}</span>
                <span className="irr-time">{e.time}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

Object.assign(window, { HumidityChart, IrrigationLog });
