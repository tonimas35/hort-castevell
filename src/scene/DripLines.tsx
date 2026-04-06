import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BANCAL_W, BANCAL_L } from '../lib/constants'
import { useHortStore } from '../lib/store'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uTime;
  uniform float uActive;
  varying vec2 vUv;

  void main() {
    vec3 pipeColor = vec3(0.13, 0.13, 0.13);
    vec3 waterColor = vec3(0.2, 0.55, 0.9);

    float lineSpeed = uTime * 1.5;
    float line1 = smoothstep(0.4, 0.5, fract(vUv.y * 8.0 - lineSpeed));
    float line2 = smoothstep(0.4, 0.5, fract(vUv.y * 8.0 - lineSpeed * 1.3 + 0.33));
    float line3 = smoothstep(0.4, 0.5, fract(vUv.y * 8.0 - lineSpeed * 0.8 + 0.66));
    float lines = max(line1, max(line2, line3));

    float glow = 0.15 + 0.1 * sin(uTime * 3.0);
    float waterMix = uActive * (lines * 0.7 + glow);
    vec3 finalColor = mix(pipeColor, waterColor, waterMix);
    finalColor += waterColor * uActive * glow * 0.3;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

function DripLine({ rowIndex }: { rowIndex: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const rowX = -BANCAL_W / 2 + 3.5 + rowIndex * (BANCAL_W - 7) / 3

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uActive: { value: 0 },
  }), [])

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime
    const isActive = useHortStore.getState().irrigating[rowIndex]
    uniforms.uActive.value = isActive ? 1.0 : 0.0
  })

  return (
    <mesh ref={meshRef} position={[rowX, 0.9, 0]} rotation-x={Math.PI / 2}>
      <cylinderGeometry args={[0.18, 0.18, BANCAL_L - 2, 16, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}

export default function DripLines() {
  return (
    <>
      {[0, 1, 2, 3].map(i => (
        <DripLine key={i} rowIndex={i} />
      ))}
    </>
  )
}
