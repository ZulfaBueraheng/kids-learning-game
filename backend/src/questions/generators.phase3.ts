// Phase 3 — Advanced Mathematics (P4 → P6): decimals, percentage, ratio, geometry, algebra, problem solving.
import { factOptions, fractionText } from './generators.phase2.js';
import { numericOptions, type GeneratedQuestion, type Generator } from './kit.js';
import { pick, randInt, shuffle, type Rng } from './random.js';
import { themePack } from './themes.js';


export function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

// ───────────── Decimals (worked in hundredths to avoid float errors) ─────────────

/** 347 → "3.47", 340 → "3.4", 300 → "3" */
export function decimalText(hundredths: number): string {
  const sign = hundredths < 0 ? '-' : '';
  const n = Math.abs(hundredths);
  const whole = Math.floor(n / 100);
  const frac = n % 100;
  if (frac === 0) return `${sign}${whole}`;
  if (frac % 10 === 0) return `${sign}${whole}.${frac / 10}`;
  return `${sign}${whole}.${String(frac).padStart(2, '0')}`;
}

/** Distractors are the typical place-value slips: off by one digit, or shifted ×10 / ÷10. */
export function decimalOptions(rng: Rng, answer: number): string[] {
  const unit = answer % 10 === 0 ? 10 : 1;
  const candidates = new Set([
    answer + unit,
    answer - unit,
    answer + 10 * unit,
    answer - 10 * unit,
    answer * 10,
    answer % 10 === 0 ? answer / 10 : answer + 100,
    answer + 100,
  ]);
  candidates.delete(answer);
  const pool = shuffle(rng, [...candidates].filter((c) => c >= 0 && Number.isInteger(c)));
  return shuffle(rng, [answer, ...pool.slice(0, 3)]).map(decimalText);
}

function choices(rng: Rng, answer: string, distractors: string[]): string[] {
  const unique = [...new Set(distractors)].filter((d) => d !== answer);
  return shuffle(rng, [answer, ...shuffle(rng, unique).slice(0, 3)]);
}

const decConcept: Generator = (rng, d) => {
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const tenths = randInt(rng, 1, 9);
      return {
        prompt: 'ส่วนที่ระบายสีเขียนเป็นทศนิยมได้อย่างไร?',
        visual: { kind: 'grid100', shaded: tenths * 10 },
        options: choices(rng, `0.${tenths}`, [`0.0${tenths}`, String(tenths), `0.${10 - tenths}`, `${tenths}.0${tenths}`]),
        answer: `0.${tenths}`,
        hint: 'นับแถวที่ระบาย: 1 แถวคือ 1 ใน 10 ส่วน หรือ 0.1',
      };
    }
    case 2: {
      const n = randInt(rng, 11, 99);
      return {
        prompt: 'ส่วนที่ระบายสีเขียนเป็นทศนิยมได้อย่างไร?',
        visual: { kind: 'grid100', shaded: n },
        options: decimalOptions(rng, n),
        answer: decimalText(n),
        hint: 'ทั้งหมดมี 100 ช่อง ถ้าระบาย 37 ช่องคือ 0.37',
      };
    }
    case 3: {
      const den = pick(rng, [10, 100] as const);
      const num = den === 10 ? randInt(rng, 1, 9) : randInt(rng, 1, 99);
      const answer = den === 10 ? num * 10 : num;
      return {
        prompt: 'เขียนเป็นทศนิยมได้ว่าอย่างไร?',
        expression: fractionText(num, den),
        options: decimalOptions(rng, answer),
        answer: decimalText(answer),
        hint: 'ส่วนสิบ → ทศนิยม 1 ตำแหน่ง, ส่วนร้อย → ทศนิยม 2 ตำแหน่ง',
      };
    }
    case 4: {
      const whole = randInt(rng, 1, 9);
      const t = randInt(rng, 1, 9);
      const h = randInt(rng, 1, 9);
      const value = `0.${t}`;
      return {
        prompt: `ในจำนวน ${whole}.${t}${h} เลข ${t} มีค่าเท่าไร?`,
        options: choices(rng, value, [String(t), `0.0${t}`, `${t}0`, `${t}.${t}`]),
        answer: value,
        hint: 'ตำแหน่งแรกหลังจุดคือหลักส่วนสิบ',
      };
    }
    default: {
      const whole = randInt(rng, 1, 20);
      const t = randInt(rng, 1, 9);
      const h = randInt(rng, 1, 9);
      const answer = whole * 100 + t * 10 + h;
      return {
        prompt: 'รวมกันเป็นจำนวนใด?',
        expression: `${whole} + 0.${t} + 0.0${h} = ?`,
        options: decimalOptions(rng, answer),
        answer: decimalText(answer),
        hint: 'เขียนจำนวนเต็ม แล้วใส่หลักส่วนสิบและหลักส่วนร้อยตามลำดับ',
      };
    }
  }
};

