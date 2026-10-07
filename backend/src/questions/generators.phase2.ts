// Phase 2 — Core Mathematics (P2 → P3): multiplication, division, fractions, word problems.
import { level, numericOptions, type GeneratedQuestion, type Generator } from './kit.js';
import { themePack, type QuestionContext } from './themes.js';
import { pick, randInt, shuffle, type Rng } from './random.js';

/** Options for a multiplication / division fact: neighbouring facts are the typical mistakes. */
export function factOptions(rng: Rng, answer: number, a: number, b: number): string[] {
  const candidates = new Set([answer + a, answer - a, answer + b, answer - b, answer + 1, answer - 1, answer + 10]);
  candidates.delete(answer);
  const pool = shuffle(rng, [...candidates].filter((c) => c >= 0));
  return shuffle(rng, [answer, ...pool.slice(0, 3)]).map(String);
}

export function fractionText(n: number, d: number): string {
  return `${n}/${d}`;
}

/** Options for "which fraction is shaded": the classic mistakes are counting unshaded parts or the wrong whole. */
export function fractionOptions(rng: Rng, shaded: number, parts: number): string[] {
  const answer = fractionText(shaded, parts);
  const candidates = [
    fractionText(parts - shaded, parts),
    fractionText(shaded, parts + 1),
    fractionText(shaded + 1, parts),
    fractionText(shaded, parts - 1),
    fractionText(shaded, parts + 2),
    fractionText(Math.max(1, shaded - 1), parts),
  ].filter((f, i, all) => {
    const [n, d] = f.split('/').map(Number);
    return f !== answer && all.indexOf(f) === i && n >= 1 && d >= 2 && n <= d && n * parts !== shaded * d;
  });
  return shuffle(rng, [answer, ...shuffle(rng, candidates).slice(0, 3)]);
}

function times(a: number, b: number) {
  return `${a} × ${b}`;
}

// ───────────── Multiplication ─────────────

const multConcept: Generator = (rng, d, ctx) => {
  const thing = pick(rng, themePack(ctx).things);
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const rows = randInt(rng, 2, 3);
      const cols = randInt(rng, 2, 5);
      return {
        prompt: `มี${thing.name}ทั้งหมดกี่${thing.unit}?`,
        visual: { kind: 'array', emoji: thing.emoji, rows, cols },
        options: factOptions(rng, rows * cols, rows, cols),
        answer: String(rows * cols),
        hint: `นับทีละแถว แถวละ ${cols} มีทั้งหมด ${rows} แถว`,
      };
    }
    case 2: {
      const n = randInt(rng, 2, 5);
      const k = randInt(rng, 2, 5);
      return {
        prompt: 'บวกกันได้เท่าไร?',
        expression: `${Array(k).fill(n).join(' + ')} = ?`,
        options: factOptions(rng, n * k, n, k),
        answer: String(n * k),
        hint: `นับเพิ่มทีละ ${n}`,
      };
    }
    case 3: {
      const rows = randInt(rng, 2, 5);
      const cols = randInt(rng, 2, 5);
      const answer = times(rows, cols);
      const distractors = [`${rows} + ${cols}`, times(rows, cols + 1), times(rows + 1, cols)];
      return {
        prompt: 'เขียนเป็นประโยคการคูณได้ว่าอย่างไร?',
        visual: { kind: 'array', emoji: thing.emoji, rows, cols },
        options: shuffle(rng, [answer, ...distractors]),
        answer,
        hint: `มี ${rows} แถว แถวละ ${cols} → ${rows} × ${cols}`,
      };
    }
    case 4: {
      const n = randInt(rng, 2, 9);
      const k = randInt(rng, 2, 5);
      return {
        prompt: 'เลขอะไรหายไป?',
        expression: `${Array(k).fill(n).join(' + ')} = ? × ${n}`,
        options: numericOptions(rng, k, 1),
        answer: String(k),
        hint: `นับว่ามีเลข ${n} บวกกันอยู่กี่ตัว`,
      };
    }
    default: {
      const g = randInt(rng, 2, 6);
      const each = randInt(rng, 2, 6);
      return {
        prompt: `มี ${g} กลุ่ม กลุ่มละ ${each} ${thing.unit} รวมเป็นกี่${thing.unit}?`,
        options: factOptions(rng, g * each, g, each),
        answer: String(g * each),
        hint: `${g} กลุ่ม กลุ่มละ ${each} คือ ${g} × ${each}`,
      };
    }
  }
};

