import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

// 오늘 공부한 시간(초). 날짜가 바뀌면 0부터 다시 센다.
const STORAGE_KEY = 'metabus.study.v1';

type Saved = { date: string; seconds: number };

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

let state: Saved = { date: today(), seconds: 0 };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

AsyncStorage.getItem(STORAGE_KEY)
  .then((raw) => {
    if (!raw) return;
    const saved = JSON.parse(raw) as Saved;
    if (saved.date === today() && typeof saved.seconds === 'number') {
      state = { date: saved.date, seconds: state.seconds + saved.seconds };
      emit();
    }
  })
  .catch(() => {
    // 못 읽으면 0부터 센다
  });

export function addStudySeconds(seconds: number) {
  const date = today();
  state = { date, seconds: (state.date === date ? state.seconds : 0) + seconds };
  emit();
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => (state.date === today() ? state.seconds : 0);

export function useTodayStudySeconds(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** 3725 → "1:02:05" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** 3725 → "1시간 2분" */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 1) return `${Math.floor(totalSeconds)}초`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}
