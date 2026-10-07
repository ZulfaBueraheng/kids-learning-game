// 📖 Thai reading — consonants, vowels, reading words, spelling, comprehension (K1 → P3).
import { bankGenerator, type BankItem } from '../bank.js';
import type { Generator } from '../kit.js';
import { pick, randInt, shuffle, type Rng } from '../random.js';

/** The 44 Thai consonants in order, with the word children learn each one by. */
export const CONSONANTS: { letter: string; word: string; emoji?: string }[] = [
  { letter: 'ก', word: 'ไก่', emoji: '🐔' },
  { letter: 'ข', word: 'ไข่', emoji: '🥚' },
  { letter: 'ฃ', word: 'ขวด' },
  { letter: 'ค', word: 'ควาย', emoji: '🐃' },
  { letter: 'ฅ', word: 'คน' },
  { letter: 'ฆ', word: 'ระฆัง', emoji: '🔔' },
  { letter: 'ง', word: 'งู', emoji: '🐍' },
  { letter: 'จ', word: 'จาน', emoji: '🍽️' },
  { letter: 'ฉ', word: 'ฉิ่ง' },
  { letter: 'ช', word: 'ช้าง', emoji: '🐘' },
  { letter: 'ซ', word: 'โซ่', emoji: '⛓️' },
  { letter: 'ฌ', word: 'เฌอ', emoji: '🌳' },
  { letter: 'ญ', word: 'หญิง', emoji: '👩' },
  { letter: 'ฎ', word: 'ชฎา' },
  { letter: 'ฏ', word: 'ปฏัก' },
  { letter: 'ฐ', word: 'ฐาน' },
  { letter: 'ฑ', word: 'มณโฑ' },
  { letter: 'ฒ', word: 'ผู้เฒ่า', emoji: '👴' },
  { letter: 'ณ', word: 'เณร' },
  { letter: 'ด', word: 'เด็ก', emoji: '👦' },
  { letter: 'ต', word: 'เต่า', emoji: '🐢' },
  { letter: 'ถ', word: 'ถุง', emoji: '🛍️' },
  { letter: 'ท', word: 'ทหาร', emoji: '💂' },
  { letter: 'ธ', word: 'ธง', emoji: '🚩' },
  { letter: 'น', word: 'หนู', emoji: '🐭' },
  { letter: 'บ', word: 'ใบไม้', emoji: '🍃' },
  { letter: 'ป', word: 'ปลา', emoji: '🐟' },
  { letter: 'ผ', word: 'ผึ้ง', emoji: '🐝' },
  { letter: 'ฝ', word: 'ฝา' },
  { letter: 'พ', word: 'พาน' },
  { letter: 'ฟ', word: 'ฟัน', emoji: '🦷' },
  { letter: 'ภ', word: 'สำเภา', emoji: '⛵' },
  { letter: 'ม', word: 'ม้า', emoji: '🐴' },
  { letter: 'ย', word: 'ยักษ์', emoji: '👹' },
  { letter: 'ร', word: 'เรือ', emoji: '🚣' },
  { letter: 'ล', word: 'ลิง', emoji: '🐒' },
  { letter: 'ว', word: 'แหวน', emoji: '💍' },
  { letter: 'ศ', word: 'ศาลา' },
  { letter: 'ษ', word: 'ฤๅษี' },
  { letter: 'ส', word: 'เสือ', emoji: '🐯' },
  { letter: 'ห', word: 'หีบ', emoji: '📦' },
  { letter: 'ฬ', word: 'จุฬา', emoji: '🪁' },
  { letter: 'อ', word: 'อ่าง', emoji: '🛁' },
  { letter: 'ฮ', word: 'นกฮูก', emoji: '🦉' },
];

const COMMON = CONSONANTS.filter((c) => c.emoji);

function choices(rng: Rng, answer: string, pool: string[]): string[] {
  return shuffle(rng, [answer, ...shuffle(rng, [...new Set(pool)].filter((p) => p !== answer)).slice(0, 3)]);
}

