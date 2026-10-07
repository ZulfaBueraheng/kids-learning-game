import { pick, randInt, shuffle, type Rng } from './random.js';
import { level, numericOptions, thaiNumberWord, toThaiDigits, type GeneratedQuestion, type Generator, type QuestionVisual } from './kit.js';
import { DEFAULT_CONTEXT, themePack, type QuestionContext } from './themes.js';
import { PHASE2_GENERATORS } from './generators.phase2.js';
import { PHASE3_GENERATORS } from './generators.phase3.js';
import { MEASUREMENT_GENERATORS } from './generators.measurement.js';
import { ENGLISH_GENERATORS } from './subjects/english.js';
import { LOGIC_GENERATORS } from './subjects/logic.js';
import { READING_GENERATORS } from './subjects/reading.js';
import { SCIENCE_GENERATORS } from './subjects/science.js';
import { ENGLISH_ADVANCED_GENERATORS } from './subjects/english-advanced.js';
import { LOGIC_ADVANCED_GENERATORS } from './subjects/logic-advanced.js';
import { READING_ADVANCED_GENERATORS } from './subjects/reading-advanced.js';
import { SCIENCE_ADVANCED_GENERATORS } from './subjects/science-advanced.js';

export { numericOptions, thaiNumberWord, toThaiDigits } from './kit.js';
export type { GeneratedQuestion, QuestionVisual } from './kit.js';

// ───────────── Number Sense ─────────────

const numberRecognition: Generator = (rng, d) => {
  if (d === 4) {
    const n = randInt(rng, 1, 20);
    return {
      prompt: 'เลขไทยนี้คือเลขอะไร?',
      expression: toThaiDigits(n),
      options: numericOptions(rng, n, 1),
      answer: String(n),
      hint: 'เทียบเลขไทยกับเลขอารบิก: ๑=1 ๒=2 ๓=3 ๔=4 ๕=5 ๖=6 ๗=7 ๘=8 ๙=9 ๐=0',
    };
  }
  const [min, max] = level(d, [[1, 5], [1, 10], [0, 20], [1, 20], [10, 99]] as const);
  const n = randInt(rng, min, max);
  return {
    prompt: 'เลขไหนอ่านว่า…',
    expression: thaiNumberWord(n),
    options: numericOptions(rng, n),
    answer: String(n),
    hint: 'ลองนับนิ้วทีละนิ้ว แล้วออกเสียงตามดูนะ',
  };
};

const counting: Generator = (rng, d, ctx) => {
  const [min, max] = level(d, [[1, 5], [1, 10], [5, 15], [10, 20], [15, 30]] as const);
  const n = randInt(rng, min, max);
  const thing = pick(rng, themePack(ctx).things);
  return {
    prompt: `มี${thing.name}กี่${thing.unit}?`,
    visual: { kind: 'objects', emoji: thing.emoji, count: n },
    options: numericOptions(rng, n, 1),
    answer: String(n),
    hint: 'แตะแต่ละอันทีละอัน แล้วนับไปพร้อมกัน',
  };
};

const quantity: Generator = (rng, d, ctx) => {
  const [maxN, minGap] = level(d, [[5, 3], [8, 2], [10, 2], [12, 1], [15, 1]] as const);
  const allowEqual = d >= 4;
  const askMore = d < 3 || rng() < 0.5;
  let a = randInt(rng, 1, maxN);
  let b = randInt(rng, 1, maxN);
  if (allowEqual && rng() < 0.25) b = a;
  else
    while (Math.abs(a - b) < minGap) {
      a = randInt(rng, 1, maxN);
      b = randInt(rng, 1, maxN);
    }
  const thing = pick(rng, themePack(ctx).things);
  const answer = a === b ? 'เท่ากัน' : (a > b) === askMore ? 'กลุ่ม A' : 'กลุ่ม B';
  const options = ['กลุ่ม A', 'กลุ่ม B', ...(allowEqual ? ['เท่ากัน'] : [])];
  return {
    prompt: askMore ? 'กลุ่มไหนมีมากกว่า?' : 'กลุ่มไหนมีน้อยกว่า?',
    visual: {
      kind: 'groups',
      groups: [
        { label: 'A', emoji: thing.emoji, count: a },
        { label: 'B', emoji: thing.emoji, count: b },
      ],
    },
    options,
    answer,
    hint: 'ลองจับคู่ของกลุ่ม A กับกลุ่ม B ทีละคู่ กลุ่มไหนเหลือ แปลว่ามีมากกว่า',
  };
};

