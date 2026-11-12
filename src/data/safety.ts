// 공개방에 글을 남기기 전에 거치는 최소한의 안전장치.
// 단어 목록 방식이라 우회가 쉽다. 서버가 붙으면 서버에서도 한 번 더 걸러야 한다.

const BAD_WORDS = [
  '씨발',
  '시발',
  'ㅅㅂ',
  'ㅆㅂ',
  '병신',
  'ㅂㅅ',
  '좆',
  '개새끼',
  '새끼',
  '지랄',
  'ㅈㄹ',
  '닥쳐',
  '꺼져',
  '미친놈',
  '미친년',
  'fuck',
  'shit',
];

const CRISIS_WORDS = [
  '자살',
  '죽고싶',
  '죽어버리',
  '죽을래',
  '자해',
  '사라지고싶',
  '극단적선택',
  '살기싫',
];

function squash(text: string) {
  return text.toLowerCase().replace(/[\s.,!?~\-_*·]/g, '');
}

export function hasBadWords(text: string): boolean {
  const t = squash(text);
  return BAD_WORDS.some((word) => t.includes(word));
}

/** 위험 신호가 보이는 글인지. 막지는 않고 도움받을 곳을 함께 보여주는 데 쓴다 */
export function looksLikeCrisis(text: string): boolean {
  const t = squash(text);
  return CRISIS_WORDS.some((word) => t.includes(word));
}

export const HELPLINES: { name: string; number: string; note: string }[] = [
  { name: '자살예방상담전화', number: '109', note: '24시간' },
  { name: '청소년상담전화', number: '1388', note: '24시간' },
  { name: '정신건강위기상담전화', number: '1577-0199', note: '24시간' },
];
