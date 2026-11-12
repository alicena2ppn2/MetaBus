import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import type { AvatarLook } from '../data/look';
import { Outfit } from './Outfit';

type Props = {
  look: AvatarLook;
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
  /** 오프라인: 앉아서 졸고, 색이 살짝 빠짐 */
  asleep?: boolean;
  /** 의자에 앉아 책상에 팔을 올린 자세 */
  seated?: boolean;
  selected?: boolean;
  /** 아바타마다 숨쉬기 타이밍을 어긋나게 하는 값 */
  phase?: number;
  onPress?: () => void;
};

const GRAY = new THREE.Color('#a4a8ae');
const EYE = '#4a2c22';
const PANDA_WHITE = '#f7f7f5';

const HEAD_R = 0.36;
const HOOD_R = 0.405;
// 후드를 머리보다 살짝 뒤에 두면 얼굴만 동그랗게 앞으로 나온다
const HOOD_BACK = 0.065;

function tone(hex: string, asleep: boolean) {
  const c = new THREE.Color(hex);
  return asleep ? c.lerp(GRAY, 0.3) : c;
}

type Tones = Record<
  'skin' | 'hair' | 'hood' | 'hoodTop' | 'ear' | 'top' | 'shirt' | 'bottom' | 'shoe',
  THREE.Color
>;

function Soft({ color }: { color: THREE.ColorRepresentation }) {
  return <meshStandardMaterial color={color} roughness={0.75} />;
}

function Ears({ look, c }: { look: AvatarLook; c: Tones }) {
  switch (look.head.kind) {
    case 'cat':
      return (
        <>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.23, 0.34, -HOOD_BACK]} rotation={[0, 0, -s * 0.45]}>
              <coneGeometry args={[0.11, 0.2, 12]} />
              <Soft color={c.ear} />
            </mesh>
          ))}
        </>
      );
    case 'bunny':
      return (
        <>
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              position={[s * 0.15, 0.52, -HOOD_BACK - 0.02]}
              rotation={[-0.15, 0, -s * 0.18]}
            >
              <capsuleGeometry args={[0.06, 0.26, 6, 12]} />
              <Soft color={c.ear} />
            </mesh>
          ))}
        </>
      );
    case 'frog':
      return (
        <>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.18, 0.36, -0.02]}>
              <mesh>
                <sphereGeometry args={[0.105, 14, 12]} />
                <Soft color={c.ear} />
              </mesh>
              <mesh position={[0, 0.01, 0.07]}>
                <sphereGeometry args={[0.06, 12, 10]} />
                <Soft color="#ffffff" />
              </mesh>
              <mesh position={[0, 0.01, 0.12]}>
                <sphereGeometry args={[0.028, 8, 8]} />
                <meshBasicMaterial color="#222222" />
              </mesh>
            </group>
          ))}
        </>
      );
    default:
      // panda, bear
      return (
        <>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.27, 0.31, -HOOD_BACK]}>
              <sphereGeometry args={[0.115, 14, 12]} />
              <Soft color={c.ear} />
            </mesh>
          ))}
          {look.head.kind === 'panda' &&
            look.head.type === 'hood' &&
            [-1, 1].map((s) => (
              <mesh
                key={`p${s}`}
                position={[s * 0.13, 0.355, 0.1]}
                rotation={[-0.75, 0, 0]}
                scale={[1, 1, 0.35]}
              >
                <sphereGeometry args={[0.05, 10, 8]} />
                <Soft color={c.ear} />
              </mesh>
            ))}
        </>
      );
  }
}

/** 앞머리 가닥: [x, y, z, 기울기, 너비] */
const BANGS: Record<AvatarLook['hair']['style'], [number, number, number, number, number][]> = {
  fluffy: [
    [-0.19, 0.08, 0.292, 0.55, 1],
    [-0.065, 0.06, 0.34, 0.15, 1],
    [0.07, 0.07, 0.34, -0.2, 1],
    [0.19, 0.08, 0.292, -0.55, 1],
  ],
  straight: [],
  parted: [
    [-0.17, 0.085, 0.3, 0.8, 1.25],
    [0.17, 0.085, 0.3, -0.8, 1.25],
  ],
};

