// Mathematics — shapes, time, Thai money, measurement and data (K1 → P3).
import { fromBank, type BankItem } from './bank.js';
import { numericOptions, type GeneratedQuestion, type Generator } from './kit.js';
import { pick, randInt, shuffle, type Rng } from './random.js';

/** Four distinct options: the answer plus up to three of the candidates. */
function choices(rng: Rng, answer: string, candidates: string[]): string[] {
  const wrong = shuffle(rng, [...new Set(candidates)].filter((c) => c !== answer)).slice(0, 3);
  return shuffle(rng, [answer, ...wrong]);
}

// ───────────── Shapes (K1) ─────────────

const SHAPES = [
  { emoji: '🔴', name: 'วงกลม', corners: 0 },
  { emoji: '🟦', name: 'สี่เหลี่ยมจัตุรัส', corners: 4 },
  { emoji: '🔺', name: 'สามเหลี่ยม', corners: 3 },
  { emoji: '⭐', name: 'รูปดาว', corners: 5 },
];

const SHAPE_OBJECTS: BankItem[] = [
  { d: 4, prompt: 'ล้อรถมีรูปร่างคล้ายรูปใด?', expression: '🛞', answer: 'วงกลม', distractors: ['สามเหลี่ยม', 'สี่เหลี่ยม', 'รูปดาว'], hint: 'ล้อกลิ้งได้เพราะไม่มีมุม' },
  { d: 4, prompt: 'ชิ้นพิซซ่ามีรูปร่างคล้ายรูปใด?', expression: '🍕', answer: 'สามเหลี่ยม', distractors: ['วงกลม', 'สี่เหลี่ยม', 'รูปดาว'], hint: 'นับมุมของชิ้นพิซซ่าดูนะ' },
  { d: 4, prompt: 'จอโทรทัศน์มีรูปร่างคล้ายรูปใด?', expression: '📺', answer: 'สี่เหลี่ยม', distractors: ['วงกลม', 'สามเหลี่ยม', 'รูปดาว'], hint: 'มี 4 มุม 4 ด้าน' },
  { d: 4, prompt: 'ดวงจันทร์เต็มดวงมีรูปร่างคล้ายรูปใด?', expression: '🌕', answer: 'วงกลม', distractors: ['สามเหลี่ยม', 'สี่เหลี่ยม', 'รูปดาว'], hint: 'กลมเหมือนลูกบอล' },
  { d: 4, prompt: 'ป้ายเตือนนี้มีรูปร่างคล้ายรูปใด?', expression: '⚠️', answer: 'สามเหลี่ยม', distractors: ['วงกลม', 'สี่เหลี่ยม', 'รูปดาว'], hint: 'มี 3 มุม' },
  { d: 4, prompt: 'หน้าต่างบานนี้มีรูปร่างคล้ายรูปใด?', expression: '🪟', answer: 'สี่เหลี่ยม', distractors: ['วงกลม', 'สามเหลี่ยม', 'รูปดาว'], hint: 'มี 4 มุม' },
];

const shapesBasic: Generator = (rng, d) => {
  if (d === 1) {
    const s = pick(rng, SHAPES);
    return {
      prompt: 'รูปนี้คือรูปอะไร?',
      expression: s.emoji,
      options: choices(rng, s.name, SHAPES.map((x) => x.name)),
      answer: s.name,
      hint: s.corners ? `ลองนับมุมดู มี ${s.corners} มุม` : 'รูปนี้ไม่มีมุมเลย',
    };
  }
  if (d === 2) {
    const s = pick(rng, SHAPES);
    return {
      prompt: `ข้อใดเป็น${s.name}?`,
      options: choices(rng, s.emoji, SHAPES.map((x) => x.emoji)),
      answer: s.emoji,
      hint: s.corners ? `${s.name}มี ${s.corners} มุม` : 'วงกลมไม่มีมุม กลิ้งได้',
    };
  }
  if (d === 3) {
    const sides = randInt(rng, 3, 6);
    return {
      prompt: 'รูปนี้มีกี่มุม?',
      visual: { kind: 'polygon', sides },
      options: choices(rng, String(sides), ['3', '4', '5', '6', '7']),
      answer: String(sides),
      hint: 'แตะทีละมุมแล้วนับไปพร้อมกัน',
    };
  }
  if (d === 4) return fromBank(rng, 4, SHAPE_OBJECTS);
  const target = pick(rng, SHAPES.slice(0, 3));
  const row = Array.from({ length: randInt(rng, 6, 9) }, () => pick(rng, SHAPES.slice(0, 3)).emoji);
  if (!row.includes(target.emoji)) row[randInt(rng, 0, row.length - 1)] = target.emoji;
  const count = row.filter((e) => e === target.emoji).length;
  return {
    prompt: `มี${target.name}กี่รูป?`,
    expression: row.join(''),
    options: numericOptions(rng, count, 1),
    answer: String(count),
    hint: `ชี้นับเฉพาะ ${target.emoji} ทีละรูป`,
  };
};

