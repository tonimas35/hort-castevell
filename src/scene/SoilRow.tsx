import { useMemo } from 'react'
import * as THREE from 'three'
import { BANCAL_W, BANCAL_L, SOIL_DRY, SOIL_WET } from '../lib/constants'
import { useHortStore } from '../lib/store'

interface Props {
  index: number
  humidity: number // 0-100
  onClick?: () => void
}

const dryColor = new THREE.Color(SOIL_DRY)
const wetColor = new THREE.Color(SOIL_WET)

export default function SoilRow({ index, humidity, onClick }: Props) {
  const rowX = -BANCAL_W / 2 + 3.5 + index * (BANCAL_W - 7) / 3
  const irrigating = useHortStore(s => s.irrigating[index])

  // Terra més fosca quan rega (simula humitat creixent)
  const effectiveHumidity = irrigating ? Math.min(100, humidity + 30) : humidity

  const color = useMemo(() => {
    return dryColor.clone().lerp(wetColor, effectiveHumidity / 100)
  }, [effectiveHumidity])

  return (
    <mesh
      position={[rowX, 0.6, 0]}
      receiveShadow
      onClick={onClick}
    >
      <boxGeometry args={[5, 0.3, BANCAL_L - 2]} />
      <meshPhysicalMaterial
        color={color}
        roughness={irrigating ? 0.7 : 0.92}
        metalness={irrigating ? 0.05 : 0}
        clearcoat={irrigating ? 0.15 : 0}
        clearcoatRoughness={0.8}
      />
    </mesh>
  )
}
