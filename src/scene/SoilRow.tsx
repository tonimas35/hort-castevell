import { useMemo } from 'react'
import * as THREE from 'three'
import { BANCAL_W, BANCAL_L, SOIL_DRY, SOIL_WET } from '../lib/constants'

interface Props {
  index: number
  humidity: number // 0-100
  onClick?: () => void
}

const dryColor = new THREE.Color(SOIL_DRY)
const wetColor = new THREE.Color(SOIL_WET)

export default function SoilRow({ index, humidity, onClick }: Props) {
  const rowX = -BANCAL_W / 2 + 3.5 + index * (BANCAL_W - 7) / 3

  const color = useMemo(() => {
    return dryColor.clone().lerp(wetColor, humidity / 100)
  }, [humidity])

  return (
    <mesh
      position={[rowX, 0.6, 0]}
      receiveShadow
      onClick={onClick}
    >
      <boxGeometry args={[5, 0.3, BANCAL_L - 2]} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
    </mesh>
  )
}
