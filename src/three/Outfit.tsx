import * as THREE from 'three';

import type { AvatarLook, Pattern } from '../data/look';
import { patternTexture } from './patterns';

export type OutfitColors = Record<'skin' | 'top' | 'shirt' | 'bottom' | 'shoe', THREE.Color>;

type Props = {
  look: AvatarLook;
  c: OutfitColors;
  asleep: boolean;
  seated: boolean;
};

const RIBBON = '#e2574c';
const BUTTON = '#ffd98a';

function Soft({ color }: { color: THREE.ColorRepresentation }) {
  return <meshStandardMaterial color={color} roughness={0.75} />;
}

/** 옷감. 무늬가 있으면 색 대신 무늬 텍스처를 입힌다 */
function Cloth({
  color,
  pattern,
  repeat,
  flat = false,
}: {
  color: THREE.Color;
  pattern: Pattern;
  repeat: Record<Exclude<Pattern, 'solid'>, [number, number]>;
  flat?: boolean;
}) {
  if (pattern === 'solid') {
    return <meshStandardMaterial key="solid" color={color} roughness={0.75} flatShading={flat} />;
  }
  return (
    <meshStandardMaterial
      key={pattern}
      color="#ffffff"
      map={patternTexture(pattern, color, repeat[pattern])}
      roughness={0.75}
      flatShading={flat}
    />
  );
}

const TORSO_REPEAT = { stripe: [1, 2.5], check: [6, 1.5], dot: [5, 1.5] } as const;
const SKIRT_REPEAT = { stripe: [1, 2], check: [8, 1.5], dot: [7, 1.5] } as const;
const LEG_REPEAT = { stripe: [1, 1.5], check: [3, 1], dot: [3, 1] } as const;
type Repeat = Record<Exclude<Pattern, 'solid'>, [number, number]>;

function Legs({ look, c, asleep, seated }: Props) {
  const pants = look.bottom.style === 'pants' && look.top.style !== 'dress';
  return (
    <>
      {[-1, 1].map((s) => (
        <group
          key={s}
          // 잘 때는 다리를 앞으로 쭉 뻗고 앉는다
          position={asleep ? [s * 0.095, 0.3, 0.33] : [s * 0.095, 0, seated ? 0.18 : 0]}
          rotation={[asleep ? -Math.PI / 2 : 0, 0, 0]}
        >
          <mesh position={[0, 0.06, 0.035]} scale={[1, 0.68, 1.5]}>
            <sphereGeometry args={[0.085, 12, 10]} />
            <Soft color={c.shoe} />
          </mesh>
          {pants ? (
            <mesh position={[0, 0.18, 0]}>
              <cylinderGeometry args={[0.078, 0.074, 0.16, 12]} />
              <Soft color={c.bottom} />
            </mesh>
          ) : (
            <>
              {look.shoes.style === 'boots' ? (
                <mesh position={[0, 0.15, 0]}>
                  <cylinderGeometry args={[0.068, 0.07, 0.14, 12]} />
                  <Soft color={c.shoe} />
                </mesh>
              ) : (
                <mesh position={[0, 0.14, 0]}>
                  <cylinderGeometry args={[0.06, 0.062, 0.06, 12]} />
                  <Soft color="#ffffff" />
                </mesh>
              )}
              <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.052, 0.052, 0.08, 12]} />
                <Soft color={c.skin} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </>
  );
}

function Bottom({ look, c, seated }: Props) {
  const { style, pattern } = look.bottom;
  if (look.top.style === 'dress') return null;

  if (style === 'skirt' || style === 'pleated') {
    const pleated = style === 'pleated';
    return (
      <group position={[0, 0, seated ? 0.06 : 0]}>
        <mesh position={[0, pleated ? 0.36 : 0.34, 0]} scale={[1, 1, 0.9]}>
          {pleated ? (
            <cylinderGeometry args={[0.2, 0.33, 0.21, 14]} />
          ) : (
            <cylinderGeometry args={[0.19, 0.37, 0.26, 28]} />
          )}
          <Cloth
            color={c.bottom}
            pattern={pattern}
            repeat={SKIRT_REPEAT as unknown as Repeat}
            flat={pleated}
          />
        </mesh>
        <mesh position={[0, 0.455, 0]} scale={[1, 1, 0.87]}>
          <cylinderGeometry args={[0.205, 0.21, 0.035, 20]} />
          <Soft color={c.bottom} />
        </mesh>
      </group>
    );
  }

  // 반바지, 긴바지 (긴바지의 아랫단은 Legs에서 그린다)
  return (
    <>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={seated ? [s * 0.09, 0.33, 0.09] : [s * 0.09, 0.31, 0]}
          rotation={[seated ? Math.PI / 2 : 0, 0, 0]}
        >
          <cylinderGeometry args={[0.1, 0.105, 0.17, 14]} />
          <Cloth color={c.bottom} pattern={pattern} repeat={LEG_REPEAT as unknown as Repeat} />
        </mesh>
      ))}
      <mesh position={[0, 0.39, 0]} scale={[1, 0.6, 0.85]}>
        <sphereGeometry args={[0.2, 16, 12]} />
        <Soft color={c.bottom} />
      </mesh>
    </>
  );
}

