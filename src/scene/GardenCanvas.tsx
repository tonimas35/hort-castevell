import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
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
import Atmosphere from './Atmosphere'

export default function GardenCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [25, 30, -40], fov: 45, near: 0.1, far: 500 }}
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      frameloop="always"
    >
      <color attach="background" args={[0x87CEEB]} />
      <fogExp2 attach="fog" args={[0xB0D8F0, 0.004]} />

      {/* Contact shadows — ombra suau sota cada objecte */}
      <ContactShadows
        position={[0, -0.48, 0]}
        opacity={0.4}
        scale={120}
        blur={2}
        far={25}
        color="#3A2A1A"
      />

      <Suspense fallback={null}>
        <Lights />
        <Ground />
        <Bancal />
        <DripLines />
        <Plants />
        <Sensors />
        <HumiditySensors />
        <WaterDrops />
        <CentralUnit />
        <Atmosphere />
      </Suspense>
      <CameraController />

      {/* Post-processing — bloom pels LEDs + vignette cinematogràfic */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.9}
          luminanceSmoothing={0.5}
          intensity={0.3}
          mipmapBlur
        />
        <Vignette offset={0.3} darkness={0.35} />
      </EffectComposer>
    </Canvas>
  )
}
