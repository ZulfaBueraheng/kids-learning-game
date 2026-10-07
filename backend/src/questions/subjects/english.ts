// 🔤 English — letters, phonics, vocabulary, spelling and grammar (K1 → P4).
import { bankGenerator, type BankItem } from '../bank.js';
import type { Generator } from '../kit.js';
import { pick, randInt, shuffle, type Rng } from '../random.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface Word {
  emoji: string;
  word: string;
  th: string;
}

/** Picture words grouped from easy (animals) to harder (body & nature). */
export const WORDS: Record<'animals' | 'food' | 'colors' | 'things' | 'nature', Word[]> = {
  animals: [
    { emoji: '🐱', word: 'cat', th: 'แมว' },
    { emoji: '🐶', word: 'dog', th: 'สุนัข' },
    { emoji: '🐦', word: 'bird', th: 'นก' },
    { emoji: '🐟', word: 'fish', th: 'ปลา' },
    { emoji: '🐄', word: 'cow', th: 'วัว' },
    { emoji: '🐷', word: 'pig', th: 'หมู' },
    { emoji: '🦆', word: 'duck', th: 'เป็ด' },
    { emoji: '🐴', word: 'horse', th: 'ม้า' },
    { emoji: '🐰', word: 'rabbit', th: 'กระต่าย' },
    { emoji: '🐘', word: 'elephant', th: 'ช้าง' },
    { emoji: '🐒', word: 'monkey', th: 'ลิง' },
    { emoji: '🦁', word: 'lion', th: 'สิงโต' },
    { emoji: '🐸', word: 'frog', th: 'กบ' },
    { emoji: '🐯', word: 'tiger', th: 'เสือ' },
    { emoji: '🐻', word: 'bear', th: 'หมี' },
    { emoji: '🐔', word: 'chicken', th: 'ไก่' },
    { emoji: '🐍', word: 'snake', th: 'งู' },
  ],
  food: [
    { emoji: '🍎', word: 'apple', th: 'แอปเปิล' },
    { emoji: '🍌', word: 'banana', th: 'กล้วย' },
    { emoji: '🍇', word: 'grapes', th: 'องุ่น' },
    { emoji: '🥚', word: 'egg', th: 'ไข่' },
    { emoji: '🍞', word: 'bread', th: 'ขนมปัง' },
    { emoji: '🥛', word: 'milk', th: 'นม' },
    { emoji: '🍚', word: 'rice', th: 'ข้าว' },
    { emoji: '🍰', word: 'cake', th: 'เค้ก' },
    { emoji: '🥕', word: 'carrot', th: 'แครอท' },
    { emoji: '🍊', word: 'orange', th: 'ส้ม' },
    { emoji: '🍉', word: 'watermelon', th: 'แตงโม' },
    { emoji: '🧀', word: 'cheese', th: 'ชีส' },
    { emoji: '🍕', word: 'pizza', th: 'พิซซ่า' },
    { emoji: '🍪', word: 'cookie', th: 'คุกกี้' },
  ],
  colors: [
    { emoji: '🟥', word: 'red', th: 'สีแดง' },
    { emoji: '🟦', word: 'blue', th: 'สีน้ำเงิน' },
    { emoji: '🟩', word: 'green', th: 'สีเขียว' },
    { emoji: '🟨', word: 'yellow', th: 'สีเหลือง' },
    { emoji: '🟪', word: 'purple', th: 'สีม่วง' },
    { emoji: '⬛', word: 'black', th: 'สีดำ' },
    { emoji: '⬜', word: 'white', th: 'สีขาว' },
    { emoji: '🟫', word: 'brown', th: 'สีน้ำตาล' },
    { emoji: '🩷', word: 'pink', th: 'สีชมพู' },
    { emoji: '🩶', word: 'grey', th: 'สีเทา' },
  ],
  things: [
    { emoji: '📖', word: 'book', th: 'หนังสือ' },
    { emoji: '🖊️', word: 'pen', th: 'ปากกา' },
    { emoji: '🎒', word: 'bag', th: 'กระเป๋า' },
    { emoji: '🪑', word: 'chair', th: 'เก้าอี้' },
    { emoji: '🚗', word: 'car', th: 'รถยนต์' },
    { emoji: '🚌', word: 'bus', th: 'รถบัส' },
    { emoji: '⚽', word: 'ball', th: 'ลูกบอล' },
    { emoji: '⏰', word: 'clock', th: 'นาฬิกา' },
    { emoji: '🏠', word: 'house', th: 'บ้าน' },
    { emoji: '✏️', word: 'pencil', th: 'ดินสอ' },
    { emoji: '📱', word: 'phone', th: 'โทรศัพท์' },
    { emoji: '🛏️', word: 'bed', th: 'เตียง' },
    { emoji: '🚲', word: 'bike', th: 'จักรยาน' },
    { emoji: '🔑', word: 'key', th: 'กุญแจ' },
  ],
  nature: [
    { emoji: '☀️', word: 'sun', th: 'ดวงอาทิตย์' },
    { emoji: '🌙', word: 'moon', th: 'ดวงจันทร์' },
    { emoji: '⭐', word: 'star', th: 'ดาว' },
    { emoji: '🌳', word: 'tree', th: 'ต้นไม้' },
    { emoji: '🌸', word: 'flower', th: 'ดอกไม้' },
    { emoji: '🌧️', word: 'rain', th: 'ฝน' },
    { emoji: '👁️', word: 'eye', th: 'ตา' },
    { emoji: '✋', word: 'hand', th: 'มือ' },
    { emoji: '👂', word: 'ear', th: 'หู' },
    { emoji: '🌊', word: 'sea', th: 'ทะเล' },
    { emoji: '⛰️', word: 'mountain', th: 'ภูเขา' },
    { emoji: '🔥', word: 'fire', th: 'ไฟ' },
    { emoji: '☁️', word: 'cloud', th: 'เมฆ' },
    { emoji: '🦶', word: 'foot', th: 'เท้า' },
  ],
};

