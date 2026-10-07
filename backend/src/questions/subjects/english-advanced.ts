// 🔤 English, deeper: numbers, everyday conversation, prepositions, sentences, tenses and reading (K3 → P6).
import { bankGenerator, type BankItem } from '../bank.js';
import type { Generator } from '../kit.js';
import { pick, randInt, shuffle, type Rng } from '../random.js';

function choices(rng: Rng, answer: string, candidates: string[]): string[] {
  const wrong = shuffle(rng, [...new Set(candidates)].filter((c) => c !== answer)).slice(0, 3);
  return shuffle(rng, [answer, ...wrong]);
}

// ───────────── Numbers ─────────────

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

export function numberWord(n: number): string {
  if (n === 100) return 'one hundred';
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  return n % 10 ? `${t}-${ONES[n % 10]}` : t;
}

const numbers: Generator = (rng, d) => {
  const [lo, hi] = [[1, 10], [1, 10], [11, 20], [20, 99], [1, 10]][d - 1];
  if (d === 5) {
    const a = randInt(rng, 1, 9);
    const b = randInt(rng, 1, 10 - a);
    const ans = numberWord(a + b);
    return {
      prompt: 'คิดแล้วตอบเป็นภาษาอังกฤษ',
      expression: `${numberWord(a)} + ${numberWord(b)} = ?`,
      options: choices(rng, ans, [numberWord(a + b + 1), numberWord(Math.max(a + b - 1, 0)), numberWord(a), numberWord(b), numberWord(Math.abs(a - b))]),
      answer: ans,
      hint: `${a} + ${b}`,
    };
  }
  const n = randInt(rng, lo, hi);
  const near = [n + 1, n - 1, n + 10, n - 10, n + 2].filter((x) => x >= lo && x <= Math.max(hi, 20) && x !== n);
  // Teen/ten mix-ups (thirteen vs thirty) are the classic slip.
  if (n >= 13 && n <= 19) near.push((n - 10) * 10);
  if (n % 10 === 0 && n >= 30 && n <= 90) near.push(n / 10 + 10);
  while (new Set(near.filter((x) => x !== n)).size < 3) near.push(randInt(rng, lo, Math.max(hi, 20)));
  if (d === 2 || d === 4) {
    return {
      prompt: `"${numberWord(n)}" คือเลขอะไร?`,
      expression: numberWord(n),
      options: choices(rng, String(n), near.map(String)),
      answer: String(n),
      hint: d === 4 ? 'คำแรกบอกหลักสิบ (twenty = 20, thirty = 30 …) คำหลังบอกหลักหน่วย' : 'ลองนับ one, two, three … ไปเรื่อย ๆ',
    };
  }
  return {
    prompt: `เลข ${n} ภาษาอังกฤษคือคำว่าอะไร?`,
    expression: String(n),
    options: choices(rng, numberWord(n), near.map(numberWord)),
    answer: numberWord(n),
    hint: n >= 13 && n <= 19 ? 'เลข 13–19 ลงท้ายด้วย -teen' : 'ลองนับ one, two, three … ไปเรื่อย ๆ',
  };
};

// ───────────── Everyday conversation ─────────────

