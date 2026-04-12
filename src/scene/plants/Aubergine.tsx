import { useMemo } from 'react'
import * as THREE from 'three'

// Large fuzzy aubergine leaf
function createAubergineLeafGeo(): THREE.BufferGeometry {
  const segments = 10
  const vertices: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const y = t * 0.9
    // Big heart-shaped leaf — wide in the middle
    const width = Math.sin(t * Math.PI * 0.9) * 0.4 * (1 - t * 0.2)
    const z = t * t * 0.18 // gentle droop
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

// Aubergine fruit — elongated oval/teardrop using lathe
function createAubergineFruitGeo(): THREE.BufferGeometry {
  const points: THREE.Vector2[] = []
  points.push(new THREE.Vector2(0.0, 0.0))     // stem top
  points.push(new THREE.Vector2(0.04, -0.04))   // neck
  points.push(new THREE.Vector2(0.08, -0.1))    // shoulder
  points.push(new THREE.Vector2(0.12, -0.2))    // widening
  points.push(new THREE.Vector2(0.13, -0.3))    // widest body
  points.push(new THREE.Vector2(0.12, -0.4))    // body
  points.push(new THREE.Vector2(0.11, -0.48))   // lower body
  points.push(new THREE.Vector2(0.08, -0.55))   // tapering
  points.push(new THREE.Vector2(0.04, -0.6))    // near bottom
  points.push(new THREE.Vector2(0.0, -0.63))    // rounded tip

  return new THREE.LatheGeometry(points, 10)
}

// Star-shaped calyx on top
function createCalyxGeo(): THREE.BufferGeometry {
  const points: THREE.Vector2[] = []
  // 5 pointed star, flat
  for (let i = 0; i <= 10; i++) {
    const angle = (i / 10) * Math.PI * 2
    const r = i % 2 === 0 ? 0.08 : 0.04
    points.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r))
  }
  const shape = new THREE.Shape(points)
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false })
  return geo
}

export default function Aubergine() {
  const leafGeo = useMemo(() => createAubergineLeafGeo(), [])
  const fruitGeo = useMemo(() => createAubergineFruitGeo(), [])
  const calyxGeo = useMemo(() => createCalyxGeo(), [])

  // Bushy structure
  const branches = useMemo(() => [
    { y: 0.5, angle: 0.6, length: 0.65 },
    { y: 0.5, angle: 2.7, length: 0.6 },
    { y: 0.5, angle: 4.8, length: 0.55 },
    { y: 0.8, angle: 1.5, length: 0.75 },
    { y: 0.8, angle: 3.6, length: 0.7 },
    { y: 0.8, angle: 5.6, length: 0.6 },
    { y: 1.05, angle: 0.3, length: 0.5 },
    { y: 1.05, angle: 2.3, length: 0.55 },
    { y: 1.05, angle: 4.3, length: 0.45 },
  ], [])

  // Leaves — bigger than pepper, slightly fuzzy look
  const leaves = useMemo(() => {
    const result: { x: number; y: number; z: number; rotY: number; scale: number }[] = []
    branches.forEach(b => {
      for (let i = 0; i < 2; i++) {
        const t = 0.4 + i * 0.4
        result.push({
          x: Math.sin(b.angle) * b.length * t,
          y: b.y + 0.15 - t * 0.1,
          z: Math.cos(b.angle) * b.length * t,
          rotY: b.angle + (i === 0 ? 0.5 : -0.5),
          scale: 1.0 + Math.random() * 0.5,
        })
      }
    })
    return result
  }, [branches])

  // Aubergine fruits — dark purple, hanging
  const fruits = useMemo(() => [
    { x: 0.3, y: 0.45, z: 0.25, rotZ: 0.15, scale: 1.0, ripe: true },
    { x: -0.25, y: 0.55, z: -0.3, rotZ: -0.2, scale: 0.85, ripe: true },
    { x: 0.15, y: 0.7, z: -0.2, rotZ: 0.1, scale: 0.7, ripe: false },
  ], [])

  return (
    <group>
      {/* Main stem — thicker, purplish-green */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 1.1, 6]} />
        <meshStandardMaterial color={0x3A5030} roughness={0.8} />
      </mesh>

      {/* Purple tint on stem */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.4, 6]} />
        <meshStandardMaterial color={0x4A3060} roughness={0.8} />
      </mesh>

      {/* Branches */}
      {branches.map((b, i) => {
        const endX = Math.sin(b.angle) * b.length
        const endZ = Math.cos(b.angle) * b.length
        const len = Math.sqrt(endX * endX + endZ * endZ)
        return (
          <mesh
            key={`br-${i}`}
            position={[endX / 2, b.y, endZ / 2]}
            rotation={[0, -Math.atan2(endZ, endX) + Math.PI / 2, Math.PI / 2 - 0.2]}
            castShadow
          >
            <cylinderGeometry args={[0.015, 0.03, len, 4]} />
            <meshStandardMaterial color={0x4A5A35} roughness={0.8} />
          </mesh>
        )
      })}

      {/* Big leaves */}
      {leaves.map((l, i) => (
        <mesh
          key={`lf-${i}`}
          geometry={leafGeo}
          position={[l.x, l.y, l.z]}
          rotation={[0.25, l.rotY, 0]}
          scale={l.scale}
          castShadow
        >
          <meshStandardMaterial
            color={0x2D6A22}
            roughness={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Aubergine fruits */}
      {fruits.map((f, i) => (
        <group key={`fr-${i}`} position={[f.x, f.y, f.z]}>
          {/* Fruit body */}
          <mesh geometry={fruitGeo} rotation-z={f.rotZ} scale={f.scale} castShadow>
            <meshPhysicalMaterial
              color={f.ripe ? 0x3A1055 : 0x5A3070}
              roughness={0.25}
              clearcoat={0.6}
              clearcoatRoughness={0.1}
            />
          </mesh>
          {/* Star calyx on top */}
          <mesh
            geometry={calyxGeo}
            position={[0, 0.01, 0]}
            rotation-x={-Math.PI / 2}
            scale={f.scale}
          >
            <meshStandardMaterial color={0x2A5A18} roughness={0.7} />
          </mesh>
          {/* Small stem */}
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.012, 0.008, 0.08, 4]} />
            <meshStandardMaterial color={0x3A5A25} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Purple flowers */}
      {[
        { x: 0.2, y: 1.0, z: 0.15 },
        { x: -0.15, y: 0.95, z: -0.2 },
      ].map((f, i) => (
        <group key={`fl-${i}`} position={[f.x, f.y, f.z]}>
          {/* Purple petals */}
          <mesh>
            <sphereGeometry args={[0.04, 6, 4]} />
            <meshStandardMaterial color={0x7744AA} roughness={0.5} emissive={0x7744AA} emissiveIntensity={0.15} />
          </mesh>
          {/* Yellow center */}
          <mesh position={[0, 0, 0.02]}>
            <sphereGeometry args={[0.015, 5, 4]} />
            <meshStandardMaterial color={0xDDCC44} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