function timesTable(tables: { easy: number[]; all: number[] }): Generator {
  return (rng, d) => {
    const [pool, maxB] = level(d, [
      [tables.easy, 5],
      [tables.all, 5],
      [tables.all, 10],
      [tables.all, 12],
      [tables.all, 10],
    ] as const);
    const a = pick(rng, pool);
    const b = randInt(rng, 1, maxB);
    const product = a * b;
    const hint = `ท่องสูตรคูณแม่ ${a}: ${a}, ${a * 2}, ${a * 3}, …`;
    if (d >= 5) {
      return {
        prompt: 'เลขอะไรหายไป?',
        expression: `${a} × ? = ${product}`,
        options: numericOptions(rng, b, 1),
        answer: String(b),
        hint: `ลองท่องสูตรคูณแม่ ${a} จนถึง ${product}`,
      };
    }
    const [x, y] = d >= 4 && rng() < 0.5 ? [b, a] : [a, b];
    return {
      prompt: 'ผลคูณเท่ากับเท่าไร?',
      expression: `${times(x, y)} = ?`,
      options: factOptions(rng, product, a, b),
      answer: String(product),
      hint,
    };
  };
}

const multMultiDigit: Generator = (rng, d) => {
  let a: number;
  let m: number;
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1:
      a = randInt(rng, 1, 9) * 10;
      m = randInt(rng, 2, 9);
      break;
    case 2: // no regrouping
      m = randInt(rng, 2, 4);
      a = randInt(rng, 1, Math.floor(9 / m)) * 10 + randInt(rng, 1, Math.floor(9 / m));
      break;
    case 3: // regroup the ones
      do {
        m = randInt(rng, 2, 9);
        a = randInt(rng, 11, 49);
      } while ((a % 10) * m < 10);
      break;
    case 4:
      a = randInt(rng, 12, 99);
      m = randInt(rng, 3, 9);
      break;
    default:
      a = randInt(rng, 100, 399);
      m = randInt(rng, 2, 5);
  }
  const product = a * m;
  return {
    prompt: 'ผลคูณเท่ากับเท่าไร?',
    expression: `${times(a, m)} = ?`,
    options: factOptions(rng, product, m, 10),
    answer: String(product),
    hint: `แยกคูณทีละหลัก: ${Math.floor(a / 10) * 10} × ${m} แล้วบวก ${a % 10} × ${m}`,
  };
};

// ───────────── Division ─────────────

const divConcept: Generator = (rng, d, ctx) => {
  const thing = pick(rng, themePack(ctx).things);
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1:
    case 2: {
      const groups = d === 1 ? randInt(rng, 2, 3) : randInt(rng, 2, 5);
      const each = d === 1 ? randInt(rng, 1, 4) : randInt(rng, 1, 5);
      const total = groups * each;
      return {
        prompt: `แบ่ง${thing.name} ${total} ${thing.unit} ให้ ${groups} คนเท่า ๆ กัน ได้คนละกี่${thing.unit}?`,
        visual: { kind: 'share', emoji: thing.emoji, total, groups },
        options: numericOptions(rng, each, 1),
        answer: String(each),
        hint: 'แจกให้ทุกคนทีละหนึ่ง วนไปจนหมด แล้วนับว่าแต่ละคนได้กี่อัน',
      };
    }
    case 3: {
      const size = randInt(rng, 2, 5);
      const groups = randInt(rng, 2, 5);
      const total = size * groups;
      return {
        prompt: `มี${thing.name} ${total} ${thing.unit} จัดกลุ่มละ ${size} ${thing.unit} ได้กี่กลุ่ม?`,
        visual: { kind: 'objects', emoji: thing.emoji, count: total },
        options: numericOptions(rng, groups, 1),
        answer: String(groups),
        hint: `วงล้อมทีละ ${size} อัน แล้วนับจำนวนวง`,
      };
    }
    case 4: {
      const a = randInt(rng, 2, 5);
      const b = randInt(rng, 2, 9);
      return {
        prompt: 'ใช้การคูณช่วยหาร',
        expression: `${a} × ${b} = ${a * b}  →  ${a * b} ÷ ${a} = ?`,
        options: numericOptions(rng, b, 1),
        answer: String(b),
        hint: 'การหารคือการคูณย้อนกลับ',
      };
    }
    default: {
      const a = randInt(rng, 2, 5);
      const q = randInt(rng, 1, 5);
      return {
        prompt: 'ผลหารเท่ากับเท่าไร?',
        expression: `${a * q} ÷ ${a} = ?`,
        options: numericOptions(rng, q, 1),
        answer: String(q),
        hint: `${a} คูณอะไรได้ ${a * q}?`,
      };
    }
  }
};

