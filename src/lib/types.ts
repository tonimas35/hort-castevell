export interface AmbientData {
  temperature: number | null
  humidity: number | null
  lux: number | null
}

export interface NodeData {
  id: number
  humidity_pct: number
  humidity_raw?: number
  battery_v?: number
  last_seen_s?: number
}

export interface Reading {
  id: number
  timestamp: number
  ambient: AmbientData
  nodes: NodeData[]
  created_at: string
}

export interface RowConfig {
  id: number
  badge: string
  name: string
  crops: string
  accent: string
  accentLight: string
  accentHex: number
}
