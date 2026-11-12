import { Canvas } from '@react-three/fiber';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AnimalKind } from '../data/look';
import { HELPLINES, hasBadWords, looksLikeCrisis } from '../data/safety';
import { useMyLook } from '../state/myLook';
import {
  WORRY_CATEGORIES,
  addReply,
  addWorry,
  deleteWorry,
  formatAgo,
  hideWorry,
  togglePat,
  useWorries,
  type WorryCategory,
} from '../state/worries';
import { BALLOON_COLORS, BALLOON_SLOTS, WorryScene, type BalloonLabel } from '../three/WorryScene';

const NOTE_WIDTH = 104;
const MAX_WORRY = 200;
const MAX_REPLY = 150;
const BAD_WORD_MESSAGE = '거친 표현이 들어 있어요. 조금만 다듬어 주세요.';

const ANIMAL_NAME: Record<AnimalKind, string> = {
  panda: '판다',
  bear: '곰',
  cat: '고양이',
  bunny: '토끼',
  frog: '개구리',
};

function colorFor(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return BALLOON_COLORS[sum % BALLOON_COLORS.length];
}

function Helplines() {
  return (
    <View style={styles.help}>
      <Text style={styles.helpTitle}>혼자 견디기 힘들 땐 전문가와 이야기해요</Text>
      {HELPLINES.map((line) => (
        <Text key={line.number} style={styles.helpLine}>
          {line.name} <Text style={styles.helpNumber}>{line.number}</Text> · {line.note}
        </Text>
      ))}
    </View>
  );
}

