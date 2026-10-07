import type { ActivityType, Grade, ItemSlot } from '../generated/prisma/enums.js';

/**
 * Math curriculum: Phase 1 — Math Foundation (K1 → P1), Phase 2 — Core Mathematics (P2 → P3)
 * and Phase 3 — Advanced Mathematics (P4 → P6), plus shapes, time, money, measurement and data.
 * Seeded into the database by prisma/seed.ts. Array order is the curriculum sort order and must stay topological.
 */

export interface SkillDef {
  code: string;
  /** branch of the skill tree within its subject, e.g. ADDITION, EN_VOCABULARY */
  group: string;
  name: string;
  nameTh: string;
  grade: Grade;
  prerequisites: string[];
}

export const MATH_SKILLS: SkillDef[] = [
  { code: 'NUM_RECOGNITION', group: 'NUMBER_SENSE', name: 'Number Recognition', nameTh: 'รู้จักตัวเลข', grade: 'K1', prerequisites: [] },
  { code: 'COUNTING', group: 'NUMBER_SENSE', name: 'Counting', nameTh: 'การนับ', grade: 'K1', prerequisites: ['NUM_RECOGNITION'] },
  { code: 'SHAPES_BASIC', group: 'GEOMETRY', name: 'Basic Shapes', nameTh: 'รู้จักรูปทรง', grade: 'K1', prerequisites: [] },
  { code: 'QUANTITY', group: 'NUMBER_SENSE', name: 'Quantity', nameTh: 'มากกว่า น้อยกว่า', grade: 'K2', prerequisites: ['COUNTING'] },
  { code: 'ADD_SINGLE', group: 'ADDITION', name: 'Addition: Single Digit', nameTh: 'บวกเลขหลักเดียว', grade: 'K3', prerequisites: ['COUNTING'] },
  { code: 'COMPARING', group: 'NUMBER_SENSE', name: 'Comparing Numbers', nameTh: 'เปรียบเทียบจำนวน', grade: 'K3', prerequisites: ['QUANTITY'] },
  { code: 'SUB_SINGLE', group: 'SUBTRACTION', name: 'Subtraction: Single Digit', nameTh: 'ลบเลขหลักเดียว', grade: 'K3', prerequisites: ['ADD_SINGLE'] },
  { code: 'PLACE_VALUE', group: 'NUMBER_SENSE', name: 'Place Value', nameTh: 'หลักและค่าประจำหลัก', grade: 'P1', prerequisites: ['COMPARING'] },
  { code: 'ADD_DOUBLE', group: 'ADDITION', name: 'Addition: Double Digit', nameTh: 'บวกเลขสองหลัก', grade: 'P1', prerequisites: ['ADD_SINGLE', 'PLACE_VALUE'] },
  { code: 'SUB_DOUBLE', group: 'SUBTRACTION', name: 'Subtraction: Double Digit', nameTh: 'ลบเลขสองหลัก', grade: 'P1', prerequisites: ['SUB_SINGLE', 'PLACE_VALUE'] },
  { code: 'ADD_CARRY', group: 'ADDITION', name: 'Addition: Carrying', nameTh: 'บวกแบบมีทด', grade: 'P1', prerequisites: ['ADD_DOUBLE'] },
  { code: 'SUB_BORROW', group: 'SUBTRACTION', name: 'Subtraction: Borrowing', nameTh: 'ลบแบบมีกระจาย', grade: 'P1', prerequisites: ['SUB_DOUBLE'] },
  { code: 'TIME_CLOCK', group: 'MEASUREMENT', name: 'Telling Time', nameTh: 'การดูเวลา', grade: 'P1', prerequisites: ['COUNTING'] },
  { code: 'MONEY_THAI', group: 'MEASUREMENT', name: 'Thai Money', nameTh: 'เงินไทยและเงินทอน', grade: 'P1', prerequisites: ['ADD_SINGLE'] },
  // ── Phase 2 ──
  { code: 'MULT_CONCEPT', group: 'MULTIPLICATION', name: 'Multiplication: Concept', nameTh: 'ความหมายของการคูณ', grade: 'P2', prerequisites: ['ADD_SINGLE'] },
  { code: 'WORD_ADD_SUB', group: 'PROBLEM_SOLVING', name: 'Word Problems: + −', nameTh: 'โจทย์ปัญหาการบวกลบ', grade: 'P2', prerequisites: ['ADD_DOUBLE', 'SUB_DOUBLE', 'MONEY_THAI'] },
  { code: 'MULT_TABLES_2_5', group: 'MULTIPLICATION', name: 'Times Tables ×2–5', nameTh: 'สูตรคูณแม่ 2–5', grade: 'P2', prerequisites: ['MULT_CONCEPT'] },
  { code: 'DIV_CONCEPT', group: 'DIVISION', name: 'Division: Concept', nameTh: 'ความหมายของการหาร', grade: 'P2', prerequisites: ['MULT_CONCEPT', 'SUB_SINGLE'] },
  { code: 'MEASURE_LENGTH', group: 'MEASUREMENT', name: 'Length', nameTh: 'การวัดความยาว', grade: 'P2', prerequisites: ['ADD_DOUBLE', 'TIME_CLOCK'] },
  { code: 'MULT_TABLES_6_10', group: 'MULTIPLICATION', name: 'Times Tables ×6–10', nameTh: 'สูตรคูณแม่ 6–10', grade: 'P3', prerequisites: ['MULT_TABLES_2_5'] },
  { code: 'DIV_BASIC', group: 'DIVISION', name: 'Basic Division', nameTh: 'การหารพื้นฐาน', grade: 'P3', prerequisites: ['DIV_CONCEPT', 'MULT_TABLES_2_5'] },
  { code: 'FRAC_CONCEPT', group: 'FRACTIONS', name: 'Fractions: Concept', nameTh: 'รู้จักเศษส่วน', grade: 'P3', prerequisites: ['DIV_CONCEPT'] },
  { code: 'FRAC_COMPARE', group: 'FRACTIONS', name: 'Comparing Fractions', nameTh: 'เปรียบเทียบเศษส่วน', grade: 'P3', prerequisites: ['FRAC_CONCEPT', 'COMPARING'] },
  { code: 'MULT_MULTI_DIGIT', group: 'MULTIPLICATION', name: 'Multi-digit Multiplication', nameTh: 'คูณเลขหลายหลัก', grade: 'P3', prerequisites: ['MULT_TABLES_6_10', 'ADD_CARRY'] },
  { code: 'WORD_MULT_DIV', group: 'PROBLEM_SOLVING', name: 'Word Problems: × ÷', nameTh: 'โจทย์ปัญหาการคูณหาร', grade: 'P3', prerequisites: ['MULT_TABLES_2_5', 'DIV_BASIC'] },
  { code: 'MEASURE_WEIGHT_VOLUME', group: 'MEASUREMENT', name: 'Weight & Volume', nameTh: 'น้ำหนักและปริมาตร', grade: 'P3', prerequisites: ['MEASURE_LENGTH'] },
  { code: 'DATA_GRAPH', group: 'DATA', name: 'Pictographs', nameTh: 'การอ่านแผนภูมิ', grade: 'P3', prerequisites: ['COMPARING', 'ADD_DOUBLE'] },
  // ── Phase 3 ──
  { code: 'GEO_SHAPES', group: 'GEOMETRY', name: 'Shapes & Angles', nameTh: 'รูปเรขาคณิตและมุม', grade: 'P4', prerequisites: ['COMPARING', 'SHAPES_BASIC'] },
  { code: 'DEC_CONCEPT', group: 'DECIMALS', name: 'Decimals: Concept', nameTh: 'รู้จักทศนิยม', grade: 'P4', prerequisites: ['FRAC_CONCEPT', 'PLACE_VALUE', 'MEASURE_WEIGHT_VOLUME'] },
  { code: 'FRAC_ADD_SUB', group: 'FRACTIONS', name: 'Adding & Subtracting Fractions', nameTh: 'บวกลบเศษส่วน', grade: 'P4', prerequisites: ['FRAC_COMPARE'] },
  { code: 'GEO_PERIMETER_AREA', group: 'GEOMETRY', name: 'Perimeter & Area', nameTh: 'ความยาวรอบรูปและพื้นที่', grade: 'P4', prerequisites: ['GEO_SHAPES', 'MULT_TABLES_6_10', 'MEASURE_LENGTH'] },
  { code: 'DEC_COMPARE', group: 'DECIMALS', name: 'Comparing Decimals', nameTh: 'เปรียบเทียบทศนิยม', grade: 'P4', prerequisites: ['DEC_CONCEPT', 'DATA_GRAPH'] },
  { code: 'DEC_ADD_SUB', group: 'DECIMALS', name: 'Adding & Subtracting Decimals', nameTh: 'บวกลบทศนิยม', grade: 'P5', prerequisites: ['DEC_CONCEPT', 'ADD_CARRY', 'SUB_BORROW'] },
  { code: 'GEO_ANGLES', group: 'GEOMETRY', name: 'Angle Facts', nameTh: 'การหาขนาดของมุม', grade: 'P5', prerequisites: ['GEO_SHAPES', 'SUB_BORROW'] },
  { code: 'ALG_EQUATIONS', group: 'ALGEBRA', name: 'Simple Equations', nameTh: 'สมการอย่างง่าย', grade: 'P5', prerequisites: ['WORD_MULT_DIV'] },
  { code: 'PERCENT_CONCEPT', group: 'PERCENTAGE', name: 'Percentage: Concept', nameTh: 'รู้จักร้อยละ', grade: 'P5', prerequisites: ['DEC_CONCEPT'] },
  { code: 'PERCENT_OF', group: 'PERCENTAGE', name: 'Percent of a Number', nameTh: 'ร้อยละของจำนวน', grade: 'P6', prerequisites: ['PERCENT_CONCEPT', 'MULT_MULTI_DIGIT'] },
  { code: 'RATIO_CONCEPT', group: 'RATIO', name: 'Ratio: Concept', nameTh: 'อัตราส่วน', grade: 'P6', prerequisites: ['MULT_TABLES_6_10', 'DIV_BASIC'] },
  { code: 'RATIO_PROPORTION', group: 'RATIO', name: 'Proportion', nameTh: 'สัดส่วนและมาตราส่วน', grade: 'P6', prerequisites: ['RATIO_CONCEPT', 'WORD_MULT_DIV', 'TIME_CLOCK'] },
  { code: 'ALG_PATTERNS', group: 'ALGEBRA', name: 'Patterns & Expressions', nameTh: 'แบบรูปและนิพจน์', grade: 'P6', prerequisites: ['ALG_EQUATIONS'] },
  { code: 'PS_MULTI_STEP', group: 'PROBLEM_SOLVING', name: 'Multi-step Problems', nameTh: 'โจทย์ปัญหาหลายขั้นตอน', grade: 'P6', prerequisites: ['PERCENT_OF', 'RATIO_PROPORTION', 'DEC_ADD_SUB', 'MEASURE_WEIGHT_VOLUME', 'DATA_GRAPH'] },
];

