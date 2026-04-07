import { create } from 'zustand'
import type { Reading, NodeData, AmbientData } from './types'

interface HortStore {
  // Data
  reading: Reading | null
  history: Reading[]
  isConnected: boolean

  // 3D interaction
  selectedRow: number  // -1 = none, 0-3 = row index
  selectedValve: number // -1 = none, 0-3 = valve clicked
  selectedSensor: number // -1 = none, 0-3 = humidity sensor clicked
  irrigating: boolean[] // [false, false, false, false] — which rows are irrigating
  expandedPanel: string | null // 'valve-0', 'sensor-2', 'central', etc.

  // Actions
  setReading: (reading: Reading) => void
  setHistory: (history: Reading[]) => void
  setConnected: (connected: boolean) => void
  selectRow: (index: number) => void
  selectValve: (index: number) => void
  selectSensor: (index: number) => void
  toggleIrrigation: (index: number) => void
  setExpandedPanel: (panel: string | null) => void

  // Derived helpers
  getNode: (id: number) => NodeData | undefined
  getAmbient: () => AmbientData | undefined
}

export const useHortStore = create<HortStore>((set, get) => ({
  reading: null,
  history: [],
  isConnected: false,
  selectedRow: -1,
  selectedValve: -1,
  selectedSensor: -1,
  irrigating: [false, false, false, false],
  expandedPanel: null,

  setReading: (reading) => set({ reading }),
  setHistory: (history) => set({ history }),
  setConnected: (isConnected) => set({ isConnected }),
  selectRow: (selectedRow) => set({ selectedRow }),
  selectValve: (selectedValve) => set({ selectedValve }),
  selectSensor: (selectedSensor) => set({ selectedSensor }),
  toggleIrrigation: async (index) => {
    const state = get()
    const newIrr = [...state.irrigating]
    const wasIrrigating = newIrr[index]
    newIrr[index] = !wasIrrigating
    set({ irrigating: newIrr, selectedValve: -1 })

    // Enviar comanda real a Supabase → ESP32
    try {
      const { supabase } = await import('./supabase')
      await supabase.from('commands').insert({
        command: wasIrrigating ? 'close_valve' : 'open_valve',
        row_id: index + 1,
        params: wasIrrigating ? {} : { duration_min: 120 },
      })
      console.log(`Comanda enviada: ${wasIrrigating ? 'close' : 'open'} F${index + 1}`)
    } catch (err) {
      console.error('Error enviant comanda:', err)
    }
  },
  setExpandedPanel: (expandedPanel) => set({ expandedPanel }),

  getNode: (id) => get().reading?.nodes.find(n => n.id === id),
  getAmbient: () => get().reading?.ambient,
}))