const decCompare: Generator = (rng, d) => {
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const a = randInt(rng, 1, 9);
      let b = randInt(rng, 1, 9);
      while (b === a) b = randInt(rng, 1, 9);
      return {
        prompt: 'ทศนิยมไหนมากกว่า?',
        options: [`0.${a}`, `0.${b}`],
        answer: `0.${Math.max(a, b)}`,
        hint: 'เทียบหลักส่วนสิบ ตัวไหนมากกว่าก็มากกว่า',
      };
    }
    case 2: {
      // The classic trap: 0.5 vs 0.45 — more digits is not bigger.
      const t = randInt(rng, 2, 9);
      const other = (t - 1) * 10 + randInt(rng, 1, 9);
      return {
        prompt: 'ทศนิยมไหนมากกว่า?',
        options: shuffle(rng, [`0.${t}`, decimalText(other)]),
        answer: `0.${t}`,
        hint: `เติม 0 ให้ตำแหน่งเท่ากันก่อน: 0.${t} = 0.${t}0`,
      };
    }
    case 3: {
      const a = randInt(rng, 1, 99);
      const b = rng() < 0.2 ? a : randInt(rng, 1, 99);
      const left = rng() < 0.3 && a % 10 === 0 ? `0.${a / 10}0` : decimalText(a);
      return {
        prompt: 'เติมเครื่องหมายให้ถูกต้อง',
        expression: `${left}  ?  ${decimalText(b)}`,
        options: ['>', '<', '='],
        answer: a > b ? '>' : a < b ? '<' : '=',
        hint: 'เติม 0 ท้ายทศนิยมให้มีตำแหน่งเท่ากัน แล้วเทียบทีละหลัก',
      };
    }
    case 4: {
      const set = new Set<number>();
      while (set.size < 4) set.add(randInt(rng, 1, 99));
      const values = [...set];
      return {
        prompt: 'ทศนิยมไหนมากที่สุด?',
        options: values.map(decimalText),
        answer: decimalText(Math.max(...values)),
        hint: 'ดูหลักส่วนสิบก่อน ถ้าเท่ากันค่อยดูหลักส่วนร้อย',
      };
    }
    default: {
      const set = new Set<number>();
      while (set.size < 3) set.add(randInt(rng, 1, 99));
      const sorted = [...set].sort((a, b) => a - b);
      const line = (xs: number[]) => xs.map(decimalText).join(' < ');
      const answer = line(sorted);
      const [a, b, c] = sorted;
      return {
        prompt: 'ข้อไหนเรียงจากน้อยไปมากถูกต้อง?',
        options: choices(rng, answer, [line([b, a, c]), line([a, c, b]), line([c, b, a]), line([b, c, a])]),
        answer,
        hint: 'หาตัวที่น้อยที่สุดก่อน แล้วค่อย ๆ ไล่ไปตัวที่มากขึ้น',
      };
    }
  }
};

const decAddSub: Generator = (rng, d, ctx) => {
  const ask = (expr: string, answer: number, hint: string): GeneratedQuestion => ({
    prompt: 'คำตอบคือเท่าไร?',
    expression: `${expr} = ?`,
    options: decimalOptions(rng, answer),
    answer: decimalText(answer),
    hint,
  });
  const align = 'ตั้งจุดทศนิยมให้ตรงกัน แล้วบวกลบทีละหลักเหมือนจำนวนนับ';
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const a = randInt(rng, 1, 8);
      const b = randInt(rng, 1, 9 - a);
      return rng() < 0.5
        ? ask(`0.${a} + 0.${b}`, (a + b) * 10, align)
        : ask(`0.${a + b} - 0.${b}`, a * 10, align);
    }
    case 2: {
      const a = randInt(rng, 11, 99) * 10;
      const b = randInt(rng, 3, 9) * 10;
      return rng() < 0.5
        ? ask(`${decimalText(a)} + ${decimalText(b)}`, a + b, align)
        : ask(`${decimalText(a + b)} - ${decimalText(b)}`, a, align);
    }
    case 3: {
      const a = randInt(rng, 101, 999);
      const b = randInt(rng, 11, 99) * 10;
      return ask(`${decimalText(a)} + ${decimalText(b)}`, a + b, align);
    }
    case 4: {
      const a = randInt(rng, 30, 99) * 10;
      const b = randInt(rng, 101, a - 1);
      return ask(`${decimalText(a)} - ${decimalText(b)}`, a - b, 'เติม 0 ให้ตำแหน่งทศนิยมเท่ากันก่อนลบ');
    }
    default: {
      const name = pick(rng, themePack(ctx).names);
      const a = randInt(rng, 5, 25) * 100 + pick(rng, [25, 50, 75]);
      const b = randInt(rng, 5, 20) * 100 + pick(rng, [0, 25, 50, 75]);
      const paid = a + b <= 5000 ? 5000 : 10000;
      const change = paid - a - b;
      return {
        prompt: `${name}ซื้อขนม ${decimalText(a)} บาท และนม ${decimalText(b)} บาท จ่ายเงิน ${paid / 100} บาท ได้เงินทอนกี่บาท?`,
        options: decimalOptions(rng, change),
        answer: decimalText(change),
        hint: 'รวมราคาก่อน แล้วเอาเงินที่จ่ายลบด้วยราคารวม',
      };
    }
  }
};

/** Fraction options that are never equal in value to the answer. */
function fractionChoices(rng: Rng, answer: [number, number], candidates: [number, number][]): string[] {
  const [an, ad] = answer;
  const fresh = candidates
    .filter(([n, dd]) => n >= 1 && dd >= 1 && n * ad !== an * dd)
    .map(([n, dd]) => (dd === 1 ? String(n) : fractionText(n, dd)));
  return choices(rng, ad === 1 ? String(an) : fractionText(an, ad), fresh);
}