const ALL_WORDS = Object.values(WORDS).flat();
const CATEGORY_BY_DIFFICULTY = ['animals', 'food', 'colors', 'things', 'nature'] as const;

function options(rng: Rng, answer: string, pool: string[]): string[] {
  const wrong = shuffle(rng, [...new Set(pool)].filter((p) => p !== answer)).slice(0, 3);
  return shuffle(rng, [answer, ...wrong]);
}

const letters: Generator = (rng, d) => {
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const L = pick(rng, 'ACEFHKMRSTXZ'.split(''));
      return {
        prompt: 'ตัวพิมพ์เล็กของตัวอักษรนี้คือข้อใด?',
        expression: L,
        options: options(rng, L.toLowerCase(), shuffle(rng, ALPHABET).map((x) => x.toLowerCase())),
        answer: L.toLowerCase(),
        hint: 'ตัวพิมพ์ใหญ่และพิมพ์เล็กออกเสียงเหมือนกัน',
      };
    }
    case 2: {
      const L = pick(rng, ALPHABET);
      return {
        prompt: 'ตัวพิมพ์ใหญ่ของตัวอักษรนี้คือข้อใด?',
        expression: L.toLowerCase(),
        options: options(rng, L, shuffle(rng, ALPHABET)),
        answer: L,
        hint: 'ลองร้องเพลง A B C แล้วหาตัวที่ออกเสียงเหมือนกัน',
      };
    }
    case 3: {
      // Letters children mix up
      const set = pick(rng, [['b', 'd', 'p', 'q'], ['m', 'n', 'w', 'u'], ['i', 'l', 'j', 't']]);
      const target = pick(rng, set);
      return {
        prompt: `ตัวไหนคือตัว "${target.toUpperCase()}" แบบพิมพ์เล็ก?`,
        options: shuffle(rng, set),
        answer: target,
        hint: 'ดูทิศทางของหัวและหางของตัวอักษรให้ดี',
      };
    }
    default: {
      const after = d === 4;
      const i = after ? randInt(rng, 0, 24) : randInt(rng, 1, 25);
      const answer = ALPHABET[after ? i + 1 : i - 1];
      return {
        prompt: after ? 'ตัวอักษรที่อยู่ถัดไปคือ?' : 'ตัวอักษรที่อยู่ก่อนหน้าคือ?',
        expression: after ? `${ALPHABET[i]} → ?` : `? → ${ALPHABET[i]}`,
        options: options(rng, answer, ALPHABET.slice(Math.max(0, i - 3), i + 4)),
        answer,
        hint: 'ร้องเพลง A B C D … ช้า ๆ แล้วหยุดที่ตัวอักษรนั้น',
      };
    }
  }
};