// ───────────── Time (P1) ─────────────

/** 8, 30 → "8.30 น." (the way Thai schools write times) */
export function timeText(hour: number, minute: number): string {
  return `${hour}.${String(minute).padStart(2, '0')} น.`;
}

const wrapHour = (h: number) => ((((h - 1) % 12) + 12) % 12) + 1;

function timeOptions(rng: Rng, hour: number, minute: number, step: number): string[] {
  const candidates = [
    timeText(wrapHour(hour + 1), minute),
    timeText(wrapHour(hour - 1), minute),
    timeText(hour, (minute + step) % 60),
    timeText(hour, (minute + 60 - step) % 60),
  ];
  // The classic slip: reading the hands the wrong way round.
  if (minute % 5 === 0 && minute > 0 && minute / 5 !== hour) candidates.push(timeText(wrapHour(minute / 5), (hour % 12) * 5));
  return choices(rng, timeText(hour, minute), candidates);
}

const timeClock: Generator = (rng, d) => {
  const hour = randInt(rng, 1, 12);
  if (d <= 4) {
    const step = [60, 30, 15, 5][d - 1];
    const minute = d === 1 ? 0 : randInt(rng, 0, 60 / step - 1) * step;
    return {
      prompt: 'นาฬิกาบอกเวลาเท่าไร?',
      visual: { kind: 'clock', hour, minute },
      options: timeOptions(rng, hour, minute, Math.max(step, 5) === 60 ? 30 : step),
      answer: timeText(hour, minute),
      hint: d === 1 ? 'เข็มยาวชี้ที่ 12 แปลว่าตรงชั่วโมง ดูว่าเข็มสั้นชี้เลขอะไร' : 'เข็มสั้นบอกชั่วโมง เข็มยาวชี้แต่ละเลขเพิ่มทีละ 5 นาที',
    };
  }
  const minute = randInt(rng, 0, 3) * 15;
  const later = pick(rng, [15, 30, 45, 60, 90]);
  const total = minute + later;
  const endHour = wrapHour(hour + Math.floor(total / 60));
  const endMinute = total % 60;
  return {
    prompt: `ตอนนี้เวลาตามนาฬิกา อีก ${later} นาทีจะเป็นเวลาเท่าไร?`,
    visual: { kind: 'clock', hour, minute },
    options: timeOptions(rng, endHour, endMinute, 15),
    answer: timeText(endHour, endMinute),
    hint: '60 นาที = 1 ชั่วโมง ลองนับเพิ่มทีละ 15 นาที',
  };
};

// ───────────── Thai money (P1) ─────────────

type Money = { value: number; count: number }[];
const total = (m: Money) => m.reduce((n, x) => n + x.value * x.count, 0);

function randomMoney(rng: Rng, values: number[], kinds: number, maxCount: number): Money {
  return shuffle(rng, values)
    .slice(0, kinds)
    .sort((a, b) => b - a)
    .map((value) => ({ value, count: randInt(rng, 1, maxCount) }));
}

const PRICED = [
  { emoji: '🍦', name: 'ไอศกรีม' },
  { emoji: '🧃', name: 'น้ำผลไม้' },
  { emoji: '🍞', name: 'ขนมปัง' },
  { emoji: '✏️', name: 'ดินสอ' },
  { emoji: '🧸', name: 'ตุ๊กตา' },
  { emoji: '📒', name: 'สมุด' },
];

