export default function Lights() {
  return (
    <>
      {/* Ambient */}
      <ambientLight intensity={0.3} color={0xF5E6D0} />

      {/* Sun */}
      <directionalLight
        position={[30, 50, 20]}
        intensity={1.2}
        color={0xFFF2E0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={0.5}
        shadow-camera-far={150}
        shadow-bias={-0.001}
      />

      {/* Fill */}
      <directionalLight position={[-20, 20, -10]} intensity={0.2} color={0xB0D0FF} />

      {/* Hemisphere */}
      <hemisphereLight args={[0x87CEEB, 0x3D2B1F, 0.3]} />
    </>
  )
}
