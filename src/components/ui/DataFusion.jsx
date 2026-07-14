import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'

const COLORS = ['#F5A623', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899']
const COUNT = 5

function randomEdgePosition() {
  const side = Math.floor(Math.random() * 4)
  const t = Math.random() * 1.2 + 0.3
  switch (side) {
    case 0: return [t, (Math.random() - 0.5) * 2]
    case 1: return [-(Math.random() - 0.5) * 2, t]
    case 2: return [-t, (Math.random() - 0.5) * 2]
    default: return [(Math.random() - 0.5) * 2, -t]
  }
}

function DataPoint({ index, trigger, onDone }) {
  const meshRef = useRef()
  const [startX, startY] = useMemo(() => randomEdgePosition(), [])
  const [visible, setVisible] = useState(true)

  const { scale } = useSpring({
    scale: trigger ? 0.01 : 1,
    config: { mass: 0.5, tension: 280, friction: 18 },
    delay: trigger ? index * 60 : 0,
    onRest: () => { if (trigger && index === COUNT - 1) { setTimeout(() => { setVisible(false); onDone?.() }, 300) } },
  })

  const { x, y } = useSpring({
    x: trigger ? 0 : startX,
    y: trigger ? 0 : startY,
    config: { mass: 1.2, tension: 180, friction: 26 },
    delay: trigger ? index * 60 : 0,
  })

  useFrame(({ clock }) => {
    if (!meshRef.current || trigger) return
    meshRef.current.rotation.x = clock.getElapsedTime() * 0.5 + index
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.3 + index
  })

  if (!visible) return null

  return (
    <animated.mesh
      ref={meshRef}
      position-x={x}
      position-y={y}
      scale={scale}
    >
      <icosahedronGeometry args={[0.15, 0]} />
      <meshStandardMaterial color={COLORS[index]} emissive={COLORS[index]} emissiveIntensity={0.4} />
    </animated.mesh>
  )
}

function FusionIcon({ show, trigger }) {
  const fadeSpring = useSpring({
    opacity: show ? 1 : 0,
    scale: show ? 1 : 0,
    config: { mass: 0.6, tension: 200, friction: 20 },
  })

  const pulse = useSpring({
    scale: trigger ? [1, 1.15, 1] : 1,
    loop: trigger ? true : false,
    config: { mass: 0.4, tension: 300, friction: 12 },
  })

  return (
    <animated.group scale={fadeSpring.scale} opacity={fadeSpring.opacity}>
      <animated.mesh scale={pulse.scale}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color="#F5A623" emissive="#F5A623" emissiveIntensity={1.2} />
      </animated.mesh>
      <mesh>
        <ringGeometry args={[0.36, 0.42, 32]} />
        <meshBasicMaterial color="#F5A623" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.46, 0.5, 32]} />
        <meshBasicMaterial color="#F5A623" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </animated.group>
  )
}

function Scene({ trigger, onComplete }) {
  const [showIcon, setShowIcon] = useState(false)
  const { camera } = useThree()

  useEffect(() => {
    if (camera) {
      camera.position.z = 5
    }
  }, [camera])

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[2, 2, 3]} intensity={1.5} color="#F5A623" />
      <pointLight position={[-2, -1, 2]} intensity={0.6} color="#8B5CF6" />

      {/* Orbiting glow dots */}
      {showIcon && Array.from({ length: 8 }).map((_, i) => (
        <OrbitDot key={i} index={i} total={8} />
      ))}

      {Array.from({ length: COUNT }).map((_, i) => (
        <DataPoint key={i} index={i} trigger={trigger} onDone={() => setShowIcon(true)} />
      ))}

      {showIcon && <FusionIcon show={true} trigger={trigger} />}
    </>
  )
}

function OrbitDot({ index, total }) {
  const ref = useRef()
  const angle = (index / total) * Math.PI * 2
  const radius = 0.55

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime() * 0.6
    ref.current.position.x = Math.cos(angle + t) * radius
    ref.current.position.y = Math.sin(angle + t) * radius * 0.6
  })

  return (
    <mesh ref={ref}>
      <circleGeometry args={[0.015, 8]} />
      <meshBasicMaterial color="#F5A623" transparent opacity={0.6} />
    </mesh>
  )
}

export default function DataFusion({ trigger = false, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Canvas flat linear>
        <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={120} />
        <Scene trigger={trigger} />
      </Canvas>
    </div>
  )
}