const consonants: Generator = (rng, d) => {
  switch (Math.min(Math.max(d, 1), 5)) {
    case 1: {
      const c = pick(rng, COMMON);
      return {
        prompt: `"${c.letter} ${c.word}" คือภาพใด?`,
        expression: c.letter,
        options: choices(rng, c.emoji!, COMMON.map((x) => x.emoji!)),
        answer: c.emoji!,
        hint: `${c.letter} ${c.word} — นึกภาพ${c.word}`,
      };
    }
    case 2: {
      const c = pick(rng, COMMON);
      return {
        prompt: `ภาพนี้คือ "${c.word}" ใช้พยัญชนะตัวใด?`,
        expression: c.emoji,
        options: choices(rng, c.letter, COMMON.map((x) => x.letter)),
        answer: c.letter,
        hint: `ท่อง ก ไก่ ข ไข่ … จนถึง ${c.word}`,
      };
    }
    case 3:
    case 4: {
      const after = d === 3;
      const i = after ? randInt(rng, 0, CONSONANTS.length - 2) : randInt(rng, 1, CONSONANTS.length - 1);
      const target = CONSONANTS[after ? i + 1 : i - 1];
      const near = CONSONANTS.slice(Math.max(0, i - 4), i + 5).map((c) => c.letter);
      return {
        prompt: after ? 'พยัญชนะตัวถัดไปคือตัวใด?' : 'พยัญชนะตัวก่อนหน้าคือตัวใด?',
        expression: after ? `${CONSONANTS[i].letter} → ?` : `? → ${CONSONANTS[i].letter}`,
        options: choices(rng, target.letter, near),
        answer: target.letter,
        hint: 'ท่อง ก–ฮ ช้า ๆ ตามลำดับ',
      };
    }
    default: {
      const c = pick(rng, CONSONANTS.filter((x) => !x.emoji));
      return {
        prompt: `"${c.letter}" คือ ${c.letter} อะไร?`,
        expression: c.letter,
        options: choices(rng, c.word, CONSONANTS.filter((x) => !x.emoji).map((x) => x.word)),
        answer: c.word,
        hint: 'นึกถึงเพลง ก ไก่ ที่เคยร้อง',
      };
    }
  }
};

