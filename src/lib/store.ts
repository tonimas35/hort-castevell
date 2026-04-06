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
  irrigating: boolean[] // [false, false, false, false] — which rows are irrigating
  expandedPanel: string | null // 'valve-0', 'sensor-2', 'central', etc.

  // Actions
  setReading: (reading: Reading) => void
  setHistory: (history: Reading[]) => void
  setConnected: (connected: boolean) => void
  selectRow: (index: number) => void
  selectValve: (index: number) => void
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
  irrigating: [false, false, false, false],
  expandedPanel: null,

  setReading: (reading) => set({ reading }),
  setHistory: (history) => set({ history }),
  setConnected: (isConnected) => set({ isConnected }),
  selectRow: (selectedRow) => set({ selectedRow }),
  selectValve: (selectedValve) => set({ selectedValve }),
  toggleIrrigation: (index) => set((state) => {
    const newIrr = [...state.irrigating]
    newIrr[index] = !newIrr[index]
    return { irrigating: newIrr, selectedValve: -1 }
  }),
  setExpandedPanel: (expandedPanel) => set({ expandedPanel }),

  getNode: (id) => get().reading?.nodes.find(n => n.id === id),
  getAmbient: () => get().reading?.ambient,
}))
