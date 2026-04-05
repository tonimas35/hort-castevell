import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Lights from './Lights'
import Ground from './Ground'
import Bancal from './Bancal'
import DripLines from './DripLines'
import Plants from './plants'
import Sensors from './Sensors'
import CentralUnit from './CentralUnit'
import CameraController from './CameraController'

export default function GardenCanvas() {
  return (
    <Canvas
      shadows
      camera={{ position: [30, 25, 50], fov: 45, near: 0.1, far: 500 }}
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    >
      <color attach="background" args={[0x1a1a14]} />
      <fogExp2 attach="fog" args={[0x1a1a14, 0.008]} />

      <Lights />
      <Ground />
      <Bancal />
      <DripLines />
      <Plants />
      <Sensors />
      <CentralUnit />
      <CameraController />
    </Canvas>
  )
}
