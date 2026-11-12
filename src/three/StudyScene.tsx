import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import type { AvatarLook } from '../data/look';
import { useNight } from '../state/theme';
import { Avatar } from './Avatar';

export type SeatLabel = { seat: number; x: number; y: number };
export type Occupant = { id: string; look: AvatarLook };

type Props = {
  /** 자리 번호 → 앉아 있는 사람 (빈 자리는 null) */
  occupants: (Occupant | null)[];
  mySeat: number | null;
  /** 공부 중에는 카메라가 내 자리로 다가간다 */
  studying: boolean;
  onSeatPress: (seat: number) => void;
  /** 자리마다 머리 위 화면 좌표 (전체 보기 기준) */
  onLabels: (labels: SeatLabel[]) => void;
};

/** 뒷줄 3자리, 앞줄 3자리. 모두 카메라 쪽을 보고 앉는다 */
export const SEATS: [number, number][] = [
  [-1.5, -1.25],
  [0, -1.25],
  [1.5, -1.25],
  [-1.5, 0.75],
  [0, 0.75],
  [1.5, 0.75],
];

const LABEL_HEIGHT = 1.62;
const LOOK_AT = new THREE.Vector3(0, 0.6, 0);
const TILT = THREE.MathUtils.degToRad(44);
const FIT_HALF_WIDTH = 2.45;
const FIT_HALF_HEIGHT = 2.6;
const WOOD = { day: '#d9b48a', night: '#a67d57' };
const WOOD_DARK = { day: '#c79f74', night: '#8a6648' };

function overviewPosition(camera: THREE.PerspectiveCamera, aspect: number, out: THREE.Vector3) {
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const distance = Math.max(FIT_HALF_WIDTH / (tanHalf * aspect), FIT_HALF_HEIGHT / tanHalf);
  return out.set(0, LOOK_AT.y + distance * Math.sin(TILT), distance * Math.cos(TILT));
}

function CameraRig({
  mySeat,
  studying,
  onLabels,
}: Pick<Props, 'mySeat' | 'studying' | 'onLabels'>) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const goal = useRef(new THREE.Vector3());
  const lookGoal = useRef(new THREE.Vector3());
  const look = useRef(LOOK_AT.clone());
  const placed = useRef(false);

  // 이름표 위치는 카메라가 움직이는 중에도 흔들리지 않게 전체 보기 카메라로 계산한다
  useLayoutEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    const probe = camera.clone();
    probe.aspect = size.width / size.height;
    overviewPosition(probe, probe.aspect, probe.position);
    probe.lookAt(LOOK_AT);
    probe.updateProjectionMatrix();
    probe.updateMatrixWorld();
    const v = new THREE.Vector3();
    onLabels(
      SEATS.map(([x, z], seat) => {
        v.set(x, LABEL_HEIGHT, z).project(probe);
        return { seat, x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height };
      }),
    );
  }, [camera, size, onLabels]);

  useFrame((_, delta) => {
    const aspect = size.width / Math.max(size.height, 1);
    if (studying && mySeat !== null) {
      const [x, z] = SEATS[mySeat];
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const distance = Math.max(0.85 / (tanHalf * aspect), 1.2 / tanHalf);
      lookGoal.current.set(x, 0.8, z + 0.2);
      goal.current.set(x, 0.8 + distance * 0.42, z + 0.2 + distance * 0.9);
    } else {
      lookGoal.current.copy(LOOK_AT);
      overviewPosition(camera, aspect, goal.current);
    }
    const ease = placed.current ? 1 - Math.exp(-delta * 3.5) : 1;
    placed.current = true;
    camera.position.lerp(goal.current, ease);
    look.current.lerp(lookGoal.current, ease);
    camera.lookAt(look.current);
  });

  return null;
}