export function WorryScreen() {
  const insets = useSafeAreaInsets();
  const myLook = useMyLook();
  const { visible, patted } = useWorries();

  const [labels, setLabels] = useState<BalloonLabel[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [panel, setPanel] = useState<'none' | 'compose' | 'help'>('none');
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState('');
  const [draft, setDraft] = useState('');
  const [category, setCategory] = useState<WorryCategory>('기타');
  const [draftError, setDraftError] = useState('');

  // 이 방에서는 항상 익명이다. 닉네임은 내가 쓴 동물 모자를 따라간다
  const myName = `익명의 ${ANIMAL_NAME[myLook.head.kind]}`;

  const balloons = useMemo(
    () => visible.slice(0, BALLOON_SLOTS).map((w) => ({ id: w.id, color: colorFor(w.id) })),
    [visible],
  );
  const open = visible.find((w) => w.id === openId) ?? null;
  const overlayOpen = open !== null || panel !== 'none';

  const closeAll = () => {
    setOpenId(null);
    setPanel('none');
    setReply('');
    setReplyError('');
    setDraftError('');
  };

  const sendReply = () => {
    const text = reply.trim();
    if (!open || !text) return;
    if (hasBadWords(text)) {
      setReplyError(BAD_WORD_MESSAGE);
      return;
    }
    addReply(open.id, myName, text);
    setReply('');
    setReplyError('');
  };

  const postWorry = () => {
    const text = draft.trim();
    if (text.length < 5) {
      setDraftError('고민을 조금만 더 자세히 적어 주세요.');
      return;
    }
    if (hasBadWords(text)) {
      setDraftError(BAD_WORD_MESSAGE);
      return;
    }
    const id = addWorry({ author: myName, category, text });
    setDraft('');
    setDraftError('');
    setCategory('기타');
    setPanel('none');
    // 위험 신호가 보이는 글이면 올린 직후 바로 열어서 도움받을 곳을 함께 보여준다
    if (looksLikeCrisis(text)) setOpenId(id);
  };

  return (
    <View style={styles.root}>
      <Canvas style={StyleSheet.absoluteFill} camera={{ fov: 40, near: 0.1, far: 100 }}>
        <WorryScene
          balloons={balloons}
          selectedId={openId}
          myLook={myLook}
          onBalloonPress={setOpenId}
          onLabels={setLabels}
        />
      </Canvas>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* 풍선에 매달린 쪽지 */}
        {!overlayOpen &&
          labels.map((label) => {
            const worry = visible.find((w) => w.id === label.id);
            if (!worry) return null;
            return (
              <View
                key={label.id}
                pointerEvents="box-none"
                style={[styles.noteAnchor, { left: label.x - NOTE_WIDTH / 2, top: label.y - 6 }]}
              >
                <Pressable
                  accessibilityLabel={`고민 열기: ${worry.text}`}
                  onPress={() => setOpenId(worry.id)}
                  style={[styles.note, worry.mine && styles.noteMine]}
                >
                  <Text style={styles.noteMeta}>
                    {worry.mine ? '내 고민' : worry.category} · 💬 {worry.replies.length}
                  </Text>
                  <Text style={styles.noteText} numberOfLines={2}>
                    {worry.text}
                  </Text>
                </Pressable>
              </View>
            );
          })}

        <View style={[styles.header, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
          <Pressable
            style={styles.headerButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          >
            <Text style={styles.headerButtonText}>‹ 홈</Text>
          </Pressable>
          <Text style={styles.title}>고민 상담방</Text>
          <Pressable style={styles.headerButton} onPress={() => setPanel('help')}>
            <Text style={styles.headerButtonText}>도움받기</Text>
          </Pressable>
        </View>

        {!overlayOpen && (
          <View
            style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
            pointerEvents="box-none"
          >
            <Text style={styles.footerHint}>풍선을 눌러 고민을 읽고 답해 주세요</Text>
            <Pressable style={styles.primary} onPress={() => setPanel('compose')}>
              <Text style={styles.primaryText}>🎈 고민 남기기</Text>
            </Pressable>
          </View>
        )}
      </View>

      {overlayOpen && (
        <KeyboardAvoidingView
          style={StyleSheet.absoluteFill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable accessibilityLabel="닫기" style={styles.backdrop} onPress={closeAll} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            {open && (
              <>
                <View style={styles.sheetHead}>
                  <Text style={styles.sheetMeta}>
                    {open.author} · {open.category} · {formatAgo(open.createdAt)}
                  </Text>
                  <Pressable accessibilityLabel="닫기" onPress={closeAll} hitSlop={10}>
                    <Text style={styles.close}>✕</Text>
                  </Pressable>
                </View>
                <ScrollView style={styles.sheetScroll} keyboardShouldPersistTaps="handled">
                  <Text style={styles.worryText}>{open.text}</Text>
                  {looksLikeCrisis(open.text) && <Helplines />}

                  <View style={styles.actions}>
                    <Pressable
                      style={[styles.pat, patted.includes(open.id) && styles.patOn]}
                      onPress={() => togglePat(open.id)}
                    >
                      <Text style={[styles.patText, patted.includes(open.id) && styles.patTextOn]}>
                        🫶 토닥 {open.pats}
                      </Text>
                    </Pressable>
                    <View style={styles.actionsRight}>
                      {open.mine ? (
                        <Pressable
                          onPress={() => {
                            deleteWorry(open.id);
                            closeAll();
                          }}
                          hitSlop={8}
                        >
                          <Text style={styles.subtle}>삭제</Text>
                        </Pressable>
                      ) : (
                        <>
                          <Pressable
                            onPress={() => {
                              hideWorry(open.id, false);
                              closeAll();
                            }}
                            hitSlop={8}
                          >
                            <Text style={styles.subtle}>숨기기</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              hideWorry(open.id, true);
                              closeAll();
                            }}
                            hitSlop={8}
                          >
                            <Text style={styles.subtle}>신고</Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>

                  <Text style={styles.replyCount}>답글 {open.replies.length}</Text>
                  {open.replies.length === 0 && (
                    <Text style={styles.empty}>아직 답글이 없어요. 첫 마디를 건네 보세요.</Text>
                  )}
                  {open.replies.map((item) => (
                    <View key={item.id} style={[styles.reply, item.mine && styles.replyMine]}>
                      <Text style={styles.replyAuthor}>
                        {item.mine ? `${item.author} (나)` : item.author} ·{' '}
                        {formatAgo(item.createdAt)}
                      </Text>
                      <Text style={styles.replyText}>{item.text}</Text>
                    </View>
                  ))}
                </ScrollView>

                {replyError !== '' && <Text style={styles.error}>{replyError}</Text>}
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={reply}
                    onChangeText={(text) => {
                      setReply(text);
                      setReplyError('');
                    }}
                    placeholder="따뜻한 한마디 남기기"
                    placeholderTextColor="#a99bb8"
                    maxLength={MAX_REPLY}
                    onSubmitEditing={sendReply}
                    returnKeyType="send"
                  />
                  <Pressable
                    style={[styles.send, reply.trim() === '' && styles.sendOff]}
                    onPress={sendReply}
                  >
                    <Text style={styles.sendText}>보내기</Text>
                  </Pressable>
                </View>
              </>
            )}

            {!open && panel === 'compose' && (
              <>
                <View style={styles.sheetHead}>
                  <Text style={styles.sheetTitle}>고민 남기기</Text>
                  <Pressable accessibilityLabel="닫기" onPress={closeAll} hitSlop={10}>
                    <Text style={styles.close}>✕</Text>
                  </Pressable>
                </View>
                <Text style={styles.sheetMeta}>{myName}(으)로 남겨져요. 이름은 보이지 않아요.</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}
                >
                  {WORRY_CATEGORIES.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => setCategory(item)}
                      style={[styles.chip, item === category && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, item === category && styles.chipTextOn]}>
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <TextInput
                  style={styles.textarea}
                  value={draft}
                  onChangeText={(text) => {
                    setDraft(text);
                    setDraftError('');
                  }}
                  placeholder="요즘 마음에 걸리는 일을 적어 보세요"
                  placeholderTextColor="#a99bb8"
                  multiline
                  maxLength={MAX_WORRY}
                />
                <Text style={styles.counter}>
                  {draft.length}/{MAX_WORRY}
                </Text>
                {looksLikeCrisis(draft) && <Helplines />}
                {draftError !== '' && <Text style={styles.error}>{draftError}</Text>}
                <Pressable style={styles.primary} onPress={postWorry}>
                  <Text style={styles.primaryText}>풍선으로 띄우기</Text>
                </Pressable>
              </>
            )}

            {!open && panel === 'help' && (
              <>
                <View style={styles.sheetHead}>
                  <Text style={styles.sheetTitle}>도움받기</Text>
                  <Pressable accessibilityLabel="닫기" onPress={closeAll} hitSlop={10}>
                    <Text style={styles.close}>✕</Text>
                  </Pressable>
                </View>
                <Helplines />
                <Text style={styles.rules}>
                  이 방은 서로 고민을 들어주는 곳이에요. 불편한 글은 열어서 숨기거나 신고할 수 있고,
                  신고한 글은 바로 보이지 않게 돼요.
                </Text>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const INK = '#3a2d4d';
const SOFT = '#8b7ba3';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4eefb' },

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

  noteAnchor: { position: 'absolute', width: NOTE_WIDTH, alignItems: 'center' },
  note: {
    width: NOTE_WIDTH,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6dcf2',
  },
  noteMine: { borderColor: INK, borderWidth: 2 },
  noteMeta: { fontSize: 10, fontWeight: '700', color: SOFT },
  noteText: { marginTop: 2, fontSize: 12, lineHeight: 16, color: INK },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    gap: 10,
  },
  footerHint: { textAlign: 'center', fontSize: 13, fontWeight: '600', color: SOFT },
  primary: { paddingVertical: 16, borderRadius: 18, alignItems: 'center', backgroundColor: INK },
  primaryText: { fontSize: 17, fontWeight: '800', color: '#ffffff' },

  backdrop: { flex: 1, backgroundColor: 'rgba(58,45,77,0.35)' },
  sheet: {
    maxHeight: '78%',
    paddingTop: 18,
    paddingHorizontal: 18,
    gap: 12,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#ffffff',
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 19, fontWeight: '800', color: INK },
  sheetMeta: { fontSize: 13, fontWeight: '600', color: SOFT },
  sheetScroll: { flexGrow: 0 },
  close: { fontSize: 18, fontWeight: '700', color: SOFT },
  worryText: { fontSize: 18, lineHeight: 27, fontWeight: '600', color: INK },

  actions: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionsRight: { flexDirection: 'row', gap: 16 },
  pat: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#f4eefb',
  },
  patOn: { backgroundColor: INK },
  patText: { fontSize: 14, fontWeight: '700', color: INK },
  patTextOn: { color: '#ffffff' },
  subtle: { fontSize: 13, fontWeight: '600', color: SOFT },

  replyCount: { marginTop: 18, marginBottom: 8, fontSize: 13, fontWeight: '800', color: INK },
  empty: { fontSize: 14, color: SOFT },
  reply: { marginBottom: 8, padding: 12, borderRadius: 14, backgroundColor: '#f7f3fc' },
  replyMine: { backgroundColor: '#ece2fa' },
  replyAuthor: { fontSize: 12, fontWeight: '700', color: SOFT },
  replyText: { marginTop: 3, fontSize: 15, lineHeight: 21, color: INK },

  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f4eefb',
    fontSize: 15,
    color: INK,
  },
  send: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: INK },
  sendOff: { opacity: 0.35 },
  sendText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },

  chips: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, backgroundColor: '#f4eefb' },
  chipOn: { backgroundColor: INK },
  chipText: { fontSize: 14, fontWeight: '700', color: INK },
  chipTextOn: { color: '#ffffff' },
  textarea: {
    minHeight: 110,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#f4eefb',
    fontSize: 16,
    lineHeight: 23,
    color: INK,
    textAlignVertical: 'top',
  },
  counter: { marginTop: -6, textAlign: 'right', fontSize: 12, color: SOFT },
  error: { fontSize: 13, fontWeight: '700', color: '#c0392b' },

  help: { gap: 4, padding: 14, borderRadius: 16, backgroundColor: '#fff6e0', marginTop: 12 },
  helpTitle: { marginBottom: 4, fontSize: 14, fontWeight: '800', color: '#5a4310' },
  helpLine: { fontSize: 14, color: '#5a4310' },
  helpNumber: { fontWeight: '800' },
  rules: { fontSize: 14, lineHeight: 21, color: SOFT },
});
