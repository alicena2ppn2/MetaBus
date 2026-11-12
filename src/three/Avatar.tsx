import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import type { AvatarLook } from '../data/friends';

type Props = {
  look: AvatarLook;
  position: [number, number, number];
  rotationY: number;
  /** 오프라인: 앉아서 졸고, 색이 살짝 빠짐 */
  asleep?: boolean;
  selected?: boolean;
  /** 아바타마다 숨쉬기 타이밍을 어긋나게 하는 값 */
  phase?: number;
  onPress?: () => void;
};

const GRAY = new THREE.Color('#9aa0a6');

function tone(hex: string, asleep: boolean) {
  const c = new THREE.Color(hex);
  return asleep ? c.lerp(GRAY, 0.3) : c;
}

function Hair({ look, color }: { look: AvatarLook; color: THREE.Color }) {
  const dome = (
    <mesh position={[0, 0.04, -0.02]}>
      <sphereGeometry args={[0.325, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
  switch (look.hair) {
    case 'spiky':
      return (
        <>
          {dome}
          <mesh position={[0, 0.38, 0]}>
            <coneGeometry args={[0.16, 0.26, 5]} />
            <meshStandardMaterial color={color} flatShading />
          </mesh>
        </>
      );
    case 'bun':
      return (
        <>
          {dome}
          <mesh position={[0, 0.4, -0.08]}>
            <icosahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color={color} flatShading />
          </mesh>
        </>
      );
    case 'cap':
      return (
        <>
          {dome}
          <mesh position={[0, 0.08, 0.3]}>
            <boxGeometry args={[0.36, 0.04, 0.24]} />
            <meshStandardMaterial color={color} flatShading />
          </mesh>
        </>
      );
    case 'long':
      return (
        <>
          {dome}
          <mesh position={[0, -0.14, -0.2]}>
            <boxGeometry args={[0.52, 0.5, 0.18]} />
            <meshStandardMaterial color={color} flatShading />
          </mesh>
        </>
      );
    default:
      return dome;
  }
}

export function Avatar({
  look,
  position,
  rotationY,
  asleep = false,
  selected = false,
  phase = 0,
  onPress,
}: Props) {
  const body = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);

  const colors = useMemo(
    () => ({
      skin: tone(look.skin, asleep),
      outfit: tone(look.outfit, asleep),
      hair: tone(look.hairColor, asleep),
    }),
    [look, asleep],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    if (body.current) {
      const hop = selected ? Math.abs(Math.sin(t * 6)) * 0.14 : 0;
      const breathe = Math.sin(t * (asleep ? 1 : 2)) * 0.025;
      body.current.position.y = (asleep ? -0.2 : 0) + breathe + hop;
      body.current.rotation.z = asleep ? 0 : Math.sin(t * 1.3) * 0.03;
    }
    if (ring.current) ring.current.rotation.z = t * 1.5;
  });

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onPress?.();
      }}
    >
      {/* 그림자 대신 쓰는 바닥 원 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.36, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.16} depthWrite={false} />
      </mesh>

      {selected && (
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.46, 0.56, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} depthWrite={false} />
        </mesh>
      )}

      {/* 손가락으로 누르기 쉽게 넓힌 투명 터치 영역 */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1.6, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={body}>
        {!asleep && (
          <>
            <mesh position={[-0.12, 0.14, 0]}>
              <boxGeometry args={[0.15, 0.28, 0.17]} />
              <meshStandardMaterial color="#3b3f4a" flatShading />
            </mesh>
            <mesh position={[0.12, 0.14, 0]}>
              <boxGeometry args={[0.15, 0.28, 0.17]} />
              <meshStandardMaterial color="#3b3f4a" flatShading />
            </mesh>
          </>
        )}

        {/* 몸통 */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.2, 0.3, 0.56, 8]} />
          <meshStandardMaterial color={colors.outfit} flatShading />
        </mesh>

        {/* 팔 */}
        <mesh position={[-0.31, 0.56, 0]} rotation={[0, 0, -0.28]}>
          <cylinderGeometry args={[0.06, 0.07, 0.42, 6]} />
          <meshStandardMaterial color={colors.outfit} flatShading />
        </mesh>
        <mesh position={[0.31, 0.56, 0]} rotation={[0, 0, 0.28]}>
          <cylinderGeometry args={[0.06, 0.07, 0.42, 6]} />
          <meshStandardMaterial color={colors.outfit} flatShading />
        </mesh>

        {/* 머리 */}
        <group position={[0, 1.12, 0]} rotation={[asleep ? 0.35 : 0, 0, 0]}>
          <mesh>
            <icosahedronGeometry args={[0.3, 1]} />
            <meshStandardMaterial color={colors.skin} flatShading />
          </mesh>
          {asleep ? (
            <>
              <mesh position={[-0.11, 0.0, 0.28]}>
                <boxGeometry args={[0.09, 0.02, 0.02]} />
                <meshBasicMaterial color="#2a2a2a" />
              </mesh>
              <mesh position={[0.11, 0.0, 0.28]}>
                <boxGeometry args={[0.09, 0.02, 0.02]} />
                <meshBasicMaterial color="#2a2a2a" />
              </mesh>
            </>
          ) : (
            <>
              <mesh position={[-0.11, 0.02, 0.27]}>
                <sphereGeometry args={[0.038, 6, 6]} />
                <meshBasicMaterial color="#2a2a2a" />
              </mesh>
              <mesh position={[0.11, 0.02, 0.27]}>
                <sphereGeometry args={[0.038, 6, 6]} />
                <meshBasicMaterial color="#2a2a2a" />
              </mesh>
            </>
          )}
          <Hair look={look} color={colors.hair} />
        </group>
      </group>
    </group>
  );
}