const moneyThai: Generator = (rng, d) => {
  if (d <= 3) {
    const money = d === 1 ? randomMoney(rng, [1, 5, 10], 2, 3) : d === 2 ? randomMoney(rng, [1, 2, 5, 10], 3, 3) : randomMoney(rng, [100, 50, 20, 10, 5], 3, 2);
    const sum = total(money);
    return {
      prompt: 'มีเงินทั้งหมดกี่บาท?',
      visual: { kind: 'money', items: money },
      options: numericOptions(rng, sum, 1),
      answer: String(sum),
      hint: 'เริ่มนับจากเหรียญหรือธนบัตรที่มีค่ามากที่สุดก่อน แล้วนับต่อไปเรื่อย ๆ',
    };
  }
  const thing = pick(rng, PRICED);
  if (d === 4) {
    const price = randInt(rng, 3, 19) * 5;
    const paid = price > 50 ? 100 : pick(rng, [50, 100]);
    return {
      prompt: `ซื้อ${thing.name} ${thing.emoji} ราคา ${price} บาท จ่ายด้วยเงินตามภาพ จะได้เงินทอนกี่บาท?`,
      visual: { kind: 'money', items: [{ value: paid, count: 1 }] },
      options: numericOptions(rng, paid - price, 0),
      answer: String(paid - price),
      hint: `เงินทอน = เงินที่จ่าย − ราคาของ = ${paid} − ${price}`,
    };
  }
  const price = randInt(rng, 2, 9) * 5;
  const qty = randInt(rng, 2, 4);
  const paid = qty * price <= 100 ? 100 : 500;
  return {
    prompt: `ซื้อ${thing.name} ${thing.emoji} ${qty} ชิ้น ชิ้นละ ${price} บาท จ่ายเงิน ${paid} บาท จะได้เงินทอนกี่บาท?`,
    visual: { kind: 'money', items: [{ value: paid, count: 1 }] },
    options: numericOptions(rng, paid - qty * price, 0),
    answer: String(paid - qty * price),
    hint: `หาราคารวมก่อน: ${qty} × ${price} แล้วนำไปลบออกจาก ${paid}`,
  };
};

// ───────────── Length (P2) ─────────────

const LENGTH_UNITS: BankItem[] = [
  { d: 2, prompt: 'ความยาวของดินสอควรวัดเป็นหน่วยใด?', expression: '✏️', answer: 'เซนติเมตร', distractors: ['กิโลเมตร', 'เมตร', 'กิโลกรัม'], hint: 'ของชิ้นเล็ก ๆ ใช้หน่วยเล็ก' },
  { d: 2, prompt: 'ความยาวของสนามฟุตบอลควรวัดเป็นหน่วยใด?', expression: '⚽', answer: 'เมตร', distractors: ['เซนติเมตร', 'มิลลิเมตร', 'ลิตร'], hint: 'ยาวกว่าห้องเรียนหลายเท่า แต่ไม่ถึงข้ามจังหวัด' },
  { d: 2, prompt: 'ระยะทางจากกรุงเทพฯ ไปเชียงใหม่ควรวัดเป็นหน่วยใด?', expression: '🚗', answer: 'กิโลเมตร', distractors: ['เซนติเมตร', 'เมตร', 'กรัม'], hint: 'ระยะทางไกลมากใช้หน่วยใหญ่ที่สุด' },
  { d: 2, prompt: 'ความยาวของมดควรวัดเป็นหน่วยใด?', expression: '🐜', answer: 'มิลลิเมตร', distractors: ['เมตร', 'กิโลเมตร', 'ลิตร'], hint: 'ตัวเล็กมาก ใช้หน่วยที่เล็กกว่าเซนติเมตร' },
  { d: 2, prompt: 'ความสูงของประตูห้องเรียนควรวัดเป็นหน่วยใด?', expression: '🚪', answer: 'เมตร', distractors: ['กิโลเมตร', 'มิลลิเมตร', 'กิโลกรัม'], hint: 'สูงประมาณ 2 ของหน่วยนี้' },
];

