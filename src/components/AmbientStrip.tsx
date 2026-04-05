import { useHortStore } from '../lib/store'

function fmtLux(lux: number) {
  return lux >= 10000 ? (lux / 1000).toFixed(0) + 'k lux' : Math.round(lux) + ' lux'
}

export default function AmbientStrip() {
  const ambient = useHortStore(s => s.reading?.ambient)

  return (
    <section className="ambient-strip" aria-label="Sensors ambientals">
      <div className="ambient-card ambient-temp">
        <div className="ambient-card-inner">
          <svg className="ambient-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z"/>
            <circle cx="11.5" cy="17.5" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
          <div className="ambient-data">
            <span className="ambient-val">{ambient?.temperature != null ? ambient.temperature + '°C' : '—'}</span>
            <span className="ambient-lbl">Temperatura</span>
          </div>
        </div>
      </div>
      <div className="ambient-card ambient-hum">
        <div className="ambient-card-inner">
          <svg className="ambient-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
          <div className="ambient-data">
            <span className="ambient-val">{ambient?.humidity != null ? ambient.humidity + '%' : '—'}</span>
            <span className="ambient-lbl">Humitat aire</span>
          </div>
        </div>
      </div>
      <div className="ambient-card ambient-lux">
        <div className="ambient-card-inner">
          <svg className="ambient-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
          <div className="ambient-data">
            <span className="ambient-val">{ambient?.lux != null ? fmtLux(ambient.lux) : '—'}</span>
            <span className="ambient-lbl">Llum solar</span>
          </div>
        </div>
      </div>
    </section>
  )
}
