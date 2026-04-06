import { useMemo } from 'react'
import * as THREE from 'three'

interface Props {
  color?: number
  variant?: 'green' | 'purple'
}

// Create a single lettuce leaf shape
function createLeafGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  // Leaf outline — rounded oval
  shape.moveTo(0, 0)
  shape.bezierCurveTo(0.3, 0.2, 0.35, 0.6, 0.2, 1.0)
  shape.bezierCurveTo(0.1, 1.2, -0.1, 1.2, -0.2, 1.0)
  shape.bezierCurveTo(-0.35, 0.6, -0.3, 0.2, 0, 0)

  const geo = new THREE.ShapeGeometry(shape, 6)

  // Bend the leaf upward and outward
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    // Curve upward
    pos.setZ(i, y * y * 0.3)
    // Slight wave
    pos.setX(i, pos.getX(i) + Math.sin(y * 3) * 0.04)
  }
  geo.computeVertexNormals()
  return geo
}

export default function Lettuce({ variant = 'green' }: Props) {
  const leafGeo = useMemo(() => createLeafGeometry(), [])

  // Color palette
  const innerColor = variant === 'green' ? 0xA8D86C : 0x8B4572
  const midColor = variant === 'green' ? 0x6AAF3D : 0x6B2D52
  const outerColor = variant === 'green' ? 0x4A8C2A : 0x4A1A3A

  // Generate leaf rings
  const leaves = useMemo(() => {
    const result: { ring: number; angle: number; tilt: number; scale: number; color: number }[] = []

    // Inner leaves (small, upright)
    for (let i = 0; i < 5; i++) {
      result.push({
        ring: 0,
        angle: (i / 5) * Math.PI * 2 + 0.2,
        tilt: 0.15,
        scale: 0.35,
        color: innerColor,
      })
    }

    // Middle leaves
    for (let i = 0; i < 7; i++) {
      result.push({
        ring: 1,
        angle: (i / 7) * Math.PI * 2,
        tilt: 0.5,
        scale: 0.55,
        color: midColor,
      })
    }

    // Outer leaves (big, spread out)
    for (let i = 0; i < 8; i++) {
      result.push({
        ring: 2,
        angle: (i / 8) * Math.PI * 2 + 0.15,
        tilt: 0.85,
        scale: 0.7,
        color: outerColor,
      })
    }

    return result
  }, [innerColor, midColor, outerColor])

  return (
    <group>
      {/* Core / heart of the lettuce */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshStandardMaterial color={0xC5E8A0} roughness={0.7} />
      </mesh>

      {/* Leaves */}
      {leaves.map((leaf, i) => {
        const spreadRadius = leaf.ring === 0 ? 0.05 : leaf.ring === 1 ? 0.15 : 0.25
        const x = Math.sin(leaf.angle) * spreadRadius
        const z = Math.cos(leaf.angle) * spreadRadius
        const baseY = leaf.ring === 0 ? 0.2 : leaf.ring === 1 ? 0.1 : 0.02

        return (
          <mesh
            key={i}
            geometry={leafGeo}
            position={[x, baseY, z]}
            rotation={[
              -Math.PI / 2 + leaf.tilt,  // tilt from vertical
              0,
              leaf.angle,                 // rotate around center
            ]}
            scale={leaf.scale}
            castShadow
          >
            <meshStandardMaterial
              color={leaf.color}
              roughness={0.75}
              metalness={0.0}
              side={THREE.DoubleSide}
              transparent
              opacity={0.92}
            />
          </mesh>
        )
      })}
    </group>
  )
}
