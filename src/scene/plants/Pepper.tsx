export default function Pepper() {
  return (
    <group>
      {/* Bush */}
      <mesh position={[0, 0.8, 0]} scale={[1, 0.7, 1]} castShadow>
        <sphereGeometry args={[0.9, 8, 6]} />
        <meshStandardMaterial color={0x3D6B30} roughness={0.8} />
      </mesh>
      {/* Pepper fruit */}
      <mesh position={[0.5, 0.9, 0.3]} rotation-z={0.3}>
        <capsuleGeometry args={[0.15, 0.5, 4, 6]} />
        <meshStandardMaterial color={0xDD4422} roughness={0.5} />
      </mesh>
    </group>
  )
}