function Head({ look, c, asleep }: { look: AvatarLook; c: Tones; asleep: boolean }) {
  // 얼굴이 후드 밖으로 나오는 경계 원 (두 구가 만나는 곳)
  const rimZ = (HOOD_R ** 2 - HEAD_R ** 2 - HOOD_BACK ** 2) / (2 * HOOD_BACK);
  const rimR = Math.sqrt(HEAD_R ** 2 - rimZ ** 2);

  const isHood = look.head.type === 'hood';
  return (
    <>
      <mesh>
        <sphereGeometry args={[HEAD_R, 36, 26]} />
        <Soft color={c.skin} />
      </mesh>

      {/* 후드. 후드를 안 쓰면 같은 모양이 머리카락이 된다 */}
      <mesh position={[0, 0, -HOOD_BACK]}>
        <sphereGeometry args={[HOOD_R, 36, 26]} />
        <Soft color={c.hood} />
      </mesh>
      {isHood && look.head.kind === 'panda' && (
        <mesh position={[0, 0, -HOOD_BACK]}>
          <sphereGeometry args={[HOOD_R + 0.006, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.47]} />
          <Soft color={c.hoodTop} />
        </mesh>
      )}
      {/* 테두리: 후드(또는 머리카락)와 얼굴이 만나는 경계를 덮는다. 앞머리보다 바깥에 있어야 한다 */}
      <mesh position={[0, 0, rimZ + 0.005]}>
        <torusGeometry args={[rimR + 0.022, 0.036, 10, 20, Math.PI]} />
        <Soft color={c.hoodTop} />
      </mesh>
      <mesh position={[0, 0, rimZ + 0.005]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[rimR + 0.022, 0.036, 10, 20, Math.PI]} />
        <Soft color={c.hood} />
      </mesh>
      {look.head.type === 'band' && (
        <mesh position={[0, 0, -HOOD_BACK]}>
          <torusGeometry args={[HOOD_R + 0.004, 0.03, 8, 24, Math.PI]} />
          <Soft color={c.ear} />
        </mesh>
      )}
      {look.head.type !== 'none' && <Ears look={look} c={c} />}

      {/* 앞머리: 후드 구멍 안쪽 이마만 덮는 덩어리 + 아래로 떨어지는 가닥 */}
      <mesh rotation={[look.hair.style === 'straight' ? 1.2 : 1.08, 0, 0]}>
        <sphereGeometry args={[HEAD_R + 0.004, 20, 8, 0, Math.PI * 2, 0, Math.PI * 0.148]} />
        <Soft color={c.hair} />
      </mesh>
      {BANGS[look.hair.style].map(([x, y, z, tilt, w], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0.25, 0, tilt]} scale={[0.9 * w, 1.2, 0.35]}>
          <sphereGeometry args={[0.1, 12, 10]} />
          <Soft color={c.hair} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * 0.29, -0.05, 0.17]}
          rotation={[0, 0, s * 0.15]}
          scale={[0.5, 1.5, 0.6]}
        >
          <sphereGeometry args={[0.08, 10, 8]} />
          <Soft color={c.hair} />
        </mesh>
      ))}

      {/* 눈 */}
      {[-1, 1].map((s) =>
        asleep ? (
          <mesh key={s} position={[s * 0.14, -0.08, 0.328]} rotation={[0, s * 0.4, Math.PI]}>
            <torusGeometry args={[0.04, 0.009, 6, 10, Math.PI]} />
            <meshBasicMaterial color={EYE} />
          </mesh>
        ) : (
          <group key={s} position={[s * 0.14, -0.07, 0.322]} rotation={[0, s * 0.4, 0]}>
            <mesh scale={[0.8, 1.15, 0.35]}>
              <sphereGeometry args={[0.055, 12, 10]} />
              <meshStandardMaterial color={EYE} roughness={0.3} />
            </mesh>
            <mesh position={[-0.015, 0.025, 0.018]}>
              <sphereGeometry args={[0.014, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ),
      )}

      {/* 볼터치 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.215, -0.15, 0.275]} rotation={[0.3, s * 0.65, 0]}>
          <circleGeometry args={[0.05, 12]} />
          <meshBasicMaterial color="#ff9f9f" transparent opacity={0.45} depthWrite={false} />
        </mesh>
      ))}

      {/* 입 */}
      <mesh position={[0, -0.15, 0.33]} rotation={[0.3, 0, Math.PI]}>
        <torusGeometry args={[0.03, 0.007, 6, 10, Math.PI]} />
        <meshBasicMaterial color={EYE} />
      </mesh>
    </>
  );
}

export function Avatar({
  look,
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1.15,
  asleep = false,
  seated = false,
  selected = false,
  phase = 0,
  onPress,
}: Props) {
  const body = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);

  const isHood = look.head.type === 'hood';
  const c = useMemo<Tones>(
    () => ({
      skin: tone(look.skin, asleep),
      hair: tone(look.hair.color, asleep),
      hood: tone(isHood ? look.head.color : look.hair.color, asleep),
      hoodTop: tone(
        !isHood ? look.hair.color : look.head.kind === 'panda' ? PANDA_WHITE : look.head.color,
        asleep,
      ),
      ear: tone(look.head.color, asleep),
      top: tone(look.top.color, asleep),
      shirt: tone(look.top.shirt, asleep),
      bottom: tone(look.bottom.color, asleep),
      shoe: tone(look.shoes.color, asleep),
    }),
    [look, asleep, isHood],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    if (body.current) {
      const hop = selected ? Math.abs(Math.sin(t * 6)) * 0.14 : 0;
      const breathe = Math.sin(t * (asleep ? 1 : 2)) * 0.02;
      body.current.position.y = (asleep ? -0.24 : 0) + breathe + hop;
      body.current.rotation.z = asleep || seated ? 0 : Math.sin(t * 1.3) * 0.03;
    }
    if (ring.current) ring.current.rotation.z = t * 1.5;
  });

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onPress?.();
      }}
    >
      {/* 그림자 대신 쓰는 바닥 원 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.34, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.16} depthWrite={false} />
      </mesh>

      {selected && (
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.46, 0.55, 28]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} depthWrite={false} />
        </mesh>
      )}

      {/* 손가락으로 누르기 쉽게 넓힌 투명 터치 영역 */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1.6, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={body}>
        <Outfit look={look} c={c} asleep={asleep} seated={seated} />

        <group position={[0, 1.04, 0.01]} rotation={[asleep ? 0.3 : 0, 0, 0]} scale={[1, 0.94, 1]}>
          <Head look={look} c={c} asleep={asleep} />
        </group>
      </group>
    </group>
  );
}