function Top({ look, c, seated }: Props) {
  const { style, pattern } = look.top;
  const sailor = style === 'sailor';
  const torsoColor = sailor ? c.shirt : c.top;
  const collarColor =
    style === 'vest' || style === 'cardigan' || style === 'dress' ? c.shirt : c.top;
  const bulk = style === 'hoodie' ? 1.07 : 1;
  const shade = c.top.clone().multiplyScalar(0.86);

  return (
    <>
      <mesh position={[0, 0.55, 0]} scale={[bulk, 1, 0.85 * bulk]}>
        <cylinderGeometry args={[0.15, 0.215, 0.32, 24]} />
        <Cloth
          color={torsoColor}
          pattern={sailor ? 'solid' : pattern}
          repeat={TORSO_REPEAT as unknown as Repeat}
        />
      </mesh>

      {/* 목 둘레 */}
      {style === 'dress' ? (
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.06, 0.705, 0.085]} scale={[1.25, 0.35, 1]}>
            <sphereGeometry args={[0.06, 12, 8]} />
            <Soft color={c.shirt} />
          </mesh>
        ))
      ) : sailor ? (
        <>
          <mesh position={[0, 0.7, 0]} scale={[1.38, 0.42, 1.12]}>
            <sphereGeometry args={[0.15, 18, 10]} />
            <Soft color={c.top} />
          </mesh>
          <mesh position={[0, 0.62, -0.145]} rotation={[0.17, 0, 0]}>
            <boxGeometry args={[0.27, 0.15, 0.02]} />
            <Soft color={c.top} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 0.71, 0]} scale={[1, 0.5, 0.85]}>
          <sphereGeometry args={[0.15, 16, 10]} />
          <Soft color={collarColor} />
        </mesh>
      )}

      {style === 'hoodie' && (
        <>
          <mesh position={[0, 0.72, -0.11]} scale={[1.35, 0.75, 1]}>
            <sphereGeometry args={[0.13, 14, 10]} />
            <Soft color={c.top} />
          </mesh>
          <mesh position={[0, 0.46, 0.178]} rotation={[-0.17, 0, 0]}>
            <boxGeometry args={[0.2, 0.09, 0.02]} />
            <Soft color={shade} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.04, 0.63, 0.158]}>
              <mesh>
                <cylinderGeometry args={[0.007, 0.007, 0.1, 6]} />
                <Soft color="#ffffff" />
              </mesh>
              <mesh position={[0, -0.055, 0]}>
                <sphereGeometry args={[0.013, 8, 6]} />
                <Soft color="#ffffff" />
              </mesh>
            </group>
          ))}
        </>
      )}

      {sailor && (
        <group position={[0, 0.615, 0.158]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.04, 0, 0]} rotation={[0, 0, s * (Math.PI / 2)]}>
              <coneGeometry args={[0.035, 0.075, 10]} />
              <Soft color={RIBBON} />
            </mesh>
          ))}
          <mesh>
            <sphereGeometry args={[0.02, 8, 6]} />
            <Soft color={RIBBON} />
          </mesh>
        </group>
      )}

      {style === 'overall' && (
        <>
          <mesh position={[0, 0.42, 0]} scale={[1, 1, 0.85]}>
            <cylinderGeometry args={[0.212, 0.218, 0.06, 24]} />
            <Soft color={c.bottom} />
          </mesh>
          <mesh position={[0, 0.54, 0.158]} rotation={[-0.17, 0, 0]}>
            <boxGeometry args={[0.2, 0.19, 0.03]} />
            <Soft color={c.bottom} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 0.085, 0.685, 0.115]} rotation={[-0.5, 0, 0]}>
                <boxGeometry args={[0.035, 0.15, 0.02]} />
                <Soft color={c.bottom} />
              </mesh>
              <mesh position={[s * 0.075, 0.61, 0.165]}>
                <sphereGeometry args={[0.017, 8, 6]} />
                <Soft color={BUTTON} />
              </mesh>
            </group>
          ))}
        </>
      )}

      {style === 'cardigan' && (
        <>
          <mesh position={[0, 0.55, 0.152]} rotation={[-0.17, 0, 0]}>
            <boxGeometry args={[0.055, 0.31, 0.02]} />
            <Soft color={c.shirt} />
          </mesh>
          {[0.46, 0.55, 0.64].map((y) => (
            <mesh key={y} position={[0, y, 0.166 + (0.55 - y) * 0.17]}>
              <sphereGeometry args={[0.014, 8, 6]} />
              <Soft color={shade} />
            </mesh>
          ))}
        </>
      )}

      {style === 'dress' && (
        <group position={[0, 0, seated ? 0.06 : 0]}>
          <mesh position={[0, 0.34, 0]} scale={[1, 1, 0.9]}>
            <cylinderGeometry args={[0.2, 0.39, 0.3, 28]} />
            <Cloth color={c.top} pattern={pattern} repeat={SKIRT_REPEAT as unknown as Repeat} />
          </mesh>
          <mesh position={[0, 0.49, 0]} scale={[1, 1, 0.86]}>
            <cylinderGeometry args={[0.198, 0.206, 0.035, 20]} />
            <Soft color={c.shirt} />
          </mesh>
        </group>
      )}
    </>
  );
}