const divBasic: Generator = (rng, d) => {
  const [minD, maxD, maxQ] = level(d, [
    [2, 5, 5],
    [2, 5, 10],
    [2, 9, 10],
    [6, 9, 10],
    [2, 9, 10],
  ] as const);
  const divisor = randInt(rng, minD, maxD);
  const q = randInt(rng, d >= 4 ? 2 : 1, maxQ);
  const dividend = divisor * q;
  if (d >= 5) {
    return {
      prompt: 'เลขอะไรหายไป?',
      expression: `? ÷ ${divisor} = ${q}`,
      options: factOptions(rng, dividend, divisor, q),
      answer: String(dividend),
      hint: `ตัวที่หายไปคือ ${divisor} × ${q}`,
    };
  }
  return {
    prompt: 'ผลหารเท่ากับเท่าไร?',
    expression: `${dividend} ÷ ${divisor} = ?`,
    options: numericOptions(rng, q, 1),
    answer: String(q),
    hint: `ท่องสูตรคูณแม่ ${divisor} จนเจอ ${dividend}`,
  };
};

// ───────────── Fractions ─────────────

const fracConcept: Generator = (rng, d) => {
  const shape = rng() < 0.5 ? 'circle' : 'bar';
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1:
    case 2:
    case 3: {
      const parts = d === 1 ? randInt(rng, 2, 4) : d === 2 ? randInt(rng, 2, 8) : randInt(rng, 3, 8);
      const shaded = d === 3 ? randInt(rng, 1, parts - 1) : 1;
      return {
        prompt: 'ส่วนที่ระบายสีเป็นเศษส่วนเท่าไรของทั้งหมด?',
        visual: { kind: 'fraction', shape, items: [{ parts, shaded }] },
        options: fractionOptions(rng, shaded, parts),
        answer: fractionText(shaded, parts),
        hint: `นับส่วนที่ระบายสีเป็นตัวเศษ (บน) และนับทุกส่วนเป็นตัวส่วน (ล่าง)`,
      };
    }
    case 4: {
      const parts = randInt(rng, 3, 10);
      const eaten = randInt(rng, 1, parts - 1);
      return {
        prompt: `พิซซ่าถาดหนึ่งแบ่งเป็น ${parts} ชิ้นเท่า ๆ กัน กินไป ${eaten} ชิ้น กินไปเศษส่วนเท่าไรของพิซซ่า?`,
        options: fractionOptions(rng, eaten, parts),
        answer: fractionText(eaten, parts),
        hint: 'ชิ้นที่กินอยู่ข้างบน จำนวนชิ้นทั้งหมดอยู่ข้างล่าง',
      };
    }
    default: {
      const den = randInt(rng, 2, 5);
      const num = randInt(rng, 1, den - 1);
      const whole = den * randInt(rng, 2, 4);
      const answer = (whole / den) * num;
      return {
        prompt: 'เท่ากับเท่าไร?',
        expression: `${fractionText(num, den)} ของ ${whole} = ?`,
        options: numericOptions(rng, answer, 1),
        answer: String(answer),
        hint: `แบ่ง ${whole} เป็น ${den} กองเท่า ๆ กัน แล้วเอามา ${num} กอง`,
      };
    }
  }
};

function greaterFraction(a: [number, number], b: [number, number]): number {
  return a[0] * b[1] - b[0] * a[1];
}

