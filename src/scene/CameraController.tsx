import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useHortStore } from '../lib/store'
import { BANCAL_W } from '../lib/constants'

// Camera targets for each row
function getRowTarget(index: number) {
  const rowX = -BANCAL_W / 2 + 3.5 + index * (BANCAL_W - 7) / 3
  return {
    position: new THREE.Vector3(rowX + 20, 15, 20),
    lookAt: new THREE.Vector3(rowX, 1, 0),
  }
}

const DEFAULT_POS = new THREE.Vector3(25, 30, -40)
const DEFAULT_TARGET = new THREE.Vector3(0, 0, -5)
const TOP_POS = new THREE.Vector3(0, 65, -5)

export default function CameraController() {
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()
  const selectedRow = useHortStore(s => s.selectedRow)

  // Animation state
  const animating = useRef(false)
  const animStart = useRef(0)
  const fromPos = useRef(new THREE.Vector3())
  const toPos = useRef(new THREE.Vector3())
  const fromTarget = useRef(new THREE.Vector3())
  const toTarget = useRef(new THREE.Vector3())

  function startAnimation(pos: THREE.Vector3, target: THREE.Vector3) {
    fromPos.current.copy(camera.position)
    toPos.current.copy(pos)
    if (controlsRef.current) {
      fromTarget.current.copy(controlsRef.current.target)
    }
    toTarget.current.copy(target)
    animStart.current = Date.now()
    animating.current = true
  }

  // Camera animation triggered only from DOM (info cards)
  useEffect(() => {
    (window as any).__cameraToRow = (index: number) => {
      const t = getRowTarget(index)
      startAnimation(t.position, t.lookAt)
    }
    return () => { delete (window as any).__cameraToRow }
  }, [])

  useFrame(() => {
    if (!animating.current || !controlsRef.current) return

    const elapsed = Date.now() - animStart.current
    const duration = 1000
    const t = Math.min(1, elapsed / duration)
    const ease = 1 - Math.pow(1 - t, 3) // easeOutCubic

    camera.position.lerpVectors(fromPos.current, toPos.current, ease)
    controlsRef.current.target.lerpVectors(fromTarget.current, toTarget.current, ease)
    controlsRef.current.update()

    if (t >= 1) animating.current = false
  })

  // Expose reset/top functions via window for DOM buttons
  useEffect(() => {
    (window as any).__cameraReset = () => startAnimation(DEFAULT_POS, DEFAULT_TARGET)
    ;(window as any).__cameraTop = () => startAnimation(TOP_POS, DEFAULT_TARGET)
    return () => {
      delete (window as any).__cameraReset
      delete (window as any).__cameraTop
    }
  }, [])

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.12}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={8}
      maxDistance={100}
      enablePan={false}
    />
  )
}