const CONVERSATION: BankItem[] = [
  { d: 1, prompt: 'ตอบให้เหมาะสม', expression: 'Hello!', answer: 'Hello!', distractors: ['Goodbye!', 'Thank you.', 'Sorry.'], hint: 'มีคนทักทาย เราก็ทักทายกลับ' },
  { d: 1, prompt: 'ตอบให้เหมาะสม', expression: 'Thank you.', answer: "You're welcome.", distractors: ['Hello!', 'Good night.', 'I am ten.'], hint: 'มีคนขอบคุณ เราตอบว่า "ไม่เป็นไร ยินดี"' },
  { d: 1, prompt: 'ตอบให้เหมาะสม', expression: 'Goodbye!', answer: 'See you!', distractors: ['Nice to meet you.', 'Yes, please.', 'I am fine.'], hint: 'เวลาลากัน' },
  { d: 2, prompt: 'ตอบให้เหมาะสม', expression: 'How are you?', answer: "I'm fine, thank you.", distractors: ["I'm eight.", "It's red.", 'My name is Ben.'], hint: 'ถามว่าสบายดีไหม' },
  { d: 2, prompt: 'ตอบให้เหมาะสม', expression: "What's your name?", answer: 'My name is Ploy.', distractors: ["I'm fine.", "I'm from Thailand.", 'Yes, I do.'], hint: 'name = ชื่อ' },
  { d: 2, prompt: 'ตอบให้เหมาะสม', expression: 'How old are you?', answer: "I'm nine years old.", distractors: ["I'm fine.", 'My name is Tom.', 'It is a cat.'], hint: 'old = อายุ' },
  { d: 3, prompt: 'ตอบให้เหมาะสม', expression: 'Where are you from?', answer: "I'm from Thailand.", distractors: ["I'm ten.", "I'm happy.", 'I like rice.'], hint: 'where = ที่ไหน' },
  { d: 3, prompt: 'ตอบให้เหมาะสม', expression: 'Do you like ice cream?', answer: 'Yes, I do.', distractors: ['Yes, I am.', 'No, it is.', 'I am ice cream.'], hint: 'คำถามขึ้นต้นด้วย Do ตอบด้วย do' },
  { d: 3, prompt: 'ตอบให้เหมาะสม', expression: 'Can you swim?', answer: 'Yes, I can.', distractors: ['Yes, I do.', 'Yes, I am.', 'Yes, it is.'], hint: 'ถามด้วย Can ตอบด้วย can' },
  { d: 3, prompt: 'ตอบให้เหมาะสม', expression: 'Is this your bag?', answer: 'Yes, it is.', distractors: ['Yes, I do.', 'Yes, I can.', 'Yes, they are.'], hint: 'ถามด้วย Is ตอบด้วย is' },
  { d: 4, prompt: 'ตอบให้เหมาะสม', expression: "What's the weather like today?", answer: "It's sunny.", distractors: ["It's Monday.", "It's my pen.", "I'm sunny."], hint: 'weather = อากาศ' },
  { d: 4, prompt: 'ตอบให้เหมาะสม', expression: 'What time is it?', answer: "It's seven o'clock.", distractors: ["It's Tuesday.", "I'm seven.", "It's a clock."], hint: 'time = เวลา' },
  { d: 4, prompt: 'ตอบให้เหมาะสม', expression: 'Would you like some water?', answer: 'Yes, please.', distractors: ['Yes, I would like.', "No, I'm not.", 'You are welcome.'], hint: 'ตอบรับข้อเสนออย่างสุภาพ' },
  { d: 5, prompt: 'ตอบให้เหมาะสม', expression: "I'm sorry I'm late.", answer: "That's OK.", distractors: ["You're welcome.", 'Nice to meet you.', 'Yes, please.'], hint: 'มีคนขอโทษ เราตอบว่าไม่เป็นไร' },
  { d: 5, prompt: 'ตอบให้เหมาะสม', expression: 'Excuse me, where is the library?', answer: "It's next to the canteen.", distractors: ["It's three o'clock.", "I'm a student.", 'I like books.'], hint: 'ถามทาง ต้องตอบเป็นสถานที่' },
  { d: 5, prompt: 'ตอบให้เหมาะสม', expression: 'What do you do on Sundays?', answer: 'I play football with my friends.', distractors: ['I am on Sunday.', 'Sunday is a day.', 'Yes, I do.'], hint: 'ถามว่าทำอะไรวันอาทิตย์' },
];

// ───────────── Prepositions ─────────────

