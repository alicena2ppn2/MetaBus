import * as THREE from 'three';

import type { Pattern } from '../data/look';

// 옷 무늬는 이미지 파일 없이 작은 픽셀 배열로 직접 그린다 (웹과 휴대폰에서 똑같이 동작).
const SIZE = 32;
const ACCENT: [number, number, number] = [255, 250, 240];
const cache = new Map<string, THREE.DataTexture>();

function mix(a: [number, number, number], b: [number, number, number], t: number) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t)) as [number, number, number];
}

function pixel(pattern: Pattern, x: number, y: number, base: [number, number, number]) {
  switch (pattern) {
    case 'stripe':
      return y % 16 < 8 ? base : ACCENT;
    case 'check': {
      const a = x % 16 < 8;
      const b = y % 16 < 8;
      return a && b ? base : a || b ? mix(base, ACCENT, 0.5) : ACCENT;
    }
    case 'dot': {
      // 16px 칸마다 점 하나, 한 줄씩 엇갈리게
      const row = Math.floor(y / 16);
      const cx = ((x + (row % 2) * 8) % 16) - 8;
      const cy = (y % 16) - 8;
      return cx * cx + cy * cy < 11 ? ACCENT : base;
    }
    default:
      return base;
  }
}

/** 무늬 텍스처. repeat는 옷감을 한 바퀴 두르는 동안 무늬가 반복되는 횟수 [가로, 세로] */
export function patternTexture(
  pattern: Pattern,
  color: THREE.Color,
  repeat: [number, number],
): THREE.DataTexture {
  const hex = color.getHexString();
  const key = `${pattern}-${hex}-${repeat[0]}-${repeat[1]}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const base: [number, number, number] = [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const [r, g, b] = pixel(pattern, x, y, base);
      data.set([r, g, b, 255], (y * SIZE + x) * 4);
    }
  }
  const texture = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.needsUpdate = true;
  cache.set(key, texture);
  return texture;
}
