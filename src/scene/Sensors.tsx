import { BANCAL_W, BANCAL_L, ROWS } from '../lib/constants'
import { useHortStore } from '../lib/store'
import Sensor from './Sensor'

export default function Sensors() {
  const reading = useHortStore(s => s.reading)
  const selectRow = useHortStore(s => s.selectRow)

  return (
    <>
      {ROWS.map((row, i) => {
        const rowX = -BANCAL_W / 2 + 3.5 + i * (BANCAL_W - 7) / 3
        const node = reading?.nodes.find(n => n.id === row.id)
        return (
          <group key={row.id} position={[rowX, 0.7, -BANCAL_L / 2 + 6]}>
            <Sensor
              index={i}
              humidity={node?.humidity_pct ?? 0}
              onClick={() => selectRow(i)}
            />
          </group>
        )
      })}
    </>
  )
}