const VOWELS: BankItem[] = [
  { d: 1, prompt: 'คำนี้ใช้สระอะไร?', expression: 'ตา', answer: 'สระอา', distractors: ['สระอี', 'สระอู', 'สระโอ'], hint: 'ตา ออกเสียง ต + อา' },
  { d: 1, prompt: 'คำนี้ใช้สระอะไร?', expression: 'ปู', answer: 'สระอู', distractors: ['สระอา', 'สระอี', 'สระอุ'], hint: 'สระอยู่ใต้พยัญชนะ' },
  { d: 1, prompt: 'คำนี้ใช้สระอะไร?', expression: 'ดี', answer: 'สระอี', distractors: ['สระอิ', 'สระอา', 'สระอู'], hint: 'สระอยู่บนพยัญชนะ ออกเสียงยาว' },
  { d: 2, prompt: 'คำนี้ใช้สระอะไร?', expression: 'โต', answer: 'สระโอ', distractors: ['สระเอ', 'สระแอ', 'สระอา'], hint: 'สระอยู่หน้าพยัญชนะ' },
  { d: 2, prompt: 'คำนี้ใช้สระอะไร?', expression: 'แม่', answer: 'สระแอ', distractors: ['สระเอ', 'สระโอ', 'สระอา'], hint: 'มีเส้นสองเส้นหน้าพยัญชนะ' },
  { d: 2, prompt: 'คำนี้ใช้สระอะไร?', expression: 'มือ', answer: 'สระอือ', distractors: ['สระอื', 'สระอี', 'สระอู'], hint: 'มีตัว อ ตามหลัง' },
  { d: 3, prompt: 'คำนี้ใช้สระอะไร?', expression: 'ไก่', answer: 'สระไอ ไม้มลาย', distractors: ['สระใอ ไม้ม้วน', 'สระเอ', 'สระอา'], hint: 'หางสระยาวตรง ไม่ม้วน' },
  { d: 3, prompt: 'คำนี้ใช้สระอะไร?', expression: 'ใจ', answer: 'สระใอ ไม้ม้วน', distractors: ['สระไอ ไม้มลาย', 'สระเอ', 'สระอำ'], hint: 'หางสระม้วนเป็นวง' },
  { d: 4, prompt: 'คำนี้ใช้สระอะไร?', expression: 'น้ำ', answer: 'สระอำ', distractors: ['สระอา', 'สระอะ', 'สระใอ'], hint: 'มีวงกลมเล็ก ๆ อยู่ด้านบน' },
  { d: 4, prompt: 'คำนี้ใช้สระอะไร?', expression: 'เตะ', answer: 'สระเอะ', distractors: ['สระเอ', 'สระแอะ', 'สระอะ'], hint: 'ออกเสียงสั้น มี ะ ตามหลัง' },
  { d: 5, prompt: 'คำนี้ใช้สระอะไร?', expression: 'เสือ', answer: 'สระเอือ', distractors: ['สระเอีย', 'สระอือ', 'สระเอ'], hint: 'มี เ- หน้า และ -ือ หลังพยัญชนะ' },
  { d: 5, prompt: 'คำนี้ใช้สระอะไร?', expression: 'เมีย', answer: 'สระเอีย', distractors: ['สระเอือ', 'สระอี', 'สระเอ'], hint: 'มี เ- หน้า และ -ีย หลังพยัญชนะ' },
  { d: 1, prompt: 'คำนี้ใช้สระอะไร?', expression: 'หู', answer: 'สระอู', distractors: ['สระอุ', 'สระอา', 'สระอี'], hint: 'สระอยู่ใต้พยัญชนะ ออกเสียงยาว' },
  { d: 1, prompt: 'คำนี้ใช้สระอะไร?', expression: 'มี', answer: 'สระอี', distractors: ['สระอิ', 'สระอือ', 'สระอา'], hint: 'สระอยู่บนพยัญชนะ ออกเสียงยาว' },
  { d: 2, prompt: 'คำนี้ใช้สระอะไร?', expression: 'เด็ก', answer: 'สระเอะ (ลดรูป)', distractors: ['สระเอ', 'สระแอ', 'สระโอ'], hint: 'ออกเสียงสั้น มีไม้ไต่คู้ ( ็) แทน ะ' },
  { d: 2, prompt: 'คำนี้ใช้สระอะไร?', expression: 'จุด', answer: 'สระอุ', distractors: ['สระอู', 'สระอิ', 'สระอะ'], hint: 'ขีดสั้นใต้พยัญชนะ ออกเสียงสั้น' },
  { d: 3, prompt: 'คำนี้ใช้สระอะไร?', expression: 'กิน', answer: 'สระอิ', distractors: ['สระอี', 'สระอึ', 'สระอุ'], hint: 'สระบนพยัญชนะ ออกเสียงสั้น' },
  { d: 3, prompt: 'คำใดใช้สระเดียวกับคำว่า "ตา"?', answer: 'นา', distractors: ['ตี', 'ตู', 'โต'], hint: 'ฟังเสียงท้าย -า' },
  { d: 4, prompt: 'คำนี้ใช้สระอะไร?', expression: 'เรือ', answer: 'สระเอือ', distractors: ['สระเอีย', 'สระอือ', 'สระอัว'], hint: 'มี เ- หน้า และ -ือ หลัง' },
  { d: 4, prompt: 'คำนี้ใช้สระอะไร?', expression: 'ตัว', answer: 'สระอัว', distractors: ['สระเอือ', 'สระอู', 'สระโอ'], hint: 'มีไม้หันอากาศและ ว' },
  { d: 5, prompt: 'คำว่า "ขวด" มีสระอะไร (สระลดรูป)?', expression: '🍾', answer: 'สระอัว', distractors: ['สระอะ', 'สระอู', 'สระโอะ'], hint: 'มีตัวสะกด ไม้หันอากาศจึงหายไป เหลือแค่ ว' },
  { d: 5, prompt: 'คำว่า "คน" มีสระอะไร (สระลดรูป)?', expression: '🧍', answer: 'สระโอะ', distractors: ['สระโอ', 'สระอะ', 'สระเอาะ'], hint: 'ค + โอะ + น สะกด เมื่อมีตัวสะกด สระโอะหายไป' },
];

