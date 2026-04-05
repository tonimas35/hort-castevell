export default function Tomato() {
  return (
    <group>
      {/* Stem */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 3, 6]} />
        <meshStandardMaterial color={0x3A5A25} roughness={0.8} />
      </mesh>
      {/* Leaves */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[Math.sin(i * 2.1) * 0.6, 1 + i * 0.7, Math.cos(i * 2.1) * 0.6]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.5, 6, 4]} />
          <meshStandardMaterial color={0x4A7A3A} roughness={0.8} />
        </mesh>
      ))}
      {/* Fruit */}
      <mesh position={[0.4, 1.5, 0.3]} castShadow>
        <sphereGeometry args={[0.3, 8, 6]} />
        <meshStandardMaterial color={0xCC3333} roughness={0.6} />
      </mesh>
    </group>
  )
}
