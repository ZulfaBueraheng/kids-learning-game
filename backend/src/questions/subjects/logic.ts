// 🧩 Logical thinking & problem solving — patterns, odd one out, sequences, analogies, deduction, symbol puzzles (K2 → P6).
import { bankGenerator, type BankItem } from '../bank.js';
import { numericOptions, type Generator } from '../kit.js';
import { pick, randInt, shuffle, type Rng } from '../random.js';

const SHAPES = ['🔴', '🔵', '🟢', '🟡', '🔺', '⭐', '🟪', '🔷'];

function distinct(rng: Rng, n: number, pool: string[]): string[] {
  return shuffle(rng, pool).slice(0, n);
}

const patterns: Generator = (rng, d) => {
  const unitLength = [2, 3, 3, 4, 4][Math.min(Math.max(d, 1), 5) - 1];
  const symbols = distinct(rng, Math.min(unitLength, d >= 4 ? 3 : unitLength), SHAPES);
  // Units by difficulty: AB, AAB/ABB, ABC, AABC / ABCB, ABBC …
  const unit =
    d <= 1
      ? [symbols[0], symbols[1]]
      : d === 2
        ? pick(rng, [[symbols[0], symbols[0], symbols[1]], [symbols[0], symbols[1], symbols[1]]])
        : d === 3
          ? [symbols[0], symbols[1], symbols[2]]
          : pick(rng, [[symbols[0], symbols[0], symbols[1], symbols[2]], [symbols[0], symbols[1], symbols[2], symbols[1]]]);
  const shown = randInt(rng, unit.length + 2, unit.length * 2 + 1);
  const seq = Array.from({ length: shown + 1 }, (_, i) => unit[i % unit.length]);
  const answer = seq[shown];
  const pool = [...new Set([...unit, ...SHAPES])];
  return {
    prompt: 'ตัวถัดไปคืออะไร?',
    expression: `${seq.slice(0, shown).join(' ')} ?`,
    options: shuffle(rng, [answer, ...shuffle(rng, pool.filter((p) => p !== answer)).slice(0, 3)]),
    answer,
    hint: 'หาชุดที่ซ้ำกันไปเรื่อย ๆ แล้วดูว่าชุดถัดไปเริ่มอย่างไร',
  };
};

const GROUPS: { name: string; items: string[] }[] = [
  { name: 'สัตว์', items: ['🐶', '🐱', '🐰', '🐮', '🐷', '🐸'] },
  { name: 'ผลไม้', items: ['🍎', '🍌', '🍇', '🍊', '🍓', '🍉'] },
  { name: 'ยานพาหนะ', items: ['🚗', '🚌', '🚲', '✈️', '🚂', '🚢'] },
  { name: 'เครื่องดนตรี', items: ['🎸', '🎹', '🥁', '🎺', '🎻'] },
  { name: 'เสื้อผ้า', items: ['👕', '👖', '👗', '🧦', '🧢'] },
];
const FLYING = ['🐦', '🦋', '🐝', '🦅', '🦉'];
const SWIMMING = ['🐟', '🐬', '🐙', '🦈', '🐳'];

const oddOneOut: Generator = (rng, d) => {
  if (d >= 5) {
    // Numbers: all even except one (or all multiples of 3 except one)
    const rule = pick(rng, [2, 3, 5]);
    const set = new Set<number>();
    while (set.size < 3) set.add(rule * randInt(rng, 1, 12));
    let odd = randInt(rng, 1, 40);
    while (odd % rule === 0) odd = randInt(rng, 1, 40);
    const items = [...set].map(String);
    return {
      prompt: 'จำนวนไหนไม่เข้าพวก?',
      options: shuffle(rng, [...items, String(odd)]),
      answer: String(odd),
      hint: `จำนวนอื่น ๆ หารด้วย ${rule} ลงตัว`,
    };
  }
  let same: string[];
  let other: string;
  let why: string;
  if (d >= 3) {
    const flyIsMain = rng() < 0.5;
    same = distinct(rng, 3, flyIsMain ? FLYING : SWIMMING);
    other = pick(rng, flyIsMain ? SWIMMING : FLYING);
    why = flyIsMain ? 'สัตว์ส่วนใหญ่บินได้' : 'สัตว์ส่วนใหญ่อยู่ในน้ำ';
  } else {
    const [main, rest] = distinct(rng, 2, GROUPS.map((g) => g.name)).map((n) => GROUPS.find((g) => g.name === n)!);
    same = distinct(rng, 3, main.items);
    other = pick(rng, rest.items);
    why = `อีกสามอย่างเป็น${main.name}`;
  }
  return {
    prompt: 'สิ่งไหนไม่เข้าพวก?',
    options: shuffle(rng, [...same, other]),
    answer: other,
    hint: why,
  };
};

