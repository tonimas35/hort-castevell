import { useMemo } from 'react'
import * as THREE from 'three'

export default function Ground() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200, 200, 50, 50)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      pos.setZ(i, Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.3)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2} position-y={-0.5} receiveShadow>
      <meshStandardMaterial color={0x5C4A32} roughness={0.95} metalness={0} />
    </mesh>
  )
}