/** Where placement starts probing for each grade (falls back to the closest earlier skill). */
export const PLACEMENT_START: Partial<Record<Grade, string>> = {
  K1: 'NUM_RECOGNITION',
  K2: 'COUNTING',
  K3: 'ADD_SINGLE',
  P1: 'SUB_SINGLE',
  P2: 'ADD_DOUBLE',
  P3: 'MULT_CONCEPT',
  P4: 'MULT_TABLES_6_10',
  P5: 'FRAC_CONCEPT',
  P6: 'DEC_CONCEPT',
};

export interface StageDef {
  skill: string;
  name: string;
  activity: ActivityType;
  difficulty: number;
  questionCount?: number;
}

/** Every world ends in a boss that mixes all the world's skills. */
export interface BossDef {
  name: string;
  emoji: string;
  difficulty: number;
}

export interface WorldDef {
  code: string;
  name: string;
  nameTh: string;
  emoji: string;
  theme: string;
  stages: StageDef[];
  boss: BossDef;
}

export const MATH_WORLDS: WorldDef[] = [
  {
    code: 'COUNTING_FOREST',
    name: 'Counting Forest',
    nameTh: 'ป่าแห่งการนับ',
    emoji: '🌳',
    theme: 'forest',
    stages: [
      { skill: 'NUM_RECOGNITION', name: 'ป้ายเลขในป่า', activity: 'TARGET', difficulty: 1 },
      { skill: 'NUM_RECOGNITION', name: 'เลขไทยซ่อนหา', activity: 'TARGET', difficulty: 3 },
      { skill: 'COUNTING', name: 'นับผลไม้', activity: 'FISHING', difficulty: 1 },
      { skill: 'COUNTING', name: 'นับสัตว์ในป่า', activity: 'FISHING', difficulty: 3 },
      { skill: 'QUANTITY', name: 'กองไหนเยอะกว่า', activity: 'BUILDING', difficulty: 2 },
    ],
    boss: { name: 'หมีจอมนับ', emoji: '🐻', difficulty: 2 },
  },
  {
    code: 'NUMBER_VILLAGE',
    name: 'Number Village',
    nameTh: 'หมู่บ้านตัวเลข',
    emoji: '🏘️',
    theme: 'village',
    stages: [
      { skill: 'COMPARING', name: 'ตลาดเปรียบเทียบ', activity: 'TRAIN', difficulty: 1 },
      { skill: 'COMPARING', name: 'ปากจระเข้', activity: 'TRAIN', difficulty: 3 },
      { skill: 'PLACE_VALUE', name: 'บ้านหลักสิบ', activity: 'BUILDING', difficulty: 1 },
      { skill: 'PLACE_VALUE', name: 'สร้างตัวเลข', activity: 'BUILDING', difficulty: 3 },
    ],
    boss: { name: 'กอริลลาตัวเลข', emoji: '🦍', difficulty: 2 },
  },
  {
    code: 'SHAPE_FAIR',
    name: 'Shape & Clock Fair',
    nameTh: 'สวนสนุกรูปทรงและนาฬิกา',
    emoji: '🎡',
    theme: 'funfair',
    stages: [
      { skill: 'SHAPES_BASIC', name: 'ม้าหมุนรูปทรง', activity: 'TARGET', difficulty: 1 },
      { skill: 'SHAPES_BASIC', name: 'นับมุมชิงรางวัล', activity: 'PUZZLE', difficulty: 3 },
      { skill: 'SHAPES_BASIC', name: 'รูปทรงรอบตัว', activity: 'FISHING', difficulty: 4 },
      { skill: 'TIME_CLOCK', name: 'รถไฟตรงเวลา', activity: 'TRAIN', difficulty: 1 },
      { skill: 'TIME_CLOCK', name: 'ครึ่งชั่วโมงหรรษา', activity: 'RACING', difficulty: 2 },
      { skill: 'TIME_CLOCK', name: 'นาฬิกาทีละ 5 นาที', activity: 'MAGIC', difficulty: 4 },
      { skill: 'TIME_CLOCK', name: 'อีกกี่นาทีถึงเวลา', activity: 'TRAIN', difficulty: 5 },
    ],
    boss: { name: 'ตัวตลกนาฬิกาปลุก', emoji: '🤡', difficulty: 2 },
  },
  {
    code: 'ADDITION_CASTLE',
    name: 'Addition Castle',
    nameTh: 'ปราสาทการบวก',
    emoji: '🏰',
    theme: 'castle',
    stages: [
      { skill: 'ADD_SINGLE', name: 'ประตูปราสาท', activity: 'BUILDING', difficulty: 1 },
      { skill: 'ADD_SINGLE', name: 'หอคอยเลขบวก', activity: 'BUILDING', difficulty: 3 },
      { skill: 'ADD_DOUBLE', name: 'สะพานสองหลัก', activity: 'RACING', difficulty: 2 },
      { skill: 'ADD_CARRY', name: 'ห้องลับทดเลข', activity: 'RACING', difficulty: 2 },
    ],
    boss: { name: 'มังกรแห่งการบวก', emoji: '🐲', difficulty: 2 },
  },
  {
    code: 'SUBTRACTION_DESERT',
    name: 'Subtraction Desert',
    nameTh: 'ทะเลทรายการลบ',
    emoji: '🏜️',
    theme: 'desert',
    stages: [
      { skill: 'SUB_SINGLE', name: 'โอเอซิสแรก', activity: 'FISHING', difficulty: 1 },
      { skill: 'SUB_SINGLE', name: 'พายุทราย', activity: 'FISHING', difficulty: 3 },
      { skill: 'SUB_DOUBLE', name: 'กองคาราวาน', activity: 'TRAIN', difficulty: 2 },
      { skill: 'SUB_BORROW', name: 'ปิรามิดกระจายเลข', activity: 'TRAIN', difficulty: 2 },
    ],
    boss: { name: 'แมงป่องทะเลทราย', emoji: '🦂', difficulty: 2 },
  },
  {
    code: 'MARKET_TOWN',
    name: 'Measure Market',
    nameTh: 'ตลาดนัดนักวัด',
    emoji: '🏪',
    theme: 'market',
    stages: [
      { skill: 'MONEY_THAI', name: 'นับเหรียญในกระปุก', activity: 'SHOP', difficulty: 1 },
      { skill: 'MONEY_THAI', name: 'ธนบัตรและเหรียญ', activity: 'SHOP', difficulty: 3 },
      { skill: 'MONEY_THAI', name: 'แม่ค้าทอนเงิน', activity: 'SHOP', difficulty: 4 },
      { skill: 'MEASURE_LENGTH', name: 'ไม้บรรทัดวิเศษ', activity: 'BUILDING', difficulty: 1 },
      { skill: 'MEASURE_LENGTH', name: 'เมตรกับเซนติเมตร', activity: 'RACING', difficulty: 3 },
      { skill: 'MEASURE_WEIGHT_VOLUME', name: 'ตาชั่งร้านผลไม้', activity: 'MAGIC', difficulty: 2 },
      { skill: 'MEASURE_WEIGHT_VOLUME', name: 'ร้านน้ำผลไม้', activity: 'FISHING', difficulty: 4 },
      { skill: 'DATA_GRAPH', name: 'แผนภูมิของขายดี', activity: 'PUZZLE', difficulty: 2 },
      { skill: 'DATA_GRAPH', name: 'นักสำรวจข้อมูล', activity: 'TARGET', difficulty: 4 },
    ],
    boss: { name: 'หมึกยักษ์นักต่อราคา', emoji: '🐙', difficulty: 3 },
  },
  {
    code: 'BLOCK_MINE',
    name: 'Block Mine',
    nameTh: 'เหมืองบล็อกนักขุด',
    emoji: '⛏️',
    theme: 'mine',
    stages: [
      { skill: 'ADD_SINGLE', name: 'ขุดหินก้อนแรก', activity: 'MINING', difficulty: 2 },
      { skill: 'SUB_SINGLE', name: 'ถ้ำลบเลข', activity: 'MINING', difficulty: 2 },
      { skill: 'ADD_DOUBLE', name: 'สร้างบ้านไม้หลังแรก', activity: 'BUILDING', difficulty: 2 },
      { skill: 'SUB_DOUBLE', name: 'อุโมงค์ใต้ดิน', activity: 'MINING', difficulty: 2 },
      { skill: 'ADD_CARRY', name: 'แร่เหล็กมีทด', activity: 'MINING', difficulty: 3 },
      { skill: 'SUB_BORROW', name: 'เพชรในหินแข็ง', activity: 'MINING', difficulty: 3 },
      { skill: 'MONEY_THAI', name: 'ตลาดแลกแร่', activity: 'SHOP', difficulty: 2 },
    ],
    boss: { name: 'แมงมุมถ้ำมืด', emoji: '🕷️', difficulty: 3 },
  },
  {
    code: 'MULTIPLICATION_VOLCANO',
    name: 'Multiplication Volcano',
    nameTh: 'ภูเขาไฟการคูณ',
    emoji: '🌋',
    theme: 'volcano',
    stages: [
      { skill: 'MULT_CONCEPT', name: 'ก้อนหินเรียงแถว', activity: 'BUILDING', difficulty: 1 },
      { skill: 'MULT_CONCEPT', name: 'ปริศนาลาวา', activity: 'PUZZLE', difficulty: 3 },
      { skill: 'MULT_TABLES_2_5', name: 'ยิงอุกกาบาต', activity: 'TARGET', difficulty: 1 },
      { skill: 'MULT_TABLES_2_5', name: 'แข่งรถหนีลาวา', activity: 'RACING', difficulty: 3 },
      { skill: 'MULT_TABLES_6_10', name: 'หม้อยาวิเศษ', activity: 'MAGIC', difficulty: 2 },
      { skill: 'MULT_TABLES_6_10', name: 'ทางด่วนภูเขาไฟ', activity: 'RACING', difficulty: 4 },
      { skill: 'MULT_MULTI_DIGIT', name: 'สร้างสะพานหิน', activity: 'BUILDING', difficulty: 2 },
    ],
    boss: { name: 'ไดโนเสาร์ลาวา', emoji: '🦖', difficulty: 3 },
  },
  {
    code: 'DIVISION_OCEAN',
    name: 'Division Ocean',
    nameTh: 'มหาสมุทรการหาร',
    emoji: '🌊',
    theme: 'ocean',
    stages: [
      { skill: 'DIV_CONCEPT', name: 'แบ่งปลาให้แมวน้ำ', activity: 'FISHING', difficulty: 1 },
      { skill: 'DIV_CONCEPT', name: 'จัดกลุ่มเปลือกหอย', activity: 'FISHING', difficulty: 3 },
      { skill: 'DIV_BASIC', name: 'รถไฟใต้ทะเล', activity: 'TRAIN', difficulty: 1 },
      { skill: 'DIV_BASIC', name: 'คาถาฟองสบู่', activity: 'MAGIC', difficulty: 3 },
    ],
    boss: { name: 'หมึกยักษ์แห่งการหาร', emoji: '🐙', difficulty: 3 },
  },
  {
    code: 'FRACTION_MOON',
    name: 'Fraction Moon',
    nameTh: 'ดวงจันทร์เศษส่วน',
    emoji: '🌙',
    theme: 'moon',
    stages: [
      { skill: 'FRAC_CONCEPT', name: 'พิซซ่าบนดวงจันทร์', activity: 'PUZZLE', difficulty: 1 },
      { skill: 'FRAC_CONCEPT', name: 'ต่อภาพจันทร์เสี้ยว', activity: 'PUZZLE', difficulty: 3 },
      { skill: 'FRAC_COMPARE', name: 'ยิงดาวเศษส่วน', activity: 'TARGET', difficulty: 1 },
      { skill: 'FRAC_COMPARE', name: 'เวทมนตร์เท่ากัน', activity: 'MAGIC', difficulty: 4 },
    ],
    boss: { name: 'จอมเวทจันทรา', emoji: '🧙', difficulty: 3 },
  },
  {
    code: 'MATH_SPACE',
    name: 'Math Space',
    nameTh: 'อวกาศนักแก้ปัญหา',
    emoji: '🚀',
    theme: 'space',
    stages: [
      { skill: 'WORD_ADD_SUB', name: 'ร้านค้าสถานีอวกาศ', activity: 'SHOP', difficulty: 1 },
      { skill: 'WORD_ADD_SUB', name: 'ภารกิจขนเสบียง', activity: 'TRAIN', difficulty: 3 },
      { skill: 'WORD_MULT_DIV', name: 'ตลาดดาวอังคาร', activity: 'SHOP', difficulty: 1 },
      { skill: 'WORD_MULT_DIV', name: 'ทอนเงินมนุษย์ต่างดาว', activity: 'SHOP', difficulty: 5 },
    ],
    boss: { name: 'เอเลี่ยนนักไขปริศนา', emoji: '👾', difficulty: 3 },
  },  // ── Phase 3 ──
  {
    code: 'DECIMAL_ISLAND',
    name: 'Decimal Island',
    nameTh: 'เกาะทศนิยม',
    emoji: '🏝️',
    theme: 'island',
    stages: [
      { skill: 'DEC_CONCEPT', name: 'ตารางร้อยช่องบนชายหาด', activity: 'PUZZLE', difficulty: 1 },
      { skill: 'DEC_CONCEPT', name: 'ค่าประจำหลักใต้ทะเล', activity: 'FISHING', difficulty: 4 },
      { skill: 'DEC_COMPARE', name: 'แข่งเรือทศนิยม', activity: 'RACING', difficulty: 2 },
      { skill: 'DEC_COMPARE', name: 'เรียงเปลือกหอย', activity: 'TRAIN', difficulty: 5 },
      { skill: 'DEC_ADD_SUB', name: 'ตลาดริมหาด', activity: 'SHOP', difficulty: 2 },
      { skill: 'DEC_ADD_SUB', name: 'เงินทอนนักท่องเที่ยว', activity: 'SHOP', difficulty: 5 },
      { skill: 'FRAC_ADD_SUB', name: 'แบ่งมะพร้าว', activity: 'MAGIC', difficulty: 1 },
      { skill: 'FRAC_ADD_SUB', name: 'เศษส่วนอย่างต่ำ', activity: 'PUZZLE', difficulty: 4 },
    ],
    boss: { name: 'ฉลามทศนิยม', emoji: '🦈', difficulty: 3 },
  },
  {
    code: 'PERCENT_CITY',
    name: 'Percent City',
    nameTh: 'เมืองร้อยละและอัตราส่วน',
    emoji: '🏙️',
    theme: 'city',
    stages: [
      { skill: 'PERCENT_CONCEPT', name: 'ป้ายไฟร้อยช่อง', activity: 'TARGET', difficulty: 1 },
      { skill: 'PERCENT_CONCEPT', name: 'แปลงร่างเป็นเปอร์เซ็นต์', activity: 'MAGIC', difficulty: 3 },
      { skill: 'PERCENT_OF', name: 'ห้างลดราคา', activity: 'SHOP', difficulty: 2 },
      { skill: 'PERCENT_OF', name: 'นักช้อปเลือกของถูก', activity: 'SHOP', difficulty: 4 },
      { skill: 'RATIO_CONCEPT', name: 'สวนสัตว์อัตราส่วน', activity: 'BUILDING', difficulty: 1 },
      { skill: 'RATIO_CONCEPT', name: 'อัตราส่วนเท่ากัน', activity: 'PUZZLE', difficulty: 4 },
      { skill: 'RATIO_PROPORTION', name: 'ร้านเบเกอรี่', activity: 'MAGIC', difficulty: 2 },
      { skill: 'RATIO_PROPORTION', name: 'แผนที่เมือง', activity: 'TRAIN', difficulty: 4 },
    ],
    boss: { name: 'หุ่นยนต์ร้อยละ', emoji: '🤖', difficulty: 3 },
  },
  {
    code: 'GEOMETRY_CANYON',
    name: 'Geometry Canyon',
    nameTh: 'หุบเขาเรขาคณิต',
    emoji: '⛰️',
    theme: 'canyon',
    stages: [
      { skill: 'GEO_SHAPES', name: 'นับด้านก้อนหิน', activity: 'TARGET', difficulty: 1 },
      { skill: 'GEO_SHAPES', name: 'มุมแหลม มุมฉาก มุมป้าน', activity: 'TARGET', difficulty: 3 },
      { skill: 'GEO_PERIMETER_AREA', name: 'ล้อมรั้วฟาร์ม', activity: 'BUILDING', difficulty: 1 },
      { skill: 'GEO_PERIMETER_AREA', name: 'ปูพื้นห้องลับ', activity: 'BUILDING', difficulty: 3 },
      { skill: 'GEO_ANGLES', name: 'สะพานมุมตรง', activity: 'RACING', difficulty: 2 },
      { skill: 'GEO_ANGLES', name: 'ภูเขาสามเหลี่ยม', activity: 'PUZZLE', difficulty: 3 },
    ],
    boss: { name: 'ยักษ์หินเรขาคณิต', emoji: '🗿', difficulty: 3 },
  },
  {
    code: 'ALGEBRA_GALAXY',
    name: 'Algebra Galaxy',
    nameTh: 'กาแล็กซีพีชคณิต',
    emoji: '🌌',
    theme: 'galaxy',
    stages: [
      { skill: 'ALG_EQUATIONS', name: 'กล่องปริศนา □', activity: 'PUZZLE', difficulty: 1 },
      { skill: 'ALG_EQUATIONS', name: 'ตามหา x', activity: 'MAGIC', difficulty: 4 },
      { skill: 'ALG_PATTERNS', name: 'ดาวเรียงแถว', activity: 'TRAIN', difficulty: 1 },
      { skill: 'ALG_PATTERNS', name: 'พจน์ที่ซ่อนอยู่', activity: 'RACING', difficulty: 5 },
      { skill: 'PS_MULTI_STEP', name: 'ภารกิจสถานีอวกาศ', activity: 'SHOP', difficulty: 2 },
      { skill: 'PS_MULTI_STEP', name: 'ปริศนาสุดท้าย', activity: 'MAGIC', difficulty: 4 },
    ],
    boss: { name: 'ราชาต่างดาวพีชคณิต', emoji: '👽', difficulty: 3 },
  },
  {
    code: 'BLOCK_CRAFT',
    name: 'Builder Town',
    nameTh: 'เมืองนักสร้างบล็อก',
    emoji: '🏗️',
    theme: 'craft',
    stages: [
      { skill: 'MULT_TABLES_2_5', name: 'ขุดแร่เป็นแถว', activity: 'MINING', difficulty: 3 },
      { skill: 'MULT_TABLES_6_10', name: 'เหมืองสูตรคูณ', activity: 'MINING', difficulty: 3 },
      { skill: 'DIV_BASIC', name: 'แบ่งบล็อกให้เพื่อน', activity: 'BUILDING', difficulty: 3 },
      { skill: 'FRAC_CONCEPT', name: 'เค้กบล็อกแบ่งส่วน', activity: 'MINING', difficulty: 3 },
      { skill: 'GEO_PERIMETER_AREA', name: 'ล้อมรั้วฟาร์มแกะ', activity: 'BUILDING', difficulty: 2 },
      { skill: 'GEO_PERIMETER_AREA', name: 'ปูพื้นบ้านบล็อก', activity: 'BUILDING', difficulty: 4 },
      { skill: 'PERCENT_OF', name: 'ร้านค้าหมู่บ้าน', activity: 'SHOP', difficulty: 2 },
      { skill: 'PS_MULTI_STEP', name: 'ภารกิจสร้างเมือง', activity: 'MINING', difficulty: 3 },
    ],
    boss: { name: 'ซอมบี้จอมพังบ้าน', emoji: '🧟', difficulty: 4 },
  },
];