const WORDS: BankItem[] = [
  { d: 1, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🐟', answer: 'ปลา', distractors: ['ปา', 'ปู', 'ปลี'], hint: 'ป + ล + อา' },
  { d: 1, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🦀', answer: 'ปู', distractors: ['ปา', 'ปี', 'ผู้'], hint: 'ป + อู' },
  { d: 1, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🐶', answer: 'หมา', distractors: ['หมี', 'มา', 'หมู'], hint: 'ห นำ ม + อา' },
  { d: 2, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🐱', answer: 'แมว', distractors: ['แมง', 'เมว', 'แมน'], hint: 'สระแอ + ว สะกด' },
  { d: 2, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '⭐', answer: 'ดาว', distractors: ['ดาน', 'ตาว', 'ดาม'], hint: 'ด + อา + ว' },
  { d: 2, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🚗', answer: 'รถ', distractors: ['รด', 'รส', 'รต'], hint: 'ร + ถ สะกด' },
  { d: 3, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🏠', answer: 'บ้าน', distractors: ['บาน', 'บ่าน', 'ป้าน'], hint: 'มีไม้โท' },
  { d: 3, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🍚', answer: 'ข้าว', distractors: ['ขาว', 'ข่าว', 'ค้าว'], hint: 'มีไม้โท' },
  { d: 4, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🐘', answer: 'ช้าง', distractors: ['ช่าง', 'ซ้าง', 'ชาง'], hint: 'ช + อา + ง สะกด + ไม้โท' },
  { d: 4, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🌳', answer: 'ต้นไม้', distractors: ['ต้นใม้', 'ตนไม้', 'ต้นไม่'], hint: 'ไม้ ใช้สระไอ ไม้มลาย' },
  { d: 5, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🌙', answer: 'ดวงจันทร์', distractors: ['ดวงจัน', 'ดวงจันท์', 'ดวงจันทน์'], hint: 'จันทร์ มี ทร และการันต์' },
  { d: 5, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🌧️', answer: 'ฝนตก', distractors: ['ฝ่นตก', 'ผนตก', 'ฟนตก'], hint: 'ฝ ฝา' },
  { d: 1, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🐝', answer: 'ผึ้ง', distractors: ['ผิ้ง', 'พึ้ง', 'ผึง'], hint: 'ผ + อึ + ง + ไม้โท' },
  { d: 1, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '👁️', answer: 'ตา', distractors: ['ตี', 'ดา', 'ตู'], hint: 'ต + อา' },
  { d: 2, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🐍', answer: 'งู', distractors: ['งา', 'หงู', 'ปู'], hint: 'ง + อู' },
  { d: 2, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🌙', answer: 'ดวงจันทร์', distractors: ['ดวงจัน', 'ดวงจันท์', 'ดวงจรรย์'], hint: 'จันทร์ มี ทร์ การันต์' },
  { d: 3, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🐯', answer: 'เสือ', distractors: ['เสีย', 'เสื่อ', 'เศือ'], hint: 'ส + เอือ' },
  { d: 3, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🍌', answer: 'กล้วย', distractors: ['กล่วย', 'กวย', 'กร้วย'], hint: 'ก ล ควบกล้ำ + อัว + ย + ไม้โท' },
  { d: 4, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🦋', answer: 'ผีเสื้อ', distractors: ['พีเสื้อ', 'ผีเสือ', 'ผีเศื้อ'], hint: 'ผี + เสื้อ (มีไม้โท)' },
  { d: 4, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🐊', answer: 'จระเข้', distractors: ['จรเข้', 'จะเข้', 'จระเค้'], hint: 'จ-ระ-เข้' },
  { d: 5, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🌈', answer: 'รุ้งกินน้ำ', distractors: ['รุ่งกินน้ำ', 'รุ้งกินนำ', 'รุงกินน้ำ'], hint: 'รุ้ง มีไม้โท' },
  { d: 5, prompt: 'ภาพนี้อ่านว่าอะไร?', expression: '🍦', answer: 'ไอศกรีม', distractors: ['ไอศครีม', 'ไอสกรีม', 'ไอติมครีม'], hint: 'ไอ-ศก-รีม' },
];

const SPELLING: BankItem[] = [
  { d: 1, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'ผลไม้', distractors: ['ผลใม้', 'ผนไม้', 'พลไม้'], hint: 'ไม้ ใช้ไม้มลาย' },
  { d: 2, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'กะเพรา', distractors: ['กระเพรา', 'กะเพา', 'กระเพา'], hint: 'ใบกะเพรา ไม่มี ร ที่ "กะ"' },
  { d: 2, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'คุกกี้', distractors: ['คุ้กกี้', 'คุกกี่', 'คุ๊กกี้'], hint: 'มีไม้โทที่ "กี้" ตัวเดียว' },
  { d: 3, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'ไอศกรีม', distractors: ['ไอศครีม', 'ไอสกรีม', 'ไอติมครีม'], hint: 'ไอ-ศก-รีม' },
  { d: 3, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'สับปะรด', distractors: ['สัปปะรด', 'สับปะรส', 'สัปรด'], hint: 'สับ-ปะ-รด' },
  { d: 4, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'โทรศัพท์', distractors: ['โทรศัพ', 'โทรสัพท์', 'โทรศัพย์'], hint: 'ศัพท์ มี ท การันต์' },
  { d: 4, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'ศีรษะ', distractors: ['ศรีษะ', 'ศีรษา', 'ศีษะ'], hint: 'ศีร-ษะ (สระอีอยู่บน ศ)' },
  { d: 5, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'อนุญาต', distractors: ['อนุญาติ', 'อนุญาด', 'อนุยาต'], hint: 'ไม่มีสระอิท้ายคำ' },
  { d: 5, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'กะทันหัน', distractors: ['กระทันหัน', 'กะทันหัล', 'กระทันหันท์'], hint: 'กะ ไม่มี ร' },
  { d: 1, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'กะทิ', distractors: ['กระทิ', 'กะที', 'กติ'], hint: 'กะ-ทิ' },
  { d: 1, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'ทะเล', distractors: ['ทเล', 'ทะเร', 'ธะเล'], hint: 'ทะ-เล ใช้ ท ทหาร' },
  { d: 2, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'กระดาษ', distractors: ['กระดาด', 'กะดาษ', 'กระดาศ'], hint: 'ดาษ ใช้ ษ ฤๅษี' },
  { d: 2, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'ลูกเกด', distractors: ['ลูกเกตุ', 'ลูกเกษ', 'ลูกเกจ'], hint: 'เกด ใช้ ด สะกด' },
  { d: 3, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'บิณฑบาต', distractors: ['บิณฑบาตร', 'บินทบาต', 'บิณฑบาท'], hint: 'บาต ไม่มี ร' },
  { d: 3, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'เกล็ดปลา', distractors: ['เกร็ดปลา', 'เกล็ดปา', 'เกล้ดปลา'], hint: 'เกล็ด ใช้ ล' },
  { d: 4, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'สังเกต', distractors: ['สังเกตุ', 'สังเกด', 'สังเกจ'], hint: 'ไม่มีสระอุท้ายคำ' },
  { d: 4, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'ผลัดกัน', distractors: ['ผัดกัน', 'ผลักกัน', 'พลัดกัน'], hint: 'ผลัด = เปลี่ยนกันทำ' },
  { d: 5, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'โอกาส', distractors: ['โอกาศ', 'โอกาษ', 'โอกาด'], hint: 'กาส ใช้ ส เสือ' },
  { d: 5, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'ประณีต', distractors: ['ปราณีต', 'ประนีต', 'ประณีด'], hint: 'ประ-ณีต ใช้ ณ เณร' },
  { d: 5, prompt: 'ข้อใดเขียนถูกต้อง?', answer: 'ผาสุก', distractors: ['ผาสุข', 'พาสุก', 'ผาศุก'], hint: 'ผาสุก ใช้ ก สะกด' },
];

const COMPREHENSION: BankItem[] = [
  {
    d: 1,
    prompt: 'อ่านแล้วตอบคำถาม: ใครซื้อส้ม?',
    visual: { kind: 'passage', text: 'แม่ซื้อส้มมา 3 ผล ให้น้องมะลิ' },
    answer: 'แม่',
    distractors: ['น้องมะลิ', 'พ่อ', 'คุณครู'],
    hint: 'อ่านคำแรกของประโยคดี ๆ',
  },
  {
    d: 2,
    prompt: 'อ่านแล้วตอบคำถาม: แมวนอนอยู่ที่ไหน?',
    visual: { kind: 'passage', text: 'เจ้าส้มเป็นแมวสีส้ม ชอบนอนอยู่ใต้โต๊ะในห้องครัว ตอนเช้ามันจะไปนั่งรับแดดที่หน้าต่าง' },
    answer: 'ใต้โต๊ะ',
    distractors: ['บนหน้าต่าง', 'ในสวน', 'บนเตียง'],
    hint: 'หาคำว่า "นอน" ในเรื่อง',
  },
  {
    d: 3,
    prompt: 'อ่านแล้วตอบคำถาม: ทำไมต้นกล้าจึงนำร่มไปโรงเรียน?',
    visual: { kind: 'passage', text: 'เช้านี้ท้องฟ้ามืดครึ้ม มีเมฆดำเต็มฟ้า แม่จึงบอกต้นกล้าให้นำร่มไปโรงเรียนด้วย' },
    answer: 'เพราะฝนอาจจะตก',
    distractors: ['เพราะแดดร้อน', 'เพราะร่มสวย', 'เพราะเพื่อนขอยืม'],
    hint: 'เมฆดำบอกอะไรเรา?',
  },
  {
    d: 4,
    prompt: 'อ่านแล้วตอบคำถาม: ใจความสำคัญของเรื่องนี้คืออะไร?',
    visual: {
      kind: 'passage',
      text: 'มดหลายร้อยตัวช่วยกันขนเศษขนมกลับรัง แม้ขนมจะใหญ่กว่าตัวมดมาก แต่เมื่อทุกตัวช่วยกัน ก็ขนกลับไปได้สำเร็จ',
    },
    answer: 'ความสามัคคีทำให้งานสำเร็จ',
    distractors: ['มดชอบกินขนม', 'ขนมมีขนาดใหญ่', 'รังมดอยู่ไกล'],
    hint: 'เรื่องนี้สอนอะไรเรา?',
  },
  {
    d: 5,
    prompt: 'อ่านแล้วตอบคำถาม: ข้อใดเป็น "ความคิดเห็น" ไม่ใช่ข้อเท็จจริง?',
    visual: {
      kind: 'passage',
      text: 'ช้างเป็นสัตว์บกที่ใหญ่ที่สุด ช้างกินพืชเป็นอาหาร ฉันคิดว่าช้างเป็นสัตว์ที่น่ารักที่สุดในโลก',
    },
    answer: 'ช้างเป็นสัตว์ที่น่ารักที่สุดในโลก',
    distractors: ['ช้างเป็นสัตว์บกที่ใหญ่ที่สุด', 'ช้างกินพืชเป็นอาหาร', 'ช้างเป็นสัตว์บก'],
    hint: 'ความคิดเห็นมักมีคำว่า "ฉันคิดว่า"',
  },
  {
    d: 1,
    prompt: 'อ่านแล้วตอบคำถาม: ครอบครัวของมิวไปที่ไหน?',
    visual: { kind: 'passage', text: 'วันอาทิตย์ ครอบครัวของมิวไปปิกนิกที่สวนสาธารณะ แม่เตรียมข้าวเหนียวไก่ทอด พ่อพาลูกบอลไปด้วย มิวกับน้องเล่นลูกบอลกันอย่างสนุกสนาน' },
    answer: 'สวนสาธารณะ',
    distractors: ['ทะเล', 'ตลาด', 'โรงเรียน'],
    hint: 'อ่านประโยคแรก',
  },
  {
    d: 1,
    prompt: 'อ่านแล้วตอบคำถาม: ใครช่วยคุณยายรดน้ำผัก?',
    visual: { kind: 'passage', text: 'คุณยายปลูกผักบุ้งไว้หลังบ้าน ทุกเช้าต้นกล้าจะช่วยคุณยายรดน้ำ เมื่อผักโตแล้ว คุณยายนำผักบุ้งไปผัดให้ทุกคนกิน ต้นกล้าภูมิใจมาก' },
    answer: 'ต้นกล้า',
    distractors: ['คุณยาย', 'คุณแม่', 'มิว'],
    hint: 'ทุกเช้า ใครช่วยคุณยาย',
  },
  {
    d: 2,
    prompt: 'อ่านแล้วตอบคำถาม: แม่เตรียมอาหารอะไร?',
    visual: { kind: 'passage', text: 'วันอาทิตย์ ครอบครัวของมิวไปปิกนิกที่สวนสาธารณะ แม่เตรียมข้าวเหนียวไก่ทอด พ่อพาลูกบอลไปด้วย มิวกับน้องเล่นลูกบอลกันอย่างสนุกสนาน' },
    answer: 'ข้าวเหนียวไก่ทอด',
    distractors: ['ผัดผักบุ้ง', 'ขนมปัง', 'ส้มตำ'],
    hint: 'หาคำว่า "แม่เตรียม"',
  },
  {
    d: 2,
    prompt: 'อ่านแล้วตอบคำถาม: ภูผาเก็บอะไรได้?',
    visual: { kind: 'passage', text: 'ภูผาเก็บกระเป๋าสตางค์ได้ที่หน้าโรงเรียน ข้างในมีเงินและบัตรนักเรียนของพี่ชั้น ป.6 ภูผานำกระเป๋าไปให้คุณครู คุณครูชมว่าภูผาเป็นเด็กซื่อสัตย์' },
    answer: 'กระเป๋าสตางค์',
    distractors: ['ลูกบอล', 'หนังสือ', 'ร่ม'],
    hint: 'อ่านประโยคแรก',
  },
  {
    d: 3,
    prompt: 'อ่านแล้วตอบคำถาม: ทำไมต้นกล้าจึงภูมิใจ?',
    visual: { kind: 'passage', text: 'คุณยายปลูกผักบุ้งไว้หลังบ้าน ทุกเช้าต้นกล้าจะช่วยคุณยายรดน้ำ เมื่อผักโตแล้ว คุณยายนำผักบุ้งไปผัดให้ทุกคนกิน ต้นกล้าภูมิใจมาก' },
    answer: 'เพราะได้ช่วยปลูกผักจนได้กิน',
    distractors: ['เพราะได้เล่นบอล', 'เพราะได้เงิน', 'เพราะคุณครูชม'],
    hint: 'ต้นกล้าช่วยรดน้ำทุกวัน แล้วผลเป็นอย่างไร',
  },
  {
    d: 3,
    prompt: 'อ่านแล้วตอบคำถาม: ลูกเต่าคลานไปที่ไหนเมื่อฟักออกจากไข่?',
    visual: { kind: 'passage', text: 'เต่าทะเลวางไข่บนชายหาดในเวลากลางคืน เมื่อลูกเต่าฟักออกจากไข่ พวกมันจะคลานลงสู่ทะเลทันที แสงไฟจากบ้านเรือนริมหาดอาจทำให้ลูกเต่าหลงทาง' },
    answer: 'ลงสู่ทะเล',
    distractors: ['เข้าบ้าน', 'ขึ้นภูเขา', 'ใต้ทราย'],
    hint: 'หาคำว่า "คลาน"',
  },
  {
    d: 4,
    prompt: 'อ่านแล้วตอบคำถาม: เรื่องนี้สอนให้เป็นคนอย่างไร?',
    visual: { kind: 'passage', text: 'ภูผาเก็บกระเป๋าสตางค์ได้ที่หน้าโรงเรียน ข้างในมีเงินและบัตรนักเรียนของพี่ชั้น ป.6 ภูผานำกระเป๋าไปให้คุณครู คุณครูชมว่าภูผาเป็นเด็กซื่อสัตย์' },
    answer: 'ซื่อสัตย์',
    distractors: ['ขยัน', 'ประหยัด', 'กล้าหาญ'],
    hint: 'คุณครูชมว่าอย่างไร',
  },
  {
    d: 4,
    prompt: 'อ่านแล้วตอบคำถาม: อะไรทำให้ลูกเต่าหลงทาง?',
    visual: { kind: 'passage', text: 'เต่าทะเลวางไข่บนชายหาดในเวลากลางคืน เมื่อลูกเต่าฟักออกจากไข่ พวกมันจะคลานลงสู่ทะเลทันที แสงไฟจากบ้านเรือนริมหาดอาจทำให้ลูกเต่าหลงทาง' },
    answer: 'แสงไฟจากบ้านเรือน',
    distractors: ['คลื่นลม', 'นกทะเล', 'ทรายร้อน'],
    hint: 'อ่านประโยคสุดท้าย',
  },
  {
    d: 5,
    prompt: 'อ่านแล้วตอบคำถาม: ถ้าอยากช่วยลูกเต่า คนที่อยู่ริมหาดควรทำอย่างไร?',
    visual: { kind: 'passage', text: 'เต่าทะเลวางไข่บนชายหาดในเวลากลางคืน เมื่อลูกเต่าฟักออกจากไข่ พวกมันจะคลานลงสู่ทะเลทันที แสงไฟจากบ้านเรือนริมหาดอาจทำให้ลูกเต่าหลงทาง' },
    answer: 'ปิดไฟที่ส่องไปทางชายหาดตอนกลางคืน',
    distractors: ['เปิดไฟให้สว่างขึ้น', 'จับลูกเต่าไปเลี้ยง', 'เก็บไข่เต่ากลับบ้าน'],
    hint: 'สาเหตุที่ลูกเต่าหลงทางคืออะไร',
  },
  {
    d: 5,
    prompt: 'อ่านแล้วตอบคำถาม: ข้อใดเป็น "ข้อเท็จจริง" จากเรื่อง?',
    visual: { kind: 'passage', text: 'วันอาทิตย์ ครอบครัวของมิวไปปิกนิกที่สวนสาธารณะ แม่เตรียมข้าวเหนียวไก่ทอด พ่อพาลูกบอลไปด้วย มิวกับน้องเล่นลูกบอลกันอย่างสนุกสนาน' },
    answer: 'พ่อพาลูกบอลไปด้วย',
    distractors: ['ปิกนิกเป็นสิ่งที่ดีที่สุด', 'ไก่ทอดของแม่อร่อยที่สุดในโลก', 'สวนสาธารณะสวยที่สุด'],
    hint: 'ข้อเท็จจริงคือสิ่งที่เกิดขึ้นจริงตามเรื่อง ไม่ใช่ความรู้สึก',
  },
];

export const READING_GENERATORS: Record<string, Generator> = {
  TH_CONSONANTS: consonants,
  TH_VOWELS: bankGenerator(VOWELS),
  TH_WORDS: bankGenerator(WORDS),
  TH_SPELLING: bankGenerator(SPELLING),
  TH_COMPREHENSION: bankGenerator(COMPREHENSION),
};
