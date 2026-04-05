import { BANCAL_W, BANCAL_L } from '../lib/constants'

export default function DripLines() {
  return (
    <>
      {[0, 1, 2, 3].map(i => {
        const rowX = -BANCAL_W / 2 + 3.5 + i * (BANCAL_W - 7) / 3
        return (
          <mesh key={i} position={[rowX, 0.85, 0]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.15, 0.15, BANCAL_L - 2, 8]} />
            <meshStandardMaterial color={0x222222} roughness={0.7} />
          </mesh>
        )
      })}
    </>
  )
}