export interface ItemDef {
  code: string;
  name: string;
  slot: ItemSlot;
  emoji: string;
  /** coins; null = reward only */
  price: number | null;
  /** granted the first time this world's boss is defeated */
  rewardWorldCode?: string;
}

export const ITEMS: ItemDef[] = [
  { code: 'CAP', name: 'หมวกแก๊ป', slot: 'HAT', emoji: '🧢', price: 20 },
  { code: 'SUN_HAT', name: 'หมวกปีกกว้าง', slot: 'HAT', emoji: '👒', price: 30 },
  { code: 'TOP_HAT', name: 'หมวกนักมายากล', slot: 'HAT', emoji: '🎩', price: 40 },
  { code: 'GRAD_CAP', name: 'หมวกบัณฑิต', slot: 'HAT', emoji: '🎓', price: 60 },
  { code: 'TSHIRT', name: 'เสื้อยืด', slot: 'OUTFIT', emoji: '👕', price: 15 },
  { code: 'DRESS', name: 'ชุดกระโปรง', slot: 'OUTFIT', emoji: '👗', price: 30 },
  { code: 'GI', name: 'ชุดกังฟู', slot: 'OUTFIT', emoji: '🥋', price: 40 },
  { code: 'COAT', name: 'เสื้อโค้ทนักสำรวจ', slot: 'OUTFIT', emoji: '🧥', price: 50 },
  { code: 'TURTLE', name: 'เต่าน้อย', slot: 'PET', emoji: '🐢', price: 40 },
  { code: 'PUPPY', name: 'ลูกหมา', slot: 'PET', emoji: '🐶', price: 50 },
  { code: 'KITTEN', name: 'ลูกแมว', slot: 'PET', emoji: '🐱', price: 50 },
  { code: 'PARROT', name: 'นกแก้ว', slot: 'PET', emoji: '🦜', price: 60 },
  { code: 'SUNGLASSES', name: 'แว่นกันแดด', slot: 'ACCESSORY', emoji: '🕶️', price: 25 },
  { code: 'BACKPACK', name: 'กระเป๋าเป้', slot: 'ACCESSORY', emoji: '🎒', price: 25 },
  { code: 'WAND', name: 'ไม้กายสิทธิ์', slot: 'ACCESSORY', emoji: '🪄', price: 45 },
  { code: 'TELESCOPE', name: 'กล้องส่องดาว', slot: 'ACCESSORY', emoji: '🔭', price: 45 },
  // Block world gear
  { code: 'WOOD_AXE', name: 'ขวานนักตัดไม้', slot: 'ACCESSORY', emoji: '🪓', price: 40 },
  { code: 'TORCH', name: 'คบเพลิง', slot: 'ACCESSORY', emoji: '🔥', price: 30 },
  { code: 'MINER_HELMET', name: 'หมวกเหล็กนักขุด', slot: 'HAT', emoji: '🪖', price: 45 },
  { code: 'MINER_VEST', name: 'เสื้อกั๊กนักขุดแร่', slot: 'OUTFIT', emoji: '🦺', price: 50 },
  { code: 'FLUFFY_SHEEP', name: 'แกะขนปุย', slot: 'PET', emoji: '🐑', price: 55 },
  // Boss collectibles — one per world, cannot be bought
  { code: 'OWL', name: 'นกฮูกแห่งป่า', slot: 'PET', emoji: '🦉', price: null, rewardWorldCode: 'COUNTING_FOREST' },
  { code: 'BALLOON', name: 'ลูกโป่งหมู่บ้าน', slot: 'ACCESSORY', emoji: '🎈', price: null, rewardWorldCode: 'NUMBER_VILLAGE' },
  { code: 'CROWN', name: 'มงกุฎมังกร', slot: 'HAT', emoji: '👑', price: null, rewardWorldCode: 'ADDITION_CASTLE' },
  { code: 'CAMEL', name: 'อูฐทะเลทราย', slot: 'PET', emoji: '🐪', price: null, rewardWorldCode: 'SUBTRACTION_DESERT' },
  { code: 'BABY_DRAGON', name: 'มังกรน้อย', slot: 'PET', emoji: '🐉', price: null, rewardWorldCode: 'MULTIPLICATION_VOLCANO' },
  { code: 'WHALE', name: 'วาฬยิ้ม', slot: 'PET', emoji: '🐳', price: null, rewardWorldCode: 'DIVISION_OCEAN' },
  { code: 'MAGIC_STAR', name: 'ดาววิเศษ', slot: 'ACCESSORY', emoji: '🌟', price: null, rewardWorldCode: 'FRACTION_MOON' },
  { code: 'ROCKET', name: 'จรวดจิ๋ว', slot: 'ACCESSORY', emoji: '🚀', price: null, rewardWorldCode: 'MATH_SPACE' },
  { code: 'ALARM_CLOCK', name: 'นาฬิกาปลุกตัวจิ๋ว', slot: 'ACCESSORY', emoji: '⏰', price: null, rewardWorldCode: 'SHAPE_FAIR' },
  { code: 'PIGGY_BANK', name: 'กระปุกออมสิน', slot: 'ACCESSORY', emoji: '🐷', price: null, rewardWorldCode: 'MARKET_TOWN' },
  { code: 'GOLDEN_PICKAXE', name: 'ที่ขุดทองคำ', slot: 'ACCESSORY', emoji: '⛏️', price: null, rewardWorldCode: 'BLOCK_MINE' },
  { code: 'TREASURE_CHEST', name: 'หีบสมบัตินักสร้าง', slot: 'ACCESSORY', emoji: '🧰', price: null, rewardWorldCode: 'BLOCK_CRAFT' },
  // ── Phase 3 ──
  { code: 'HELMET', name: 'หมวกนักสำรวจ', slot: 'HAT', emoji: '⛑️', price: 70 },
  { code: 'HERO_SUIT', name: 'ชุดฮีโร่', slot: 'OUTFIT', emoji: '🦸', price: 90 },
  { code: 'HEDGEHOG', name: 'เม่นน้อย', slot: 'PET', emoji: '🦔', price: 80 },
  { code: 'GOGGLES', name: 'แว่นนักวิทย์', slot: 'ACCESSORY', emoji: '🥽', price: 60 },
  { code: 'DOLPHIN', name: 'โลมาแสนรู้', slot: 'PET', emoji: '🐬', price: null, rewardWorldCode: 'DECIMAL_ISLAND' },
  { code: 'DIAMOND', name: 'เพชรร้อยเปอร์เซ็นต์', slot: 'ACCESSORY', emoji: '💎', price: null, rewardWorldCode: 'PERCENT_CITY' },
  { code: 'GOLD_COMPASS', name: 'วงเวียนทองคำ', slot: 'ACCESSORY', emoji: '🧭', price: null, rewardWorldCode: 'GEOMETRY_CANYON' },
  { code: 'PLANET', name: 'ดาวเสาร์จิ๋ว', slot: 'ACCESSORY', emoji: '🪐', price: null, rewardWorldCode: 'ALGEBRA_GALAXY' },
];
