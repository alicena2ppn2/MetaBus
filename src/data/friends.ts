export type HairStyle = 'short' | 'spiky' | 'bun' | 'cap' | 'long';

/** 기본 몸 하나에 머리, 옷, 색만 바꾸는 아바타 외형 */
export type AvatarLook = {
  skin: string;
  outfit: string;
  hair: HairStyle;
  hairColor: string;
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
  look: { skin: '#f6cfa8', outfit: '#ff7a59', hair: 'short', hairColor: '#4a3426' },
};

export const friends: Friend[] = [
  {
    id: 'f1',
    name: '하늘',
    emoji: '🎮',
    message: '밸런스 게임 하는 중!',
    presence: { kind: 'inRoom', roomName: '밸런스 게임' },
    look: { skin: '#f2c29b', outfit: '#4f8ef7', hair: 'spiky', hairColor: '#2b2b33' },
  },
  {
    id: 'f2',
    name: '도윤',
    emoji: '💤',
    message: '자는 중',
    presence: { kind: 'offline', lastSeen: '3시간 전' },
    look: { skin: '#e8b48a', outfit: '#7bc47f', hair: 'cap', hairColor: '#e2574c' },
  },
  {
    id: 'f3',
    name: '서연',
    emoji: '☕',
    message: '카페에서 공부 중',
    presence: { kind: 'online' },
    look: { skin: '#f8d9bd', outfit: '#f5b942', hair: 'bun', hairColor: '#6b4226' },
  },
  {
    id: 'f4',
    name: '지우',
    emoji: '💬',
    message: '고민 들어주는 중',
    presence: { kind: 'inRoom', roomName: '고민 상담' },
    look: { skin: '#d9a279', outfit: '#b07cf2', hair: 'long', hairColor: '#1f1a24' },
  },
  {
    id: 'f5',
    name: '민준',
    emoji: '🎧',
    message: '노래 듣는 중',
    presence: { kind: 'online' },
    look: { skin: '#f4c7a1', outfit: '#3cc4b4', hair: 'short', hairColor: '#c98b3a' },
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
