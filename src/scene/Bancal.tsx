import { BANCAL_W, BANCAL_L, ROWS } from '../lib/constants'
import { useHortStore } from '../lib/store'
import SoilRow from './SoilRow'

const WALL_H = 1.5
const WALL_THICK = 0.4

const walls = [
  { w: BANCAL_W + WALL_THICK * 2, d: WALL_THICK, x: 0, z: -BANCAL_L / 2 - WALL_THICK / 2 },
  { w: BANCAL_W + WALL_THICK * 2, d: WALL_THICK, x: 0, z: BANCAL_L / 2 + WALL_THICK / 2 },
  { w: WALL_THICK, d: BANCAL_L, x: -BANCAL_W / 2 - WALL_THICK / 2, z: 0 },
  { w: WALL_THICK, d: BANCAL_L, x: BANCAL_W / 2 + WALL_THICK / 2, z: 0 },
]

export default function Bancal() {
  const reading = useHortStore(s => s.reading)
  const selectRow = useHortStore(s => s.selectRow)

  return (
    <group>
      {/* Wooden walls */}
      {walls.map((w, i) => (
        <mesh
          key={i}
          position={[w.x, WALL_H / 2 - 0.5, w.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[w.w, WALL_H, w.d]} />
          <meshPhysicalMaterial color={0x8B6B4A} roughness={0.75} metalness={0.02} clearcoat={0.08} clearcoatRoughness={0.6} />
        </mesh>
      ))}

      {/* Fill soil */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[BANCAL_W, 1, BANCAL_L]} />
        <meshStandardMaterial color={0x5C4033} roughness={0.95} />
      </mesh>

      {/* 4 soil rows */}
      {ROWS.map((row, i) => {
        const node = reading?.nodes.find(n => n.id === row.id)
        return (
          <SoilRow
            key={row.id}
            index={i}
            humidity={node?.humidity_pct ?? 0}
          />
        )
      })}
    </group>
  )
}
