import { Canvas } from '@react-three/fiber';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { friends, me as meBase, presenceText, type Friend } from '../data/friends';
import { useMyLook } from '../state/myLook';
import { HomeScene, type LabelPoint } from '../three/HomeScene';

const LABEL_WIDTH = 120;

const DOT_COLOR: Record<Friend['presence']['kind'], string> = {
  online: '#35c46a',
  inRoom: '#4f8ef7',
  offline: '#b4b8bf',
};

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [labels, setLabels] = useState<LabelPoint[]>([]);

  const myLook = useMyLook();
  const me = useMemo(() => ({ ...meBase, look: myLook }), [myLook]);
  const everyone = useMemo(() => [...friends, me], [me]);
  const selected = everyone.find((f) => f.id === selectedId) ?? null;
  const awake = friends.filter((f) => f.presence.kind !== 'offline').length;

  const toggle = useCallback(
    (id: string) => setSelectedId((current) => (current === id ? null : id)),
    [],
  );

  return (
    <View style={styles.root}>
      <Canvas
        style={StyleSheet.absoluteFill}
        camera={{ fov: 40, near: 0.1, far: 100 }}
        onPointerMissed={() => setSelectedId(null)}
      >
        <HomeScene
          me={me}
          friends={friends}
          selectedId={selectedId}
          onSelect={toggle}
          onLabels={setLabels}
        />
      </Canvas>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {labels.map((point) => {
          const friend = everyone.find((f) => f.id === point.id);
          if (!friend) return null;
          const active = friend.id === selectedId;
          return (
            <View
              key={point.id}
              pointerEvents="box-none"
              style={[styles.labelAnchor, { left: point.x - LABEL_WIDTH / 2, top: point.y - 30 }]}
            >
              <Pressable
                onPress={() => toggle(friend.id)}
                style={[styles.label, active && styles.labelActive]}
              >
                <Text style={styles.labelEmoji}>{friend.emoji}</Text>
                <Text style={[styles.labelName, active && styles.labelNameActive]}>
                  {friend.name}
                </Text>
                <View style={[styles.dot, { backgroundColor: DOT_COLOR[friend.presence.kind] }]} />
              </Pressable>
            </View>
          );
        })}

        <View style={[styles.header, { paddingTop: insets.top + 12 }]} pointerEvents="none">
          <Text style={styles.title}>내 홈</Text>
          <Text style={styles.subtitle}>
            친구 {friends.length}명 중 {awake}명이 깨어 있어요
          </Text>
        </View>

        <Pressable
          style={[styles.closetButton, { top: insets.top + 14 }]}
          onPress={() => router.push('/closet')}
        >
          <Text style={styles.closetEmoji}>👕</Text>
          <Text style={styles.closetText}>옷장</Text>
        </Pressable>
        <Pressable
          style={[styles.closetButton, { top: insets.top + 64 }]}
          onPress={() => router.push('/study')}
        >
          <Text style={styles.closetEmoji}>📚</Text>
          <Text style={styles.closetText}>공부방</Text>
        </Pressable>

        <View
          style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
          pointerEvents="box-none"
        >
          {selected ? (
            <View style={styles.card}>
              <Text style={styles.cardEmoji}>{selected.emoji}</Text>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{selected.name}</Text>
                <Text style={styles.cardMessage}>{selected.message}</Text>
                <View style={styles.cardPresence}>
                  <View
                    style={[styles.dot, { backgroundColor: DOT_COLOR[selected.presence.kind] }]}
                  />
                  <Text style={styles.cardPresenceText}>{presenceText(selected.presence)}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.hint}>
              <Text style={styles.hintText}>친구를 눌러 지금 뭐 하는지 확인해 보세요</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#bfe6f7' },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#1f3a4d' },
  closetButton: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  closetEmoji: { fontSize: 16 },
  closetText: { fontSize: 15, fontWeight: '700', color: '#1f3a4d' },
  subtitle: { marginTop: 4, fontSize: 14, color: '#4a6a7d' },

  labelAnchor: {
    position: 'absolute',
    width: LABEL_WIDTH,
    alignItems: 'center',
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  labelActive: { backgroundColor: '#1f3a4d' },
  labelEmoji: { fontSize: 13 },
  labelName: { fontSize: 13, fontWeight: '700', color: '#1f3a4d' },
  labelNameActive: { color: '#ffffff' },
  dot: { width: 8, height: 8, borderRadius: 4 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  cardEmoji: { fontSize: 34 },
  cardBody: { flex: 1 },
  cardName: { fontSize: 18, fontWeight: '800', color: '#1f3a4d' },
  cardMessage: { marginTop: 2, fontSize: 15, color: '#33505f' },
  cardPresence: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardPresenceText: { fontSize: 13, color: '#6a7f8c' },
  hint: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  hintText: { fontSize: 13, color: '#33505f' },
});
