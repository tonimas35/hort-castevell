import { useHortStore } from '../lib/store'

export default function ConnectionBadge() {
  const isConnected = useHortStore(s => s.isConnected)

  return (
    <div className={`conn-badge ${isConnected ? 'online' : 'offline'}`}>
      <span className="conn-dot" />
      <span className="conn-text">{isConnected ? 'Connectat' : 'Desconnectat'}</span>
    </div>
  )
}
