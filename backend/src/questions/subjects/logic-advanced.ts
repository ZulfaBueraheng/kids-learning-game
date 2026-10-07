// 🧩 Logic, deeper: directions & maps, number sequences, step-by-step "coding", counting ways,
// if-then reasoning and grid logic puzzles (P2 → P6). Mostly generated, so puzzles rarely repeat.
import { bankGenerator, type BankItem } from '../bank.js';
import { numericOptions, type GeneratedQuestion, type Generator } from '../kit.js';
import { pick, randInt, shuffle, type Rng } from '../random.js';

function choices(rng: Rng, answer: string, candidates: string[]): string[] {
  const wrong = shuffle(rng, [...new Set(candidates)].filter((c) => c !== answer)).slice(0, 3);
  return shuffle(rng, [answer, ...wrong]);
}

// ───────────── Directions & maps ─────────────

const COMPASS = ['ทิศเหนือ', 'ทิศตะวันออก', 'ทิศใต้', 'ทิศตะวันตก'];
const GRID_THINGS = ['🍎', '🐶', '🌸', '⭐', '🚗', '🐱', '🎈', '🌳', '🍩', '🐸', '🎁', '🦋', '⚽', '🍉', '🐢', '🌙'];

const directions: Generator = (rng, d) => {
  if (d <= 3) {
    const start = randInt(rng, 0, 3);
    const turns = d === 1 ? [pick(rng, [1, -1])] : d === 2 ? [pick(rng, [1, -1]), pick(rng, [1, -1])] : [pick(rng, [2, 1, -1]), pick(rng, [1, -1]), pick(rng, [2, -1])];
    const words = turns.map((t) => (t === 2 ? 'กลับหลังหัน' : t === 1 ? 'หันขวา' : 'หันซ้าย'));
    const end = (((start + turns.reduce((a, b) => a + b, 0)) % 4) + 4) % 4;
    return {
      prompt: `ยืนหันหน้าไปทาง${COMPASS[start]} แล้ว${words.join(' แล้ว')} ตอนนี้หันหน้าไปทางทิศใด?`,
      expression: '🧭',
      options: choices(rng, COMPASS[end], COMPASS),
      answer: COMPASS[end],
      hint: 'หันขวา = ตามเข็มนาฬิกา: เหนือ → ตะวันออก → ใต้ → ตะวันตก',
    };
  }
  const size = d === 4 ? 3 : 4;
  const things = shuffle(rng, GRID_THINGS).slice(0, size * size);
  const grid = Array.from({ length: size }, (_, r) => things.slice(r * size, r * size + size));
  let r = randInt(rng, 0, size - 1);
  let c = randInt(rng, 0, size - 1);
  const startThing = grid[r][c];
  const steps: string[] = [];
  const moves = d === 4 ? 2 : 3;
  for (let i = 0; i < moves; i++) {
    const options = [
      { dr: -1, dc: 0, word: 'ขึ้น' },
      { dr: 1, dc: 0, word: 'ลง' },
      { dr: 0, dc: 1, word: 'ขวา' },
      { dr: 0, dc: -1, word: 'ซ้าย' },
    ]
      .flatMap((m) => [1, 2].map((n) => ({ ...m, n })))
      .filter((m) => r + m.dr * m.n >= 0 && r + m.dr * m.n < size && c + m.dc * m.n >= 0 && c + m.dc * m.n < size);
    const m = pick(rng, options);
    r += m.dr * m.n;
    c += m.dc * m.n;
    steps.push(`${m.word} ${m.n} ช่อง`);
  }
  const answer = grid[r][c];
  return {
    prompt: `เริ่มที่ ${startThing} เดิน${steps.join(' แล้ว')} จะเจออะไร?`,
    visual: { kind: 'passage', text: grid.map((row) => row.join('  ')).join('\n') },
    options: choices(rng, answer, things.filter((t) => t !== startThing)),
    answer,
    hint: 'ใช้นิ้วชี้ที่จุดเริ่มต้น แล้วเลื่อนทีละช่องตามคำสั่ง',
  };
};

