import { Canvas } from '@react-three/fiber';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BOTTOM_COLORS,
  BOTTOM_STYLES,
  PATTERNS,
  HAIR_COLORS,
  HAIR_STYLES,
  HEADWEAR,
  HEADWEAR_COLORS,
  SHOE_COLORS,
  SHOE_STYLES,
  TOP_COLORS,
  TOP_STYLES,
  randomLook,
} from '../data/look';
import { setMyLook, useMyLook } from '../state/myLook';
import { createThemedStyles } from '../state/theme';
import { ClosetScene, type ClosetFocus } from '../three/ClosetScene';

const CATEGORIES: { id: ClosetFocus; label: string; emoji: string }[] = [
  { id: 'hair', label: '머리', emoji: '💇' },
  { id: 'head', label: '모자', emoji: '🎀' },
  { id: 'top', label: '상의', emoji: '👕' },
  { id: 'bottom', label: '하의', emoji: '👗' },
  { id: 'shoes', label: '신발', emoji: '👟' },
];

function Chips<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { id: T; label: string; emoji?: string }[];
  selected: T | null;
  onSelect: (id: T) => void;
}) {
  const styles = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const active = option.id === selected;
        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {option.emoji ? `${option.emoji} ` : ''}
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Swatches({
  label,
  colors,
  selected,
  onSelect,
}: {
  label: string;
  colors: string[];
  selected: string;
  onSelect: (color: string) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.swatchBlock}>
      <Text style={styles.swatchLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {colors.map((color) => (
          <Pressable
            key={color}
            accessibilityLabel={`${label} ${color}`}
            onPress={() => onSelect(color)}
            style={[styles.swatchRing, color === selected && styles.swatchRingActive]}
          >
            <View style={[styles.swatch, { backgroundColor: color }]} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function ClosetScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const look = useMyLook();
  const [category, setCategory] = useState<ClosetFocus>('hair');

  // 화면을 좌우로 끌면 캐릭터가 돈다
  const spin = useRef(0);
  const spinStart = useRef(0);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4,
        onPanResponderGrant: () => {
          spinStart.current = spin.current;
        },
        onPanResponderMove: (_, g) => {
          spin.current = spinStart.current + g.dx * 0.012;
        },
      }),
    [],
  );

  const headwearId =
    HEADWEAR.find(
      (h) => h.type === look.head.type && (h.type === 'none' || h.kind === look.head.kind),
    )?.id ?? null;

  return (
    <View style={styles.root}>
      <View style={styles.stage} {...pan.panHandlers}>
        <Canvas style={StyleSheet.absoluteFill} camera={{ fov: 35, position: [0, 1.6, 6] }}>
          <ClosetScene look={look} focus={category} spin={spin} />
        </Canvas>

        <View style={[styles.header, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
          <Pressable
            style={styles.headerButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          >
            <Text style={styles.headerButtonText}>‹ 홈</Text>
          </Pressable>
          <Text style={styles.title}>내 옷장</Text>
          <Pressable style={styles.headerButton} onPress={() => setMyLook(randomLook(look))}>
            <Text style={styles.headerButtonText}>🎲 랜덤</Text>
          </Pressable>
        </View>

        <View style={styles.side} pointerEvents="box-none">
          {CATEGORIES.map((item) => {
            const active = item.id === category;
            return (
              <Pressable
                key={item.id}
                onPress={() => setCategory(item.id)}
                style={[styles.sideButton, active && styles.sideButtonActive]}
              >
                <Text style={styles.sideEmoji}>{item.emoji}</Text>
                <Text style={[styles.sideLabel, active && styles.sideLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        {category === 'hair' && (
          <>
            <Chips
              options={HAIR_STYLES}
              selected={look.hair.style}
              onSelect={(style) => setMyLook({ ...look, hair: { ...look.hair, style } })}
            />
            <Swatches
              label="머리 색"
              colors={HAIR_COLORS}
              selected={look.hair.color}
              onSelect={(color) => setMyLook({ ...look, hair: { ...look.hair, color } })}
            />
          </>
        )}

        {category === 'head' && (
          <>
            <Chips
              options={HEADWEAR}
              selected={headwearId}
              onSelect={(id) => {
                const item = HEADWEAR.find((h) => h.id === id);
                if (!item) return;
                setMyLook({
                  ...look,
                  head: { type: item.type, kind: item.kind, color: item.color },
                });
              }}
            />
            {look.head.type !== 'none' && (
              <Swatches
                label={look.head.type === 'hood' ? '후드 색' : '머리띠 색'}
                colors={HEADWEAR_COLORS}
                selected={look.head.color}
                onSelect={(color) => setMyLook({ ...look, head: { ...look.head, color } })}
              />
            )}
          </>
        )}

        {category === 'top' && (
          <>
            <Chips
              options={TOP_STYLES}
              selected={look.top.style}
              onSelect={(style) => setMyLook({ ...look, top: { ...look.top, style } })}
            />
            <Chips
              options={PATTERNS}
              selected={look.top.pattern}
              onSelect={(pattern) => setMyLook({ ...look, top: { ...look.top, pattern } })}
            />
            <Swatches
              label="상의 색"
              colors={TOP_COLORS}
              selected={look.top.color}
              onSelect={(color) => setMyLook({ ...look, top: { ...look.top, color } })}
            />
          </>
        )}

        {category === 'bottom' && (
          <>
            <Chips
              options={BOTTOM_STYLES}
              selected={look.bottom.style}
              onSelect={(style) => setMyLook({ ...look, bottom: { ...look.bottom, style } })}
            />
            <Chips
              options={PATTERNS}
              selected={look.bottom.pattern}
              onSelect={(pattern) => setMyLook({ ...look, bottom: { ...look.bottom, pattern } })}
            />
            <Swatches
              label={look.top.style === 'dress' ? '하의 색 (원피스에 가려져요)' : '하의 색'}
              colors={BOTTOM_COLORS}
              selected={look.bottom.color}
              onSelect={(color) => setMyLook({ ...look, bottom: { ...look.bottom, color } })}
            />
          </>
        )}

        {category === 'shoes' && (
          <>
            <Chips
              options={SHOE_STYLES}
              selected={look.shoes.style}
              onSelect={(style) => setMyLook({ ...look, shoes: { ...look.shoes, style } })}
            />
            <Swatches
              label="신발 색"
              colors={SHOE_COLORS}
              selected={look.shoes.color}
              onSelect={(color) => setMyLook({ ...look, shoes: { ...look.shoes, color } })}
            />
          </>
        )}
      </View>
    </View>
  );
}

const useStyles = createThemedStyles({
  root: { flex: 1, backgroundColor: '#f6efe6' },
  stage: { flex: 1 },

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
  title: { fontSize: 20, fontWeight: '800', color: '#3d2f24' },
  headerButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  headerButtonText: { fontSize: 15, fontWeight: '700', color: '#3d2f24' },

  side: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    gap: 10,
  },
  sideButton: {
    width: 62,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#ffffff',
  },
  sideButtonActive: { backgroundColor: '#3d2f24' },
  sideEmoji: { fontSize: 22 },
  sideLabel: { marginTop: 2, fontSize: 12, fontWeight: '700', color: '#3d2f24' },
  sideLabelActive: { color: '#ffffff' },

  panel: {
    minHeight: 210,
    paddingTop: 18,
    gap: 14,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#ffffff',
  },
  row: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#f3ece4',
  },
  chipActive: { backgroundColor: '#3d2f24' },
  chipText: { fontSize: 14, fontWeight: '700', color: '#3d2f24' },
  chipTextActive: { color: '#ffffff' },

  swatchBlock: { gap: 8 },
  swatchLabel: { paddingHorizontal: 18, fontSize: 13, fontWeight: '700', color: '#8a7868' },
  swatchRing: {
    padding: 3,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchRingActive: { borderColor: '#3d2f24' },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
});