const fracAddSub: Generator = (rng, d) => {
  const hint = 'ตัวส่วนเท่ากัน ให้บวกหรือลบเฉพาะตัวเศษ ตัวส่วนคงเดิม';
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1:
    case 3: {
      const den = randInt(rng, 3, 12);
      const a = randInt(rng, 1, den - 2);
      const b = randInt(rng, 1, den - 1 - a);
      return {
        prompt: 'ผลบวกเท่ากับเท่าไร?',
        expression: `${fractionText(a, den)} + ${fractionText(b, den)} = ?`,
        options: fractionChoices(rng, [a + b, den], [
          [a + b, den * 2],
          [a + b + 1, den],
          [a * b, den],
          [Math.abs(a + b - 1), den],
          [a + b, den + 1],
        ]),
        answer: fractionText(a + b, den),
        hint,
      };
    }
    case 2: {
      const den = randInt(rng, 3, 12);
      const a = randInt(rng, 2, den - 1);
      const b = randInt(rng, 1, a - 1);
      return {
        prompt: 'ผลลบเท่ากับเท่าไร?',
        expression: `${fractionText(a, den)} - ${fractionText(b, den)} = ?`,
        options: fractionChoices(rng, [a - b, den], [
          [a - b, den - 1],
          [a + b, den],
          [a - b + 1, den],
          [a - b, den * 2],
        ]),
        answer: fractionText(a - b, den),
        hint,
      };
    }
    case 4: {
      const den = randInt(rng, 2, 6);
      const num = randInt(rng, 1, den - 1);
      const k = randInt(rng, 2, 4);
      const g = gcd(num, den);
      const answer: [number, number] = [num / g, den / g];
      return {
        prompt: 'ทำให้เป็นเศษส่วนอย่างต่ำ',
        expression: fractionText(num * k, den * k),
        options: fractionChoices(rng, answer, [
          [answer[0] + 1, answer[1]],
          [answer[0], answer[1] + 1],
          [num * k, den],
          [answer[1] - answer[0], answer[1]],
          [num, den * k],
        ]),
        answer: fractionText(answer[0], answer[1]),
        hint: 'หารทั้งตัวเศษและตัวส่วนด้วยจำนวนเดียวกันจนหารต่อไม่ได้',
      };
    }
    default: {
      // Denominators where one is a multiple of the other, e.g. 1/2 + 1/4
      const small = randInt(rng, 2, 4);
      const big = small * randInt(rng, 2, 3);
      const a = randInt(rng, 1, small - 1);
      const b = randInt(rng, 1, big - 1 - a * (big / small) > 0 ? big - 1 - a * (big / small) : 1);
      let num = a * (big / small) + b;
      let den = big;
      const g = gcd(num, den);
      num /= g;
      den /= g;
      return {
        prompt: 'ผลบวกเท่ากับเท่าไร? (ตอบเป็นเศษส่วนอย่างต่ำ)',
        expression: `${fractionText(a, small)} + ${fractionText(b, big)} = ?`,
        options: fractionChoices(rng, [num, den], [
          [a + b, small + big],
          [a + b, big],
          [num + 1, den],
          [num, den + 1],
        ]),
        answer: den === 1 ? String(num) : fractionText(num, den),
        hint: `ทำตัวส่วนให้เท่ากันก่อน: ${fractionText(a, small)} = ${fractionText(a * (big / small), big)}`,
      };
    }
  }
};

// ───────────── Percentage ─────────────

const pct = (n: number) => `${n}%`;
function percentOptions(rng: Rng, answer: number): string[] {
  const candidates = [answer + 5, answer - 5, answer + 10, answer - 10, 100 - answer, answer * 2, Math.round(answer / 10)];
  return choices(rng, pct(answer), candidates.filter((c) => c >= 0 && c <= 200).map(pct));
}

const percentConcept: Generator = (rng, d) => {
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const n = randInt(rng, 5, 95);
      return {
        prompt: 'ส่วนที่ระบายสีคิดเป็นกี่เปอร์เซ็นต์?',
        visual: { kind: 'grid100', shaded: n },
        options: percentOptions(rng, n),
        answer: pct(n),
        hint: 'เปอร์เซ็นต์แปลว่า "ต่อร้อย" นับช่องที่ระบายจาก 100 ช่อง',
      };
    }
    case 2: {
      const [num, den] = pick(rng, [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [3, 20]] as const);
      const answer = (num * 100) / den;
      return {
        prompt: 'เขียนเป็นร้อยละ (เปอร์เซ็นต์) ได้เท่าไร?',
        expression: fractionText(num, den),
        options: percentOptions(rng, answer),
        answer: pct(answer),
        hint: `ทำตัวส่วนให้เป็น 100: คูณทั้งบนและล่างด้วย ${100 / den}`,
      };
    }
    case 3: {
      const n = randInt(rng, 1, 99);
      if (rng() < 0.5) {
        return {
          prompt: 'ทศนิยมนี้คิดเป็นกี่เปอร์เซ็นต์?',
          expression: decimalText(n),
          options: percentOptions(rng, n),
          answer: pct(n),
          hint: 'คูณด้วย 100 หรือเลื่อนจุดทศนิยมไปทางขวา 2 ตำแหน่ง',
        };
      }
      return {
        prompt: 'เขียนเป็นทศนิยมได้เท่าไร?',
        expression: pct(n),
        options: decimalOptions(rng, n),
        answer: decimalText(n),
        hint: 'หารด้วย 100 หรือเลื่อนจุดทศนิยมไปทางซ้าย 2 ตำแหน่ง',
      };
    }
    case 4: {
      const total = pick(rng, [10, 20, 25, 50] as const);
      const part = randInt(rng, 1, total - 1);
      const answer = (part * 100) / total;
      return {
        prompt: `ห้องเรียนมีนักเรียน ${total} คน เป็นนักเรียนหญิง ${part} คน นักเรียนหญิงคิดเป็นกี่เปอร์เซ็นต์?`,
        options: percentOptions(rng, answer),
        answer: pct(answer),
        hint: `${part} จาก ${total} → ทำให้เป็น "จาก 100" โดยคูณด้วย ${100 / total}`,
      };
    }
    default: {
      let from: number;
      let rise: number;
      do {
        from = pick(rng, [20, 40, 50, 80, 200]);
        rise = pick(rng, [10, 20, 25, 50]);
      } while ((from * rise) % 100 !== 0);
      const to = from + (from * rise) / 100;
      return {
        prompt: `ราคาขึ้นจาก ${from} บาท เป็น ${to} บาท เพิ่มขึ้นกี่เปอร์เซ็นต์?`,
        options: percentOptions(rng, rise),
        answer: pct(rise),
        hint: 'หาส่วนที่เพิ่มขึ้นก่อน แล้วเทียบกับราคาเดิม × 100',
      };
    }
  }
};

