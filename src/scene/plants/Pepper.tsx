import { useMemo } from 'react'
import * as THREE from 'three'

// Pepper leaf — wider and rounder than tomato
function createPepperLeafGeo(): THREE.BufferGeometry {
  const segments = 8
  const vertices: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const y = t * 0.7
    // Wide oval shape
    const width = Math.sin(t * Math.PI) * 0.3 * (1 - t * 0.3)
    const z = t * t * 0.12
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

// Pepper fruit — elongated bell shape using lathe
function createPepperFruitGeo(): THREE.BufferGeometry {
  const points: THREE.Vector2[] = []
  // Profile from top to bottom
  points.push(new THREE.Vector2(0.0, 0.0))    // stem attachment
  points.push(new THREE.Vector2(0.04, -0.05))  // narrow top
  points.push(new THREE.Vector2(0.1, -0.12))   // widening
  points.push(new THREE.Vector2(0.12, -0.2))   // widest
  points.push(new THREE.Vector2(0.11, -0.3))   // body
  points.push(new THREE.Vector2(0.1, -0.38))   // tapering
  points.push(new THREE.Vector2(0.06, -0.42))  // bottom curve
  points.push(new THREE.Vector2(0.0, -0.45))   // tip (with bumps)

  return new THREE.LatheGeometry(points, 8)
}

export default function Pepper() {
  const leafGeo = useMemo(() => createPepperLeafGeo(), [])
  const fruitGeo = useMemo(() => createPepperFruitGeo(), [])

  // Bush structure — main stem + branches
  const branches = useMemo(() => [
    { y: 0.6, angle: 0.8, length: 0.7 },
    { y: 0.6, angle: 2.5, length: 0.6 },
    { y: 0.6, angle: 4.2, length: 0.65 },
    { y: 0.9, angle: 1.5, length: 0.8 },
    { y: 0.9, angle: 3.8, length: 0.7 },
    { y: 0.9, angle: 5.5, length: 0.6 },
    { y: 1.2, angle: 0.3, length: 0.5 },
    { y: 1.2, angle: 2.8, length: 0.55 },
    { y: 1.2, angle: 5.0, length: 0.5 },
  ], [])

  // Leaves — 2 per branch
  const leaves = useMemo(() => {
    const result: { x: number; y: number; z: number; rotY: number; scale: number }[] = []
    branches.forEach(b => {
      for (let i = 0; i < 2; i++) {
        const t = 0.5 + i * 0.35
        result.push({
          x: Math.sin(b.angle) * b.length * t,
          y: b.y + 0.1 - t * 0.1,
          z: Math.cos(b.angle) * b.length * t,
          rotY: b.angle + (i === 0 ? 0.4 : -0.4),
          scale: 0.9 + Math.random() * 0.4,
        })
      }
    })
    return result
  }, [branches])

  // Peppers — some hanging from branches
  const peppers = useMemo(() => [
    { x: 0.35, y: 0.5, z: 0.2, rotZ: 0.2, color: 0xCC2211, scale: 1.0 },    // red ripe
    { x: -0.2, y: 0.7, z: 0.4, rotZ: -0.15, color: 0xDD3318, scale: 0.9 },   // red
    { x: 0.1, y: 0.4, z: -0.35, rotZ: 0.3, color: 0x44882A, scale: 0.85 },   // green unripe
    { x: -0.4, y: 0.6, z: -0.1, rotZ: -0.1, color: 0xCC8811, scale: 0.9 },   // yellow ripening
    { x: 0.3, y: 0.8, z: -0.25, rotZ: 0.25, color: 0xBB2215, scale: 0.8 },   // red
  ], [])

  return (
    <group>
      {/* Main stem */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 1.2, 6]} />
        <meshStandardMaterial color={0x4A6B2A} roughness={0.8} />
      </mesh>

      {/* Upper stem fork */}
      <mesh position={[0.05, 1.15, 0.03]} rotation-z={0.15} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 0.4, 5]} />
        <meshStandardMaterial color={0x4A6B2A} roughness={0.8} />
      </mesh>
      <mesh position={[-0.05, 1.1, -0.03]} rotation-z={-0.15} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 0.35, 5]} />
        <meshStandardMaterial color={0x4A6B2A} roughness={0.8} />
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
            <meshStandardMaterial color={0x5A7B35} roughness={0.8} />
          </mesh>
        )
      })}

      {/* Leaves */}
      {leaves.map((l, i) => (
        <mesh
          key={`lf-${i}`}
          geometry={leafGeo}
          position={[l.x, l.y, l.z]}
          rotation={[0.2, l.rotY, 0]}
          scale={l.scale}
          castShadow
        >
          <meshStandardMaterial color={0x357A22} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Pepper fruits */}
      {peppers.map((p, i) => (
        <group key={`pp-${i}`} position={[p.x, p.y, p.z]}>
          <mesh geometry={fruitGeo} rotation-z={p.rotZ} scale={p.scale} castShadow>
            <meshPhysicalMaterial color={p.color} roughness={0.35} clearcoat={0.5} clearcoatRoughness={0.15} />
          </mesh>
          {/* Small stem on top */}
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.015, 0.01, 0.06, 4]} />
            <meshStandardMaterial color={0x3A6A20} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Small flowers (white) */}
      <mesh position={[0.15, 1.1, 0.2]}>
        <sphereGeometry args={[0.03, 6, 4]} />
        <meshStandardMaterial color={0xFFFFEE} roughness={0.5} emissive={0xFFFFEE} emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[-0.1, 1.0, -0.15]}>
        <sphereGeometry args={[0.025, 6, 4]} />
        <meshStandardMaterial color={0xFFFFEE} roughness={0.5} emissive={0xFFFFEE} emissiveIntensity={0.1} />
      </mesh>
    </group>
  )
}
