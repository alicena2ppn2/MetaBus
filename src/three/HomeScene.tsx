import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import type { Friend } from '../data/friends';
import { Avatar } from './Avatar';

export type LabelPoint = { id: string; x: number; y: number };

type Props = {
  me: Friend;
  friends: Friend[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** 아바타 머리 위 화면 좌표. 말풍선은 3D가 아니라 일반 UI로 그린다 */
  onLabels: (points: LabelPoint[]) => void;
};

const ISLAND_RADIUS = 3.1;
const SEAT_RADIUS = 1.95;
const LABEL_HEIGHT = 1.62;
const LOOK_AT_Y = 0.5;
const CAMERA_TILT = THREE.MathUtils.degToRad(32);
// 화면 비율이 달라도 이만큼은 항상 화면 안에 들어오게 카메라 거리를 맞춘다
const FIT_HALF_WIDTH = 2.9;
const FIT_HALF_HEIGHT = 3.3;

type Seat = { friend: Friend; position: [number, number, number]; rotationY: number };

/** 친구들은 모닥불 뒤쪽 반원에, 나는 앞쪽에 둘러앉힌다 */
function layoutSeats(me: Friend, friends: Friend[]): Seat[] {
  const facing = (x: number, z: number) => Math.atan2(-x, 7 - z);
  const seats: Seat[] = friends.map((friend, i) => {
    const t = friends.length === 1 ? 0.5 : i / (friends.length - 1);
    const angle = THREE.MathUtils.degToRad(-20 + t * 220);
    const x = Math.cos(angle) * SEAT_RADIUS;
    const z = -Math.sin(angle) * SEAT_RADIUS;
    return { friend, position: [x, 0, z], rotationY: facing(x, z) };
  });
  // 정면 가운데에 서면 모닥불을 가려서 살짝 왼쪽 앞에 둔다
  const mine: [number, number] = [-0.95, 1.75];
  seats.push({ friend: me, position: [mine[0], 0, mine[1]], rotationY: facing(...mine) });
  return seats;
}

function CameraRig({ seats, onLabels }: { seats: Seat[]; onLabels: Props['onLabels'] }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useLayoutEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    const aspect = size.width / size.height;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distance = Math.max(FIT_HALF_WIDTH / (tanHalf * aspect), FIT_HALF_HEIGHT / tanHalf);
    camera.position.set(
      0,
      LOOK_AT_Y + distance * Math.sin(CAMERA_TILT),
      distance * Math.cos(CAMERA_TILT),
    );
    camera.lookAt(0, LOOK_AT_Y, 0);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    const v = new THREE.Vector3();
    onLabels(
      seats.map(({ friend, position }) => {
        v.set(position[0], LABEL_HEIGHT, position[2]).project(camera);
        return {
          id: friend.id,
          x: ((v.x + 1) / 2) * size.width,
          y: ((1 - v.y) / 2) * size.height,
        };
      }),
    );
  }, [camera, size, seats, onLabels]);

  return null;
}

function Campfire() {
  const light = useRef<THREE.PointLight>(null);
  const flame = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const flicker = 0.85 + Math.sin(t * 11) * 0.08 + Math.sin(t * 23) * 0.05;
    if (light.current) light.current.intensity = 6 * flicker;
    if (flame.current) {
      flame.current.scale.set(flicker, 0.9 + flicker * 0.25, flicker);
      flame.current.rotation.y = t * 2;
    }
  });

  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.07, 0]} rotation={[Math.PI / 2, 0, (i * Math.PI) / 3]}>
          <cylinderGeometry args={[0.06, 0.06, 0.62, 5]} />
          <meshStandardMaterial color="#6e4a2c" flatShading />
        </mesh>
      ))}
      <mesh ref={flame} position={[0, 0.32, 0]}>
        <coneGeometry args={[0.17, 0.46, 5]} />
        <meshBasicMaterial color="#ff9a3c" />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <coneGeometry args={[0.1, 0.26, 5]} />
        <meshBasicMaterial color="#ffe08a" />
      </mesh>
      <pointLight ref={light} position={[0, 0.7, 0]} color="#ffb060" distance={5} decay={2} />
    </group>
  );
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.09, 0.12, 0.6, 5]} />
        <meshStandardMaterial color="#7a5234" flatShading />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <coneGeometry args={[0.55, 0.9, 6]} />
        <meshStandardMaterial color="#4fa66a" flatShading />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <coneGeometry args={[0.4, 0.7, 6]} />
        <meshStandardMaterial color="#62ba7a" flatShading />
      </mesh>
    </group>
  );
}

function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={[scale, scale * 0.7, scale]} rotation={[0, scale * 5, 0]}>
      <icosahedronGeometry args={[0.24, 0]} />
      <meshStandardMaterial color="#a9adb5" flatShading />
    </mesh>
  );
}

function Cloud({ position, speed }: { position: [number, number, number]; speed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.x = position[0] + Math.sin(clock.elapsedTime * speed) * 1.2;
    }
  });
  return (
    <group ref={ref} position={position}>
      {(
        [
          [0, 0, 0, 0.5],
          [0.5, -0.05, 0.1, 0.36],
          [-0.5, -0.06, -0.05, 0.4],
        ] as const
      ).map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color="#ffffff" flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Island() {
  return (
    <group>
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[ISLAND_RADIUS, ISLAND_RADIUS * 0.94, 0.3, 14]} />
        <meshStandardMaterial color="#8fd17a" flatShading />
      </mesh>
      <mesh position={[0, -1.3, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[ISLAND_RADIUS * 0.94, 2, 14]} />
        <meshStandardMaterial color="#b08a5e" flatShading />
      </mesh>
      {/* 모닥불 주변 흙바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <circleGeometry args={[0.85, 10]} />
        <meshStandardMaterial color="#d9c08f" flatShading />
      </mesh>
    </group>
  );
}

export function HomeScene({ me, friends, selectedId, onSelect, onLabels }: Props) {
  const seats = useMemo(() => layoutSeats(me, friends), [me, friends]);

  return (
    <>
      <color attach="background" args={['#bfe6f7']} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[4, 8, 5]} intensity={2.2} />
      <CameraRig seats={seats} onLabels={onLabels} />

      <Island />
      <Campfire />
      <Tree position={[-2.3, 0, -1.6]} scale={1.1} />
      <Tree position={[2.2, 0, -1.9]} scale={0.9} />
      <Tree position={[0.2, 0, -2.75]} scale={0.75} />
      <Rock position={[2.6, 0.08, 0.9]} scale={1} />
      <Rock position={[-2.6, 0.06, 1.1]} scale={0.7} />
      <Cloud position={[-3.2, 3.2, -4]} speed={0.12} />
      <Cloud position={[3, 4, -5]} speed={0.08} />

      {seats.map(({ friend, position, rotationY }, i) => (
        <Avatar
          key={friend.id}
          look={friend.look}
          position={position}
          rotationY={rotationY}
          asleep={friend.presence.kind === 'offline'}
          selected={friend.id === selectedId}
          phase={i * 1.7}
          onPress={() => onSelect(friend.id)}
        />
      ))}
    </>
  );
}
