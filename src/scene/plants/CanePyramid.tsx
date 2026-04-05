export default function CanePyramid() {
  const height = 5
  const r = 1.2

  return (
    <group>
      {[0, 1, 2, 3].map(i => {
        const angle = (i / 4) * Math.PI * 2
        const botX = Math.sin(angle) * r
        const botZ = Math.cos(angle) * r
        // Midpoint between base and apex
        const midX = botX / 2
        const midZ = botZ / 2
        // Angle to lean the cane
        const lean = Math.atan2(r, height)

        return (
          <mesh
            key={i}
            position={[midX, height / 2, midZ]}
            rotation-x={Math.cos(angle) * lean}
            rotation-z={-Math.sin(angle) * lean}
          >
            <cylinderGeometry args={[0.06, 0.08, height, 4]} />
            <meshStandardMaterial color={0x9B8B55} roughness={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}
