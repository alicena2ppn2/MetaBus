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

const GRAY = new THREE.Color('#a4a8ae');
const EYE = '#4a2c22';
const SHOE = '#7a5038';

const HEAD_R = 0.36;
const HOOD_R = 0.405;
// 후드를 머리보다 살짝 뒤에 두면 얼굴만 동그랗게 앞으로 나온다
const HOOD_BACK = 0.065;

function tone(hex: string, asleep: boolean) {
  const c = new THREE.Color(hex);
  return asleep ? c.lerp(GRAY, 0.3) : c;
}

type Tones = Record<
  'skin' | 'hair' | 'hood' | 'hoodTop' | 'ear' | 'top' | 'shirt' | 'bottom',
  THREE.Color
>;

function Soft({ color }: { color: THREE.ColorRepresentation }) {
  return <meshStandardMaterial color={color} roughness={0.75} />;
}

function Ears({ look, c }: { look: AvatarLook; c: Tones }) {
  switch (look.hood.kind) {
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
          {look.hood.kind === 'panda' &&
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

function Head({ look, c, asleep }: { look: AvatarLook; c: Tones; asleep: boolean }) {
  // 얼굴이 후드 밖으로 나오는 경계 원 (두 구가 만나는 곳)
  const rimZ = (HOOD_R ** 2 - HEAD_R ** 2 - HOOD_BACK ** 2) / (2 * HOOD_BACK);
  const rimR = Math.sqrt(HEAD_R ** 2 - rimZ ** 2);

  return (
    <>
      <mesh>
        <sphereGeometry args={[HEAD_R, 24, 18]} />
        <Soft color={c.skin} />
      </mesh>

      {/* 후드 */}
      <mesh position={[0, 0, -HOOD_BACK]}>
        <sphereGeometry args={[HOOD_R, 24, 18]} />
        <Soft color={c.hood} />
      </mesh>
      {look.hood.topColor && (
        <mesh position={[0, 0, -HOOD_BACK]}>
          <sphereGeometry args={[HOOD_R + 0.006, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.47]} />
          <Soft color={c.hoodTop} />
        </mesh>
      )}
      {/* 후드 테두리: 앞머리보다 바깥에 있어야 머리카락이 후드를 뚫고 나오지 않는다 */}
      <mesh position={[0, 0, rimZ + 0.005]}>
        <torusGeometry args={[rimR + 0.022, 0.036, 10, 20, Math.PI]} />
        <Soft color={c.hoodTop} />
      </mesh>
      <mesh position={[0, 0, rimZ + 0.005]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[rimR + 0.022, 0.036, 10, 20, Math.PI]} />
        <Soft color={c.hood} />
      </mesh>
      <Ears look={look} c={c} />

      {/* 앞머리: 후드 구멍 안쪽 이마만 덮는 덩어리 + 아래로 떨어지는 가닥 */}
      <mesh rotation={[1.08, 0, 0]}>
        <sphereGeometry args={[HEAD_R + 0.004, 20, 8, 0, Math.PI * 2, 0, Math.PI * 0.145]} />
        <Soft color={c.hair} />
      </mesh>
      {(
        [
          [-0.19, 0.08, 0.292, 0.55],
          [-0.065, 0.06, 0.34, 0.15],
          [0.07, 0.07, 0.34, -0.2],
          [0.19, 0.08, 0.292, -0.55],
        ] as const
      ).map(([x, y, z, tilt], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0.25, 0, tilt]} scale={[0.9, 1.2, 0.35]}>
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
  position,
  rotationY,
  asleep = false,
  selected = false,
  phase = 0,
  onPress,
}: Props) {
  const body = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);

  const c = useMemo<Tones>(
    () => ({
      skin: tone(look.skin, asleep),
      hair: tone(look.hair, asleep),
      hood: tone(look.hood.color, asleep),
      hoodTop: tone(look.hood.topColor ?? look.hood.color, asleep),
      ear: tone(look.hood.earColor ?? look.hood.color, asleep),
      top: tone(look.top, asleep),
      shirt: tone(look.shirt, asleep),
      bottom: tone(look.bottom, asleep),
    }),
    [look, asleep],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    if (body.current) {
      const hop = selected ? Math.abs(Math.sin(t * 6)) * 0.14 : 0;
      const breathe = Math.sin(t * (asleep ? 1 : 2)) * 0.02;
      body.current.position.y = (asleep ? -0.24 : 0) + breathe + hop;
      body.current.rotation.z = asleep ? 0 : Math.sin(t * 1.3) * 0.03;
    }
    if (ring.current) ring.current.rotation.z = t * 1.5;
  });

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      scale={1.15}
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
        {/* 다리: 잘 때는 앞으로 쭉 뻗고 앉는다 */}
        {[-1, 1].map((s) => (
          <group
            key={s}
            position={asleep ? [s * 0.095, 0.3, 0.33] : [s * 0.095, 0, 0]}
            rotation={[asleep ? -Math.PI / 2 : 0, 0, 0]}
          >
            <mesh position={[0, 0.06, 0.035]} scale={[1, 0.68, 1.5]}>
              <sphereGeometry args={[0.085, 12, 10]} />
              <Soft color={SHOE} />
            </mesh>
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.06, 0.062, 0.06, 12]} />
              <Soft color="#ffffff" />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.052, 0.052, 0.08, 12]} />
              <Soft color={c.skin} />
            </mesh>
          </group>
        ))}

        {/* 반바지 */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.09, 0.31, 0]}>
            <cylinderGeometry args={[0.1, 0.105, 0.17, 14]} />
            <Soft color={c.bottom} />
          </mesh>
        ))}
        <mesh position={[0, 0.39, 0]} scale={[1, 0.6, 0.85]}>
          <sphereGeometry args={[0.2, 16, 12]} />
          <Soft color={c.bottom} />
        </mesh>

        {/* 조끼 + 셔츠 깃 */}
        <mesh position={[0, 0.55, 0]} scale={[1, 1, 0.85]}>
          <cylinderGeometry args={[0.15, 0.215, 0.32, 18]} />
          <Soft color={c.top} />
        </mesh>
        <mesh position={[0, 0.71, 0]} scale={[1, 0.5, 0.85]}>
          <sphereGeometry args={[0.15, 16, 10]} />
          <Soft color={c.shirt} />
        </mesh>

        {/* 팔: 셔츠 소매 + 손 */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.17, 0.67, 0]} rotation={[0, 0, s * 0.6]}>
            <mesh position={[0, -0.13, 0]}>
              <capsuleGeometry args={[0.052, 0.16, 6, 12]} />
              <Soft color={c.shirt} />
            </mesh>
            <mesh position={[0, -0.27, 0]}>
              <sphereGeometry args={[0.05, 12, 10]} />
              <Soft color={c.skin} />
            </mesh>
          </group>
        ))}

        <group position={[0, 1.04, 0.01]} rotation={[asleep ? 0.3 : 0, 0, 0]} scale={[1, 0.94, 1]}>
          <Head look={look} c={c} asleep={asleep} />
        </group>
      </group>
    </group>
  );
}