const percentOf: Generator = (rng, d) => {
  const [percents, bases] = [
    [[10, 50], [20, 40, 60, 80, 100, 200, 300]],
    [[20, 25, 75], [40, 80, 100, 120, 200, 400]],
    [[5, 15, 30, 35, 40, 60, 70, 90], [20, 40, 60, 80, 100, 120, 200, 240, 500]],
  ][Math.min(Math.max(d, 1), 3) - 1] as [number[], number[]];
  if (d <= 3) {
    let p: number;
    let n: number;
    do {
      p = pick(rng, percents);
      n = pick(rng, bases);
    } while ((p * n) % 100 !== 0);
    const answer = (p * n) / 100;
    return {
      prompt: 'เท่ากับเท่าไร?',
      expression: `${pct(p)} ของ ${n} = ?`,
      options: numericOptions(rng, answer),
      answer: String(answer),
      hint: `${p}% คือ ${p}/100 → ${n} × ${p} ÷ 100`,
    };
  }
  if (d === 4) {
    const price = randInt(rng, 2, 20) * 100;
    const off = pick(rng, [10, 15, 20, 25, 30, 40, 50]);
    const answer = price - (price * off) / 100;
    return {
      prompt: `เสื้อราคา ${price} บาท ลดราคา ${off}% ต้องจ่ายเงินกี่บาท?`,
      options: choices(rng, String(answer), [String((price * off) / 100), String(price - off), String(answer + 10), String(answer - 10)]),
      answer: String(answer),
      hint: 'หาส่วนลดก่อน แล้วเอาราคาเต็มลบส่วนลด',
    };
  }
  const p = pick(rng, [10, 20, 25, 50]);
  const whole = (100 / p) * randInt(rng, 2, 30);
  const part = (whole * p) / 100;
  return {
    prompt: `${pct(p)} ของจำนวนหนึ่งคือ ${part} จำนวนนั้นคือเท่าไร?`,
    options: numericOptions(rng, whole),
    answer: String(whole),
    hint: `${p}% คือ ${part} ดังนั้น 100% คือ ${part} × ${100 / p}`,
  };
};

// ───────────── Ratio ─────────────

const ratio = (a: number, b: number) => `${a} : ${b}`;
function ratioChoices(rng: Rng, answer: [number, number], candidates: [number, number][]): string[] {
  const [x, y] = answer;
  const fresh = candidates.filter(([a, b]) => a > 0 && b > 0 && a * y !== b * x).map(([a, b]) => ratio(a, b));
  return choices(rng, ratio(x, y), fresh);
}

const PAIRS = [
  { a: { emoji: '🍎', name: 'แอปเปิล' }, b: { emoji: '🍌', name: 'กล้วย' } },
  { a: { emoji: '🐶', name: 'สุนัข' }, b: { emoji: '🐱', name: 'แมว' } },
  { a: { emoji: '⭐', name: 'ดาว' }, b: { emoji: '🌙', name: 'จันทร์' } },
  { a: { emoji: '🚗', name: 'รถยนต์' }, b: { emoji: '🚲', name: 'จักรยาน' } },
] as const;

const ratioConcept: Generator = (rng, d) => {
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const pair = pick(rng, PAIRS);
      // Coprime, different counts: then exactly one option matches the picture.
      let a: number;
      let b: number;
      do {
        a = randInt(rng, 1, 7);
        b = randInt(rng, 1, 7);
      } while (a === b || gcd(a, b) !== 1);
      return {
        prompt: `อัตราส่วนจำนวน${pair.a.name}ต่อ${pair.b.name}เป็นเท่าไร?`,
        visual: {
          kind: 'tally',
          items: [
            { emoji: pair.a.emoji, count: a, label: pair.a.name },
            { emoji: pair.b.emoji, count: b, label: pair.b.name },
          ],
        },
        options: ratioChoices(rng, [a, b], [[b, a], [a, a + b], [a + b, b], [a + 1, b]]),
        answer: ratio(a, b),
        hint: `เขียนจำนวน${pair.a.name}ไว้หน้า : และจำนวน${pair.b.name}ไว้หลัง`,
      };
    }
    case 2: {
      let x = randInt(rng, 1, 6);
      let y = randInt(rng, 1, 6);
      while (gcd(x, y) !== 1 || x === y) {
        x = randInt(rng, 1, 6);
        y = randInt(rng, 1, 6);
      }
      const k = randInt(rng, 2, 6);
      return {
        prompt: 'ทำให้เป็นอัตราส่วนอย่างต่ำ',
        expression: ratio(x * k, y * k),
        options: ratioChoices(rng, [x, y], [[y, x], [x + 1, y], [x, y + 1], [x * k, y]]),
        answer: ratio(x, y),
        hint: 'หารทั้งสองจำนวนด้วยตัวหารร่วมมากที่สุด',
      };
    }
    case 3: {
      let boys = randInt(rng, 1, 9);
      let girls = randInt(rng, 1, 9);
      while (gcd(boys, boys + girls) !== 1) {
        boys = randInt(rng, 1, 9);
        girls = randInt(rng, 1, 9);
      }
      return {
        prompt: `มีเด็กชาย ${boys} คน เด็กหญิง ${girls} คน อัตราส่วนเด็กชายต่อเด็กทั้งหมดเป็นเท่าไร?`,
        options: ratioChoices(rng, [boys, boys + girls], [[boys, girls], [girls, boys + girls], [boys + girls, boys], [boys, boys + girls + 1]]),
        answer: ratio(boys, boys + girls),
        hint: 'เด็กทั้งหมด = เด็กชาย + เด็กหญิง',
      };
    }
    case 4: {
      const x = randInt(rng, 1, 9);
      const y = randInt(rng, 1, 9);
      const k = randInt(rng, 2, 9);
      return {
        prompt: 'เลขอะไรหายไป?',
        expression: `${ratio(x, y)} = ${x * k} : ?`,
        options: factOptions(rng, y * k, y, k),
        answer: String(y * k),
        hint: `${x} คูณ ${k} ได้ ${x * k} ดังนั้น ${y} ก็ต้องคูณ ${k} ด้วย`,
      };
    }
    default: {
      let x = randInt(rng, 1, 5);
      let y = randInt(rng, 2, 7);
      while (gcd(x, y) !== 1 || x === y) {
        x = randInt(rng, 1, 5);
        y = randInt(rng, 2, 7);
      }
      const k = randInt(rng, 2, 4);
      const target = ratio(x * 2, y * 2);
      const m = randInt(rng, 3, 5);
      return {
        prompt: 'อัตราส่วนไหนเท่ากับ',
        expression: target,
        options: ratioChoices(rng, [x * m, y * m], [[x * k + 1, y * k], [y * k, x * k], [x + k, y + k], [x * k, y * k + 1]]),
        answer: ratio(x * m, y * m),
        hint: 'อัตราส่วนที่เท่ากันได้จากการคูณหรือหารทั้งสองจำนวนด้วยเลขเดียวกัน',
      };
    }
  }
};

