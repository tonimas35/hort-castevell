import { BANCAL_W, ROWS } from '../lib/constants'
import { useHortStore } from '../lib/store'
import HumiditySensor from './HumiditySensor'

export default function HumiditySensors() {
  const reading = useHortStore(s => s.reading)

  return (
    <>
      {ROWS.map((row, i) => {
        const rowX = -BANCAL_W / 2 + 3.5 + i * (BANCAL_W - 7) / 3
        const node = reading?.nodes.find(n => n.id === row.id)
        // Place sensor roughly in the middle of each row
        return (
          <group key={`hs-${row.id}`} position={[rowX + 1.8, 0.8, -5]}>
            <HumiditySensor
              index={i}
              humidity={node?.humidity_pct ?? 0}
            />
          </group>
        )
      })}
    </>
  )
}