const measureLength: Generator = (rng, d) => {
  if (d === 1) {
    const a = randInt(rng, 8, 20);
    const b = randInt(rng, 2, a - 2);
    return {
      prompt: `ดินสอยาว ${a} เซนติเมตร ยางลบยาว ${b} เซนติเมตร ดินสอยาวกว่ายางลบกี่เซนติเมตร?`,
      expression: '✏️ 📏 🧽',
      options: numericOptions(rng, a - b, 1),
      answer: String(a - b),
      hint: `ยาวกว่ากันเท่าไร ใช้การลบ: ${a} − ${b}`,
    };
  }
  if (d === 2) return fromBank(rng, 2, LENGTH_UNITS);
  if (d === 3) {
    const m = randInt(rng, 1, 5);
    const cm = randInt(rng, 1, 9) * 5;
    const ans = m * 100 + cm;
    return {
      prompt: `${m} เมตร ${cm} เซนติเมตร เท่ากับกี่เซนติเมตร?`,
      options: choices(rng, String(ans), [String(m * 10 + cm), String(m * 1000 + cm), String(ans + 10), String(ans - 5)]),
      answer: String(ans),
      hint: '1 เมตร = 100 เซนติเมตร',
    };
  }
  if (d === 4) {
    const km = randInt(rng, 1, 4);
    const m = randInt(rng, 1, 9) * 100;
    const ans = km * 1000 + m;
    return {
      prompt: `${km} กิโลเมตร ${m} เมตร เท่ากับกี่เมตร?`,
      options: choices(rng, String(ans), [String(km * 100 + m), String(km * 10000 + m), String(ans + 100), String(ans - 100)]),
      answer: String(ans),
      hint: '1 กิโลเมตร = 1,000 เมตร',
    };
  }
  const a = randInt(rng, 1, 3) * 100 + randInt(rng, 1, 9) * 10;
  const b = randInt(rng, 3, 9) * 10;
  const ans = a + b;
  return {
    prompt: `ริบบิ้นเส้นแรกยาว ${Math.floor(a / 100)} เมตร ${a % 100} เซนติเมตร เส้นที่สองยาว ${b} เซนติเมตร รวมกันยาวกี่เซนติเมตร?`,
    expression: '🎀 + 🎀',
    options: numericOptions(rng, ans, 1),
    answer: String(ans),
    hint: 'เปลี่ยนเมตรเป็นเซนติเมตรก่อน (1 เมตร = 100 เซนติเมตร) แล้วจึงบวก',
  };
};

// ───────────── Weight & volume (P3) ─────────────

const WEIGHT_VOLUME: BankItem[] = [
  { d: 1, prompt: 'สิ่งใดหนักที่สุด?', answer: '🐘', distractors: ['🐭', '🐱', '🐔'], hint: 'ตัวใหญ่ที่สุดมักหนักที่สุด' },
  { d: 1, prompt: 'สิ่งใดเบาที่สุด?', answer: '🪶', distractors: ['🧱', '🍉', '📚'], hint: 'สิ่งที่ลอยไปตามลมได้' },
  { d: 1, prompt: 'สิ่งใดจุน้ำได้มากที่สุด?', answer: '🛁', distractors: ['🥄', '☕', '🥛'], hint: 'ภาชนะที่ใหญ่ที่สุด' },
  { d: 2, prompt: 'น้ำหนักของแตงโมควรวัดเป็นหน่วยใด?', expression: '🍉', answer: 'กิโลกรัม', distractors: ['กรัม', 'ลิตร', 'เมตร'], hint: 'ผลไม้ลูกใหญ่ หนักหลายพันกรัม' },
  { d: 2, prompt: 'น้ำหนักของยางลบควรวัดเป็นหน่วยใด?', expression: '🧽', answer: 'กรัม', distractors: ['กิโลกรัม', 'ลิตร', 'เซนติเมตร'], hint: 'ของเบา ๆ ใช้หน่วยเล็ก' },
  { d: 2, prompt: 'ปริมาณน้ำในขวดใหญ่ควรวัดเป็นหน่วยใด?', expression: '🍶', answer: 'ลิตร', distractors: ['กิโลกรัม', 'เมตร', 'กรัม'], hint: 'ของเหลวปริมาณมากใช้หน่วยนี้' },
  { d: 2, prompt: 'ยาน้ำ 1 ช้อนควรวัดเป็นหน่วยใด?', expression: '🥄', answer: 'มิลลิลิตร', distractors: ['ลิตร', 'กิโลกรัม', 'เมตร'], hint: 'ของเหลวปริมาณน้อยมาก' },
];

const measureWeightVolume: Generator = (rng, d) => {
  if (d <= 2) return fromBank(rng, d, WEIGHT_VOLUME);
  if (d === 3) {
    const kg = randInt(rng, 1, 5);
    const g = randInt(rng, 1, 9) * 100;
    const ans = kg * 1000 + g;
    return {
      prompt: `${kg} กิโลกรัม ${g} กรัม เท่ากับกี่กรัม?`,
      expression: '⚖️',
      options: choices(rng, String(ans), [String(kg * 100 + g), String(kg * 10000 + g), String(ans + 100), String(ans - 100)]),
      answer: String(ans),
      hint: '1 กิโลกรัม = 1,000 กรัม',
    };
  }
  if (d === 4) {
    const l = randInt(rng, 1, 4);
    const ml = randInt(rng, 1, 3) * 250;
    const ans = l * 1000 + ml;
    return {
      prompt: `${l} ลิตร ${ml} มิลลิลิตร เท่ากับกี่มิลลิลิตร?`,
      expression: '🥤',
      options: choices(rng, String(ans), [String(l * 100 + ml), String(l * 10000 + ml), String(ans + 250), String(ans - 250)]),
      answer: String(ans),
      hint: '1 ลิตร = 1,000 มิลลิลิตร',
    };
  }
  const glass = pick(rng, [200, 250, 500]);
  const litres = pick(rng, [1, 2, 3]);
  const ans = (litres * 1000) / glass;
  return {
    prompt: `น้ำผลไม้ ${litres} ลิตร แบ่งใส่แก้ว แก้วละ ${glass} มิลลิลิตร ได้กี่แก้ว?`,
    expression: '🧃 → 🥛🥛🥛',
    options: numericOptions(rng, ans, 1),
    answer: String(ans),
    hint: `เปลี่ยนเป็นมิลลิลิตรก่อน: ${litres} ลิตร = ${litres * 1000} มิลลิลิตร แล้วหารด้วย ${glass}`,
  };
};

