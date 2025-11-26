import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, useTexture, Stars, CameraControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { CountryBase } from '../types';
import { Compass as CompassIcon } from 'lucide-react';

// Augment global JSX namespace to include Three.js intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      directionalLight: any;
      spotLight: any;
      group: any;
      mesh: any;
      meshPhongMaterial: any;
      meshBasicMaterial: any;
      sphereGeometry: any;
      ringGeometry: any;
      lineSegments: any;
      lineBasicMaterial: any;
    }
  }
}

// Also augment React's JSX namespace specifically for stricter type environments
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      directionalLight: any;
      spotLight: any;
      group: any;
      mesh: any;
      meshPhongMaterial: any;
      meshBasicMaterial: any;
      sphereGeometry: any;
      ringGeometry: any;
      lineSegments: any;
      lineBasicMaterial: any;
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

const Borders: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Failed to load borders", err));
  }, []);

  const geometry = useMemo(() => {
    if (!data) return null;
    const points: number[] = [];
    const radius = 5.015; // Just above the surface

    data.features.forEach((feature: any) => {
       const processRing = (ring: any[]) => {
          for (let i = 0; i < ring.length - 1; i++) {
             // GeoJSON is [lng, lat]
             const v1 = latLngToVector3(ring[i][1], ring[i][0], radius);
             const v2 = latLngToVector3(ring[i+1][1], ring[i+1][0], radius);
             points.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
          }
       };

       if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates.forEach((ring: any[]) => processRing(ring));
       } else if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach((poly: any[]) => {
             poly.forEach((ring: any[]) => processRing(ring));
          });
       }
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geo;
  }, [data]);

  if (!geometry) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#55ffff" transparent opacity={0.25} depthWrite={false} />
    </lineSegments>
  );
};

// Compass Component
const Compass = () => {
  const { camera } = useThree();
  const compassRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    if (compassRef.current) {
      // Calculate azimuth angle (rotation around Y axis)
      // We want the angle of the camera position relative to center (0,0,0)
      const angle = Math.atan2(camera.position.x, camera.position.z);
      // Convert to degrees and apply to the UI element
      const degrees = angle * (180 / Math.PI);
      compassRef.current.style.transform = `rotate(${degrees}deg)`;
    }
  });

  return (
    <Html fullscreen style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <div className="absolute bottom-8 right-8 z-50 pointer-events-auto">
        <div className="relative w-16 h-16 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-xl flex items-center justify-center">
          {/* Static North Marker */}
          <div className="absolute top-1 text-[10px] font-bold text-cyan-400">N</div>
          
          {/* Rotating Needle */}
          <div ref={compassRef} className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-linear will-change-transform">
             <div className="w-1 h-8 bg-gradient-to-t from-red-500 to-transparent opacity-80 rounded-full origin-bottom transform -translate-y-2"></div>
             <CompassIcon size={32} className="text-white/80 absolute" strokeWidth={1} />
          </div>
        </div>
      </div>
    </Html>
  );
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
      
      {/* Enhanced Lighting Setup */}
      <ambientLight intensity={1.5} color="#ffffff" />
      <directionalLight position={[5, 3, 5]} intensity={3.5} castShadow />
      <spotLight position={[-5, -5, -5]} intensity={1.0} color="#4455aa" angle={0.5} />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <group ref={groupRef}>
        {/* Main Earth Sphere */}
        <Sphere ref={globeRef} args={[5, 64, 64]} onClick={handleClick} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
          <meshPhongMaterial
            map={colorMap}
            specularMap={specMap}
            normalMap={normalMap}
            specular={new THREE.Color(0x333333)}
            shininess={15}
          />
          {/* Borders overlay - nested to rotate with the globe */}
          <Borders />
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
             opacity={0.15}
             side={THREE.BackSide}
             blending={THREE.AdditiveBlending}
          />
        </Sphere>
        
        {/* Interactive Markers for Selected Country */}
        {selectedCountry && (
          <Marker country={selectedCountry} globeRotation={globeRef.current?.rotation} />
        )}
      </group>
      
      {/* Compass Overlay */}
      <Compass />
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