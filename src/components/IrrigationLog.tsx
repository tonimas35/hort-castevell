export default function IrrigationLog() {
  return (
    <section className="log-panel" aria-label="Registre de reg">
      <div className="panel-header">
        <h2 className="panel-title">Registre de reg</h2>
      </div>
      <div className="log-body">
        <div className="log-empty-state">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M24 6 C24 6 10 20 10 30 C10 38 16 44 24 44 C32 44 38 38 38 30 C38 20 24 6 24 6Z" opacity="0.3"/>
            <path d="M18 28 Q24 22 30 28" />
            <circle cx="19" cy="34" r="1.5" fill="currentColor" stroke="none" opacity="0.4"/>
            <circle cx="28" cy="32" r="1" fill="currentColor" stroke="none" opacity="0.3"/>
          </svg>
          <p>Encara sense registres de reg</p>
          <span>Els regs apareixeran aquí quan s'activin les vàlvules</span>
        </div>
      </div>
    </section>
  )
}
