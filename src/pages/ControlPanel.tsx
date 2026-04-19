import { useEffect, useRef, useState } from 'react'
import { useLatestReading } from '../hooks/useLatestReading'
import { useConfig, type Config, type RowConfig as RowCfg, type GrowthStage } from '../hooks/useConfig'
import { useHortStore } from '../lib/store'
import { ROWS } from '../lib/constants'
import Header from '../components/Header'
import Footer from '../components/Footer'
import '../styles/control.css'

/* ==================== STAGES METADATA ==================== */

interface StageMeta {
  id: GrowthStage
  name: string
  duration: string
  desc: string
  defaults: { threshold: number; duration: number; rest: number }
  comfort: [number, number]
}

const STAGES: StageMeta[] = [
  {
    id: 'vegetatiu',
    name: 'Vegetatiu',
    duration: '3–4 setmanes',
    desc: 'Creixement ràpid de fulles. Necessita humitat constant i estable.',
    defaults: { threshold: 55, duration: 60, rest: 12 },
    comfort: [50, 65],
  },
  {
    id: 'floracio',
    name: 'Floració',
    duration: '2–3 setmanes',
    desc: "Formació de flors. Evitar estrès hídric però permet lleuger assecat.",
    defaults: { threshold: 50, duration: 75, rest: 16 },
    comfort: [45, 60],
  },
  {
    id: 'fructificacio',
    name: 'Fructificació',
    duration: '3–5 setmanes',
    desc: "Els fruits es formen i engrandeixen. Pic de demanda d'aigua.",
    defaults: { threshold: 50, duration: 90, rest: 12 },
    comfort: [45, 60],
  },
  {
    id: 'maduracio',
    name: 'Maduració',
    duration: '2–3 setmanes',
    desc: 'Els fruits maduren. Menys aigua per concentrar sabors.',
    defaults: { threshold: 40, duration: 60, rest: 24 },
    comfort: [35, 50],
  },
]

/* ==================== STAGE ICONS ==================== */

function StageIcon({ stage }: { stage: GrowthStage }) {
  if (stage === 'vegetatiu')
    return (
      <svg viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 32 V 14" />
        <path d="M19 22 C 12 22 9 18 8 12 C 14 12 18 14 19 22 Z" fill="currentColor" fillOpacity=".15" />
        <path d="M19 18 C 26 18 29 15 30 10 C 24 10 20 12 19 18 Z" fill="currentColor" fillOpacity=".15" />
      </svg>
    )
  if (stage === 'floracio')
    return (
      <svg viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="19" cy="18" r="2.5" fill="currentColor" fillOpacity=".3" />
        <path d="M19 15.5 C 19 11 17 9 14 9 C 12 11 13 14 19 15.5 Z" fill="currentColor" fillOpacity=".12" />
        <path d="M19 15.5 C 19 11 21 9 24 9 C 26 11 25 14 19 15.5 Z" fill="currentColor" fillOpacity=".12" />
        <path d="M16.5 18 C 12 18 10 20 10 23 C 12 25 15 24 16.5 18 Z" fill="currentColor" fillOpacity=".12" />
        <path d="M21.5 18 C 26 18 28 20 28 23 C 26 25 23 24 21.5 18 Z" fill="currentColor" fillOpacity=".12" />
        <path d="M19 20 V 30" />
      </svg>
    )
  if (stage === 'fructificacio')
    return (
      <svg viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="17" cy="22" r="6" fill="currentColor" fillOpacity=".15" />
        <path d="M17 16 C 15 12 12 11 10 11 C 10 13 11 15 17 16 Z" fill="currentColor" fillOpacity=".2" />
        <path d="M17 16 C 19 12 22 11 24 11 C 24 13 23 15 17 16 Z" fill="currentColor" fillOpacity=".2" />
        <path d="M17 16 V 18" />
        <path d="M20 27 Q 22 26 23 24" opacity=".5" />
      </svg>
    )
  return (
    <svg viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="19" cy="22" r="7" fill="currentColor" fillOpacity=".3" />
      <path d="M19 15 C 17 11 14 10 12 10 C 12 12 13 14 19 15 Z" fill="currentColor" fillOpacity=".25" />
      <path d="M19 15 V 17" />
      <path d="M22 27 Q 24 25 25 23" opacity=".55" />
      <path d="M14 24 Q 15 26 16 27" opacity=".35" />
    </svg>
  )
}

/* ==================== HELPERS ==================== */

function formatDur(m: number): string {
  if (m < 60) return `${m}`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r === 0 ? `${h}h` : `${h}h ${r}m`
}

/* ==================== BIG TOGGLE ==================== */

function BigToggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button type="button" className={`kv-bigtoggle ${on ? 'on' : ''}`} onClick={onChange} aria-pressed={on}>
      <div className="kv-bigtoggle-thumb">
        <svg className="on-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7l3 3 5-6" />
        </svg>
        <svg className="off-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round">
          <path d="M4 4l6 6M10 4l-6 6" />
        </svg>
      </div>
    </button>
  )
}

/* ==================== SLIDER ==================== */

interface SliderProps {
  label: string
  hint: string
  min: number
  max: number
  step?: number
  value: number
  unit?: string
  cap?: string
  comfort?: [number, number]
  formatVal?: (v: number) => string
  onChange: (v: number) => void
}

function Slider({ label, hint, min, max, step = 1, value, unit = '', cap, comfort, formatVal, onChange }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const pct = ((value - min) / (max - min)) * 100
  const comfortLeft = comfort ? ((comfort[0] - min) / (max - min)) * 100 : 0
  const comfortRight = comfort ? ((comfort[1] - min) / (max - min)) * 100 : 0

  const handlePointer = (e: React.PointerEvent) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const apply = (clientX: number) => {
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const v = Math.round((min + x * (max - min)) / step) * step
      onChange(v)
    }
    apply(e.clientX)
    const move = (ev: PointerEvent) => apply(ev.clientX)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const disp = formatVal ? formatVal(value) : String(value)

  return (
    <div className="kv-slider">
      <div className="kv-slider-left">
        <span>{label}</span>
        <span className="kv-slider-left-hint">{hint}</span>
      </div>
      <div className="kv-slider-track-wrap" ref={trackRef} onPointerDown={handlePointer}>
        <div className="kv-slider-track">
          {comfort && (
            <div className="kv-slider-comfort" style={{ left: `${comfortLeft}%`, width: `${comfortRight - comfortLeft}%` }} />
          )}
          <div className="kv-slider-fill" style={{ width: `${pct}%` }} />
          <div className="kv-slider-thumb" style={{ left: `${pct}%` }} />
        </div>
      </div>
      <div className="kv-slider-right">
        <span className="kv-slider-val">
          {disp}
          <span className="kv-slider-val-unit">{unit}</span>
        </span>
        {cap && <span className="kv-slider-cap">{cap}</span>}
      </div>
    </div>
  )
}

/* ==================== ROW CONFIG CARD ==================== */

function RowConfigCard({ rowCfg, rowConst, currentHumidity, onChange }: {
  rowCfg: RowCfg
  rowConst: typeof ROWS[0]
  currentHumidity: number | null
  onChange: (updated: RowCfg) => void
}) {
  const currentStage = STAGES.find(s => s.id === rowCfg.growth_stage) || STAGES[0]
  const hum = currentHumidity ?? -1
  const humState = hum < 0
    ? 'warn'
    : hum >= currentStage.comfort[0]
      ? 'ok'
      : hum >= currentStage.comfort[0] - 10
        ? 'warn'
        : 'critical'

  const changeStage = (newStage: GrowthStage) => {
    const defs = STAGES.find(s => s.id === newStage)!.defaults
    onChange({
      ...rowCfg,
      growth_stage: newStage,
      trigger_below: defs.threshold,
      irrigation_duration_min: defs.duration,
      min_rest_hours: defs.rest,
    })
  }

  const mode = rowCfg.auto_irrigation ? 'auto' : 'manual'

  return (
    <article className="kv-rc" style={{ '--row-accent': rowConst.accent } as React.CSSProperties}>
      {/* A — Header */}
      <div className="kv-rc-head">
        <div>
          <div className="kv-rc-title">
            <span className="kv-rc-badge">{rowConst.badge}</span>
            <span className="kv-rc-name">{rowCfg.name}</span>
          </div>
          <div className="kv-rc-sub">{rowConst.crops.replace('+', ' + ')}</div>
        </div>
        <div className="kv-segtoggle">
          <button type="button" className={mode === 'auto' ? 'active' : ''} onClick={() => onChange({ ...rowCfg, auto_irrigation: true })}>
            Auto
          </button>
          <button type="button" className={mode === 'manual' ? 'active' : ''} onClick={() => onChange({ ...rowCfg, auto_irrigation: false })}>
            Manual
          </button>
        </div>
      </div>

      {/* B — Growth stage */}
      <div className="kv-stage">
        <div className="kv-stage-label">Fase de creixement</div>
        <div className="kv-stages">
          {STAGES.map(s => (
            <div
              key={s.id}
              className={`kv-stage-card ${rowCfg.growth_stage === s.id ? 'active' : ''}`}
              onClick={() => changeStage(s.id)}
              role="button"
              tabIndex={0}
            >
              <div className="kv-stage-check">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7l3 3 5-6" />
                </svg>
              </div>
              <div className="kv-stage-icon"><StageIcon stage={s.id} /></div>
              <div className="kv-stage-name">{s.name}</div>
              <div className="kv-stage-dur">{s.duration}</div>
            </div>
          ))}
        </div>
      </div>

      {/* C — Sliders */}
      <div className="kv-sliders">
        <Slider
          label="Llindar d'humitat"
          hint="Si baixa d'aquí, es rega"
          min={0} max={100} step={1}
          value={rowCfg.trigger_below}
          unit="%"
          cap="Sota aquest valor, la vàlvula s'obre"
          comfort={currentStage.comfort}
          onChange={v => onChange({ ...rowCfg, trigger_below: v })}
        />
        <Slider
          label="Durada del reg"
          hint="Obertura de la vàlvula"
          min={15} max={180} step={5}
          value={rowCfg.irrigation_duration_min}
          unit=" min"
          cap="Temps total que la vàlvula roman oberta"
          formatVal={formatDur}
          onChange={v => onChange({ ...rowCfg, irrigation_duration_min: v })}
        />
        <Slider
          label="Descans entre regs"
          hint="Mínim entre dos regs"
          min={4} max={72} step={1}
          value={rowCfg.min_rest_hours}
          unit="h"
          cap="Evita sobrereg — no es rega durant aquest temps"
          onChange={v => onChange({ ...rowCfg, min_rest_hours: v })}
        />
      </div>

      {/* D — Status footer */}
      <div className="kv-rc-foot">
        <div className="kv-rc-foot-group">
          <span className="kv-rc-foot-item">
            <span className={`kv-rc-foot-dot ${humState}`} />
            Humitat actual
            <span className="kv-rc-foot-val" style={{ marginLeft: 4 }}>
              {currentHumidity !== null ? `${currentHumidity}%` : '—'}
            </span>
          </span>
          <span className="kv-rc-foot-item">
            Proper reg
            <span className="kv-rc-foot-val" style={{ marginLeft: 4 }}>
              {currentHumidity !== null && currentHumidity < rowCfg.trigger_below
                ? 'imminent'
                : `descans ${rowCfg.min_rest_hours}h`}
            </span>
          </span>
        </div>
      </div>
    </article>
  )
}

