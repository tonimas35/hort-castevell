import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { THRESHOLD_LOW, THRESHOLD_MED, ROWS } from '../lib/constants'

interface Props {
  index: number
  humidity: number
  onClick?: () => void
}

export default function Sensor({ index, humidity, onClick }: Props) {
  const headRef = useRef<THREE.Mesh>(null)
  const row = ROWS[index]

  // Determine color based on humidity
  const emissiveColor = humidity < THRESHOLD_LOW
    ? 0xB33A3A
    : humidity < THRESHOLD_MED
    ? 0xC4873D
    : row.accentHex

  useFrame(({ clock }) => {
    if (!headRef.current) return
    const mat = headRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.15 + Math.sin(clock.elapsedTime * 2 + index) * 0.1
  })

  return (
    <group onClick={onClick}>
      {/* Stick */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.2, 2, 0.6]} />
        <meshStandardMaterial color={0x1a3a1a} roughness={0.7} />
      </mesh>

      {/* Head (glowing) */}
      <mesh ref={headRef} position={[0, 2.2, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.8]} />
        <meshStandardMaterial
          color={row.accentHex}
          roughness={0.3}
          metalness={0.4}
          emissive={emissiveColor}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Point light */}
      <pointLight
        position={[0, 2.5, 0]}
        color={emissiveColor}
        intensity={0.5}
        distance={8}
      />
    </group>
  )
}
