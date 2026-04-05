import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Reading } from '../lib/types'

// Demo history fallback
function demoHistory(): Reading[] {
  const now = Math.floor(Date.now() / 1000)
  const out: Reading[] = []
  for (let i = 48; i >= 0; i--) {
    const t = now - i * 1800
    const hour = new Date(t * 1000).getHours()
    const dayEffect = Math.sin((hour - 6) * Math.PI / 12) * 15
    const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)))
    const rnd = (n: number) => (Math.random() - 0.5) * 2 * n
    out.push({
      id: 48 - i,
      timestamp: t,
      ambient: { temperature: 22 + dayEffect * 0.3, humidity: 55, lux: null },
      nodes: [
        { id: 1, humidity_pct: clamp(62 - dayEffect + rnd(4)) },
        { id: 2, humidity_pct: clamp(56 - dayEffect + rnd(5)) },
        { id: 3, humidity_pct: clamp(40 - dayEffect * 0.8 + rnd(4)) },
        { id: 4, humidity_pct: clamp(25 - dayEffect * 0.6 + rnd(3)) },
      ],
      created_at: new Date(t * 1000).toISOString(),
    })
  }
  return out
}

export function useHistory(hours: number) {
  const [entries, setEntries] = useState<Reading[]>([])

  useEffect(() => {
    async function fetchHistory() {
      try {
        const cutoff = Math.floor(Date.now() / 1000) - hours * 3600
        const { data, error } = await supabase
          .from('readings')
          .select('*')
          .gte('timestamp', cutoff)
          .order('created_at', { ascending: true })
          .limit(500)

        if (error || !data?.length) throw new Error(error?.message || 'empty')
        setEntries(data as Reading[])
      } catch {
        setEntries(demoHistory())
      }
    }

    fetchHistory()
  }, [hours])

  return entries
}
