import type { RowConfig } from './types'

// Thresholds
export const THRESHOLD_LOW = 25   // < 25% → critical (red)
export const THRESHOLD_MED = 45   // < 45% → warning (orange)

// Bancal dimensions (cm → three.js units, 1 unit = 10cm)
export const BANCAL_W = 26   // 260cm — ample (X)
export const BANCAL_L = 67   // 670cm — llarg (Z)

// Row configurations
export const ROWS: RowConfig[] = [
  { id: 1, badge: 'F1', name: 'Enciams + Porros', crops: 'lettuce+leek', accent: '#4E7A48', accentLight: '#E8F2E5', accentHex: 0x4E7A48 },
  { id: 2, badge: 'F2', name: 'Enciams', crops: 'lettuce', accent: '#3B7A8C', accentLight: '#E0F0F4', accentHex: 0x3B7A8C },
  { id: 3, badge: 'F3', name: 'Tomàquets', crops: 'tomato', accent: '#C4673D', accentLight: '#FAE8DE', accentHex: 0xC4673D },
  { id: 4, badge: 'F4', name: 'Pebrots + Albergínies', crops: 'pepper+aubergine', accent: '#8B6A3E', accentLight: '#F3EBDD', accentHex: 0x8B6A3E },
]

// Chart colors
export const CHART_COLORS = ROWS.map(r => ({
  border: r.accent,
  bg: r.accent + '14', // ~8% opacity
}))

// Polling interval
export const REFRESH_MS = 30_000

// Soil colors for 3D
export const SOIL_DRY = 0x8B7355
export const SOIL_WET = 0x3D2B1F
