import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { BANCAL_W, BANCAL_L, ROWS } from '../../lib/constants'
import Lettuce from './Lettuce'
import Leek from './Leek'
import Tomato from './Tomato'
import Pepper from './Pepper'
import Aubergine from './Aubergine'
import CanePyramid from './CanePyramid'

// Seeded PRNG for deterministic plant positions
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

interface PlantPosition {
  x: number
  z: number
  scale: number
  type: 'lettuce' | 'leek' | 'tomato' | 'pepper' | 'aubergine'
}

function generateRowPlants(rowIndex: number): PlantPosition[] {
  const rng = seededRandom(rowIndex * 1000 + 42)
  const rowX = -BANCAL_W / 2 + 3.5 + rowIndex * (BANCAL_W - 7) / 3
  const plants: PlantPosition[] = []

  if (rowIndex === 0) {
    // F1: Enciams + Porros
    const count = 14
    const spacing = (BANCAL_L - 6) / count
    for (let j = 0; j < count; j++) {
      const z = -BANCAL_L / 2 + 3 + j * spacing + spacing / 2
      const type = j % 3 === 0 ? 'leek' as const : 'lettuce' as const
      plants.push({ x: rowX + (rng() - 0.5) * 1.5, z, scale: 0.6 + rng() * 0.4, type })
    }
  } else if (rowIndex === 1) {
    // F2: Enciams
    const count = 14
    const spacing = (BANCAL_L - 6) / count
    for (let j = 0; j < count; j++) {
      const z = -BANCAL_L / 2 + 3 + j * spacing + spacing / 2
      plants.push({ x: rowX + (rng() - 0.5) * 1.5, z, scale: 0.6 + rng() * 0.4, type: 'lettuce' })
    }
  } else if (rowIndex === 2) {
    // F3: Tomàquets
    const count = 10
    const spacing = (BANCAL_L - 6) / count
    for (let j = 0; j < count; j++) {
      const z = -BANCAL_L / 2 + 3 + j * spacing + spacing / 2
      plants.push({ x: rowX + (rng() - 0.5) * 1.2, z, scale: 0.6 + rng() * 0.4, type: 'tomato' })
    }
  } else {
    // F4: 6 pebrots + 2 albergínies + tomàquets
    const count = 10
    const spacing = (BANCAL_L - 6) / count
    for (let j = 0; j < count; j++) {
      const z = -BANCAL_L / 2 + 3 + j * spacing + spacing / 2
      let type: PlantPosition['type'] = 'pepper'
      if (j === 3 || j === 7) type = 'aubergine'
      if (j >= 8) type = 'tomato'
      plants.push({ x: rowX + (rng() - 0.5) * 1.2, z, scale: 0.6 + rng() * 0.4, type })
    }
  }

  return plants
}

function PlantMesh({ plant, rowIndex, plantIndex }: { plant: PlantPosition, rowIndex: number, plantIndex: number }) {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.rotation.z = Math.sin(t + plantIndex * 0.5 + rowIndex) * 0.03
    ref.current.rotation.x = Math.cos(t * 0.7 + plantIndex * 0.3) * 0.02
  })

  return (
    <group ref={ref} position={[plant.x, 0.8, plant.z]} scale={plant.scale}>
      {plant.type === 'lettuce' && <Lettuce color={ROWS[rowIndex].accentHex} />}
      {plant.type === 'leek' && <Leek />}
      {plant.type === 'tomato' && <Tomato />}
      {plant.type === 'pepper' && <Pepper />}
      {plant.type === 'aubergine' && <Aubergine />}
    </group>
  )
}

export default function Plants() {
  const allPlants = useMemo(() =>
    [0, 1, 2, 3].map(i => generateRowPlants(i)),
    []
  )

  // Cane pyramids for rows 2 & 3 (tomatoes)
  const pyramids = useMemo(() => {
    const result: { x: number, z: number }[] = []
    for (let row = 2; row <= 3; row++) {
      const rowX = -BANCAL_W / 2 + 3.5 + row * (BANCAL_W - 7) / 3
      for (let p = 0; p < 4; p++) {
        const pz = -BANCAL_L / 2 + 10 + p * (BANCAL_L - 20) / 3
        result.push({ x: rowX, z: pz })
      }
    }
    return result
  }, [])

  return (
    <>
      {allPlants.map((rowPlants, rowIndex) =>
        rowPlants.map((plant, j) => (
          <PlantMesh key={`${rowIndex}-${j}`} plant={plant} rowIndex={rowIndex} plantIndex={j} />
        ))
      )}
      {pyramids.map((p, i) => (
        <group key={`pyr-${i}`} position={[p.x, 0.8, p.z]}>
          <CanePyramid />
        </group>
      ))}
    </>
  )
}