function Desk({ lampOn, night }: { lampOn: boolean; night: boolean }) {
  const time = night ? 'night' : 'day';
  return (
    <group>
      {/* 상판과 옆 칸막이 */}
      <mesh position={[0, 0.54, 0.5]}>
        <boxGeometry args={[1.16, 0.06, 0.56]} />
        <meshStandardMaterial color={WOOD[time]} roughness={0.8} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.6, 0.42, 0.5]}>
          <boxGeometry args={[0.05, 0.84, 0.6]} />
          <meshStandardMaterial color={WOOD_DARK[time]} roughness={0.8} />
        </mesh>
      ))}

      {/* 펼친 책 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.115, 0.585, 0.52]} rotation={[0, 0, s * 0.12]}>
          <boxGeometry args={[0.22, 0.02, 0.3]} />
          <meshStandardMaterial color="#fffdf6" roughness={0.9} />
        </mesh>
      ))}

      {/* 스탠드 */}
      <group position={[0.42, 0.57, 0.62]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.04, 14]} />
          <meshStandardMaterial color="#5c6b8a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.24, 8]} />
          <meshStandardMaterial color="#5c6b8a" roughness={0.6} />
        </mesh>
        <mesh position={[-0.05, 0.27, -0.03]} rotation={[0.3, 0, 0.5]}>
          <coneGeometry args={[0.09, 0.11, 14, 1, true]} />
          <meshStandardMaterial color="#5c6b8a" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.06, 0.25, -0.035]}>
          <sphereGeometry args={[0.04, 10, 8]} />
          <meshBasicMaterial color={lampOn ? '#ffe9a3' : night ? '#55504a' : '#c9c9c9'} />
        </mesh>
        {/* 밤에는 앉은 자리의 스탠드가 책상을 비춘다 */}
        {night && lampOn && (
          <pointLight position={[-0.42, 0.58, 0.13]} color="#ffd58a" intensity={0.5} distance={3} />
        )}
        <mesh visible={false}></mesh>
      </group>

      {/* 의자 */}
      <mesh position={[0, 0.12, -0.06]}>
        <cylinderGeometry args={[0.2, 0.17, 0.24, 16]} />
        <meshStandardMaterial color="#8fb7d9" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Room({ night }: { night: boolean }) {
  const time = night ? 'night' : 'day';
  return (
    <group>
      <mesh position={[0, -0.1, -0.1]}>
        <boxGeometry args={[5.2, 0.2, 5]} />
        <meshStandardMaterial color={night ? '#8c6c4e' : '#efd9b8'} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.15, -2.55]}>
        <boxGeometry args={[5.2, 2.5, 0.1]} />
        <meshStandardMaterial color={night ? '#7d7266' : '#fbf3e4'} roughness={0.9} />
      </mesh>
      {/* 창문 */}
      <mesh position={[-1.3, 1.45, -2.49]}>
        <boxGeometry args={[1.5, 1, 0.04]} />
        {night ? (
          <meshBasicMaterial color="#2a3f6e" />
        ) : (
          <meshStandardMaterial color="#bfe6f7" roughness={0.4} />
        )}
      </mesh>
      <mesh position={[-1.3, 1.45, -2.47]}>
        <boxGeometry args={[0.05, 1, 0.04]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* 책장 */}
      <mesh position={[1.4, 1.0, -2.4]}>
        <boxGeometry args={[1.5, 1.6, 0.26]} />
        <meshStandardMaterial color={WOOD[time]} roughness={0.8} />
      </mesh>
      {[0.55, 1.05, 1.55].map((y, row) =>
        ['#f3a7b8', '#a9c8f5', '#ffd98a', '#a8e0d6', '#d8c4f5', '#ff9d7a'].map((color, i) => (
          <mesh key={`${row}-${i}`} position={[0.85 + i * 0.22, y, -2.25]}>
            <boxGeometry args={[0.15, 0.32 - ((i + row) % 3) * 0.04, 0.06]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        )),
      )}
    </group>
  );
}

export function StudyScene({ occupants, mySeat, studying, onSeatPress, onLabels }: Props) {
  const night = useNight();
  const seats = useMemo(() => SEATS.map(([x, z], seat) => ({ seat, x, z })), []);

  return (
    <>
      <color attach="background" args={[night ? '#3d332b' : '#f3e7d3']} />
      <hemisphereLight args={night ? ['#c9cde6', '#66544a', 1.65] : ['#ffffff', '#e8d2b0', 2.0]} />
      <directionalLight position={[3, 8, 6]} intensity={night ? 0.85 : 1.5} />
      <CameraRig mySeat={mySeat} studying={studying} onLabels={onLabels} />
      <Room night={night} />

      {seats.map(({ seat, x, z }) => {
        const occupant = occupants[seat];
        return (
          <group
            key={seat}
            position={[x, 0, z]}
            onClick={(e) => {
              e.stopPropagation();
              onSeatPress(seat);
            }}
          >
            <Desk lampOn={occupant !== null} night={night} />
            {occupant && <Avatar look={occupant.look} scale={1} seated phase={seat * 1.3} />}
          </group>
        );
      })}
    </>
  );
}
