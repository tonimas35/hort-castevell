import * as THREE from 'three'

interface Props {
  color: number
}

export default function Lettuce({ color }: Props) {
  return (
    <mesh castShadow scale={[1, 0.6, 1]}>
      <sphereGeometry args={[1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={color} roughness={0.8} side={THREE.DoubleSide} />
    </mesh>
  )
}
