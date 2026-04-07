import { useState, useEffect } from 'react'
import { useLatestReading } from '../hooks/useLatestReading'
import { useConfig, type Config, type RowConfig as RowCfg, type GrowthStage } from '../hooks/useConfig'
import { useHortStore } from '../lib/store'
import { ROWS } from '../lib/constants'
import Header from '../components/Header'
import Footer from '../components/Footer'
import '../styles/dashboard.css'
import '../styles/control.css'

// Presets per fase de creixement (basats en estudis científics)
// Cicle sec-mullat: rega quan baixa del trigger, durada fixa, descans entre regs
const STAGE_PRESETS: Record<GrowthStage, { label: string; icon: string; trigger: number; duration: number; rest: number; description: string }> = {
  vegetatiu: { label: 'Creixement', icon: '🌱', trigger: 50, duration: 90, rest: 12, description: 'Tolera sequera moderada, reg cada 12-24h' },
  floracio: { label: 'Floració', icon: '🌸', trigger: 55, duration: 120, rest: 8, description: 'Sensible! No deixar assecar, reg freqüent' },
  fructificacio: { label: 'Fructificació', icon: '🍅', trigger: 45, duration: 120, rest: 24, description: 'Cicle sec-mullat millora el sabor' },
  maduracio: { label: 'Maduració', icon: '🔴', trigger: 40, duration: 90, rest: 36, description: 'Estrès hídric controlat = més dolç i aromàtic' },
}

const STAGES: GrowthStage[] = ['vegetatiu', 'floracio', 'fructificacio', 'maduracio']

