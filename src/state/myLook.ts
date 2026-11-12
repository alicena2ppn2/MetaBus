import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { defaultLook, type AvatarLook } from '../data/look';

// 홈과 옷장이 같은 내 외형을 보도록 하는 작은 저장소. 기기에 저장해서 앱을 다시 켜도 유지된다.
const STORAGE_KEY = 'metabus.myLook.v1';

let look: AvatarLook = defaultLook;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

AsyncStorage.getItem(STORAGE_KEY)
  .then((saved) => {
    if (!saved) return;
    const parsed = JSON.parse(saved) as Partial<AvatarLook>;
    // 예전에는 하의가 색 하나였다
    const savedBottom: unknown = parsed.bottom;
    const bottom =
      typeof savedBottom === 'string'
        ? { ...defaultLook.bottom, color: savedBottom }
        : { ...defaultLook.bottom, ...parsed.bottom };
    look = {
      ...defaultLook,
      ...parsed,
      hair: { ...defaultLook.hair, ...parsed.hair },
      head: { ...defaultLook.head, ...parsed.head },
      top: { ...defaultLook.top, ...parsed.top },
      bottom,
      shoes: { ...defaultLook.shoes, ...parsed.shoes },
    };
    emit();
  })
  .catch(() => {
    // 저장된 값을 못 읽으면 기본 외형으로 시작한다
  });

export function setMyLook(next: AvatarLook) {
  look = next;
  emit();
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => look;

export function useMyLook(): AvatarLook {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