const ratioProportion: Generator = (rng, d, ctx) => {
  const name = pick(rng, themePack(ctx).names);
  const ask = (prompt: string, answer: number, hint: string): GeneratedQuestion => ({
    prompt,
    options: numericOptions(rng, answer, 1),
    answer: String(answer),
    hint,
  });
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const n = randInt(rng, 2, 6);
      const unit = randInt(rng, 3, 15);
      const m = randInt(rng, 2, 9);
      return ask(
        `ปากกา ${n} ด้าม ราคา ${n * unit} บาท ถ้าซื้อ ${m} ด้าม ต้องจ่ายกี่บาท?`,
        m * unit,
        `หาราคา 1 ด้ามก่อน: ${n * unit} ÷ ${n}`,
      );
    }
    case 2: {
      const flour = randInt(rng, 2, 5);
      const sugar = randInt(rng, 1, 3);
      const k = randInt(rng, 2, 5);
      return ask(
        `สูตรขนมใช้แป้ง ${flour} ถ้วย ต่อน้ำตาล ${sugar} ถ้วย ถ้าใช้แป้ง ${flour * k} ถ้วย ต้องใช้น้ำตาลกี่ถ้วย?`,
        sugar * k,
        `แป้งเพิ่มขึ้น ${k} เท่า น้ำตาลก็ต้องเพิ่ม ${k} เท่า`,
      );
    }
    case 3: {
      const x = randInt(rng, 1, 5);
      const y = randInt(rng, 1, 5);
      const unit = randInt(rng, 2, 20);
      const total = (x + y) * unit;
      return ask(
        `${name}กับเพื่อนแบ่งเงิน ${total} บาท ในอัตราส่วน ${ratio(x, y)} ${name}ได้เงินกี่บาท?`,
        x * unit,
        `แบ่งเงินเป็น ${x + y} ส่วนเท่า ๆ กัน ${name}ได้ ${x} ส่วน`,
      );
    }
    case 4: {
      const scale = pick(rng, [2, 5, 10, 20, 50]);
      const cm = randInt(rng, 2, 12);
      return ask(`แผนที่ใช้มาตราส่วน 1 ซม. : ${scale} กม. ระยะบนแผนที่ ${cm} ซม. ระยะจริงกี่กิโลเมตร?`, cm * scale, `1 ซม. แทน ${scale} กม.`);
    }
    default: {
      const speed = randInt(rng, 4, 12) * 10;
      const h1 = randInt(rng, 2, 4);
      const h2 = randInt(rng, 2, 8);
      return ask(
        `รถวิ่งได้ ${speed * h1} กิโลเมตร ใน ${h1} ชั่วโมง ถ้าวิ่งด้วยอัตราเร็วเท่าเดิม ${h2} ชั่วโมงจะได้กี่กิโลเมตร?`,
        speed * h2,
        'หาระยะทางใน 1 ชั่วโมงก่อน',
      );
    }
  }
};

// ───────────── Geometry ─────────────

const POLYGON_NAMES: Record<number, string> = {
  3: 'รูปสามเหลี่ยม',
  4: 'รูปสี่เหลี่ยม',
  5: 'รูปห้าเหลี่ยม',
  6: 'รูปหกเหลี่ยม',
  8: 'รูปแปดเหลี่ยม',
};

export function angleType(deg: number): string {
  if (deg < 90) return 'มุมแหลม';
  if (deg === 90) return 'มุมฉาก';
  if (deg < 180) return 'มุมป้าน';
  return 'มุมตรง';
}

const SHAPE_FACTS: { q: string; a: number }[] = [
  { q: 'รูปสี่เหลี่ยมจัตุรัสมีมุมฉากกี่มุม?', a: 4 },
  { q: 'รูปสามเหลี่ยมด้านเท่ามีด้านยาวเท่ากันกี่ด้าน?', a: 3 },
  { q: 'รูปหกเหลี่ยมมีกี่มุม?', a: 6 },
  { q: 'รูปสี่เหลี่ยมผืนผ้ามีด้านที่ยาวเท่ากันกี่คู่?', a: 2 },
  { q: 'รูปสามเหลี่ยมมุมฉากมีมุมฉากกี่มุม?', a: 1 },
  { q: 'รูปแปดเหลี่ยมมีกี่ด้าน?', a: 8 },
  { q: 'ลูกบาศก์มีกี่หน้า?', a: 6 },
  { q: 'ลูกบาศก์มีกี่มุม (จุดยอด)?', a: 8 },
];

