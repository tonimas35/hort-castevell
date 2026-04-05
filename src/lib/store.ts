import { create } from 'zustand'
import type { Reading, NodeData, AmbientData } from './types'

interface HortStore {
  // Data
  reading: Reading | null
  history: Reading[]
  isConnected: boolean

  // 3D interaction
  selectedRow: number  // -1 = none, 0-3 = row index

  // Actions
  setReading: (reading: Reading) => void
  setHistory: (history: Reading[]) => void
  setConnected: (connected: boolean) => void
  selectRow: (index: number) => void

  // Derived helpers
  getNode: (id: number) => NodeData | undefined
  getAmbient: () => AmbientData | undefined
}

export const useHortStore = create<HortStore>((set, get) => ({
  reading: null,
  history: [],
  isConnected: false,
  selectedRow: -1,

  setReading: (reading) => set({ reading }),
  setHistory: (history) => set({ history }),
  setConnected: (isConnected) => set({ isConnected }),
  selectRow: (selectedRow) => set({ selectedRow }),

  getNode: (id) => get().reading?.nodes.find(n => n.id === id),
  getAmbient: () => get().reading?.ambient,
}))
