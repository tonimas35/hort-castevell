export default function Aubergine() {
  return (
    <group>
      {/* Bush */}
      <mesh position={[0, 0.9, 0]} scale={[1, 0.8, 1]} castShadow>
        <sphereGeometry args={[0.85, 8, 6]} />
        <meshStandardMaterial color={0x3A5A2E} roughness={0.8} />
      </mesh>
      {/* Aubergine fruit */}
      <mesh position={[0.4, 0.6, 0.4]} rotation-z={0.5}>
        <capsuleGeometry args={[0.18, 0.6, 4, 8]} />
        <meshStandardMaterial color={0x4A2060} roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  )
}
