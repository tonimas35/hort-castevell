import { useMemo } from 'react'
import * as THREE from 'three'

// Create a leaf as a curved tube that bends outward
function createLeafMesh(height: number, width: number, bendAmount: number): THREE.BufferGeometry {
  const segments = 10
  const halfW = width / 2
  const vertices: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments // 0=base, 1=tip
    const y = t * height
    // Bend outward as it goes up
    const z = t * t * bendAmount
    // Taper width
    const w = halfW * (1 - t * 0.7)

    vertices.push(-w, y, z) // left
    vertices.push(w, y, z)  // right
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2
    const b = a + 1
    const c = a + 2
    const d = a + 3
    indices.push(a, c, b)
    indices.push(b, c, d)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export default function Leek() {
  const leafGeos = useMemo(() => [
    createLeafMesh(2.8, 0.3, 1.5),
    createLeafMesh(2.4, 0.25, 1.2),
    createLeafMesh(2.0, 0.22, 1.8),
    createLeafMesh(2.6, 0.28, 1.3),
    createLeafMesh(2.2, 0.24, 1.6),
  ], [])

  const leafAngles = [0, 1.25, 2.5, 3.75, 5.0]

  return (
    <group>
      {/* White stem base */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 0.9, 8]} />
        <meshStandardMaterial color={0xE8E4D0} roughness={0.6} />
      </mesh>

      {/* Light green transition */}
      <mesh position={[0, 0.92, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.15, 8]} />
        <meshStandardMaterial color={0xA8C870} roughness={0.65} />
      </mesh>

      {/* Leaves — grow UP from stem top, then curve outward */}
      {leafAngles.map((angle, i) => (
        <mesh
          key={i}
          geometry={leafGeos[i]}
          position={[0, 1.0, 0]}
          rotation={[0, angle, 0]}
          castShadow
        >
          <meshStandardMaterial
            color={i < 3 ? 0x3A7A28 : 0x2D6420}
            roughness={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Small roots */}
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.sin(a) * 0.13, 0, Math.cos(a) * 0.13]} rotation-z={Math.sin(a) * 0.4} rotation-x={Math.cos(a) * 0.4}>
            <cylinderGeometry args={[0.008, 0.012, 0.15, 3]} />
            <meshStandardMaterial color={0xD4C8A8} roughness={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}