const PREPOSITIONS: BankItem[] = [
  { d: 1, prompt: 'เลือกคำให้ตรงกับภาพ', expression: '🐱📦  The cat is ___ the box.', answer: 'in', distractors: ['on', 'under', 'behind'], hint: 'แมวอยู่ข้างในกล่อง' },
  { d: 1, prompt: 'เลือกคำให้ตรงกับภาพ', expression: '📚 ⬆️ 🪑  The books are ___ the chair.', answer: 'on', distractors: ['in', 'under', 'next to'], hint: 'หนังสือวางอยู่ข้างบน' },
  { d: 1, prompt: 'เลือกคำให้ตรงกับภาพ', expression: '🐶 ⬇️ 🛏️  The dog is ___ the bed.', answer: 'under', distractors: ['on', 'in', 'behind'], hint: 'สุนัขอยู่ข้างใต้' },
  { d: 2, prompt: 'in, on หรือ under?', expression: 'The fish is ___ the water.', answer: 'in', distractors: ['on', 'under', 'at'], hint: 'ปลาอยู่ในน้ำ' },
  { d: 2, prompt: 'in, on หรือ under?', expression: 'The picture is ___ the wall.', answer: 'on', distractors: ['in', 'under', 'at'], hint: 'รูปแขวนติดบนผนัง' },
  { d: 3, prompt: 'เลือกคำให้ถูกต้อง', expression: '🏠🌳  The tree is ___ the house.', answer: 'next to', distractors: ['in', 'under', 'on'], hint: 'ต้นไม้อยู่ข้าง ๆ บ้าน' },
  { d: 3, prompt: 'เลือกคำให้ถูกต้อง', expression: 'The ball is ___ the door. (อยู่หลังประตู)', answer: 'behind', distractors: ['in front of', 'on', 'next to'], hint: 'หลัง = behind' },
  { d: 3, prompt: 'เลือกคำให้ถูกต้อง', expression: 'The car is ___ the house. (อยู่หน้าบ้าน)', answer: 'in front of', distractors: ['behind', 'under', 'in'], hint: 'ข้างหน้า = in front of' },
  { d: 4, prompt: 'เลือกคำให้ถูกต้อง', expression: 'I go to school ___ Monday.', answer: 'on', distractors: ['in', 'at', 'under'], hint: 'ใช้ on กับวัน' },
  { d: 4, prompt: 'เลือกคำให้ถูกต้อง', expression: 'My birthday is ___ May.', answer: 'in', distractors: ['on', 'at', 'behind'], hint: 'ใช้ in กับเดือน' },
  { d: 4, prompt: 'เลือกคำให้ถูกต้อง', expression: 'I wake up ___ 6 o\'clock.', answer: 'at', distractors: ['in', 'on', 'under'], hint: "ใช้ at กับเวลา" },
  { d: 5, prompt: 'เลือกคำให้ถูกต้อง', expression: 'The cat jumped ___ the table and slept there.', answer: 'onto', distractors: ['into', 'under', 'between'], hint: 'กระโดดขึ้นไปอยู่บนโต๊ะ' },
  { d: 5, prompt: 'เลือกคำให้ถูกต้อง', expression: 'The bank is ___ the school and the park.', answer: 'between', distractors: ['behind', 'on', 'in'], hint: 'อยู่ตรงกลางระหว่างสองที่' },
];

// ───────────── Sentence order ─────────────

const SENTENCES: { d: number; words: string[]; th: string }[] = [
  { d: 1, words: ['I', 'like', 'cats.'], th: 'ฉันชอบแมว' },
  { d: 1, words: ['She', 'is', 'happy.'], th: 'เธอมีความสุข' },
  { d: 1, words: ['We', 'play', 'football.'], th: 'พวกเราเล่นฟุตบอล' },
  { d: 2, words: ['I', 'have', 'a', 'red', 'bag.'], th: 'ฉันมีกระเป๋าสีแดง' },
  { d: 2, words: ['The', 'dog', 'is', 'very', 'big.'], th: 'สุนัขตัวใหญ่มาก' },
  { d: 3, words: ['My', 'mother', 'cooks', 'dinner', 'every', 'day.'], th: 'แม่ของฉันทำอาหารเย็นทุกวัน' },
  { d: 3, words: ['They', 'go', 'to', 'school', 'by', 'bus.'], th: 'พวกเขาไปโรงเรียนด้วยรถบัส' },
  { d: 4, words: ['Do', 'you', 'like', 'ice', 'cream?'], th: 'เธอชอบไอศกรีมไหม' },
  { d: 4, words: ['Where', 'is', 'my', 'blue', 'pen?'], th: 'ปากกาสีน้ำเงินของฉันอยู่ที่ไหน' },
  { d: 5, words: ['What', 'did', 'you', 'eat', 'for', 'breakfast?'], th: 'เธอกินอะไรเป็นอาหารเช้า' },
  { d: 5, words: ['I', 'will', 'visit', 'my', 'grandma', 'tomorrow.'], th: 'พรุ่งนี้ฉันจะไปเยี่ยมยาย' },
];

const sentenceOrder: Generator = (rng, d) => {
  let pool = SENTENCES.filter((s) => s.d === d);
  if (!pool.length) pool = SENTENCES.filter((s) => s.d <= d);
  const s = pick(rng, pool);
  const right = s.words.join(' ');
  const wrong = new Set<string>();
  for (let tries = 0; wrong.size < 3 && tries < 80; tries++) {
    const w = shuffle(rng, s.words);
    // In longer sentences keep the capital word first and the punctuation last, so the middle order is what is tested.
    if (w.length >= 5) {
      const first = w.indexOf(s.words[0]);
      [w[0], w[first]] = [w[first], w[0]];
      const last = w.indexOf(s.words[s.words.length - 1]);
      [w[w.length - 1], w[last]] = [w[last], w[w.length - 1]];
    }
    const text = w.join(' ');
    if (text !== right) wrong.add(text);
  }
  return {
    prompt: `ข้อใดเรียงประโยคถูกต้อง? (${s.th})`,
    options: shuffle(rng, [right, ...[...wrong].slice(0, 3)]),
    answer: right,
    hint: d >= 4 ? 'ประโยคคำถาม: คำถาม/กริยาช่วยขึ้นก่อน ตามด้วยประธาน แล้วจึงกริยา' : 'ประโยคบอกเล่า: ประธาน + กริยา + กรรม',
  };
};

