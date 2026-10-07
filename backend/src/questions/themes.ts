/**
 * Interest themes: the same skill presented in the world a child cares about.
 * "7 + 5" can be about meteors for one child and dinosaur eggs for another.
 */

export const THEMES = ['GENERAL', 'DINOSAUR', 'SPACE', 'ANIMALS', 'RACING', 'FANTASY', 'BLOCKS'] as const;
export type Theme = (typeof THEMES)[number];
export const INTEREST_THEMES = THEMES.filter((t) => t !== 'GENERAL') as Exclude<Theme, 'GENERAL'>[];

export interface Thing {
  emoji: string;
  name: string;
  unit: string;
}

export interface ThemePack {
  label: string;
  emoji: string;
  /** countable things with an emoji, used in pictures */
  things: Thing[];
  /** things for word problems (no picture needed) */
  goods: { name: string; unit: string }[];
  /** characters who appear in word problems */
  names: string[];
}

export const THEME_PACKS: Record<Theme, ThemePack> = {
  GENERAL: {
    label: 'ทั่วไป',
    emoji: '🌈',
    things: [
      { emoji: '🍎', name: 'แอปเปิล', unit: 'ลูก' },
      { emoji: '🐟', name: 'ปลา', unit: 'ตัว' },
      { emoji: '⭐', name: 'ดาว', unit: 'ดวง' },
      { emoji: '🐱', name: 'แมว', unit: 'ตัว' },
      { emoji: '🚗', name: 'รถ', unit: 'คัน' },
      { emoji: '🌸', name: 'ดอกไม้', unit: 'ดอก' },
      { emoji: '🦖', name: 'ไดโนเสาร์', unit: 'ตัว' },
      { emoji: '🎈', name: 'ลูกโป่ง', unit: 'ลูก' },
      { emoji: '🍪', name: 'คุกกี้', unit: 'ชิ้น' },
    ],
    goods: [
      { name: 'ส้ม', unit: 'ผล' },
      { name: 'ดินสอ', unit: 'แท่ง' },
      { name: 'สติกเกอร์', unit: 'แผ่น' },
      { name: 'ลูกแก้ว', unit: 'ลูก' },
      { name: 'หนังสือ', unit: 'เล่ม' },
      { name: 'คุกกี้', unit: 'ชิ้น' },
      { name: 'ดอกไม้', unit: 'ดอก' },
      { name: 'ยางลบ', unit: 'ก้อน' },
    ],
    names: ['ต้นกล้า', 'ใบเตย', 'ภูผา', 'มิว', 'ข้าวหอม', 'ปลื้ม', 'ก้อนเมฆ', 'น้ำใส'],
  },
  DINOSAUR: {
    label: 'ไดโนเสาร์',
    emoji: '🦖',
    things: [
      { emoji: '🦖', name: 'ทีเร็กซ์', unit: 'ตัว' },
      { emoji: '🦕', name: 'ไดโนเสาร์คอยาว', unit: 'ตัว' },
      { emoji: '🥚', name: 'ไข่ไดโนเสาร์', unit: 'ฟอง' },
      { emoji: '🦴', name: 'กระดูก', unit: 'ชิ้น' },
      { emoji: '🌋', name: 'ภูเขาไฟ', unit: 'ลูก' },
      { emoji: '🌿', name: 'ใบไม้', unit: 'ใบ' },
    ],
    goods: [
      { name: 'ไข่ไดโนเสาร์', unit: 'ฟอง' },
      { name: 'ฟอสซิล', unit: 'ชิ้น' },
      { name: 'กระดูกไดโนเสาร์', unit: 'ชิ้น' },
      { name: 'ใบเฟิร์น', unit: 'ใบ' },
    ],
    names: ['นักสำรวจต้นกล้า', 'ดร.ใบเตย', 'ทีเร็กซ์น้อย', 'ไดโนคอยาว'],
  },
  SPACE: {
    label: 'อวกาศ',
    emoji: '🚀',
    things: [
      { emoji: '🚀', name: 'จรวด', unit: 'ลำ' },
      { emoji: '🪐', name: 'ดาวเคราะห์', unit: 'ดวง' },
      { emoji: '⭐', name: 'ดาว', unit: 'ดวง' },
      { emoji: '☄️', name: 'ดาวตก', unit: 'ดวง' },
      { emoji: '🛸', name: 'ยูเอฟโอ', unit: 'ลำ' },
      { emoji: '👽', name: 'มนุษย์ต่างดาว', unit: 'ตน' },
    ],
    goods: [
      { name: 'หินดวงจันทร์', unit: 'ก้อน' },
      { name: 'เชื้อเพลิงจรวด', unit: 'ถัง' },
      { name: 'ดาวเทียม', unit: 'ดวง' },
      { name: 'อาหารอวกาศ', unit: 'ซอง' },
    ],
    names: ['กัปตันดารา', 'นักบินอวกาศภูผา', 'หุ่นยนต์บีบี', 'มนุษย์ต่างดาวโซโล'],
  },
  ANIMALS: {
    label: 'สัตว์น่ารัก',
    emoji: '🐱',
    things: [
      { emoji: '🐶', name: 'ลูกหมา', unit: 'ตัว' },
      { emoji: '🐱', name: 'ลูกแมว', unit: 'ตัว' },
      { emoji: '🐰', name: 'กระต่าย', unit: 'ตัว' },
      { emoji: '🐥', name: 'ลูกเจี๊ยบ', unit: 'ตัว' },
      { emoji: '🐠', name: 'ปลาทอง', unit: 'ตัว' },
      { emoji: '🥕', name: 'แครอท', unit: 'หัว' },
    ],
    goods: [
      { name: 'แครอท', unit: 'หัว' },
      { name: 'อาหารแมว', unit: 'ถุง' },
      { name: 'กระดูกขนม', unit: 'ชิ้น' },
      { name: 'เมล็ดทานตะวัน', unit: 'เมล็ด' },
    ],
    names: ['คุณหมอสัตว์มิว', 'เจ้าตูบ', 'แมวส้ม', 'กระต่ายปุยฝ้าย'],
  },
  RACING: {
    label: 'รถแข่ง',
    emoji: '🏎️',
    things: [
      { emoji: '🏎️', name: 'รถแข่ง', unit: 'คัน' },
      { emoji: '🏍️', name: 'มอเตอร์ไซค์', unit: 'คัน' },
      { emoji: '🚙', name: 'รถจี๊ป', unit: 'คัน' },
      { emoji: '🏁', name: 'ธงเส้นชัย', unit: 'ผืน' },
      { emoji: '🛞', name: 'ล้อรถ', unit: 'ล้อ' },
      { emoji: '🏆', name: 'ถ้วยรางวัล', unit: 'ใบ' },
    ],
    goods: [
      { name: 'ล้อรถ', unit: 'ล้อ' },
      { name: 'น้ำมัน', unit: 'แกลลอน' },
      { name: 'ถ้วยรางวัล', unit: 'ใบ' },
      { name: 'รถของเล่น', unit: 'คัน' },
    ],
    names: ['นักแข่งปลื้ม', 'ช่างเครื่องก้อนเมฆ', 'ทีมสายฟ้า', 'นักซิ่งข้าวหอม'],
  },
  FANTASY: {
    label: 'เวทมนตร์',
    emoji: '🧙',
    things: [
      { emoji: '🦄', name: 'ยูนิคอร์น', unit: 'ตัว' },
      { emoji: '🐉', name: 'มังกร', unit: 'ตัว' },
      { emoji: '💎', name: 'อัญมณี', unit: 'เม็ด' },
      { emoji: '🧪', name: 'ยาวิเศษ', unit: 'ขวด' },
      { emoji: '🏰', name: 'ปราสาท', unit: 'หลัง' },
      { emoji: '🪄', name: 'ไม้กายสิทธิ์', unit: 'อัน' },
    ],
    goods: [
      { name: 'ยาวิเศษ', unit: 'ขวด' },
      { name: 'อัญมณี', unit: 'เม็ด' },
      { name: 'หนังสือเวทมนตร์', unit: 'เล่ม' },
      { name: 'ขนนกฟีนิกซ์', unit: 'เส้น' },
    ],
    names: ['พ่อมดน้อยภูผา', 'เจ้าหญิงใบเตย', 'อัศวินต้นกล้า', 'นางฟ้าน้ำใส'],
  },
  BLOCKS: {
    label: 'โลกบล็อก',
    emoji: '⛏️',
    things: [
      { emoji: '💎', name: 'เพชร', unit: 'เม็ด' },
      { emoji: '🪵', name: 'ท่อนไม้', unit: 'ท่อน' },
      { emoji: '🧱', name: 'บล็อกอิฐ', unit: 'ก้อน' },
      { emoji: '🪨', name: 'ก้อนหิน', unit: 'ก้อน' },
      { emoji: '🐑', name: 'แกะ', unit: 'ตัว' },
      { emoji: '🍄', name: 'เห็ด', unit: 'ดอก' },
      { emoji: '🪓', name: 'ขวาน', unit: 'เล่ม' },
    ],
    goods: [
      { name: 'แร่เหล็ก', unit: 'ก้อน' },
      { name: 'ท่อนไม้', unit: 'ท่อน' },
      { name: 'คบเพลิง', unit: 'อัน' },
      { name: 'เพชร', unit: 'เม็ด' },
      { name: 'แอปเปิลทอง', unit: 'ลูก' },
      { name: 'บล็อกหิน', unit: 'ก้อน' },
    ],
    names: ['นักขุดภูผา', 'ช่างสร้างใบเตย', 'นักผจญภัยต้นกล้า', 'นักสำรวจถ้ำมิว'],
  },
};

export interface QuestionContext {
  theme: Theme;
}

export const DEFAULT_CONTEXT: QuestionContext = { theme: 'GENERAL' };

export function themePack(ctx: QuestionContext = DEFAULT_CONTEXT): ThemePack {
  return THEME_PACKS[ctx.theme] ?? THEME_PACKS.GENERAL;
}

export function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}