function RowConfigCard({ rowCfg, rowConst, currentHumidity, onChange }: {
  rowCfg: RowCfg
  rowConst: typeof ROWS[0]
  currentHumidity: number | null
  onChange: (updated: RowCfg) => void
}) {
  const needsWater = currentHumidity !== null && currentHumidity < rowCfg.trigger_below
  const statusClass = currentHumidity === null ? '' : needsWater ? 'critical' : 'ok'
  const statusText = currentHumidity === null ? 'Sense dades' :
    needsWater ? `${currentHumidity}% — Per sota del llindar, cal regar!` :
    `${currentHumidity}% — Humitat correcta, descansant`

  return (
    <div className="row-config-card" style={{ '--row-accent': rowConst.accent } as React.CSSProperties}>
      <div className="row-config-header">
        <div className="row-config-title">
          <span className="row-badge">{rowConst.badge}</span>
          <span className="row-name">{rowCfg.name}</span>
        </div>
        <div className="toggle-wrap">
          <span style={{ fontSize: '0.7rem', color: rowCfg.auto_irrigation ? '#4E7A48' : '#8a7e6b' }}>
            {rowCfg.auto_irrigation ? 'Auto' : 'Manual'}
          </span>
          <button
            className={`toggle ${rowCfg.auto_irrigation ? 'active' : ''}`}
            onClick={() => onChange({ ...rowCfg, auto_irrigation: !rowCfg.auto_irrigation })}
          />
        </div>
      </div>

      {/* Growth stage selector */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 500, color: '#7A6F5E', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
          Fase de creixement
        </div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {STAGES.map(stage => {
            const preset = STAGE_PRESETS[stage]
            const isActive = rowCfg.growth_stage === stage
            return (
              <button
                key={stage}
                onClick={() => {
                  onChange({
                    ...rowCfg,
                    growth_stage: stage,
                    trigger_below: preset.trigger,
                    irrigation_duration_min: preset.duration,
                    min_rest_hours: preset.rest,
                  })
                }}
                style={{
                  flex: 1,
                  padding: '0.45rem 0.3rem',
                  border: isActive ? `2px solid ${rowConst.accent}` : '1px solid #DDD4C0',
                  borderRadius: '8px',
                  background: isActive ? rowConst.accent + '15' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                <div style={{ fontSize: '1rem', lineHeight: 1 }}>{preset.icon}</div>
                <div style={{
                  fontSize: '0.55rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#3A3225' : '#8a7e6b',
                  marginTop: '0.15rem',
                }}>
                  {preset.label}
                </div>
              </button>
            )
          })}
        </div>
        <div style={{
          fontSize: '0.65rem',
          color: '#8a7e6b',
          fontStyle: 'italic',
          marginTop: '0.35rem',
        }}>
          💡 {STAGE_PRESETS[rowCfg.growth_stage].description}
        </div>
      </div>

      <div className="slider-group">
        <div className="slider-item">
          <span className="slider-label">💧 Regar quan &lt;</span>
          <span className="slider-value-display" style={{ color: '#B33A3A' }}>{rowCfg.trigger_below}%</span>
          <input
            type="range"
            min={15}
            max={70}
            value={rowCfg.trigger_below}
            onChange={e => onChange({ ...rowCfg, trigger_below: +e.target.value })}
          />
        </div>
        <div className="slider-item">
          <span className="slider-label">⏱ Durada del reg</span>
          <span className="slider-value-display" style={{ color: '#3B7A8C' }}>{rowCfg.irrigation_duration_min >= 60 ? (rowCfg.irrigation_duration_min / 60).toFixed(1).replace('.0', '') + 'h' : rowCfg.irrigation_duration_min + ' min'}</span>
          <input
            type="range"
            min={30}
            max={360}
            step={15}
            value={rowCfg.irrigation_duration_min}
            onChange={e => onChange({ ...rowCfg, irrigation_duration_min: +e.target.value })}
          />
        </div>
        <div className="slider-item">
          <span className="slider-label">😴 Descans entre regs</span>
          <span className="slider-value-display" style={{ color: '#8B6A3E' }}>{rowCfg.min_rest_hours}h</span>
          <input
            type="range"
            min={4}
            max={72}
            step={2}
            value={rowCfg.min_rest_hours}
            onChange={e => onChange({ ...rowCfg, min_rest_hours: +e.target.value })}
          />
        </div>
      </div>

      <div className="row-status">
        <div className="status-item">
          <span className={`status-dot ${statusClass}`} />
          <span>{statusText}</span>
        </div>
      </div>
    </div>
  )
}

export default function ControlPanel() {
  useLatestReading()
  const reading = useHortStore(s => s.reading)
  const { config, loading, saving, saveConfig } = useConfig()
  const [draft, setDraft] = useState<Config | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (config && !draft) {
      setDraft(config)
    }
  }, [config, draft])

  if (loading || !draft) {
    return (
      <>
        <Header />
        <main className="control-main">
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8a7e6b' }}>Carregant configuració...</div>
        </main>
      </>
    )
  }

  function updateRow(index: number, updated: RowCfg) {
    if (!draft) return
    const newRows = [...draft.rows]
    newRows[index] = updated
    setDraft({ ...draft, rows: newRows })
    setHasChanges(true)
  }

  function updateGlobal(key: string, value: any) {
    if (!draft) return
    setDraft({ ...draft, global: { ...draft.global, [key]: value } })
    setHasChanges(true)
  }

  async function handleSave() {
    if (!draft) return
    await saveConfig(draft)
    setHasChanges(false)
  }

  return (
    <>
      <Header />
      <main className="control-main">
        {/* Global settings */}
        <div className="global-panel">
          <div className="global-header">
            <span className="global-title">Configuració general</span>
            <div className="toggle-wrap">
              <span style={{ fontSize: '0.75rem', color: draft.global.irrigation_enabled ? '#4E7A48' : '#B33A3A', fontWeight: 600 }}>
                {draft.global.irrigation_enabled ? '✓ Reg automàtic activat' : '✗ Reg automàtic desactivat'}
              </span>
              <button
                className={`toggle ${draft.global.irrigation_enabled ? 'active' : ''}`}
                onClick={() => updateGlobal('irrigation_enabled', !draft.global.irrigation_enabled)}
              />
            </div>
          </div>

          <div className="global-settings">
            <div className="setting-item">
              <span className="setting-label">Interval de lectura</span>
              <div className="setting-value">
                <input
                  type="number"
                  value={draft.global.reading_interval_min}
                  min={5}
                  max={120}
                  onChange={e => updateGlobal('reading_interval_min', +e.target.value)}
                />
                <span className="setting-unit">minuts</span>
              </div>
            </div>
            <div className="setting-item">
              <span className="setting-label">Millor hora per regar</span>
              <div className="setting-value">
                <input
                  type="number"
                  value={draft.global.best_irrigation_hour}
                  min={0}
                  max={23}
                  onChange={e => updateGlobal('best_irrigation_hour', +e.target.value)}
                />
                <span className="setting-unit">h (matí recomanat)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section divider */}
        <div className="section-divider">
          <span className="divider-line" />
          <span className="divider-label">Llindars per fila</span>
          <span className="divider-line" />
        </div>

        {/* Row configs */}
        <div className="rows-grid">
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

        {/* Save bar */}
        {hasChanges && (
          <div className="save-bar">
            <span className="save-bar-text">Tens canvis sense guardar</span>
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardant...' : '💾 Guardar configuració'}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