// ───────────── Pictographs (P3) ─────────────

const CHART_SETS = [
  { title: 'ผลไม้ในตะกร้า', unit: 'ผล', items: [{ emoji: '🍎', label: 'แอปเปิล' }, { emoji: '🍌', label: 'กล้วย' }, { emoji: '🍊', label: 'ส้ม' }, { emoji: '🍇', label: 'องุ่น' }] },
  { title: 'สัตว์เลี้ยงของเด็กในห้อง', unit: 'ตัว', items: [{ emoji: '🐶', label: 'สุนัข' }, { emoji: '🐱', label: 'แมว' }, { emoji: '🐟', label: 'ปลา' }, { emoji: '🐰', label: 'กระต่าย' }] },
  { title: 'สีที่เด็ก ๆ ชอบ', unit: 'คน', items: [{ emoji: '🟥', label: 'สีแดง' }, { emoji: '🟦', label: 'สีฟ้า' }, { emoji: '🟩', label: 'สีเขียว' }, { emoji: '🟨', label: 'สีเหลือง' }] },
];

const dataGraph: Generator = (rng, d) => {
  const set = pick(rng, CHART_SETS);
  const kinds = d <= 2 ? 3 : 4;
  // Distinct counts so "most" and "least" always have one answer.
  const counts = shuffle(rng, [1, 2, 3, 4, 5, 6, 7]).slice(0, kinds);
  const rows = set.items.slice(0, kinds).map((it, i) => ({ ...it, count: counts[i] }));
  const scale = d === 5 ? 2 : 1;
  const visual = { kind: 'tally' as const, items: rows.map((r) => ({ emoji: r.emoji, count: r.count, label: r.label })) };
  const names = rows.map((r) => r.label);
  const key = scale > 1 ? ` (1 ภาพ แทน ${scale} ${set.unit})` : '';
  const q = (prompt: string, answer: string, options: string[], hint: string): GeneratedQuestion => ({
    prompt: `แผนภูมิ "${set.title}"${key}: ${prompt}`,
    visual,
    options,
    answer,
    hint,
  });
  if (d === 1) {
    const most = rows.reduce((a, b) => (b.count > a.count ? b : a));
    return q(`อะไรมีมากที่สุด?`, most.label, choices(rng, most.label, names), 'ดูแถวที่ยาวที่สุด');
  }
  const r = pick(rng, rows);
  if (d === 2) return q(`${r.label}มีกี่${set.unit}?`, String(r.count), numericOptions(rng, r.count, 0), `นับภาพในแถว${r.label}`);
  if (d === 3) {
    const [a, b] = shuffle(rng, rows).slice(0, 2).sort((x, y) => y.count - x.count);
    return q(`${a.label}มากกว่า${b.label}กี่${set.unit}?`, String(a.count - b.count), numericOptions(rng, a.count - b.count, 0), `${a.count} − ${b.count}`);
  }
  const sum = rows.reduce((n, x) => n + x.count, 0) * scale;
  return q(
    `รวมทั้งหมดกี่${set.unit}?`,
    String(sum),
    numericOptions(rng, sum, 1),
    scale > 1 ? `นับภาพทั้งหมดก่อน แล้วคูณด้วย ${scale}` : 'นับภาพทุกแถวรวมกัน',
  );
};

export const MEASUREMENT_GENERATORS: Record<string, Generator> = {
  SHAPES_BASIC: shapesBasic,
  TIME_CLOCK: timeClock,
  MONEY_THAI: moneyThai,
  MEASURE_LENGTH: measureLength,
  MEASURE_WEIGHT_VOLUME: measureWeightVolume,
  DATA_GRAPH: dataGraph,
};