/* ==================== SAVE BAR ==================== */

function SaveBar({ count, saving, saved, onSave, onDiscard }: {
  count: number
  saving: boolean
  saved: boolean
  onSave: () => void
  onDiscard: () => void
}) {
  const visible = count > 0 || saved
  return (
    <div className={`kv-savebar ${visible ? 'visible' : ''} ${saved ? 'saved' : ''}`}>
      <div className="kv-savebar-text">
        <span className="kv-savebar-count">{saved ? 'Desat correctament' : 'Canvis pendents'}</span>
        <span className="kv-savebar-msg">
          {saved ? 'Desat · fa un instant' : `Tens ${count} ${count === 1 ? 'canvi' : 'canvis'} sense guardar`}
        </span>
      </div>
      <div className="kv-savebar-actions">
        <button className="kv-savebar-btn ghost" onClick={onDiscard} disabled={saving}>
          Descartar
        </button>
        <button className="kv-savebar-btn primary" onClick={onSave} disabled={saving}>
          {saving ? 'Guardant…' : 'Guardar canvis'}
        </button>
      </div>
    </div>
  )
}

/* ==================== PAGE ==================== */

export default function ControlPanel() {
  useLatestReading()
  const reading = useHortStore(s => s.reading)
  const { config, loading, saving, saveConfig } = useConfig()
  const [draft, setDraft] = useState<Config | null>(null)
  const [originalJson, setOriginalJson] = useState<string>('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (config && !draft) {
      setDraft(config)
      setOriginalJson(JSON.stringify(config))
    }
  }, [config, draft])

  if (loading || !draft) {
    return (
      <>
        <Header />
        <main className="kv-ctrl-main">
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
            Carregant configuració…
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const currentJson = JSON.stringify(draft)
  const hasChanges = currentJson !== originalJson
  const changesCount = hasChanges ? countChanges(draft, JSON.parse(originalJson) as Config) : 0

  function updateRow(index: number, updated: RowCfg) {
    if (!draft) return
    const newRows = [...draft.rows]
    newRows[index] = updated
    setDraft({ ...draft, rows: newRows })
    setSaved(false)
  }

  function updateGlobal<K extends keyof Config['global']>(key: K, value: Config['global'][K]) {
    if (!draft) return
    setDraft({ ...draft, global: { ...draft.global, [key]: value } })
    setSaved(false)
  }

  async function handleSave() {
    if (!draft) return
    await saveConfig(draft)
    setOriginalJson(JSON.stringify(draft))
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  function handleDiscard() {
    setDraft(JSON.parse(originalJson) as Config)
    setSaved(false)
  }

  const bestHourStr = `${String(draft.global.best_irrigation_hour).padStart(2, '0')}:00`

  return (
    <>
      <Header />
      <main className="kv-ctrl-main">
        <div className="kv-page-head">
          <h1 className="kv-page-title">Control</h1>
          <span className="kv-page-sub">
            {changesCount > 0 ? `${changesCount} canvis sense guardar` : 'Configuració sincronitzada'}
          </span>
        </div>

        {/* Global settings */}
        <div className="kv-gs">
          <div className="kv-gs-col">
            <div className="kv-gs-label">Reg automàtic</div>
            <div className="kv-gs-title">
              <BigToggle
                on={draft.global.irrigation_enabled}
                onChange={() => updateGlobal('irrigation_enabled', !draft.global.irrigation_enabled)}
              />
              <span className={`kv-bigtoggle-state ${draft.global.irrigation_enabled ? 'on' : 'off'}`}>
                {draft.global.irrigation_enabled ? 'Activat' : 'Desactivat'}
              </span>
            </div>
            <div className="kv-gs-help">
              El sistema rega automàticament quan detecta sòl sec segons els llindars configurats a cada fila.
            </div>
          </div>

          <div className="kv-gs-col">
            <div className="kv-gs-label">Interval de lectura</div>
            <div className="kv-interval-row">
              <span className="kv-interval-val">
                {draft.global.reading_interval_min}
                <span className="kv-interval-val-unit">min</span>
              </span>
              <IntervalSlider
                value={draft.global.reading_interval_min}
                onChange={v => updateGlobal('reading_interval_min', v)}
              />
            </div>
            <div className="kv-presets">
              {[15, 30, 60].map(p => (
                <button
                  key={p}
                  type="button"
                  className={`kv-preset ${draft.global.reading_interval_min === p ? 'active' : ''}`}
                  onClick={() => updateGlobal('reading_interval_min', p)}
                >
                  {p} min
                </button>
              ))}
            </div>
            <div className="kv-gs-help">
              Cada quant els sensors envien lectures al servidor. Més freqüent = més dades, més bateria consumida.
            </div>
          </div>

          <div className="kv-gs-col">
            <div className="kv-gs-label">Millor hora per regar</div>
            <div className="kv-clock">
              <input
                type="time"
                className="kv-clock-input"
                value={bestHourStr}
                onChange={e => {
                  const h = parseInt(e.target.value.split(':')[0] || '8', 10)
                  updateGlobal('best_irrigation_hour', h)
                }}
              />
            </div>
            <div className="kv-gs-help">
              Les plantes absorbeixen millor a primera hora del matí i al capvespre. Evita el migdia.
            </div>
          </div>
        </div>

        {/* Row configs */}
        <div className="kv-rows">
          {draft.rows.map((rowCfg, i) => {
            const node = reading?.nodes.find(n => n.id === rowCfg.id)
            return (
              <RowConfigCard
                key={rowCfg.id}
                rowCfg={rowCfg}
                rowConst={ROWS[i]}
                currentHumidity={node?.humidity_pct ?? null}
                onChange={(updated) => updateRow(i, updated)}
              />
            )
          })}
        </div>
      </main>

      <SaveBar
        count={changesCount}
        saving={saving}
        saved={saved}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />

      <Footer />
    </>
  )
}

/* ==================== INTERVAL SLIDER (inline, simple) ==================== */

function IntervalSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const min = 5, max = 60
  const pct = ((value - min) / (max - min)) * 100

  const handlePointer = (e: React.PointerEvent) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const apply = (clientX: number) => {
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const v = Math.round(min + x * (max - min))
      onChange(v)
    }
    apply(e.clientX)
    const move = (ev: PointerEvent) => apply(ev.clientX)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div className="kv-hslider" ref={trackRef} onPointerDown={handlePointer}>
      <div className="kv-hslider-rail">
        <div className="kv-hslider-fill" style={{ width: `${pct}%` }} />
        <div className="kv-hslider-thumb" style={{ left: `${pct}%` }} />
      </div>
    </div>
  )
}

/* ==================== COUNT CHANGES ==================== */

function countChanges(draft: Config, original: Config): number {
  let count = 0
  ;(['irrigation_enabled', 'reading_interval_min', 'best_irrigation_hour'] as const).forEach(key => {
    if (draft.global[key] !== original[key]) count++
  })
  draft.rows.forEach((row, i) => {
    const orig = original.rows[i]
    if (!orig) { count++; return }
    ;(['auto_irrigation', 'trigger_below', 'irrigation_duration_min', 'min_rest_hours', 'growth_stage'] as const).forEach(key => {
      if (row[key] !== orig[key]) count++
    })
  })
  return count
}
