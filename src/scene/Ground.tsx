import { useMemo } from 'react'
import * as THREE from 'three'

export default function Ground() {
  const { geometry, grassPositions } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200, 200, 100, 100)
    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)

    // Seeded random
    let seed = 42
    const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)

      // Terreny ondulat amb múltiples freqüències
      const h = Math.sin(x * 0.03) * Math.cos(y * 0.04) * 0.5
        + Math.sin(x * 0.08 + 1.3) * Math.cos(y * 0.06) * 0.2
        + Math.sin(x * 0.15) * Math.cos(y * 0.12) * 0.1
      pos.setZ(i, h)

      // Vertex colors — verd herba prop del bancal, marró lluny
      const distFromCenter = Math.sqrt(x * x + y * y)
      const grassFactor = Math.max(0, 1 - distFromCenter / 60) * 0.4 + rng() * 0.15

      // Base marró terra
      let r = 0.36 + rng() * 0.08
      let g = 0.28 + rng() * 0.06
      let b = 0.20 + rng() * 0.04

      // Barrejar amb verd herba
      r = r * (1 - grassFactor) + 0.25 * grassFactor
      g = g * (1 - grassFactor) + 0.42 * grassFactor
      b = b * (1 - grassFactor) + 0.15 * grassFactor

      colors[i * 3] = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()

    // Posicions per matolls d'herba al voltant del bancal
    const grass: { x: number; z: number; s: number; r: number }[] = []
    for (let i = 0; i < 60; i++) {
      const angle = rng() * Math.PI * 2
      const dist = 18 + rng() * 30
      grass.push({
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        s: 0.3 + rng() * 0.5,
        r: rng() * Math.PI * 2,
      })
    }

    return { geometry: geo, grassPositions: grass }
  }, [])

  return (
    <group>
      {/* Terra principal */}
      <mesh geometry={geometry} rotation-x={-Math.PI / 2} position-y={-0.5} receiveShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.92}
          metalness={0}
        />
      </mesh>

      {/* Matolls d'herba */}
      {grassPositions.map((g, i) => (
        <group key={i} position={[g.x, -0.3, g.z]} rotation-y={g.r} scale={g.s}>
          {/* 3 fulles d'herba */}
          {[0, 1, 2].map(j => (
            <mesh key={j} position={[j * 0.15 - 0.15, 0.3, 0]} rotation-z={(j - 1) * 0.3} castShadow>
              <boxGeometry args={[0.05, 0.6, 0.02]} />
              <meshStandardMaterial color={0x4A8A30} roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