// ───────────── Number sequences ─────────────

const numberPuzzles: Generator = (rng, d) => {
  let seq: number[];
  let hint: string;
  if (d === 1) {
    const a = randInt(rng, 1, 10);
    const k = randInt(rng, 2, 5);
    seq = Array.from({ length: 5 }, (_, i) => a + i * k);
    hint = `เพิ่มขึ้นทีละ ${k}`;
  } else if (d === 2) {
    const k = randInt(rng, 2, 6);
    const a = randInt(rng, 5 * k, 9 * k);
    seq = Array.from({ length: 5 }, (_, i) => a - i * k);
    hint = `ลดลงทีละ ${k}`;
  } else if (d === 3) {
    const k = pick(rng, [2, 3]);
    const a = randInt(rng, 1, 3);
    seq = Array.from({ length: 5 }, (_, i) => a * k ** i);
    hint = `คูณด้วย ${k} ทุกครั้ง`;
  } else if (d === 4) {
    const a = randInt(rng, 1, 5);
    const step = randInt(rng, 1, 2);
    seq = [a];
    for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + step * i);
    hint = 'ดูผลต่างระหว่างตัวเลขที่อยู่ติดกัน ผลต่างก็เพิ่มขึ้นเรื่อย ๆ';
  } else {
    const kind = randInt(rng, 0, 2);
    if (kind === 0) {
      const a = randInt(rng, 1, 3);
      const b = randInt(rng, a, a + 3);
      seq = [a, b];
      for (let i = 2; i < 7; i++) seq.push(seq[i - 1] + seq[i - 2]);
      hint = 'แต่ละตัวเท่ากับสองตัวก่อนหน้าบวกกัน';
    } else if (kind === 1) {
      const a = randInt(rng, 1, 3);
      seq = Array.from({ length: 6 }, (_, i) => (a + i) ** 2);
      hint = 'ลองดูว่าแต่ละจำนวนเป็นจำนวนใดคูณตัวเอง';
    } else {
      const a = randInt(rng, 2, 6);
      const up = randInt(rng, 3, 6);
      const down = randInt(rng, 1, up - 1);
      seq = [a];
      for (let i = 1; i < 7; i++) seq.push(seq[i - 1] + (i % 2 ? up : -down));
      hint = `สลับกัน: บวก ${up} แล้วลบ ${down}`;
    }
  }
  const answer = seq[seq.length - 1];
  return {
    prompt: 'จำนวนถัดไปคือเท่าไร?',
    expression: `${seq.slice(0, -1).join(', ')}, ?`,
    options: numericOptions(rng, answer, 0),
    answer: String(answer),
    hint,
  };
};

// ───────────── "Coding": follow the steps ─────────────

type Step = { text: string; apply: (n: number) => number };
const STEPS: ((rng: Rng) => Step)[] = [
  (rng) => {
    const k = randInt(rng, 2, 9);
    return { text: `บวก ${k}`, apply: (n) => n + k };
  },
  (rng) => {
    const k = randInt(rng, 2, 5);
    return { text: `ลบ ${k}`, apply: (n) => n - k };
  },
  (rng) => {
    const k = pick(rng, [2, 3]);
    return { text: `คูณ ${k}`, apply: (n) => n * k };
  },
];