const geoShapes: Generator = (rng, d) => {
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const sides = randInt(rng, 3, 8);
      return {
        prompt: 'รูปนี้มีกี่ด้าน?',
        visual: { kind: 'polygon', sides },
        options: numericOptions(rng, sides, 3),
        answer: String(sides),
        hint: 'นับเส้นตรงรอบรูปทีละเส้น',
      };
    }
    case 2: {
      const sides = pick(rng, [3, 4, 5, 6, 8]);
      return {
        prompt: 'รูปนี้ชื่ออะไร?',
        visual: { kind: 'polygon', sides },
        options: choices(rng, POLYGON_NAMES[sides], Object.values(POLYGON_NAMES)),
        answer: POLYGON_NAMES[sides],
        hint: 'ชื่อรูปบอกจำนวนเหลี่ยม (มุม) ของรูป',
      };
    }
    case 3: {
      const degrees = pick(rng, [randInt(rng, 20, 80), 90, randInt(rng, 100, 170), 180]);
      return {
        prompt: 'มุมนี้เป็นมุมชนิดใด?',
        visual: { kind: 'angle', degrees },
        options: ['มุมแหลม', 'มุมฉาก', 'มุมป้าน', 'มุมตรง'],
        answer: angleType(degrees),
        hint: 'มุมฉาก = 90° เหมือนมุมกระดาษ, เล็กกว่าคือมุมแหลม, ใหญ่กว่าคือมุมป้าน, 180° คือมุมตรง',
      };
    }
    case 4: {
      const fact = pick(rng, SHAPE_FACTS);
      return { prompt: fact.q, options: numericOptions(rng, fact.a, 0), answer: String(fact.a), hint: 'ลองวาดรูปแล้วนับดู' };
    }
    default: {
      const n = pick(rng, [3, 4, 5, 6, 8]);
      const answer = (n - 2) * 180;
      return {
        prompt: `ผลรวมของมุมภายในของ${POLYGON_NAMES[n]}เท่ากับกี่องศา?`,
        visual: { kind: 'polygon', sides: n },
        options: choices(rng, String(answer), [String(answer + 180), String(Math.max(180, answer - 180)), String(n * 90), String(n * 180), '360']),
        answer: String(answer),
        hint: 'แบ่งรูปเป็นสามเหลี่ยมจากมุมเดียว ได้ (จำนวนด้าน − 2) รูป รูปละ 180°',
      };
    }
  }
};

const geoPerimeterArea: Generator = (rng, d) => {
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const w = randInt(rng, 3, 12);
      const h = randInt(rng, 2, 9);
      return {
        prompt: 'ความยาวรอบรูปเท่ากับกี่เซนติเมตร?',
        visual: { kind: 'rect', width: w, height: h, unit: 'ซม.' },
        options: choices(rng, String(2 * (w + h)), [String(w + h), String(w * h), String(2 * w + h), String(2 * (w + h) + 2)]),
        answer: String(2 * (w + h)),
        hint: 'ความยาวรอบรูป = ด้านทั้งสี่รวมกัน = (กว้าง + ยาว) × 2',
      };
    }
    case 2: {
      const w = randInt(rng, 2, 8);
      const h = randInt(rng, 2, 6);
      return {
        prompt: 'พื้นที่เท่ากับกี่ตารางเซนติเมตร?',
        visual: { kind: 'rect', width: w, height: h, unit: 'ซม.', grid: true },
        options: choices(rng, String(w * h), [String(2 * (w + h)), String(w + h), String(w * h + w), String(w * h - h)]),
        answer: String(w * h),
        hint: 'พื้นที่สี่เหลี่ยมผืนผ้า = กว้าง × ยาว (นับช่องสี่เหลี่ยมเล็กก็ได้)',
      };
    }
    case 3: {
      const s = randInt(rng, 3, 15);
      if (rng() < 0.5) {
        return {
          prompt: `สี่เหลี่ยมจัตุรัสยาวด้านละ ${s} ซม. มีพื้นที่กี่ตารางเซนติเมตร?`,
          options: choices(rng, String(s * s), [String(4 * s), String(2 * s), String(s * s + s), String((s + 1) * (s + 1))]),
          answer: String(s * s),
          hint: 'พื้นที่สี่เหลี่ยมจัตุรัส = ด้าน × ด้าน',
        };
      }
      return {
        prompt: `สี่เหลี่ยมจัตุรัสมีความยาวรอบรูป ${4 * s} ซม. ยาวด้านละกี่เซนติเมตร?`,
        options: numericOptions(rng, s, 1),
        answer: String(s),
        hint: 'สี่เหลี่ยมจัตุรัสมี 4 ด้านยาวเท่ากัน → ความยาวรอบรูป ÷ 4',
      };
    }
    case 4: {
      const w = randInt(rng, 3, 12);
      const h = randInt(rng, 3, 12);
      return {
        prompt: `สี่เหลี่ยมผืนผ้ามีพื้นที่ ${w * h} ตารางเมตร กว้าง ${w} เมตร ยาวกี่เมตร?`,
        options: numericOptions(rng, h, 1),
        answer: String(h),
        hint: 'ยาว = พื้นที่ ÷ กว้าง',
      };
    }
    default: {
      let b = randInt(rng, 4, 20);
      const h = randInt(rng, 3, 15);
      if ((b * h) % 2) b += 1;
      return {
        prompt: `สามเหลี่ยมมีฐานยาว ${b} ซม. สูง ${h} ซม. มีพื้นที่กี่ตารางเซนติเมตร?`,
        options: choices(rng, String((b * h) / 2), [String(b * h), String(b + h), String((b * h) / 2 + h), String(2 * (b + h))]),
        answer: String((b * h) / 2),
        hint: 'พื้นที่สามเหลี่ยม = ½ × ฐาน × สูง',
      };
    }
  }
};