const phonics: Generator = (rng, d) => {
  const w = pick(rng, ALL_WORDS);
  const first = w.word[0].toUpperCase();
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1:
    case 2:
      return {
        prompt: `คำว่า "${w.word}" ขึ้นต้นด้วยตัวอักษรอะไร?`,
        expression: d === 1 ? `${w.emoji} ${w.word}` : w.emoji,
        options: options(rng, first, ALPHABET),
        answer: first,
        hint: `ออกเสียงช้า ๆ: ${w.word} — เสียงแรกคือเสียงอะไร?`,
      };
    case 3:
      return {
        prompt: 'ภาพนี้ขึ้นต้นด้วยตัวอักษรอะไร? (ภาษาอังกฤษ)',
        expression: w.emoji,
        options: options(rng, first, ALPHABET),
        answer: first,
        hint: `ภาพนี้ภาษาอังกฤษเรียกว่า ${w.word.replace(/./g, (c, i) => (i === 0 ? '_' : c))}`,
      };
    case 4: {
      const same = ALL_WORDS.filter((x) => x.word[0] === w.word[0] && x.word !== w.word);
      if (!same.length) return phonics(rng, 3, { theme: 'GENERAL' });
      const answer = pick(rng, same).word;
      const pool = ALL_WORDS.filter((x) => x.word[0] !== w.word[0]).map((x) => x.word);
      return {
        prompt: `คำไหนขึ้นต้นด้วยเสียงเดียวกับ "${w.word}"?`,
        expression: w.emoji,
        options: options(rng, answer, pool),
        answer,
        hint: `"${w.word}" ขึ้นต้นด้วย ${first}`,
      };
    }
    default: {
      const last = w.word[w.word.length - 1].toUpperCase();
      return {
        prompt: `คำว่า "${w.word}" ลงท้ายด้วยตัวอักษรอะไร?`,
        expression: w.emoji,
        options: options(rng, last, ALPHABET),
        answer: last,
        hint: 'ออกเสียงคำให้จบ แล้วฟังเสียงสุดท้าย',
      };
    }
  }
};

const vocabPicture: Generator = (rng, d) => {
  const list = WORDS[CATEGORY_BY_DIFFICULTY[Math.min(Math.max(d, 1), 5) - 1]];
  const w = pick(rng, list);
  return {
    prompt: 'ภาพนี้ภาษาอังกฤษคือคำว่าอะไร?',
    expression: w.emoji,
    options: options(rng, w.word, list.map((x) => x.word)),
    answer: w.word,
    hint: `ภาษาไทยคือ "${w.th}"`,
  };
};