const fracCompare: Generator = (rng, d) => {
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1:
    case 2: {
      const parts = randInt(rng, 3, d === 1 ? 6 : 10);
      const a = randInt(rng, 1, parts - 1);
      let b = randInt(rng, 1, parts - 1);
      while (b === a) b = randInt(rng, 1, parts - 1);
      const fa = fractionText(a, parts);
      const fb = fractionText(b, parts);
      return {
        prompt: 'เศษส่วนไหนมากกว่า?',
        visual:
          d === 1
            ? { kind: 'fraction', shape: 'bar', items: [{ parts, shaded: a, label: fa }, { parts, shaded: b, label: fb }] }
            : undefined,
        options: [fa, fb],
        answer: a > b ? fa : fb,
        hint: 'ตัวส่วนเท่ากัน ดูที่ตัวเศษ ตัวไหนมากกว่าก็มากกว่า',
      };
    }
    case 3: {
      const a = randInt(rng, 2, 10);
      let b = randInt(rng, 2, 10);
      while (b === a) b = randInt(rng, 2, 10);
      const fa = fractionText(1, a);
      const fb = fractionText(1, b);
      return {
        prompt: 'เศษส่วนไหนมากกว่า?',
        visual: { kind: 'fraction', shape: 'bar', items: [{ parts: a, shaded: 1, label: fa }, { parts: b, shaded: 1, label: fb }] },
        options: [fa, fb],
        answer: a < b ? fa : fb,
        hint: 'ยิ่งแบ่งเป็นหลายชิ้น แต่ละชิ้นยิ่งเล็กลง',
      };
    }
    case 4: {
      const parts = randInt(rng, 3, 10);
      const a = randInt(rng, 1, parts - 1);
      const b = rng() < 0.15 ? a : randInt(rng, 1, parts - 1);
      return {
        prompt: 'เติมเครื่องหมายให้ถูกต้อง',
        expression: `${fractionText(a, parts)}  ?  ${fractionText(b, parts)}`,
        options: ['>', '<', '='],
        answer: a > b ? '>' : a < b ? '<' : '=',
        hint: 'ตัวส่วนเท่ากัน ให้เปรียบเทียบตัวเศษ',
      };
    }
    default: {
      const den = randInt(rng, 2, 4);
      const num = randInt(rng, 1, den - 1);
      const k = randInt(rng, 2, 3);
      const target: [number, number] = [num, den];
      const answer = fractionText(num * k, den * k);
      const candidates: [number, number][] = [
        [num * k, den * k + 1],
        [num + k, den + k],
        [num, den * k],
        [num * k + 1, den * k],
        [den - num, den],
      ];
      const distractors = candidates
        .filter(([n, dd]) => n >= 1 && n <= dd && greaterFraction([n, dd], target) !== 0)
        .map(([n, dd]) => fractionText(n, dd))
        .filter((f, i, all) => all.indexOf(f) === i && f !== answer);
      return {
        prompt: 'เศษส่วนไหนเท่ากับ',
        expression: fractionText(num, den),
        options: shuffle(rng, [answer, ...shuffle(rng, distractors).slice(0, 3)]),
        answer,
        hint: 'คูณทั้งตัวเศษและตัวส่วนด้วยเลขเดียวกัน ค่าจะไม่เปลี่ยน',
      };
    }
  }
};

// ───────────── Word problems ─────────────

function story(rng: Rng, ctx: QuestionContext) {
  const pack = themePack(ctx);
  return { name: pick(rng, pack.names), friend: pick(rng, pack.names), item: pick(rng, pack.goods) };
}

const wordAddSub: Generator = (rng, d, ctx) => {
  const { name, item } = story(rng, ctx);
  const { unit } = item;
  const ask = (q: string, answer: number, hint: string): GeneratedQuestion => ({
    prompt: q,
    options: numericOptions(rng, answer),
    answer: String(answer),
    hint,
  });
  const pair = (): [number, number] => {
    switch (Math.min(Math.max(d, 1), 3)) {
      case 1:
        return [randInt(rng, 2, 9), randInt(rng, 1, 9)];
      case 2: {
        const a = randInt(rng, 2, 7) * 10 + randInt(rng, 0, 4);
        return [a, randInt(rng, 1, 2) * 10 + randInt(rng, 0, 4)];
      }
      default:
        return [randInt(rng, 25, 69), randInt(rng, 13, 29)];
    }
  };

  if (d >= 5) {
    const a = randInt(rng, 20, 50);
    const b = randInt(rng, 5, 20);
    const c = randInt(rng, 5, a + b - 5);
    return ask(
      `${name}มี${item.name} ${a} ${unit} แม่ให้เพิ่มอีก ${b} ${unit} แล้วแบ่งให้น้องไป ${c} ${unit} ${name}เหลือ${item.name}กี่${unit}?`,
      a + b - c,
      'ทำทีละขั้น: บวกของที่ได้เพิ่มก่อน แล้วค่อยลบของที่แบ่งไป',
    );
  }
  if (d === 4) {
    const { friend } = story(rng, ctx);
    const a = randInt(rng, 30, 90);
    const b = randInt(rng, 10, a - 5);
    return ask(
      `${name}มี${item.name} ${a} ${unit} ${friend === name ? 'เพื่อน' : friend}มี ${b} ${unit} ${name}มีมากกว่ากี่${unit}?`,
      a - b,
      'มากกว่ากี่… ให้เอาจำนวนที่มากลบด้วยจำนวนที่น้อย',
    );
  }
  const [a, b] = pair();
  if (rng() < 0.5) {
    return ask(
      `${name}มี${item.name} ${a} ${unit} ได้มาเพิ่มอีก ${b} ${unit} ${name}มี${item.name}ทั้งหมดกี่${unit}?`,
      a + b,
      'คำว่า "เพิ่ม" และ "ทั้งหมด" บอกให้เราใช้การบวก',
    );
  }
  const [big, small] = a >= b ? [a, b] : [b, a];
  return ask(
    `${name}มี${item.name} ${big} ${unit} ให้เพื่อนไป ${small} ${unit} ${name}เหลือ${item.name}กี่${unit}?`,
    big - small,
    'คำว่า "ให้ไป" และ "เหลือ" บอกให้เราใช้การลบ',
  );
};

