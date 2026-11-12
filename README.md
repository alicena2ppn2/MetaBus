# MetaBus

친구들과 3D 공간에서 만나는 모바일 메타버스 앱. Expo + React Three Fiber.

## 실행

```bash
npm install
```

```bash
npm run web
```

휴대폰에서는 `npm start` 후 Expo Go로 QR을 찍는다.

## 구조

- `src/screens/HomeScreen.tsx` 홈 화면 (3D 캔버스 + 말풍선, 친구 카드)
- `src/three/HomeScene.tsx` 섬, 모닥불, 카메라, 자리 배치
- `src/three/Avatar.tsx` 로우폴리 아바타 (몸 하나에 머리, 옷, 색만 교체)
- `src/data/friends.ts` 임시 친구 데이터
