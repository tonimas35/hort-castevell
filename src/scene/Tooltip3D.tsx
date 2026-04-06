import { Html } from '@react-three/drei'

interface Props {
  position: [number, number, number]
  borderColor: string
  onClose: () => void
  onExpand?: () => void
  children: React.ReactNode
}

export default function Tooltip3D({ position, borderColor, onClose, onExpand, children }: Props) {
  return (
    <Html position={position} center distanceFactor={15} style={{ pointerEvents: 'auto' }}>
      <div style={{
        background: 'rgba(20, 20, 16, 0.92)',
        backdropFilter: 'blur(12px)',
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '10px 14px',
        paddingTop: '24px',
        color: '#F2EBD9',
        fontFamily: "'Outfit', sans-serif",
        minWidth: '140px',
        boxShadow: `0 8px 30px rgba(0,0,0,0.5)`,
        userSelect: 'none',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: '6px', right: '6px',
          display: 'flex', gap: '3px',
        }}>
          {onExpand && (
            <button onClick={(e) => { e.stopPropagation(); onExpand() }} style={{
              background: 'rgba(253,250,243,0.1)', border: 'none',
              color: '#8a7e6b', fontSize: '0.65rem',
              cursor: 'pointer', padding: '3px 6px',
              borderRadius: '4px', lineHeight: 1,
            }}>⛶</button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onClose() }} style={{
            background: 'rgba(253,250,243,0.1)', border: 'none',
            color: '#8a7e6b', fontSize: '0.75rem',
            cursor: 'pointer', padding: '3px 6px',
            borderRadius: '4px', lineHeight: 1,
          }}>×</button>
        </div>
        {children}
      </div>
      <div style={{
        width: 0, height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: `8px solid ${borderColor}`,
        margin: '0 auto',
      }} />
    </Html>
  )
}