const VERBS_ADJ: Word[] = [
  { emoji: '🏃', word: 'run', th: 'วิ่ง' },
  { emoji: '🍽️', word: 'eat', th: 'กิน' },
  { emoji: '😴', word: 'sleep', th: 'นอน' },
  { emoji: '🏊', word: 'swim', th: 'ว่ายน้ำ' },
  { emoji: '📖', word: 'read', th: 'อ่าน' },
  { emoji: '✍️', word: 'write', th: 'เขียน' },
  { emoji: '🎤', word: 'sing', th: 'ร้องเพลง' },
  { emoji: '🐘', word: 'big', th: 'ใหญ่' },
  { emoji: '🐜', word: 'small', th: 'เล็ก' },
  { emoji: '🔥', word: 'hot', th: 'ร้อน' },
  { emoji: '❄️', word: 'cold', th: 'หนาว' },
  { emoji: '😊', word: 'happy', th: 'มีความสุข' },
  { emoji: '😢', word: 'sad', th: 'เศร้า' },
  { emoji: '⚡', word: 'fast', th: 'เร็ว' },
  { emoji: '🐢', word: 'slow', th: 'ช้า' },
];

const vocabThai: Generator = (rng, d) => {
  const list = d <= 2 ? ALL_WORDS : VERBS_ADJ;
  const w = pick(rng, list);
  if (d <= 2 || d === 4) {
    return {
      prompt: `"${w.word}" แปลว่าอะไร?`,
      expression: w.word,
      options: options(rng, w.th, list.map((x) => x.th)),
      answer: w.th,
      hint: `ลองนึกภาพ ${w.emoji}`,
    };
  }
  return {
    prompt: `"${w.th}" ภาษาอังกฤษคือคำว่าอะไร?`,
    expression: w.th,
    options: options(rng, w.word, list.map((x) => x.word)),
    answer: w.word,
    hint: d >= 5 ? 'ลองนึกถึงประโยคที่ใช้คำนี้' : `ลองนึกภาพ ${w.emoji}`,
  };
};

/** Misspellings children make: swapped neighbours, doubled or dropped letters, a wrong vowel. */
export function misspellings(rng: Rng, word: string): string[] {
  const out = new Set<string>();
  const vowels = 'aeiou';
  for (let tries = 0; out.size < 3 && tries < 50; tries++) {
    const i = randInt(rng, 0, word.length - 1);
    let w = word;
    switch (randInt(rng, 0, 3)) {
      case 0:
        if (i < word.length - 1) w = word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
        break;
      case 1:
        w = word.slice(0, i) + word[i] + word.slice(i);
        break;
      case 2:
        if (word.length > 3) w = word.slice(0, i) + word.slice(i + 1);
        break;
      default: {
        const v = [...word].findIndex((c, k) => k >= i && vowels.includes(c));
        if (v >= 0) w = word.slice(0, v) + pick(rng, [...vowels].filter((x) => x !== word[v])) + word.slice(v + 1);
      }
    }
    if (w !== word) out.add(w);
  }
  return [...out];
}

const spelling: Generator = (rng, d) => {
  const pool = d === 1 ? ALL_WORDS.filter((w) => w.word.length === 3) : d === 2 ? ALL_WORDS.filter((w) => w.word.length === 4) : ALL_WORDS.filter((w) => w.word.length >= 5);
  const w = pick(rng, pool.length ? pool : ALL_WORDS);
  if (d <= 3) {
    const i = randInt(rng, 0, w.word.length - 1);
    const missing = w.word[i];
    const masked = [...w.word].map((c, k) => (k === i ? '_' : c)).join(' ');
    const letterPool = 'aeioubcdgmnprst'.split('');
    return {
      prompt: 'ตัวอักษรใดหายไป?',
      expression: `${w.emoji}  ${masked}`,
      options: options(rng, missing, letterPool),
      answer: missing,
      hint: `ภาษาไทยคือ "${w.th}" ลองสะกดทีละตัว`,
    };
  }
  return {
    prompt: 'ข้อใดสะกดถูกต้อง?',
    expression: w.emoji,
    options: shuffle(rng, [w.word, ...misspellings(rng, w.word)]),
    answer: w.word,
    hint: `ภาษาไทยคือ "${w.th}"`,
  };
};

