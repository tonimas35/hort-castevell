import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type GrowthStage = 'vegetatiu' | 'floracio' | 'fructificacio' | 'maduracio'

export interface RowConfig {
  id: number
  name: string
  auto_irrigation: boolean
  trigger_below: number       // Rega quan la humitat baixa per sota d'aquest %
  irrigation_duration_min: number  // Durada del reg en minuts (temps fix)
  min_rest_hours: number      // Hores mínimes entre regs (per deixar assecar)
  growth_stage: GrowthStage
}

export interface GlobalConfig {
  irrigation_enabled: boolean
  reading_interval_min: number
  best_irrigation_hour: number
}

export interface Config {
  rows: RowConfig[]
  global: GlobalConfig
}

const DEFAULT_CONFIG: Config = {
  rows: [
    { id: 1, name: 'Enciams + Porros', auto_irrigation: true, trigger_below: 50, irrigation_duration_min: 90, min_rest_hours: 12, growth_stage: 'vegetatiu' },
    { id: 2, name: 'Enciams', auto_irrigation: true, trigger_below: 55, irrigation_duration_min: 90, min_rest_hours: 12, growth_stage: 'vegetatiu' },
    { id: 3, name: 'Tomàquets', auto_irrigation: true, trigger_below: 45, irrigation_duration_min: 120, min_rest_hours: 24, growth_stage: 'fructificacio' },
    { id: 4, name: 'Pebrots + Albergínies', auto_irrigation: true, trigger_below: 45, irrigation_duration_min: 120, min_rest_hours: 24, growth_stage: 'fructificacio' },
  ],
  global: { irrigation_enabled: true, reading_interval_min: 30, best_irrigation_hour: 8 },
}

export function useConfig() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('config')
          .select('*')
          .eq('id', 'main')
          .single()

        if (!error && data) {
          setConfig({ rows: data.rows, global: data.global })
        }
      } catch {
        // Use defaults
      }
      setLoading(false)
    }
    load()
  }, [])

  const saveConfig = useCallback(async (newConfig: Config) => {
    setSaving(true)
    setConfig(newConfig)

    try {
      await supabase
        .from('config')
        .update({
          rows: newConfig.rows,
          global: newConfig.global,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'main')
    } catch (err) {
      console.error('Error saving config:', err)
    }
    setSaving(false)
  }, [])

  return { config, loading, saving, saveConfig }
}