const coding: Generator = (rng, d): GeneratedQuestion => {
  if (d <= 3) {
    const start = randInt(rng, 3, 12);
    const program = Array.from({ length: d }, () => pick(rng, STEPS)(rng));
    const result = program.reduce((n, s) => s.apply(n), start);
    return {
      prompt: 'หุ่นยนต์ทำตามคำสั่งทีละขั้น ได้ผลลัพธ์เท่าไร?',
      visual: { kind: 'passage', text: [`เริ่มต้น: ${start}`, ...program.map((s, i) => `คำสั่ง ${i + 1}: ${s.text}`)].join('\n') },
      options: numericOptions(rng, result, 0),
      answer: String(result),
      hint: 'ทำทีละคำสั่งจากบนลงล่าง จดผลไว้ทุกขั้น',
    };
  }
  if (d === 4) {
    const start = randInt(rng, 1, 10);
    const k = randInt(rng, 2, 6);
    const times = randInt(rng, 3, 5);
    const result = start + k * times;
    return {
      prompt: 'หุ่นยนต์ทำตามคำสั่งวนซ้ำ ได้ผลลัพธ์เท่าไร?',
      visual: { kind: 'passage', text: `เริ่มต้น: ${start}\nทำซ้ำ ${times} รอบ:\n    บวก ${k}` },
      options: numericOptions(rng, result, 0),
      answer: String(result),
      hint: `บวก ${k} ซ้ำ ${times} รอบ = บวก ${k} × ${times}`,
    };
  }
  const k = pick(rng, [2, 3]);
  const add = randInt(rng, 1, 9);
  const start = randInt(rng, 2, 12);
  const result = start * k + add;
  return {
    prompt: `หุ่นยนต์ "คูณ ${k}" แล้ว "บวก ${add}" ได้ ${result} ตอนเริ่มต้นเป็นเท่าไร?`,
    expression: `? → ×${k} → +${add} → ${result}`,
    options: numericOptions(rng, start, 1),
    answer: String(start),
    hint: `ย้อนกลับ: ลบ ${add} ก่อน แล้วหารด้วย ${k}`,
  };
};

// ───────────── Counting ways ─────────────

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));

const combinations: Generator = (rng, d) => {
  if (d <= 2) {
    const shirts = randInt(rng, 2, 4);
    const pants = randInt(rng, 2, d === 1 ? 2 : 4);
    return {
      prompt: `มีเสื้อ ${shirts} ตัว กางเกง ${pants} ตัว แต่งตัวได้ทั้งหมดกี่แบบ? (เสื้อ 1 ตัว + กางเกง 1 ตัว)`,
      expression: `${'👕'.repeat(shirts)}  ${'👖'.repeat(pants)}`,
      options: numericOptions(rng, shirts * pants, 1),
      answer: String(shirts * pants),
      hint: 'เสื้อแต่ละตัวจับคู่กับกางเกงได้ทุกตัว ลองนับเป็นตาราง',
    };
  }
  if (d === 3) {
    const [a, b, c] = [randInt(rng, 2, 3), randInt(rng, 2, 3), randInt(rng, 2, 3)];
    return {
      prompt: `ร้านมีข้าว ${a} อย่าง กับข้าว ${b} อย่าง ของหวาน ${c} อย่าง เลือกอย่างละ 1 ได้ทั้งหมดกี่ชุด?`,
      expression: '🍚 🍛 🍮',
      options: numericOptions(rng, a * b * c, 1),
      answer: String(a * b * c),
      hint: `${a} × ${b} × ${c}`,
    };
  }
  if (d === 4) {
    const n = randInt(rng, 3, 4);
    return {
      prompt: `เด็ก ${n} คนยืนเรียงแถว จัดลำดับได้ทั้งหมดกี่แบบ?`,
      expression: '🧒'.repeat(n),
      options: numericOptions(rng, factorial(n), 1),
      answer: String(factorial(n)),
      hint: `คนแรกเลือกได้ ${n} คน คนถัดไปเลือกได้ ${n - 1} คน …`,
    };
  }
  const n = randInt(rng, 4, 7);
  const ans = (n * (n - 1)) / 2;
  return {
    prompt: `เพื่อน ${n} คน จับมือทักทายกันครบทุกคู่ คนละ 1 ครั้งต่อคู่ จับมือทั้งหมดกี่ครั้ง?`,
    expression: '🤝',
    options: numericOptions(rng, ans, 1),
    answer: String(ans),
    hint: `คนแรกจับ ${n - 1} ครั้ง คนที่สองจับเพิ่ม ${n - 2} ครั้ง … แล้วรวมกัน`,
  };
};

// ───────────── If-then reasoning ─────────────

