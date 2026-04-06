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
  type: 'lettuce' | 'lettuce-purple' | 'leek' | 'tomato' | 'pepper' | 'aubergine'
}

function generateRowPlants(rowIndex: number): PlantPosition[] {
  const rng = seededRandom(rowIndex * 1000 + 42)
  const rowX = -BANCAL_W / 2 + 3.5 + rowIndex * (BANCAL_W - 7) / 3
  const plants: PlantPosition[] = []

  // Layout real de l'hort de Castevell
  // Files de dreta (F1) a esquerra (F4): F1=index 0, F4=index 3

  if (rowIndex === 0) {
    // F1 (dreta): 10 porros + 2 enciams verds + 5 enciams morades
    const items: PlantPosition['type'][] = [
      'leek','leek','leek','leek','leek','leek','leek','leek','leek','leek',
      'lettuce','lettuce',
      'lettuce-purple','lettuce-purple','lettuce-purple','lettuce-purple','lettuce-purple',
    ]
    const spacing = (BANCAL_L - 6) / items.length
    for (let j = 0; j < items.length; j++) {
      const z = -BANCAL_L / 2 + 3 + j * spacing + spacing / 2
      plants.push({ x: rowX + (rng() - 0.5) * 1.2, z, scale: 1.2 + rng() * 0.6, type: items[j] })
    }
  } else if (rowIndex === 1) {
    // F2: 9 enciams verds + 4 enciams morades
    const items: PlantPosition['type'][] = [
      'lettuce','lettuce','lettuce','lettuce','lettuce','lettuce','lettuce','lettuce','lettuce',
      'lettuce-purple','lettuce-purple','lettuce-purple','lettuce-purple',
    ]
    const spacing = (BANCAL_L - 6) / items.length
    for (let j = 0; j < items.length; j++) {
      const z = -BANCAL_L / 2 + 3 + j * spacing + spacing / 2
      plants.push({ x: rowX + (rng() - 0.5) * 1.2, z, scale: 1.2 + rng() * 0.6, type: items[j] })
    }
  } else if (rowIndex === 2) {
    // F3: 14 tomateres
    const count = 14
    const spacing = (BANCAL_L - 6) / count
    for (let j = 0; j < count; j++) {
      const z = -BANCAL_L / 2 + 3 + j * spacing + spacing / 2
      plants.push({ x: rowX + (rng() - 0.5) * 1.0, z, scale: 1.1 + rng() * 0.5, type: 'tomato' })
    }
  } else {
    // F4 (esquerra): 7 pimientos + 3 berengenes + 4 tomateres
    const items: PlantPosition['type'][] = [
      'pepper','pepper','pepper','pepper','pepper','pepper','pepper',
      'aubergine','aubergine','aubergine',
      'tomato','tomato','tomato','tomato',
    ]
    const spacing = (BANCAL_L - 6) / items.length
    for (let j = 0; j < items.length; j++) {
      const z = -BANCAL_L / 2 + 3 + j * spacing + spacing / 2
      plants.push({ x: rowX + (rng() - 0.5) * 1.0, z, scale: 1.1 + rng() * 0.5, type: items[j] })
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
    <group ref={ref} position={[plant.x, 0.8, plant.z]} scale={plant.scale} rotation-y={Math.PI}>
      {plant.type === 'lettuce' && <Lettuce variant="green" />}
      {plant.type === 'lettuce-purple' && <Lettuce variant="purple" />}
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

  return (
    <>
      {allPlants.map((rowPlants, rowIndex) =>
        rowPlants.map((plant, j) => (
          <PlantMesh key={`${rowIndex}-${j}`} plant={plant} rowIndex={rowIndex} plantIndex={j} />
        ))
      )}
    </>
  )
}