function Arms({ look, c, seated }: Props) {
  const { style } = look.top;
  const short = style === 'tee';
  const puff = style === 'dress';
  const sleeve = style === 'vest' || style === 'sailor' || style === 'overall' ? c.shirt : c.top;
  // 멜빵 안에는 상의 색 티를 입는다
  const longColor = style === 'overall' ? c.top : sleeve;

  return (
    <>
      {[-1, 1].map((s) => (
        <group
          key={s}
          position={[s * 0.17, 0.67, 0]}
          rotation={seated ? [-1.15, 0, s * 0.2] : [0, 0, s * 0.6]}
        >
          {short || puff ? (
            <>
              <mesh position={[0, -0.15, 0]}>
                <capsuleGeometry args={[0.045, 0.14, 6, 12]} />
                <Soft color={c.skin} />
              </mesh>
              {puff ? (
                <mesh position={[0, -0.04, 0]} scale={[1, 0.85, 1]}>
                  <sphereGeometry args={[0.08, 12, 10]} />
                  <Soft color={c.top} />
                </mesh>
              ) : (
                <mesh position={[0, -0.06, 0]}>
                  <capsuleGeometry args={[0.058, 0.06, 6, 12]} />
                  <Soft color={c.top} />
                </mesh>
              )}
            </>
          ) : (
            <mesh position={[0, -0.13, 0]}>
              <capsuleGeometry args={[0.052, 0.16, 6, 12]} />
              <Soft color={longColor} />
            </mesh>
          )}
          {style === 'sailor' && (
            <mesh position={[0, -0.21, 0]}>
              <cylinderGeometry args={[0.057, 0.057, 0.04, 12]} />
              <Soft color={c.top} />
            </mesh>
          )}
          <mesh position={[0, -0.27, 0]}>
            <sphereGeometry args={[0.05, 12, 10]} />
            <Soft color={c.skin} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** 목 아래 전부: 다리, 하의, 상의, 팔 */
export function Outfit(props: Props) {
  return (
    <>
      <Legs {...props} />
      <Bottom {...props} />
      <Top {...props} />
      <Arms {...props} />
    </>
  );
}
