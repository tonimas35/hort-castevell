import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Scene3D = lazy(() => import('./pages/Scene3D'))
const ControlPanel = lazy(() => import('./pages/ControlPanel'))
const DeviceLog = lazy(() => import('./pages/DeviceLog'))

export default function App() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Outfit, sans-serif', color: '#7A6F5E' }}>Carregant...</div>}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/3d" element={<Scene3D />} />
        <Route path="/control" element={<ControlPanel />} />
        <Route path="/log" element={<DeviceLog />} />
      </Routes>
    </Suspense>
  )
}
