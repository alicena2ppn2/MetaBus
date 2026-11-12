import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

import type { AvatarLook } from '../data/look';
import { useNight } from '../state/theme';
import { Avatar } from './Avatar';

export type BalloonLabel = { id: string; x: number; y: number };
export type Balloon = { id: string; color: string };

type Props = {
  /** 앞에서부터 자리를 채운다. 자리 수(BALLOON_SLOTS)보다 많으면 뒤쪽은 안 보인다 */
  balloons: Balloon[];
  selectedId: string | null;
  myLook: AvatarLook;
  onBalloonPress: (id: string) => void;
  /** 풍선에 매달린 쪽지의 화면 좌표 */
  onLabels: (labels: BalloonLabel[]) => void;
};

/** 풍선이 떠 있는 자리 [x, y, z]. 가운데 아래는 내 캐릭터 자리라 비워둔다 */
const SLOTS: [number, number, number][] = [
  [0, 3.85, -0.6],
  [-1.5, 3.05, -0.2],
  [1.5, 3.25, -0.2],
  [0, 6.15, -0.8],
  [-1.5, 5.35, -0.5],
  [1.5, 5.55, -0.5],
];
export const BALLOON_SLOTS = SLOTS.length;
export const BALLOON_COLORS = ['#f3a7b8', '#a9c8f5', '#ffd98a', '#a8e0d6', '#d8c4f5', '#ff9d7a'];

const NOTE_DROP = 0.98;
const LOOK_AT = new THREE.Vector3(0, 3.1, 0);
const FIT_HALF_WIDTH = 2.25;
const FIT_HALF_HEIGHT = 3.9;

function CameraRig({ balloons, onLabels }: Pick<Props, 'balloons' | 'onLabels'>) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useLayoutEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    const aspect = size.width / size.height;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distance = Math.max(FIT_HALF_WIDTH / (tanHalf * aspect), FIT_HALF_HEIGHT / tanHalf);
    camera.position.set(0, LOOK_AT.y + distance * 0.1, distance);
    camera.lookAt(LOOK_AT);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    const v = new THREE.Vector3();
    onLabels(
      balloons.slice(0, SLOTS.length).map((balloon, i) => {
        const [x, y, z] = SLOTS[i];
        v.set(x, y - NOTE_DROP, z).project(camera);
        return {
          id: balloon.id,
          x: ((v.x + 1) / 2) * size.width,
          y: ((1 - v.y) / 2) * size.height,
        };
      }),
    );
  }, [camera, size, balloons, onLabels]);

  return null;
}

function BalloonMesh({
  position,
  color,
  phase,
  selected,
  onPress,
}: {
  position: [number, number, number];
  color: string;
  phase: number;
  selected: boolean;
  onPress: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const grow = useRef(0);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    // 새로 생긴 풍선은 작게 시작해서 부풀어 오른다
    grow.current = Math.min(1, grow.current + delta * 2.5);
    const t = clock.elapsedTime + phase;
    const scale = (selected ? 1.12 : 1) * (0.2 + 0.8 * grow.current);
    group.current.scale.setScalar(scale);
    group.current.position.y = position[1] + Math.sin(t * 1.1) * 0.05;
    group.current.rotation.z = Math.sin(t * 0.8) * 0.05;
  });

  return (
    <group
      ref={group}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onPress();
      }}
    >
      <mesh scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.42, 24, 18]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.06, 0.08, 10]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.75, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.44, 6]} />
        <meshBasicMaterial color="#8a7868" />
      </mesh>
    </group>
  );
}

function Room({ night }: { night: boolean }) {
  return (
    <group>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[9, 0.2, 5]} />
        <meshStandardMaterial color={night ? '#70669a' : '#e9dff5'} roughness={0.9} />
      </mesh>
      <mesh position={[0, 6, -2.2]}>
        <boxGeometry args={[9, 12.4, 0.1]} />
        <meshStandardMaterial color={night ? '#5f5686' : '#f4eefb'} roughness={0.9} />
      </mesh>
      {/* 러그와 쿠션 */}
      <mesh position={[0, 0.01, 0.9]}>
        <cylinderGeometry args={[1.5, 1.5, 0.03, 36]} />
        <meshStandardMaterial color={night ? '#9a90b4' : '#ffffff'} roughness={0.95} />
      </mesh>
      {(
        [
          [-1.05, 0.95, '#f3a7b8'],
          [1.05, 0.95, '#a9c8f5'],
        ] as const
      ).map(([x, z, color]) => (
        <mesh key={x} position={[x, 0.12, z]} scale={[1, 0.45, 1]}>
          <sphereGeometry args={[0.34, 18, 12]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function WorryScene({ balloons, selectedId, myLook, onBalloonPress, onLabels }: Props) {
  const night = useNight();
  return (
    <>
      <color attach="background" args={[night ? '#3a3356' : '#f4eefb']} />
      <hemisphereLight args={night ? ['#c4c6ee', '#5a4f7a', 1.55] : ['#ffffff', '#dccff0', 2.1]} />
      {night && <pointLight position={[0, 2.4, 2.6]} color="#ffd9b0" intensity={8} distance={9} />}
      <directionalLight position={[2, 7, 6]} intensity={night ? 0.85 : 1.5} />
      <CameraRig balloons={balloons} onLabels={onLabels} />
      <Room night={night} />
      <Avatar look={myLook} position={[0, 0, 0.9]} scale={1.05} />

      {balloons.slice(0, SLOTS.length).map((balloon, i) => (
        <BalloonMesh
          key={balloon.id}
          position={SLOTS[i]}
          color={balloon.color}
          phase={i * 1.9}
          selected={balloon.id === selectedId}
          onPress={() => onBalloonPress(balloon.id)}
        />
      ))}
    </>
  );
}