const comparing: Generator = (rng, d) => {
  if (d <= 2) {
    const max = d === 1 ? 10 : 30;
    const a = randInt(rng, 0, max);
    let b = randInt(rng, 0, max);
    while (b === a) b = randInt(rng, 0, max);
    return {
      prompt: 'เลขไหนมากกว่า?',
      options: shuffle(rng, [String(a), String(b)]),
      answer: String(Math.max(a, b)),
      hint: 'นึกถึงเส้นจำนวน เลขที่อยู่ทางขวามีค่ามากกว่า',
    };
  }
  if (d <= 4) {
    const max = d === 3 ? 10 : 99;
    const a = randInt(rng, 0, max);
    const b = rng() < 0.2 ? a : randInt(rng, 0, max);
    return {
      prompt: 'เติมเครื่องหมายให้ถูกต้อง',
      expression: `${a}  ?  ${b}`,
      options: ['>', '<', '='],
      answer: a > b ? '>' : a < b ? '<' : '=',
      hint: 'ปากจระเข้ > < จะอ้าหาเลขที่มากกว่าเสมอ',
    };
  }
  const nums = new Set<number>();
  while (nums.size < 4) nums.add(randInt(rng, 10, 99));
  const list = [...nums];
  return {
    prompt: 'เลขไหนมากที่สุด?',
    options: list.map(String),
    answer: String(Math.max(...list)),
    hint: 'ดูหลักสิบก่อน ถ้าหลักสิบเท่ากันค่อยดูหลักหน่วย',
  };
};

const placeValue: Generator = (rng, d) => {
  const n = randInt(rng, 11, 99);
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const hint = `${n} = ${tens} สิบ กับ ${ones} หน่วย`;
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1:
      return { prompt: `เลข ${n} มีกี่สิบ?`, options: numericOptions(rng, tens), answer: String(tens), hint };
    case 2:
      return { prompt: `เลข ${n} มีกี่หน่วย?`, options: numericOptions(rng, ones), answer: String(ones), hint };
    case 3:
      return {
        prompt: `${tens} สิบ กับ ${ones} หน่วย คือเลขอะไร?`,
        options: numericOptions(rng, n, 10),
        answer: String(n),
        hint: 'เขียนจำนวนสิบไว้ข้างหน้า แล้วตามด้วยจำนวนหน่วย',
      };
    case 4: {
      const value = tens * 10;
      const options = shuffle(rng, [value, tens, ones, ones * 10, n].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4));
      return {
        prompt: `เลข ${tens} ใน ${n} มีค่าเท่าไร?`,
        options: options.map(String),
        answer: String(value),
        hint: `เลข ${tens} อยู่หลักสิบ จึงมีค่า ${tens} × 10`,
      };
    }
    default:
      return {
        prompt: 'เท่ากับเลขอะไร?',
        expression: `${tens * 10} + ${ones} = ?`,
        options: numericOptions(rng, n, 10),
        answer: String(n),
        hint,
      };
  }
};

// ───────────── Addition / Subtraction ─────────────

function missingPart(rng: Rng, op: '+' | '-', a: number, b: number, hint: string): GeneratedQuestion {
  const result = op === '+' ? a + b : a - b;
  return {
    prompt: 'เลขอะไรหายไป?',
    expression: `${a} ${op} ? = ${result}`,
    options: numericOptions(rng, b),
    answer: String(b),
    hint,
  };
}

function equation(rng: Rng, op: '+' | '-', a: number, b: number, hint: string, visual?: QuestionVisual): GeneratedQuestion {
  const result = op === '+' ? a + b : a - b;
  return {
    prompt: op === '+' ? 'รวมกันได้เท่าไร?' : 'เหลือเท่าไร?',
    expression: `${a} ${op} ${b} = ?`,
    visual,
    options: numericOptions(rng, result),
    answer: String(result),
    hint,
  };
}

const addSingle: Generator = (rng, d, ctx) => {
  const hint = 'เริ่มจากเลขที่มากกว่า แล้วนับต่อไปอีกทีละหนึ่ง';
  if (d >= 5) {
    const a = randInt(rng, 1, 9);
    return missingPart(rng, '+', a, randInt(rng, 1, 9), 'ลองนับต่อจากเลขแรกจนถึงผลลัพธ์ นับได้กี่ครั้งคือคำตอบ');
  }
  const maxSum = level(d, [5, 10, 10, 18] as const);
  const a = randInt(rng, 1, Math.min(9, maxSum - 1));
  const b = randInt(rng, 1, Math.min(9, maxSum - a));
  const visual = d <= 2 ? ({ kind: 'addition', emoji: pick(rng, themePack(ctx).things).emoji, a, b } as const) : undefined;
  return equation(rng, '+', a, b, hint, visual);
};

