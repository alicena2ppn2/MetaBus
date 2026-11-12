export type HoodKind = 'panda' | 'bear' | 'cat' | 'bunny' | 'frog';

/** 기본 몸 하나에 후드, 머리색, 옷 색만 바꾸는 아바타 외형 */
export type AvatarLook = {
  skin: string;
  hair: string;
  hood: { kind: HoodKind; color: string; topColor?: string; earColor?: string };
  /** 조끼 */
  top: string;
  /** 셔츠 (소매, 깃) */
  shirt: string;
  /** 반바지 */
  bottom: string;
};

export type Presence =
  | { kind: 'online' }
  | { kind: 'inRoom'; roomName: string }
  | { kind: 'offline'; lastSeen: string };

export type Friend = {
  id: string;
  name: string;
  isMe?: boolean;
  emoji: string;
  message: string;
  presence: Presence;
  look: AvatarLook;
};

// 서버가 붙기 전까지 쓰는 임시 데이터
export const me: Friend = {
  id: 'me',
  name: '나',
  isMe: true,
  emoji: '👋',
  message: '오늘은 뭐 하고 놀까',
  presence: { kind: 'online' },
  look: {
    skin: '#fbe0cc',
    hair: '#9fb6cc',
    hood: { kind: 'panda', color: '#2b2a2e', topColor: '#f7f7f5' },
    top: '#f8ebc8',
    shirt: '#e4ecfa',
    bottom: '#c9a276',
  },
};

export const friends: Friend[] = [
  {
    id: 'f1',
    name: '하늘',
    emoji: '🎮',
    message: '밸런스 게임 하는 중!',
    presence: { kind: 'inRoom', roomName: '밸런스 게임' },
    look: {
      skin: '#f9d9c2',
      hair: '#3a3340',
      hood: { kind: 'cat', color: '#f2a65a' },
      top: '#a9c8f5',
      shirt: '#ffffff',
      bottom: '#5c6b8a',
    },
  },
  {
    id: 'f2',
    name: '도윤',
    emoji: '💤',
    message: '자는 중',
    presence: { kind: 'offline', lastSeen: '3시간 전' },
    look: {
      skin: '#f3cdb0',
      hair: '#6b4a35',
      hood: { kind: 'frog', color: '#8fce7e' },
      top: '#f8ebc8',
      shirt: '#ffffff',
      bottom: '#8a7a5c',
    },
  },
  {
    id: 'f3',
    name: '서연',
    emoji: '☕',
    message: '카페에서 공부 중',
    presence: { kind: 'online' },
    look: {
      skin: '#fde4d3',
      hair: '#b0764a',
      hood: { kind: 'bunny', color: '#fbd3dc', earColor: '#fbd3dc' },
      top: '#fff3c9',
      shirt: '#ffffff',
      bottom: '#e8a9b6',
    },
  },
  {
    id: 'f4',
    name: '지우',
    emoji: '💬',
    message: '고민 들어주는 중',
    presence: { kind: 'inRoom', roomName: '고민 상담' },
    look: {
      skin: '#eec3a2',
      hair: '#2a2530',
      hood: { kind: 'bear', color: '#a9805e' },
      top: '#d8c4f5',
      shirt: '#ffffff',
      bottom: '#6d5a8c',
    },
  },
  {
    id: 'f5',
    name: '민준',
    emoji: '🎧',
    message: '노래 듣는 중',
    presence: { kind: 'online' },
    look: {
      skin: '#f9d9c2',
      hair: '#e6c27a',
      hood: { kind: 'bear', color: '#f4f1ea', earColor: '#f4f1ea' },
      top: '#a8e0d6',
      shirt: '#ffffff',
      bottom: '#4f8f88',
    },
  },
];

export function presenceText(p: Presence): string {
  switch (p.kind) {
    case 'online':
      return '접속 중';
    case 'inRoom':
      return `「${p.roomName}」 방에 있어요`;
    case 'offline':
      return `${p.lastSeen} 접속`;
  }
}
