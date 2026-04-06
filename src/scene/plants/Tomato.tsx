import { useMemo } from 'react'
import * as THREE from 'three'

// Leaf cluster — compound tomato leaf
function createLeafClusterGeo(): THREE.BufferGeometry {
  const segments = 8
  const vertices: number[] = []
  const indices: number[] = []

  // Main leaf shape — oval that tapers
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const y = t * 0.8
    const width = Math.sin(t * Math.PI) * 0.25
    const z = t * t * 0.15 // slight droop
    vertices.push(-width, y, z)
    vertices.push(width, y, z)
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3
    indices.push(a, c, b)
    indices.push(b, c, d)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export default function Tomato() {
  const leafGeo = useMemo(() => createLeafClusterGeo(), [])

  // Random-ish branch positions along the stem
  const branches = useMemo(() => [
    { y: 0.8, angle: 0.5, length: 1.2, fruits: 1 },
    { y: 1.3, angle: 2.2, length: 1.0, fruits: 2 },
    { y: 1.8, angle: 4.0, length: 1.3, fruits: 1 },
    { y: 2.3, angle: 1.0, length: 0.9, fruits: 0 },
    { y: 2.7, angle: 3.5, length: 1.1, fruits: 2 },
    { y: 3.1, angle: 5.5, length: 0.8, fruits: 0 },
  ], [])

  // Leaf positions along branches
  const leafClusters = useMemo(() => {
    const result: { x: number; y: number; z: number; rotY: number; scale: number }[] = []
    branches.forEach(b => {
      // 2-3 leaf clusters per branch
      for (let i = 0; i < 3; i++) {
        const t = (i + 1) / 4
        const bx = Math.sin(b.angle) * b.length * t
        const bz = Math.cos(b.angle) * b.length * t
        const droop = t * t * 0.3
        result.push({
          x: bx,
          y: b.y - droop + 0.1,
          z: bz,
          rotY: b.angle + (i - 1) * 0.5,
          scale: 0.8 + Math.random() * 0.4,
        })
      }
    })
    return result
  }, [branches])

  // Fruit positions
  const fruits = useMemo(() => {
    const result: { x: number; y: number; z: number; size: number; ripe: boolean }[] = []
    branches.forEach(b => {
      for (let f = 0; f < b.fruits; f++) {
        const t = 0.5 + f * 0.25
        result.push({
          x: Math.sin(b.angle) * b.length * t + (Math.random() - 0.5) * 0.2,
          y: b.y - t * 0.5 - 0.1,
          z: Math.cos(b.angle) * b.length * t + (Math.random() - 0.5) * 0.2,
          size: 0.12 + Math.random() * 0.1,
          ripe: Math.random() > 0.3,
        })
      }
    })
    return result
  }, [branches])

  return (
    <group>
      {/* Main stem — slightly curved */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 3.6, 6]} />
        <meshStandardMaterial color={0x4A6B2A} roughness={0.8} />
      </mesh>

      {/* Secondary stem at top — thinner */}
      <mesh position={[0.05, 3.4, 0.03]} rotation-z={0.1} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 0.8, 5]} />
        <meshStandardMaterial color={0x5A7B35} roughness={0.8} />
      </mesh>

      {/* Branches — thin cylinders going outward */}
      {branches.map((b, i) => {
        const endX = Math.sin(b.angle) * b.length
        const endZ = Math.cos(b.angle) * b.length
        const midX = endX / 2
        const midZ = endZ / 2
        const branchLength = Math.sqrt(endX * endX + endZ * endZ)
        const rotY = -Math.atan2(endZ, endX) + Math.PI / 2

        return (
          <mesh
            key={`branch-${i}`}
            position={[midX, b.y - 0.1, midZ]}
            rotation={[0, rotY, Math.PI / 2 - 0.3]}
            castShadow
          >
            <cylinderGeometry args={[0.02, 0.04, branchLength, 4]} />
            <meshStandardMaterial color={0x5A7B35} roughness={0.8} />
          </mesh>
        )
      })}

      {/* Leaf clusters */}
      {leafClusters.map((lc, i) => (
        <mesh
          key={`leaf-${i}`}
          geometry={leafGeo}
          position={[lc.x, lc.y, lc.z]}
          rotation={[0.3, lc.rotY, 0]}
          scale={lc.scale}
          castShadow
        >
          <meshStandardMaterial
            color={0x3D7A2A}
            roughness={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Tomato fruits */}
      {fruits.map((f, i) => (
        <group key={`fruit-${i}`} position={[f.x, f.y, f.z]}>
          {/* Fruit */}
          <mesh castShadow>
            <sphereGeometry args={[f.size, 8, 6]} />
            <meshStandardMaterial
              color={f.ripe ? 0xCC2222 : 0x88AA33}
              roughness={f.ripe ? 0.5 : 0.6}
            />
          </mesh>
          {/* Small calyx (green star on top) */}
          <mesh position={[0, f.size * 0.8, 0]}>
            <cylinderGeometry args={[0.03, 0.01, 0.04, 5]} />
            <meshStandardMaterial color={0x3A6A20} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Top growth — small leaves at apex */}
      <mesh geometry={leafGeo} position={[0, 3.6, 0]} rotation={[0.2, 0, 0]} scale={0.6} castShadow>
        <meshStandardMaterial color={0x5A9A35} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={leafGeo} position={[0, 3.5, 0]} rotation={[0.2, 2.0, 0]} scale={0.5} castShadow>
        <meshStandardMaterial color={0x5A9A35} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
