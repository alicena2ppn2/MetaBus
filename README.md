# MetaBus

친구들과 3D 공간에서 만나는 모바일 메타버스 앱. Expo + React Three Fiber.

## 실행

```bash
npm install
```

```bash
npm run web
```


## 구조

- `src/app/` 화면 경로 (Expo Router). `/` 홈, `/closet` 옷장, `/study` 공부방, `/worry` 고민 상담방
- `src/screens/HomeScreen.tsx` 홈 화면 (3D 캔버스 + 말풍선, 친구 카드)
- `src/screens/ClosetScreen.tsx` 옷장 (머리, 모자, 옷, 신발 갈아입기)
- `src/screens/StudyScreen.tsx` 공부방 (자리에 앉아 공부 타이머 시작)
- `src/screens/WorryScreen.tsx` 고민 상담방 (풍선으로 고민 남기기, 답글, 토닥, 신고)
- `src/data/safety.ts` 욕설 필터와 상담 전화 안내
- `src/state/theme.ts` 낮/밤 테마 (19시~6시는 자동으로 밤, 홈에서 고정 가능)
- `src/three/HomeScene.tsx` 섬, 모닥불, 카메라, 자리 배치
- `src/three/Avatar.tsx` 치비 아바타 (몸 하나에 머리, 모자, 옷, 신발만 교체)
- `src/three/Outfit.tsx` 옷 (상의 7종, 하의 4종) · `src/three/patterns.ts` 줄무늬·체크·도트 무늬
- `src/data/look.ts` 아바타 외형 타입과 옷장에서 고를 수 있는 목록
- `src/state/myLook.ts` 내 외형 저장 (기기에 유지)
- `src/data/friends.ts` 임시 친구 데이터
