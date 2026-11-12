import { Canvas } from '@react-three/fiber';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { friends } from '../data/friends';
import { useMyLook } from '../state/myLook';
import { createThemedStyles } from '../state/theme';
import { addStudySeconds, formatClock, formatDuration, useTodayStudySeconds } from '../state/study';
import { SEATS, StudyScene, type Occupant, type SeatLabel } from '../three/StudyScene';

const LABEL_WIDTH = 130;

// 서버가 붙기 전까지 쓰는 임시 데이터: 이미 공부 중인 친구들 (자리 번호, 공부한 분)
const STUDYING_FRIENDS: { friendId: string; seat: number; minutes: number }[] = [
  { friendId: 'f3', seat: 0, minutes: 42 },
  { friendId: 'f5', seat: 2, minutes: 75 },
  { friendId: 'f4', seat: 5, minutes: 8 },
];

type Session =
  | { phase: 'idle' }
  /** startedAt이 null이면 쉬는 중. banked는 그 전까지 쌓인 초 */
  | { phase: 'studying'; startedAt: number | null; banked: number };

export function StudyScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const myLook = useMyLook();
  const todaySeconds = useTodayStudySeconds();

  const [mySeat, setMySeat] = useState<number | null>(null);
  const [session, setSession] = useState<Session>({ phase: 'idle' });
  const [labels, setLabels] = useState<SeatLabel[]>([]);
  const [lastSession, setLastSession] = useState<number | null>(null);
  const [, setTick] = useState(0);

  const studying = session.phase === 'studying';
  const paused = studying && session.startedAt === null;

  // 화면에 보이는 시간은 매번 시작 시각에서 다시 계산해서, 앱이 잠깐 멈춰도 밀리지 않는다
  const elapsed = studying
    ? session.banked + (session.startedAt === null ? 0 : (Date.now() - session.startedAt) / 1000)
    : 0;

  useEffect(() => {
    if (!studying || paused) return;
    const timer = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(timer);
  }, [studying, paused]);

  const friendSeats = useMemo(
    () =>
      STUDYING_FRIENDS.flatMap((entry) => {
        const friend = friends.find((f) => f.id === entry.friendId);
        return friend ? [{ ...entry, friend }] : [];
      }),
    [],
  );

  const occupants = useMemo(() => {
    const list: (Occupant | null)[] = SEATS.map(() => null);
    friendSeats.forEach(({ seat, friend }) => {
      list[seat] = { id: friend.id, look: friend.look };
    });
    if (mySeat !== null) list[mySeat] = { id: 'me', look: myLook };
    return list;
  }, [friendSeats, mySeat, myLook]);

  // 3D에서 누른 자리와 버튼으로 누른 자리가 같은 규칙을 쓰도록 최신 상태를 ref로 본다
  const guard = useRef({ studying, friendSeats });
  guard.current = { studying, friendSeats };
  const sit = useCallback((seat: number) => {
    if (guard.current.studying) return;
    if (guard.current.friendSeats.some((f) => f.seat === seat)) return;
    setLastSession(null);
    setMySeat(seat);
  }, []);

  const start = () => {
    setLastSession(null);
    setSession({ phase: 'studying', startedAt: Date.now(), banked: 0 });
  };
  const pause = () => setSession({ phase: 'studying', startedAt: null, banked: elapsed });
  const resume = () => setSession({ phase: 'studying', startedAt: Date.now(), banked: elapsed });
  const finish = () => {
    const seconds = Math.floor(elapsed);
    if (seconds > 0) addStudySeconds(seconds);
    setLastSession(seconds);
    setSession({ phase: 'idle' });
  };
  const leave = () => {
    if (studying) finish();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.root}>
      <Canvas style={StyleSheet.absoluteFill} camera={{ fov: 40, near: 0.1, far: 100 }}>
        <StudyScene
          occupants={occupants}
          mySeat={mySeat}
          studying={studying}
          onSeatPress={sit}
          onLabels={setLabels}
        />
      </Canvas>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* 전체 보기일 때만 자리 이름표를 보여준다 */}
        {!studying &&
          labels.map((label) => {
            const entry = friendSeats.find((f) => f.seat === label.seat);
            const mine = label.seat === mySeat;
            return (
              <View
                key={label.seat}
                pointerEvents="box-none"
                style={[styles.labelAnchor, { left: label.x - LABEL_WIDTH / 2, top: label.y - 30 }]}
              >
                {entry ? (
                  <View style={styles.label}>
                    <Text style={styles.labelText}>
                      {entry.friend.name} · {formatDuration(entry.minutes * 60)}
                    </Text>
                  </View>
                ) : mine ? (
                  <View style={[styles.label, styles.labelMine]}>
                    <Text style={[styles.labelText, styles.labelTextMine]}>나</Text>
                  </View>
                ) : (
                  <Pressable
                    accessibilityLabel={`${label.seat + 1}번 자리에 앉기`}
                    onPress={() => sit(label.seat)}
                    style={styles.seatButton}
                  >
                    <Text style={styles.seatButtonText}>＋ 앉기</Text>
                  </Pressable>
                )}
              </View>
            );
          })}

        {studying && (
          <View style={[styles.timerWrap, { paddingTop: insets.top + 70 }]} pointerEvents="none">
            <Text style={styles.timerCaption}>{paused ? '쉬는 중' : '공부 중'}</Text>
            <Text style={[styles.timer, paused && styles.timerPaused]}>{formatClock(elapsed)}</Text>
            <Text style={styles.timerSub}>
              오늘 누적 {formatDuration(todaySeconds + Math.floor(elapsed))}
            </Text>
          </View>
        )}

        <View style={[styles.header, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
          <Pressable style={styles.headerButton} onPress={leave}>
            <Text style={styles.headerButtonText}>‹ 홈</Text>
          </Pressable>
          <Text style={styles.title}>공부방</Text>
          <View style={styles.headerButton}>
            <Text style={styles.headerButtonText}>
              {friendSeats.length + (mySeat !== null ? 1 : 0)}/{SEATS.length}
            </Text>
          </View>
        </View>

        <View
          style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
          pointerEvents="box-none"
        >
          {studying ? (
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.buttonLight]}
                onPress={paused ? resume : pause}
              >
                <Text style={styles.buttonLightText}>{paused ? '다시 시작' : '잠깐 쉬기'}</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.buttonDark]} onPress={finish}>
                <Text style={styles.buttonDarkText}>공부 끝내기</Text>
              </Pressable>
            </View>
          ) : mySeat !== null ? (
            <View style={styles.card}>
              <Text style={styles.cardText}>
                {lastSession !== null
                  ? `방금 ${formatDuration(lastSession)} 공부했어요 · 오늘 ${formatDuration(todaySeconds)}`
                  : todaySeconds > 0
                    ? `오늘 ${formatDuration(todaySeconds)} 공부했어요`
                    : '자리에 앉았어요. 준비되면 시작해요'}
              </Text>
              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.button, styles.buttonLight]}
                  onPress={() => setMySeat(null)}
                >
                  <Text style={styles.buttonLightText}>일어나기</Text>
                </Pressable>
                <Pressable style={[styles.button, styles.buttonDark]} onPress={start}>
                  <Text style={styles.buttonDarkText}>공부 시작</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.hint}>
              <Text style={styles.hintText}>빈 자리를 눌러 앉아 보세요</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const INK = '#3d2f24';

