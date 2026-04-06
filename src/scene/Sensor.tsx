import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { THRESHOLD_LOW, THRESHOLD_MED, ROWS } from '../lib/constants'
import { useHortStore } from '../lib/store'
import Tooltip3D from './Tooltip3D'

interface Props {
  index: number
  humidity: number
}

export default function Sensor({ index, humidity }: Props) {
  const ledRef = useRef<THREE.Mesh>(null)
  const valveRef = useRef<THREE.Mesh>(null)
  const handleRef = useRef<THREE.Mesh>(null)
  const row = ROWS[index]
  const irrigating = useHortStore(s => s.irrigating[index])
  const selectedValve = useHortStore(s => s.selectedValve)
  const selectValve = useHortStore(s => s.selectValve)
  const toggleIrrigation = useHortStore(s => s.toggleIrrigation)
  const setExpandedPanel = useHortStore(s => s.setExpandedPanel)
  const isSelected = selectedValve === index

  const emissiveColor = irrigating
    ? 0x3399FF
    : humidity < THRESHOLD_LOW
    ? 0xB33A3A
    : humidity < THRESHOLD_MED
    ? 0xC4873D
    : row.accentHex

  useFrame(({ clock }) => {
    const isActive = useHortStore.getState().irrigating[index]

    if (ledRef.current) {
      const ledMat = ledRef.current.material as THREE.MeshStandardMaterial
      const eColor = isActive ? 0x3399FF : emissiveColor
      ledMat.emissive.set(eColor)
      ledMat.color.set(eColor)
      ledMat.emissiveIntensity = isActive
        ? 0.5 + Math.sin(clock.elapsedTime * 5) * 0.3
        : 0.3 + Math.sin(clock.elapsedTime * 2 + index) * 0.2
    }

    if (valveRef.current) {
      const vMat = valveRef.current.material as THREE.MeshStandardMaterial
      vMat.color.set(isActive ? 0x2266AA : 0x444444)
    }

    if (handleRef.current) {
      const hMat = handleRef.current.material as THREE.MeshStandardMaterial
      hMat.color.set(isActive ? 0x1155AA : 0x222222)
    }
  })

  return (
    <group onClick={(e) => { e.stopPropagation(); selectValve(isSelected ? -1 : index) }}>
      {/* Valve body */}
      <mesh ref={valveRef} position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.8]} />
        <meshStandardMaterial
          color={irrigating ? 0x2266AA : 0x444444}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>

      {/* Pipe connectors */}
      <mesh position={[0, 0.3, -0.5]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 8]} />
        <meshStandardMaterial color={0x333333} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.3, 0.5]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 8]} />
        <meshStandardMaterial color={0x333333} roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Valve handle */}
      <mesh ref={handleRef} position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.15, 8]} />
        <meshStandardMaterial
          color={irrigating ? 0x1155AA : 0x222222}
          roughness={0.4}
          metalness={0.4}
        />
      </mesh>

      {/* Status LED */}
      <mesh ref={ledRef} position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[0, 0.75, 0]} color={emissiveColor} intensity={0.4} distance={5} />

      {/* Row label */}
      <mesh position={[0, 0.3, 0.41]}>
        <planeGeometry args={[0.35, 0.2]} />
        <meshStandardMaterial color={row.accentHex} roughness={0.5} />
      </mesh>

      {/* Tooltip — floats above valve when selected */}
      {isSelected && (
        <Tooltip3D
          position={[0, 2.5, 0]}
          borderColor={irrigating ? '#4499DD' : row.accent}
          onClose={() => selectValve(-1)}
          onExpand={() => { selectValve(-1); setExpandedPanel(`valve-${index}`) }}
        >
          <div style={{ textAlign: 'center', paddingTop: '8px' }}>
            <div style={{
              fontSize: '0.65rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: '#8a7e6b', marginBottom: '4px',
            }}>
              {row.badge} — {row.name}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '6px', fontSize: '0.75rem', marginBottom: '8px',
              color: irrigating ? '#4499DD' : '#8a7e6b',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: irrigating ? '#4499DD' : '#555',
                boxShadow: irrigating ? '0 0 8px rgba(68,153,221,0.6)' : 'none',
              }} />
              {irrigating ? 'Regant...' : 'Vàlvula tancada'}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleIrrigation(index) }}
              style={{
                width: '100%', padding: '7px 12px', border: 'none', borderRadius: '8px',
                fontFamily: "'Outfit', sans-serif", fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', color: '#fff',
                background: irrigating
                  ? 'linear-gradient(135deg, #AA3333, #DD4444)'
                  : 'linear-gradient(135deg, #2277BB, #33AAEE)',
                boxShadow: irrigating
                  ? '0 3px 12px rgba(170,51,51,0.4)'
                  : '0 3px 12px rgba(34,119,187,0.4)',
              }}
            >
              {irrigating ? '⏹ Parar reg' : '💧 Regar'}
            </button>
          </div>
        </Tooltip3D>
      )}
    </group>
  )
}