const GRAMMAR: BankItem[] = [
  { d: 1, prompt: 'เลือกคำที่ถูกต้อง', expression: 'I ___ a student.', answer: 'am', distractors: ['is', 'are', 'be'], hint: 'I ใช้คู่กับ am' },
  { d: 1, prompt: 'เลือกคำที่ถูกต้อง', expression: 'She ___ happy.', answer: 'is', distractors: ['am', 'are', 'be'], hint: 'He / She / It ใช้ is' },
  { d: 1, prompt: 'เลือกคำที่ถูกต้อง', expression: 'They ___ friends.', answer: 'are', distractors: ['is', 'am', 'be'], hint: 'We / You / They ใช้ are' },
  { d: 1, prompt: 'เลือกคำที่ถูกต้อง', expression: 'It ___ a dog.', answer: 'is', distractors: ['am', 'are', 'be'], hint: 'He / She / It ใช้ is' },
  { d: 2, prompt: 'เติมคำพหูพจน์ให้ถูก', expression: 'one cat, two ___', answer: 'cats', distractors: ['cat', 'cates', 'caties'], hint: 'ส่วนใหญ่เติม s เมื่อมีมากกว่าหนึ่ง' },
  { d: 2, prompt: 'เติมคำพหูพจน์ให้ถูก', expression: 'one box, two ___', answer: 'boxes', distractors: ['boxs', 'box', 'boxies'], hint: 'คำที่ลงท้ายด้วย x, s, ch, sh เติม es' },
  { d: 2, prompt: 'เติมคำพหูพจน์ให้ถูก', expression: 'one baby, two ___', answer: 'babies', distractors: ['babys', 'babyes', 'baby'], hint: 'พยัญชนะ + y เปลี่ยน y เป็น i แล้วเติม es' },
  { d: 3, prompt: 'เติมคำพหูพจน์ให้ถูก', expression: 'one child, two ___', answer: 'children', distractors: ['childs', 'childes', 'childrens'], hint: 'child เป็นคำพิเศษ ไม่เติม s' },
  { d: 3, prompt: 'เลือกคำที่ถูกต้อง', expression: 'She ___ a red bag.', answer: 'has', distractors: ['have', 'haves', 'having'], hint: 'He / She / It ใช้ has' },
  { d: 3, prompt: 'เลือกคำที่ถูกต้อง', expression: 'I ___ two brothers.', answer: 'have', distractors: ['has', 'haves', 'is'], hint: 'I / You / We / They ใช้ have' },
  { d: 3, prompt: 'เลือกคำที่ถูกต้อง', expression: 'The cat ___ four legs.', answer: 'has', distractors: ['have', 'are', 'am'], hint: 'The cat = It ใช้ has' },
  { d: 4, prompt: 'เลือก a หรือ an', expression: '___ apple', answer: 'an', distractors: ['a', 'the a', 'two'], hint: 'คำที่ขึ้นต้นด้วยเสียงสระ (a e i o u) ใช้ an' },
  { d: 4, prompt: 'เลือก a หรือ an', expression: '___ banana', answer: 'a', distractors: ['an', 'two', 'many'], hint: 'คำที่ขึ้นต้นด้วยเสียงพยัญชนะใช้ a' },
  { d: 4, prompt: 'เลือก a หรือ an', expression: '___ umbrella', answer: 'an', distractors: ['a', 'two', 'many'], hint: 'umbrella ขึ้นต้นด้วยเสียงสระ' },
  { d: 4, prompt: 'เลือก a หรือ an', expression: '___ dog', answer: 'a', distractors: ['an', 'many', 'two'], hint: 'dog ขึ้นต้นด้วยเสียงพยัญชนะ' },
  { d: 5, prompt: 'เลือกคำที่ถูกต้อง', expression: 'He ___ to school every day.', answer: 'goes', distractors: ['go', 'going', 'went to'], hint: 'ทำเป็นประจำ + He/She/It → กริยาเติม s/es' },
  { d: 5, prompt: 'เลือกคำที่ถูกต้อง', expression: 'Yesterday I ___ football.', answer: 'played', distractors: ['play', 'plays', 'playing'], hint: 'Yesterday = อดีต ใช้กริยาช่อง 2' },
  { d: 5, prompt: 'เลือกคำที่ถูกต้อง', expression: 'Last night we ___ pizza.', answer: 'ate', distractors: ['eat', 'eats', 'eated'], hint: 'eat ช่อง 2 คือ ate (ไม่เติม ed)' },
  { d: 5, prompt: 'เลือกคำที่ถูกต้อง', expression: 'She ___ TV every evening.', answer: 'watches', distractors: ['watch', 'watchs', 'watched'], hint: 'คำที่ลงท้ายด้วย ch เติม es' },
  { d: 1, prompt: 'เลือกคำที่ถูกต้อง', expression: 'We ___ happy.', answer: 'are', distractors: ['is', 'am', 'be'], hint: 'We ใช้ are' },
  { d: 1, prompt: 'เลือกคำที่ถูกต้อง', expression: 'He ___ my brother.', answer: 'is', distractors: ['are', 'am', 'be'], hint: 'He ใช้ is' },
  { d: 2, prompt: 'เติมคำพหูพจน์ให้ถูก', expression: 'one bus, two ___', answer: 'buses', distractors: ['buss', 'bus', 'busies'], hint: 'ลงท้ายด้วย s เติม es' },
  { d: 2, prompt: 'เติมคำพหูพจน์ให้ถูก', expression: 'one mouse, two ___', answer: 'mice', distractors: ['mouses', 'mices', 'mouse'], hint: 'mouse เป็นคำพิเศษ' },
  { d: 3, prompt: 'เลือกคำที่ถูกต้อง', expression: 'This is ___ book. (ของฉัน)', answer: 'my', distractors: ['I', 'me', 'mine'], hint: 'คำแสดงความเป็นเจ้าของหน้าคำนาม ใช้ my' },
  { d: 3, prompt: 'เลือกคำที่ถูกต้อง', expression: '___ are my friends. (พวกเขา)', answer: 'They', distractors: ['Them', 'Their', 'He'], hint: 'ประธานพหูพจน์ ใช้ They' },
  { d: 4, prompt: 'เลือกคำที่ถูกต้อง', expression: 'There ___ three cats on the sofa.', answer: 'are', distractors: ['is', 'am', 'be'], hint: 'มีหลายตัว (three cats) ใช้ are' },
  { d: 4, prompt: 'เลือกคำที่ถูกต้อง', expression: 'An elephant is ___ than a dog.', answer: 'bigger', distractors: ['big', 'biggest', 'more big'], hint: 'เปรียบเทียบ 2 สิ่ง เติม -er (big → bigger)' },
  { d: 5, prompt: 'เลือกคำที่ถูกต้อง', expression: 'Mount Everest is the ___ mountain in the world.', answer: 'highest', distractors: ['higher', 'high', 'most high'], hint: 'ที่สุดในกลุ่ม ใช้ the + -est' },
  { d: 5, prompt: 'เลือกคำที่ถูกต้อง', expression: 'She doesn\'t ___ coffee.', answer: 'like', distractors: ['likes', 'liked', 'liking'], hint: "หลัง doesn't ใช้กริยาช่อง 1 ไม่เติม s" },
];

export const ENGLISH_GENERATORS: Record<string, Generator> = {
  EN_LETTERS: letters,
  EN_PHONICS: phonics,
  EN_VOCAB_PICTURE: vocabPicture,
  EN_VOCAB_MEANING: vocabThai,
  EN_SPELLING: spelling,
  EN_GRAMMAR: bankGenerator(GRAMMAR),
};
