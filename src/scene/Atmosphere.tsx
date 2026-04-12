import { Sparkles } from '@react-three/drei'

export default function Atmosphere() {
  return (
    <>
      {/* Pol·len / motes de pols flotant — dóna vida a l'escena */}
      <Sparkles
        count={60}
        scale={[80, 15, 80]}
        size={1.2}
        speed={0.2}
        opacity={0.3}
        color="#FFFFCC"
      />

      {/* Partícules petites prop del bancal */}
      <Sparkles
        count={30}
        scale={[30, 8, 70]}
        position={[0, 3, 0]}
        size={0.8}
        speed={0.15}
        opacity={0.2}
        color="#CCFFCC"
      />
    </>
  )
}