// ───────────── Tenses ─────────────

const TENSES: BankItem[] = [
  { d: 1, prompt: 'เลือกคำที่ถูกต้อง (ทำเป็นประจำ)', expression: 'I ___ my teeth every morning.', answer: 'brush', distractors: ['brushes', 'brushing', 'brushed'], hint: 'I ใช้กริยาไม่เติม s' },
  { d: 1, prompt: 'เลือกคำที่ถูกต้อง (ทำเป็นประจำ)', expression: 'My dad ___ coffee every day.', answer: 'drinks', distractors: ['drink', 'drinking', 'drank'], hint: 'He / She / It (my dad) ต้องเติม s' },
  { d: 2, prompt: 'เลือกคำที่ถูกต้อง (กำลังทำอยู่)', expression: 'Look! The baby ___ .', answer: 'is sleeping', distractors: ['sleeps', 'slept', 'sleep'], hint: 'Look! = กำลังเกิดขึ้นตอนนี้ ใช้ is + V-ing' },
  { d: 2, prompt: 'เลือกคำที่ถูกต้อง (กำลังทำอยู่)', expression: 'They ___ football now.', answer: 'are playing', distractors: ['plays', 'is playing', 'played'], hint: 'now = ตอนนี้ They ใช้ are + V-ing' },
  { d: 3, prompt: 'เลือกคำที่ถูกต้อง (เมื่อวาน)', expression: 'I ___ my grandma yesterday.', answer: 'visited', distractors: ['visit', 'visits', 'visiting'], hint: 'yesterday = อดีต เติม ed' },
  { d: 3, prompt: 'เลือกคำที่ถูกต้อง (เมื่อวาน)', expression: 'She ___ to the market last Sunday.', answer: 'went', distractors: ['go', 'goes', 'goed'], hint: 'go ช่อง 2 คือ went' },
  { d: 3, prompt: 'เลือกคำที่ถูกต้อง (เมื่อวาน)', expression: 'We ___ a big fish last week.', answer: 'saw', distractors: ['see', 'sees', 'seed'], hint: 'see ช่อง 2 คือ saw' },
  { d: 4, prompt: 'เลือกคำที่ถูกต้อง (อนาคต)', expression: 'I ___ you tomorrow.', answer: 'will call', distractors: ['called', 'calls', 'am call'], hint: 'tomorrow = อนาคต ใช้ will + กริยาช่อง 1' },
  { d: 4, prompt: 'เลือกคำที่ถูกต้อง (อนาคต)', expression: "It's cloudy. It ___ rain.", answer: 'is going to', distractors: ['went to', 'goes to', 'go to'], hint: 'เห็นเมฆแล้ว รู้ว่าฝนกำลังจะตก ใช้ is going to' },
  { d: 4, prompt: 'เลือกคำที่ถูกต้อง', expression: 'Did you ___ your homework?', answer: 'finish', distractors: ['finished', 'finishes', 'finishing'], hint: 'หลัง Did ใช้กริยาช่อง 1' },
  { d: 5, prompt: 'เลือกคำที่ถูกต้อง', expression: 'I have ___ this movie three times.', answer: 'seen', distractors: ['saw', 'see', 'seeing'], hint: 'have + กริยาช่อง 3 (see → saw → seen)' },
  { d: 5, prompt: 'เลือกคำที่ถูกต้อง', expression: 'While I was reading, the phone ___ .', answer: 'rang', distractors: ['rings', 'ringing', 'is ringing'], hint: 'เหตุการณ์ที่แทรกเข้ามาในอดีตใช้ช่อง 2 (ring → rang)' },
  { d: 5, prompt: 'เลือกคำที่ถูกต้อง', expression: 'She ___ in Bangkok since 2020.', answer: 'has lived', distractors: ['lived', 'lives', 'is live'], hint: 'since = ตั้งแต่อดีตจนถึงตอนนี้ ใช้ has + ช่อง 3' },
];