const DAYS = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
const MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

const sequence: Generator = (rng, d) => {
  const ring = (list: string[], i: number) => list[((i % list.length) + list.length) % list.length];
  const near = (list: string[], i: number) => [-2, -1, 1, 2, 3].map((k) => ring(list, i + k));
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const i = randInt(rng, 0, 6);
      const answer = ring(DAYS, i + 1);
      return { prompt: `วันถัดจาก${DAYS[i]}คือวันอะไร?`, options: shuffle(rng, [answer, ...near(DAYS, i).filter((x) => x !== answer).slice(0, 3)]), answer, hint: 'อาทิตย์ จันทร์ อังคาร พุธ พฤหัสบดี ศุกร์ เสาร์' };
    }
    case 2: {
      const i = randInt(rng, 0, 6);
      const answer = ring(DAYS, i - 1);
      return { prompt: `วันก่อน${DAYS[i]}คือวันอะไร?`, options: shuffle(rng, [answer, ...near(DAYS, i).filter((x) => x !== answer).slice(0, 3)]), answer, hint: 'นับถอยหลังทีละวัน' };
    }
    case 3: {
      const i = randInt(rng, 0, 11);
      const answer = ring(MONTHS, i + 1);
      return { prompt: `เดือนถัดจากเดือน${MONTHS[i]}คือเดือนอะไร?`, options: shuffle(rng, [answer, ...near(MONTHS, i).filter((x) => x !== answer).slice(0, 3)]), answer, hint: 'มกรา กุมภา มีนา เมษา …' };
    }
    default: {
      const i = randInt(rng, 0, 6);
      const k = d === 4 ? randInt(rng, 2, 5) : randInt(rng, 8, 20);
      const answer = ring(DAYS, i + k);
      const pool = [ring(DAYS, i + k - 1), ring(DAYS, i + k + 1), ring(DAYS, i + k + 2), ring(DAYS, i)];
      return {
        prompt: `ถ้าวันนี้เป็น${DAYS[i]} อีก ${k} วันจะเป็นวันอะไร?`,
        options: shuffle(rng, [answer, ...[...new Set(pool)].filter((x) => x !== answer).slice(0, 3)]),
        answer,
        hint: k > 7 ? `ทุก 7 วันจะกลับมาเป็นวันเดิม ลองคิดแค่ ${k % 7} วัน` : 'นับต่อไปทีละวัน',
      };
    }
  }
};

const ANALOGIES: BankItem[] = [
  { d: 1, prompt: 'เติมคำให้เข้าคู่', expression: '🐟 ปลา : น้ำ = 🐦 นก : ?', answer: 'ท้องฟ้า', distractors: ['ทะเล', 'ดิน', 'ถ้ำ'], hint: 'ปลาว่ายในน้ำ แล้วนกบินที่ไหน?' },
  { d: 1, prompt: 'เติมคำให้เข้าคู่', expression: 'ลูกแมว : แมว = ลูกสุนัข : ?', answer: 'สุนัข', distractors: ['แมว', 'วัว', 'ไก่'], hint: 'ลูกโตขึ้นจะเป็นอะไร?' },
  { d: 2, prompt: 'เติมคำให้เข้าคู่', expression: 'มือ : ถุงมือ = เท้า : ?', answer: 'ถุงเท้า', distractors: ['หมวก', 'เสื้อ', 'แว่นตา'], hint: 'สวมอะไรที่เท้า?' },
  { d: 2, prompt: 'เติมคำให้เข้าคู่', expression: 'ร้อน : เย็น = สูง : ?', answer: 'ต่ำ', distractors: ['ใหญ่', 'ยาว', 'สูงมาก'], hint: 'คำตรงข้าม' },
  { d: 3, prompt: 'เติมคำให้เข้าคู่', expression: 'หมอ : โรงพยาบาล = ครู : ?', answer: 'โรงเรียน', distractors: ['ตลาด', 'สนามบิน', 'ร้านอาหาร'], hint: 'ครูทำงานที่ไหน?' },
  { d: 3, prompt: 'เติมคำให้เข้าคู่', expression: 'ตา : มองเห็น = หู : ?', answer: 'ได้ยิน', distractors: ['ดมกลิ่น', 'รับรส', 'เดิน'], hint: 'หูทำหน้าที่อะไร?' },
  { d: 4, prompt: 'เติมคำให้เข้าคู่', expression: 'ผึ้ง : น้ำผึ้ง = วัว : ?', answer: 'นม', distractors: ['หญ้า', 'ไข่', 'ขนแกะ'], hint: 'วัวให้อะไรแก่เรา?' },
  { d: 4, prompt: 'เติมคำให้เข้าคู่', expression: 'วงกลม : ลูกบอล = สี่เหลี่ยม : ?', answer: 'กล่อง', distractors: ['ส้ม', 'ล้อรถ', 'จาน'], hint: 'สิ่งของรูปทรงสี่เหลี่ยม' },
  { d: 5, prompt: 'เติมจำนวนให้เข้าคู่', expression: '2 : 4 = 5 : ?', answer: '10', distractors: ['7', '8', '25'], hint: 'จากตัวแรกไปตัวที่สองเป็นอย่างไร? (×2)' },
  { d: 5, prompt: 'เติมจำนวนให้เข้าคู่', expression: '3 : 9 = 4 : ?', answer: '16', distractors: ['12', '8', '13'], hint: '3 × 3 = 9 แล้ว 4 × 4 = ?' },
];