const wordMultDiv: Generator = (rng, d, ctx) => {
  const { name, item } = story(rng, ctx);
  const { unit } = item;
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const boxes = randInt(rng, 2, 5);
      const each = randInt(rng, 2, 5);
      return {
        prompt: `${name}มีกล่อง ${boxes} กล่อง ใส่${item.name}กล่องละ ${each} ${unit} มี${item.name}ทั้งหมดกี่${unit}?`,
        options: factOptions(rng, boxes * each, boxes, each),
        answer: String(boxes * each),
        hint: `${boxes} กล่อง กล่องละ ${each} → ${boxes} × ${each}`,
      };
    }
    case 2: {
      const kids = randInt(rng, 2, 5);
      const each = randInt(rng, 2, 5);
      return {
        prompt: `${name}แบ่ง${item.name} ${kids * each} ${unit} ให้เพื่อน ${kids} คนเท่า ๆ กัน ได้คนละกี่${unit}?`,
        options: numericOptions(rng, each, 1),
        answer: String(each),
        hint: `"แบ่งเท่า ๆ กัน" ใช้การหาร: ${kids * each} ÷ ${kids}`,
      };
    }
    case 3: {
      const count = randInt(rng, 2, 9);
      const price = randInt(rng, 2, 10);
      return {
        prompt: `${name}ซื้อ${item.name} ${count} ${unit} ราคา${unit}ละ ${price} บาท ต้องจ่ายเงินกี่บาท?`,
        options: factOptions(rng, count * price, count, price),
        answer: String(count * price),
        hint: `${count} ${unit} ${unit}ละ ${price} บาท → ${count} × ${price}`,
      };
    }
    case 4: {
      const size = randInt(rng, 2, 9);
      const bags = randInt(rng, 2, 10);
      return {
        prompt: `มี${item.name} ${size * bags} ${unit} ใส่ถุง ถุงละ ${size} ${unit} ได้กี่ถุง?`,
        options: numericOptions(rng, bags, 1),
        answer: String(bags),
        hint: `${size * bags} ÷ ${size}`,
      };
    }
    default: {
      const count = randInt(rng, 2, 6);
      const price = randInt(rng, 3, 9);
      const cost = count * price;
      const paid = cost <= 20 ? 20 : cost <= 50 ? 50 : 100;
      return {
        prompt: `${name}ซื้อ${item.name} ${count} ${unit} ราคา${unit}ละ ${price} บาท จ่ายเงินไป ${paid} บาท จะได้เงินทอนกี่บาท?`,
        options: numericOptions(rng, paid - cost),
        answer: String(paid - cost),
        hint: `หาราคารวมก่อน (${count} × ${price}) แล้วเอา ${paid} ลบราคารวม`,
      };
    }
  }
};

export const PHASE2_GENERATORS: Record<string, Generator> = {
  MULT_CONCEPT: multConcept,
  MULT_TABLES_2_5: timesTable({ easy: [2, 5], all: [2, 3, 4, 5] }),
  MULT_TABLES_6_10: timesTable({ easy: [6, 10], all: [6, 7, 8, 9] }),
  MULT_MULTI_DIGIT: multMultiDigit,
  DIV_CONCEPT: divConcept,
  DIV_BASIC: divBasic,
  FRAC_CONCEPT: fracConcept,
  FRAC_COMPARE: fracCompare,
  WORD_ADD_SUB: wordAddSub,
  WORD_MULT_DIV: wordMultDiv,
};
