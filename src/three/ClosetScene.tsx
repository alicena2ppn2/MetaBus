import { useFrame } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';
import * as THREE from 'three';

import type { AvatarLook } from '../data/look';
import { useNight } from '../state/theme';
import { Avatar } from './Avatar';

export type ClosetFocus = 'hair' | 'head' | 'clothes' | 'shoes';

type Props = {
  look: AvatarLook;
  /** 고르는 부위에 따라 카메라가 그쪽으로 다가간다 */
  focus: ClosetFocus;
  /** 화면을 끌어서 돌린 각도 */
  spin: RefObject<number>;
};

/** 부위별로 화면에 꼭 들어와야 하는 범위 (가운데 높이, 반너비, 반높이) */
const SHOTS: Record<ClosetFocus, { y: number; halfWidth: number; halfHeight: number }> = {
  hair: { y: 1.0, halfWidth: 0.78, halfHeight: 0.8 },
  head: { y: 1.05, halfWidth: 0.78, halfHeight: 0.95 },
  clothes: { y: 0.8, halfWidth: 0.78, halfHeight: 1.0 },
  shoes: { y: 0.45, halfWidth: 0.55, halfHeight: 0.55 },
};

export function ClosetScene({ look, focus, spin }: Props) {
  const night = useNight();
  const turntable = useRef<THREE.Group>(null);
  const target = useRef(new THREE.Vector3(0, SHOTS[focus].y, 0));

  useFrame(({ camera, size }, delta) => {
    const shot = SHOTS[focus];
    const tanHalf = Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2));
    const aspect = size.width / Math.max(size.height, 1);
    const distance = Math.max(shot.halfWidth / (tanHalf * aspect), shot.halfHeight / tanHalf);

    const ease = 1 - Math.exp(-delta * 6);
    target.current.y += (shot.y - target.current.y) * ease;
    camera.position.x = 0;
    camera.position.y += (shot.y + distance * 0.08 - camera.position.y) * ease;
    camera.position.z += (distance - camera.position.z) * ease;
    camera.lookAt(target.current);
    if (turntable.current) {
      turntable.current.rotation.y += (spin.current - turntable.current.rotation.y) * ease;
    }
  });

  return (
    <>
      <color attach="background" args={[night ? '#1c1917' : '#f6efe6']} />
      <hemisphereLight args={night ? ['#9aa6d6', '#3a3040', 1.0] : ['#ffffff', '#f0dcc8', 2.1]} />
      {/* 밤에는 위에서 따뜻한 조명이 캐릭터를 비춘다 */}
      {night && (
        <pointLight position={[0.6, 2.6, 2.2]} color="#ffd9a0" intensity={14} distance={8} />
      )}
      <directionalLight position={[2, 6, 6]} intensity={night ? 0.5 : 1.6} />

      {/* 받침대 */}
      <mesh position={[0, -0.07, 0]}>
        <cylinderGeometry args={[0.8, 0.86, 0.14, 40]} />
        <meshStandardMaterial color={night ? '#8a7a6c' : '#ffffff'} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[1.02, 1.08, 0.12, 40]} />
        <meshStandardMaterial color={night ? '#5e5047' : '#efe2d2'} roughness={0.9} />
      </mesh>

      <group ref={turntable}>
        <Avatar look={look} />
      </group>
    </>
  );
}
