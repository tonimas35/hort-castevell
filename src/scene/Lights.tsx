import { Environment } from '@react-three/drei'

export default function Lights() {
  const sunPosition: [number, number, number] = [50, 80, 30]

  return (
    <>
      {/* HDRI — reflexos realistes */}
      <Environment preset="sunset" />

      {/* Ambient — llum càlida base */}
      <ambientLight intensity={0.6} color={0xFFF5E0} />

      {/* Sol — llum principal amb ombres */}
      <directionalLight
        position={sunPosition}
        intensity={2.5}
        color={0xFFF2D0}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-bias={-0.0005}
      />

      {/* Contra-llum blava — simula rebot del cel */}
      <directionalLight position={[-40, 30, -20]} intensity={0.5} color={0x8EBBDD} />

      {/* Llum lateral càlida — rebot terra */}
      <directionalLight position={[10, 5, -30]} intensity={0.2} color={0xDDB888} />

      {/* Hemisphere — cel blau + terra càlida */}
      <hemisphereLight args={[0x88CCEE, 0xAA8866, 0.4]} />
    </>
  )
}
