import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

// 밤에는 화면 전체가 어두워진다. 기본은 시간에 따라 자동이고, 홈에서 낮/밤으로 고정할 수 있다.
const STORAGE_KEY = 'metabus.theme.v1';
const NIGHT_STARTS = 19;
const NIGHT_ENDS = 6;

export type ThemeMode = 'auto' | 'day' | 'night';
export const THEME_LABEL: Record<ThemeMode, string> = {
  auto: '🌗 자동',
  day: '☀️ 낮',
  night: '🌙 밤',
};

let mode: ThemeMode = 'auto';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

AsyncStorage.getItem(STORAGE_KEY)
  .then((saved) => {
    if (saved === 'auto' || saved === 'day' || saved === 'night') {
      mode = saved;
      emit();
    }
  })
  .catch(() => {});

export function cycleThemeMode() {
  mode = mode === 'auto' ? 'day' : mode === 'day' ? 'night' : 'auto';
  emit();
  AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
const getMode = () => mode;

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, getMode, getMode);
}

function isNightHour() {
  const hour = new Date().getHours();
  return hour >= NIGHT_STARTS || hour < NIGHT_ENDS;
}

export function useNight(): boolean {
  const current = useThemeMode();
  const [nightHour, setNightHour] = useState(isNightHour);
  useEffect(() => {
    if (current !== 'auto') return;
    setNightHour(isNightHour());
    // 화면을 켜둔 채 저녁이 되어도 바뀌도록 가끔 다시 확인한다
    const timer = setInterval(() => setNightHour(isNightHour()), 60_000);
    return () => clearInterval(timer);
  }, [current]);
  return current === 'auto' ? nightHour : current === 'night';
}

// 낮 화면의 색 → 밤 화면의 색. 밝은 바탕과 어두운 글씨가 서로 뒤집힌다.
const NIGHT_COLORS: Record<string, string> = {
  // 카드·버튼 바탕 ↔ 그 위의 글씨
  '#ffffff': '#2b2a33',
  '#3d2f24': '#f1e7da',
  '#3a2d4d': '#ece6f5',
  '#1f3a4d': '#e8f0f6',
  'rgba(255,255,255,0.92)': 'rgba(38,37,48,0.92)',
  'rgba(255,255,255,0.85)': 'rgba(38,37,48,0.88)',
  'rgba(255,255,255,0.75)': 'rgba(38,37,48,0.8)',
  // 화면 바탕
  '#bfe6f7': '#0f1830',
  '#f6efe6': '#1c1917',
  '#f3e7d3': '#1a1612',
  '#f4eefb': '#1c1926',
  // 보조 글씨
  '#8a7868': '#b3a696',
  '#8b7ba3': '#a99cc0',
  '#4a6a7d': '#9fb4c4',
  '#33505f': '#c5d3dc',
  '#6a7f8c': '#93a5b0',
  '#b8a898': '#6f6458',
  // 옅은 면과 테두리
  '#f3ece4': '#3a3531',
  '#e6d9c8': '#4a4038',
  '#f7f3fc': '#322d42',
  '#ece2fa': '#3d3552',
  '#e6dcf2': '#443c58',
  '#fff6e0': '#3a321c',
  '#5a4310': '#f3dfa6',
  '#c0392b': '#ff8a7a',
  'rgba(58,45,77,0.35)': 'rgba(0,0,0,0.6)',
  'rgba(0,0,0,0.12)': 'rgba(255,255,255,0.25)',
};

/** 낮 기준으로 쓴 스타일에서 밤용 스타일을 만들어, 지금 맞는 쪽을 돌려주는 훅을 만든다 */
type NamedStyles<T> = { [K in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function createThemedStyles<T extends NamedStyles<T>>(day: T & NamedStyles<any>): () => T {
  const night = Object.fromEntries(
    Object.entries(day as Record<string, Record<string, unknown>>).map(([name, style]) => [
      name,
      Object.fromEntries(
        Object.entries(style).map(([key, value]) => [
          key,
          typeof value === 'string' ? (NIGHT_COLORS[value] ?? value) : value,
        ]),
      ),
    ]),
  ) as T & NamedStyles<any>;
  const dayStyles = StyleSheet.create(day);
  const nightStyles = StyleSheet.create(night);
  return () => (useNight() ? nightStyles : dayStyles);
}