const geoAngles: Generator = (rng, d) => {
  const ask = (prompt: string, answer: number, hint: string, visual?: GeneratedQuestion['visual']): GeneratedQuestion => ({
    prompt,
    visual,
    options: numericOptions(rng, answer, 1),
    answer: String(answer),
    hint,
  });
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const a = randInt(rng, 10, 80);
      return ask(`มุมฉากถูกแบ่งเป็นสองมุม มุมหนึ่งกาง ${a}° อีกมุมกางกี่องศา?`, 90 - a, 'มุมฉาก = 90°');
    }
    case 2: {
      const a = randInt(rng, 20, 160);
      return ask(`มุมบนเส้นตรงมุมหนึ่งกาง ${a}° อีกมุมที่อยู่ติดกันกางกี่องศา?`, 180 - a, 'มุมบนเส้นตรงรวมกันได้ 180°');
    }
    case 3: {
      const a = randInt(rng, 30, 90);
      const b = randInt(rng, 20, 150 - a);
      return ask(
        'มุมที่ไม่ทราบค่าในสามเหลี่ยมนี้กางกี่องศา?',
        180 - a - b,
        'มุมภายในสามเหลี่ยมรวมกันได้ 180°',
        { kind: 'triangle', labels: [`${a}°`, `${b}°`, '?'] },
      );
    }
    case 4: {
      const a = randInt(rng, 60, 150);
      const b = randInt(rng, 40, 300 - a - 20);
      return ask(`มุมรอบจุดหนึ่งมี 3 มุม กาง ${a}° และ ${b}° มุมที่สามกางกี่องศา?`, 360 - a - b, 'มุมรอบจุดรวมกันได้ 360°');
    }
    default: {
      const apex = randInt(rng, 10, 80) * 2;
      return ask(
        `สามเหลี่ยมหน้าจั่วมีมุมยอดกาง ${apex}° มุมที่ฐานแต่ละมุมกางกี่องศา?`,
        (180 - apex) / 2,
        'มุมที่ฐานของสามเหลี่ยมหน้าจั่วเท่ากัน 2 มุม: (180° − มุมยอด) ÷ 2',
      );
    }
  }
};

// ───────────── Algebra ─────────────

const algEquations: Generator = (rng, d) => {
  const box = d <= 2 ? '□' : 'x';
  const ask = (expression: string, answer: number, hint: string): GeneratedQuestion => ({
    prompt: d <= 2 ? 'จำนวนใดแทน □ แล้วทำให้ประโยคเป็นจริง?' : 'หาค่า x',
    expression,
    options: numericOptions(rng, answer, 0),
    answer: String(answer),
    hint,
  });
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const x = randInt(rng, 2, 50);
      const a = randInt(rng, 2, 50);
      return ask(`${box} + ${a} = ${x + a}`, x, `${box} = ${x + a} − ${a}`);
    }
    case 2: {
      if (rng() < 0.5) {
        const x = randInt(rng, 20, 90);
        const a = randInt(rng, 2, x - 1);
        return ask(`${box} − ${a} = ${x - a}`, x, `${box} = ${x - a} + ${a}`);
      }
      const a = randInt(rng, 2, 9);
      const x = randInt(rng, 2, 12);
      return ask(`${a} × ${box} = ${a * x}`, x, `${box} = ${a * x} ÷ ${a}`);
    }
    case 3: {
      const a = randInt(rng, 2, 9);
      const x = a * randInt(rng, 2, 12);
      return ask(`x ÷ ${a} = ${x / a}`, x, `x = ${x / a} × ${a}`);
    }
    case 4: {
      const a = randInt(rng, 2, 6);
      const b = randInt(rng, 1, 20);
      const x = randInt(rng, 2, 15);
      return ask(`${a}x + ${b} = ${a * x + b}`, x, `ลบ ${b} ทั้งสองข้างก่อน แล้วค่อยหารด้วย ${a}`);
    }
    default: {
      const child = randInt(rng, 6, 15);
      const gap = randInt(rng, 20, 35);
      return {
        prompt: `พ่ออายุมากกว่าลูก ${gap} ปี อายุพ่อกับลูกรวมกันได้ ${2 * child + gap} ปี ลูกอายุกี่ปี?`,
        options: numericOptions(rng, child, 1),
        answer: String(child),
        hint: `ให้ลูกอายุ x ปี พ่ออายุ x + ${gap} → x + (x + ${gap}) = ${2 * child + gap}`,
      };
    }
  }
};

