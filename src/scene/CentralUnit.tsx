import { BANCAL_W, BANCAL_L } from '../lib/constants'

export default function CentralUnit() {
  return (
    <group position={[BANCAL_W / 2 + 5, 0, -BANCAL_L / 2]}>
      {/* Wooden post */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.3, 4, 0.3]} />
        <meshStandardMaterial color={0x654321} roughness={0.9} />
      </mesh>

      {/* IP65 Box */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[2, 1.5, 1]} />
        <meshStandardMaterial color={0x888888} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Antenna */}
      <mesh position={[0.6, 3.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2, 6]} />
        <meshStandardMaterial color={0x333333} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 2.5, 0.55]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color={0x00ff00}
          emissive={0x00ff00}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* LED glow */}
      <pointLight position={[0, 2.5, 0.55]} color={0x00ff00} intensity={0.5} distance={5} />
    </group>
  )
}
