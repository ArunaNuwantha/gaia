import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture, Stars, CameraControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { CountryBase } from '../types';

// Augment global JSX namespace to include Three.js intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      directionalLight: any;
      group: any;
      mesh: any;
      meshPhongMaterial: any;
      meshBasicMaterial: any;
      sphereGeometry: any;
      ringGeometry: any;
    }
  }
}

// Also augment React's JSX namespace specifically for stricter type environments
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      directionalLight: any;
      group: any;
      mesh: any;
      meshPhongMaterial: any;
      meshBasicMaterial: any;
      sphereGeometry: any;
      ringGeometry: any;
    }
  }
}

interface Globe3DProps {
  countries: CountryBase[];
  onSelectCountry: (country: CountryBase) => void;
  selectedCountry: CountryBase | null;
}

// Utility to convert Lat/Lng to Vector3
const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

const Globe3D: React.FC<Globe3DProps> = ({ countries, onSelectCountry, selectedCountry }) => {
  const globeRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<CameraControls>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // High-res textures from reliable source (Three.js official examples)
  const [colorMap, normalMap, specMap, cloudsMap] = useTexture([
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'
  ]);

  // Rotate globe slowly
  useFrame(() => {
    if (globeRef.current && !selectedCountry) {
      globeRef.current.rotation.y += 0.0005;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0007;
    }
  });

  // Handle Selection & Camera Movement
  useEffect(() => {
    if (selectedCountry && controlsRef.current) {
      const [lat, lng] = selectedCountry.latlng;
      
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 90) * (Math.PI / 180); // +90 offset for texture mapping alignment

      controlsRef.current.setLookAt(
        // Camera position (zoomed in)
        12 * Math.sin(phi) * Math.sin(theta),
        12 * Math.cos(phi),
        12 * Math.sin(phi) * Math.cos(theta),
        // Target (Center of globe)
        0, 0, 0,
        true // Animate
      );
    } else if (!selectedCountry && controlsRef.current) {
       // Reset zoom if deselected
       controlsRef.current.dollyTo(18, true);
    }
  }, [selectedCountry]);

  // Click handler to find nearest country
  const handleClick = (e: any) => {
    e.stopPropagation();
    const point = e.point;
    if (!countries.length) return;
    
    let minDist = Infinity;
    let closest: CountryBase | null = null;

    countries.forEach(c => {
      const pos = latLngToVector3(c.latlng[0], c.latlng[1], 5);
      pos.applyMatrix4(globeRef.current!.matrixWorld);
      
      const dist = point.distanceTo(pos);
      if (dist < minDist) {
        minDist = dist;
        closest = c;
      }
    });

    if (closest && minDist < 2.5) {
       onSelectCountry(closest as CountryBase);
    }
  };

  return (
    <>
      <CameraControls ref={controlsRef} minDistance={6} maxDistance={30} />
      <ambientLight intensity={0.4} color="#bbbbff" />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <group ref={groupRef}>
        {/* Main Earth Sphere */}
        <Sphere ref={globeRef} args={[5, 64, 64]} onClick={handleClick} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
          <meshPhongMaterial
            map={colorMap}
            specularMap={specMap}
            normalMap={normalMap}
            specular={new THREE.Color('grey')}
            shininess={10}
          />
        </Sphere>

        {/* Clouds Sphere (slightly larger) */}
        <Sphere ref={cloudsRef} args={[5.05, 64, 64]}>
          <meshPhongMaterial
            map={cloudsMap}
            transparent
            opacity={0.4}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </Sphere>

        {/* Glow/Atmosphere Effect */}
        <Sphere args={[5.2, 32, 32]}>
          <meshBasicMaterial
             color="#4488ff"
             transparent
             opacity={0.1}
             side={THREE.BackSide}
             blending={THREE.AdditiveBlending}
          />
        </Sphere>
        
        {/* Interactive Markers for Selected Country */}
        {selectedCountry && (
          <Marker country={selectedCountry} globeRotation={globeRef.current?.rotation} />
        )}
      </group>
    </>
  );
};

// Helper component for the pulsing marker on selected country
const Marker = ({ country, globeRotation }: { country: CountryBase, globeRotation?: THREE.Euler }) => {
   const pos = useMemo(() => latLngToVector3(country.latlng[0], country.latlng[1], 5.08), [country]);
   
   return (
      <group rotation={globeRotation}>
         <mesh position={pos}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#00ffcc" toneMapped={false} />
            <Html distanceFactor={15}>
                <div className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm border border-cyan-500/30 whitespace-nowrap">
                  {country.name.common}
                </div>
            </Html>
         </mesh>
         <mesh position={pos}>
            <ringGeometry args={[0.12, 0.18, 32]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} />
         </mesh>
      </group>
   )
}

export default Globe3D;