const useStyles = createThemedStyles({
  root: { flex: 1, backgroundColor: '#f3e7d3' },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 20, fontWeight: '800', color: INK },
  headerButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  headerButtonText: { fontSize: 15, fontWeight: '700', color: INK },

  labelAnchor: { position: 'absolute', width: LABEL_WIDTH, alignItems: 'center' },
  label: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  labelMine: { backgroundColor: INK },
  labelText: { fontSize: 12, fontWeight: '700', color: INK },
  labelTextMine: { color: '#ffffff' },
  seatButton: {
    marginTop: 26,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: INK,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  seatButtonText: { fontSize: 13, fontWeight: '800', color: INK },

  timerWrap: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  timerCaption: { fontSize: 16, fontWeight: '700', color: '#8a7868' },
  timer: {
    marginTop: 2,
    fontSize: 76,
    fontWeight: '800',
    color: INK,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  timerPaused: { color: '#b8a898' },
  timerSub: { marginTop: 2, fontSize: 14, color: '#8a7868' },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  card: { gap: 12, padding: 16, borderRadius: 22, backgroundColor: '#ffffff' },
  cardText: { fontSize: 15, fontWeight: '600', color: INK, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: 'center' },
  buttonDark: { backgroundColor: INK },
  buttonDarkText: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  buttonLight: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e6d9c8' },
  buttonLightText: { fontSize: 17, fontWeight: '700', color: INK },
  hint: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  hintText: { fontSize: 13, fontWeight: '600', color: INK },
});
