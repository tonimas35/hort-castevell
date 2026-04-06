import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Lights from './Lights'
import Ground from './Ground'
import Bancal from './Bancal'
import DripLines from './DripLines'
import Plants from './plants'
import Sensors from './Sensors'
import HumiditySensors from './HumiditySensors'
import WaterDrops from './WaterDrops'
import CentralUnit from './CentralUnit'
import CameraController from './CameraController'

export default function GardenCanvas() {
  return (
    <Canvas
      shadows
      camera={{ position: [25, 30, -40], fov: 45, near: 0.1, far: 500 }}
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    >
      <color attach="background" args={[0x87CEEB]} />
      <fogExp2 attach="fog" args={[0xB0D8F0, 0.004]} />

      <Lights />
      <Ground />
      <Bancal />
      <DripLines />
      <Plants />
      <Sensors />
      <HumiditySensors />
      <WaterDrops />
      <CentralUnit />
      <CameraController />
    </Canvas>
  )
}
