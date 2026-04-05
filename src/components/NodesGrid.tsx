import { ROWS } from '../lib/constants'
import NodeCard from './NodeCard'

export default function NodesGrid() {
  return (
    <>
      <div className="section-divider">
        <span className="divider-line" />
        <span className="divider-label">Bancal Principal &middot; 4 Files</span>
        <span className="divider-line" />
      </div>
      <section className="nodes-grid" aria-label="Files del bancal">
        {ROWS.map((row, i) => (
          <NodeCard key={row.id} row={row} index={i} />
        ))}
      </section>
    </>
  )
}
