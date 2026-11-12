import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo, useSyncExternalStore } from 'react';

// 고민 상담방의 글. 서버가 없어서 지금은 이 기기에만 저장되고,
// 처음 보이는 고민과 답글은 방이 비어 보이지 않게 넣어둔 임시 데이터다.
const STORAGE_KEY = 'metabus.worries.v1';

export const WORRY_CATEGORIES = ['학교', '친구', '연애', '진로', '가족', '기타'] as const;
export type WorryCategory = (typeof WORRY_CATEGORIES)[number];

export type Reply = { id: string; author: string; text: string; createdAt: number; mine?: boolean };
export type Worry = {
  id: string;
  author: string;
  category: WorryCategory;
  text: string;
  createdAt: number;
  /** 토닥(공감) 수 */
  pats: number;
  replies: Reply[];
  mine?: boolean;
};

type State = {
  worries: Worry[];
  /** 내가 토닥한 고민 */
  patted: string[];
  /** 신고하거나 숨겨서 내 화면에서 안 보이는 고민 */
  hidden: string[];
  reported: string[];
};

const MIN = 60_000;

function seed(): State {
  const now = Date.now();
  const worry = (
    id: string,
    author: string,
    category: WorryCategory,
    text: string,
    minutesAgo: number,
    pats: number,
    replies: [string, string, number][],
  ): Worry => ({
    id,
    author,
    category,
    text,
    createdAt: now - minutesAgo * MIN,
    pats,
    replies: replies.map(([replyAuthor, replyText, ago], i) => ({
      id: `${id}-r${i}`,
      author: replyAuthor,
      text: replyText,
      createdAt: now - ago * MIN,
    })),
  });
  return {
    patted: [],
    hidden: [],
    reported: [],
    worries: [
      worry(
        's1',
        '익명의 토끼',
        '친구',
        '친한 친구가 요즘 나만 빼고 노는 것 같아. 물어봐도 될까?',
        25,
        12,
        [
          ['익명의 곰', '나도 그런 적 있는데 솔직하게 물어보니까 오해였어. 가볍게 물어봐!', 18],
          ['익명의 고양이', '서운한 마음 드는 거 당연해. 네 잘못 아니야.', 9],
        ],
      ),
      worry(
        's2',
        '익명의 개구리',
        '진로',
        '하고 싶은 게 없어서 불안해. 다들 꿈이 있는 것 같은데 나만 없어.',
        70,
        31,
        [['익명의 판다', '없는 게 정상이야. 싫은 것부터 지워나가도 충분해.', 55]],
      ),
      worry(
        's3',
        '익명의 곰',
        '학교',
        '발표만 하면 목소리가 떨려. 다음 주에 또 발표인데 벌써 걱정돼.',
        130,
        8,
        [],
      ),
      worry(
        's4',
        '익명의 고양이',
        '연애',
        '좋아하는 사람한테 먼저 연락해도 부담스럽지 않을까?',
        200,
        19,
        [['익명의 토끼', '부담보다 반가울 확률이 훨씬 높아. 응원해!', 150]],
      ),
      worry(
        's5',
        '익명의 판다',
        '가족',
        '부모님이 성적 얘기만 하셔서 집에 가기 싫어져.',
        320,
        24,
        [],
      ),
    ],
  };
}

let state: State = seed();
const listeners = new Set<() => void>();

function commit(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
}

AsyncStorage.getItem(STORAGE_KEY)
  .then((raw) => {
    if (!raw) return;
    const saved = JSON.parse(raw) as State;
    if (Array.isArray(saved.worries)) {
      state = { ...seed(), ...saved };
      listeners.forEach((listener) => listener());
    }
  })
  .catch(() => {
    // 못 읽으면 처음 상태로 시작한다
  });

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function addWorry(input: { author: string; category: WorryCategory; text: string }) {
  const worry: Worry = {
    id: newId(),
    ...input,
    createdAt: Date.now(),
    pats: 0,
    replies: [],
    mine: true,
  };
  commit({ ...state, worries: [worry, ...state.worries] });
  return worry.id;
}

export function addReply(worryId: string, author: string, text: string) {
  const reply: Reply = { id: newId(), author, text, createdAt: Date.now(), mine: true };
  commit({
    ...state,
    worries: state.worries.map((w) =>
      w.id === worryId ? { ...w, replies: [...w.replies, reply] } : w,
    ),
  });
}

export function togglePat(worryId: string) {
  const had = state.patted.includes(worryId);
  commit({
    ...state,
    patted: had ? state.patted.filter((id) => id !== worryId) : [...state.patted, worryId],
    worries: state.worries.map((w) =>
      w.id === worryId ? { ...w, pats: w.pats + (had ? -1 : 1) } : w,
    ),
  });
}

/** 신고하면 내 화면에서 바로 사라진다. 서버가 붙으면 신고 내용도 서버로 보내야 한다 */
export function hideWorry(worryId: string, report: boolean) {
  commit({
    ...state,
    hidden: [...state.hidden, worryId],
    reported: report ? [...state.reported, worryId] : state.reported,
  });
}

export function deleteWorry(worryId: string) {
  commit({ ...state, worries: state.worries.filter((w) => w.id !== worryId) });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

export function useWorries() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  // 매번 새 배열을 만들면 이걸 받아 쓰는 쪽이 끝없이 다시 그려진다
  return useMemo(() => ({ ...s, visible: s.worries.filter((w) => !s.hidden.includes(w.id)) }), [s]);
}

export function formatAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / MIN);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}
