import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BANCAL_W, BANCAL_L, ROWS } from '../lib/constants'
import { useHortStore } from '../lib/store'
import Tooltip3D from './Tooltip3D'

function fmtDuration(s: number) {
  if (s < 60) return 'Ara'
  if (s < 3600) return Math.floor(s / 60) + ' min'
  if (s < 86400) return Math.floor(s / 3600) + 'h'
  return Math.floor(s / 86400) + 'd'
}

export default function CentralUnit() {
  const [showPanel, setShowPanel] = useState(false)
  const ledRef = useRef<THREE.Mesh>(null)
  const reading = useHortStore(s => s.reading)
  const isConnected = useHortStore(s => s.isConnected)
  const irrigating = useHortStore(s => s.irrigating)
  const setExpandedPanel = useHortStore(s => s.setExpandedPanel)

  const ambient = reading?.ambient
  const nodes = reading?.nodes ?? []
  const activeNodes = nodes.length
  const irrigatingCount = irrigating.filter(Boolean).length

  // LED pulse
  useFrame(({ clock }) => {
    if (!ledRef.current) return
    const mat = ledRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 1.0 + Math.sin(clock.elapsedTime * 2) * 0.5
  })

  return (
    <group position={[BANCAL_W / 2 + 5, 0, -BANCAL_L / 2]} onClick={(e) => { e.stopPropagation(); setShowPanel(!showPanel) }}>
      {/* Wooden post */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.3, 4, 0.3]} />
        <meshStandardMaterial color={0x654321} roughness={0.9} />
      </mesh>

      {/* IP65 Box */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[2, 1.5, 1]} />
        <meshStandardMaterial
          color={showPanel ? 0x99AAAA : 0x888888}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Antenna */}
      <mesh position={[0.6, 3.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2, 6]} />
        <meshStandardMaterial color={0x333333} />
      </mesh>

      {/* Status LED */}
      <mesh ref={ledRef} position={[0, 2.5, 0.55]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color={isConnected ? 0x00ff00 : 0xff4444}
          emissive={isConnected ? 0x00ff00 : 0xff4444}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* LED glow */}
      <pointLight position={[0, 2.5, 0.55]} color={isConnected ? 0x00ff00 : 0xff4444} intensity={0.5} distance={5} />

      {/* Panel tooltip */}
      {showPanel && (
        <Tooltip3D
          position={[0, 7, 0]}
          borderColor="rgba(100, 200, 100, 0.4)"
          onClose={() => setShowPanel(false)}
          onExpand={() => { setShowPanel(false); setExpandedPanel('central') }}
        >
          <div style={{ paddingTop: '8px' }}>
            {/* Title */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '12px', paddingBottom: '8px',
              borderBottom: '1px solid rgba(253,250,243,0.1)',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isConnected ? '#44DD44' : '#DD4444',
                boxShadow: isConnected ? '0 0 8px rgba(68,221,68,0.6)' : '0 0 8px rgba(221,68,68,0.6)',
              }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Unitat Central</span>
              <span style={{
                fontSize: '0.6rem', fontWeight: 500,
                padding: '2px 6px', borderRadius: '4px',
                background: isConnected ? 'rgba(68,221,68,0.15)' : 'rgba(221,68,68,0.15)',
                color: isConnected ? '#44DD44' : '#DD4444',
                marginLeft: 'auto',
              }}>
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            {/* Ambient */}
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a7e6b', marginBottom: '6px' }}>
              Sensors ambientals
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#E8A050' }}>{ambient?.temperature != null ? ambient.temperature + '°' : '23.5°'}</div>
                <div style={{ fontSize: '0.55rem', color: '#8a7e6b' }}>TEMP</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#50A0D0' }}>{ambient?.humidity != null ? ambient.humidity + '%' : '58%'}</div>
                <div style={{ fontSize: '0.55rem', color: '#8a7e6b' }}>HUMITAT</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#D0C050' }}>{ambient?.lux != null ? (ambient.lux >= 1000 ? (ambient.lux/1000).toFixed(0)+'k' : ambient.lux) : '45k'}</div>
                <div style={{ fontSize: '0.55rem', color: '#8a7e6b' }}>LUX</div>
              </div>
            </div>

            {/* Nodes */}
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a7e6b', marginBottom: '6px' }}>
              Nodes ({activeNodes}/4 actius)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              {ROWS.map((row, i) => {
                const node = nodes.find(n => n.id === row.id)
                const isIrrigating = irrigating[i]
                return (
                  <div key={row.id} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '0.7rem', padding: '3px 6px', borderRadius: '6px',
                    background: isIrrigating ? 'rgba(68,153,221,0.1)' : 'rgba(253,250,243,0.03)',
                  }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 700, background: row.accent, color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>{row.badge}</span>
                    <span style={{ flex: 1, color: '#aaa', fontSize: '0.65rem' }}>{row.name}</span>
                    {node ? <span style={{ fontWeight: 600, color: '#F2EBD9' }}>{node.humidity_pct}%</span> : <span style={{ color: '#555', fontSize: '0.6rem' }}>—</span>}
                    {node?.last_seen_s != null && <span style={{ color: '#666', fontSize: '0.55rem' }}>{fmtDuration(node.last_seen_s)}</span>}
                    {isIrrigating && <span style={{ color: '#4499DD', fontSize: '0.6rem' }}>💧</span>}
                  </div>
                )
              })}
            </div>

            {/* System */}
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a7e6b', marginBottom: '6px' }}>Sistema</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '0.65rem', color: '#8a7e6b' }}>
              <div><span style={{ color: '#F2EBD9', fontWeight: 600 }}>ESP32-WROOM-32</span><div>Microcontrolador</div></div>
              <div><span style={{ color: '#F2EBD9', fontWeight: 600 }}>WiFi + ESP-NOW</span><div>Comunicació</div></div>
              <div><span style={{ color: '#F2EBD9', fontWeight: 600 }}>{irrigatingCount > 0 ? `${irrigatingCount} files regant` : 'Tot aturat'}</span><div>Reg</div></div>
              <div><span style={{ color: '#F2EBD9', fontWeight: 600 }}>Supabase</span><div>Base de dades</div></div>
            </div>
          </div>
        </Tooltip3D>
      )}
    </group>
  )
}
