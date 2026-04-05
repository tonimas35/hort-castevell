import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useHortStore } from '../lib/store'
import { REFRESH_MS } from '../lib/constants'
import type { Reading } from '../lib/types'

// Demo data fallback
function demoReading(): Reading {
  return {
    id: 0,
    timestamp: Math.floor(Date.now() / 1000),
    ambient: { temperature: 24.2, humidity: 55, lux: 48000 },
    nodes: [
      { id: 1, humidity_pct: 64, humidity_raw: 2100, battery_v: 3.92, last_seen_s: 180 },
      { id: 2, humidity_pct: 58, humidity_raw: 2250, battery_v: 4.01, last_seen_s: 210 },
      { id: 3, humidity_pct: 37, humidity_raw: 2680, battery_v: 3.78, last_seen_s: 150 },
      { id: 4, humidity_pct: 21, humidity_raw: 2980, battery_v: 3.65, last_seen_s: 300 },
    ],
    created_at: new Date().toISOString(),
  }
}

export function useLatestReading() {
  const { setReading, setConnected } = useHortStore()
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    async function fetchLatest() {
      try {
        const { data, error } = await supabase
          .from('readings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)

        if (error || !data?.length) throw new Error(error?.message || 'empty')

        setReading(data[0] as Reading)
        setConnected(true)
      } catch {
        setConnected(false)
        setReading(demoReading())
      }
    }

    fetchLatest()
    intervalRef.current = setInterval(fetchLatest, REFRESH_MS)
    return () => clearInterval(intervalRef.current)
  }, [setReading, setConnected])
}
