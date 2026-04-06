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

// Demo data per fila quan no hi ha dades reals
const DEMO_DATA = [
  { humidity_pct: 42, humidity_raw: 2245, battery_v: 3.85, last_seen_s: 900 },
  { humidity_pct: 55, humidity_raw: 1932, battery_v: 3.92, last_seen_s: 1200 },
  { humidity_pct: 31, humidity_raw: 2410, battery_v: 3.71, last_seen_s: 600 },
  { humidity_pct: 68, humidity_raw: 1578, battery_v: 4.01, last_seen_s: 450 },
]

function fmtDuration(s: number) {
  if (s < 60) return 'Ara'
  if (s < 3600) return Math.floor(s / 60) + ' min'
  if (s < 86400) return Math.floor(s / 3600) + 'h'
  return Math.floor(s / 86400) + 'd'
}

export default function HumiditySensor({ index, humidity }: Props) {
  const ledRef = useRef<THREE.Mesh>(null)
  const row = ROWS[index]
  const reading = useHortStore(s => s.reading)
  const selectedSensor = useHortStore(s => s.selectedSensor)
  const selectSensor = useHortStore(s => s.selectSensor)
  const setExpandedPanel = useHortStore(s => s.setExpandedPanel)

  // Use real node data or demo
  const node = reading?.nodes.find(n => n.id === row.id) ?? DEMO_DATA[index]
  const pct = node.humidity_pct
  const isSelected = selectedSensor === index

  const ledColor = pct < THRESHOLD_LOW
    ? 0xDD3333
    : pct < THRESHOLD_MED
    ? 0xDDAA33
    : 0x33DD55

  const statusText = pct < THRESHOLD_LOW ? 'Sec — Cal regar!' : pct < THRESHOLD_MED ? 'Vigilar' : 'Bé'
  const statusColor = pct < THRESHOLD_LOW ? '#DD4444' : pct < THRESHOLD_MED ? '#DDAA33' : '#44CC55'

  useFrame(({ clock }) => {
    if (!ledRef.current) return
    const mat = ledRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.4 + Math.sin(clock.elapsedTime * 3 + index * 1.5) * 0.25
  })

  return (
    <group onClick={(e) => { e.stopPropagation(); selectSensor(isSelected ? -1 : index) }}>
      {/* Sensor probe */}
      <mesh position={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[0.12, 1.0, 0.4]} />
        <meshStandardMaterial color={0x1a1a1a} roughness={0.6} />
      </mesh>

      {/* Probe tip */}
      <mesh position={[0, -0.9, 0]}>
        <boxGeometry args={[0.1, 0.3, 0.35]} />
        <meshStandardMaterial color={0x111111} roughness={0.5} />
      </mesh>

      {/* PCB housing */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.5, 0.35, 0.7]} />
        <meshStandardMaterial color={0x1A3A6E} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Connector pins */}
      {[-0.12, 0, 0.12].map((x, i) => (
        <mesh key={i} position={[x, 0.56, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.08, 6]} />
          <meshStandardMaterial color={0xCCAA33} roughness={0.3} metalness={0.6} />
        </mesh>
      ))}

      {/* Wires */}
      {[
        { x: -0.12, color: 0xCC2222 },
        { x: 0, color: 0xCCAA22 },
        { x: 0.12, color: 0x222222 },
      ].map((wire, i) => (
        <mesh key={`w-${i}`} position={[wire.x, 0.75, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.35, 4]} />
          <meshStandardMaterial color={wire.color} roughness={0.6} />
        </mesh>
      ))}

      {/* Status LED */}
      <mesh ref={ledRef} position={[0.15, 0.42, 0.36]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[0.15, 0.42, 0.36]} color={ledColor} intensity={0.1} distance={1.5} />

      {/* Label plate */}
      <mesh position={[0, 0.35, 0.36]}>
        <planeGeometry args={[0.3, 0.12]} />
        <meshStandardMaterial color={0xEEEEDD} roughness={0.5} />
      </mesh>

      {/* Row color strip */}
      <mesh position={[0, 0.25, 0.36]}>
        <planeGeometry args={[0.3, 0.04]} />
        <meshStandardMaterial color={row.accentHex} roughness={0.4} />
      </mesh>

      {/* Data tooltip */}
      {isSelected && (
        <Tooltip3D
          position={[0, 2.5, 0]}
          borderColor={row.accent}
          onClose={() => selectSensor(-1)}
          onExpand={() => { selectSensor(-1); setExpandedPanel(`sensor-${index}`) }}
        >
          <div style={{ paddingTop: '8px' }}>
            <div style={{
              fontSize: '0.6rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: '#8a7e6b', marginBottom: '6px',
            }}>
              {row.badge} — Sensor humitat
            </div>
            <div style={{
              fontSize: '2rem', fontWeight: 800,
              color: statusColor, lineHeight: 1,
              marginBottom: '4px', fontVariantNumeric: 'tabular-nums',
            }}>
              {pct}%
            </div>
            <div style={{
              fontSize: '0.7rem', color: statusColor,
              fontWeight: 600, marginBottom: '10px',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: statusColor, boxShadow: `0 0 6px ${statusColor}`,
              }} />
              {statusText}
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '6px 12px', fontSize: '0.65rem', color: '#8a7e6b',
            }}>
              <div>
                <div style={{ color: '#F2EBD9', fontWeight: 600, fontSize: '0.8rem' }}>
                  {('humidity_raw' in node) ? (node as any).humidity_raw : '—'}
                </div>
                <div>Raw ADC</div>
              </div>
              <div>
                <div style={{ color: '#F2EBD9', fontWeight: 600, fontSize: '0.8rem' }}>
                  {('battery_v' in node) ? (node as any).battery_v.toFixed(2) + 'V' : '—'}
                </div>
                <div>Bateria</div>
              </div>
              <div>
                <div style={{ color: '#F2EBD9', fontWeight: 600, fontSize: '0.8rem' }}>
                  {('last_seen_s' in node) ? fmtDuration((node as any).last_seen_s) : '—'}
                </div>
                <div>Última lectura</div>
              </div>
              <div>
                <div style={{ color: '#F2EBD9', fontWeight: 600, fontSize: '0.8rem' }}>
                  {row.name}
                </div>
                <div>Fila</div>
              </div>
            </div>
          </div>
        </Tooltip3D>
      )}
    </group>
  )
}
