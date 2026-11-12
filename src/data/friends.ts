import { defaultLook, type AvatarLook } from './look';

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
  look: defaultLook,
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
      hair: { style: 'fluffy', color: '#3a3340' },
      head: { type: 'hood', kind: 'cat', color: '#f2a65a' },
      top: { style: 'tee', color: '#a9c8f5', shirt: '#ffffff' },
      bottom: '#5c6b8a',
      shoes: { style: 'shoes', color: '#7a5038' },
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
      hair: { style: 'fluffy', color: '#6b4a35' },
      head: { type: 'hood', kind: 'frog', color: '#8fce7e' },
      top: { style: 'vest', color: '#f8ebc8', shirt: '#ffffff' },
      bottom: '#8a7a5c',
      shoes: { style: 'shoes', color: '#7a5038' },
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
      hair: { style: 'fluffy', color: '#b0764a' },
      head: { type: 'band', kind: 'bunny', color: '#ffffff' },
      top: { style: 'vest', color: '#fff3c9', shirt: '#ffffff' },
      bottom: '#e8a9b6',
      shoes: { style: 'shoes', color: '#7a5038' },
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
      hair: { style: 'fluffy', color: '#2a2530' },
      head: { type: 'hood', kind: 'bear', color: '#a9805e' },
      top: { style: 'vest', color: '#d8c4f5', shirt: '#ffffff' },
      bottom: '#6d5a8c',
      shoes: { style: 'shoes', color: '#7a5038' },
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
      hair: { style: 'fluffy', color: '#e6c27a' },
      head: { type: 'hood', kind: 'bear', color: '#f4f1ea' },
      top: { style: 'vest', color: '#a8e0d6', shirt: '#ffffff' },
      bottom: '#4f8f88',
      shoes: { style: 'shoes', color: '#7a5038' },
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
