'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Float, Environment, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function FloatingCard({
    position,
    rotation,
    color,
    scale = [1.8, 1.1, 0.05],
    delay = 0,
    reduceMotion = false,
}: {
    position: [number, number, number];
    rotation: [number, number, number];
    color: string;
    scale?: [number, number, number];
    delay?: number;
    reduceMotion?: boolean;
}) {
    const meshRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        if (reduceMotion) return;
        if (meshRef.current) {
            meshRef.current.rotation.x =
                rotation[0] + Math.sin(state.clock.elapsedTime * 0.3 + delay) * 0.05;
            meshRef.current.rotation.y =
                rotation[1] + Math.sin(state.clock.elapsedTime * 0.2 + delay) * 0.08;
            meshRef.current.position.y =
                position[1] + Math.sin(state.clock.elapsedTime * 0.5 + delay) * 0.1;
        }
    });

    return (
        <Float speed={reduceMotion ? 0 : 1.5} rotationIntensity={reduceMotion ? 0 : 0.1} floatIntensity={reduceMotion ? 0 : 0.2}>
            <group ref={meshRef} position={position} rotation={rotation}>
                <RoundedBox args={scale} radius={0.04} smoothness={4} castShadow>
                    <meshPhysicalMaterial
                        color={color}
                        transparent
                        opacity={0.8}
                        roughness={0.15}
                        metalness={0.1}
                        transmission={0.9}
                        thickness={1.5}
                        clearcoat={1}
                        clearcoatRoughness={0.1}
                    />
                </RoundedBox>
            </group>
        </Float>
    );
}

function Particles({ count = 80, reduceMotion = false }: { count?: number; reduceMotion?: boolean }) {
    const points = useRef<THREE.Points>(null!);

    const particlePositions = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 12;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
        }
        return positions;
    }, [count]);

    useFrame((state) => {
        if (reduceMotion) return;
        if (points.current) {
            points.current.rotation.y = state.clock.elapsedTime * 0.02;
            points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
        }
    });

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        return geo;
    }, [particlePositions]);

    return (
        <points ref={points} geometry={geometry}>
            <pointsMaterial
                size={0.015}
                color="#34c759"
                transparent
                opacity={0.4}
                sizeAttenuation
            />
        </points>
    );
}

function Scene({ reduceMotion = false }: { reduceMotion?: boolean }) {
    return (
        <>
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
            <directionalLight position={[-10, 5, -10]} intensity={1.0} color="#fbfbfd" />
            <pointLight position={[0, 0, 5]} intensity={0.5} color="#7cb99e" distance={15} />

            {/* Left Far Background (Tall Blue-ish) */}
            <FloatingCard
                position={[-4.5, -0.5, -3]}
                rotation={[0.1, 0.4, -0.2]}
                scale={[2.5, 3.5, 0.05]}
                color="#6fa3c4"
                delay={0}
                reduceMotion={reduceMotion}
            />
            {/* Left Foreground (Square Green-ish, floating above) */}
            <FloatingCard
                position={[-3, -0.5, -1]}
                rotation={[-0.05, 0.3, 0.05]}
                scale={[1.8, 1.8, 0.05]}
                color="#7cb99e"
                delay={1}
                reduceMotion={reduceMotion}
            />
            {/* Right Foreground (Vertical Green-ish) */}
            <FloatingCard
                position={[3.5, 0.8, -1.5]}
                rotation={[-0.1, -0.3, -0.05]}
                scale={[1.6, 2.2, 0.05]}
                color="#7cb99e"
                delay={2}
                reduceMotion={reduceMotion}
            />
            {/* Right Far Background (Vertical Darker Blue-Green) */}
            <FloatingCard
                position={[4.2, 1.2, -3]}
                rotation={[0.0, -0.4, -0.1]}
                scale={[1.5, 2.0, 0.05]}
                color="#718d8e"
                delay={3}
                reduceMotion={reduceMotion}
            />
            {/* Bottom Center (Wide Tilted Frame) */}
            <FloatingCard
                position={[0.5, -3.5, -2]}
                rotation={[-0.3, 0.1, -0.1]}
                scale={[3.5, 2.0, 0.05]}
                color="#81a2aa"
                delay={4}
                reduceMotion={reduceMotion}
            />

            <Particles count={reduceMotion ? 24 : 80} reduceMotion={reduceMotion} />
            <Environment preset="studio" environmentIntensity={0.6} />
        </>
    );
}

export default function Hero3D({ reduceMotion = false }: { reduceMotion?: boolean }) {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                dpr={reduceMotion ? [1, 1] : [1, 1.5]}
            >
                <Scene reduceMotion={reduceMotion} />
            </Canvas>

            {/* Gradient overlays for readability */}
            <div className="absolute inset-0 bg-[#fbfbfd]/40 backdrop-blur-[1px] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.7)_0%,rgba(251,251,253,0.95)_100%)] pointer-events-none" />
        </div>
    );
}
