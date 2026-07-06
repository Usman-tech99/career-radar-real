import { useRef, useMemo, useCallback, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

const earthMapUrl = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'
const R = 2
const MARKER_COLOR = '#10B981'

function latLngToPosition(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function createDotTexture(color = MARKER_COLOR, size = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const cy = size / 2
  const r = size / 2
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
  grad.addColorStop(0, color)
  grad.addColorStop(0.25, color)
  grad.addColorStop(0.6, color + '88')
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

function Earth() {
  const meshRef = useRef()
  const [texLoaded, setTexLoaded] = useState(false)
  const tex = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const t = loader.load(earthMapUrl, () => setTexLoaded(true))
    return t
  }, [])

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.05
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[R, 64, 64]} />
      <meshPhongMaterial
        map={tex}
        transparent
        opacity={texLoaded ? 1 : 0.6}
        color={texLoaded ? 'white' : '#3B82F6'}
        specular={new THREE.Color('#333')}
        shininess={5}
      />
    </mesh>
  )
}

function Atmosphere() {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.uniforms.uTime.value = clock.elapsedTime
    }
  })

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#60A5FA') },
  }), [])

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec3 viewDir = normalize(-vPosition);
      float intensity = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);
      intensity *= 0.5 + 0.08 * sin(uTime * 0.5);
      gl_FragColor = vec4(uColor, intensity * 0.45);
    }
  `

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[R * 1.08, 64, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.FrontSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function Marker({ lat, lng, label, color = MARKER_COLOR, onClick, onHover }) {
  const pos = useMemo(() => latLngToPosition(lat, lng, R * 1.01), [lat, lng])
  const spriteRef = useRef()
  const [hovered, setHovered] = useState(false)
  const tex = useMemo(() => createDotTexture(color), [color])

  useFrame(({ clock }) => {
    if (spriteRef.current) {
      const scale = 0.2 + 0.08 * Math.sin(clock.elapsedTime * 1.5 + lat + lng)
      spriteRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group position={pos}>
      <sprite
        ref={spriteRef}
        scale={[0.2, 0.2, 1]}
        onPointerOver={() => { setHovered(true); onHover?.(true) }}
        onPointerOut={() => { setHovered(false); onHover?.(false) }}
        onClick={() => onClick?.(label)}
      >
        <spriteMaterial map={tex} transparent depthTest={false} />
      </sprite>
      {hovered && (
        <Html distanceFactor={6} center>
          <div className="px-2 py-1 rounded-lg bg-black/80 border border-white/20 text-white text-xs font-medium whitespace-nowrap backdrop-blur-sm">
            {label}
          </div>
        </Html>
      )}
    </group>
  )
}

function GlobeScene({ markers, onMarkerClick, onMarkerHover }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-5, -3, -5]} intensity={0.3} />
      <Earth />
      <Atmosphere />
      {markers.map((m, i) => (
        <Marker
          key={i}
          lat={m.lat}
          lng={m.lng}
          label={m.label}
          color={m.color || MARKER_COLOR}
          onClick={onMarkerClick}
          onHover={(h) => onMarkerHover?.(h ? m : null)}
        />
      ))}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.3}
        autoRotate
        autoRotateSpeed={0.3}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  )
}

export function Globe3D({ markers = [], config = {}, onMarkerClick, onMarkerHover, className = '' }) {
  return (
    <div className={`relative w-full h-[400px] md:h-[500px] ${className}`}>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
        <GlobeScene
          markers={markers}
          onMarkerClick={onMarkerClick}
          onMarkerHover={onMarkerHover}
        />
      </Canvas>
    </div>
  )
}
