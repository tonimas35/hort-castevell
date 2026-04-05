export default function Leek() {
  return (
    <group>
      {/* White stem */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 1.6, 6]} />
        <meshStandardMaterial color={0xE8E0C8} roughness={0.7} />
      </mesh>
      {/* Green top leaves */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[Math.sin(i * 2.1) * 0.2, 1.8, Math.cos(i * 2.1) * 0.2]} rotation-z={Math.sin(i * 2.1) * 0.4} castShadow>
          <boxGeometry args={[0.08, 1.2, 0.3]} />
          <meshStandardMaterial color={0x3A6A28} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}
