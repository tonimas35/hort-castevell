import { ROWS } from '../lib/constants'
import { useHortStore } from '../lib/store'
import NodeCard from './NodeCard'

const ROW_TARGETS: Record<number, number> = {
  1: 50, 2: 50, 3: 45, 4: 55,
}

export default function NodesGrid() {
  const reading = useHortStore(s => s.reading)
  const activeNodes = reading?.nodes.length ?? 0

  return (
    <section>
      <div className="kv-section-head">
        <h2 className="kv-section-title">Nodes del hort</h2>
        <span className="kv-section-sub">
          {activeNodes} de 4 actius · ESP-NOW
        </span>
      </div>
      <div className="kv-nodes" style={{ marginTop: 12 }}>
        {ROWS.map(row => (
          <NodeCard
            key={row.id}
            row={row}
            target={ROW_TARGETS[row.id]}
          />
        ))}
      </div>
    </section>
  )
}