const TRUTH: BankItem[] = [
  { d: 1, prompt: 'ถ้าฝนตก พื้นจะเปียก วันนี้ฝนตก สรุปได้ว่าอย่างไร?', expression: '🌧️', answer: 'พื้นเปียก', distractors: ['พื้นแห้ง', 'แดดออก', 'สรุปไม่ได้'], hint: 'ทำตามเงื่อนไข "ถ้า … จะ …"' },
  { d: 1, prompt: 'แมวทุกตัวมีหาง เจ้าเหมียวเป็นแมว สรุปได้ว่าอย่างไร?', expression: '🐱', answer: 'เจ้าเหมียวมีหาง', distractors: ['เจ้าเหมียวไม่มีหาง', 'สัตว์ที่มีหางเป็นแมวทุกตัว', 'สรุปไม่ได้'], hint: 'เจ้าเหมียวอยู่ในกลุ่ม "แมวทุกตัว"' },
  { d: 2, prompt: 'นกทุกตัวมีปีก สัตว์ตัวนี้ไม่มีปีก สรุปได้ว่าอย่างไร?', answer: 'สัตว์ตัวนี้ไม่ใช่นก', distractors: ['สัตว์ตัวนี้เป็นนก', 'สัตว์ตัวนี้บินได้', 'สรุปไม่ได้'], hint: 'ถ้าเป็นนกต้องมีปีก' },
  { d: 2, prompt: 'ถ้าทำการบ้านเสร็จ จะได้ดูการ์ตูน ต้นข้าวได้ดูการ์ตูน แสดงว่าทำการบ้านเสร็จแน่นอนหรือไม่?', answer: 'ไม่แน่นอน อาจได้ดูด้วยเหตุผลอื่น', distractors: ['แน่นอน', 'ไม่ได้ทำการบ้านแน่นอน', 'ต้นข้าวไม่ชอบการ์ตูน'], hint: 'เงื่อนไขไม่ได้บอกว่าดูการ์ตูนได้ทางเดียว' },
  { d: 3, prompt: 'ถ้าร้านเปิด ไฟหน้าร้านจะติด ตอนนี้ไฟหน้าร้านไม่ติด สรุปได้ว่าอย่างไร?', expression: '🏪', answer: 'ร้านไม่เปิด', distractors: ['ร้านเปิด', 'ไฟเสีย', 'สรุปไม่ได้'], hint: 'ถ้าร้านเปิด ไฟต้องติด แต่ไฟไม่ติด …' },
  { d: 3, prompt: 'ข้อใดเป็นจริงเสมอ?', answer: 'ทุกวันจันทร์อยู่ถัดจากวันอาทิตย์', distractors: ['ทุกวันจันทร์ฝนตก', 'ทุกวันจันทร์มีการบ้าน', 'ทุกวันจันทร์เป็นวันหยุด'], hint: 'จริงเสมอโดยไม่มีข้อยกเว้น' },
  { d: 4, prompt: 'เด็กทุกคนในห้องชอบกีฬา บางคนในห้องชอบดนตรี ข้อใดสรุปได้แน่นอน?', answer: 'มีคนที่ชอบทั้งกีฬาและดนตรี', distractors: ['ทุกคนชอบดนตรี', 'ไม่มีใครชอบดนตรี', 'คนชอบดนตรีไม่ชอบกีฬา'], hint: 'คนที่ชอบดนตรีก็อยู่ในห้อง จึงชอบกีฬาด้วย' },
  { d: 4, prompt: 'มีคนพูดว่า "ทุกคนในบ้านนี้สูงกว่า 150 ซม." ถ้าน้องเล็กสูง 100 ซม. และอยู่บ้านนี้ แปลว่าอย่างไร?', answer: 'คำพูดนั้นไม่จริง', distractors: ['คำพูดนั้นจริง', 'น้องเล็กไม่ได้อยู่บ้านนี้', 'สรุปไม่ได้'], hint: 'มีตัวอย่างค้านเพียงคนเดียวก็พอ' },
  { d: 5, prompt: 'A พูดว่า "B โกหก" B พูดว่า "C โกหก" C พูดว่า "A และ B โกหกทั้งคู่" ถ้ามีคนพูดจริงเพียงคนเดียว ใครพูดจริง?', answer: 'B', distractors: ['A', 'C', 'ไม่มีใคร'], hint: 'ลองสมมติว่าแต่ละคนพูดจริง แล้วตรวจว่าขัดแย้งไหม' },
  { d: 5, prompt: 'ถ้าวันนี้ไม่ใช่วันเสาร์ ก็ไม่ใช่วันอาทิตย์ ถ้าวันนี้เป็นวันหยุดสุดสัปดาห์ (เสาร์หรืออาทิตย์) วันนี้คือวันอะไร?', answer: 'วันเสาร์', distractors: ['วันอาทิตย์', 'วันศุกร์', 'สรุปไม่ได้'], hint: 'ถ้าเป็นวันอาทิตย์ (ไม่ใช่เสาร์) เงื่อนไขบอกว่าต้องไม่ใช่อาทิตย์ — ขัดกัน' },
];

