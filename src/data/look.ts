export type AnimalKind = 'panda' | 'bear' | 'cat' | 'bunny' | 'frog';
export type HairStyle = 'fluffy' | 'straight' | 'parted';
export type HeadwearType = 'hood' | 'band' | 'none';
export type TopStyle = 'vest' | 'tee' | 'hoodie' | 'sailor' | 'overall' | 'cardigan' | 'dress';
export type BottomStyle = 'shorts' | 'pants' | 'skirt' | 'pleated';
export type Pattern = 'solid' | 'stripe' | 'check' | 'dot';
export type ShoeStyle = 'shoes' | 'boots';

/** 기본 몸 하나에 머리, 모자, 옷, 신발만 바꾸는 아바타 외형 */
export type AvatarLook = {
  skin: string;
  hair: { style: HairStyle; color: string };
  /** 후드(머리 전체를 덮음), 머리띠(귀만 달림), 없음 */
  head: { type: HeadwearType; kind: AnimalKind; color: string };
  /** 조끼는 안에 셔츠를 받쳐 입는다 */
  top: { style: TopStyle; color: string; shirt: string; pattern: Pattern };
  /** 원피스를 입으면 하의는 가려진다 */
  bottom: { style: BottomStyle; color: string; pattern: Pattern };
  shoes: { style: ShoeStyle; color: string };
};

export const defaultLook: AvatarLook = {
  skin: '#fbe0cc',
  hair: { style: 'fluffy', color: '#9fb6cc' },
  head: { type: 'hood', kind: 'panda', color: '#2b2a2e' },
  top: { style: 'vest', color: '#f8ebc8', shirt: '#e4ecfa', pattern: 'solid' },
  bottom: { style: 'shorts', color: '#c9a276', pattern: 'solid' },
  shoes: { style: 'shoes', color: '#7a5038' },
};

// ---- 옷장에서 고를 수 있는 것들 ----

export const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: 'fluffy', label: '몽실 앞머리' },
  { id: 'straight', label: '일자 앞머리' },
  { id: 'parted', label: '가르마' },
];

export const HEADWEAR: {
  id: string;
  label: string;
  emoji: string;
  type: HeadwearType;
  kind: AnimalKind;
  color: string;
}[] = [
  {
    id: 'hood-panda',
    label: '판다 후드',
    emoji: '🐼',
    type: 'hood',
    kind: 'panda',
    color: '#2b2a2e',
  },
  { id: 'hood-bear', label: '곰 후드', emoji: '🐻', type: 'hood', kind: 'bear', color: '#a9805e' },
  {
    id: 'hood-cat',
    label: '고양이 후드',
    emoji: '🐱',
    type: 'hood',
    kind: 'cat',
    color: '#f2a65a',
  },
  {
    id: 'hood-bunny',
    label: '토끼 후드',
    emoji: '🐰',
    type: 'hood',
    kind: 'bunny',
    color: '#fbd3dc',
  },
  {
    id: 'hood-frog',
    label: '개구리 후드',
    emoji: '🐸',
    type: 'hood',
    kind: 'frog',
    color: '#8fce7e',
  },
  {
    id: 'band-cat',
    label: '고양이 머리띠',
    emoji: '🐱',
    type: 'band',
    kind: 'cat',
    color: '#3a3340',
  },
  {
    id: 'band-bunny',
    label: '토끼 머리띠',
    emoji: '🐰',
    type: 'band',
    kind: 'bunny',
    color: '#ffffff',
  },
  {
    id: 'band-bear',
    label: '곰 머리띠',
    emoji: '🐻',
    type: 'band',
    kind: 'bear',
    color: '#a9805e',
  },
  { id: 'none', label: '없음', emoji: '🚫', type: 'none', kind: 'bear', color: '#ffffff' },
];

export const TOP_STYLES: { id: TopStyle; label: string }[] = [
  { id: 'vest', label: '조끼 + 셔츠' },
  { id: 'tee', label: '반팔 티' },
  { id: 'hoodie', label: '후드티' },
  { id: 'sailor', label: '세일러' },
  { id: 'cardigan', label: '카디건' },
  { id: 'overall', label: '멜빵' },
  { id: 'dress', label: '원피스' },
];

export const BOTTOM_STYLES: { id: BottomStyle; label: string }[] = [
  { id: 'shorts', label: '반바지' },
  { id: 'pants', label: '긴바지' },
  { id: 'skirt', label: '플레어 치마' },
  { id: 'pleated', label: '주름 치마' },
];

export const PATTERNS: { id: Pattern; label: string }[] = [
  { id: 'solid', label: '단색' },
  { id: 'stripe', label: '줄무늬' },
  { id: 'check', label: '체크' },
  { id: 'dot', label: '도트' },
];

export const SHOE_STYLES: { id: ShoeStyle; label: string }[] = [
  { id: 'shoes', label: '단화' },
  { id: 'boots', label: '부츠' },
];

export const HAIR_COLORS = [
  '#9fb6cc',
  '#2a2530',
  '#6b4a35',
  '#b0764a',
  '#e6c27a',
  '#f3a7b8',
  '#b9a4e8',
  '#f4f1ea',
];
export const HEADWEAR_COLORS = [
  '#2b2a2e',
  '#a9805e',
  '#f2a65a',
  '#fbd3dc',
  '#8fce7e',
  '#a9c8f5',
  '#d8c4f5',
  '#f4f1ea',
];
export const TOP_COLORS = [
  '#f8ebc8',
  '#a9c8f5',
  '#a8e0d6',
  '#d8c4f5',
  '#fbd3dc',
  '#ffd98a',
  '#ff9d7a',
  '#ffffff',
];
export const BOTTOM_COLORS = [
  '#c9a276',
  '#5c6b8a',
  '#4f8f88',
  '#6d5a8c',
  '#e8a9b6',
  '#8a7a5c',
  '#3b3f4a',
  '#f4f1ea',
];
export const SHOE_COLORS = [
  '#7a5038',
  '#2b2a2e',
  '#ffffff',
  '#e2574c',
  '#f5b942',
  '#4f8ef7',
  '#f3a7b8',
  '#62ba7a',
];

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomLook(current: AvatarLook): AvatarLook {
  const headwear = pick(HEADWEAR);
  return {
    skin: current.skin,
    hair: { style: pick(HAIR_STYLES).id, color: pick(HAIR_COLORS) },
    head: { type: headwear.type, kind: headwear.kind, color: headwear.color },
    top: {
      style: pick(TOP_STYLES).id,
      color: pick(TOP_COLORS),
      shirt: '#ffffff',
      pattern: pick(PATTERNS).id,
    },
    bottom: {
      style: pick(BOTTOM_STYLES).id,
      color: pick(BOTTOM_COLORS),
      pattern: pick(PATTERNS).id,
    },
    shoes: { style: pick(SHOE_STYLES).id, color: pick(SHOE_COLORS) },
  };
}