// ───────────── Reading ─────────────

const STORY_TOM = `Tom has a small brown dog. Its name is Lucky.
Every morning, Tom and Lucky walk in the park.
Lucky likes to run after balls. Tom likes to feed the ducks.`;
const STORY_MALI = `Mali lives in Chiang Mai with her grandparents.
On Saturdays, she helps her grandma at the market.
They sell fruit: mangoes, bananas and oranges.
Mali's favourite fruit is mango.`;
const STORY_TRIP = `Last Sunday, Ben's family went to the beach.
The sky was blue and the sun was hot.
Ben built a big sandcastle with his sister.
In the evening, they ate grilled fish and went home happy.`;
const STORY_SCHOOL = `Nina gets up at six o'clock. She takes a bus to school.
Her first class is English. She loves English because her teacher tells funny stories.
After school, she does her homework and then plays the piano.`;

const READING: BankItem[] = [
  { d: 1, prompt: "What colour is Tom's dog?", visual: { kind: 'passage', text: STORY_TOM }, answer: 'brown', distractors: ['black', 'white', 'yellow'], hint: 'อ่านประโยคแรก: a small ___ dog' },
  { d: 1, prompt: "What is the dog's name?", visual: { kind: 'passage', text: STORY_TOM }, answer: 'Lucky', distractors: ['Tom', 'Ducky', 'Brown'], hint: 'Its name is …' },
  { d: 2, prompt: 'What does Lucky like to do?', visual: { kind: 'passage', text: STORY_TOM }, answer: 'run after balls', distractors: ['feed the ducks', 'sleep all day', 'swim in the lake'], hint: 'Lucky likes to …' },
  { d: 2, prompt: 'Who does Mali live with?', visual: { kind: 'passage', text: STORY_MALI }, answer: 'her grandparents', distractors: ['her parents', 'her teacher', 'her friends'], hint: 'Mali lives in Chiang Mai with …' },
  { d: 3, prompt: 'When does Mali help at the market?', visual: { kind: 'passage', text: STORY_MALI }, answer: 'on Saturdays', distractors: ['every day', 'on Mondays', 'in the evening'], hint: 'On ___, she helps her grandma' },
  { d: 3, prompt: "What is Mali's favourite fruit?", visual: { kind: 'passage', text: STORY_MALI }, answer: 'mango', distractors: ['banana', 'orange', 'apple'], hint: "อ่านประโยคสุดท้าย: Mali's favourite fruit is …" },
  { d: 3, prompt: 'Where did Ben\'s family go?', visual: { kind: 'passage', text: STORY_TRIP }, answer: 'to the beach', distractors: ['to the park', 'to the market', 'to school'], hint: 'went to the …' },
  { d: 4, prompt: 'What was the weather like?', visual: { kind: 'passage', text: STORY_TRIP }, answer: 'sunny and hot', distractors: ['rainy and cold', 'windy', 'snowy'], hint: 'The sky was blue and the sun was hot.' },
  { d: 4, prompt: 'Why does Nina love English?', visual: { kind: 'passage', text: STORY_SCHOOL }, answer: 'Her teacher tells funny stories.', distractors: ['It is easy.', 'She gets up early.', 'She plays the piano.'], hint: 'มองหาคำว่า because' },
  { d: 4, prompt: 'How does Nina go to school?', visual: { kind: 'passage', text: STORY_SCHOOL }, answer: 'by bus', distractors: ['on foot', 'by car', 'by bike'], hint: 'She takes a ___ to school.' },
  { d: 5, prompt: 'How did Ben feel at the end of the day?', visual: { kind: 'passage', text: STORY_TRIP }, answer: 'happy', distractors: ['angry', 'scared', 'bored'], hint: 'went home …' },
  { d: 5, prompt: 'What does Nina do right after school?', visual: { kind: 'passage', text: STORY_SCHOOL }, answer: 'her homework', distractors: ['plays the piano', 'takes a bus', 'has English class'], hint: 'After school, she does … and then …' },
];

export const ENGLISH_ADVANCED_GENERATORS: Record<string, Generator> = {
  EN_NUMBERS: numbers,
  EN_CONVERSATION: bankGenerator(CONVERSATION),
  EN_PREPOSITIONS: bankGenerator(PREPOSITIONS),
  EN_SENTENCES: sentenceOrder,
  EN_TENSES: bankGenerator(TENSES),
  EN_READING: bankGenerator(READING),
};