const algPatterns: Generator = (rng, d) => {
  const seq = (start: number, next: (v: number) => number, n = 4) => {
    const out = [start];
    while (out.length < n + 1) out.push(next(out[out.length - 1]));
    return out;
  };
  const askNext = (terms: number[], hint: string): GeneratedQuestion => {
    const answer = terms[terms.length - 1];
    return {
      prompt: 'จำนวนถัดไปคืออะไร?',
      expression: `${terms.slice(0, -1).join(', ')}, ?`,
      options: numericOptions(rng, answer, 0),
      answer: String(answer),
      hint,
    };
  };
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const step = randInt(rng, 2, 9);
      return askNext(seq(randInt(rng, 1, 20), (v) => v + step), 'ดูว่าแต่ละจำนวนเพิ่มขึ้นทีละเท่าไร');
    }
    case 2: {
      const step = randInt(rng, 3, 12);
      return askNext(seq(randInt(rng, 60, 100), (v) => v - step), 'ดูว่าแต่ละจำนวนลดลงทีละเท่าไร');
    }
    case 3: {
      const r = pick(rng, [2, 3]);
      return askNext(seq(randInt(rng, 1, 5), (v) => v * r), 'ดูว่าแต่ละจำนวนคูณด้วยเท่าไร');
    }
    case 4: {
      const a = randInt(rng, 2, 9);
      const b = randInt(rng, 1, 15);
      const n = randInt(rng, 2, 10);
      return {
        prompt: `ถ้า n = ${n} แล้ว ${a}n + ${b} มีค่าเท่าไร?`,
        options: numericOptions(rng, a * n + b, 0),
        answer: String(a * n + b),
        hint: `แทน n ด้วย ${n}: ${a} × ${n} + ${b}`,
      };
    }
    default: {
      const step = randInt(rng, 2, 7);
      const first = randInt(rng, 1, 12);
      const k = randInt(rng, 8, 20);
      const answer = first + (k - 1) * step;
      return {
        prompt: `แบบรูปนี้ พจน์ที่ ${k} คือจำนวนใด?`,
        expression: `${[0, 1, 2, 3].map((i) => first + i * step).join(', ')}, …`,
        options: numericOptions(rng, answer, 0),
        answer: String(answer),
        hint: `พจน์ที่ n = ${first} + (n − 1) × ${step}`,
      };
    }
  }
};

// ───────────── Advanced problem solving ─────────────

const psMultiStep: Generator = (rng, d, ctx) => {
  const name = pick(rng, themePack(ctx).names);
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const count = randInt(rng, 2, 5);
      const price = randInt(rng, 10, 40) * 100 + pick(rng, [0, 50]);
      const paid = (Math.floor((count * price) / 10000) + 1) * 10000;
      const change = paid - count * price;
      return {
        prompt: `${name}ซื้อสมุด ${count} เล่ม ราคาเล่มละ ${decimalText(price)} บาท จ่ายเงิน ${paid / 100} บาท ได้เงินทอนกี่บาท?`,
        options: decimalOptions(rng, change),
        answer: decimalText(change),
        hint: 'ขั้นที่ 1: หาราคารวม  ขั้นที่ 2: เงินที่จ่าย − ราคารวม',
      };
    }
    case 2: {
      const price = randInt(rng, 3, 12) * 100;
      const off = pick(rng, [10, 20, 25, 50]);
      const pay = price - (price * off) / 100;
      const paid = pay <= 1000 ? 1000 : 2000;
      return {
        prompt: `รองเท้าราคา ${price} บาท ลดราคา ${off}% ${name}จ่ายเงิน ${paid} บาท ได้เงินทอนกี่บาท?`,
        options: numericOptions(rng, paid - pay),
        answer: String(paid - pay),
        hint: 'หาราคาหลังลดก่อน แล้วค่อยหาเงินทอน',
      };
    }
    case 3: {
      const x = randInt(rng, 1, 4);
      const y = x + randInt(rng, 1, 4);
      const unit = randInt(rng, 5, 30);
      return {
        prompt: `แบ่งลูกแก้ว ${(x + y) * unit} ลูก ให้พี่กับน้องในอัตราส่วน ${ratio(y, x)} พี่ได้มากกว่าน้องกี่ลูก?`,
        options: numericOptions(rng, (y - x) * unit, 1),
        answer: String((y - x) * unit),
        hint: `แบ่งเป็น ${x + y} ส่วน พี่ได้มากกว่า ${y - x} ส่วน`,
      };
    }
    case 4: {
      const w = randInt(rng, 4, 15);
      const h = randInt(rng, 4, 15);
      const cost = randInt(rng, 5, 25);
      return {
        prompt: `สนามรูปสี่เหลี่ยมผืนผ้ากว้าง ${w} เมตร ยาว ${h} เมตร ปูหญ้าตารางเมตรละ ${cost} บาท ต้องจ่ายค่าหญ้ากี่บาท?`,
        options: factOptions(rng, w * h * cost, cost, w),
        answer: String(w * h * cost),
        hint: 'ขั้นที่ 1: พื้นที่ = กว้าง × ยาว  ขั้นที่ 2: พื้นที่ × ราคาต่อตารางเมตร',
      };
    }
    default: {
      const n = 4;
      const avg = randInt(rng, 60, 90);
      const scores = Array.from({ length: n - 1 }, () => avg + randInt(rng, -15, 10));
      const last = avg * n - scores.reduce((s, x) => s + x, 0);
      const all = [...scores, last];
      if (last < 0 || last > 100) return psMultiStep(rng, 4, ctx);
      return {
        prompt: `${name}สอบได้คะแนน ${all.join(', ')} คะแนน เฉลี่ยแล้วได้กี่คะแนน?`,
        options: numericOptions(rng, avg, 0),
        answer: String(avg),
        hint: 'ค่าเฉลี่ย = ผลรวมทั้งหมด ÷ จำนวนวิชา',
      };
    }
  }
};

export const PHASE3_GENERATORS: Record<string, Generator> = {
  DEC_CONCEPT: decConcept,
  DEC_COMPARE: decCompare,
  DEC_ADD_SUB: decAddSub,
  FRAC_ADD_SUB: fracAddSub,
  PERCENT_CONCEPT: percentConcept,
  PERCENT_OF: percentOf,
  RATIO_CONCEPT: ratioConcept,
  RATIO_PROPORTION: ratioProportion,
  GEO_SHAPES: geoShapes,
  GEO_PERIMETER_AREA: geoPerimeterArea,
  GEO_ANGLES: geoAngles,
  ALG_EQUATIONS: algEquations,
  ALG_PATTERNS: algPatterns,
  PS_MULTI_STEP: psMultiStep,
};