const subSingle: Generator = (rng, d, ctx) => {
  const hint = 'ลองนับถอยหลังจากเลขแรก';
  if (d >= 5) {
    const a = randInt(rng, 5, 18);
    return missingPart(rng, '-', a, randInt(rng, 1, Math.min(9, a)), 'ผลลัพธ์บวกกับเลขที่หายไป ต้องได้เลขตัวแรก');
  }
  const [minA, maxA] = level(d, [[2, 5], [3, 10], [3, 10], [11, 18]] as const);
  const a = randInt(rng, minA, maxA);
  const b = d === 4 ? randInt(rng, a - 9, 9) : randInt(rng, 1, a);
  const visual = d <= 2 ? ({ kind: 'subtraction', emoji: pick(rng, themePack(ctx).things).emoji, total: a, remove: b } as const) : undefined;
  return equation(rng, '-', a, b, hint, visual);
};

/** Two numbers whose digit-wise sum never carries (or always does). */
function addPair(rng: Rng, d: number, carry: boolean): [number, number] {
  for (;;) {
    let a: number;
    let b: number;
    if (d === 1) {
      a = randInt(rng, 11, 89);
      b = randInt(rng, 1, 9);
    } else if (d === 2 && !carry) {
      a = randInt(rng, 1, 8) * 10;
      b = randInt(rng, 1, 9 - a / 10) * 10;
    } else {
      a = randInt(rng, 10, 89);
      b = randInt(rng, 10, 89);
    }
    const carries = (a % 10) + (b % 10) >= 10;
    if (carries === carry && a + b < 100) return [a, b];
  }
}

function subPair(rng: Rng, d: number, borrow: boolean): [number, number] {
  for (;;) {
    const a = randInt(rng, 20, 99);
    const b = d === 1 ? randInt(rng, 1, 9) : d === 2 && !borrow ? randInt(rng, 1, Math.floor(a / 10)) * 10 : randInt(rng, 10, a);
    const borrows = a % 10 < b % 10;
    if (borrows === borrow && b <= a) return [a, b];
  }
}

const addDouble: Generator = (rng, d) => {
  const [a, b] = addPair(rng, d, false);
  if (d >= 5) return missingPart(rng, '+', a, b, 'คิดทีละหลัก: หน่วยกับหน่วย สิบกับสิบ');
  return equation(rng, '+', a, b, 'บวกหลักหน่วยก่อน แล้วค่อยบวกหลักสิบ');
};

const subDouble: Generator = (rng, d) => {
  const [a, b] = subPair(rng, d, false);
  if (d >= 5) return missingPart(rng, '-', a, b, 'คิดทีละหลัก: หน่วยลบหน่วย สิบลบสิบ');
  return equation(rng, '-', a, b, 'ลบหลักหน่วยก่อน แล้วค่อยลบหลักสิบ');
};

const addCarry: Generator = (rng, d) => {
  const [a, b] = addPair(rng, Math.min(d, 3), true);
  if (d >= 5) return missingPart(rng, '+', a, b, 'คิดทีละหลัก และอย่าลืมทด 1 ไปหลักสิบ');
  return equation(rng, '+', a, b, 'หลักหน่วยรวมกันเกิน 9 ให้ทด 1 ไปหลักสิบ');
};

const subBorrow: Generator = (rng, d) => {
  const [a, b] = subPair(rng, Math.min(d, 3), true);
  if (d >= 5) return missingPart(rng, '-', a, b, 'ผลลัพธ์บวกกับเลขที่หายไป ต้องได้เลขตัวแรก');
  return equation(rng, '-', a, b, 'หลักหน่วยลบไม่พอ ให้ยืม 1 สิบจากหลักสิบมาเป็น 10 หน่วย');
};

export const GENERATORS: Record<string, Generator> = {
  NUM_RECOGNITION: numberRecognition,
  COUNTING: counting,
  QUANTITY: quantity,
  COMPARING: comparing,
  PLACE_VALUE: placeValue,
  ADD_SINGLE: addSingle,
  SUB_SINGLE: subSingle,
  ADD_DOUBLE: addDouble,
  SUB_DOUBLE: subDouble,
  ADD_CARRY: addCarry,
  SUB_BORROW: subBorrow,
  ...PHASE2_GENERATORS,
  ...PHASE3_GENERATORS,
  ...MEASUREMENT_GENERATORS,
  ...ENGLISH_GENERATORS,
  ...SCIENCE_GENERATORS,
  ...READING_GENERATORS,
  ...LOGIC_GENERATORS,
  ...ENGLISH_ADVANCED_GENERATORS,
  ...SCIENCE_ADVANCED_GENERATORS,
  ...READING_ADVANCED_GENERATORS,
  ...LOGIC_ADVANCED_GENERATORS,
};

export function generateQuestion(
  skillCode: string,
  difficulty: number,
  rng: Rng = Math.random,
  ctx: QuestionContext = DEFAULT_CONTEXT,
): GeneratedQuestion {
  const generator = GENERATORS[skillCode];
  if (!generator) throw new Error(`No question generator for skill ${skillCode}`);
  return generator(rng, Math.min(Math.max(Math.round(difficulty), 1), 5), ctx);
}