// ───────────── Grid logic puzzles ─────────────

const KIDS = ['ก้อง', 'มิว', 'ต้น', 'ฝน'];
const PETS = [
  { name: 'แมว', emoji: '🐱' },
  { name: 'สุนัข', emoji: '🐶' },
  { name: 'ปลา', emoji: '🐟' },
  { name: 'กระต่าย', emoji: '🐰' },
];

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

/** Clues are true facts about a hidden assignment, added until exactly one assignment fits. */
const gridLogic: Generator = (rng, d) => {
  const n = d >= 5 ? 4 : 3;
  const kids = KIDS.slice(0, n);
  const pets = PETS.slice(0, n);
  const truth = shuffle(rng, [...Array(n).keys()]); // kid i has pets[truth[i]]
  const allowPositive = d <= 2;
  type Clue = { text: string; ok: (p: number[]) => boolean };
  const facts: Clue[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (truth[i] === j && allowPositive) facts.push({ text: `${kids[i]}เลี้ยง${pets[j].name}`, ok: (p) => p[i] === j });
      if (truth[i] !== j) facts.push({ text: `${kids[i]}ไม่ได้เลี้ยง${pets[j].name}`, ok: (p) => p[i] !== j });
    }
  }
  const askPet = randInt(rng, 0, n - 1);
  const owner = truth.indexOf(askPet);
  const all = permutations([...Array(n).keys()]);
  const clues: Clue[] = [];
  for (const f of shuffle(rng, facts)) {
    // don't hand the answer over in a single clue
    if (f.text === `${kids[owner]}เลี้ยง${pets[askPet].name}`) continue;
    if (all.filter((p) => clues.every((c) => c.ok(p))).length === 1) break;
    const before = all.filter((p) => clues.every((c) => c.ok(p))).length;
    const after = all.filter((p) => [...clues, f].every((c) => c.ok(p))).length;
    if (after < before) clues.push(f);
  }
  return {
    prompt: `เด็ก ${n} คนเลี้ยงสัตว์คนละ 1 ชนิดไม่ซ้ำกัน (${pets.map((p) => p.emoji + ' ' + p.name).join(', ')}) ใครเลี้ยง${pets[askPet].name}?`,
    visual: { kind: 'passage', text: clues.map((c, i) => `เบาะแส ${i + 1}: ${c.text}`).join('\n') },
    options: shuffle(rng, kids),
    answer: kids[owner],
    hint: 'วาดตาราง ชื่อเด็ก × สัตว์ แล้วกากบาทช่องที่เป็นไปไม่ได้ทีละเบาะแส',
  };
};

export const LOGIC_ADVANCED_GENERATORS: Record<string, Generator> = {
  LOG_DIRECTIONS: directions,
  LOG_NUMBER_PUZZLES: numberPuzzles,
  LOG_CODING: coding,
  LOG_COMBINATIONS: combinations,
  LOG_TRUTH: bankGenerator(TRUTH),
  LOG_GRID_LOGIC: gridLogic,
};

export { permutations };