const NAMES = ['แดง', 'ดำ', 'ขาว', 'เขียว', 'ฟ้า'];
const RELATIONS = [
  { more: 'สูงกว่า', most: 'สูงที่สุด', least: 'เตี้ยที่สุด' },
  { more: 'วิ่งเร็วกว่า', most: 'วิ่งเร็วที่สุด', least: 'วิ่งช้าที่สุด' },
  { more: 'อายุมากกว่า', most: 'อายุมากที่สุด', least: 'อายุน้อยที่สุด' },
];

const deduction: Generator = (rng, d) => {
  const n = d >= 3 && d !== 4 ? 4 : 3;
  const order = distinct(rng, n, NAMES); // order[0] is "most"
  const rel = pick(rng, RELATIONS);
  const facts = order.slice(0, -1).map((a, i) => `${a}${rel.more}${order[i + 1]}`);
  const lines = (d >= 3 ? shuffle(rng, facts) : facts).join('\n');
  let prompt: string;
  let answer: string;
  if (d === 2) {
    prompt = `ใคร${rel.least}?`;
    answer = order[n - 1];
  } else if (d === 4) {
    prompt = `ใครอยู่ตรงกลาง (ไม่${rel.most.replace('ที่สุด', '')}และไม่${rel.least.replace('ที่สุด', '')}ที่สุด)?`;
    answer = order[1];
  } else if (d >= 5) {
    prompt = `ใคร${rel.least}?`;
    answer = order[n - 1];
  } else {
    prompt = `ใคร${rel.most}?`;
    answer = order[0];
  }
  return {
    prompt,
    visual: { kind: 'passage', text: lines },
    options: shuffle(rng, order),
    answer,
    hint: 'ลองเรียงชื่อจากมากไปน้อยตามข้อมูลทีละข้อ',
  };
};

const FRUITS = ['🍎', '🍌', '🍇', '🍓', '🍊'];

const symbols: Generator = (rng, d) => {
  const [a, b, c] = distinct(rng, 3, FRUITS);
  const va = randInt(rng, 1, 9);
  const vb = randInt(rng, 1, 9);
  const vc = randInt(rng, 1, 9);
  let lines: string[];
  let ask: string;
  let answer: number;
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1:
      lines = [`${a} + ${a} = ${va * 2}`];
      ask = a;
      answer = va;
      break;
    case 2:
      lines = [`${a} + ${a} = ${va * 2}`, `${a} + ${b} = ${va + vb}`];
      ask = b;
      answer = vb;
      break;
    case 3:
      lines = [`${a} + ${a} + ${a} = ${va * 3}`, `${a} + ${b} = ${va + vb}`, `${b} + ${c} = ${vb + vc}`];
      ask = c;
      answer = vc;
      break;
    case 4:
      lines = [`${a} × ${a} = ${va * va}`, `${a} + ${b} = ${va + vb}`];
      ask = b;
      answer = vb;
      break;
    default: {
      const big = Math.max(va, vb) + 1;
      const small = Math.min(va, vb);
      lines = [`${a} + ${b} = ${big + small}`, `${a} − ${b} = ${big - small}`];
      ask = a;
      answer = big;
    }
  }
  return {
    prompt: `${ask} มีค่าเท่าไร?`,
    visual: { kind: 'passage', text: lines.join('\n') },
    options: numericOptions(rng, answer, 0),
    answer: String(answer),
    hint: 'เริ่มจากบรรทัดที่มีผลไม้ชนิดเดียวก่อน แล้วนำค่าไปแทนในบรรทัดถัดไป',
  };
};

export const LOGIC_GENERATORS: Record<string, Generator> = {
  LOG_PATTERNS: patterns,
  LOG_ODD_ONE_OUT: oddOneOut,
  LOG_SEQUENCE: sequence,
  LOG_ANALOGY: bankGenerator(ANALOGIES),
  LOG_DEDUCTION: deduction,
  LOG_SYMBOLS: symbols,
};
